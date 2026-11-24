import mongoose from "mongoose";
import {
  submitOrder,
  getOrdersByUserId,
  getOrderByIdForUser,
  cancelOrder
} from "../services/orderServices.js";
import { publishOrderUpdate } from "../realtime/socket.js";
import { createOrderNotification } from "../services/notificationServices.js";

// POST /api/orders/:orderId/cancel
export async function cancelMyOrder(req, res) {
  try {
    const orderId = req.params.orderId;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID"
      });
    }

    const order = await cancelOrder(orderId, req.userId);

    if (!order) {
      return res.status(409).json({
        message: "Only your PENDING or OPEN orders can be cancelled"
      });
    }

    await createOrderNotification(order);
    await publishOrderUpdate(order);

    return res.status(200).json({
      message: "Order cancelled",
      order: order
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to cancel order"
    });
  }
}

export async function placeOrder(req, res) {
  try {
    const symbol = req.body.symbol;
    const side = req.body.side;
    const quantity = req.body.quantity;
    const idempotencyKey = req.get("Idempotency-Key");

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

    if (idempotencyKey !== undefined && idempotencyKey.length > 100) {
      return res.status(400).json({
        message: "Idempotency-Key must not exceed 100 characters"
      });
    }

    // MARKET (default), LIMIT (needs limitPricePaise), STOP_LOSS (SELL only, needs triggerPricePaise)
    const orderType = req.body.orderType || "MARKET";
    const limitPricePaise = req.body.limitPricePaise || null;
    const triggerPricePaise = req.body.triggerPricePaise || null;

    if (!["MARKET", "LIMIT", "STOP_LOSS"].includes(orderType)) {
      return res.status(400).json({
        message: "orderType must be MARKET, LIMIT or STOP_LOSS"
      });
    }

    if (orderType === "LIMIT" && !(Number.isInteger(limitPricePaise) && limitPricePaise > 0)) {
      return res.status(400).json({
        message: "A LIMIT order needs limitPricePaise as a positive integer"
      });
    }

    if (orderType === "STOP_LOSS" && normalizedSide !== "SELL") {
      return res.status(400).json({
        message: "A STOP_LOSS order must be a SELL"
      });
    }

    if (orderType === "STOP_LOSS" && !(Number.isInteger(triggerPricePaise) && triggerPricePaise > 0)) {
      return res.status(400).json({
        message: "A STOP_LOSS order needs triggerPricePaise as a positive integer"
      });
    }

    const result = await submitOrder(req.userId, {
      symbol: normalizedSymbol,
      side: normalizedSide,
      quantity: quantity,
      idempotencyKey: idempotencyKey,
      orderType: orderType,
      limitPricePaise: limitPricePaise,
      triggerPricePaise: triggerPricePaise
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