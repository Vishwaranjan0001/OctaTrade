import { RefreshCw } from "lucide-react";
import { EM_DASH, formatQuotePrice, formatRelative } from "../../lib/format.js";
import { Skeleton, describeError } from "../ui/States.jsx";

/**
 * QuoteBlock — the latest quote for one symbol.
 *
 * Purpose : the single presentation of a live price, reused by markets, stock
 *           details, watchlist rows and the terminal. It shows exactly the
 *           three fields the API returns (symbol, price, currency) plus when
 *           the value was fetched. It never derives a day change, percentage
 *           move or previous close, because the endpoint does not provide them.
 * Input   : symbol, query (a React Query result for the quote), size.
 * Output  : the quote display with its own loading and error states.
 */
export function QuoteBlock({ symbol, query, size = "md", showRefresh = true }) {
  const { data, isLoading, isFetching, error, refetch, dataUpdatedAt } = query;

  return (
    <div className={`ot-quote ot-quote--${size}`}>
      <div className="ot-quote__head">
        <span className="ot-quote__symbol ot-mono">{symbol || EM_DASH}</span>
        {showRefresh ? (
          <button
            type="button"
            className="ot-quote__refresh"
            onClick={() => refetch?.()}
            disabled={isFetching}
            aria-label={`Refresh quote for ${symbol}`}
          >
            <RefreshCw
              size={13}
              aria-hidden="true"
              className={isFetching ? "is-spinning" : undefined}
            />
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <Skeleton height={size === "lg" ? 38 : 26} width="58%" />
      ) : error ? (
        <p className="ot-quote__error" role="alert">
          {describeError(error, `the quote for ${symbol}`).title}
        </p>
      ) : (
        <p className="ot-quote__price ot-num">
          {formatQuotePrice(data?.price, data?.currency)}
        </p>
      )}

      <p className="ot-quote__meta ot-label">
        {error
          ? "Quote unavailable"
          : isLoading
            ? "Fetching latest quote"
            : data?.currency
              ? `Latest quote · ${data.currency} · ${formatRelative(dataUpdatedAt)}`
              : "Latest quote"}
      </p>
    </div>
  );
}
