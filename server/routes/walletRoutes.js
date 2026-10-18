import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  getMyWallet,
  depositToWallet,
  getMyWalletTransactions
} from "../Controllers/walletController.js";

const router = Router();

router.get("/", authenticate, getMyWallet);
router.post("/deposit", authenticate, depositToWallet);
router.get("/transactions", authenticate, getMyWalletTransactions);

export default router;
