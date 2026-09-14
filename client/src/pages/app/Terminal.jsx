import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search } from "lucide-react";

import { PageHeader } from "../../components/app/PageHeader.jsx";
import { Panel, PanelBody, PanelHeader } from "../../components/ui/Panel.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { TextField } from "../../components/ui/Field.jsx";
import { Metric } from "../../components/ui/Metric.jsx";
import { EmptyState, ErrorState } from "../../components/ui/States.jsx";
import { QuoteBlock } from "../../components/app/QuoteBlock.jsx";
import { OrderTicket } from "../../components/app/OrderTicket.jsx";
import { OrdersTable } from "../../components/app/OrdersTable.jsx";
import { WatchlistToggle } from "../../components/app/WatchlistToggle.jsx";
import { CandleChart } from "../../components/charts/LazyCharts.jsx";
import {
  useHoldings,
  useOrders,
  useQuote,
  useWallet
} from "../../hooks/queries.js";
import { useRecentSymbolsStore } from "../../store/recentSymbolsStore.js";
import { useWatchlistStore } from "../../store/watchlistStore.js";
import { formatPaise, normaliseSymbol } from "../../lib/format.js";

const schema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Enter a symbol")
    .max(20, "Symbols are at most 20 characters")
});

/**
 * Terminal — the trading desk.
 *
 * Purpose : the one surface where an order is actually placed. It brings
 *           together symbol selection, the live quote, the account's real
 *           buying power and held quantity, the order ticket, and the live
 *           blotter, so the consequences of an order are visible in one view.
 * Input   : optional :symbol route param.
 * Output  : real orders submitted through POST /api/orders.
 */
export default function Terminal() {
  const params = useParams();
  const navigate = useNavigate();

  const routeSymbol = normaliseSymbol(params.symbol || "");
  const [symbol, setSymbol] = useState(routeSymbol);

  const record = useRecentSymbolsStore((state) => state.record);
  const recent = useRecentSymbolsStore((state) => state.symbols);
  const watchlist = useWatchlistStore((state) => state.symbols);

  const wallet = useWallet();
  const holdings = useHoldings();
  const orders = useOrders();
  const quote = useQuote(symbol, { enabled: Boolean(symbol) });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { symbol: routeSymbol }
  });

  /* Keep local state, the form and the URL in step when the route changes. */
  useEffect(() => {
    if (routeSymbol && routeSymbol !== symbol) {
      setSymbol(routeSymbol);
      setValue("symbol", routeSymbol);
    }
  }, [routeSymbol, symbol, setValue]);

  useEffect(() => {
    if (symbol) record(symbol);
  }, [symbol, record]);

  /**
   * Selects a symbol to trade.
   * Input  : a raw symbol string. Output: updates state and the URL so the
   *          terminal is linkable and the browser back button works.
   */
  function selectSymbol(next) {
    const normalised = normaliseSymbol(next);
    if (!normalised) return;
    setSymbol(normalised);
    setValue("symbol", normalised);
    navigate(`/terminal/${encodeURIComponent(normalised)}`, { replace: true });
  }

  /* The real quantity held, used to bound SELL orders. */
  const heldQuantity =
    (holdings.data ?? []).find(
      (holding) => normaliseSymbol(holding.symbol) === symbol
    )?.quantity ?? 0;

  const symbolOrders = (orders.data ?? []).filter(
    (order) => normaliseSymbol(order.symbol) === symbol
  );

  /* Quick-pick list: what the user watches or has recently viewed. Real
     symbols the user chose — never a suggested or invented instrument list. */
  const quickPicks = Array.from(new Set([...watchlist, ...recent])).slice(0, 10);

  return (
    <div className="ot-stack">
      <PageHeader
        title="Terminal"
        source="Quotes · Wallet · Portfolio · Orders"
        lede="Place paper orders against live quotes. Quantity is validated against your actual buying power and holdings before the order is sent."
        actions={symbol ? <WatchlistToggle symbol={symbol} /> : null}
      />

      <div className="ot-terminal">
        {/* Left: instrument + chart. */}
        <div className="ot-terminal__main ot-stack">
          <Panel>
            <PanelHeader
              title="Instrument"
              meta={symbol || "None selected"}
              actions={
                symbol ? (
                  <Button
                    as={Link}
                    to={`/markets/${encodeURIComponent(symbol)}`}
                    variant="ghost"
                    size="sm"
                  >
                    Security details
                  </Button>
                ) : null
              }
            />
            <PanelBody>
              <form
                className="ot-terminal__symbol-form"
                onSubmit={handleSubmit((values) => selectSymbol(values.symbol))}
                noValidate
              >
                <TextField
                  label="Symbol"
                  placeholder="TCS.NS"
                  autoComplete="off"
                  spellCheck="false"
                  autoCapitalize="characters"
                  error={errors.symbol?.message}
                  inputClassName="ot-input--symbol"
                  {...register("symbol")}
                />
                <Button type="submit" iconLeft={<Search size={15} aria-hidden="true" />}>
                  Load
                </Button>
              </form>

              {quickPicks.length > 0 ? (
                <div className="ot-recent" style={{ marginTop: 16 }}>
                  <div className="ot-recent__head">
                    <span className="ot-label">Your symbols</span>
                  </div>
                  <ul className="ot-recent__list">
                    {quickPicks.map((entry) => (
                      <li key={entry}>
                        <button
                          type="button"
                          className={`ot-recent__chip ot-mono ${entry === symbol ? "is-active" : ""}`}
                          onClick={() => selectSymbol(entry)}
                          aria-current={entry === symbol ? "true" : undefined}
                        >
                          {entry}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {symbol ? (
                <div className="ot-terminal__quote">
                  {quote.error ? (
                    <ErrorState
                      error={quote.error}
                      subject={`the quote for ${symbol}`}
                      onRetry={quote.refetch}
                      compact
                    />
                  ) : (
                    <QuoteBlock symbol={symbol} query={quote} size="lg" />
                  )}
                </div>
              ) : null}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Chart" meta={symbol || "—"} />
            <PanelBody>
              <CandleChart
                candles={[]}
                symbol={symbol}
                currency={quote.data?.currency ?? "INR"}
                height={340}
              />
            </PanelBody>
          </Panel>
        </div>

        {/* Right: the order ticket and account context. */}
        <div className="ot-terminal__side ot-stack">
          <Panel>
            <PanelHeader
              title="Order ticket"
              meta="Market"
              description={
                symbol
                  ? undefined
                  : "Select a symbol to enable the ticket."
              }
            />
            <PanelBody>
              {!symbol ? (
                <EmptyState
                  compact
                  icon={Search}
                  title="No instrument loaded"
                  description="Enter a symbol above to fetch its live quote and enable the ticket."
                />
              ) : (
                <OrderTicket
                  symbol={symbol}
                  quote={quote.data}
                  quoteError={quote.error}
                  isQuoteLoading={quote.isLoading}
                  wallet={wallet.data}
                  heldQuantity={heldQuantity}
                />
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Account" />
            <PanelBody>
              {wallet.error ? (
                <ErrorState error={wallet.error} subject="your wallet" onRetry={wallet.refetch} compact />
              ) : (
                <div className="ot-detail-metrics">
                  <Metric
                    label="Buying power"
                    value={formatPaise(wallet.data?.availableBalancePaise)}
                    loading={wallet.isLoading}
                  />
                  <Metric
                    label="Reserved"
                    value={formatPaise(wallet.data?.reservedBalancePaise)}
                    tone={wallet.data?.reservedBalancePaise ? "reserved" : null}
                    loading={wallet.isLoading}
                  />
                </div>
              )}
            </PanelBody>
          </Panel>
        </div>
      </div>

      <Panel>
        <PanelHeader
          title={symbol ? `Recent orders — ${symbol}` : "Recent orders"}
          meta={`${symbolOrders.length} shown`}
          actions={
            <Button as={Link} to="/orders" variant="ghost" size="sm">
              All orders
            </Button>
          }
        />
        <OrdersTable
          rows={symbol ? symbolOrders : (orders.data ?? [])}
          limit={8}
          loading={orders.isLoading}
          error={orders.error}
          onRetry={orders.refetch}
          compact
          emptyDescription={
            symbol
              ? `No orders for ${symbol} yet. Your first order will appear here immediately after it is submitted.`
              : "Orders appear here as soon as they are submitted."
          }
        />
      </Panel>
    </div>
  );
}
