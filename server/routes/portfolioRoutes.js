import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  getMyPortfolio,
  getMyPortfolioHistory
} from "../Controllers/portfolioController.js";

const router = Router();

router.get("/", authenticate, getMyPortfolio);
router.get("/history", authenticate, getMyPortfolioHistory);

export default router;
