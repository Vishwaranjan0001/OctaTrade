import { api } from "../lib/apiClient.js";
import { normaliseSymbol } from "../lib/format.js";

/*
  GET /api/quotes/:symbol -> { symbol, price, currency }
  `price` is a RUPEE float (Yahoo regularMarketPrice), not paise.
  The endpoint is public; the middleware upper-cases and length-checks the
  symbol, and the controller answers 502 when the upstream feed fails.
*/
export function fetchQuote(symbol, options) {
  const normalised = normaliseSymbol(symbol);
  return api.get(`/api/quotes/${encodeURIComponent(normalised)}`, {
    ...options,
    auth: false
  });
}
