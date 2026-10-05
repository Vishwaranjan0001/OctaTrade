import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BadgeIndianRupee,
  Gauge,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrencyFromPaise, formatPercent } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import { AllocationChart, PortfolioChart, ProfitHeatmap } from "@/components/charts";
import { Badge, Card, MetricCard, PageHeader, SectionHeader } from "@/components/ui";

export function AnalyticsPage() {
  const token = useAppStore((state) => state.token);
  const portfolioQuery = useQuery({
    queryKey: ["portfolio", token],
    queryFn: () => api.portfolio(token),
    enabled: Boolean(token),
    staleTime: 30_000
  });

  const holdings = portfolioQuery.data?.holdings ?? [];
  const totals = useMemo(() => {
    const invested = holdings.reduce((sum, item) => sum + item.investedValuePaise, 0);
    const current = holdings.reduce((sum, item) => sum + item.currentValuePaise, 0);
    const profit = current - invested;
    return {
      invested,
      current,
      profit,
      returnPercent: invested ? (profit / invested) * 100 : 0
    };
  }, [holdings]);

  const allocation = useMemo(() => {
    const colors = ["#f2ece2", "#d7bd8d", "#c59b5c", "#a77b3e", "#725028"];
    return holdings.map((holding, index) => ({
      name: holding.symbol.replace(".NS", ""),
      value: totals.current ? (holding.currentValuePaise / totals.current) * 100 : 0,
      color: colors[index % colors.length]
    }));
  }, [holdings, totals.current]);

  const largestPosition = allocation.reduce(
    (largest, item) => item.value > largest.value ? item : largest,
    { name: "—", value: 0 }
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Performance lab"
        title="Portfolio analytics"
        description="A focused view of return and concentration using your current portfolio."
        actions={<Badge tone="positive">Account data</Badge>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Net return" value={formatPercent(totals.returnPercent)} delta={formatCurrencyFromPaise(totals.profit)} positive={totals.profit >= 0} icon={<TrendingUp className="size-4" />} />
        <MetricCard label="Win rate" value="—" delta="Closed-trade history needed" icon={<Gauge className="size-4" />} delay={0.05} />
        <MetricCard label="Risk score" value="—" delta="Historical prices needed" icon={<ShieldCheck className="size-4" />} delay={0.1} />
        <MetricCard label="Best session" value="—" delta="Daily P&L history needed" icon={<BadgeIndianRupee className="size-4" />} delay={0.15} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_.72fr]">
        <Card className="p-5 md:p-6">
          <SectionHeader title="Equity curve" description="Historical portfolio value in rupees" action={<Badge tone="info">No stored history</Badge>} />
          <PortfolioChart data={[]} />
        </Card>

        <Card className="p-5 md:p-6">
          <SectionHeader title="Concentration" description="Weight of each current position" />
          <AllocationChart data={allocation} centerLabel="Largest" centerValue={`${largestPosition.value.toFixed(1)}%`} />
          <div className="mt-2 space-y-2">
            {allocation.slice(0, 5).map((item) => (
              <div key={item.name} className="flex items-center gap-3 text-xs">
                <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="flex-1 text-[var(--text-muted)]">{item.name}</span>
                <span className="number-tabular font-semibold">{item.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="p-5 md:p-6">
          <SectionHeader title="Daily P&L consistency" description="Available after daily portfolio snapshots are stored" action={<Activity className="size-4 text-brand-500" />} />
          <ProfitHeatmap values={[]} />
          <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-[var(--text-muted)]">
            <span>Loss</span><span className="size-3 rounded bg-red-500/70" /><span className="size-3 rounded bg-[var(--panel-muted)]" /><span className="size-3 rounded bg-brand-500/70" /><span>Profit</span>
          </div>
        </Card>

        <Card className="p-5 md:p-6">
          <SectionHeader title="Risk observations" description="Simple signals based on your current holdings" />
          <div className="space-y-3">
            {[
              ["Position concentration", `${largestPosition.name} is ${largestPosition.value.toFixed(1)}% of invested value.`, largestPosition.value > 35 ? "warning" : "positive"],
              ["Diversification", `${holdings.length} active equity positions across the portfolio.`, holdings.length >= 5 ? "positive" : "warning"],
              ["Capital efficiency", `${formatCurrencyFromPaise(totals.current)} is currently deployed.`, "info"],
              ["Historical risk", "Connect stored candle history to calculate drawdown and volatility.", "neutral"]
            ].map(([title, description, tone]) => (
              <div key={title} className="rounded-xl border border-[var(--line)] bg-[var(--panel-muted)]/45 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold">{title}</p>
                  <Badge tone={tone}>{tone}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
