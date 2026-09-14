import {
  Activity as ActivityIcon,
  BarChart3,
  Bell,
  CandlestickChart,
  Eye,
  LayoutDashboard,
  LineChart,
  ListOrdered,
  PieChart,
  Search,
  Settings as SettingsIcon,
  User,
  Wallet as WalletIcon
} from "lucide-react";

/*
  The workspace navigation model.

  Grouped by the question the user is asking, not by data source:
    DESK      - what is my account doing right now
    MARKET    - find and study a security, then trade it
    ACCOUNT   - the records: holdings, orders, money, history
    PROFILE   - preferences and identity

  Each entry declares the API it reads so the UI can label surfaces honestly
  (the sidebar tooltips and the page headers reuse this).
*/
export const NAV_GROUPS = [
  {
    id: "desk",
    label: "Desk",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, api: "Wallet + Portfolio + Orders" },
      { to: "/analytics", label: "Analytics", icon: BarChart3, api: "Portfolio + Quotes" }
    ]
  },
  {
    id: "market",
    label: "Market",
    items: [
      { to: "/markets", label: "Markets", icon: Search, api: "Quotes" },
      { to: "/watchlist", label: "Watchlist", icon: Eye, api: "Quotes (local list)" },
      { to: "/terminal", label: "Terminal", icon: CandlestickChart, api: "Quotes + Orders + Wallet" }
    ]
  },
  {
    id: "account",
    label: "Account",
    items: [
      { to: "/portfolio", label: "Portfolio", icon: PieChart, api: "Portfolio" },
      { to: "/positions", label: "Positions", icon: LineChart, api: "Portfolio + Quotes" },
      { to: "/orders", label: "Orders", icon: ListOrdered, api: "Orders" },
      { to: "/wallet", label: "Wallet", icon: WalletIcon, api: "Wallet" },
      { to: "/activity", label: "Activity", icon: ActivityIcon, api: "Wallet transactions + Orders" }
    ]
  },
  {
    id: "profile",
    label: "Profile",
    items: [
      { to: "/notifications", label: "Notifications", icon: Bell, api: "Derived from account events" },
      { to: "/profile", label: "Profile", icon: User, api: "Auth" },
      { to: "/settings", label: "Settings", icon: SettingsIcon, api: "Local preferences" }
    ]
  }
];

/** Flat lookup used by the topbar to title the current page. */
export const NAV_INDEX = NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.label }))
);
