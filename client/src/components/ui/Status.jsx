/**
 * StatusMark — order/transaction status indicator.
 *
 * Purpose : the identity avoids pill-shaped labels, so status is expressed as
 *           a small square glyph plus the status word in the terminal voice.
 *           Colour never carries the meaning alone — the word is always shown.
 * Input   : status string (NEW | FILLED | REJECTED | CANCELLED | DEPOSIT | ...).
 * Output  : inline status indicator.
 */
const TONES = {
  FILLED: "pos",
  COMPLETE: "pos",
  CREDIT: "pos",
  DEPOSIT: "pos",
  NEW: "reserved",
  PENDING: "reserved",
  RESERVE: "reserved",
  PARTIAL: "reserved",
  REJECTED: "neg",
  CANCELLED: "neg",
  FAILED: "neg",
  DEBIT: "neutral",
  RELEASE: "neutral"
};

export function StatusMark({ status, size = "md" }) {
  const key = String(status || "").toUpperCase();
  const tone = TONES[key] || "neutral";

  return (
    <span className={`ot-status ot-status--${tone} ot-status--${size}`}>
      <span className="ot-status__glyph" aria-hidden="true" />
      <span className="ot-status__text ot-mono">{key || "—"}</span>
    </span>
  );
}

/**
 * SideMark — BUY / SELL indicator for order rows.
 * Purpose: side is the most scanned column in an order blotter, so it gets a
 * dedicated treatment with a directional glyph rather than a coloured pill.
 */
export function SideMark({ side }) {
  const key = String(side || "").toUpperCase();
  const isBuy = key === "BUY";

  return (
    <span className={`ot-side ${isBuy ? "is-buy" : "is-sell"}`}>
      <span className="ot-side__arrow" aria-hidden="true">
        {isBuy ? "↗" : "↘"}
      </span>
      <span className="ot-mono">{key || "—"}</span>
    </span>
  );
}
