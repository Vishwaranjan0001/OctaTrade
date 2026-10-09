import { Holding } from "../models/Holding.js";
import { getMarketQuote, getPriceHistory } from "./marketDataServices.js";

const BENCHMARK_SYMBOL = "^NSEI";
export async function getHoldingsByUserId(userId) {
  const holdings = await Holding.find({
    userId: userId
  }).sort({
    symbol: 1
  });

  return holdings;
}


export function calculateHoldingSummary(
  holding,
  quote
) {
  const currentPricePaise = Math.round(
    quote.price * 100
  );

  const investedValuePaise =
    holding.averageBuyPricePaise * holding.quantity;

  const currentValuePaise =
    currentPricePaise * holding.quantity;

  const profitLossPaise =
    currentValuePaise - investedValuePaise;

  return {
    symbol: holding.symbol,
    quantity: holding.quantity,
    averageBuyPricePaise:
      holding.averageBuyPricePaise,
    currentPricePaise: currentPricePaise,
    investedValuePaise: investedValuePaise,
    currentValuePaise: currentValuePaise,
    profitLossPaise: profitLossPaise
  };
}


export async function getPortfolioByUserId(userId) {
  const holdings = await getHoldingsByUserId(
    userId
  );

  const portfolio = [];

  for (const holding of holdings) {
    const quote = await getMarketQuote(
      holding.symbol
    );

    const summary = calculateHoldingSummary(
      holding,
      quote
    );

    portfolio.push(summary);
  }

  return portfolio;
}

export async function getPortfolioHistory(userId) {
  const holdings = await getHoldingsByUserId(userId);

  if (holdings.length === 0) {
    return [];
  }

  const valueByDate = {};

  for (const holding of holdings) {
    const candles = await getPriceHistory(holding.symbol, "1M");

    for (const candle of candles) {
      const valueOnDate = candle.close * holding.quantity;

      valueByDate[candle.time] = (valueByDate[candle.time] || 0) + valueOnDate;
    }
  }

  const niftyByDate = {};
  const niftyCandles = await getPriceHistory(BENCHMARK_SYMBOL, "1M");

  for (const candle of niftyCandles) {
    niftyByDate[candle.time] = candle.close;
  }

  const dates = Object.keys(valueByDate).sort();
  const firstValue = valueByDate[dates[0]];
  const firstNifty = niftyByDate[dates[0]];

  return dates.map((date) => {
    let benchmark;

    if (firstNifty && niftyByDate[date]) {
      benchmark = Math.round(firstValue * niftyByDate[date] / firstNifty);
    }

    return {
      date: date,
      label: new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      value: Math.round(valueByDate[date]),
      benchmark: benchmark
    };
  });
}