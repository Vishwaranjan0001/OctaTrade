/*
  The only module in the client that performs HTTP.

  Responsibilities
    - Resolve the API base URL (relative by default so the Vite dev proxy and
      a same-origin deployment both work with no code change).
    - Attach the bearer token for protected endpoints.
    - Normalise the backend's inconsistent error bodies into one ApiError.
      The Express app returns { message: "..." } from most controllers but
      { msg: "..." } from validateRegistration, validateSymbol and
      getCurrentUser, so both are handled.
    - Surface network/offline failures distinctly from HTTP failures, because
      the UI shows a different empty state for each.
*/

import { clearToken, getToken } from "./session.js";

const BASE_URL = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/+$/, "");

/** Thrown for every non-2xx response and for transport failures. */
export class ApiError extends Error {
  constructor(message, { status = 0, body = null, isNetworkError = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.isNetworkError = isNetworkError;
  }

  /** 401 from any protected endpoint means the session is no longer valid. */
  get isUnauthorized() {
    return this.status === 401;
  }

  get isNotFound() {
    return this.status === 404;
  }

  /** 502 is what the quote controller returns when the upstream feed fails. */
  get isUpstreamFailure() {
    return this.status === 502 || this.status === 503 || this.status === 504;
  }
}

let unauthorizedHandler = null;

/**
 * Registers the callback fired when a protected request returns 401, so the
 * auth layer can drop the session and bounce the user to /login.
 */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

function messageFromBody(body, status) {
  if (body && typeof body === "object") {
    // Both shapes the Express app actually emits, plus a defensive `error`.
    const candidate = body.message || body.msg || body.error;
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  if (typeof body === "string" && body.trim()) return body.trim();

  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have access to this resource.";
  if (status === 404) return "That resource could not be found.";
  if (status === 409) return "That record already exists.";
  if (status >= 500) return "The OctaTrade API is not responding correctly.";
  return `Request failed with status ${status}.`;
}

async function parseBody(response) {
  const contentType = response.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) return await response.json();
    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
}

/**
 * Performs a request against the OctaTrade API.
 *
 * @param {string} path   Path beginning with "/api/..."
 * @param {object} options
 *   method  - HTTP verb, defaults to GET
 *   body    - plain object, JSON-encoded automatically
 *   auth    - attach the bearer token (default true)
 *   signal  - AbortSignal from React Query
 * @returns {Promise<any>} parsed JSON body
 * @throws  {ApiError}
 */
export async function request(path, options = {}) {
  const { method = "GET", body, auth = true, signal, headers = {} } = options;

  const requestHeaders = { Accept: "application/json", ...headers };

  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";

  if (auth) {
    const token = getToken();
    if (token) requestHeaders.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError(
      "Cannot reach the OctaTrade API. Check that the server is running.",
      { isNetworkError: true }
    );
  }

  if (response.status === 204) return null;

  const payload = await parseBody(response);

  if (!response.ok) {
    const error = new ApiError(messageFromBody(payload, response.status), {
      status: response.status,
      body: payload
    });

    if (error.isUnauthorized && auth) {
      clearToken();
      if (unauthorizedHandler) unauthorizedHandler();
    }

    throw error;
  }

  return payload;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body })
};
