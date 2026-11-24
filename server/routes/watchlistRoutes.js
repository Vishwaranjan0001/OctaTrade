import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validateSymbol } from "../middleware/validateSymbol.js";
import {
  getMyWatchlist,
  addMyWatchlistSymbol,
  removeMyWatchlistSymbol
} from "../Controllers/watchlistController.js";

const router = Router();

router.get("/", authenticate, getMyWatchlist);
router.put("/:symbol", authenticate, validateSymbol, addMyWatchlistSymbol);
router.delete("/:symbol", authenticate, validateSymbol, removeMyWatchlistSymbol);

export default router;
