import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { SmoothScrollProvider } from "./components/SmoothScrollProvider.jsx";
import { Toaster } from "./components/ui/Toast.jsx";
import { RouteFallback } from "./components/app/RouteFallback.jsx";
import { AppLayout } from "./components/app/AppLayout.jsx";
import { ProtectedRoute } from "./routes/ProtectedRoute.jsx";
import { PublicOnlyRoute } from "./routes/PublicOnlyRoute.jsx";
import { useMotionPreference } from "./hooks/useMotionPreference.js";
import { setUnauthorizedHandler } from "./lib/apiClient.js";

/* Route-level code splitting: the marketing page pulls in Three.js and the
   carousel, the workspace pulls in the chart libraries. Neither should be in
   the other's bundle. */
const Landing = lazy(() => import("./pages/marketing/Landing.jsx"));
const Login = lazy(() => import("./pages/auth/Login.jsx"));
const Register = lazy(() => import("./pages/auth/Register.jsx"));

const Dashboard = lazy(() => import("./pages/app/Dashboard.jsx"));
const Markets = lazy(() => import("./pages/app/Markets.jsx"));
const StockDetails = lazy(() => import("./pages/app/StockDetails.jsx"));
const Terminal = lazy(() => import("./pages/app/Terminal.jsx"));
const Portfolio = lazy(() => import("./pages/app/Portfolio.jsx"));
const Positions = lazy(() => import("./pages/app/Positions.jsx"));
const Orders = lazy(() => import("./pages/app/Orders.jsx"));
const OrderDetails = lazy(() => import("./pages/app/OrderDetails.jsx"));
const Watchlist = lazy(() => import("./pages/app/Watchlist.jsx"));
const Analytics = lazy(() => import("./pages/app/Analytics.jsx"));
const Activity = lazy(() => import("./pages/app/Activity.jsx"));
const Wallet = lazy(() => import("./pages/app/Wallet.jsx"));
const Notifications = lazy(() => import("./pages/app/Notifications.jsx"));
const Profile = lazy(() => import("./pages/app/Profile.jsx"));
const Settings = lazy(() => import("./pages/app/Settings.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

/**
 * Registers the global 401 response handler.
 *
 * Purpose : when any protected request returns 401 the token has already been
 *           cleared by apiClient; this sends the user to /login and remembers
 *           where they were so they return there after signing in.
 * Input   : none (uses router navigation).
 * Output  : null — effect only.
 */
function UnauthorizedRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      // Never bounce away from the public pages.
      const path = window.location.pathname;
      if (path === "/login" || path === "/register" || path === "/") return;
      navigate("/login", { replace: true, state: { from: path } });
    });

    return () => setUnauthorizedHandler(null);
  }, [navigate, location.pathname]);

  return null;
}

export function App() {
  /* One decision about motion for the whole app, including whether Lenis is
     instantiated at all. */
  const { animationsEnabled } = useMotionPreference();

  return (
    <SmoothScrollProvider enabled={animationsEnabled}>
      <UnauthorizedRedirect />
      <a className="ot-skip-link" href="#main">
        Skip to main content
      </a>

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          {/* Authenticated workspace. */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/markets/:symbol" element={<StockDetails />} />
            <Route path="/terminal" element={<Terminal />} />
            <Route path="/terminal/:symbol" element={<Terminal />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/positions" element={<Positions />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:orderId" element={<OrderDetails />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Legacy/alias paths kept pointing at the canonical routes. */}
          <Route path="/stocks/:symbol" element={<Navigate to="/markets" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <Toaster />
    </SmoothScrollProvider>
  );
}
