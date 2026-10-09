import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "motion/react";
import { Check, ChevronRight, CircleAlert, ShieldCheck, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatCurrency, formatCurrencyFromPaise } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { Badge, Button, Card, Input } from "@/components/ui";
const ticketSchema = z.object({
  quantity: z.coerce.number().int().positive("Enter at least one share")
});
function OrderTicket({ symbol, compact = false }) {
  const [side, setSide] = useState("BUY");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const token = useAppStore((state) => state.token);
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: { quantity: 1 }
  });
  useEffect(() => {
    form.reset({ quantity: 1 });
  }, [symbol, form]);
  const quoteQuery = useQuery({
    queryKey: ["quote", symbol],
    queryFn: () => api.quote(symbol),
    enabled: Boolean(symbol),
    retry: 1,
    staleTime: 15e3
  });
  const walletQuery = useQuery({
    queryKey: ["wallet", token],
    queryFn: () => api.wallet(token),
    enabled: Boolean(token),
    staleTime: 15e3
  });
  const executionPrice = quoteQuery.data?.price ?? 0;
  const quantity = form.watch("quantity") || 0;
  const estimatedValue = executionPrice * quantity;
  const wallet = walletQuery.data;
  const orderMutation = useMutation({
    mutationFn: async (values) => {
      if (!token) {
        throw new Error("Sign in to place an order");
      }
      return api.placeOrder(token, {
        symbol,
        side,
        quantity: values.quantity
      }, idempotencyKey);
    },
    onSuccess: () => {
      setIdempotencyKey(crypto.randomUUID());
      setConfirmationOpen(true);
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
      void queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to place order");
    }
  });
  const balanceAfter = useMemo(() => {
    if (!wallet) {
      return null;
    }
    const current = wallet.availableBalancePaise / 100;
    return side === "BUY" ? current - estimatedValue : current + estimatedValue;
  }, [wallet, side, estimatedValue]);
  return <>
      <Card className={cn("overflow-hidden", compact ? "p-4" : "p-5")}>
        <div className="flex rounded-xl bg-[var(--panel-muted)] p-1">
          {["BUY", "SELL"].map((value) => <button
    key={value}
    type="button"
    onClick={() => setSide(value)}
    className={cn(
      "relative flex h-9 flex-1 items-center justify-center rounded-lg text-xs font-bold transition",
      side === value ? value === "BUY" ? "text-brand-500" : "text-red-500" : "text-[var(--text-muted)]"
    )}
  >
              {side === value ? <motion.span
    layoutId="order-side"
    className="absolute inset-0 rounded-lg bg-[var(--panel-solid)] shadow-sm"
  /> : null}
              <span className="relative">{value}</span>
            </button>)}
        </div>

        <div className="mt-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[var(--text)]">{symbol}</h3>
              <Badge tone="info">Market</Badge>
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">NSE · Virtual execution</p>
          </div>
          <div className="text-right">
            <p className="number-tabular text-lg font-semibold text-[var(--text)]">
              {executionPrice ? formatCurrency(executionPrice) : "\u2014"}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">
              {quoteQuery.isFetching ? "Refreshing quote\u2026" : "Indicative price"}
            </p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit((values) => orderMutation.mutate(values))} className="mt-6 space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="quantity" className="text-xs font-semibold text-[var(--text-muted)]">
                Quantity
              </label>
              <span className="text-[10px] text-[var(--text-muted)]">Whole shares</span>
            </div>
            <Input id="quantity" type="number" min="1" step="1" {...form.register("quantity")} />
            {form.formState.errors.quantity ? <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-500">
                <CircleAlert className="size-3" /> {form.formState.errors.quantity.message}
              </p> : null}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">Order type</p>
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-[var(--panel-muted)] p-1">
              {["Market", "Limit", "Stop", "Stop limit"].map((type, index) => <button
    key={type}
    type="button"
    disabled={index > 0}
    title={index > 0 ? "Coming soon" : void 0}
    className={cn(
      "h-8 rounded-lg text-[10px] font-semibold transition",
      index === 0 ? "bg-[var(--panel-solid)] text-brand-500 shadow-sm" : "cursor-not-allowed text-[var(--text-muted)]/45"
    )}
  >
                  {type}
                </button>)}
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--panel-muted)]/65 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Estimated value</span>
              <span className="number-tabular font-semibold text-[var(--text)]">
                {formatCurrency(estimatedValue)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Buying power</span>
              <span className="number-tabular text-[var(--text)]">
                {wallet ? formatCurrencyFromPaise(wallet.availableBalancePaise) : "\u2014"}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--line)] pt-2 text-xs">
              <span className="text-[var(--text-muted)]">Balance after</span>
              <span className={cn("number-tabular font-semibold", balanceAfter !== null && balanceAfter < 0 ? "text-red-500" : "text-[var(--text)]")}>
                {balanceAfter === null ? "\u2014" : formatCurrency(balanceAfter)}
              </span>
            </div>
          </div>

          <Button
    type="submit"
    loading={orderMutation.isPending}
    disabled={!executionPrice || side === "BUY" && balanceAfter !== null && balanceAfter < 0}
    className={cn("w-full", side === "SELL" && "bg-red-500 shadow-[0_10px_30px_rgba(239,91,100,.18)] hover:bg-red-400")}
  >
            Review {side} order <ChevronRight className="size-4" />
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-muted)]">
            <ShieldCheck className="size-3 text-brand-500" />
            Simulated trade using virtual funds
          </div>
        </form>
      </Card>

      <Dialog.Root open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-[#151412] p-6 text-white shadow-2xl outline-none">
            <Dialog.Title className="sr-only">Order confirmation</Dialog.Title>
            <Dialog.Close className="absolute top-4 right-4 grid size-8 place-items-center rounded-lg text-white/45 hover:bg-white/5 hover:text-white">
              <X className="size-4" />
            </Dialog.Close>
            <motion.div
    initial={{ scale: 0.5, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", stiffness: 260, damping: 18 }}
    className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-500/14 text-brand-400"
  >
              <Check className="size-7" strokeWidth={2.5} />
            </motion.div>
            <div className="mt-5 text-center">
              <h3 className="text-xl font-semibold tracking-tight">Order received</h3>
              <p className="mt-1 text-sm text-white/48">
                {side} {quantity} {quantity === 1 ? "share" : "shares"} of {symbol} is in the queue. You will be notified when it is executed.
              </p>
            </div>
            <div className="mt-6 space-y-3 rounded-2xl bg-white/4 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/45">Indicative price</span>
                <span className="number-tabular font-medium">{formatCurrency(executionPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/45">Total value</span>
                <span className="number-tabular font-medium">{formatCurrency(estimatedValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/45">Account</span>
                <Badge tone="positive">Paper</Badge>
              </div>
            </div>
            <Button onClick={() => setConfirmationOpen(false)} className="mt-5 w-full">
              Done
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>;
}
export {
  OrderTicket
};
