import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  getMyNotifications,
  readAllMyNotifications,
  clearMyNotifications
} from "../Controllers/notificationController.js";

const router = Router();

router.get("/", authenticate, getMyNotifications);
router.post("/read-all", authenticate, readAllMyNotifications);
router.delete("/", authenticate, clearMyNotifications);

export default router;
