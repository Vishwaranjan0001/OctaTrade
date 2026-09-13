import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getMyPortfolio } from "../Controllers/portfolioController.js";

const router = Router();

router.get("/", authenticate, getMyPortfolio);

export default router;
