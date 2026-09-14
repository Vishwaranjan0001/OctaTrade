import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { useMe } from "../hooks/queries.js";
import { RouteFallback } from "../components/app/RouteFallback.jsx";

/**
 * ProtectedRoute — gate for the authenticated workspace.
 *
 * Purpose : a route is only entered once a bearer token exists AND
 *           GET /api/auth/me has confirmed it is still valid. Without the
 *           second check a stale token would render the whole workspace before
 *           every panel failed with 401 individually.
 * Input   : children.
 * Output  : children, a loading fallback, or a redirect to /login carrying the
 *           attempted path so the user returns to it after signing in.
 */
export function ProtectedRoute({ children }) {
  const hasSession = useAuthStore((state) => state.hasSession);
  const justSignedOut = useAuthStore((state) => state.justSignedOut);
  const location = useLocation();
  const { isLoading, isError, data } = useMe();

  if (!hasSession) {
    /* A deliberate sign-out belongs on the landing page; a missing or expired
       token belongs on sign-in with the attempted path remembered. */
    if (justSignedOut) return <Navigate to="/" replace />;
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  /* Token present but not yet verified. */
  if (isLoading && !data) return <RouteFallback label="Verifying session" />;

  /* Token rejected: apiClient has already cleared it. */
  if (isError && !data) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
