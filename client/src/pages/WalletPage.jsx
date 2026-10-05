import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, Landmark, Plus, ShieldCheck, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatCurrency, formatCurrencyFromPaise, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { Badge, Button, Card, Input, MetricCard, PageHeader, SectionHeader, Skeleton } from "@/components/ui";

export function WalletPage() {
  const token = useAppStore((state) => state.token);
  const [amount, setAmount] = useState("50000");
  const queryClient = useQueryClient();

  const walletQuery = useQuery({ queryKey: ["wallet", token], queryFn: () => api.wallet(token), enabled: Boolean(token) });
  const transactionsQuery = useQuery({ queryKey: ["transactions", token], queryFn: () => api.transactions(token), enabled: Boolean(token) });
  const wallet = walletQuery.data;
  const transactions = transactionsQuery.data?.transactions ?? [];

  const depositMutation = useMutation({
    mutationFn: async () => {
      const rupees = Number(amount);
      if (!Number.isFinite(rupees) || rupees <= 0) throw new Error("Enter a valid amount");
      if (!token) throw new Error("Sign in to add funds");
      return api.deposit(token, Math.round(rupees * 100));
    },
    onSuccess: () => {
      toast.success("Virtual funds added successfully");
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to add funds")
  });

  if (walletQuery.isLoading || transactionsQuery.isLoading) return <div className="space-y-5"><Skeleton className="h-24" /><Skeleton className="h-40" /><Skeleton className="h-[360px]" /></div>;

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Virtual capital" title="Wallet & buying power" description="Fund your paper account, understand cash movements and keep simulated capital deployment intentional." actions={<Badge tone="positive"><ShieldCheck className="mr-1 size-3" /> Paper funds</Badge>} />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Available balance" value={formatCurrencyFromPaise(wallet?.availableBalancePaise ?? 0)} delta="Available now" icon={<WalletCards className="size-4" />} />
        <MetricCard label="Reserved balance" value={formatCurrencyFromPaise(wallet?.reservedBalancePaise ?? 0)} delta="No open reservations" icon={<Landmark className="size-4" />} delay={0.05} />
        <MetricCard label="Deposits" value={formatCurrencyFromPaise(transactions.filter((item) => item.type === "DEPOSIT").reduce((sum, item) => sum + item.amountPaise, 0))} delta="Lifetime paper funds" icon={<ArrowDownLeft className="size-4" />} delay={0.1} />
        <MetricCard label="Trade movements" value={`${transactions.filter((item) => ["DEBIT", "CREDIT"].includes(item.type)).length}`} delta="Recorded settlements" icon={<CircleDollarSign className="size-4" />} delay={0.15} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[.7fr_1.3fr]">
        <Card className="relative overflow-hidden p-6">
          <div className="absolute -top-24 -right-20 size-56 rounded-full bg-brand-500/15 blur-3xl" />
          <div className="relative">
            <Badge tone="info">Instant paper funding</Badge>
            <h2 className="mt-5 text-xl font-semibold tracking-tight">Add virtual funds</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Choose an amount to test strategies at a realistic portfolio scale.</p>
            <div className="mt-6">
              <label className="mb-2 block text-xs font-semibold text-[var(--text-muted)]">Amount in rupees</label>
              <div className="relative"><span className="absolute top-1/2 left-4 -translate-y-1/2 text-sm font-semibold text-[var(--text-muted)]">₹</span><Input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="1" className="h-12 pl-9 text-base font-semibold" /></div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">{[25000, 50000, 100000].map((value) => <button key={value} onClick={() => setAmount(String(value))} className={cn("rounded-xl border py-2 text-[10px] font-semibold", amount === String(value) ? "border-brand-500/35 bg-brand-500/10 text-brand-500" : "border-[var(--line)] text-[var(--text-muted)]")}>+{formatCurrency(value, 0)}</button>)}</div>
            <Button onClick={() => depositMutation.mutate()} loading={depositMutation.isPending} className="mt-5 w-full"><Plus className="size-4" /> Add virtual funds</Button>
            <p className="mt-4 text-center text-[9px] leading-4 text-[var(--text-muted)]">No payment method is required. These funds have no monetary value.</p>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-5 md:p-6"><SectionHeader title="Cash ledger" description="Deposits and trade settlement movements" action={<Badge>{transactions.length} entries</Badge>} /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="text-[9px] tracking-wider text-[var(--text-muted)] uppercase"><tr><th className="border-y border-[var(--line)] px-5 py-3">Movement</th><th className="border-y border-[var(--line)] px-5 py-3">Date</th><th className="border-y border-[var(--line)] px-5 py-3 text-right">Amount</th><th className="border-y border-[var(--line)] px-5 py-3 text-right">Balance after</th></tr></thead>
              <tbody>{transactions.map((transaction, index) => { const incoming = ["DEPOSIT", "CREDIT", "RELEASE"].includes(transaction.type); return <motion.tr key={transaction._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.04 }}><td className="border-b border-[var(--line)] px-5 py-4"><div className="flex items-center gap-3"><span className={cn("grid size-9 place-items-center rounded-xl", incoming ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>{incoming ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}</span><div><p className="font-semibold">{transaction.type}</p><p className="mt-1 text-[9px] text-[var(--text-muted)]">Virtual cash movement</p></div></div></td><td className="border-b border-[var(--line)] px-5 py-4 text-[var(--text-muted)]">{formatDate(transaction.createdAt)}</td><td className={cn("number-tabular border-b border-[var(--line)] px-5 py-4 text-right font-semibold", incoming ? "text-emerald-500" : "text-red-500")}>{incoming ? "+" : "−"}{formatCurrencyFromPaise(transaction.amountPaise)}</td><td className="number-tabular border-b border-[var(--line)] px-5 py-4 text-right font-semibold">{formatCurrencyFromPaise(transaction.availableBalanceAfterPaise)}</td></motion.tr>; })}</tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
