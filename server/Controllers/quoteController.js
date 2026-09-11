import { getMarketQuote } from "../services/marketDataServices.js";

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