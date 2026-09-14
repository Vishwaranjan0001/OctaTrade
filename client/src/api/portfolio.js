import { api } from "../lib/apiClient.js";

/*
  GET /api/portfolio -> { holdings: [{ _id, symbol, quantity,
                                       averageBuyPricePaise, createdAt, updatedAt }] }
  Sorted by symbol server-side. Unwrapped to a plain array.
  The API returns cost basis only — it carries no market value, so current
  valuation must be derived from live quotes in the client.
*/
export async function fetchHoldings(options) {
  const payload = await api.get("/api/portfolio", options);
  return Array.isArray(payload?.holdings) ? payload.holdings : [];
}
