import { Router } from "express";
import { getQuote, getQuoteHistory } from "../Controllers/quoteController.js";
import { validateSymbol} from "../middleware/validateSymbol.js";
const router = Router();

router.get("/:symbol",validateSymbol, getQuote);
router.get("/:symbol/history",validateSymbol, getQuoteHistory);

export default router;
