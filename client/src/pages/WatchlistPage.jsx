import { useState } from "react";
import { Link } from "react-router";
import { useQueries } from "@tanstack/react-query";
import { ArrowRight, Plus, Search, Star, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { Badge, Button, Card, EmptyState, Input, PageHeader } from "@/components/ui";

export function WatchlistPage() {
  const [query, setQuery] = useState("");
  const [newSymbol, setNewSymbol] = useState("");
  const [adding, setAdding] = useState(false);
  const watchlist = useAppStore((state) => state.watchlist);
  const toggleWatchlist = useAppStore((state) => state.toggleWatchlist);
  const quoteQueries = useQueries({
    queries: watchlist.map((symbol) => ({
      queryKey: ["quote", symbol],
      queryFn: () => api.quote(symbol),
      retry: 1,
      staleTime: 15_000
    }))
  });
  const normalizedQuery = query.trim().toLowerCase();
  const visibleStocks = watchlist
    .map((symbol, index) => ({ symbol, quote: quoteQueries[index]?.data, loading: quoteQueries[index]?.isLoading }))
    .filter((stock) => stock.symbol.toLowerCase().includes(normalizedQuery));

  const addSymbol = () => {
    const input = newSymbol.trim().toUpperCase();
    if (!input) return;
    const symbol = input.includes(".") ? input : input + ".NS";
    if (!watchlist.includes(symbol)) toggleWatchlist(symbol);
    setNewSymbol("");
    setAdding(false);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Personal market"
        title="Watchlist"
        description="Keep the securities you care about together and move from observation to a paper trade in one step."
        actions={<Button onClick={() => setAdding((value) => !value)} variant={adding ? "secondary" : "primary"}><Plus className="size-4" /> {adding ? "Cancel" : "Add symbol"}</Button>}
      />

      {adding ? <Card className="p-5">
        <p className="text-sm font-semibold">Add an NSE symbol</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">For example, enter TCS or TCS.NS.</p>
        <div className="mt-4 flex gap-2">
          <Input value={newSymbol} onChange={(event) => setNewSymbol(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addSymbol()} placeholder="Symbol" />
          <Button onClick={addSymbol}>Add</Button>
        </div>
      </Card> : null}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[var(--line)] p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <div className="flex items-center gap-2"><h2 className="text-base font-semibold">My securities</h2><Badge tone="positive">Latest quotes</Badge></div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{watchlist.length} securities saved</p>
          </div>
          <div className="relative md:w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter symbols" className="pl-10" />
          </div>
        </div>

        {visibleStocks.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="bg-[var(--panel-muted)]/60 text-[9px] tracking-[0.12em] text-[var(--text-muted)] uppercase">
                <tr><th className="px-5 py-3">Security</th><th className="px-5 py-3">Latest price</th><th className="px-5 py-3">Currency</th><th className="px-5 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {visibleStocks.map((stock) => {
                  const saved = watchlist.includes(stock.symbol);
                  return (
                    <tr key={stock.symbol} className="border-b border-[var(--line)] transition hover:bg-brand-500/[0.035]">
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-brand-500/10 text-xs font-bold text-brand-500">{stock.symbol.slice(0, 2)}</span><p className="font-semibold">{stock.symbol}</p></div></td>
                      <td className="number-tabular px-5 py-4 font-semibold">{stock.loading ? "Loading…" : stock.quote?.price ? formatCurrency(stock.quote.price) : "Unavailable"}</td>
                      <td className="px-5 py-4 text-[var(--text-muted)]">{stock.quote?.currency ?? "—"}</td>
                      <td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => toggleWatchlist(stock.symbol)} className={cn("grid size-9 place-items-center rounded-lg border border-[var(--line)]", saved ? "bg-brand-500/10 text-brand-500" : "text-[var(--text-muted)]")} aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}><Star className={cn("size-4", saved && "fill-current")} /></button><Link to={"/trade?symbol=" + encodeURIComponent(stock.symbol)} className="inline-flex h-9 items-center gap-1 rounded-lg bg-brand-500/10 px-3 font-semibold text-brand-500">Trade <ArrowRight className="size-3" /></Link></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<TrendingUp className="size-5" />} title="No securities here" description="Add a symbol to build your watchlist." action={<Button onClick={() => setAdding(true)}>Add a symbol</Button>} />
        )}
      </Card>
    </div>
  );
}
