import { EM_DASH } from "../../lib/format.js";
import { Skeleton } from "./States.jsx";

/**
 * Metric — a single labelled figure.
 *
 * Purpose : dashboards read as a table of figures, not a grid of identical
 *           cards. Metric renders a hairline-separated stat with the label in
 *           the terminal voice and the value in tabular numerals, so columns
 *           of figures align exactly.
 * Input   : label, value (already formatted string), sub, tone
 *           ("pos"|"neg"|"reserved"|null), loading, size, hint.
 * Output  : a <div> stat block. When `loading`, a skeleton of the same height
 *           renders so the layout never shifts.
 */
export function Metric({
  label,
  value,
  sub,
  tone = null,
  loading = false,
  size = "md",
  hint,
  align = "start"
}) {
  return (
    <div
      className={`ot-metric ot-metric--${size} is-${align}`}
      title={hint || undefined}
    >
      <span className="ot-metric__label ot-label">{label}</span>
      {loading ? (
        <Skeleton height={size === "lg" ? 30 : 20} width="72%" />
      ) : (
        <span
          className={[
            "ot-metric__value",
            "ot-num",
            tone ? `ot-metric__value--${tone}` : ""
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {value ?? EM_DASH}
        </span>
      )}
      {sub ? <span className="ot-metric__sub">{sub}</span> : null}
    </div>
  );
}
