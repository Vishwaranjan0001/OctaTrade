import {
  getOrderById,
  getOrdersByUserId,
  placeOrder
} from "../services/orderServices.js";

export async function getMyOrders(req, res) {
  try {
    const orders = await getOrdersByUserId(req.userId);

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

export async function getMyOrder(req, res) {
  try {
    const order = await getOrderById(req.userId, req.params.orderId);

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

export async function createOrder(req, res) {
  try {
    const order = await placeOrder(req.userId, {
      symbol: req.body.symbol,
      side: req.body.side,
      quantity: req.body.quantity
    });

    // A rejected order is a successful request that produced a refusal, so it
    // is returned with 201 and its reason rather than as an error.
    return res.status(201).json({
      order: order
    });
  } catch (error) {
    console.error(error.message);

    // The only expected throw is an unavailable market quote.
    return res.status(502).json({
      message: "Unable to price this order from market data"
    });
  }
}
