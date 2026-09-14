import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normaliseSymbol } from "../lib/format.js";

const MAX_RECENT = 8;

/*
  Symbols this user has actually looked up, most recent first. Purely a
  navigation convenience for the markets search and the terminal's symbol
  switcher — it records what the user typed, never invented tickers.
*/
export const useRecentSymbolsStore = create(
  persist(
    (set, get) => ({
      symbols: [],

      record(symbol) {
        const next = normaliseSymbol(symbol);
        if (!next) return;
        const remaining = get().symbols.filter((entry) => entry !== next);
        set({ symbols: [next, ...remaining].slice(0, MAX_RECENT) });
      },

      clear() {
        set({ symbols: [] });
      }
    }),
    { name: "octatrade.recent-symbols", version: 1 }
  )
);
