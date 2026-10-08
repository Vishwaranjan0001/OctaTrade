import { Order } from "../models/Order.js";
import { Wallet } from "../models/Wallet.js";
import { WalletTransaction } from "../models/WalletTransaction.js";
import { Holding } from "../models/Holding.js";
import { getMarketQuote } from "./marketDataServices.js";

export async function createOrder(userId, symbol, side, quantity) {
  const order = await Order.create({
    userId: userId,
    symbol: symbol,
    side: side,
    quantity: quantity
  });

  return order;
}

export async function rejectOrder(order) {
  order.status = "REJECTED";
  await order.save();

  return order;
}

export async function updateHoldingAfterBuy(
  userId,
  symbol,
  quantity,
  executionPricePaise
) {
  let holding = await Holding.findOne({
    userId: userId,
    symbol: symbol
  });

  if (!holding) {
    holding = await Holding.create({
      userId: userId,
      symbol: symbol,
      quantity: quantity,
      averageBuyPricePaise: executionPricePaise
    });

    return holding;
  }

  const existingValuePaise =
    holding.quantity * holding.averageBuyPricePaise;
  const purchasedValuePaise = quantity * executionPricePaise;
  const newQuantity = holding.quantity + quantity;

  holding.quantity = newQuantity;
  holding.averageBuyPricePaise = Math.round(
    (existingValuePaise + purchasedValuePaise) / newQuantity
  );

  await holding.save();

  return holding;
}

export async function executeBuyOrder(userId, symbol, quantity) {
  const order = await createOrder(userId, symbol, "BUY", quantity);

  let quote;

  try {
    quote = await getMarketQuote(symbol);
  } catch (error) {
    await rejectOrder(order);

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
    await rejectOrder(order);

    return {
      success: false,
      reason: "INVALID_QUOTE",
      order: order
    };
  }

  const executionPricePaise = Math.round(quote.price * 100);
  const totalAmountPaise = executionPricePaise * quantity;

  if (executionPricePaise < 1) {
    await rejectOrder(order);

    return {
      success: false,
      reason: "INVALID_QUOTE",
      order: order
    };
  }

  const existingWallet = await Wallet.findOne({
    userId: userId
  });

  if (!existingWallet) {
    await rejectOrder(order);

    return {
      success: false,
      reason: "WALLET_NOT_FOUND",
      order: order
    };
  }

  if (existingWallet.availableBalancePaise < totalAmountPaise) {
    await rejectOrder(order);

    return {
      success: false,
      reason: "INSUFFICIENT_FUNDS",
      order: order
    };
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
      new: true,
      runValidators: true
    }
  );

  if (!wallet) {
    await rejectOrder(order);

    return {
      success: false,
      reason: "INSUFFICIENT_FUNDS",
      order: order
    };
  }

  await WalletTransaction.create({
    userId: userId,
    walletId: wallet._id,
    type: "DEBIT",
    amountPaise: totalAmountPaise,
    availableBalanceAfterPaise: wallet.availableBalancePaise,
    reservedBalanceAfterPaise: wallet.reservedBalancePaise
  });

  const holding = await updateHoldingAfterBuy(
    userId,
    symbol,
    quantity,
    executionPricePaise
  );

  order.status = "COMPLETED";
  order.executionPricePaise = executionPricePaise;
  order.totalAmountPaise = totalAmountPaise;
  await order.save();

  return {
    success: true,
    order: order,
    wallet: wallet,
    holding: holding
  };
}

export async function updateHoldingAfterSell(
  userId,
  symbol,
  quantity
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
      returnDocument: "after"
    }
  );

  if (!holding) {
    const existingHolding = await Holding.findOne({
      userId: userId,
      symbol: symbol
    });

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
    await Holding.deleteOne({
      _id: holding._id,
      quantity: 0
    });

    return {
      success: true,
      holding: null
    };
  }

  return {
    success: true,
    holding: holding
  };
}

export async function executeSellOrder(
  userId,
  symbol,
  quantity
) {
  const order = await createOrder(
    userId,
    symbol,
    "SELL",
    quantity
  );

  let quote;

  try {
    quote = await getMarketQuote(symbol);
  } catch (error) {
    await rejectOrder(order);

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
    await rejectOrder(order);

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
    await rejectOrder(order);

    return {
      success: false,
      reason: "INVALID_QUOTE",
      order: order
    };
  }

  const totalAmountPaise =
    executionPricePaise * quantity;

  const existingWallet = await Wallet.findOne({
    userId: userId
  });

  if (!existingWallet) {
    await rejectOrder(order);

    return {
      success: false,
      reason: "WALLET_NOT_FOUND",
      order: order
    };
  }

  const holdingResult = await updateHoldingAfterSell(
    userId,
    symbol,
    quantity
  );

  if (!holdingResult.success) {
    await rejectOrder(order);

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
      new: true,
      runValidators: true
    }
  );

  if (!wallet) {
    throw new Error(
      "Wallet disappeared during SELL execution"
    );
  }

  await WalletTransaction.create({
    userId: userId,
    walletId: wallet._id,
    type: "CREDIT",
    amountPaise: totalAmountPaise,
    availableBalanceAfterPaise:
      wallet.availableBalancePaise,
    reservedBalanceAfterPaise:
      wallet.reservedBalancePaise
  });

  order.status = "COMPLETED";
  order.executionPricePaise = executionPricePaise;
  order.totalAmountPaise = totalAmountPaise;

  await order.save();

  return {
    success: true,
    order: order,
    wallet: wallet,
    holding: holdingResult.holding
  };
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