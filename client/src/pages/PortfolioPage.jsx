import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowRight, ArrowUpDown, BriefcaseBusiness, CircleDollarSign, Landmark, TrendingUp, WalletCards } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrencyFromPaise, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { AllocationChart, PortfolioChart } from "@/components/charts";
import { Badge, Button, Card, EmptyState, MetricCard, PageHeader, SectionHeader, Skeleton } from "@/components/ui";

export function PortfolioPage() {
  const token = useAppStore((state) => state.token);
  const [sorting, setSorting] = useState([]);

  const portfolioQuery = useQuery({
    queryKey: ["portfolio", token],
    queryFn: () => api.portfolio(token),
    enabled: Boolean(token),
    staleTime: 30_000
  });

  const walletQuery = useQuery({
    queryKey: ["wallet", token],
    queryFn: () => api.wallet(token),
    enabled: Boolean(token),
    staleTime: 30_000
  });

  const historyQuery = useQuery({
    queryKey: ["portfolio", "history", token],
    queryFn: () => api.portfolioHistory(token),
    enabled: Boolean(token),
    staleTime: 60_000
  });

  const holdings = portfolioQuery.data?.holdings ?? [];
  const wallet = walletQuery.data;
  const loading = portfolioQuery.isLoading || walletQuery.isLoading;
  const invested = holdings.reduce((sum, holding) => sum + holding.investedValuePaise, 0);
  const currentValue = holdings.reduce((sum, holding) => sum + holding.currentValuePaise, 0);
  const profit = holdings.reduce((sum, holding) => sum + holding.profitLossPaise, 0);
  const returnPercent = invested ? (profit / invested) * 100 : 0;

  const allocationData = useMemo(() => {
    const colors = ["#f2ece2", "#d7bd8d", "#c59b5c", "#a77b3e", "#725028"];
    return holdings.map((holding, index) => ({
      name: holding.symbol.replace(".NS", ""),
      value: currentValue ? (holding.currentValuePaise / currentValue) * 100 : 0,
      color: colors[index % colors.length]
    }));
  }, [holdings, currentValue]);

  const columns = useMemo(() => [
    {
      accessorKey: "symbol",
      header: "Security",
      cell: ({ row }) => <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-brand-500/10 text-[10px] font-bold text-brand-500">{row.original.symbol.slice(0, 2)}</span><div><p className="text-xs font-semibold">{row.original.symbol}</p><p className="mt-1 text-[9px] text-[var(--text-muted)]">NSE · Equity</p></div></div>
    },
    { accessorKey: "quantity", header: "Qty", cell: ({ getValue }) => <span className="number-tabular">{getValue()}</span> },
    { accessorKey: "averageBuyPricePaise", header: "Avg. price", cell: ({ getValue }) => <span className="number-tabular">{formatCurrencyFromPaise(getValue(), 2)}</span> },
    { accessorKey: "currentPricePaise", header: "Market price", cell: ({ getValue }) => <span className="number-tabular">{formatCurrencyFromPaise(getValue(), 2)}</span> },
    { accessorKey: "investedValuePaise", header: "Invested", cell: ({ getValue }) => <span className="number-tabular">{formatCurrencyFromPaise(getValue())}</span> },
    { accessorKey: "currentValuePaise", header: "Current value", cell: ({ getValue }) => <span className="number-tabular font-semibold">{formatCurrencyFromPaise(getValue())}</span> },
    {
      accessorKey: "profitLossPaise",
      header: "Total P&L",
      cell: ({ row, getValue }) => {
        const value = getValue();
        const percentage = row.original.investedValuePaise ? (value / row.original.investedValuePaise) * 100 : 0;
        return <div className={cn("number-tabular text-right font-semibold", value >= 0 ? "text-brand-500" : "text-red-500")}><p>{formatCurrencyFromPaise(value)}</p><p className="mt-1 text-[9px]">{formatPercent(percentage)}</p></div>;
      }
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => <Link to={`/trade?symbol=${encodeURIComponent(row.original.symbol)}`} className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-500">Trade <ArrowRight className="size-3" /></Link>
    }
  ], []);

  const table = useReactTable({
    data: holdings,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  if (loading) {
    return <div className="space-y-5"><Skeleton className="h-24" /><Skeleton className="h-36" /><Skeleton className="h-[430px]" /></div>;
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Portfolio intelligence"
        title="Your portfolio"
        description="Understand where your capital is working, what is driving returns and where risk is concentrated."
        actions={<Link to="/trade"><Button><CircleDollarSign className="size-4" /> Trade securities</Button></Link>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Market value" value={formatCurrencyFromPaise(currentValue)} delta={`${holdings.length} positions`} icon={<BriefcaseBusiness className="size-4" />} />
        <MetricCard label="Total invested" value={formatCurrencyFromPaise(invested)} delta="Cost basis" icon={<Landmark className="size-4" />} footer={<span className="text-[10px] text-[var(--text-muted)]">Across equities</span>} delay={0.05} />
        <MetricCard label="Total P&L" value={formatCurrencyFromPaise(profit)} delta={formatPercent(returnPercent)} positive={profit >= 0} icon={<TrendingUp className="size-4" />} footer={<span className="text-[10px] text-[var(--text-muted)]">Unrealized P&L</span>} delay={0.1} />
        <MetricCard label="Available cash" value={formatCurrencyFromPaise(wallet?.availableBalancePaise ?? 0)} delta="Buying power" icon={<WalletCards className="size-4" />} footer={<span className="size-2 rounded-full bg-brand-500" />} delay={0.15} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_.75fr]">
        <Card className="p-5 md:p-6">
          <SectionHeader title="Growth of ₹1 invested" description="Current holdings vs NIFTY 50 (dashed)" action={<Badge tone="info">Last 1 month</Badge>} />
          <PortfolioChart data={historyQuery.data?.history ?? []} normalized />
        </Card>
        <Card className="p-5 md:p-6">
          <SectionHeader title="Asset allocation" description="Current position weights" />
          {allocationData.length ? <><AllocationChart data={allocationData} centerLabel="Equities" centerValue={formatCurrencyFromPaise(currentValue)} /><div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">{allocationData.map((item) => <div key={item.name} className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-2 text-[var(--text-muted)]"><span className="size-2 rounded-full" style={{ background: item.color }} />{item.name}</span><span className="number-tabular font-semibold">{item.value.toFixed(1)}%</span></div>)}</div></> : <EmptyState icon={<BriefcaseBusiness className="size-5" />} title="No allocation yet" description="Complete your first paper trade to see portfolio allocation." />}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-5 md:p-6"><SectionHeader title="Positions" description="Sortable live-value holdings" action={<Badge tone="positive">Live quotes</Badge>} /></div>
        {holdings.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-xs">
              <thead className="sticky top-0 bg-[var(--panel-solid)] text-[9px] tracking-[0.12em] text-[var(--text-muted)] uppercase">
                {table.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id}>{headerGroup.headers.map((header) => <th key={header.id} className={cn("border-y border-[var(--line)] px-5 py-3", header.column.id === "profitLossPaise" && "text-right")}><button onClick={header.column.getToggleSortingHandler()} className="inline-flex items-center gap-1.5">{flexRender(header.column.columnDef.header, header.getContext())}{header.column.getCanSort() ? <ArrowUpDown className="size-3" /> : null}</button></th>)}</tr>)}
              </thead>
              <tbody>{table.getRowModel().rows.map((row) => <tr key={row.id} className="transition hover:bg-brand-500/[0.035]">{row.getVisibleCells().map((cell) => <td key={cell.id} className={cn("border-b border-[var(--line)] px-5 py-4", cell.column.id === "profitLossPaise" && "text-right")}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody>
            </table>
          </div>
        ) : <EmptyState icon={<BriefcaseBusiness className="size-5" />} title="Your portfolio is ready" description="Place a paper trade to create your first position." action={<Link to="/trade"><Button>Explore the terminal</Button></Link>} />}
      </Card>
    </div>
  );
}
