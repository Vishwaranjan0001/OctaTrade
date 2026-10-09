import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Wallet } from "../models/Wallet.js";
import { WalletTransaction } from "../models/WalletTransaction.js";
import { Holding } from "../models/Holding.js";
import { getMarketQuote } from "./marketDataServices.js";
import { enqueueOrder, getSchedulingPolicy } from "../scheduler/scheduler.js";

export async function submitOrder(
  userId,
  { symbol, side, quantity, priority, idempotencyKey }
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

  const schedulingPolicy = await getSchedulingPolicy();

  let order;

  try {
    order = await Order.create({
      userId: userId,
      symbol: symbol,
      side: side,
      quantity: quantity,
      priority: priority,
      idempotencyKey: idempotencyKey,
      schedulingPolicy: schedulingPolicy
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

  await enqueueOrder(order);

  return {
    order: order,
    isDuplicate: false
  };
}

export async function rejectOrder(order, reason) {
  order.status = "REJECTED";
  order.rejectionReason = reason;
  await order.save();

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

  if (existingWallet.availableBalancePaise < totalAmountPaise) {
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
      holding: null
    };
  }

  return {
    success: true,
    holding: holding
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