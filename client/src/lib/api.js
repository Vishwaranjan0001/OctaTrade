class ApiError extends Error {
  status;
  data;
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}
async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }
  const response = await fetch(path, {
    ...options,
    headers
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && typeof data === "object" && "message" in data ? String(data.message) : "Something went wrong";
    throw new ApiError(message, response.status, data);
  }
  return data;
}
const api = {
  login: (email, password) => apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  }),
  register: (name, email, password) => apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password })
  }),
  currentUser: (token) => apiRequest("/api/auth/me", { token }),
  wallet: (token) => apiRequest("/api/wallet", { token }),
  deposit: (token, amountPaise) => apiRequest("/api/wallet/deposit", {
    method: "POST",
    token,
    body: JSON.stringify({ amountPaise })
  }),
  transactions: (token) => apiRequest(
    "/api/wallet/transactions",
    { token }
  ),
  portfolio: (token) => apiRequest("/api/portfolio", { token }),
  orders: (token) => apiRequest("/api/orders", { token }),
  quote: (symbol) => apiRequest(`/api/quotes/${encodeURIComponent(symbol)}`),
  history: (symbol, range) => apiRequest(`/api/quotes/${encodeURIComponent(symbol)}/history?range=${range}`),
  portfolioHistory: (token) => apiRequest("/api/portfolio/history", { token }),
  placeOrder: (token, payload, idempotencyKey) => apiRequest(
    "/api/orders",
    {
      method: "POST",
      token,
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(payload)
    }
  )
};
export {
  ApiError,
  api,
  apiRequest
};
