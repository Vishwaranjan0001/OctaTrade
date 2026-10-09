import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, ChevronRight, CircleDollarSign, ClipboardList, Filter, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrencyFromPaise, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Skeleton } from "@/components/ui";

const statusTabs = ["All orders", "Executed", "Rejected", "Open orders"];

export function OrdersPage() {
  const token = useAppStore((state) => state.token);
  const [activeTab, setActiveTab] = useState("All orders");
  const [query, setQuery] = useState("");
  const [sideFilter, setSideFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const ordersQuery = useQuery({
    queryKey: ["orders", token],
    queryFn: () => api.orders(token),
    enabled: Boolean(token),
    staleTime: 20_000
  });

  const orders = ordersQuery.data?.orders ?? [];

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesQuery = order.symbol.toLowerCase().includes(query.toLowerCase());
      const matchesSide = sideFilter === "ALL" || order.side === sideFilter;
      const matchesStatus =
        activeTab === "All orders" ||
        (activeTab === "Executed" && order.status === "COMPLETED") ||
        (activeTab === "Rejected" && order.status === "REJECTED") ||
        (activeTab === "Open orders" && (order.status === "PENDING" || order.status === "PROCESSING"));

      return matchesQuery && matchesSide && matchesStatus;
    });
  }, [orders, query, sideFilter, activeTab]);

  if (ordersQuery.isLoading) {
    return <div className="space-y-5"><Skeleton className="h-24" /><Skeleton className="h-16" /><Skeleton className="h-[450px]" /></div>;
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Execution ledger"
        title="Orders"
        description="A complete, immutable view of your simulated order activity and execution outcomes."
        actions={<Link to="/trade"><Button><CircleDollarSign className="size-4" /> New order</Button></Link>}
      />

      <Card className="overflow-hidden">
        <div className="border-b border-[var(--line)] p-4 md:p-5">
          <div className="scrollbar-hidden flex overflow-x-auto">
            {statusTabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={cn("relative h-10 whitespace-nowrap px-4 text-xs font-semibold", activeTab === tab ? "text-brand-500" : "text-[var(--text-muted)]")}>
                {tab}
                {activeTab === tab ? <motion.span layoutId="orders-tab" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-500" /> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 md:flex-row md:items-center">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by symbol" className="pl-10" />
          </div>
          <div className="flex gap-2">
            <div className="flex rounded-xl bg-[var(--panel-muted)] p-1">
              {["ALL", "BUY", "SELL"].map((side) => <button key={side} onClick={() => setSideFilter(side)} className={cn("h-8 rounded-lg px-3 text-[10px] font-bold", sideFilter === side ? "bg-[var(--panel-solid)] text-brand-500 shadow-sm" : "text-[var(--text-muted)]")}>{side}</button>)}
            </div>
            <Button variant="secondary"><CalendarDays className="size-3.5" /> Date</Button>
            <Button variant="ghost" size="icon"><Filter className="size-4" /></Button>
          </div>
        </div>

        {filteredOrders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="text-[9px] font-bold tracking-[0.12em] text-[var(--text-muted)] uppercase">
                <tr><th className="border-b border-[var(--line)] px-5 py-3">Order</th><th className="border-b border-[var(--line)] px-5 py-3">Side</th><th className="border-b border-[var(--line)] px-5 py-3">Type</th><th className="border-b border-[var(--line)] px-5 py-3 text-right">Quantity</th><th className="border-b border-[var(--line)] px-5 py-3 text-right">Execution price</th><th className="border-b border-[var(--line)] px-5 py-3 text-right">Total value</th><th className="border-b border-[var(--line)] px-5 py-3">Status</th><th className="border-b border-[var(--line)] px-5 py-3" /></tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filteredOrders.map((order) => (
                    <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={order._id} className="group transition hover:bg-brand-500/[0.035]">
                      <td className="border-b border-[var(--line)] px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[var(--panel-muted)] text-[10px] font-bold text-brand-500">{order.symbol.slice(0, 2)}</span><div><p className="font-semibold">{order.symbol}</p><p className="mt-1 text-[9px] text-[var(--text-muted)]">{formatDate(order.createdAt)}</p></div></div></td>
                      <td className={cn("border-b border-[var(--line)] px-5 py-4 font-bold", order.side === "BUY" ? "text-emerald-500" : "text-red-500")}>{order.side}</td>
                      <td className="border-b border-[var(--line)] px-5 py-4"><Badge>{order.orderType}</Badge></td>
                      <td className="number-tabular border-b border-[var(--line)] px-5 py-4 text-right">{order.quantity}</td>
                      <td className="number-tabular border-b border-[var(--line)] px-5 py-4 text-right">{order.executionPricePaise ? formatCurrencyFromPaise(order.executionPricePaise, 2) : "—"}</td>
                      <td className="number-tabular border-b border-[var(--line)] px-5 py-4 text-right font-semibold">{order.totalAmountPaise ? formatCurrencyFromPaise(order.totalAmountPaise) : "—"}</td>
                      <td className="border-b border-[var(--line)] px-5 py-4"><Badge tone={order.status === "COMPLETED" ? "positive" : order.status === "REJECTED" ? "negative" : "warning"}>{order.status}</Badge></td>
                      <td className="border-b border-[var(--line)] px-5 py-4 text-right"><button onClick={() => setSelectedOrder(order)} className="grid size-8 place-items-center rounded-lg text-[var(--text-muted)] opacity-50 transition group-hover:bg-[var(--panel-muted)] group-hover:opacity-100"><ChevronRight className="size-4" /></button></td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : <EmptyState icon={<ClipboardList className="size-5" />} title="No matching orders" description="Change the filters or place a new paper order." action={<Link to="/trade"><Button>Open trading terminal</Button></Link>} />}
      </Card>

      <Dialog.Root open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-0 right-0 z-50 h-full w-full max-w-md border-l border-white/10 bg-[#151412] p-6 text-white shadow-2xl outline-none">
            <Dialog.Title className="text-xl font-semibold tracking-tight">Order details</Dialog.Title>
            <Dialog.Description className="mt-1 text-xs text-white/40">Execution record and settlement summary</Dialog.Description>
            <Dialog.Close className="absolute top-5 right-5 grid size-9 place-items-center rounded-xl text-white/45 hover:bg-white/5 hover:text-white"><X className="size-4" /></Dialog.Close>
            {selectedOrder ? <div className="mt-8"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-brand-500/12 text-sm font-bold text-brand-400">{selectedOrder.symbol.slice(0, 2)}</span><div><p className="font-semibold">{selectedOrder.symbol}</p><p className="mt-1 text-xs text-white/40">NSE · {selectedOrder.orderType}</p></div><Badge tone={selectedOrder.side === "BUY" ? "positive" : "negative"} className="ml-auto">{selectedOrder.side}</Badge></div><div className="mt-8 space-y-1 rounded-2xl bg-white/4 p-4">{[["Order ID", selectedOrder._id], ["Quantity", selectedOrder.quantity], ["Execution price", selectedOrder.executionPricePaise ? formatCurrencyFromPaise(selectedOrder.executionPricePaise, 2) : "—"], ["Total value", selectedOrder.totalAmountPaise ? formatCurrencyFromPaise(selectedOrder.totalAmountPaise) : "—"], ["Placed at", formatDate(selectedOrder.createdAt)]].map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-white/6 py-3 last:border-0"><span className="text-xs text-white/40">{label}</span><span className="number-tabular max-w-[220px] truncate text-xs font-medium">{value}</span></div>)}</div><div className="mt-5 flex items-center justify-between rounded-2xl border border-brand-500/15 bg-brand-500/7 p-4"><div><p className="text-xs font-semibold">Final status</p><p className="mt-1 text-[10px] text-white/40">Market execution lifecycle</p></div><Badge tone={selectedOrder.status === "COMPLETED" ? "positive" : "negative"}>{selectedOrder.status}</Badge></div></div> : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
