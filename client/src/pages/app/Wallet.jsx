import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Banknote, Plus, RefreshCw } from "lucide-react";

import { PageHeader } from "../../components/app/PageHeader.jsx";
import { Panel, PanelHeader } from "../../components/ui/Panel.jsx";
import { Metric } from "../../components/ui/Metric.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { TextField } from "../../components/ui/Field.jsx";
import { Dialog } from "../../components/ui/Dialog.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { StatusMark } from "../../components/ui/Status.jsx";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  describeError
} from "../../components/ui/States.jsx";
import { SourceNotice } from "../../components/app/CoverageNotice.jsx";
import { toast } from "../../components/ui/Toast.jsx";
import {
  useDepositMutation,
  useWallet,
  useWalletTransactions
} from "../../hooks/queries.js";
import {
  formatDateTime,
  formatPaise,
  rupeesToPaise
} from "../../lib/format.js";

/*
  The deposit endpoint requires a positive INTEGER number of paise. The form
  takes rupees for usability and converts, rejecting amounts that do not land
  on a whole paisa.
*/
const schema = z.object({
  amount: z.coerce
    .number({ message: "Enter an amount in rupees" })
    .positive("Amount must be greater than zero")
    .max(10_000_000, "Enter an amount up to ₹1,00,00,000")
    .refine(
      (value) => Number.isInteger(Math.round(value * 100)) && Math.round(value * 100) > 0,
      "Use at most two decimal places"
    )
});

/**
 * Wallet — virtual funds and the settlement ledger.
 *
 * Purpose : show the real wallet balances and the real transaction history, and
 *           allow a deposit of virtual funds through POST /api/wallet/deposit.
 * Input   : none; the deposit dialog takes a rupee amount.
 * Output  : the wallet page.
 */
export default function Wallet() {
  const wallet = useWallet();
  const transactions = useWalletTransactions();
  const deposit = useDepositMutation();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({ resolver: zodResolver(schema), defaultValues: { amount: "" } });

  const amountPaise = rupeesToPaise(Number(watch("amount")));

  /**
   * Credits virtual funds to the wallet.
   * Input  : validated { amount } in rupees.
   * Output : converts to integer paise, calls the deposit API, and reports the
   *          result. React Query invalidation refreshes balances and the ledger.
   */
  async function onDeposit(values) {
    const paise = rupeesToPaise(values.amount);
    if (!paise || paise <= 0) return;

    try {
      await deposit.mutateAsync(paise);
      toast.success("Funds credited", `${formatPaise(paise)} added to your wallet.`);
      setOpen(false);
      reset({ amount: "" });
    } catch {
      /* Surfaced in the dialog. */
    }
  }

  const apiError = deposit.error ? describeError(deposit.error, "the deposit") : null;

  const columns = [
    {
      key: "createdAt",
      header: "When",
      render: (row) => formatDateTime(row.createdAt)
    },
    {
      key: "type",
      header: "Type",
      render: (row) => <StatusMark status={row.type} />
    },
    {
      key: "amountPaise",
      header: "Amount",
      numeric: true,
      render: (row) => formatPaise(row.amountPaise)
    },
    {
      key: "availableBalanceAfterPaise",
      header: "Available after",
      numeric: true,
      render: (row) => formatPaise(row.availableBalanceAfterPaise)
    },
    {
      key: "reservedBalanceAfterPaise",
      header: "Reserved after",
      numeric: true,
      render: (row) => formatPaise(row.reservedBalanceAfterPaise)
    }
  ];

  return (
    <div className="ot-stack">
      <PageHeader
        title="Wallet"
        source="GET /api/wallet · /transactions"
        lede="Virtual INR held against this account. Balances are stored as integer paise, which is why every figure settles exactly."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                wallet.refetch();
                transactions.refetch();
              }}
              loading={wallet.isFetching || transactions.isFetching}
              iconLeft={<RefreshCw size={14} aria-hidden="true" />}
            >
              Refresh
            </Button>
            <Button size="sm" onClick={() => setOpen(true)} iconLeft={<Plus size={14} aria-hidden="true" />}>
              Deposit funds
            </Button>
          </>
        }
      />

      {wallet.error ? (
        <Panel>
          <ErrorState error={wallet.error} subject="your wallet" onRetry={wallet.refetch} />
        </Panel>
      ) : (
        <Panel>
          <div className="ot-metric-row">
            <Metric
              label="Available"
              value={formatPaise(wallet.data?.availableBalancePaise)}
              sub="Spendable on new orders"
              size="lg"
              loading={wallet.isLoading}
            />
            <Metric
              label="Reserved"
              value={formatPaise(wallet.data?.reservedBalancePaise)}
              tone={wallet.data?.reservedBalancePaise ? "reserved" : null}
              sub="Held against working orders"
              size="lg"
              loading={wallet.isLoading}
            />
            <Metric
              label="Total"
              value={
                wallet.data
                  ? formatPaise(
                      (wallet.data.availableBalancePaise ?? 0) +
                        (wallet.data.reservedBalancePaise ?? 0)
                    )
                  : null
              }
              sub="Available plus reserved"
              loading={wallet.isLoading}
            />
            <Metric
              label="Currency"
              value={wallet.data?.currency ?? null}
              sub="Virtual funds only"
              loading={wallet.isLoading}
            />
          </div>
        </Panel>
      )}

      <Panel>
        <PanelHeader
          title="Ledger"
          meta={`${(transactions.data ?? []).length} entr${
            (transactions.data ?? []).length === 1 ? "y" : "ies"
          }`}
          description="Every movement of virtual funds, newest first."
        />
        <DataTable
          caption="Wallet transactions with timestamp, type, amount, and the available and reserved balances after each movement."
          columns={columns}
          rows={transactions.data ?? []}
          minWidth={760}
          loading={transactions.isLoading}
          loadingSlot={<LoadingState label="Loading ledger" rows={5} columns={5} />}
          errorSlot={
            transactions.error ? (
              <ErrorState
                error={transactions.error}
                subject="your wallet ledger"
                onRetry={transactions.refetch}
              />
            ) : null
          }
          emptySlot={
            <EmptyState
              icon={Banknote}
              title="No wallet movements yet"
              description="Your opening balance was credited when the account was created. Deposits and order settlements will be listed here."
            />
          }
        />
      </Panel>

      <SourceNotice>
        These are virtual funds for paper trading. No payment method is attached
        to this account and no real money can enter or leave it.
      </SourceNotice>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          deposit.reset();
        }}
        title="Deposit virtual funds"
        description="Credits your paper-trading wallet. The API accepts whole paise, so the amount is converted before it is sent."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={deposit.isPending}
              onClick={handleSubmit(onDeposit)}
              iconLeft={<Plus size={15} aria-hidden="true" />}
            >
              {deposit.isPending ? "Crediting" : "Deposit"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onDeposit)} noValidate>
          <TextField
            label="Amount (INR)"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder="10000"
            suffix="INR"
            error={errors.amount?.message}
            hint={
              amountPaise && amountPaise > 0
                ? `Sends amountPaise: ${amountPaise}`
                : "Converted to integer paise before sending."
            }
            {...register("amount")}
          />
        </form>

        {apiError ? (
          <div className="ot-auth__error" role="alert" style={{ marginTop: 18 }}>
            <AlertCircle size={16} aria-hidden="true" />
            <span>
              <strong style={{ fontWeight: 560 }}>{apiError.title}.</strong>{" "}
              {apiError.description}
            </span>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
