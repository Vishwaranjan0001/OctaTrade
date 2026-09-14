import { Link } from "react-router-dom";
import { PieChart } from "lucide-react";
import { DataTable } from "../ui/DataTable.jsx";
import { EmptyState, ErrorState, InlineLoader, LoadingState } from "../ui/States.jsx";
import { Button } from "../ui/Button.jsx";
import {
  EM_DASH,
  formatPaise,
  formatPaiseSigned,
  formatPercent,
  formatQty,
  signOf
} from "../../lib/format.js";

/**
 * HoldingsTable — the account's positions.
 *
 * Purpose : one table for both /portfolio and /positions. Cost columns come
 *           straight from GET /api/portfolio; market value, P&L and return are
 *           shown per row ONLY where a live quote resolved, and render as an
 *           em dash with an explicit note otherwise.
 * Input   : rows (from usePortfolioValuation), loading, error, onRetry,
 *           showActions.
 * Output  : the table, or the matching state.
 */
export function HoldingsTable({
  rows = [],
  loading = false,
  error = null,
  onRetry,
  showActions = true,
  compact = false
}) {
  const columns = [
    {
      key: "symbol",
      header: "Symbol",
      render: (row) => (
        <Link className="ot-cell-link ot-mono" to={`/markets/${encodeURIComponent(row.symbol)}`}>
          {row.symbol}
        </Link>
      )
    },
    {
      key: "quantity",
      header: "Qty",
      numeric: true,
      render: (row) => formatQty(row.quantity)
    },
    {
      key: "avg",
      header: "Avg cost",
      numeric: true,
      render: (row) => formatPaise(row.averageBuyPricePaise)
    },
    {
      key: "invested",
      header: "Invested",
      numeric: true,
      render: (row) => formatPaise(row.investedPaise)
    },
    {
      key: "last",
      header: "Last price",
      numeric: true,
      render: (row) =>
        row.isQuoteLoading ? (
          <InlineLoader label={`Loading quote for ${row.symbol}`} />
        ) : row.lastPricePaise === null ? (
          <span className="ot-cell-muted" title="Live quote unavailable">
            {EM_DASH}
          </span>
        ) : (
          formatPaise(row.lastPricePaise)
        )
    },
    {
      key: "value",
      header: "Market value",
      numeric: true,
      render: (row) =>
        row.marketValuePaise === null ? (
          <span className="ot-cell-muted">{EM_DASH}</span>
        ) : (
          formatPaise(row.marketValuePaise)
        )
    },
    {
      key: "pnl",
      header: "Unrealised P&L",
      numeric: true,
      render: (row) =>
        row.unrealisedPaise === null ? (
          <span className="ot-cell-muted">{EM_DASH}</span>
        ) : (
          <span className={`ot-${signOf(row.unrealisedPaise)}`}>
            {formatPaiseSigned(row.unrealisedPaise)}
          </span>
        )
    },
    {
      key: "return",
      header: "Return",
      numeric: true,
      render: (row) =>
        row.returnPct === null ? (
          <span className="ot-cell-muted">{EM_DASH}</span>
        ) : (
          <span className={`ot-${signOf(row.returnPct)}`}>
            {formatPercent(row.returnPct, { signed: true })}
          </span>
        )
    }
  ];

  if (showActions) {
    columns.push({
      key: "actions",
      header: "Actions",
      align: "right",
      srOnlyHeader: true,
      render: (row) => (
        <div className="ot-cell-actions">
          <Button as={Link} to={`/terminal/${encodeURIComponent(row.symbol)}`} variant="secondary" size="sm">
            Trade
          </Button>
        </div>
      )
    });
  }

  return (
    <DataTable
      caption="Holdings with quantity, average cost, invested amount and, where a live quote is available, market value and unrealised profit or loss."
      columns={columns}
      rows={rows}
      compact={compact}
      minWidth={940}
      loading={loading}
      loadingSlot={loading ? <LoadingState label="Loading holdings" rows={4} columns={6} /> : null}
      errorSlot={
        error ? <ErrorState error={error} subject="your holdings" onRetry={onRetry} /> : null
      }
      emptySlot={
        <EmptyState
          icon={PieChart}
          title="No positions yet"
          description="Holdings appear here after your first filled buy order. Find a security in Markets, then place a paper order from the terminal."
          action={
            <Button as={Link} to="/markets" size="sm">
              Find a security
            </Button>
          }
        />
      }
    />
  );
}
