import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, BriefcaseBusiness, KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrencyFromPaise, getInitials } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import { Badge, Card, MetricCard, PageHeader, SectionHeader } from "@/components/ui";

export function ProfilePage() {
  const token = useAppStore((state) => state.token);
  const user = useAppStore((state) => state.user);
  const portfolioQuery = useQuery({ queryKey: ["portfolio", token], queryFn: () => api.portfolio(token), enabled: Boolean(token) });
  const ordersQuery = useQuery({ queryKey: ["orders", token], queryFn: () => api.orders(token), enabled: Boolean(token) });
  const holdings = portfolioQuery.data?.holdings ?? [];
  const orders = ordersQuery.data?.orders ?? ordersQuery.data ?? [];
  const portfolioValue = holdings.reduce((sum, item) => sum + item.currentValuePaise, 0);
  const completedOrders = orders.filter((order) => order.status === "COMPLETED").length;

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Account" title="Trader profile" description="Your OctaTrade identity, account mode and a concise record of simulated activity." />

      <Card className="relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-brand-500/18 via-stone-200/10 to-brand-300/12" />
        <div className="relative flex flex-col gap-5 pt-12 sm:flex-row sm:items-end">
          <div className="grid size-24 place-items-center rounded-3xl border-4 border-[var(--panel-solid)] bg-[#1c1a17] text-2xl font-bold text-brand-400 shadow-xl">{getInitials(user?.name ?? "Octa Trader")}</div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-semibold tracking-[-0.03em]">{user?.name ?? "Octa Trader"}</h2><Badge tone="positive"><BadgeCheck className="mr-1 size-3" /> Verified session</Badge></div>
            <p className="mt-2 flex items-center gap-2 text-sm text-[var(--text-muted)]"><Mail className="size-4" /> {user?.email ?? "—"}</p>
          </div>
          <Badge tone="positive">Connected account</Badge>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetricCard label="Portfolio value" value={formatCurrencyFromPaise(portfolioValue)} delta={`${holdings.length} holdings`} icon={<BriefcaseBusiness className="size-4" />} />
        <MetricCard label="Completed orders" value={String(completedOrders)} delta={`${orders.length} total orders`} icon={<BadgeCheck className="size-4" />} delay={0.05} />
        <MetricCard label="Account security" value="Protected" delta="Bearer token session" icon={<KeyRound className="size-4" />} delay={0.1} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5 md:p-6">
          <SectionHeader title="Personal information" description="Read-only details from your authenticated user record" />
          <div className="space-y-3">
            {[<UserRound className="size-4" />, <Mail className="size-4" />, <ShieldCheck className="size-4" />].map((icon, index) => {
              const rows = [["Full name", user?.name ?? "—"], ["Email address", user?.email ?? "—"], ["Trading mode", "Paper trading"]];
              return <div key={rows[index][0]} className="flex items-center gap-3 rounded-xl bg-[var(--panel-muted)] p-4"><span className="text-brand-500">{icon}</span><div><p className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">{rows[index][0]}</p><p className="mt-1 text-sm font-semibold">{rows[index][1]}</p></div></div>;
            })}
          </div>
        </Card>
        <Card className="p-5 md:p-6">
          <SectionHeader title="Account boundaries" description="What this learning environment currently supports" />
          <div className="space-y-3 text-xs leading-5 text-[var(--text-muted)]">
            <p className="rounded-xl border border-brand-500/15 bg-brand-500/7 p-4">Orders use virtual INR funds and update your simulated wallet and holdings.</p>
            <p className="rounded-xl border border-[var(--line)] p-4">Market orders are supported. Limit, stop-loss and live brokerage execution are not connected.</p>
            <p className="rounded-xl border border-[var(--line)] p-4">Authentication protects private portfolio, wallet and order endpoints.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
