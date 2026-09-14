import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { PageHeader } from "../../components/app/PageHeader.jsx";
import { Panel, PanelBody, PanelHeader } from "../../components/ui/Panel.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { SideMark, StatusMark } from "../../components/ui/Status.jsx";
import { ErrorState, LoadingState } from "../../components/ui/States.jsx";
import { useOrder } from "../../hooks/queries.js";
import {
  EM_DASH,
  formatDateTime,
  formatPaise,
  formatQty
} from "../../lib/format.js";

/*
  The lifecycle an order moves through. Rendering it as a rail makes the
  order's current position explicit; stages after the current one are shown as
  not-yet-reached rather than as predictions.
*/
const LIFECYCLE = [
  { key: "NEW", label: "Accepted", body: "The order was validated and recorded." },
  { key: "RESERVED", label: "Funds reserved", body: "Wallet balance held against the order." },
  { key: "FILLED", label: "Executed", body: "Shares moved and the wallet settled." }
];

/**
 * OrderDetails — one order in full.
 *
 * Purpose : show every field GET /api/orders/:orderId returns, plus where the
 *           order sits in its lifecycle. Fields the API omits (an execution
 *           price on an unfilled order) render as an em dash, never a guess.
 * Input   : :orderId route param.
 * Output  : the order page.
 */
export default function OrderDetails() {
  const { orderId } = useParams();
  const order = useOrder(orderId);

  const data = order.data;
  const status = String(data?.status || "").toUpperCase();

  /* Terminal failure states do not progress through the rail. */
  const isFailed = status === "REJECTED" || status === "CANCELLED";
  const reachedIndex = isFailed
    ? 0
    : LIFECYCLE.findIndex((stage) => stage.key === status);

  return (
    <div className="ot-stack">
      <PageHeader
        title="Order"
        source="GET /api/orders/:orderId"
        lede={orderId ? `Identifier ${orderId}` : undefined}
        actions={
          <>
            <Button as={Link} to="/orders" variant="ghost" size="sm" iconLeft={<ArrowLeft size={14} aria-hidden="true" />}>
              All orders
            </Button>
            {data?.symbol ? (
              <Button
                as={Link}
                to={`/terminal/${encodeURIComponent(data.symbol)}`}
                size="sm"
                iconRight={<ArrowRight size={14} aria-hidden="true" />}
              >
                Trade {data.symbol}
              </Button>
            ) : null}
          </>
        }
      />

      {order.isLoading ? (
        <Panel>
          <LoadingState label="Loading order" rows={5} columns={2} />
        </Panel>
      ) : order.error ? (
        <Panel>
          <ErrorState error={order.error} subject="this order" onRetry={order.refetch} />
        </Panel>
      ) : !data ? (
        <Panel>
          <ErrorState
            error={{ message: "The order API returned no order for this identifier." }}
            subject="this order"
          />
        </Panel>
      ) : (
        <div className="ot-grid ot-grid--primary">
          <Panel>
            <PanelHeader
              title={data.symbol || "Order"}
              meta={<StatusMark status={data.status} />}
            />
            <PanelBody>
              <dl className="ot-kv">
                <div className="ot-kv__row">
                  <dt className="ot-kv__key">Side</dt>
                  <dd className="ot-kv__val"><SideMark side={data.side} /></dd>
                </div>
                <div className="ot-kv__row">
                  <dt className="ot-kv__key">Quantity</dt>
                  <dd className="ot-kv__val">{formatQty(data.quantity)}</dd>
                </div>
                <div className="ot-kv__row">
                  <dt className="ot-kv__key">Order type</dt>
                  <dd className="ot-kv__val">{data.type || data.orderType || "MARKET"}</dd>
                </div>
                <div className="ot-kv__row">
                  <dt className="ot-kv__key">Requested price</dt>
                  <dd className="ot-kv__val">
                    {data.requestedPricePaise === undefined || data.requestedPricePaise === null
                      ? EM_DASH
                      : formatPaise(data.requestedPricePaise)}
                  </dd>
                </div>
                <div className="ot-kv__row">
                  <dt className="ot-kv__key">Executed price</dt>
                  <dd className="ot-kv__val">
                    {data.executedPricePaise === undefined || data.executedPricePaise === null
                      ? EM_DASH
                      : formatPaise(data.executedPricePaise)}
                  </dd>
                </div>
                <div className="ot-kv__row">
                  <dt className="ot-kv__key">Total value</dt>
                  <dd className="ot-kv__val">
                    {data.totalValuePaise === undefined || data.totalValuePaise === null
                      ? EM_DASH
                      : formatPaise(data.totalValuePaise)}
                  </dd>
                </div>
                <div className="ot-kv__row">
                  <dt className="ot-kv__key">Placed</dt>
                  <dd className="ot-kv__val">{formatDateTime(data.createdAt)}</dd>
                </div>
                <div className="ot-kv__row">
                  <dt className="ot-kv__key">Last updated</dt>
                  <dd className="ot-kv__val">{formatDateTime(data.updatedAt)}</dd>
                </div>
                {data.rejectionReason ? (
                  <div className="ot-kv__row">
                    <dt className="ot-kv__key">Reason</dt>
                    <dd className="ot-kv__val ot-kv__val--neg">{data.rejectionReason}</dd>
                  </div>
                ) : null}
              </dl>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Lifecycle" meta={status || EM_DASH} />
            <PanelBody>
              <ol className="ot-lifecycle">
                {LIFECYCLE.map((stage, index) => {
                  const reached = reachedIndex >= index && !isFailed;
                  const current = reachedIndex === index && !isFailed;
                  return (
                    <li
                      className={`ot-lifecycle__step ${reached ? "is-reached" : ""} ${current ? "is-current" : ""}`}
                      key={stage.key}
                    >
                      <span className="ot-lifecycle__glyph" aria-hidden="true" />
                      <div>
                        <p className="ot-lifecycle__label">{stage.label}</p>
                        <p className="ot-lifecycle__body">{stage.body}</p>
                      </div>
                    </li>
                  );
                })}
                {isFailed ? (
                  <li className="ot-lifecycle__step is-failed">
                    <span className="ot-lifecycle__glyph" aria-hidden="true" />
                    <div>
                      <p className="ot-lifecycle__label">{status === "CANCELLED" ? "Cancelled" : "Rejected"}</p>
                      <p className="ot-lifecycle__body">
                        {data.rejectionReason || "The order did not execute. No shares moved and no funds were debited."}
                      </p>
                    </div>
                  </li>
                ) : null}
              </ol>
            </PanelBody>
          </Panel>
        </div>
      )}
    </div>
  );
}
