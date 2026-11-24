import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist
} from "../services/watchlistServices.js";

export async function getMyWatchlist(req, res) {
  try {
    const symbols = await getWatchlist(req.userId);

    return res.status(200).json({
      symbols: symbols
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to retrieve watchlist"
    });
  }
}

// The symbol comes from the URL, checked by validateSymbol (trimmed, upper-cased, max 20).
export async function addMyWatchlistSymbol(req, res) {
  try {
    const symbols = await addToWatchlist(req.userId, req.params.symbol);

    return res.status(200).json({
      symbols: symbols
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to update watchlist"
    });
  }
}

export async function removeMyWatchlistSymbol(req, res) {
  try {
    const symbols = await removeFromWatchlist(req.userId, req.params.symbol);

    return res.status(200).json({
      symbols: symbols
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to update watchlist"
    });
  }
}
