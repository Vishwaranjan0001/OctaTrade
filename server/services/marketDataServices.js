import { redisClient } from "../config/redis.js";

// Yahoo's chart endpoint. The yahoo-finance2 library first asks Yahoo for a
// "crumb" cookie, and Yahoo answers 429 to that from cloud servers (Render),
// so we call the chart endpoint directly. It needs no crumb and gives the same data.
const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/";

async function fetchYahooChart(symbol, params) {
  const url = YAHOO_CHART_URL + encodeURIComponent(symbol) + "?" + new URLSearchParams(params);

  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; OctaTrade/1.0)" }
  });

  if (!response.ok) {
    throw new Error(`Yahoo chart request failed with status ${response.status}`);
  }

  const body = await response.json();
  const result = body.chart?.result?.[0];

  if (!result) {
    throw new Error(body.chart?.error?.description || "Yahoo returned no chart data");
  }

  return result;
}

const PRICE_CACHE_MS = 5000;
const HISTORY_CACHE_MS = 60000;

export const HISTORY_RANGES = {
  "1D": { days: 7, interval: "5m" },
  "1W": { days: 7, interval: "30m" },
  "1M": { days: 31, interval: "1d" },
  "1Y": { days: 366, interval: "1d" }
};

export async function getMarketQuote(symbol) {
  const cacheKey = `price:${symbol}`;

  const cachedQuote = await redisClient.sendCommand(["GET", cacheKey]);

  if (cachedQuote) {
    return JSON.parse(cachedQuote);
  }

  const chart = await fetchYahooChart(symbol, { range: "1d", interval: "1d" });

  const result = {
    symbol: chart.meta.symbol,
    price: chart.meta.regularMarketPrice,
    currency: chart.meta.currency
  };

  await redisClient.sendCommand([
    "SET", cacheKey, JSON.stringify(result), "PX", String(PRICE_CACHE_MS)
  ]);

  return result;
}

function indianDate(seconds) {
  const indianTimeMs = (seconds + 5.5 * 60 * 60) * 1000;

  return new Date(indianTimeMs).toISOString().slice(0, 10);
}

export async function getPriceHistory(symbol, range) {
  const cacheKey = `history:${symbol}:${range}`;

  const cachedHistory = await redisClient.sendCommand(["GET", cacheKey]);

  if (cachedHistory) {
    return JSON.parse(cachedHistory);
  }

  const days = HISTORY_RANGES[range].days;
  const interval = HISTORY_RANGES[range].interval;
  const isDaily = interval === "1d";

  const nowSeconds = Math.floor(Date.now() / 1000);

  const chart = await fetchYahooChart(symbol, {
    period1: String(nowSeconds - days * 24 * 60 * 60),
    period2: String(nowSeconds),
    interval: interval
  });

  // Yahoo sends parallel arrays: timestamp[i] goes with open[i], close[i], ...
  const timestamps = chart.timestamp || [];
  const prices = chart.indicators?.quote?.[0] || {};

  let candles = timestamps
    .map((seconds, i) => ({
      seconds: seconds,
      open: prices.open?.[i] ?? null,
      high: prices.high?.[i] ?? null,
      low: prices.low?.[i] ?? null,
      close: prices.close?.[i] ?? null,
      volume: prices.volume?.[i] ?? null
    }))
    .filter((quote) => quote.open !== null && quote.close !== null)
    .map((quote) => {
      let time = quote.seconds;

      if (isDaily) {
        time = new Date(quote.seconds * 1000).toISOString().slice(0, 10);
      }

      return {
        time: time,
        open: quote.open,
        high: quote.high,
        low: quote.low,
        close: quote.close,
        volume: quote.volume || 0
      };
    });

  if (range === "1D" && candles.length > 0) {
    const lastTradingDay = indianDate(candles[candles.length - 1].time);

    candles = candles.filter((candle) => indianDate(candle.time) === lastTradingDay);
  }

  await redisClient.sendCommand([
    "SET", cacheKey, JSON.stringify(candles), "PX", String(HISTORY_CACHE_MS)
  ]);

  return candles;
}
