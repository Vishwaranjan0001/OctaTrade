import YahooFinance from "yahoo-finance2";
import { redisClient } from "../config/redis.js";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"]
});

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

  const quote = await yahooFinance.quote(symbol);

  const result = {
    symbol: quote.symbol,
    price: quote.regularMarketPrice,
    currency: quote.currency
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

  const result = await yahooFinance.chart(symbol, {
    period1: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
    interval: interval
  });

  let candles = result.quotes
    .filter((quote) => quote.open !== null && quote.close !== null)
    .map((quote) => {
      let time = Math.floor(quote.date.getTime() / 1000);

      if (isDaily) {
        time = quote.date.toISOString().slice(0, 10);
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
