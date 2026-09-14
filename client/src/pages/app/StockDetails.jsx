import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, ArrowRight, CandlestickChart } from "lucide-react";

import { PageHeader } from "../../components/app/PageHeader.jsx";
import { Panel, PanelBody, PanelHeader } from "../../components/ui/Panel.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Metric } from "../../components/ui/Metric.jsx";
import { EmptyState, ErrorState } from "../../components/ui/States.jsx";
import { QuoteBlock } from "../../components/app/QuoteBlock.jsx";
import { WatchlistToggle } from "../../components/app/WatchlistToggle.jsx";
import { OrdersTable } from "../../components/app/OrdersTable.jsx";
import { CandleChart } from "../../components/charts/LazyCharts.jsx";
import {
  useOrders,
  usePortfolioValuation,
  useQuote
} from "../../hooks/queries.js";
import { useRecentSymbolsStore } from "../../store/recentSymbolsStore.js";
import {
  EM_DASH,
  formatPaise,
  formatPaiseSigned,
  formatPercent,
  formatQty,
  normaliseSymbol,
  signOf
} from "../../lib/format.js";

/**
 * StockDetails — everything the account knows about one security.
 *
 * Purpose : bring the live quote, the user's own position in that symbol and
 *           their order history for it onto one page. The chart area is a real
 *           TradingView chart that renders an explicit unavailable state,
 *           because the API has no historical series to draw.
 * Input   : :symbol route param.
 * Output  : the security page.
 */
export default function StockDetails() {
  const params = useParams();
  const symbol = normaliseSymbol(params.symbol || "");

  const quote = useQuote(symbol, { enabled: Boolean(symbol) });
  const valuation = usePortfolioValuation();
  const orders = useOrders();
  const record = useRecentSymbolsStore((state) => state.record);

  useEffect(() => {
    if (symbol) record(symbol);
  }, [symbol, record]);

  useEffect(() => {
    if (symbol) document.title = `${symbol} — OctaTrade`;
  }, [symbol]);

  const position = valuation.rows.find((row) => row.symbol === symbol) || null;

  const symbolOrders = (orders.data ?? []).filter(
    (order) => normaliseSymbol(order.symbol) === symbol
  );

  if (!symbol) {
    return (
      <Panel>
        <EmptyState
          title="No symbol supplied"
          description="Open this page from Markets or the watchlist."
          action={
            <Button as={Link} to="/markets" size="sm">
              Go to markets
            </Button>
          }
        />
      </Panel>
    );
  }

  return (
    <div className="ot-stack">
      <PageHeader
        title={symbol}
        source="Quotes · Portfolio · Orders"
        lede="Live quote, your position in this security and every order you have placed against it."
        actions={
          <>
            <Button as={Link} to="/markets" variant="ghost" size="sm" iconLeft={<ArrowLeft size={14} aria-hidden="true" />}>
              Markets
            </Button>
            <WatchlistToggle symbol={symbol} />
            <Button
              as={Link}
              to={`/terminal/${encodeURIComponent(symbol)}`}
              size="sm"
              iconRight={<ArrowRight size={14} aria-hidden="true" />}
            >
              Trade
            </Button>
          </>
        }
      />

      <div className="ot-grid ot-grid--primary">
        <div className="ot-stack">
          <Panel>
            <PanelHeader
              title="Price history"
              meta="OHLC"
              description="Candles and volume render here once a historical-price endpoint is connected."
            />
            <PanelBody>
              {/* The chart validates and renders real candles only. With no
                  series available it states what is missing. */}
              <CandleChart
                candles={[]}
                symbol={symbol}
                currency={quote.data?.currency ?? "INR"}
                height={360}
              />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Your orders for this symbol"
              meta={`${symbolOrders.length} order${symbolOrders.length === 1 ? "" : "s"}`}
            />
            <OrdersTable
              rows={symbolOrders}
              loading={orders.isLoading}
              error={orders.error}
              onRetry={orders.refetch}
              compact
              emptyDescription={`You have not placed any orders for ${symbol} yet.`}
            />
          </Panel>
        </div>

        <div className="ot-stack">
          <Panel>
            <PanelHeader title="Latest quote" />
            <PanelBody>
              {quote.error ? (
                <ErrorState
                  error={quote.error}
                  subject={`the quote for ${symbol}`}
                  onRetry={quote.refetch}
                />
              ) : (
                <QuoteBlock symbol={symbol} query={quote} size="lg" />
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Your position"
              meta={position ? "Held" : "None"}
            />
            <PanelBody>
              {valuation.error ? (
                <ErrorState error={valuation.error} subject="your holdings" onRetry={valuation.refetch} />
              ) : !position ? (
                <EmptyState
                  compact
                  icon={CandlestickChart}
                  title={`You hold no ${symbol}`}
                  description="A position appears here after a buy order for this symbol fills."
                  action={
                    <Button as={Link} to={`/terminal/${encodeURIComponent(symbol)}`} size="sm">
                      Place an order
                    </Button>
                  }
                />
              ) : (
                <>
                  <div className="ot-detail-metrics">
                    <Metric
                      label="Quantity"
                      value={formatQty(position.quantity)}
                      loading={valuation.isLoading}
                    />
                    <Metric
                      label="Average cost"
                      value={formatPaise(position.averageBuyPricePaise)}
                      loading={valuation.isLoading}
                    />
                  </div>

                  <dl className="ot-kv" style={{ marginTop: 14 }}>
                    <div className="ot-kv__row">
                      <dt className="ot-kv__key">Invested</dt>
                      <dd className="ot-kv__val">{formatPaise(position.investedPaise)}</dd>
                    </div>
                    <div className="ot-kv__row">
                      <dt className="ot-kv__key">Market value</dt>
                      <dd className="ot-kv__val">
                        {position.marketValuePaise === null
                          ? EM_DASH
                          : formatPaise(position.marketValuePaise)}
                      </dd>
                    </div>
                    <div className="ot-kv__row">
                      <dt className="ot-kv__key">Unrealised P&L</dt>
                      <dd
                        className={`ot-kv__val ${
                          position.unrealisedPaise === null
                            ? ""
                            : `ot-kv__val--${signOf(position.unrealisedPaise)}`
                        }`}
                      >
                        {position.unrealisedPaise === null
                          ? EM_DASH
                          : formatPaiseSigned(position.unrealisedPaise)}
                      </dd>
                    </div>
                    <div className="ot-kv__row">
                      <dt className="ot-kv__key">Return</dt>
                      <dd
                        className={`ot-kv__val ${
                          position.returnPct === null
                            ? ""
                            : `ot-kv__val--${signOf(position.returnPct)}`
                        }`}
                      >
                        {position.returnPct === null
                          ? EM_DASH
                          : formatPercent(position.returnPct, { signed: true })}
                      </dd>
                    </div>
                  </dl>
                </>
              )}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
