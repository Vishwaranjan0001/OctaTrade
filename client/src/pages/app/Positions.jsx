import { RefreshCw } from "lucide-react";

import { PageHeader } from "../../components/app/PageHeader.jsx";
import { Panel, PanelHeader } from "../../components/ui/Panel.jsx";
import { Metric } from "../../components/ui/Metric.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { HoldingsTable } from "../../components/app/HoldingsTable.jsx";
import { CoverageNotice } from "../../components/app/CoverageNotice.jsx";
import { usePortfolioValuation } from "../../hooks/queries.js";
import { formatPaise, formatPaiseSigned, signOf } from "../../lib/format.js";

/**
 * Positions — the working list of open positions.
 *
 * Purpose : the operational view of the same holdings the portfolio page
 *           summarises: every position with its live price, its profit or loss,
 *           and a direct route to trade it. Winners and losers are separated so
 *           the list can be read without scanning every row.
 * Input   : none.
 * Output  : the positions page.
 */
export default function Positions() {
  const valuation = usePortfolioValuation();

  const priced = valuation.rows.filter((row) => row.unrealisedPaise !== null);
  const gainers = priced.filter((row) => row.unrealisedPaise > 0);
  const losers = priced.filter((row) => row.unrealisedPaise < 0);

  /* Best and worst are only meaningful once something is priced. */
  const best = gainers.length
    ? gainers.reduce((top, row) => (row.unrealisedPaise > top.unrealisedPaise ? row : top))
    : null;
  const worst = losers.length
    ? losers.reduce((low, row) => (row.unrealisedPaise < low.unrealisedPaise ? row : low))
    : null;

  return (
    <div className="ot-stack">
      <PageHeader
        title="Positions"
        source="GET /api/portfolio + quotes"
        lede="Each open position with its live valuation. Positions are created and closed by filled orders — they cannot be edited directly."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={valuation.refetch}
            loading={valuation.isFetching}
            iconLeft={<RefreshCw size={14} aria-hidden="true" />}
          >
            Refresh quotes
          </Button>
        }
      />

      <Panel>
        <div className="ot-metric-row">
          <Metric
            label="Open positions"
            value={valuation.isLoading ? null : String(valuation.totalCount)}
            sub={`${valuation.pricedCount} priced live`}
            loading={valuation.isLoading}
          />
          <Metric
            label="In profit"
            value={valuation.isLoading ? null : String(gainers.length)}
            tone={gainers.length ? "pos" : null}
            sub="Positions above cost"
            loading={valuation.isLoading}
          />
          <Metric
            label="In loss"
            value={valuation.isLoading ? null : String(losers.length)}
            tone={losers.length ? "neg" : null}
            sub="Positions below cost"
            loading={valuation.isLoading}
          />
          <Metric
            label="Net unrealised"
            value={
              valuation.unrealisedPaise === null
                ? "Not priced"
                : formatPaiseSigned(valuation.unrealisedPaise)
            }
            tone={
              valuation.unrealisedPaise === null ? null : signOf(valuation.unrealisedPaise)
            }
            loading={valuation.isLoading}
          />
        </div>
      </Panel>

      <CoverageNotice
        pricedCount={valuation.pricedCount}
        totalCount={valuation.totalCount}
        unpricedSymbols={valuation.unpricedSymbols}
      />

      {best || worst ? (
        <div className="ot-grid ot-grid--2">
          {best ? (
            <Panel>
              <PanelHeader title="Largest gain" meta={best.symbol} />
              <div className="ot-metric-row">
                <Metric
                  label="Unrealised"
                  value={formatPaiseSigned(best.unrealisedPaise)}
                  tone="pos"
                />
                <Metric label="Market value" value={formatPaise(best.marketValuePaise)} />
              </div>
            </Panel>
          ) : null}
          {worst ? (
            <Panel>
              <PanelHeader title="Largest loss" meta={worst.symbol} />
              <div className="ot-metric-row">
                <Metric
                  label="Unrealised"
                  value={formatPaiseSigned(worst.unrealisedPaise)}
                  tone="neg"
                />
                <Metric label="Market value" value={formatPaise(worst.marketValuePaise)} />
              </div>
            </Panel>
          ) : null}
        </div>
      ) : null}

      <Panel>
        <PanelHeader
          title="All positions"
          meta={`${valuation.totalCount} open`}
        />
        <HoldingsTable
          rows={valuation.rows}
          loading={valuation.isLoading}
          error={valuation.error}
          onRetry={valuation.refetch}
        />
      </Panel>
    </div>
  );
}
