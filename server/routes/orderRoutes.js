import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validateOrder } from "../middleware/validateOrder.js";
import {
  createOrder,
  getMyOrder,
  getMyOrders
} from "../Controllers/orderController.js";

const router = Router();

router.get("/", authenticate, getMyOrders);
router.post("/", authenticate, validateOrder, createOrder);
router.get("/:orderId", authenticate, getMyOrder);

export default router;
