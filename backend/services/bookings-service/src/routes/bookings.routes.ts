import { Router } from "express";
import { BookingsController } from "../controllers/bookings.controller";
import { authenticateToken } from "@shared-backend/middleware/auth.middleware";
import { validate } from "src/middleware/validate.middleware";
import { newBookingSchema } from "src/validation/bookings.validation";

const router = Router();
const controller = new BookingsController();

router.post("/", authenticateToken, validate(newBookingSchema), controller.newBooking);
router.get("/my", authenticateToken, controller.getMyBookings);
router.get("/my-meetings", authenticateToken, controller.getMyMeetings);
router.get("/room/:id/slots", authenticateToken, controller.getFreeTimeSlotsByRoom);
router.get("/by-date", authenticateToken, controller.getRoomsByFreeSlots);
router.delete("/:id", authenticateToken, controller.cancelBooking);
router.get("/:id", authenticateToken, controller.getBookingDetail);

export default router;