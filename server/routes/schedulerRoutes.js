import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  getPolicy,
  changePolicy,
  getMetrics
} from "../Controllers/schedulerController.js";

const router = Router();

router.get("/policy", authenticate, getPolicy);
router.put("/policy", authenticate, changePolicy);
router.get("/metrics", authenticate, getMetrics);

export default router;
