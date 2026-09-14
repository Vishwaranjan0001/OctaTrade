import { RefreshCw } from "lucide-react";

import { PageHeader } from "../../components/app/PageHeader.jsx";
import { Panel, PanelBody, PanelHeader } from "../../components/ui/Panel.jsx";
import { Metric } from "../../components/ui/Metric.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import {
  DataUnavailable,
  EmptyState,
  ErrorState,
  LoadingState
} from "../../components/ui/States.jsx";
import { AllocationDonut } from "../../components/charts/LazyCharts.jsx";
import { CoverageNotice } from "../../components/app/CoverageNotice.jsx";
import { usePortfolioValuation } from "../../hooks/queries.js";
import {
  EM_DASH,
  formatPaise,
  formatPaiseSigned,
  formatPercent,
  signOf
} from "../../lib/format.js";

/**
 * Analytics — measurable properties of the current portfolio.
 *
 * Purpose : report only what can be computed from data the API provides:
 *           concentration, per-position weight and contribution to profit or
 *           loss. Anything needing a price history — drawdown, volatility,
 *           benchmark comparison, win rate — is shown as explicitly
 *           unavailable rather than approximated.
 * Input   : none.
 * Output  : the analytics page.
 */
export default function Analytics() {
  const valuation = usePortfolioValuation();

  const priced = valuation.rows.filter((row) => row.marketValuePaise !== null);
  const total = valuation.marketValuePaise;

  /* Weights are only meaningful over the priced subset. */
  const weighted = priced
    .map((row) => ({
      ...row,
      weightPct: total && total > 0 ? (row.marketValuePaise / total) * 100 : null,
      contributionPct:
        valuation.pricedInvestedPaise && valuation.pricedInvestedPaise > 0
          ? (row.unrealisedPaise / valuation.pricedInvestedPaise) * 100
          : null
    }))
    .sort((a, b) => (b.weightPct ?? 0) - (a.weightPct ?? 0));

  const largest = weighted[0] ?? null;

  /* Herfindahl-style concentration: the sum of squared weights, expressed as a
     percentage. 100% means a single position; lower means better spread. */
  const concentration = weighted.length
    ? weighted.reduce((sum, row) => sum + ((row.weightPct ?? 0) / 100) ** 2, 0) * 100
    : null;

  const columns = [
    { key: "symbol", header: "Symbol", render: (row) => <span className="ot-mono">{row.symbol}</span> },
    {
      key: "weight",
      header: "Weight",
      numeric: true,
      render: (row) =>
        row.weightPct === null ? EM_DASH : formatPercent(row.weightPct, { digits: 1 })
    },
    {
      key: "value",
      header: "Market value",
      numeric: true,
      render: (row) => formatPaise(row.marketValuePaise)
    },
    {
      key: "pnl",
      header: "Unrealised P&L",
      numeric: true,
      render: (row) => (
        <span className={`ot-${signOf(row.unrealisedPaise)}`}>
          {formatPaiseSigned(row.unrealisedPaise)}
        </span>
      )
    },
    {
      key: "contribution",
      header: "Contribution to return",
      numeric: true,
      render: (row) =>
        row.contributionPct === null ? (
          EM_DASH
        ) : (
          <span className={`ot-${signOf(row.contributionPct)}`}>
            {formatPercent(row.contributionPct, { signed: true })}
          </span>
        )
    }
  ];

  return (
    <div className="ot-stack">
      <PageHeader
        title="Analytics"
        source="Portfolio + quotes"
        lede="Measures computed from your holdings and their current prices. Anything that needs price history is listed as unavailable rather than estimated."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={valuation.refetch}
            loading={valuation.isFetching}
            iconLeft={<RefreshCw size={14} aria-hidden="true" />}
          >
            Refresh
          </Button>
        }
      />

      <Panel>
        <div className="ot-metric-row">
          <Metric
            label="Positions priced"
            value={valuation.isLoading ? null : `${valuation.pricedCount} / ${valuation.totalCount}`}
            sub="Live quotes resolved"
            loading={valuation.isLoading}
          />
          <Metric
            label="Concentration"
            value={concentration === null ? EM_DASH : formatPercent(concentration, { digits: 1 })}
            sub="Sum of squared weights"
            hint="100% means the portfolio is a single position. Lower values indicate a wider spread."
            loading={valuation.isLoading}
          />
          <Metric
            label="Largest position"
            value={largest ? largest.symbol : EM_DASH}
            sub={
              largest && largest.weightPct !== null
                ? `${formatPercent(largest.weightPct, { digits: 1 })} of portfolio`
                : "Requires a live quote"
            }
            loading={valuation.isLoading}
          />
          <Metric
            label="Net return"
            value={
              valuation.returnPct === null
                ? EM_DASH
                : formatPercent(valuation.returnPct, { signed: true })
            }
            tone={valuation.returnPct === null ? null : signOf(valuation.returnPct)}
            sub="On priced cost basis"
            loading={valuation.isLoading}
          />
        </div>
      </Panel>

      <CoverageNotice
        pricedCount={valuation.pricedCount}
        totalCount={valuation.totalCount}
        unpricedSymbols={valuation.unpricedSymbols}
      />

      <div className="ot-grid ot-grid--primary">
        <Panel>
          <PanelHeader
            title="Position weights"
            description="Each position's share of portfolio value and its contribution to the overall return."
          />
          <DataTable
            caption="Positions with portfolio weight, market value, unrealised profit or loss and contribution to return."
            columns={columns}
            rows={weighted}
            rowKey={(row) => row.symbol}
            minWidth={780}
            loading={valuation.isLoading}
            loadingSlot={<LoadingState label="Loading analytics" rows={4} columns={5} />}
            errorSlot={
              valuation.error ? (
                <ErrorState error={valuation.error} subject="your analytics" onRetry={valuation.refetch} />
              ) : null
            }
            emptySlot={
              <EmptyState
                title="Nothing to analyse yet"
                description="Analytics need at least one position with a live quote. Place a paper order to get started."
              />
            }
          />
        </Panel>

        <Panel>
          <PanelHeader title="Allocation" />
          <PanelBody>
            <AllocationDonut rows={valuation.rows} basis="market" height={230} />
          </PanelBody>
        </Panel>
      </div>

      {/* Explicit statement of what cannot be computed, and why. */}
      <Panel>
        <PanelHeader
          title="Requires historical data"
          description="These measures are intentionally absent. Each needs a time series the OctaTrade API does not expose yet."
        />
        <PanelBody>
          <div className="ot-unavailable-grid">
            <DataUnavailable
              compact
              title="Return over time"
              description="Needs dated portfolio valuations."
              requirement="GET /api/portfolio/history"
            />
            <DataUnavailable
              compact
              title="Volatility and drawdown"
              description="Needs a daily value series for the account."
              requirement="GET /api/portfolio/history"
            />
            <DataUnavailable
              compact
              title="Benchmark comparison"
              description="Needs an index series to compare against."
              requirement="GET /api/history/:symbol for an index"
            />
            <DataUnavailable
              compact
              title="Realised P&L and win rate"
              description="Needs closed-trade records; orders alone do not carry realised results."
              requirement="Realised trade ledger on the orders API"
            />
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
