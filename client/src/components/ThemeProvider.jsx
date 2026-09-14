import { useEffect } from "react";
import { useUiStore } from "../store/uiStore.js";
import { useMediaQuery } from "../hooks/useMediaQuery.js";

/**
 * Applies the selected theme to the document root.
 *
 * Purpose : one place decides the value of <html data-theme>, so every token
 *           in tokens.css switches atomically and no component has to know
 *           which theme is active.
 * Input   : children; reads `theme` ("dark" | "light" | "system") from the ui store.
 * Output  : renders children; side effect on documentElement.
 */
export function ThemeProvider({ children }) {
  const theme = useUiStore((state) => state.theme);
  const prefersLight = useMediaQuery("(prefers-color-scheme: light)");

  useEffect(() => {
    const resolved = theme === "system" ? (prefersLight ? "light" : "dark") : theme;
    const root = document.documentElement;
    root.dataset.theme = resolved;
    // Keeps form controls, scrollbars and the address bar in step.
    root.style.colorScheme = resolved;
  }, [theme, prefersLight]);

  return children;
}

/** Resolves the theme actually in effect — charts need the concrete value. */
export function useResolvedTheme() {
  const theme = useUiStore((state) => state.theme);
  const prefersLight = useMediaQuery("(prefers-color-scheme: light)");
  if (theme === "system") return prefersLight ? "light" : "dark";
  return theme;
}
