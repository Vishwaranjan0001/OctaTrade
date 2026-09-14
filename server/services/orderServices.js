import { Holding } from "../models/Holding.js";
import { Order } from "../models/Order.js";
import { Wallet } from "../models/Wallet.js";
import { WalletTransaction } from "../models/WalletTransaction.js";
import { getMarketQuote } from "./marketDataServices.js";

/*
  Order placement and settlement.

  Money is handled exclusively in integer paise. The market quote arrives as a
  rupee float and is converted once, here, at the boundary.

  A note on atomicity: multi-document transactions require a MongoDB replica
  set, and this project runs against a standalone mongod. Writes are therefore
  sequenced so that the most damaging interleaving cannot occur — funds are
  reserved before a holding is touched, and a holding is reduced before a sale
  is credited. Moving to a replica set would let these be wrapped in a single
  session transaction without changing the call sites.
*/

/**
 * Records a wallet movement and returns the updated wallet.
 *
 * Purpose : every balance change must leave a ledger entry carrying the
 *           resulting balances, which is what the activity timeline reads.
 * Input   : wallet document, type (one of the WalletTransaction enum values),
 *           amountPaise (positive integer).
 * Output  : the created WalletTransaction document.
 */
async function recordWalletMovement(wallet, type, amountPaise) {
  return WalletTransaction.create({
    userId: wallet.userId,
    walletId: wallet._id,
    type: type,
    amountPaise: amountPaise,
    availableBalanceAfterPaise: wallet.availableBalancePaise,
    reservedBalanceAfterPaise: wallet.reservedBalancePaise
  });
}

/**
 * Creates a rejected order so the refusal is visible in the blotter.
 *
 * Purpose : a rejection is a real event the user needs to see and understand;
 *           silently failing the request would leave no record.
 * Input   : userId, symbol, side, quantity, requestedPricePaise, reason.
 * Output  : the persisted rejected Order.
 */
async function rejectOrder(details, reason) {
  return Order.create({
    userId: details.userId,
    symbol: details.symbol,
    side: details.side,
    quantity: details.quantity,
    requestedPricePaise: details.requestedPricePaise,
    status: "REJECTED",
    rejectionReason: reason
  });
}

/**
 * Applies a buy to the user's holding, recalculating the average cost.
 *
 * Purpose : repeat purchases must blend into a single weighted average cost,
 *           which is what the portfolio reports as the basis.
 * Input   : userId, symbol, quantity, pricePaise.
 * Output  : the updated or created Holding document.
 */
async function applyBuyToHolding(userId, symbol, quantity, pricePaise) {
  const holding = await Holding.findOne({
    userId: userId,
    symbol: symbol
  });

  if (!holding) {
    return Holding.create({
      userId: userId,
      symbol: symbol,
      quantity: quantity,
      averageBuyPricePaise: pricePaise
    });
  }

  const combinedQuantity = holding.quantity + quantity;

  // Weighted average of the existing basis and this purchase, rounded to the
  // nearest paisa so the stored value stays an integer.
  const combinedCost =
    holding.quantity * holding.averageBuyPricePaise + quantity * pricePaise;

  holding.quantity = combinedQuantity;
  holding.averageBuyPricePaise = Math.round(combinedCost / combinedQuantity);

  await holding.save();

  return holding;
}

/**
 * Places a market paper order and settles it.
 *
 * Purpose : the core write path of the product. Prices the order from the live
 *           market, validates it against the account's real wallet or holding,
 *           then moves the money and the shares, leaving a full audit trail.
 * Input   : userId, { symbol, side: "BUY" | "SELL", quantity: positive integer }
 * Output  : the persisted Order — FILLED on success, REJECTED with a reason if
 *           the account could not support it.
 * Throws  : when the market quote cannot be fetched, so the controller can
 *           answer 502 rather than recording a misleading rejection.
 */
export async function placeOrder(userId, { symbol, side, quantity }) {
  const quote = await getMarketQuote(symbol);

  if (!quote || typeof quote.price !== "number" || !Number.isFinite(quote.price) || quote.price <= 0) {
    throw new Error("Market quote unavailable for " + symbol);
  }

  // The single conversion point: rupee float -> integer paise.
  const requestedPricePaise = Math.round(quote.price * 100);
  const totalValuePaise = requestedPricePaise * quantity;

  const details = {
    userId: userId,
    symbol: symbol,
    side: side,
    quantity: quantity,
    requestedPricePaise: requestedPricePaise
  };

  const wallet = await Wallet.findOne({
    userId: userId
  });

  if (!wallet) {
    return rejectOrder(details, "No wallet is attached to this account");
  }

  if (side === "BUY") {
    if (wallet.availableBalancePaise < totalValuePaise) {
      return rejectOrder(
        details,
        "Insufficient available balance for this order"
      );
    }

    const order = await Order.create({
      ...details,
      status: "NEW"
    });

    // Reserve first: the funds are committed before anything else changes.
    wallet.availableBalancePaise -= totalValuePaise;
    wallet.reservedBalancePaise += totalValuePaise;
    await wallet.save();
    await recordWalletMovement(wallet, "RESERVE", totalValuePaise);

    // Settle: release the reservation as a debit and hand over the shares.
    wallet.reservedBalancePaise -= totalValuePaise;
    await wallet.save();
    await recordWalletMovement(wallet, "DEBIT", totalValuePaise);

    await applyBuyToHolding(userId, symbol, quantity, requestedPricePaise);

    order.executedPricePaise = requestedPricePaise;
    order.totalValuePaise = totalValuePaise;
    order.status = "FILLED";
    await order.save();

    return order;
  }

  // SELL
  const holding = await Holding.findOne({
    userId: userId,
    symbol: symbol
  });

  if (!holding || holding.quantity < quantity) {
    return rejectOrder(
      details,
      holding
        ? "Insufficient holding quantity for this order"
        : "No holding exists for this symbol"
    );
  }

  const order = await Order.create({
    ...details,
    status: "NEW"
  });

  // Reduce the holding before crediting, so shares can never be sold twice.
  holding.quantity -= quantity;

  if (holding.quantity === 0) {
    await holding.deleteOne();
  } else {
    await holding.save();
  }

  wallet.availableBalancePaise += totalValuePaise;
  await wallet.save();
  await recordWalletMovement(wallet, "CREDIT", totalValuePaise);

  order.executedPricePaise = requestedPricePaise;
  order.totalValuePaise = totalValuePaise;
  order.status = "FILLED";
  await order.save();

  return order;
}

/**
 * All orders for a user, newest first.
 * Input  : userId. Output: Array<Order>.
 */
export async function getOrdersByUserId(userId) {
  const orders = await Order.find({
    userId: userId
  }).sort({
    createdAt: -1
  });

  return orders;
}

/**
 * A single order belonging to this user.
 *
 * Purpose : scoping the lookup by userId as well as id means one account can
 *           never read another account's order by guessing an identifier.
 * Input   : userId, orderId.
 * Output  : the Order, or null when it does not exist or is not theirs.
 */
export async function getOrderById(userId, orderId) {
  try {
    const order = await Order.findOne({
      _id: orderId,
      userId: userId
    });

    return order;
  } catch (error) {
    // A malformed ObjectId is a "not found", not a server fault.
    return null;
  }
}
