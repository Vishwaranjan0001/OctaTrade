import mongoose from "mongoose";
import {
  executeBuyOrder,
  executeSellOrder,
  getOrdersByUserId,
  getOrderByIdForUser
} from "../services/orderServices.js";
import { acquireLock, releaseLock } from "../concurrency/userLock.js";

export async function placeOrder(req, res) {
  try {
    const symbol = req.body.symbol;
    const side = req.body.side;
    const quantity = req.body.quantity;

    if (typeof symbol !== "string" || symbol.trim().length === 0) {
      return res.status(400).json({
        message: "symbol is required"
      });
    }

    const normalizedSymbol = symbol.trim().toUpperCase();

    if (normalizedSymbol.length > 20) {
      return res.status(400).json({
        message: "symbol must not exceed 20 characters"
      });
    }

    if (typeof side !== "string") {
      return res.status(400).json({
        message: "side must be BUY or SELL"
      });
    }

    const normalizedSide = side.trim().toUpperCase();

    if (!["BUY", "SELL"].includes(normalizedSide)) {
      return res.status(400).json({
        message: "side must be BUY or SELL"
      });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        message: "quantity must be a positive integer"
      });
    }

        const lockToken = await acquireLock(req.userId);

    if (!lockToken) {
      return res.status(409).json({
        message: "Another order is still being processed. Please try again."
      });
    }

    let result;

    try {
      if (normalizedSide === "BUY") {
        result = await executeBuyOrder(req.userId, normalizedSymbol, quantity);
      } else {
        result = await executeSellOrder(req.userId, normalizedSymbol, quantity);
      }
    } finally {
      await releaseLock(req.userId, lockToken);
    }

    if (!result.success) {
      if (result.reason === "WALLET_NOT_FOUND") {
        return res.status(404).json({
          message: "Wallet not found",
          order: result.order
        });
      }

      if (result.reason === "INSUFFICIENT_FUNDS") {
        return res.status(400).json({
          message: "Insufficient wallet balance",
          order: result.order
        });
      }

      if (result.reason === "HOLDING_NOT_FOUND") {
        return res.status(400).json({
          message: "You do not own this stock",
          order: result.order
        });
      }

      if (result.reason === "INSUFFICIENT_HOLDING") {
        return res.status(400).json({
          message: "Insufficient shares to complete the sale",
          order: result.order
        });
      }

      return res.status(502).json({
        message: "Unable to get a valid market quote",
        order: result.order
      });
    }

    return res.status(201).json({
      message: `${normalizedSide} order completed successfully`,
      order: result.order,
      wallet: {
        availableBalancePaise: result.wallet.availableBalancePaise,
        reservedBalancePaise: result.wallet.reservedBalancePaise,
        currency: result.wallet.currency
      },
      holding: result.holding
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to place order"
    });
  }
}

export async function getMyOrders(req, res) {
  try {
    const orders = await getOrdersByUserId(
      req.userId
    );

    return res.status(200).json({
      orders: orders
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to retrieve orders"
    });
  }
}

export async function getMyOrderById(req, res) {
  try {
    const orderId = req.params.orderId;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID"
      });
    }

    const order = await getOrderByIdForUser(
      orderId,
      req.userId
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    return res.status(200).json({
      order: order
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to retrieve order"
    });
  }
}