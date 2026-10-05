import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  CandlestickChart,
  ChartNoAxesCombined,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Command,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  UserRound,
  WalletCards
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrencyFromPaise, getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { Brand } from "@/components/brand";
const navigation = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Markets", path: "/markets", icon: CandlestickChart },
  { label: "Trade", path: "/trade", icon: CircleDollarSign },
  { label: "Portfolio", path: "/portfolio", icon: PieChart },
  { label: "Orders", path: "/orders", icon: ClipboardList },
  { label: "Positions", path: "/positions", icon: BriefcaseBusiness },
  { label: "Watchlist", path: "/watchlist", icon: Star },
  { label: "Analytics", path: "/analytics", icon: ChartNoAxesCombined },
  { label: "Activity", path: "/activity", icon: Activity },
  { label: "Wallet", path: "/wallet", icon: WalletCards }
];
const secondaryNavigation = [
  { label: "Notifications", path: "/notifications", icon: Bell },
  { label: "Profile", path: "/profile", icon: UserRound },
  { label: "Settings", path: "/settings", icon: Settings }
];
function SidebarLink({ item, collapsed }) {
  const link = <NavLink
    to={item.path}
    className={({ isActive }) => cn(
      "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
      isActive ? "bg-brand-500/12 text-brand-500" : "text-[var(--text-muted)] hover:bg-[var(--panel-muted)] hover:text-[var(--text)]",
      collapsed && "justify-center px-0"
    )}
  >
      {({ isActive }) => <>
          {isActive ? <motion.span
    layoutId="sidebar-active"
    className="absolute left-0 h-5 w-0.5 rounded-full bg-brand-500"
  /> : null}
          <item.icon className="size-[17px] shrink-0" strokeWidth={1.8} />
          {!collapsed ? <span>{item.label}</span> : null}
        </>}
    </NavLink>;
  if (!collapsed) {
    return link;
  }
  return <Tooltip.Root delayDuration={150}>
      <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
    side="right"
    sideOffset={10}
    className="z-50 rounded-lg bg-[#1a1916] px-2.5 py-1.5 text-xs text-white shadow-xl"
  >
          {item.label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>;
}
function Sidebar() {
  const collapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const user = useAppStore((state) => state.user);
  return <motion.aside
    animate={{ width: collapsed ? 76 : 238 }}
    transition={{ type: "spring", stiffness: 320, damping: 32 }}
    className="fixed inset-y-0 left-0 z-30 hidden border-r border-[var(--line)] bg-[var(--panel)] backdrop-blur-2xl lg:flex lg:flex-col"
  >
      <div className={cn("flex h-20 items-center border-b border-[var(--line)]", collapsed ? "justify-center" : "px-5")}>
        <Brand compact={collapsed} />
      </div>

      <nav className="soft-scrollbar flex-1 space-y-1 overflow-y-auto p-3">
        {!collapsed ? <p className="px-3 pt-2 pb-2 text-[9px] font-bold tracking-[0.16em] text-[var(--text-muted)] uppercase">
            Workspace
          </p> : null}
        {navigation.map((item) => <SidebarLink key={item.path} item={item} collapsed={collapsed} />)}

        <div className="my-3 border-t border-[var(--line)]" />

        {secondaryNavigation.map((item) => <SidebarLink key={item.path} item={item} collapsed={collapsed} />)}
      </nav>

      <div className="border-t border-[var(--line)] p-3">
        {!collapsed ? <div className="mb-3 rounded-xl border border-brand-500/15 bg-brand-500/7 p-3">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-brand-500 uppercase">
              <ShieldCheck className="size-3.5" />
              Paper account
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
              Virtual funds. Real market discipline.
            </p>
          </div> : null}

        <div className={cn("flex items-center gap-2 rounded-xl bg-[var(--panel-muted)] p-2", collapsed && "justify-center")}>
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-500/15 text-xs font-bold text-brand-500">
            {getInitials(user?.name ?? "OT")}
          </div>
          {!collapsed ? <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[var(--text)]">{user?.name ?? "Octa Trader"}</p>
              <p className="truncate text-[10px] text-[var(--text-muted)]">
                {user?.email}
              </p>
            </div> : null}
        </div>

        <button
    type="button"
    onClick={toggleSidebar}
    className="mt-2 flex h-8 w-full items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--panel-muted)] hover:text-[var(--text)]"
    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
  >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>
    </motion.aside>;
}
function SearchPalette({ open, onOpenChange }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const setSelectedSymbol = useAppStore((state) => state.setSelectedSymbol);
  const normalizedSymbol = query.trim().toUpperCase();
  const chooseStock = () => {
    if (!normalizedSymbol) return;
    const symbol = normalizedSymbol.includes(".") ? normalizedSymbol : normalizedSymbol + ".NS";
    setSelectedSymbol(symbol);
    onOpenChange(false);
    setQuery("");
    navigate(`/stocks/${encodeURIComponent(symbol)}`);
  };
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm data-[state=open]:animate-in" />
        <Dialog.Content className="fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#151412] shadow-2xl outline-none">
          <Dialog.Title className="sr-only">Search securities</Dialog.Title>
          <div className="flex items-center gap-3 border-b border-white/8 px-4">
            <Search className="size-5 text-white/45" />
            <input
    autoFocus
    value={query}
    onChange={(event) => setQuery(event.target.value)}
    placeholder="Enter an NSE symbol, such as TCS.NS…"
    onKeyDown={(event) => event.key === "Enter" && chooseStock()}
    className="h-14 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
  />
            <kbd className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/45">ESC</kbd>
          </div>
          <div className="max-h-[370px] overflow-y-auto p-2">
            <p className="px-3 py-2 text-[9px] font-bold tracking-[0.18em] text-white/35 uppercase">
              Securities
            </p>
            {normalizedSymbol ? <button
    type="button"
    onClick={chooseStock}
    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/6"
  >
                <div className="grid size-9 place-items-center rounded-xl bg-brand-500/12 text-xs font-bold text-brand-400">
                  {normalizedSymbol.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{normalizedSymbol.includes(".") ? normalizedSymbol : normalizedSymbol + ".NS"}</p>
                  <p className="truncate text-xs text-white/40">Request the latest quote</p>
                </div>
              </button> : <p className="px-3 py-8 text-center text-xs text-white/35">Type a symbol to search.</p>}
          </div>
          <div className="flex items-center justify-between border-t border-white/8 px-4 py-2.5 text-[10px] text-white/35">
            <span>Latest quotes only</span>
            <span>↵ Open security</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>;
}
function NotificationsMenu() {
  return <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
    type="button"
    className="relative grid size-10 place-items-center rounded-xl border border-[var(--line)] bg-[var(--panel)] text-[var(--text-muted)] transition hover:text-[var(--text)]"
    aria-label="Open notifications"
  >
          <Bell className="size-[17px]" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
    align="end"
    sideOffset={8}
    className="z-50 w-80 rounded-2xl border border-[var(--line)] bg-[var(--panel-solid)] p-2 shadow-2xl"
  >
          <div className="px-3 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">A notification service is not connected yet.</p>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>;
}
function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const token = useAppStore((state) => state.token);
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  const navigate = useNavigate();
  const walletQuery = useQuery({
    queryKey: ["wallet", token],
    queryFn: () => api.wallet(token),
    enabled: Boolean(token),
    staleTime: 3e4
  });
  const wallet = walletQuery.data;
  return <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[var(--line)] bg-[var(--app-bg)]/82 px-4 backdrop-blur-xl md:px-6">
        <Brand className="lg:hidden" />

        <button
    type="button"
    onClick={() => setSearchOpen(true)}
    className="ml-auto flex h-10 w-10 items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 text-left text-[var(--text-muted)] transition hover:border-brand-500/30 md:ml-0 md:w-full md:max-w-md"
  >
          <Search className="size-4 shrink-0" />
          <span className="hidden flex-1 text-xs md:block">Search stocks, orders, pages…</span>
          <kbd className="hidden items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--panel-muted)] px-1.5 py-1 text-[9px] lg:flex">
            <Command className="size-2.5" /> K
          </kbd>
        </button>

        <div className="ml-auto hidden border-l border-[var(--line)] pl-4 text-right sm:block">
          <p className="text-[9px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">Buying power</p>
          <p className="number-tabular mt-0.5 text-sm font-semibold text-[var(--text)]">
            {wallet ? formatCurrencyFromPaise(wallet.availableBalancePaise) : "\u2014"}
          </p>
        </div>

        <button
    type="button"
    onClick={toggleTheme}
    className="grid size-10 place-items-center rounded-xl border border-[var(--line)] bg-[var(--panel)] text-[var(--text-muted)] transition hover:text-[var(--text)]"
    aria-label="Toggle colour theme"
  >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
    key={theme}
    initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
    animate={{ opacity: 1, rotate: 0, scale: 1 }}
    exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
  >
              {theme === "dark" ? <Sun className="size-[17px]" /> : <Moon className="size-[17px]" />}
            </motion.span>
          </AnimatePresence>
        </button>

        <NotificationsMenu />

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button type="button" className="flex h-10 items-center gap-2 rounded-xl pl-1 pr-2 hover:bg-[var(--panel-muted)]">
              <span className="grid size-8 place-items-center rounded-lg bg-brand-500/15 text-[10px] font-bold text-brand-500">
                {getInitials(user?.name ?? "OT")}
              </span>
              <ChevronDown className="hidden size-3.5 text-[var(--text-muted)] sm:block" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={8} className="z-50 w-52 rounded-xl border border-[var(--line)] bg-[var(--panel-solid)] p-1.5 shadow-2xl">
              <div className="px-3 py-2">
                <p className="truncate text-xs font-semibold">{user?.name}</p>
                <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">{user?.email}</p>
              </div>
              <DropdownMenu.Separator className="my-1 h-px bg-[var(--line)]" />
              <DropdownMenu.Item onSelect={() => navigate("/settings")} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs outline-none hover:bg-[var(--panel-muted)]">
                <Settings className="size-3.5" /> Settings
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={logout} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-500 outline-none hover:bg-red-500/8">
                <LogOut className="size-3.5" /> Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </header>

      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </>;
}
function MobileNavigation() {
  const items = [navigation[0], navigation[1], navigation[2], navigation[3], navigation[4]];
  return <nav className="fixed inset-x-3 bottom-3 z-40 flex h-16 items-center justify-around rounded-2xl border border-[var(--line)] bg-[var(--panel-solid)]/94 px-2 shadow-2xl backdrop-blur-xl lg:hidden">
      {items.map((item) => <NavLink
    key={item.path}
    to={item.path}
    className={({ isActive }) => cn(
      "flex min-w-12 flex-col items-center gap-1 text-[9px] font-semibold transition",
      isActive ? "text-brand-500" : "text-[var(--text-muted)]"
    )}
  >
          <item.icon className="size-[18px]" />
          {item.label}
        </NavLink>)}
    </nav>;
}
function AppShell() {
  const collapsed = useAppStore((state) => state.sidebarCollapsed);
  const location = useLocation();
  // Purpose: open each workspace page at its top. Input: changed route path.
  // Output: updated browser scroll position. File: components/shell.jsx.
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [location.pathname]);
  return <div className="min-h-screen">
      <Sidebar />
      <motion.div
    className={cn(
      "min-h-screen transition-[margin-left] duration-300",
      collapsed ? "lg:ml-[76px]" : "lg:ml-[238px]"
    )}
  >
        <Header />
        <AnimatePresence mode="wait">
          <motion.main
    key={location.pathname}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="mx-auto w-full max-w-[1680px] px-4 py-6 pb-24 md:px-6 md:py-7 lg:pb-8"
  >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </motion.div>
      <MobileNavigation />
    </div>;
}
export {
  AppShell
};
