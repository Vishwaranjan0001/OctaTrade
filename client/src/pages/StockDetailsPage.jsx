import { useState } from "react";
import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Clock3, Globe2, Star, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { RANGE_INTERVALS, RangePicker, TradingChart } from "@/components/charts";
import { OrderTicket } from "@/components/order-ticket";
import { Badge, Card, PageHeader, SectionHeader } from "@/components/ui";

export function StockDetailsPage() {
  const { symbol: routeSymbol } = useParams();
  const symbol = decodeURIComponent(routeSymbol ?? "").toUpperCase();
  const watchlist = useAppStore((state) => state.watchlist);
  const toggleWatchlist = useAppStore((state) => state.toggleWatchlist);
  const saved = watchlist.includes(symbol);
  const quoteQuery = useQuery({
    queryKey: ["quote", symbol],
    queryFn: () => api.quote(symbol),
    enabled: Boolean(symbol),
    retry: 1,
    staleTime: 15_000
  });
  const [range, setRange] = useState("1M");
  const historyQuery = useQuery({
    queryKey: ["history", symbol, range],
    queryFn: () => api.history(symbol, range),
    enabled: Boolean(symbol),
    retry: 1,
    staleTime: 60_000
  });
  const price = quoteQuery.data?.price ?? 0;

  return (
    <div className="space-y-7">
      <Link to="/markets" className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] hover:text-brand-500"><ArrowLeft className="size-4" /> Back to markets</Link>
      <PageHeader
        eyebrow="Security overview"
        title={symbol || "Unknown security"}
        description="Latest quote and simulated execution in one focused view."
        actions={<button onClick={() => toggleWatchlist(symbol)} disabled={!symbol} className={cn("inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-semibold", saved ? "border-brand-500/30 bg-brand-500/10 text-brand-500" : "border-[var(--line)] bg-[var(--panel)] text-[var(--text-muted)]")}><Star className={cn("size-4", saved && "fill-current")} /> {saved ? "Watching" : "Add to watchlist"}</button>}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="overflow-hidden p-5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><p className="text-xs text-[var(--text-muted)]">Latest market quote</p><p className="number-tabular mt-2 text-3xl font-semibold tracking-[-0.04em]">{price ? formatCurrency(price) : "—"}</p><p className="mt-2 text-sm text-[var(--text-muted)]">{quoteQuery.data?.currency ?? "Currency unavailable"}</p></div>
              <Badge tone={quoteQuery.isSuccess ? "positive" : "info"}><Clock3 className="mr-1 size-3" /> {quoteQuery.isLoading ? "Loading" : quoteQuery.isSuccess ? "Latest quote" : "Unavailable"}</Badge>
            </div>
            <div className="mt-6 border-t border-[var(--line)] pt-5">
              <div className="mb-3 flex justify-end"><RangePicker range={range} onChange={setRange} /></div>
              <TradingChart data={historyQuery.data?.candles ?? []} timeframe={RANGE_INTERVALS[range]} className="h-[420px]" />
            </div>
          </Card>

          <Card className="p-5 md:p-6">
            <SectionHeader title="Instrument information" description="Information derived from the selected exchange symbol" />
            <div className="grid gap-3 sm:grid-cols-3">
              {[[Building2, "Exchange", symbol.endsWith(".NS") ? "NSE" : "Unknown"], [Globe2, "Currency", quoteQuery.data?.currency ?? "—"], [TrendingUp, "History", "Yahoo Finance"]].map(([Icon, label, value]) => <div key={label} className="rounded-xl bg-[var(--panel-muted)] p-4"><Icon className="size-4 text-brand-500" /><p className="mt-4 text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>)}
            </div>
          </Card>
        </div>
        <div className="xl:sticky xl:top-24 xl:self-start"><OrderTicket symbol={symbol} /></div>
      </div>
    </div>
  );
}
