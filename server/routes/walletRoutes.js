import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getMyWallet } from "../Controllers/walletController.js";

const router = Router();

router.get("/", authenticate, getMyWallet);

export default router;