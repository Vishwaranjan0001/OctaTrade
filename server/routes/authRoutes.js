import {register} from "../Controllers/authController.js";
import {login,getCurrentUser} from "../Controllers/authController.js";
import { Router } from "express";
import { validRegistration} from "../middleware/validateRegistration.js";
import {authenticate} from "../middleware/authenticate.js";
const router = Router();

router.post("/register",validRegistration,register);
router.post("/login",login);
router.get("/me",authenticate,getCurrentUser);
export default router;