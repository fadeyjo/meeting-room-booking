import { NextFunction, Request, Response } from "express";
import { RoomsService } from "../services/rooms.service";
import { HttpError } from "@shared-backend/utils/http-error";

const roomsService = new RoomsService();

export class RoomsController {
  async getRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const floorParam = req.query.floor;
      const activeParam = req.query.is_active;

      if (typeof floorParam !== "string") {
        return next(new HttpError("Не передан этаж", 400));
      }
  
      if (typeof activeParam !== "string") {
        return next(new HttpError("Не передано состояние", 400));
      }
  
      const floor = Number(floorParam);
      const isActive = activeParam === "true";

      const result = await roomsService.getRooms(
        floor,
        isActive
      );

      res.json(result);
    } catch (error: any) {
      next(error)
    }
  }
}