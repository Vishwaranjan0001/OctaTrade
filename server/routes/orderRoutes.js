import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  placeOrder,
  getMyOrders,getMyOrderById,
  cancelMyOrder
} from "../Controllers/orderController.js";

const router = Router();

router.post("/", authenticate, placeOrder);
router.get("/", authenticate, getMyOrders);
router.get("/:orderId", authenticate, getMyOrderById);
router.post("/:orderId/cancel", authenticate, cancelMyOrder);

export default router;