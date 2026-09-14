import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, History, Search } from "lucide-react";

import { PageHeader } from "../../components/app/PageHeader.jsx";
import { Panel, PanelBody, PanelHeader } from "../../components/ui/Panel.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { TextField } from "../../components/ui/Field.jsx";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/States.jsx";
import { QuoteBlock } from "../../components/app/QuoteBlock.jsx";
import { WatchlistToggle } from "../../components/app/WatchlistToggle.jsx";
import { SourceNotice } from "../../components/app/CoverageNotice.jsx";
import { useQuote } from "../../hooks/queries.js";
import { useRecentSymbolsStore } from "../../store/recentSymbolsStore.js";
import { normaliseSymbol } from "../../lib/format.js";

/*
  The quote middleware upper-cases the symbol and rejects anything longer than
  20 characters, so the form enforces the same bounds before sending.
*/
const schema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Enter a symbol")
    .max(20, "Symbols are at most 20 characters")
    .regex(/^[A-Za-z0-9.\-^=]+$/, "Use letters, digits, dots or hyphens")
});

/**
 * Markets — symbol lookup.
 *
 * Purpose : the entry point to any security. Resolves a user-typed symbol
 *           against GET /api/quotes/:symbol and shows exactly what comes back.
 *           There is no browsable instrument list because the backend exposes
 *           no search or listing endpoint — inventing one would mean inventing
 *           securities.
 * Input   : a symbol from the form.
 * Output  : the live quote plus routes onward to details, the terminal and the
 *           watchlist.
 */
export default function Markets() {
  const [symbol, setSymbol] = useState("");
  const recent = useRecentSymbolsStore((state) => state.symbols);
  const record = useRecentSymbolsStore((state) => state.record);
  const clearRecent = useRecentSymbolsStore((state) => state.clear);

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { symbol: "" }
  });

  useEffect(() => {
    setFocus("symbol");
  }, [setFocus]);

  const quote = useQuote(symbol, { enabled: Boolean(symbol) });

  /**
   * Runs a lookup.
   * Input  : validated { symbol }. Output: sets the active symbol, which
   *          enables the quote query, and records it in the recent list.
   */
  function onSubmit(values) {
    const next = normaliseSymbol(values.symbol);
    if (!next) return;
    setSymbol(next);
    record(next);
  }

  /** Re-runs a lookup from the recent list without retyping. */
  function lookup(next) {
    setValue("symbol", next);
    setSymbol(next);
    record(next);
  }

  return (
    <div className="ot-stack">
      <PageHeader
        title="Markets"
        source="GET /api/quotes/:symbol"
        lede="Look up any Yahoo Finance-compatible symbol. OctaTrade returns the symbol, its latest price and its currency — no derived day change or company profile, because the quote endpoint does not provide them."
      />

      <div className="ot-grid ot-grid--secondary">
        <Panel>
          <PanelHeader title="Symbol lookup" meta="Live" />
          <PanelBody>
            <form className="ot-market-search" onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                label="Symbol"
                placeholder="TCS.NS"
                autoComplete="off"
                spellCheck="false"
                autoCapitalize="characters"
                error={errors.symbol?.message}
                hint="Indian listings use a suffix: .NS for NSE, .BO for BSE."
                inputClassName="ot-input--symbol"
                {...register("symbol")}
              />
              <Button type="submit" block size="lg" iconLeft={<Search size={15} aria-hidden="true" />}>
                Get latest quote
              </Button>
            </form>

            {recent.length > 0 ? (
              <div className="ot-recent">
                <div className="ot-recent__head">
                  <span className="ot-label">
                    <History size={12} aria-hidden="true" style={{ marginRight: 6, verticalAlign: -1 }} />
                    Recently looked up
                  </span>
                  <button type="button" className="ot-recent__clear" onClick={clearRecent}>
                    Clear
                  </button>
                </div>
                <ul className="ot-recent__list">
                  {recent.map((entry) => (
                    <li key={entry}>
                      <button
                        type="button"
                        className="ot-recent__chip ot-mono"
                        onClick={() => lookup(entry)}
                      >
                        {entry}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title={symbol ? `${symbol} — latest quote` : "Latest quote"}
            actions={
              symbol ? (
                <>
                  <WatchlistToggle symbol={symbol} />
                  <Button as={Link} to={`/markets/${encodeURIComponent(symbol)}`} variant="secondary" size="sm">
                    Details
                  </Button>
                  <Button
                    as={Link}
                    to={`/terminal/${encodeURIComponent(symbol)}`}
                    size="sm"
                    iconRight={<ArrowRight size={14} aria-hidden="true" />}
                  >
                    Trade
                  </Button>
                </>
              ) : null
            }
          />
          <PanelBody>
            {!symbol ? (
              <EmptyState
                icon={Search}
                title="No symbol selected"
                description="Enter a symbol to fetch its latest price. Nothing is shown until the API responds — OctaTrade never displays a placeholder price."
              />
            ) : quote.error ? (
              <ErrorState
                error={quote.error}
                subject={`the quote for ${symbol}`}
                onRetry={quote.refetch}
              />
            ) : (
              <>
                <QuoteBlock symbol={symbol} query={quote} size="lg" />

                <dl className="ot-kv" style={{ marginTop: 18 }}>
                  <div className="ot-kv__row">
                    <dt className="ot-kv__key">Resolved symbol</dt>
                    <dd className="ot-kv__val">
                      {quote.isLoading ? <Skeleton height={14} width={90} /> : quote.data?.symbol ?? symbol}
                    </dd>
                  </div>
                  <div className="ot-kv__row">
                    <dt className="ot-kv__key">Currency</dt>
                    <dd className="ot-kv__val">
                      {quote.isLoading ? <Skeleton height={14} width={54} /> : quote.data?.currency ?? "—"}
                    </dd>
                  </div>
                  <div className="ot-kv__row">
                    <dt className="ot-kv__key">Historical series</dt>
                    <dd className="ot-kv__val">Not provided by this API</dd>
                  </div>
                </dl>
              </>
            )}
          </PanelBody>
        </Panel>
      </div>

      <SourceNotice>
        Symbols are resolved by the upstream market-data provider. If a symbol
        returns an error, check the exchange suffix — OctaTrade passes the symbol
        through unchanged and does not guess alternatives.
      </SourceNotice>
    </div>
  );
}
