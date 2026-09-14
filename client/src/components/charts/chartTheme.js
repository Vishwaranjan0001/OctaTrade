/*
  Chart palette resolved from the CSS custom properties so charts always match
  the active theme instead of hard-coding colours in two places.
*/

function cssVar(name, fallback) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/**
 * Applies an alpha channel to a resolved colour.
 *
 * Purpose : canvas fillStyle cannot be relied on to evaluate CSS color-mix(),
 *           so translucent chart fills (volume bars, area gradients) need a
 *           concrete rgba()/#rrggbbaa value computed here.
 * Input   : a hex (#rgb/#rrggbb), rgb()/rgba() string, and alpha 0..1.
 * Output  : a colour string with the requested alpha, or the input unchanged
 *           when the format is not recognised.
 */
export function withAlpha(colour, alpha) {
  if (typeof colour !== "string") return colour;
  const value = colour.trim();
  const clamped = Math.max(0, Math.min(1, alpha));

  const shortHex = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  if (shortHex) {
    const [, r, g, b] = shortHex;
    return `rgba(${parseInt(r + r, 16)}, ${parseInt(g + g, 16)}, ${parseInt(b + b, 16)}, ${clamped})`;
  }

  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  if (hex) {
    const [, r, g, b] = hex;
    return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${clamped})`;
  }

  const rgb = /^rgba?\(([^)]+)\)$/i.exec(value);
  if (rgb) {
    const parts = rgb[1].split(/[,/\s]+/).filter(Boolean).slice(0, 3);
    if (parts.length === 3) return `rgba(${parts.join(", ")}, ${clamped})`;
  }

  return value;
}

/**
 * Reads the current theme's chart colours.
 * Input  : theme ("dark" | "light") — used only to pick sensible fallbacks.
 * Output : a flat colour map for lightweight-charts and Recharts.
 */
export function readChartTheme(theme) {
  const isDark = theme !== "light";

  return {
    text: cssVar("--text-muted", isDark ? "#8B9DBB" : "#4C5F7C"),
    textFaint: cssVar("--text-faint", isDark ? "#6E84A6" : "#6B7C97"),
    grid: cssVar("--line", isDark ? "rgba(180,194,214,0.11)" : "rgba(16,28,48,0.12)"),
    border: cssVar("--line-strong", isDark ? "rgba(180,194,214,0.2)" : "rgba(16,28,48,0.22)"),
    surface: cssVar("--surface-inset", isDark ? "#05080F" : "#EBEFF5"),
    accent: cssVar("--accent", isDark ? "#33D2E6" : "#0B7F98"),
    up: cssVar("--pos", isDark ? "#37D9B4" : "#1FB395"),
    down: cssVar("--neg", isDark ? "#FF6F61" : "#E24E40"),
    reserved: cssVar("--reserved", isDark ? "#8878EE" : "#6A57D8")
  };
}

/*
  Allocation palette.

  Eight steps, one per octagon side. Two rules govern it:

  1. It is TONAL, not rainbow. The ramp moves through the identity's own
     family — cyan, steel, silver, with a single rationed violet — so a
     portfolio chart reads as part of the product rather than as a pie of
     unrelated hues.
  2. Adjacent entries differ in LIGHTNESS as well as hue, so neighbouring
     slices stay separable in greyscale and for colour-vision deficiency.

  Each theme has its own ramp because the light theme needs materially darker
  values to hold contrast against white.
*/
const ALLOCATION_DARK = [
  "#35C6DA", // cyan, the primary holding
  "#445F86", // steel
  "#93A9C4", // light steel
  "#7E6FE0", // the single violet accent
  "#1B7D92", // deep cyan
  "#C6D1E0", // silver
  "#2C405E", // dark steel
  "#93DFEB"  // pale cyan
];

const ALLOCATION_LIGHT = [
  "#0E7E96",
  "#3C5480",
  "#6E86A8",
  "#5B49C4",
  "#0A5C6E",
  "#9AACC2",
  "#22344F",
  "#49AEC2"
];

/**
 * Returns the allocation ramp for the active theme.
 * Input  : theme ("dark" | "light").
 * Output : an array of eight hex colours.
 */
export function allocationColours(theme) {
  return theme === "light" ? ALLOCATION_LIGHT : ALLOCATION_DARK;
}

/* Kept for any caller that does not know the theme; defaults to the dark ramp. */
export const ALLOCATION_COLOURS = ALLOCATION_DARK;
