import { RefreshCw } from "lucide-react";

import { PageHeader } from "../../components/app/PageHeader.jsx";
import { AllocationDonut, PortfolioSeriesChart } from "../../components/charts/LazyCharts.jsx";
import { Panel, PanelBody, PanelHeader } from "../../components/ui/Panel.jsx";
import { Metric } from "../../components/ui/Metric.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { HoldingsTable } from "../../components/app/HoldingsTable.jsx";
import { CoverageNotice } from "../../components/app/CoverageNotice.jsx";
import { usePortfolioValuation } from "../../hooks/queries.js";
import {
  formatPaise,
  formatPaiseSigned,
  formatPercent,
  signOf
} from "../../lib/format.js";

/**
 * Portfolio — composition and valuation.
 *
 * Purpose : show what the account owns, what it cost, what it is worth now and
 *           how it is distributed. Cost figures are exact (from the API);
 *           valuation figures are derived from live quotes and are labelled
 *           with their coverage so a partial total is never read as complete.
 * Input   : none.
 * Output  : the portfolio page.
 */
export default function Portfolio() {
  const valuation = usePortfolioValuation();

  return (
    <div className="ot-stack">
      <PageHeader
        title="Portfolio"
        source="GET /api/portfolio + quotes"
        lede="Holdings are stored as quantity and average cost in paise. Market value is calculated in the browser from the latest quote for each symbol."
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
            label="Market value"
            value={
              valuation.marketValuePaise === null
                ? "Not priced"
                : formatPaise(valuation.marketValuePaise)
            }
            sub={`${valuation.pricedCount} of ${valuation.totalCount} positions priced`}
            size="lg"
            loading={valuation.isLoading}
          />
          <Metric
            label="Invested"
            value={formatPaise(valuation.investedPaise)}
            sub="Total cost basis"
            size="lg"
            loading={valuation.isLoading}
          />
          <Metric
            label="Unrealised P&L"
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
          <Metric
            label="Return"
            value={
              valuation.returnPct === null
                ? "Not priced"
                : formatPercent(valuation.returnPct, { signed: true })
            }
            tone={valuation.returnPct === null ? null : signOf(valuation.returnPct)}
            sub="Against priced cost"
            loading={valuation.isLoading}
          />
        </div>
      </Panel>

      <CoverageNotice
        pricedCount={valuation.pricedCount}
        totalCount={valuation.totalCount}
        unpricedSymbols={valuation.unpricedSymbols}
      />

      {/* Full width: nine columns of cost and valuation need the whole measure,
          otherwise the right-hand P&L columns are pushed out of view. */}
      <Panel>
        <PanelHeader
          title="Holdings"
          meta={`${valuation.totalCount} position${valuation.totalCount === 1 ? "" : "s"}`}
        />
        <HoldingsTable
          rows={valuation.rows}
          loading={valuation.isLoading}
          error={valuation.error}
          onRetry={valuation.refetch}
        />
      </Panel>

      <div className="ot-grid ot-grid--2">
        <Panel>
          <PanelHeader title="Allocation" description="By current market value." />
          <PanelBody>
            <AllocationDonut rows={valuation.rows} basis="market" height={240} />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Value over time"
            description="A real valuation history requires dated portfolio snapshots from the backend."
          />
          <PanelBody>
            {/* Deliberately passed an empty series: no snapshot endpoint exists,
                and a curve must never be synthesised from the current value. */}
            <PortfolioSeriesChart series={[]} height={240} />
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
