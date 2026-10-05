import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Toaster } from "sonner";
import { AppShell } from "@/components/shell";
import { useAppStore } from "@/store/app-store";

const ActivityPage = lazy(() => import("@/pages/ActivityPage").then((module) => ({ default: module.ActivityPage })));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage").then((module) => ({ default: module.AnalyticsPage })));
const AuthPage = lazy(() => import("@/pages/AuthPage").then((module) => ({ default: module.AuthPage })));
const LandingPage = lazy(() => import("@/pages/LandingPage").then((module) => ({ default: module.LandingPage })));
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const MarketsPage = lazy(() => import("@/pages/MarketsPage").then((module) => ({ default: module.MarketsPage })));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage").then((module) => ({ default: module.NotificationsPage })));
const OrdersPage = lazy(() => import("@/pages/OrdersPage").then((module) => ({ default: module.OrdersPage })));
const PortfolioPage = lazy(() => import("@/pages/PortfolioPage").then((module) => ({ default: module.PortfolioPage })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const StockDetailsPage = lazy(() => import("@/pages/StockDetailsPage").then((module) => ({ default: module.StockDetailsPage })));
const TradePage = lazy(() => import("@/pages/TradePage").then((module) => ({ default: module.TradePage })));
const WalletPage = lazy(() => import("@/pages/WalletPage").then((module) => ({ default: module.WalletPage })));
const WatchlistPage = lazy(() => import("@/pages/WatchlistPage").then((module) => ({ default: module.WatchlistPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

function ThemeSync() {
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return null;
}

function ProtectedLayout() {
  const token = useAppStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

function PublicOnlyRoute() {
  const token = useAppStore((state) => state.token);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AuthPage />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Tooltip.Provider delayDuration={180}>
        <ThemeSync />
        <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[var(--app-bg)]"><div className="size-9 animate-spin rounded-full border-2 border-brand-500/20 border-t-brand-500" /></div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicOnlyRoute />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/markets" element={<MarketsPage />} />
              <Route path="/trade" element={<TradePage />} />
              <Route path="/stocks/:symbol" element={<StockDetailsPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/positions" element={<PortfolioPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/watchlist" element={<WatchlistPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster richColors position="top-right" theme="dark" />
      </Tooltip.Provider>
    </QueryClientProvider>
  );
}
