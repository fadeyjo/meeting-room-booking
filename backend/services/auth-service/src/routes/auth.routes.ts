import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticateToken } from "@shared-backend/middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { loginSchema, logoutSchema, redactPersonSchema, refreshSchema, registerSchema, changePasswordSchema } from "../validation/auth.validation";
import { authorizeRole } from "@shared-backend/middleware/role.middleware";

const router = Router();
const controller = new AuthController();

router.post(
    "/users",
    authenticateToken,
    authorizeRole(2),
    validate(registerSchema),
    controller.register
);
router.post("/login", validate(loginSchema), controller.login);
router.get("/me", authenticateToken, controller.getMe);
router.post(
  "/me/change-password",
  authenticateToken,
  validate(changePasswordSchema),
  controller.changePassword
);
router.post("/logout", authenticateToken, validate(logoutSchema), controller.logout);
router.post("/refresh", validate(refreshSchema), controller.refresh);
router.get(
    "/users",
    authenticateToken,
    authorizeRole(2),
    controller.getAllUsers
);
router.patch(
    "/users/:id",
    authenticateToken,
    authorizeRole(2),
    validate(redactPersonSchema),
    controller.redactPerson
);
router.get(
    "/users/search",
    authenticateToken,
    controller.searchUser
);


export default router;