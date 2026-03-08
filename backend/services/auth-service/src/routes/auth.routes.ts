import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticateToken } from "@shared/middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { logoutSchema, refreshSchema, registerSchema } from "../validation/auth.validation";

const router = Router();
const controller = new AuthController();

router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(logoutSchema), controller.login);
router.post("/logout", authenticateToken, validate(logoutSchema), controller.logout);
router.post("/refresh", validate(refreshSchema), controller.refresh);

export default router;