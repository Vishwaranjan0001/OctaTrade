import { api } from "../lib/apiClient.js";

/*
  Order endpoints.

  GET  /api/orders            -> { orders: [...] }
  GET  /api/orders/:orderId   -> { order: {...} } | order
  POST /api/orders            -> { order: {...} } | order
       body { symbol, side: "BUY" | "SELL", quantity }

  An order document carries integer-paise money fields
  (requestedPricePaise / executedPricePaise / totalValuePaise) and a
  status of NEW | FILLED | REJECTED | CANCELLED.

  These wrappers tolerate both an enveloped ({ order }) and a bare order
  response so the client keeps working if the backend envelope changes.
*/

function unwrapOrder(payload) {
  if (!payload) return null;
  return payload.order && typeof payload.order === "object" ? payload.order : payload;
}

export async function fetchOrders(options) {
  const payload = await api.get("/api/orders", options);
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.orders) ? payload.orders : [];
}

export async function fetchOrder(orderId, options) {
  const payload = await api.get(`/api/orders/${encodeURIComponent(orderId)}`, options);
  return unwrapOrder(payload);
}

export async function placeOrderRequest({ symbol, side, quantity }) {
  const payload = await api.post("/api/orders", { symbol, side, quantity });
  return unwrapOrder(payload);
}
