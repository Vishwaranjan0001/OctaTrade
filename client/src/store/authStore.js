import { create } from "zustand";
import { clearToken, getToken, setToken, subscribeToken } from "../lib/session.js";

/*
  Auth is split across three layers on purpose:
    session.js   - owns the bearer token (no React, no cycles)
    React Query  - owns the user profile from GET /api/auth/me (server state)
    this store    - the thin reactive bridge so components re-render when the
                    session appears or disappears, plus the sign-in/out actions

  `hasSession` only says a token exists. Whether that token is still valid is
  decided by /api/auth/me, which is what ProtectedRoute waits on.
*/
export const useAuthStore = create((set) => ({
  hasSession: Boolean(getToken()),

  /* Distinguishes "signed out on purpose" from "token missing or expired".
     Without it, signing out re-renders the protected tree first and bounces the
     user to /login, which reads as a failure rather than a completed action. */
  justSignedOut: false,

  /** Called after a real POST /api/auth/login response. */
  signIn(token) {
    setToken(token);
    set({ hasSession: true, justSignedOut: false });
  },

  /** Sign-out is purely local: the API issues stateless JWTs. */
  signOut() {
    clearToken();
    set({ hasSession: false, justSignedOut: true });
  },

  /** Consumed by ProtectedRoute once the post-sign-out redirect has happened. */
  clearSignedOutFlag() {
    set({ justSignedOut: false });
  }
}));

/* Keep the store in step with storage events from other tabs and with the
   401 handler in apiClient, both of which mutate the token directly. */
subscribeToken((token) => {
  const hasSession = Boolean(token);
  if (useAuthStore.getState().hasSession !== hasSession) {
    useAuthStore.setState({ hasSession });
  }
});
