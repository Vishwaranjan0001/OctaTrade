import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Wallet } from "../models/Wallet.js";
import { WalletTransaction } from "../models/WalletTransaction.js";
import { Holding } from "../models/Holding.js";
import { getMarketQuote } from "./marketDataServices.js";
import { enqueueOrder, chooseSchedule, removeQueuedOrder } from "../scheduler/scheduler.js";

// Runs work(session) as one MongoDB transaction: everything is saved, or nothing is.
async function inTransaction(work) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(() => work(session));
  } finally {
    await session.endSession();
  }
}

// Moves money between the available and reserved balances and writes a ledger row.
//   amountPaise > 0: RESERVE (available -> reserved)
//   amountPaise < 0: RELEASE (reserved -> available)
// Returns false if there is not enough money to move.
async function moveReservedMoney(userId, amountPaise, session) {
  let filter;

  if (amountPaise > 0) {
    filter = { userId: userId, availableBalancePaise: { $gte: amountPaise } };
  } else {
    filter = { userId: userId, reservedBalancePaise: { $gte: -amountPaise } };
  }

  const wallet = await Wallet.findOneAndUpdate(
    filter,
    {
      $inc: {
        availableBalancePaise: -amountPaise,
        reservedBalancePaise: amountPaise
      }
    },
    {
      returnDocument: "after",
      session: session
    }
  );

  if (!wallet) {
    return false;
  }

  let type = "RELEASE";

  if (amountPaise > 0) {
    type = "RESERVE";
  }

  await WalletTransaction.create(
    [
      {
        userId: userId,
        walletId: wallet._id,
        type: type,
        amountPaise: Math.abs(amountPaise),
        availableBalanceAfterPaise: wallet.availableBalancePaise,
        reservedBalanceAfterPaise: wallet.reservedBalancePaise
      }
    ],
    { session: session }
  );

  return true;
}

// Has the market reached this order's price? MARKET orders always run.
export function priceConditionMet(order, pricePaise) {
  if (order.orderType === "LIMIT" && order.side === "BUY") {
    return pricePaise <= order.limitPricePaise;
  }

  if (order.orderType === "LIMIT" && order.side === "SELL") {
    return pricePaise >= order.limitPricePaise;
  }

  if (order.orderType === "STOP_LOSS") {
    return pricePaise <= order.triggerPricePaise;
  }

  return true;
}

// Price not reached yet: the order waits as OPEN. The trigger watcher queues it again later.
async function markOrderOpen(order) {
  order.status = "OPEN";
  order.startedAt = null;
  order.workerId = null;
  await order.save();

  return {
    success: false,
    reason: "WAITING_FOR_PRICE",
    order: order
  };
}

// Cancels a PENDING or OPEN order and gives back any reserved money.
// Returns null if the order is not this user's, or is no longer PENDING or OPEN.
export async function cancelOrder(orderId, userId) {
  let order = null;

  await inTransaction(async (session) => {
    order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        userId: userId,
        status: { $in: ["PENDING", "OPEN"] }
      },
      {
        status: "CANCELLED",
        finishedAt: new Date()
      },
      {
        returnDocument: "after",
        session: session
      }
    );

    if (order && order.reservedAmountPaise > 0) {
      await moveReservedMoney(userId, -order.reservedAmountPaise, session);
      order.reservedAmountPaise = 0;
      await order.save({ session: session });
    }
  });

  if (order) {
    await removeQueuedOrder(order);
  }

  return order;
}

export async function submitOrder(
  userId,
  { symbol, side, quantity, idempotencyKey, orderType, limitPricePaise, triggerPricePaise }
) {
  if (idempotencyKey) {
    const existingOrder = await Order.findOne({
      userId: userId,
      idempotencyKey: idempotencyKey
    });

    if (existingOrder) {
      return {
        order: existingOrder,
        isDuplicate: true
      };
    }
  }

  const ordersWaiting = await Order.countDocuments({
    userId: userId,
    status: "PENDING"
  });

  const { schedulingPolicy, priority } = chooseSchedule({
    side: side,
    quantity: quantity,
    ordersWaiting: ordersWaiting
  });

  let order;

  try {
    order = await Order.create({
      userId: userId,
      symbol: symbol,
      side: side,
      quantity: quantity,
      priority: priority,
      idempotencyKey: idempotencyKey,
      schedulingPolicy: schedulingPolicy,
      orderType: orderType,
      limitPricePaise: limitPricePaise,
      triggerPricePaise: triggerPricePaise
    });
  } catch (error) {
    if (error.code === 11000 && idempotencyKey) {
      const existingOrder = await Order.findOne({
        userId: userId,
        idempotencyKey: idempotencyKey
      });

      return {
        order: existingOrder,
        isDuplicate: true
      };
    }

    throw error;
  }

  // LIMIT BUY: hold back limit price x quantity now, so the money is there when the price comes.
  if (orderType === "LIMIT" && side === "BUY") {
    const amountPaise = limitPricePaise * quantity;
    let reserved = false;

    await inTransaction(async (session) => {
      reserved = await moveReservedMoney(userId, amountPaise, session);

      if (reserved) {
        order.reservedAmountPaise = amountPaise;
        await order.save({ session: session });
      }
    });

    if (!reserved) {
      await rejectOrder(order, "INSUFFICIENT_FUNDS");

      return {
        order: order,
        isDuplicate: false
      };
    }
  }

  await enqueueOrder(order);

  return {
    order: order,
    isDuplicate: false
  };
}

// Marks the order REJECTED. A LIMIT BUY also gets its reserved money back.
export async function rejectOrder(order, reason) {
  const reservedPaise = order.reservedAmountPaise;

  // Do not reuse the session of an earlier, aborted transaction.
  order.$session(null);

  await inTransaction(async (session) => {
    if (reservedPaise > 0) {
      await moveReservedMoney(order.userId, -reservedPaise, session);
    }

    order.reservedAmountPaise = 0;
    order.status = "REJECTED";
    order.rejectionReason = reason;
    await order.save({ session: session });
  });

  return order;
}

export async function updateHoldingAfterBuy(
  userId,
  symbol,
  quantity,
  executionPricePaise,
  session
) {
  const holding = await Holding.findOne({
    userId: userId,
    symbol: symbol
  }).session(session);

  if (!holding) {
    const createdHoldings = await Holding.create(
      [
        {
          userId: userId,
          symbol: symbol,
          quantity: quantity,
          averageBuyPricePaise: executionPricePaise
        }
      ],
      { session: session }
    );

    return createdHoldings[0];
  }

  const existingValuePaise =
    holding.quantity * holding.averageBuyPricePaise;
  const purchasedValuePaise = quantity * executionPricePaise;
  const newQuantity = holding.quantity + quantity;

  holding.quantity = newQuantity;
  holding.averageBuyPricePaise = Math.round(
    (existingValuePaise + purchasedValuePaise) / newQuantity
  );

  await holding.save({ session: session });

  return holding;
}

export async function executeBuyOrder(order) {
  const userId = order.userId;
  const symbol = order.symbol;
  const quantity = order.quantity;

  let quote;

  try {
    quote = await getMarketQuote(symbol);
  } catch (error) {
    // A LIMIT order can wait for the next price check instead of failing.
    if (order.orderType !== "MARKET") {
      return markOrderOpen(order);
    }

    await rejectOrder(order, "QUOTE_UNAVAILABLE");

    return {
      success: false,
      reason: "QUOTE_UNAVAILABLE",
      order: order
    };
  }

  if (
    quote.currency !== "INR" ||
    !Number.isFinite(quote.price) ||
    quote.price <= 0
  ) {
    await rejectOrder(order, "INVALID_QUOTE");

    return {
      success: false,
      reason: "INVALID_QUOTE",
      order: order
    };
  }

  const executionPricePaise = Math.round(quote.price * 100);
  const totalAmountPaise = executionPricePaise * quantity;

  if (executionPricePaise < 1) {
    await rejectOrder(order, "INVALID_QUOTE");

    return {
      success: false,
      reason: "INVALID_QUOTE",
      order: order
    };
  }

  // LIMIT BUY above its limit price: wait.
  if (!priceConditionMet(order, executionPricePaise)) {
    return markOrderOpen(order);
  }

  const existingWallet = await Wallet.findOne({
    userId: userId
  });

  if (!existingWallet) {
    await rejectOrder(order, "WALLET_NOT_FOUND");

    return {
      success: false,
      reason: "WALLET_NOT_FOUND",
      order: order
    };
  }

  // A LIMIT BUY's reserved money counts too: it is given back just before paying.
  if (existingWallet.availableBalancePaise + order.reservedAmountPaise < totalAmountPaise) {
    await rejectOrder(order, "INSUFFICIENT_FUNDS");

    return {
      success: false,
      reason: "INSUFFICIENT_FUNDS",
      order: order
    };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // LIMIT BUY: first give the reserved money back, then pay like a market order.
    if (order.reservedAmountPaise > 0) {
      await moveReservedMoney(userId, -order.reservedAmountPaise, session);
    }

    const wallet = await Wallet.findOneAndUpdate(
      {
        _id: existingWallet._id,
        availableBalancePaise: {
          $gte: totalAmountPaise
        }
      },
      {
        $inc: {
          availableBalancePaise: -totalAmountPaise
        }
      },
      {
        returnDocument: "after",
        session: session
      }
    );

    if (!wallet) {
      await session.abortTransaction();
      await rejectOrder(order, "INSUFFICIENT_FUNDS");

      return {
        success: false,
        reason: "INSUFFICIENT_FUNDS",
        order: order
      };
    }

    await WalletTransaction.create(
      [
        {
          userId: userId,
          walletId: wallet._id,
          type: "DEBIT",
          amountPaise: totalAmountPaise,
          availableBalanceAfterPaise: wallet.availableBalancePaise,
          reservedBalanceAfterPaise: wallet.reservedBalancePaise
        }
      ],
      { session: session }
    );

    const holding = await updateHoldingAfterBuy(
      userId,
      symbol,
      quantity,
      executionPricePaise,
      session
    );

    order.status = "COMPLETED";
    order.executionPricePaise = executionPricePaise;
    order.totalAmountPaise = totalAmountPaise;
    order.reservedAmountPaise = 0;
    await order.save({ session: session });

    await session.commitTransaction();

    return {
      success: true,
      order: order,
      wallet: wallet,
      holding: holding
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    await rejectOrder(order, "EXECUTION_ERROR");
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function updateHoldingAfterSell(
  userId,
  symbol,
  quantity,
  session
) {
  const holding = await Holding.findOneAndUpdate(
    {
      userId: userId,
      symbol: symbol,
      quantity: {
        $gte: quantity
      }
    },
    {
      $inc: {
        quantity: -quantity
      }
    },
    {
      returnDocument: "after",
      session: session
    }
  );

  if (!holding) {
    const existingHolding = await Holding.findOne({
      userId: userId,
      symbol: symbol
    }).session(session);

    if (!existingHolding) {
      return {
        success: false,
        reason: "HOLDING_NOT_FOUND"
      };
    }

    return {
      success: false,
      reason: "INSUFFICIENT_HOLDING"
    };
  }

  if (holding.quantity === 0) {
    await Holding.deleteOne(
      {
        _id: holding._id,
        quantity: 0
      },
      { session: session }
    );

    return {
      success: true,
      holding: null,
      averageBuyPricePaise: holding.averageBuyPricePaise
    };
  }

  return {
    success: true,
    holding: holding,
    averageBuyPricePaise: holding.averageBuyPricePaise
  };
}

export async function executeSellOrder(order) {
  const userId = order.userId;
  const symbol = order.symbol;
  const quantity = order.quantity;

  let quote;

  try {
    quote = await getMarketQuote(symbol);
  } catch (error) {
    // A LIMIT or STOP_LOSS order can wait for the next price check instead of failing.
    if (order.orderType !== "MARKET") {
      return markOrderOpen(order);
    }

    await rejectOrder(order, "QUOTE_UNAVAILABLE");

    return {
      success: false,
      reason: "QUOTE_UNAVAILABLE",
      order: order
    };
  }

  if (
    quote.currency !== "INR" ||
    !Number.isFinite(quote.price) ||
    quote.price <= 0
  ) {
    await rejectOrder(order, "INVALID_QUOTE");

    return {
      success: false,
      reason: "INVALID_QUOTE",
      order: order
    };
  }

  const executionPricePaise = Math.round(
    quote.price * 100
  );

  if (executionPricePaise < 1) {
    await rejectOrder(order, "INVALID_QUOTE");

    return {
      success: false,
      reason: "INVALID_QUOTE",
      order: order
    };
  }

  // LIMIT SELL below its limit, or STOP_LOSS above its trigger: wait.
  if (!priceConditionMet(order, executionPricePaise)) {
    return markOrderOpen(order);
  }

  const totalAmountPaise =
    executionPricePaise * quantity;

  const existingWallet = await Wallet.findOne({
    userId: userId
  });

  if (!existingWallet) {
    await rejectOrder(order, "WALLET_NOT_FOUND");

    return {
      success: false,
      reason: "WALLET_NOT_FOUND",
      order: order
    };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const holdingResult = await updateHoldingAfterSell(
      userId,
      symbol,
      quantity,
      session
    );

    if (!holdingResult.success) {
      await session.abortTransaction();
      await rejectOrder(order, holdingResult.reason);

      return {
        success: false,
        reason: holdingResult.reason,
        order: order
      };
    }

    const wallet = await Wallet.findOneAndUpdate(
      {
        _id: existingWallet._id
      },
      {
        $inc: {
          availableBalancePaise: totalAmountPaise
        }
      },
      {
        returnDocument: "after",
        session: session
      }
    );

    if (!wallet) {
      throw new Error(
        "Wallet disappeared during SELL execution"
      );
    }

    await WalletTransaction.create(
      [
        {
          userId: userId,
          walletId: wallet._id,
          type: "CREDIT",
          amountPaise: totalAmountPaise,
          availableBalanceAfterPaise: wallet.availableBalancePaise,
          reservedBalanceAfterPaise: wallet.reservedBalancePaise
        }
      ],
      { session: session }
    );

    order.status = "COMPLETED";
    order.executionPricePaise = executionPricePaise;
    order.totalAmountPaise = totalAmountPaise;
    // Realized profit or loss: what the shares sold for minus what they cost.
    order.costBasisPaise = holdingResult.averageBuyPricePaise * quantity;
    order.realizedProfitLossPaise = totalAmountPaise - order.costBasisPaise;
    await order.save({ session: session });

    await session.commitTransaction();

    return {
      success: true,
      order: order,
      wallet: wallet,
      holding: holdingResult.holding
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    await rejectOrder(order, "EXECUTION_ERROR");
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function getOrdersByUserId(userId) {
  const orders = await Order.find({
    userId: userId
  }).sort({
    createdAt: -1
  });

  return orders;
}

export async function getOrderByIdForUser(
  orderId,
  userId
) {
  const order = await Order.findOne({
    _id: orderId,
    userId: userId
  });

  return order;
}