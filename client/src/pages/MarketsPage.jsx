import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useQueries } from "@tanstack/react-query";
import { ArrowRight, Clock3, Search, Star, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { Badge, Button, Card, EmptyState, Input, PageHeader, SectionHeader } from "@/components/ui";

export function MarketsPage() {
  const [symbolInput, setSymbolInput] = useState("");
  const navigate = useNavigate();
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
  const securities = watchlist.map((symbol, index) => ({
    symbol,
    quote: quoteQueries[index]?.data,
    loading: quoteQueries[index]?.isLoading
  }));

  const openSymbol = () => {
    const input = symbolInput.trim().toUpperCase();
    if (!input) return;
    const symbol = input.includes(".") ? input : input + ".NS";
    navigate("/stocks/" + encodeURIComponent(symbol));
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Market intelligence"
        title="Live quote board"
        description="Look up an exchange symbol and open it in the paper-trading terminal."
        actions={<Badge tone="positive"><Clock3 className="mr-1 size-3" /> Latest quote API</Badge>}
      />

      <Card className="p-5 md:p-6">
        <SectionHeader title="Find a security" description="Enter a Yahoo Finance-compatible NSE symbol, such as TCS.NS" />
        <div className="mt-5 flex max-w-xl gap-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input value={symbolInput} onChange={(event) => setSymbolInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && openSymbol()} placeholder="TCS.NS" className="pl-10" />
          </div>
          <Button onClick={openSymbol}>Open quote <ArrowRight className="size-4" /></Button>
        </div>
      </Card>

      <Card className="p-5 md:p-6">
        <SectionHeader title="Saved securities" description="Latest available prices for your watchlist" action={<Link to="/watchlist" className="text-xs font-semibold text-brand-500">Manage watchlist</Link>} />
        {securities.length ? <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {securities.map((stock) => (
            <div key={stock.symbol} className="rounded-2xl border border-[var(--line)] bg-[var(--panel-muted)]/45 p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-500/10 text-xs font-bold text-brand-500">{stock.symbol.slice(0, 2)}</span>
                <div className="min-w-0 flex-1"><p className="text-xs font-semibold">{stock.symbol}</p><p className="mt-1 text-[10px] text-[var(--text-muted)]">{stock.quote?.currency ?? "Currency unavailable"}</p></div>
                <button onClick={() => toggleWatchlist(stock.symbol)} className={cn("grid size-8 place-items-center rounded-lg bg-brand-500/10 text-brand-500")} aria-label="Remove from watchlist"><Star className="size-3.5 fill-current" /></button>
              </div>
              <p className="number-tabular mt-6 text-2xl font-semibold">{stock.loading ? "Loading…" : stock.quote?.price ? formatCurrency(stock.quote.price) : "Quote unavailable"}</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link to={"/stocks/" + encodeURIComponent(stock.symbol)} className="flex h-9 items-center justify-center rounded-lg border border-[var(--line)] text-[10px] font-semibold text-[var(--text-muted)]">Details</Link>
                <Link to={"/trade?symbol=" + encodeURIComponent(stock.symbol)} className="flex h-9 items-center justify-center gap-1 rounded-lg bg-brand-500/10 text-[10px] font-semibold text-brand-500">Trade <ArrowRight className="size-3" /></Link>
              </div>
            </div>
          ))}
        </div> : <EmptyState icon={<TrendingUp className="size-5" />} title="Your watchlist is empty" description="Add a symbol to start requesting current quotes." action={<Link to="/watchlist"><Button>Add a symbol</Button></Link>} />}
      </Card>
    </div>
  );
}
