import {
  getMarketQuote,
  getPriceHistory,
  HISTORY_RANGES
} from "../services/marketDataServices.js";

export async function getQuote(req, res) {
  try {
    const symbol = req.params.symbol;
    const quote = await getMarketQuote(symbol);

    res.status(200).json(quote);
  } catch (error) {
    console.error(error.message);

    res.status(502).json({
      message: "Unable to fetch market quote"
    });
  }
}

export async function getQuoteHistory(req, res) {
  try {
    const symbol = req.params.symbol;
    const range = req.query.range || "1M";

    if (!HISTORY_RANGES[range]) {
      return res.status(400).json({
        message: "range must be 1D, 1W, 1M or 1Y"
      });
    }

    const candles = await getPriceHistory(symbol, range);

    return res.status(200).json({
      symbol: symbol,
      range: range,
      candles: candles
    });
  } catch (error) {
    console.error(error.message);

    return res.status(502).json({
      message: "Unable to fetch price history"
    });
  }
}
