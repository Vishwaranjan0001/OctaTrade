import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, Filter, Search, WalletCards } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrencyFromPaise, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Skeleton } from "@/components/ui";

export function ActivityPage() {
  const token = useAppStore((state) => state.token);
  const [query, setQuery] = useState("");
  const ordersQuery = useQuery({ queryKey: ["orders", token], queryFn: () => api.orders(token), enabled: Boolean(token) });
  const transactionsQuery = useQuery({ queryKey: ["transactions", token], queryFn: () => api.transactions(token), enabled: Boolean(token) });
  const orders = ordersQuery.data?.orders ?? [];
  const transactions = transactionsQuery.data?.transactions ?? [];

  const events = useMemo(() => {
    const orderEvents = orders.map((order) => ({ id: order._id, kind: "order", type: order.side, title: `${order.side === "BUY" ? "Bought" : "Sold"} ${order.quantity} ${order.symbol}`, detail: order.executionPricePaise ? `${formatCurrencyFromPaise(order.executionPricePaise, 2)} per share` : "Order rejected", amount: order.totalAmountPaise, date: order.createdAt, positive: order.side === "SELL", status: order.status }));
    const cashEvents = transactions.filter((item) => item.type === "DEPOSIT").map((item) => ({ id: item._id, kind: "cash", type: item.type, title: "Virtual funds deposited", detail: "Buying power increased", amount: item.amountPaise, date: item.createdAt, positive: true, status: "COMPLETED" }));
    return [...orderEvents, ...cashEvents].filter((event) => `${event.title} ${event.detail}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [orders, transactions, query]);

  if (ordersQuery.isLoading || transactionsQuery.isLoading) return <div className="space-y-5"><Skeleton className="h-24" /><Skeleton className="h-[500px]" /></div>;

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Account timeline" title="Activity" description="One chronological stream for simulated trades, cash movements and account events." />
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <div className="relative flex-1 md:max-w-sm"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--text-muted)]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search activity" className="pl-10" /></div>
          <Button variant="secondary"><Filter className="size-4" /> Filter timeline</Button>
        </div>
        <div className="mx-auto max-w-3xl p-5 md:p-8">
          {events.length ? <div className="relative before:absolute before:top-3 before:bottom-3 before:left-[19px] before:w-px before:bg-[var(--line)]">
            {events.map((event, index) => (
              <motion.div key={`${event.kind}-${event.id}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="relative mb-2 flex gap-4 rounded-2xl p-2 transition hover:bg-[var(--panel-muted)]">
                <span className={cn("relative z-10 grid size-10 shrink-0 place-items-center rounded-xl border-4 border-[var(--panel-solid)]", event.kind === "cash" ? "bg-brand-500/14 text-brand-500" : event.type === "BUY" ? "bg-emerald-500/12 text-emerald-500" : "bg-red-500/12 text-red-500")}>{event.kind === "cash" ? <WalletCards className="size-4" /> : event.type === "BUY" ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}</span>
                <div className="min-w-0 flex-1 pb-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold">{event.title}</p><p className="mt-1 text-[10px] text-[var(--text-muted)]">{event.detail}</p></div><div className="text-left sm:text-right"><p className={cn("number-tabular text-xs font-semibold", event.positive ? "text-emerald-500" : "text-[var(--text)]")}>{event.amount ? formatCurrencyFromPaise(event.amount) : "—"}</p><p className="mt-1 text-[9px] text-[var(--text-muted)]">{formatDate(event.date)}</p></div></div><Badge tone={event.status === "COMPLETED" ? "positive" : "negative"} className="mt-3">{event.status}</Badge></div>
              </motion.div>
            ))}
          </div> : <EmptyState icon={<CircleDollarSign className="size-5" />} title="No activity yet" description="Orders and wallet movements will appear here." />}
        </div>
      </Card>
    </div>
  );
}
