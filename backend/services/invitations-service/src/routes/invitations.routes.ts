import { Router } from "express";
import { InvitationsController } from "../controllers/invitations.controller";
import { authenticateToken } from "@shared-backend/middleware/auth.middleware";
import { validate } from "src/middleware/validate.middleware";
import { inviteSchema } from "src/validation/invitations.validation";

const router = Router();
const controller = new InvitationsController();

router.post("/", authenticateToken, validate(inviteSchema), controller.accept);
router.get("/my", authenticateToken, controller.myInvites);
router.get("/booking/:id", authenticateToken, controller.myInvitesByBooking);
router.patch("/:id/accept", authenticateToken, controller.accept);
router.patch("/:id/decline", authenticateToken, controller.decline);
router.patch("/:id", authenticateToken, controller.redactRole);

export default router;