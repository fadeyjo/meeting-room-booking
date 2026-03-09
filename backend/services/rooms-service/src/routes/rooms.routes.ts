import { Router } from "express";
import { RoomsController } from "../controllers/rooms.controller";
import { authenticateToken } from "@shared-backend/middleware/auth.middleware";

const router = Router();
const controller = new RoomsController();

router.get("/", authenticateToken, controller.getRooms);
router.get("/:id", authenticateToken, controller.getRoomById);

export default router;