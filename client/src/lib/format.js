/*
  Money, quantity, percentage and time formatting.

  Unit contract (the single most important invariant in this client):
    - The OctaTrade API stores and returns money as INTEGER PAISE.
        wallet.availableBalancePaise, holding.averageBuyPricePaise,
        walletTransaction.amountPaise, order.*Paise
    - The quote API returns market prices as RUPEE FLOATS.
        GET /api/quotes/:symbol -> { symbol, price, currency }
  Every conversion between the two happens here and nowhere else.

  Unknown data is rendered as EM_DASH. We never substitute 0 or an invented
  fallback for a value the backend has not given us.
*/

export const EM_DASH = "—";

const PAISE_PER_RUPEE = 100;

/**
 * True only for real, finite numbers. Guards against null, undefined, "",
 * NaN and Infinity arriving from JSON.
 */
export function isNum(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/** Integer paise -> rupees (float). Returns null when the input is unusable. */
export function paiseToRupees(paise) {
  if (!isNum(paise)) return null;
  return paise / PAISE_PER_RUPEE;
}

/**
 * Rupees (float) -> integer paise, rounded to the nearest paisa.
 * Used when sending a deposit amount or a limit price to the API, which
 * rejects non-integer paise values.
 */
export function rupeesToPaise(rupees) {
  if (!isNum(rupees)) return null;
  return Math.round(rupees * PAISE_PER_RUPEE);
}

const inrFormatters = new Map();

function inrFormatter(minimumFractionDigits, maximumFractionDigits) {
  const key = `${minimumFractionDigits}:${maximumFractionDigits}`;
  let formatter = inrFormatters.get(key);
  if (!formatter) {
    // en-IN gives correct lakh/crore digit grouping (1,00,000.00).
    formatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits,
      maximumFractionDigits
    });
    inrFormatters.set(key, formatter);
  }
  return formatter;
}

/**
 * Rupee amount -> "₹1,00,000.00".
 * `digits` controls fraction digits; pass 0 for whole-rupee display.
 */
export function formatInr(rupees, { digits = 2, fallback = EM_DASH } = {}) {
  if (!isNum(rupees)) return fallback;
  return inrFormatter(digits, digits).format(rupees);
}

/** Integer paise -> "₹1,00,000.00". The formatter used by almost every view. */
export function formatPaise(paise, options) {
  const rupees = paiseToRupees(paise);
  if (rupees === null) return options?.fallback ?? EM_DASH;
  return formatInr(rupees, options);
}

/**
 * Compact INR for chart axes and dense table headers: ₹1.2L, ₹3.4Cr.
 * Indian conventions, not the western K/M scale.
 */
export function formatPaiseCompact(paise, { fallback = EM_DASH } = {}) {
  const rupees = paiseToRupees(paise);
  if (rupees === null) return fallback;

  const abs = Math.abs(rupees);
  const sign = rupees < 0 ? "-" : "";

  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

/** Signed INR from paise, e.g. "+₹1,240.00" / "-₹980.50". For P&L only. */
export function formatPaiseSigned(paise, options) {
  if (!isNum(paise)) return options?.fallback ?? EM_DASH;
  const body = formatPaise(Math.abs(paise), options);
  if (paise === 0) return body;
  return `${paise > 0 ? "+" : "−"}${body}`;
}

/** Share quantity. Integers stay integral; fractional quantities keep 4 dp. */
export function formatQty(quantity, { fallback = EM_DASH } = {}) {
  if (!isNum(quantity)) return fallback;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(quantity) ? 0 : 4
  }).format(quantity);
}

/** Plain number with Indian grouping. */
export function formatNumber(value, { digits = 2, fallback = EM_DASH } = {}) {
  if (!isNum(value)) return fallback;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

/**
 * Ratio -> percentage string. `value` is a percentage already (12.5 => "12.50%").
 * `signed` prefixes + / − for return figures.
 */
export function formatPercent(
  value,
  { digits = 2, signed = false, fallback = EM_DASH } = {}
) {
  if (!isNum(value)) return fallback;
  const body = `${Math.abs(value).toFixed(digits)}%`;
  if (!signed || value === 0) return value < 0 ? `−${body}` : body;
  return `${value > 0 ? "+" : "−"}${body}`;
}

/**
 * Market price in rupees as returned by the quote API. Prices keep 2 dp and
 * are shown with the currency the API reported, not an assumed one.
 */
export function formatQuotePrice(price, currency, { fallback = EM_DASH } = {}) {
  if (!isNum(price)) return fallback;
  if (currency === "INR" || !currency) return formatInr(price, { digits: 2 });
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  } catch {
    // Unknown ISO code from upstream: show the number with the raw code.
    return `${formatNumber(price, { digits: 2 })} ${currency}`;
  }
}

/** Returns the sign class name used for P&L colouring. */
export function signOf(value) {
  if (!isNum(value) || value === 0) return "flat";
  return value > 0 ? "pos" : "neg";
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value, { fallback = EM_DASH } = {}) {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : fallback;
}

export function formatDate(value, { fallback = EM_DASH } = {}) {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : fallback;
}

export function formatTime(value, { fallback = EM_DASH } = {}) {
  const date = toDate(value);
  return date ? timeFormatter.format(date) : fallback;
}

/** "4m ago", "2h ago", "3d ago" — used in activity and notification lists. */
export function formatRelative(value, { fallback = EM_DASH } = {}) {
  const date = toDate(value);
  if (!date) return fallback;

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return "just now";
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.round(seconds / 86400)}d ago`;
  return formatDate(date);
}

/** Truncates an ObjectId-style identifier for dense tables: "68f1…a2c4". */
export function shortId(id, { head = 6, tail = 4 } = {}) {
  if (typeof id !== "string" || id.length <= head + tail + 1) return id || EM_DASH;
  return `${id.slice(0, head)}…${id.slice(-tail)}`;
}

/** Normalises a user-typed symbol to the form the quote API expects. */
export function normaliseSymbol(input) {
  if (typeof input !== "string") return "";
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
