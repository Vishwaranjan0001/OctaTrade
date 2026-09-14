import { Link } from "react-router-dom";
import { ListOrdered } from "lucide-react";
import { DataTable } from "../ui/DataTable.jsx";
import { EmptyState, ErrorState, LoadingState } from "../ui/States.jsx";
import { SideMark, StatusMark } from "../ui/Status.jsx";
import { Button } from "../ui/Button.jsx";
import {
  EM_DASH,
  formatDateTime,
  formatPaise,
  formatQty,
  shortId
} from "../../lib/format.js";

/**
 * OrdersTable — the order blotter.
 *
 * Purpose : render real orders from GET /api/orders for the dashboard, the
 *           orders page and the terminal. Every column maps to a field the API
 *           returns; where a field is absent (an unfilled order has no
 *           execution price) an em dash is shown rather than a guess.
 * Input   : rows, loading, error, onRetry, limit, compact, showSymbolLink.
 * Output  : the table or the matching state.
 */
export function OrdersTable({
  rows = [],
  loading = false,
  error = null,
  onRetry,
  limit,
  compact = false,
  emptyDescription = "Orders you place appear here with their status and execution details."
}) {
  const visible = typeof limit === "number" ? rows.slice(0, limit) : rows;

  const columns = [
    {
      key: "placed",
      header: "Placed",
      render: (row) => (
        <span className="ot-cell-stack">
          <span>{formatDateTime(row.createdAt ?? row.placedAt)}</span>
          <span className="ot-cell-sub ot-mono">{shortId(row._id ?? row.id)}</span>
        </span>
      )
    },
    {
      key: "symbol",
      header: "Symbol",
      render: (row) => (
        <Link
          className="ot-cell-link ot-mono"
          to={`/markets/${encodeURIComponent(row.symbol)}`}
        >
          {row.symbol}
        </Link>
      )
    },
    { key: "side", header: "Side", render: (row) => <SideMark side={row.side} /> },
    {
      key: "quantity",
      header: "Qty",
      numeric: true,
      render: (row) => formatQty(row.quantity)
    },
    {
      key: "price",
      header: "Exec price",
      numeric: true,
      render: (row) => {
        const price = row.executedPricePaise ?? row.requestedPricePaise ?? null;
        return price === null ? <span className="ot-cell-muted">{EM_DASH}</span> : formatPaise(price);
      }
    },
    {
      key: "value",
      header: "Value",
      numeric: true,
      render: (row) =>
        row.totalValuePaise === null || row.totalValuePaise === undefined ? (
          <span className="ot-cell-muted">{EM_DASH}</span>
        ) : (
          formatPaise(row.totalValuePaise)
        )
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span className="ot-cell-stack">
          <StatusMark status={row.status} />
          {row.rejectionReason ? (
            <span className="ot-cell-sub" title={row.rejectionReason}>
              {row.rejectionReason}
            </span>
          ) : null}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      srOnlyHeader: true,
      render: (row) => (
        <Button
          as={Link}
          to={`/orders/${encodeURIComponent(row._id ?? row.id)}`}
          variant="ghost"
          size="sm"
        >
          Details
        </Button>
      )
    }
  ];

  return (
    <DataTable
      caption="Orders with placement time, symbol, side, quantity, execution price, value and status."
      columns={columns}
      rows={visible}
      compact={compact}
      minWidth={900}
      loading={loading}
      loadingSlot={loading ? <LoadingState label="Loading orders" rows={4} columns={6} /> : null}
      errorSlot={
        error ? <ErrorState error={error} subject="your orders" onRetry={onRetry} /> : null
      }
      emptySlot={
        <EmptyState
          icon={ListOrdered}
          title="No orders yet"
          description={emptyDescription}
          action={
            <Button as={Link} to="/terminal" size="sm">
              Open the terminal
            </Button>
          }
        />
      }
    />
  );
}
