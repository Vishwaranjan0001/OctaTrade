import { Stock } from "../models/Stock.js";

const MAX_RESULTS = 8;

// Turns user text into a safe regex piece: "M&M" and "a.b" must match literally.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/stocks/search?q=tc
// Matches stocks whose symbol starts with q, or whose name has a word starting with q.
export async function searchStocks(req, res) {
  try {
    const q = String(req.query.q || "").trim().replace(/\.NS$/i, "").slice(0, 20);

    if (!q) {
      return res.status(200).json({ results: [] });
    }

    const safe = escapeRegex(q);
    const symbolStart = new RegExp(`^${safe.toUpperCase()}`);
    const nameWordStart = new RegExp(`(^|\\s)${safe}`, "i");

    const found = await Stock.find({
      isActive: true,
      $or: [{ symbol: symbolStart }, { name: nameWordStart }]
    })
      .select("symbol name -_id")
      .limit(30)
      .lean();

    // Symbol matches first, then name matches; alphabetical inside each group.
    const rank = (s) => (symbolStart.test(s.symbol) ? 0 : 1);
    found.sort((a, b) => rank(a) - rank(b) || a.symbol.localeCompare(b.symbol));

    return res.status(200).json({ results: found.slice(0, MAX_RESULTS) });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to search stocks"
    });
  }
}
