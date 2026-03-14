import { Router } from "express";
import { InvitationsController } from "../controllers/invitations.controller";
import { authenticateToken } from "@shared-backend/middleware/auth.middleware";
import { validate } from "src/middleware/validate.middleware";
import { inviteSchema, invitationRequestSchema } from "src/validation/invitations.validation";

const router = Router();
const controller = new InvitationsController();

router.post("/", authenticateToken, validate(inviteSchema), controller.invite);
router.post("/request", authenticateToken, validate(invitationRequestSchema), controller.createRequest);
router.get("/my", authenticateToken, controller.myInvites);
router.get("/requests/incoming", authenticateToken, controller.getIncomingRequests);
router.get("/requests/booking/:bookingId", authenticateToken, controller.getRequestsByBooking);
router.patch("/requests/:id/approve", authenticateToken, controller.approveRequest);
router.patch("/requests/:id/reject", authenticateToken, controller.rejectRequest);
router.get("/booking/:id", authenticateToken, controller.myInvitesByBooking);
router.patch("/:id/accept", authenticateToken, controller.accept);
router.patch("/:id/decline", authenticateToken, controller.decline);
router.patch("/:id/remove", authenticateToken, controller.removeFromMeeting);
router.patch("/:id", authenticateToken, controller.redactRole);

export default router;