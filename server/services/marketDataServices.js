import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export async function getMarketQuote(symbol) {
  const quote = await yahooFinance.quote(symbol);

  return {
    symbol: quote.symbol,
    price: quote.regularMarketPrice,
    currency: quote.currency
  };
}