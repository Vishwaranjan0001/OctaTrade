import { Router } from "express";
import { getQuote } from "../Controllers/quoteController.js";

const router = Router();

router.get("/:symbol", getQuote);

export default router;