import mongoose from "mongoose";
import {
  submitOrder,
  getOrdersByUserId,
  getOrderByIdForUser
} from "../services/orderServices.js";

export async function placeOrder(req, res) {
  try {
    const symbol = req.body.symbol;
    const side = req.body.side;
    const quantity = req.body.quantity;
    const idempotencyKey = req.get("Idempotency-Key");

    let priority = 2;

    if (req.body.priority !== undefined) {
      priority = req.body.priority;
    }

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

    if (![1, 2, 3].includes(priority)) {
      return res.status(400).json({
        message: "priority must be 1 (high), 2 (normal) or 3 (low)"
      });
    }

    if (idempotencyKey !== undefined && idempotencyKey.length > 100) {
      return res.status(400).json({
        message: "Idempotency-Key must not exceed 100 characters"
      });
    }

    const result = await submitOrder(req.userId, {
      symbol: normalizedSymbol,
      side: normalizedSide,
      quantity: quantity,
      priority: priority,
      idempotencyKey: idempotencyKey
    });

    if (result.isDuplicate) {
      return res.status(200).json({
        message: "This order was already received",
        order: result.order
      });
    }

    return res.status(202).json({
      message: `${normalizedSide} order received and queued`,
      order: result.order
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