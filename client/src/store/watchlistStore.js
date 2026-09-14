import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normaliseSymbol } from "../lib/format.js";

/*
  The OctaTrade API has no watchlist resource, so the watchlist is stored on
  this device. Every surface that reads it says so explicitly rather than
  implying the list is synced to the account — inventing a server-backed
  watchlist would misrepresent what the backend actually provides.

  Only symbols are stored. Prices are always fetched live from
  GET /api/quotes/:symbol; nothing about a security is cached or invented.
*/
export const useWatchlistStore = create(
  persist(
    (set, get) => ({
      symbols: [],

      add(symbol) {
        const next = normaliseSymbol(symbol);
        if (!next) return;
        const { symbols } = get();
        if (symbols.includes(next)) return;
        set({ symbols: [...symbols, next] });
      },

      remove(symbol) {
        const next = normaliseSymbol(symbol);
        set({ symbols: get().symbols.filter((entry) => entry !== next) });
      },

      toggle(symbol) {
        const next = normaliseSymbol(symbol);
        if (!next) return;
        const { symbols } = get();
        set({
          symbols: symbols.includes(next)
            ? symbols.filter((entry) => entry !== next)
            : [...symbols, next]
        });
      },

      has(symbol) {
        return get().symbols.includes(normaliseSymbol(symbol));
      },

      clear() {
        set({ symbols: [] });
      }
    }),
    { name: "octatrade.watchlist", version: 1 }
  )
);

/** Stable selector so components don't resubscribe on every render. */
export const selectSymbols = (state) => state.symbols;
