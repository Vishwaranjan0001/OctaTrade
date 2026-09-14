import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Eye, Plus, RefreshCw, Trash2 } from "lucide-react";

import { PageHeader } from "../../components/app/PageHeader.jsx";
import { Panel, PanelBody, PanelHeader } from "../../components/ui/Panel.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { TextField } from "../../components/ui/Field.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { EmptyState, InlineLoader } from "../../components/ui/States.jsx";
import { SourceNotice } from "../../components/app/CoverageNotice.jsx";
import { useQuotes } from "../../hooks/queries.js";
import { useWatchlistStore } from "../../store/watchlistStore.js";
import { EM_DASH, formatQuotePrice, normaliseSymbol } from "../../lib/format.js";
import { toast } from "../../components/ui/Toast.jsx";

const schema = z.object({
  symbol: z.string().trim().min(1, "Enter a symbol").max(20, "Symbols are at most 20 characters")
});

/**
 * Watchlist — symbols the user is tracking.
 *
 * Purpose : keep a list of securities and show each one's live quote. The API
 *           has no watchlist resource, so the list is stored on this device and
 *           the page says so plainly. Prices are always fetched live; nothing
 *           about a symbol is cached or invented.
 * Input   : none (reads the persisted symbol list).
 * Output  : the watchlist table with live quotes and per-row actions.
 */
export default function Watchlist() {
  const symbols = useWatchlistStore((state) => state.symbols);
  const add = useWatchlistStore((state) => state.add);
  const remove = useWatchlistStore((state) => state.remove);
  const clear = useWatchlistStore((state) => state.clear);

  const quotes = useQuotes(symbols);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({ resolver: zodResolver(schema), defaultValues: { symbol: "" } });

  /**
   * Adds a symbol to the watchlist.
   * Input  : validated { symbol }. Output: persists it and triggers its quote
   *          fetch. Duplicates are ignored by the store.
   */
  function onAdd(values) {
    const next = normaliseSymbol(values.symbol);
    if (!next) return;

    if (symbols.includes(next)) {
      toast.info(`${next} is already on your watchlist`);
      reset({ symbol: "" });
      return;
    }

    add(next);
    toast.success(`${next} added`, "Saved to your watchlist on this device.");
    reset({ symbol: "" });
  }

  function onRemove(symbol) {
    remove(symbol);
    toast.info(`${symbol} removed`, "Removed from your watchlist on this device.");
  }

  const rows = symbols.map((symbol) => ({
    symbol,
    quote: quotes.bySymbol.get(symbol)
  }));

  const columns = [
    {
      key: "symbol",
      header: "Symbol",
      render: (row) => (
        <Link className="ot-cell-link ot-mono" to={`/markets/${encodeURIComponent(row.symbol)}`}>
          {row.symbol}
        </Link>
      )
    },
    {
      key: "price",
      header: "Latest price",
      numeric: true,
      render: (row) => {
        const quote = row.quote;
        if (quote?.isLoading) return <InlineLoader label={`Loading ${row.symbol}`} />;
        if (quote?.error) {
          return (
            <span className="ot-cell-muted" title={quote.error.message}>
              Unavailable
            </span>
          );
        }
        return formatQuotePrice(quote?.price, quote?.currency);
      }
    },
    {
      key: "currency",
      header: "Currency",
      render: (row) => row.quote?.currency ?? <span className="ot-cell-muted">{EM_DASH}</span>
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      srOnlyHeader: true,
      render: (row) => (
        <div className="ot-cell-actions">
          <Button
            as={Link}
            to={`/terminal/${encodeURIComponent(row.symbol)}`}
            variant="secondary"
            size="sm"
            iconRight={<ArrowRight size={13} aria-hidden="true" />}
          >
            Trade
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(row.symbol)}
            aria-label={`Remove ${row.symbol} from watchlist`}
            iconLeft={<Trash2 size={13} aria-hidden="true" />}
          >
            Remove
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="ot-stack">
      <PageHeader
        title="Watchlist"
        source="Quotes · stored on this device"
        lede="Track securities and read their latest quote side by side. Each row is fetched live from the quote API when this page loads."
        actions={
          symbols.length > 0 ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => quotes.refetchAll()}
                loading={quotes.isFetching}
                iconLeft={<RefreshCw size={14} aria-hidden="true" />}
              >
                Refresh quotes
              </Button>
              <Button variant="ghost" size="sm" onClick={clear}>
                Clear list
              </Button>
            </>
          ) : null
        }
      />

      <div className="ot-grid ot-grid--secondary">
        <Panel>
          <PanelHeader title="Add a symbol" />
          <PanelBody>
            <form className="ot-market-search" onSubmit={handleSubmit(onAdd)} noValidate>
              <TextField
                label="Symbol"
                placeholder="INFY.NS"
                autoComplete="off"
                spellCheck="false"
                autoCapitalize="characters"
                error={errors.symbol?.message}
                hint="Use the exchange suffix, for example .NS or .BO."
                inputClassName="ot-input--symbol"
                {...register("symbol")}
              />
              <Button type="submit" block iconLeft={<Plus size={15} aria-hidden="true" />}>
                Add to watchlist
              </Button>
            </form>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Tracked symbols"
            meta={`${symbols.length} symbol${symbols.length === 1 ? "" : "s"}`}
          />
          <DataTable
            caption="Watchlist symbols with their latest price and currency from the quote API."
            columns={columns}
            rows={rows}
            rowKey={(row) => row.symbol}
            minWidth={640}
            emptySlot={
              <EmptyState
                icon={Eye}
                title="Your watchlist is empty"
                description="Add a symbol to follow its price. The list is kept on this device because the OctaTrade API does not store watchlists."
              />
            }
          />
        </Panel>
      </div>

      <SourceNotice>
        This watchlist is saved in your browser, not on your OctaTrade account.
        Clearing site data or using another device will start an empty list.
      </SourceNotice>
    </div>
  );
}
