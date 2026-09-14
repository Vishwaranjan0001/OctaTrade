import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

/**
 * PublicOnlyRoute — keeps signed-in users out of /login and /register.
 *
 * Purpose : an authenticated user landing on the auth pages should go straight
 *           to their workspace rather than be asked to sign in again.
 * Input   : children.
 * Output  : children, or a redirect to /dashboard.
 */
export function PublicOnlyRoute({ children }) {
  const hasSession = useAuthStore((state) => state.hasSession);
  const justSignedOut = useAuthStore((state) => state.justSignedOut);
  const clearSignedOutFlag = useAuthStore((state) => state.clearSignedOutFlag);

  /* Reaching sign-in resolves the previous sign-out, so a later expiry routes
     here normally instead of being mistaken for another deliberate exit. */
  useEffect(() => {
    if (justSignedOut) clearSignedOutFlag();
  }, [justSignedOut, clearSignedOutFlag]);

  if (hasSession) return <Navigate to="/dashboard" replace />;
  return children;
}
