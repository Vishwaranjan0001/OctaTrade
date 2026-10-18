import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getMetrics } from "../Controllers/schedulerController.js";

const router = Router();

router.get("/metrics", authenticate, getMetrics);

export default router;
