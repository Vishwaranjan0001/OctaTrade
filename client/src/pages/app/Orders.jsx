import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { PageHeader } from "../../components/app/PageHeader.jsx";
import { Panel, PanelHeader } from "../../components/ui/Panel.jsx";
import { Metric } from "../../components/ui/Metric.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { SegmentedControl } from "../../components/ui/Field.jsx";
import { OrdersTable } from "../../components/app/OrdersTable.jsx";
import { useOrders } from "../../hooks/queries.js";

/**
 * Orders — the full order blotter.
 *
 * Purpose : every order the account has placed, filterable by side and status.
 *           Counts are computed from the real list; nothing is inferred about
 *           orders the API has not returned.
 * Input   : none.
 * Output  : the orders page.
 */
export default function Orders() {
  const orders = useOrders();
  const [filter, setFilter] = useState("ALL");

  const rows = orders.data ?? [];

  const counts = useMemo(() => {
    const tally = { ALL: rows.length, BUY: 0, SELL: 0, FILLED: 0, OPEN: 0, REJECTED: 0 };
    rows.forEach((order) => {
      const side = String(order.side || "").toUpperCase();
      const status = String(order.status || "").toUpperCase();
      if (side === "BUY") tally.BUY += 1;
      if (side === "SELL") tally.SELL += 1;
      if (status === "FILLED") tally.FILLED += 1;
      if (status === "NEW" || status === "PENDING" || status === "PARTIAL") tally.OPEN += 1;
      if (status === "REJECTED" || status === "CANCELLED") tally.REJECTED += 1;
    });
    return tally;
  }, [rows]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return rows;
    if (filter === "BUY" || filter === "SELL") {
      return rows.filter((order) => String(order.side || "").toUpperCase() === filter);
    }
    if (filter === "FILLED") {
      return rows.filter((order) => String(order.status || "").toUpperCase() === "FILLED");
    }
    return rows.filter((order) => {
      const status = String(order.status || "").toUpperCase();
      return status === "REJECTED" || status === "CANCELLED";
    });
  }, [rows, filter]);

  return (
    <div className="ot-stack">
      <PageHeader
        title="Orders"
        source="GET /api/orders"
        lede="The complete order history for this account, newest first, exactly as returned by the order API."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={orders.refetch}
            loading={orders.isFetching}
            iconLeft={<RefreshCw size={14} aria-hidden="true" />}
          >
            Refresh
          </Button>
        }
      />

      <Panel>
        <div className="ot-metric-row">
          <Metric
            label="Total orders"
            value={orders.isLoading ? null : String(counts.ALL)}
            loading={orders.isLoading}
          />
          <Metric
            label="Filled"
            value={orders.isLoading ? null : String(counts.FILLED)}
            tone={counts.FILLED ? "pos" : null}
            loading={orders.isLoading}
          />
          <Metric
            label="Working"
            value={orders.isLoading ? null : String(counts.OPEN)}
            tone={counts.OPEN ? "reserved" : null}
            sub="Reserved against your wallet"
            loading={orders.isLoading}
          />
          <Metric
            label="Rejected or cancelled"
            value={orders.isLoading ? null : String(counts.REJECTED)}
            tone={counts.REJECTED ? "neg" : null}
            loading={orders.isLoading}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Blotter"
          meta={`${filtered.length} of ${rows.length}`}
          actions={
            <div className="ot-filter">
              <SegmentedControl
                label="Filter orders"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "ALL", label: "All" },
                  { value: "BUY", label: "Buy" },
                  { value: "SELL", label: "Sell" },
                  { value: "FILLED", label: "Filled" },
                  { value: "REJECTED", label: "Rejected" }
                ]}
              />
            </div>
          }
        />
        <OrdersTable
          rows={filtered}
          loading={orders.isLoading}
          error={orders.error}
          onRetry={orders.refetch}
          emptyDescription={
            rows.length > 0
              ? "No orders match this filter."
              : "Orders you place appear here with their status, execution price and settled value."
          }
        />
      </Panel>
    </div>
  );
}
