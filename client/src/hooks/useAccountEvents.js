import { useMemo } from "react";
import { useOrders, useWalletTransactions } from "./queries.js";
import { formatPaise, formatQty } from "../lib/format.js";

/*
  Wallet transaction types, as constrained by the WalletTransaction model's
  enum: DEPOSIT | RESERVE | RELEASE | DEBIT | CREDIT.
*/
const WALLET_COPY = {
  DEPOSIT: { title: "Funds deposited", tone: "pos" },
  CREDIT: { title: "Wallet credited", tone: "pos" },
  DEBIT: { title: "Wallet debited", tone: "neutral" },
  RESERVE: { title: "Funds reserved", tone: "reserved" },
  RELEASE: { title: "Reservation released", tone: "neutral" }
};

const ORDER_COPY = {
  FILLED: { title: "Order executed", tone: "pos" },
  NEW: { title: "Order accepted", tone: "reserved" },
  PENDING: { title: "Order working", tone: "reserved" },
  PARTIAL: { title: "Order partially filled", tone: "reserved" },
  REJECTED: { title: "Order rejected", tone: "neg" },
  CANCELLED: { title: "Order cancelled", tone: "neg" }
};

/**
 * Builds a chronological feed of real account events.
 *
 * Purpose : the Activity and Notifications surfaces need a timeline, and the
 *           API has no events or notifications resource. Rather than inventing
 *           notifications, this derives the feed strictly from records the API
 *           does return — orders and wallet transactions — so every entry
 *           corresponds to something that actually happened on the account.
 * Input   : none.
 * Output  : {
 *             events: Array<{ id, kind, at, title, detail, symbol, tone, href }>,
 *             isLoading, isFetching, error, refetch
 *           }
 *           Sorted newest first. Entries without a usable timestamp are kept
 *           but sort last, so nothing is silently dropped.
 */
export function useAccountEvents() {
  const orders = useOrders();
  const transactions = useWalletTransactions();

  const events = useMemo(() => {
    const list = [];

    (orders.data ?? []).forEach((order) => {
      const status = String(order.status || "").toUpperCase();
      const copy = ORDER_COPY[status] || { title: "Order updated", tone: "neutral" };
      const side = String(order.side || "").toUpperCase();
      const id = order._id || order.id;

      const parts = [side, formatQty(order.quantity), order.symbol].filter(Boolean);
      const value =
        order.totalValuePaise === null || order.totalValuePaise === undefined
          ? null
          : formatPaise(order.totalValuePaise);

      list.push({
        id: `order:${id}`,
        kind: "ORDER",
        at: order.updatedAt || order.createdAt || null,
        title: copy.title,
        detail: [parts.join(" · "), value].filter(Boolean).join(" — "),
        symbol: order.symbol || null,
        status,
        tone: copy.tone,
        href: id ? `/orders/${id}` : "/orders"
      });
    });

    (transactions.data ?? []).forEach((entry) => {
      const type = String(entry.type || "").toUpperCase();
      const copy = WALLET_COPY[type] || { title: "Wallet movement", tone: "neutral" };
      const id = entry._id || entry.id;

      list.push({
        id: `wallet:${id}`,
        kind: "WALLET",
        at: entry.createdAt || null,
        title: copy.title,
        detail: [
          formatPaise(entry.amountPaise),
          `available ${formatPaise(entry.availableBalanceAfterPaise)}`
        ]
          .filter(Boolean)
          .join(" — "),
        symbol: null,
        status: type,
        tone: copy.tone,
        href: "/wallet"
      });
    });

    return list.sort((a, b) => {
      const left = a.at ? Date.parse(a.at) : Number.NEGATIVE_INFINITY;
      const right = b.at ? Date.parse(b.at) : Number.NEGATIVE_INFINITY;
      return right - left;
    });
  }, [orders.data, transactions.data]);

  return {
    events,
    isLoading: orders.isLoading || transactions.isLoading,
    isFetching: orders.isFetching || transactions.isFetching,
    /* Either source failing makes the feed incomplete, so the first error wins. */
    error: orders.error || transactions.error || null,
    refetch: () => {
      orders.refetch();
      transactions.refetch();
    }
  };
}
