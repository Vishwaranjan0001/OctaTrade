import { Router } from "express";
import { getQuote } from "../Controllers/quoteController.js";
import { validateSymbol} from "../middleware/validateSymbol.js";
const router = Router();

router.get("/:symbol",validateSymbol, getQuote);

export default router;