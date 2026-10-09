import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { BarChart3, ChevronDown, Clock3, Search, Star } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatCurrencyFromPaise, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { RANGE_INTERVALS, RangePicker, TradingChart } from "@/components/charts";
import { OrderTicket } from "@/components/order-ticket";
import { Badge, Button, Card, Input, PageHeader } from "@/components/ui";

export function TradePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [watchlistQuery, setWatchlistQuery] = useState("");
  const [range, setRange] = useState("1D");
  const selectedSymbol = useAppStore((state) => state.selectedSymbol);
  const setSelectedSymbol = useAppStore((state) => state.setSelectedSymbol);
  const watchlist = useAppStore((state) => state.watchlist);
  const toggleWatchlist = useAppStore((state) => state.toggleWatchlist);
  const token = useAppStore((state) => state.token);
  const symbol = (searchParams.get("symbol") || selectedSymbol).toUpperCase();

  useEffect(() => {
    setSelectedSymbol(symbol);
  }, [symbol, setSelectedSymbol]);

  const quoteQuery = useQuery({
    queryKey: ["quote", symbol],
    queryFn: () => api.quote(symbol),
    enabled: Boolean(symbol),
    retry: 1,
    staleTime: 15_000
  });
  const historyQuery = useQuery({
    queryKey: ["history", symbol, range],
    queryFn: () => api.history(symbol, range),
    enabled: Boolean(symbol),
    retry: 1,
    staleTime: 60_000
  });
  const watchlistQueries = useQueries({
    queries: watchlist.map((item) => ({
      queryKey: ["quote", item],
      queryFn: () => api.quote(item),
      retry: 1,
      staleTime: 15_000
    }))
  });
  const ordersQuery = useQuery({
    queryKey: ["orders", token],
    queryFn: () => api.orders(token),
    enabled: Boolean(token),
    staleTime: 15_000
  });

  const quotePrice = quoteQuery.data?.price ?? 0;
  const orders = ordersQuery.data?.orders ?? [];
  const visibleWatchlist = watchlist
    .map((item, index) => ({ symbol: item, quote: watchlistQueries[index]?.data }))
    .filter((item) => item.symbol.toLowerCase().includes(watchlistQuery.trim().toLowerCase()));

  const chooseSymbol = (nextSymbol) => {
    setSearchParams({ symbol: nextSymbol });
    setSelectedSymbol(nextSymbol);
  };
  const openTypedSymbol = () => {
    const input = watchlistQuery.trim().toUpperCase();
    if (!input) return;
    chooseSymbol(input.includes(".") ? input : input + ".NS");
    setWatchlistQuery("");
  };

  if (!symbol) {
    return <div className="space-y-7">
      <PageHeader eyebrow="Trading terminal" title="Choose a security" description="Enter an exchange symbol to request its latest quote." />
      <Card className="mx-auto max-w-xl p-6">
        <p className="text-sm font-semibold">NSE symbol</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">For example, enter TCS or TCS.NS.</p>
        <div className="mt-5 flex gap-2">
          <Input value={watchlistQuery} onChange={(event) => setWatchlistQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && openTypedSymbol()} placeholder="Symbol" />
          <Button onClick={openTypedSymbol}>Open terminal</Button>
        </div>
        <Link to="/markets" className="mt-5 block text-center text-xs font-semibold text-brand-500">Open market search</Link>
      </Card>
    </div>;
  }

  return (
    <div className="-mx-4 -my-6 md:-mx-6 md:-my-7">
      <div className="grid min-h-[calc(100vh-4rem)] xl:grid-cols-[248px_minmax(0,1fr)_340px]">
        <aside className="hidden border-r border-[var(--line)] bg-[var(--panel)] xl:block">
          <div className="border-b border-[var(--line)] p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-semibold">Watchlist</p><p className="mt-1 text-[10px] text-[var(--text-muted)]">{watchlist.length} securities</p></div>
              <button className="grid size-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--panel-muted)]"><ChevronDown className="size-4" /></button>
            </div>
            <div className="relative mt-3">
              <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input value={watchlistQuery} onChange={(event) => setWatchlistQuery(event.target.value)} placeholder="Filter symbols" className="h-9 pl-9 text-xs" />
            </div>
          </div>
          <div className="soft-scrollbar max-h-[calc(100vh-150px)] overflow-y-auto p-2">
            {visibleWatchlist.map((item) => (
              <button
                type="button"
                key={item.symbol}
                onClick={() => chooseSymbol(item.symbol)}
                className={cn("mb-1 flex w-full items-center gap-2 rounded-xl p-3 text-left transition", symbol === item.symbol ? "bg-brand-500/10" : "hover:bg-[var(--panel-muted)]")}
              >
                <span className="grid size-8 place-items-center rounded-lg bg-[var(--panel-muted)] text-[9px] font-bold text-brand-500">{item.symbol.slice(0, 2)}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">{item.symbol}</span><span className="mt-1 block text-[9px] text-[var(--text-muted)]">{item.quote?.currency ?? "Quote unavailable"}</span></span>
                <span className="number-tabular text-right text-[11px] font-semibold">{item.quote?.price ? formatCurrency(item.quote.price) : "—"}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 border-r border-[var(--line)]">
          <div className="border-b border-[var(--line)] bg-[var(--panel)] px-4 py-4 md:px-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-500/10 text-sm font-bold text-brand-500">{symbol.slice(0, 2)}</span>
                <div><div className="flex items-center gap-2"><h1 className="text-sm font-bold">{symbol}</h1><Badge tone={quoteQuery.isSuccess ? "positive" : "info"}>{quoteQuery.isLoading ? "Loading quote" : quoteQuery.isSuccess ? "Latest quote" : "Quote unavailable"}</Badge></div><p className="mt-1 text-[10px] text-[var(--text-muted)]">NSE · {quoteQuery.data?.currency ?? "INR"}</p></div>
              </div>
              <div className="flex items-end gap-4">
                <div className="text-right"><p className="number-tabular text-2xl font-semibold tracking-tight">{quotePrice ? formatCurrency(quotePrice) : "—"}</p><p className="mt-1 text-xs text-[var(--text-muted)]">Daily change unavailable</p></div>
                <button onClick={() => toggleWatchlist(symbol)} className={cn("grid size-10 place-items-center rounded-xl border border-[var(--line)]", watchlist.includes(symbol) ? "bg-brand-500/10 text-brand-500" : "text-[var(--text-muted)]")}><Star className={cn("size-4", watchlist.includes(symbol) && "fill-current")} /></button>
              </div>
            </div>
          </div>

          <div className="bg-[var(--panel)] p-2 md:p-4">
            <div className="flex items-center justify-between px-2 pt-1 pb-3">
              <p className="text-[10px] text-[var(--text-muted)]">{historyQuery.isLoading ? "Loading price history…" : historyQuery.isError ? "Price history unavailable" : "Price history · Yahoo Finance"}</p>
              <RangePicker range={range} onChange={setRange} />
            </div>
            <TradingChart data={historyQuery.data?.candles ?? []} chartType="Candles" timeframe={RANGE_INTERVALS[range]} showVolume={false} className="h-[440px] md:h-[520px]" />
          </div>

          <div className="border-t border-[var(--line)] bg-[var(--panel)] p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xs font-semibold">Orders &amp; positions</h2><p className="mt-1 text-[10px] text-[var(--text-muted)]">Latest execution activity</p></div><Link to="/orders" className="text-[10px] font-semibold text-brand-500">Open order book</Link></div>
            {orders.length ? <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[10px]">
                <thead className="text-[9px] tracking-wider text-[var(--text-muted)] uppercase"><tr><th className="pb-3">Symbol</th><th className="pb-3">Side</th><th className="pb-3">Qty</th><th className="pb-3">Price</th><th className="pb-3">Time</th><th className="pb-3 text-right">Status</th></tr></thead>
                <tbody>{orders.slice(0, 4).map((order) => <tr key={order._id} className="border-t border-[var(--line)]"><td className="py-3 font-semibold">{order.symbol}</td><td className={cn("py-3 font-bold", order.side === "BUY" ? "text-emerald-500" : "text-red-500")}>{order.side}</td><td className="number-tabular py-3">{order.quantity}</td><td className="number-tabular py-3">{order.executionPricePaise ? formatCurrencyFromPaise(order.executionPricePaise, 2) : "—"}</td><td className="py-3 text-[var(--text-muted)]">{formatDate(order.createdAt)}</td><td className="py-3 text-right"><Badge tone={order.status === "COMPLETED" ? "positive" : "negative"}>{order.status}</Badge></td></tr>)}</tbody>
              </table>
            </div> : <p className="py-12 text-center text-xs text-[var(--text-muted)]">No orders yet.</p>}
          </div>
        </section>

        <aside className="bg-[var(--app-bg)] p-4 md:p-5">
          <div className="sticky top-20">
            <OrderTicket symbol={symbol} />
            <Card className="mt-4 p-4 shadow-none">
              <div className="flex items-center gap-2"><BarChart3 className="size-4 text-brand-500" /><p className="text-xs font-semibold">Latest quote</p></div>
              <div className="mt-4 rounded-xl bg-[var(--panel-muted)] p-4">
                <p className="text-[9px] text-[var(--text-muted)]">Price</p>
                <p className="number-tabular mt-2 text-lg font-semibold">{quotePrice ? formatCurrency(quotePrice) : "—"}</p>
                <p className="mt-2 text-[10px] text-[var(--text-muted)]">{quoteQuery.data?.currency ?? "Currency unavailable"}</p>
              </div>
              <p className="mt-3 flex items-center gap-1 text-[9px] text-[var(--text-muted)]"><Clock3 className="size-3" /> Quote may be delayed.</p>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
