import { AlertTriangle, Info } from "lucide-react";

/**
 * CoverageNotice — discloses incomplete data.
 *
 * Purpose : when a total is computed over only part of the account (because a
 *           live quote failed for some symbols), the figure must not be
 *           presented as complete. This states precisely which symbols are
 *           missing so the reader can judge the number.
 * Input   : pricedCount, totalCount, unpricedSymbols, tone.
 * Output  : the disclosure, or null when coverage is complete.
 */
export function CoverageNotice({ pricedCount, totalCount, unpricedSymbols = [] }) {
  if (!totalCount || pricedCount === totalCount) return null;

  const Icon = pricedCount === 0 ? AlertTriangle : AlertTriangle;

  return (
    <p className="ot-disclosure" role="status">
      <Icon size={14} aria-hidden="true" />
      <span>
        {pricedCount === 0 ? (
          <>
            No live quote could be fetched, so market value and profit or loss
            cannot be calculated. Invested cost is shown from your holdings.
          </>
        ) : (
          <>
            Valuation covers {pricedCount} of {totalCount} holdings. A live quote
            is unavailable for{" "}
            <span className="ot-mono">{unpricedSymbols.join(", ")}</span>, so
            those positions are excluded from market value and profit or loss.
          </>
        )}
      </span>
    </p>
  );
}

/** Neutral informational variant used to explain a data source. */
export function SourceNotice({ children }) {
  return (
    <p className="ot-disclosure ot-disclosure--info" role="note">
      <Info size={14} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
