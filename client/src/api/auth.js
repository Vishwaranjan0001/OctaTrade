import { api } from "../lib/apiClient.js";

/*
  POST /api/auth/register -> 201 { id, name, email }
  Note: registration does NOT return a token. The caller must follow it with
  a real login call to obtain a session.
*/
export function registerRequest({ name, email, password }) {
  return api.post("/api/auth/register", { name, email, password }, { auth: false });
}

/* POST /api/auth/login -> 200 { token, user: { id, name, email } } */
export function loginRequest({ email, password }) {
  return api.post("/api/auth/login", { email, password }, { auth: false });
}

/* GET /api/auth/me -> 200 { id, name, email } (bearer required) */
export function meRequest(options) {
  return api.get("/api/auth/me", options);
}
