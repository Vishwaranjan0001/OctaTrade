import { Order } from "../models/Order.js";
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

// Calculates the current value and profit/loss of a holding based on the latest market quote.

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

// Realized profit and loss from closed trades (completed SELL orders).
// A SELL is a win if it sold for more than the shares cost.
export async function getTradePerformance(userId) {
  const sells = await Order.find({
    userId: userId,
    side: "SELL",
    status: "COMPLETED",
    realizedProfitLossPaise: { $ne: null }
  });

  let realizedProfitLossPaise = 0;
  let wins = 0;
  let losses = 0;

  for (const sell of sells) {
    realizedProfitLossPaise = realizedProfitLossPaise + sell.realizedProfitLossPaise;

    if (sell.realizedProfitLossPaise > 0) {
      wins = wins + 1;
    } else if (sell.realizedProfitLossPaise < 0) {
      losses = losses + 1;
    }
  }

  let winRate = null;

  if (sells.length > 0) {
    winRate = Math.round((wins / sells.length) * 100);
  }

  return {
    closedTrades: sells.length,
    wins: wins,
    losses: losses,
    winRate: winRate,
    realizedProfitLossPaise: realizedProfitLossPaise
  };
}
