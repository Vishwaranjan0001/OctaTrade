import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
  Local UI state only — nothing here is server data.

  theme         : "dark" | "light" | "system". Applied to <html data-theme>.
  motionEnabled : the in-product pause-motion control. Combined with the OS
                  prefers-reduced-motion query by useMotionPreference().
  sidebarOpen   : mobile navigation drawer (not persisted; always starts shut).
  compactRows   : denser table rows for small screens / power users.
*/
export const useUiStore = create(
  persist(
    (set, get) => ({
      theme: "dark",
      motionEnabled: true,
      compactRows: false,
      sidebarOpen: false,

      setTheme(theme) {
        set({ theme });
      },

      toggleTheme() {
        const current = get().theme;
        set({ theme: current === "light" ? "dark" : "light" });
      },

      setMotionEnabled(motionEnabled) {
        set({ motionEnabled });
      },

      toggleMotion() {
        set({ motionEnabled: !get().motionEnabled });
      },

      setCompactRows(compactRows) {
        set({ compactRows });
      },

      setSidebarOpen(sidebarOpen) {
        set({ sidebarOpen });
      },

      closeSidebar() {
        set({ sidebarOpen: false });
      }
    }),
    {
      name: "octatrade.ui",
      version: 1,
      partialize: (state) => ({
        theme: state.theme,
        motionEnabled: state.motionEnabled,
        compactRows: state.compactRows
      })
    }
  )
);
