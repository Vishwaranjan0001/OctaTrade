import { create } from "zustand";
import { persist } from "zustand/middleware";
const useAppStore = create()(
  persist(
    (set) => ({
      token: null,
      user: null,
      theme: "dark",
      sidebarCollapsed: false,
      watchlist: [],
      selectedSymbol: "",
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      toggleTheme: () => set((state) => ({
        theme: state.theme === "dark" ? "light" : "dark"
      })),
      toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed
      })),
      toggleWatchlist: (symbol) => set((state) => ({
        watchlist: state.watchlist.includes(symbol) ? state.watchlist.filter((item) => item !== symbol) : [...state.watchlist, symbol]
      })),
      setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol })
    }),
    {
      name: "octatrade-app",
      version: 2,
      migrate: (persistedState) => {
        const state = { ...(persistedState ?? {}) };
        Reflect.deleteProperty(state, "demoMode");
        const originalSeed = ["TCS.NS", "RELIANCE.NS", "INFY.NS", "HDFCBANK.NS"];
        const watchlist = Array.isArray(state.watchlist) ? state.watchlist : [];
        const hasOriginalSeed = watchlist.length === originalSeed.length && originalSeed.every((symbol) => watchlist.includes(symbol));
        return {
          ...state,
          user: state.token ? state.user : null,
          watchlist: hasOriginalSeed ? [] : watchlist,
          selectedSymbol: hasOriginalSeed ? "" : state.selectedSymbol ?? ""
        };
      }
    }
  )
);
export {
  useAppStore
};
