/*
  OHLC sanitisation for TradingView Lightweight Charts.

  The chart library will happily draw a nonsensical candle (high below close,
  duplicate timestamps, unsorted series) and produce a misleading picture. This
  module is the gate: anything that is not a coherent bar is REJECTED and
  counted, never corrected by inventing a value.

  Accepted time formats: unix seconds, unix milliseconds, ISO-8601 date or
  datetime strings, or a Date. Output time is always unix SECONDS, which is
  what lightweight-charts expects for intraday/daily series.
*/

const MIN_TIME = 0;
/* Anything beyond ~year 2200 is a unit mistake, not a real timestamp. */
const MAX_TIME_SECONDS = 7_258_118_400;

function toUnixSeconds(value) {
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (value <= MIN_TIME) return null;
    // Heuristic: values this large can only be milliseconds.
    return value > MAX_TIME_SECONDS ? Math.floor(value / 1000) : Math.floor(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Pure numeric string.
    if (/^\d+$/.test(trimmed)) return toUnixSeconds(Number(trimmed));

    const ms = Date.parse(trimmed);
    return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
  }

  return null;
}

function num(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Validates, sorts and de-duplicates a candle series.
 *
 * @param {Array} raw   Candles in any of the accepted shapes. Field aliases
 *                      are tolerated (o/h/l/c/v, open/high/low/close/volume,
 *                      time/date/timestamp/t).
 * @returns {{
 *   candles: Array<{time:number,open:number,high:number,low:number,close:number}>,
 *   volumes: Array<{time:number,value:number,isUp:boolean}>,
 *   rejected: number,
 *   duplicates: number,
 *   reasons: Object<string, number>,
 *   hasVolume: boolean
 * }}
 */
export function sanitiseCandles(raw) {
  const reasons = {};
  let rejected = 0;

  const reject = (reason) => {
    rejected += 1;
    reasons[reason] = (reasons[reason] || 0) + 1;
  };

  if (!Array.isArray(raw)) {
    return {
      candles: [],
      volumes: [],
      rejected: 0,
      duplicates: 0,
      reasons: {},
      hasVolume: false
    };
  }

  const byTime = new Map();
  let sawVolume = false;
  let duplicates = 0;

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      reject("not-an-object");
      continue;
    }

    const time = toUnixSeconds(
      entry.time ?? entry.date ?? entry.timestamp ?? entry.t
    );
    if (time === null || time <= MIN_TIME || time > MAX_TIME_SECONDS) {
      reject("invalid-timestamp");
      continue;
    }

    const open = num(entry.open ?? entry.o);
    const high = num(entry.high ?? entry.h);
    const low = num(entry.low ?? entry.l);
    const close = num(entry.close ?? entry.c);

    if (open === null || high === null || low === null || close === null) {
      reject("missing-price");
      continue;
    }

    /* A price of zero or below cannot be a traded equity price. */
    if (open <= 0 || high <= 0 || low <= 0 || close <= 0) {
      reject("non-positive-price");
      continue;
    }

    /* The defining OHLC invariants. */
    if (high < low) {
      reject("high-below-low");
      continue;
    }
    if (high < Math.max(open, close) || low > Math.min(open, close)) {
      reject("body-outside-range");
      continue;
    }

    const volumeRaw = num(entry.volume ?? entry.v);
    const volume = volumeRaw !== null && volumeRaw >= 0 ? volumeRaw : null;
    if (volume !== null) sawVolume = true;

    /* Duplicate timestamps: the later entry wins, which matches how a feed
       replays a corrected bar. Counted separately from rejections because the
       bar itself was valid. */
    if (byTime.has(time)) duplicates += 1;
    byTime.set(time, { time, open, high, low, close, volume });
  }

  const candles = Array.from(byTime.values()).sort((a, b) => a.time - b.time);

  const volumes = sawVolume
    ? candles
        .filter((candle) => candle.volume !== null)
        .map((candle) => ({
          time: candle.time,
          value: candle.volume,
          isUp: candle.close >= candle.open
        }))
    : [];

  return {
    candles: candles.map(({ time, open, high, low, close }) => ({
      time,
      open,
      high,
      low,
      close
    })),
    volumes,
    rejected,
    duplicates,
    reasons,
    hasVolume: volumes.length > 0
  };
}
