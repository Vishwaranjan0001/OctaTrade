import { api } from "../lib/apiClient.js";

/*
  GET /api/wallet
  -> { id, availableBalancePaise, reservedBalancePaise, currency }
  All balances are integer paise.
*/
export function fetchWallet(options) {
  return api.get("/api/wallet", options);
}

/*
  POST /api/wallet/deposit  body { amountPaise }
  The controller rejects anything that is not a positive integer, so callers
  must convert rupees with rupeesToPaise() before calling this.
  -> { message, wallet }
*/
export function depositRequest(amountPaise) {
  return api.post("/api/wallet/deposit", { amountPaise });
}

/*
  GET /api/wallet/transactions -> { transactions: [...] }
  Returned newest-first by the service. Unwrapped to a plain array here.
*/
export async function fetchWalletTransactions(options) {
  const payload = await api.get("/api/wallet/transactions", options);
  return Array.isArray(payload?.transactions) ? payload.transactions : [];
}
