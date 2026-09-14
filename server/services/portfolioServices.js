import { Holding } from "../models/Holding.js";
import { getMarketQuote } from "./marketDataServices.js";
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