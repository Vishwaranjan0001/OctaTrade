import {
  getPortfolioByUserId,
  getPortfolioHistory
} from "../services/portfolioServices.js";

export async function getMyPortfolio(req, res) {
  try {
    const holdings = await getPortfolioByUserId(
  req.userId
);

    return res.status(200).json({
      holdings: holdings
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to retrieve portfolio"
    });
  }
}

export async function getMyPortfolioHistory(req, res) {
  try {
    const history = await getPortfolioHistory(req.userId);

    return res.status(200).json({
      history: history
    });
  } catch (error) {
    console.error(error.message);

    return res.status(502).json({
      message: "Unable to retrieve portfolio history"
    });
  }
}
