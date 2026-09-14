import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowRight, ShoppingCart } from "lucide-react";

import { Button } from "../ui/Button.jsx";
import { SegmentedControl, TextField } from "../ui/Field.jsx";
import { Dialog } from "../ui/Dialog.jsx";
import { SideMark } from "../ui/Status.jsx";
import { describeError } from "../ui/States.jsx";
import { toast } from "../ui/Toast.jsx";
import { usePlaceOrderMutation } from "../../hooks/queries.js";
import {
  EM_DASH,
  formatPaise,
  formatQty,
  formatQuotePrice,
  isNum
} from "../../lib/format.js";

/*
  Quantity is a positive integer: the Holding model stores share counts and the
  order endpoint settles whole shares.
*/
const schema = z.object({
  quantity: z.coerce
    .number({ message: "Enter a quantity" })
    .int("Whole shares only")
    .positive("Quantity must be at least 1")
    .max(1_000_000, "Quantity is unrealistically large")
});

/**
 * OrderTicket — places a real paper order.
 *
 * Purpose : the product's central action. Collects side and quantity, validates
 *           against the account's ACTUAL buying power and ACTUAL holdings,
 *           shows the estimated consideration, then submits to POST /api/orders
 *           and reports whatever the API returns. No order is ever simulated:
 *           if the request fails, the failure is shown.
 * Input   : symbol, quote { price, currency }, wallet
 *           { availableBalancePaise, reservedBalancePaise }, heldQuantity,
 *           onPlaced callback.
 * Output  : the ticket UI. On success calls onPlaced(order) and toasts the
 *           API's response.
 */
export function OrderTicket({
  symbol,
  quote,
  quoteError,
  isQuoteLoading,
  wallet,
  heldQuantity = 0,
  onPlaced
}) {
  const [side, setSide] = useState("BUY");
  const [reviewOpen, setReviewOpen] = useState(false);
  const placeOrder = usePlaceOrderMutation();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { quantity: "" },
    mode: "onChange"
  });

  const quantityRaw = watch("quantity");
  const quantity = Number(quantityRaw);
  const hasQuantity = isNum(quantity) && quantity > 0;

  const pricePaise = isNum(quote?.price) ? Math.round(quote.price * 100) : null;
  const availablePaise = wallet?.availableBalancePaise ?? null;

  /* Derived consideration. All money maths happens in integer paise. */
  const estimate = useMemo(() => {
    if (!hasQuantity || pricePaise === null) {
      return { valuePaise: null, afterPaise: null };
    }
    const valuePaise = Math.round(quantity * pricePaise);
    const afterPaise =
      availablePaise === null
        ? null
        : side === "BUY"
          ? availablePaise - valuePaise
          : availablePaise + valuePaise;
    return { valuePaise, afterPaise };
  }, [hasQuantity, quantity, pricePaise, availablePaise, side]);

  /* Business rules checked before the API is called, so the user is not sent
     into a guaranteed rejection. These mirror what the backend enforces. */
  const blocking = useMemo(() => {
    if (!symbol) return "Choose a symbol first.";
    if (pricePaise === null) {
      return "A live quote is required before an order can be priced.";
    }
    if (!hasQuantity) return null;

    if (side === "BUY") {
      if (availablePaise === null) return "Wallet balance is unavailable.";
      if (estimate.valuePaise !== null && estimate.valuePaise > availablePaise) {
        return `Insufficient balance. This order needs ${formatPaise(
          estimate.valuePaise
        )} but ${formatPaise(availablePaise)} is available.`;
      }
    }

    if (side === "SELL") {
      if (!heldQuantity || heldQuantity <= 0) {
        return `You hold no ${symbol} to sell.`;
      }
      if (quantity > heldQuantity) {
        return `You hold ${formatQty(heldQuantity)} ${symbol}. Reduce the quantity.`;
      }
    }

    return null;
  }, [
    symbol,
    pricePaise,
    hasQuantity,
    side,
    availablePaise,
    estimate.valuePaise,
    heldQuantity,
    quantity
  ]);

  const canReview = hasQuantity && !blocking && !errors.quantity && pricePaise !== null;

  /**
   * Opens the review dialog. Purpose: an order is never sent on a single
   * click — the user confirms the consideration first.
   */
  function onReview() {
    if (!canReview) return;
    setReviewOpen(true);
  }

  /**
   * Submits the order to the real API.
   * Input  : none (reads side/quantity from state).
   * Output : awaits POST /api/orders; on success closes the dialog, clears the
   *          quantity and reports the returned order. Errors stay visible.
   */
  async function onConfirm() {
    try {
      const order = await placeOrder.mutateAsync({
        symbol,
        side,
        quantity: Math.trunc(quantity)
      });

      setReviewOpen(false);
      reset({ quantity: "" });

      toast.success(
        `${side} order submitted`,
        order?.status
          ? `${symbol} · status ${order.status}`
          : `${symbol} · ${formatQty(quantity)} shares`
      );

      onPlaced?.(order);
    } catch {
      /* Rendered from mutation state inside the dialog. */
    }
  }

  const apiError = placeOrder.error
    ? describeError(placeOrder.error, "the order")
    : null;

  return (
    <div className="ot-ticket">
      <SegmentedControl
        label="Order side"
        name="side"
        value={side}
        onChange={(next) => {
          setSide(next);
          placeOrder.reset();
        }}
        options={[
          { value: "BUY", label: "Buy", tone: "pos" },
          { value: "SELL", label: "Sell", tone: "neg" }
        ]}
      />

      <form
        className="ot-ticket__form"
        onSubmit={handleSubmit(onReview)}
        noValidate
      >
        <TextField
          label="Quantity (shares)"
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          placeholder="0"
          suffix="QTY"
          error={errors.quantity?.message}
          hint={
            side === "SELL" && heldQuantity > 0
              ? `You hold ${formatQty(heldQuantity)} ${symbol}`
              : undefined
          }
          {...register("quantity")}
        />

        <dl className="ot-ticket__summary">
          <div className="ot-kv__row">
            <dt className="ot-kv__key">Latest quote</dt>
            <dd className="ot-kv__val">
              {isQuoteLoading
                ? "Fetching…"
                : quoteError
                  ? "Unavailable"
                  : formatQuotePrice(quote?.price, quote?.currency)}
            </dd>
          </div>
          <div className="ot-kv__row">
            <dt className="ot-kv__key">Estimated order value</dt>
            <dd className="ot-kv__val">
              {estimate.valuePaise === null ? EM_DASH : formatPaise(estimate.valuePaise)}
            </dd>
          </div>
          <div className="ot-kv__row">
            <dt className="ot-kv__key">Available balance</dt>
            <dd className="ot-kv__val">{formatPaise(availablePaise)}</dd>
          </div>
          <div className="ot-kv__row">
            <dt className="ot-kv__key">Estimated balance after</dt>
            <dd
              className={`ot-kv__val ${
                estimate.afterPaise !== null && estimate.afterPaise < 0
                  ? "ot-kv__val--neg"
                  : ""
              }`}
            >
              {estimate.afterPaise === null ? EM_DASH : formatPaise(estimate.afterPaise)}
            </dd>
          </div>
        </dl>

        {blocking ? (
          <p className="ot-ticket__block" role="status">
            <AlertCircle size={14} aria-hidden="true" />
            <span>{blocking}</span>
          </p>
        ) : null}

        <Button
          type="submit"
          block
          size="lg"
          variant="primary"
          disabled={!canReview}
          iconRight={<ArrowRight size={15} aria-hidden="true" />}
        >
          Review {side.toLowerCase()} order
        </Button>

        <p className="ot-ticket__note">
          Paper order. Settled against your virtual wallet at the price the API
          returns on execution — the figures above are estimates from the latest
          quote.
        </p>
      </form>

      <Dialog
        open={reviewOpen}
        onClose={() => {
          setReviewOpen(false);
          placeOrder.reset();
        }}
        title="Review order"
        description="Confirm the details below. This submits a real request to the OctaTrade order API."
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setReviewOpen(false);
                placeOrder.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              variant={side === "BUY" ? "primary" : "danger"}
              loading={placeOrder.isPending}
              onClick={onConfirm}
              iconLeft={<ShoppingCart size={15} aria-hidden="true" />}
            >
              {placeOrder.isPending ? "Submitting" : `Place ${side.toLowerCase()} order`}
            </Button>
          </>
        }
      >
        <dl className="ot-kv">
          <div className="ot-kv__row">
            <dt className="ot-kv__key">Symbol</dt>
            <dd className="ot-kv__val">{symbol}</dd>
          </div>
          <div className="ot-kv__row">
            <dt className="ot-kv__key">Side</dt>
            <dd className="ot-kv__val">
              <SideMark side={side} />
            </dd>
          </div>
          <div className="ot-kv__row">
            <dt className="ot-kv__key">Quantity</dt>
            <dd className="ot-kv__val">{formatQty(Math.trunc(quantity) || 0)}</dd>
          </div>
          <div className="ot-kv__row">
            <dt className="ot-kv__key">Order type</dt>
            <dd className="ot-kv__val">MARKET</dd>
          </div>
          <div className="ot-kv__row">
            <dt className="ot-kv__key">Latest quote</dt>
            <dd className="ot-kv__val">
              {formatQuotePrice(quote?.price, quote?.currency)}
            </dd>
          </div>
          <div className="ot-kv__row">
            <dt className="ot-kv__key">Estimated value</dt>
            <dd className="ot-kv__val">{formatPaise(estimate.valuePaise)}</dd>
          </div>
        </dl>

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
