import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleDollarSign,
  Landmark,
  MoveDownRight,
  MoveUpRight,
  Plus,
  ReceiptText,
  TrendingUp,
  WalletCards
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrencyFromPaise, formatDate, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { PortfolioChart } from "@/components/charts";
import { Badge, Button, Card, EmptyState, MetricCard, PageHeader, SectionHeader, Skeleton } from "@/components/ui";

export function DashboardPage() {
  const token = useAppStore((state) => state.token);
  const user = useAppStore((state) => state.user);
  const walletQuery = useQuery({
    queryKey: ["wallet", token],
    queryFn: () => api.wallet(token),
    enabled: Boolean(token),
    staleTime: 30_000
  });
  const portfolioQuery = useQuery({
    queryKey: ["portfolio", token],
    queryFn: () => api.portfolio(token),
    enabled: Boolean(token),
    staleTime: 30_000
  });
  const ordersQuery = useQuery({
    queryKey: ["orders", token],
    queryFn: () => api.orders(token),
    enabled: Boolean(token),
    staleTime: 20_000
  });
  const wallet = walletQuery.data;
  const holdings = portfolioQuery.data?.holdings ?? [];
  const orders = ordersQuery.data?.orders ?? [];
  const isLoading = walletQuery.isLoading || portfolioQuery.isLoading;
  const investedPaise = holdings.reduce((sum, holding) => sum + holding.investedValuePaise, 0);
  const holdingsValuePaise = holdings.reduce((sum, holding) => sum + holding.currentValuePaise, 0);
  const profitLossPaise = holdings.reduce((sum, holding) => sum + holding.profitLossPaise, 0);
  const totalValuePaise = holdingsValuePaise + (wallet?.availableBalancePaise ?? 0);
  const totalReturn = investedPaise ? profitLossPaise / investedPaise * 100 : 0;

  if (isLoading) {
    return <div className="space-y-6">
      <Skeleton className="h-24" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-36" />)}
      </div>
      <Skeleton className="h-[430px]" />
    </div>;
  }

  return <div className="space-y-7">
    <PageHeader
      eyebrow="Portfolio workspace"
      title={`Good morning, ${user?.name?.split(" ")[0] ?? "Trader"}`}
      description="Here’s the latest information from your paper-trading account."
      actions={<>
        <Link to="/wallet" className="hidden sm:block"><Button variant="secondary"><Plus className="size-4" /> Add funds</Button></Link>
        <Link to="/trade"><Button><CircleDollarSign className="size-4" /> Place trade</Button></Link>
      </>}
    />

    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <MetricCard label="Portfolio value" value={formatCurrencyFromPaise(totalValuePaise)} delta="Current holdings + cash" icon={<BriefcaseBusiness className="size-4" />} />
      <MetricCard label="Total return" value={formatCurrencyFromPaise(profitLossPaise)} delta={formatPercent(totalReturn)} positive={profitLossPaise >= 0} icon={<TrendingUp className="size-4" />} footer={<span className="text-xs text-[var(--text-muted)]">Unrealized P&amp;L</span>} delay={0.05} />
      <MetricCard label="Invested amount" value={formatCurrencyFromPaise(investedPaise)} delta={`${holdings.length} active positions`} icon={<Landmark className="size-4" />} footer={<span className="text-xs text-[var(--text-muted)]">Market value</span>} delay={0.1} />
      <MetricCard label="Buying power" value={formatCurrencyFromPaise(wallet?.availableBalancePaise ?? 0)} delta="Available balance" icon={<WalletCards className="size-4" />} delay={0.15} />
    </div>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.75fr)]">
      <Card className="overflow-hidden p-5 md:p-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold tracking-tight">Portfolio performance</h2>
            <Badge tone="info">History unavailable</Badge>
          </div>
          <p className="number-tabular mt-3 text-3xl font-semibold tracking-[-0.045em]">{formatCurrencyFromPaise(totalValuePaise)}</p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">Portfolio snapshots are not recorded by the backend yet.</p>
        </div>
        <PortfolioChart data={[]} />
      </Card>

      <Card className="p-5 md:p-6">
        <SectionHeader title="Recent activity" description="Latest order executions" action={<Link to="/orders" className="text-[10px] font-semibold text-brand-500">View all</Link>} />
        {orders.length ? <div className="space-y-1">
          {orders.slice(0, 5).map((order, index) => <motion.div
            key={order._id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-[var(--panel-muted)]"
          >
            <div className={cn("grid size-9 place-items-center rounded-xl", order.side === "BUY" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
              {order.side === "BUY" ? <MoveDownRight className="size-4" /> : <MoveUpRight className="size-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">{order.side} {order.quantity} {order.symbol}</p>
              <p className="mt-1 truncate text-[10px] text-[var(--text-muted)]">{formatDate(order.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="number-tabular text-xs font-semibold">{order.totalAmountPaise ? formatCurrencyFromPaise(order.totalAmountPaise) : "—"}</p>
              <Badge tone={order.status === "COMPLETED" ? "positive" : "negative"} className="mt-1 px-1.5 py-0.5 text-[8px]">{order.status}</Badge>
            </div>
          </motion.div>)}
        </div> : <EmptyState icon={<ReceiptText className="size-5" />} title="No orders yet" description="Your completed and rejected orders will appear here." />}
        <Link to="/activity" className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] py-2.5 text-xs font-semibold text-[var(--text-muted)] transition hover:text-brand-500">
          <ReceiptText className="size-3.5" /> Account activity <ArrowRight className="size-3.5" />
        </Link>
      </Card>
    </div>
  </div>;
}
