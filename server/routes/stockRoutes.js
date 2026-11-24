import { Router } from "express";
import { searchStocks } from "../Controllers/stockController.js";

const router = Router();

router.get("/search", searchStocks);

export default router;
