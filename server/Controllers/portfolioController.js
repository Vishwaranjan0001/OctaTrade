import { getHoldingsByUserId } from "../services/portfolioServices.js";

export async function getMyPortfolio(req, res) {
  try {
    const holdings = await getHoldingsByUserId(req.userId);

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