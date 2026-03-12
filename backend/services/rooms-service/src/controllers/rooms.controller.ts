import { NextFunction, Request, Response } from "express";
import { RoomsService } from "../services/rooms.service";
import { HttpError } from "@shared-backend/utils/http-error";

const roomsService = new RoomsService();

export class RoomsController {
  async getRoomById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const result = await roomsService.getRoomById(
        id
      );

      res.json(result);
    } catch (error: any) {
      next(error)
    }
  }

  async getRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const floorParam = req.query.floor;
      const activeParam = req.query.is_active;

      let floor: number | undefined;
      let isActive: boolean | undefined;

      if (typeof floorParam === "string" && floorParam.trim() !== "") {
        const parsedFloor = Number(floorParam);
        if (Number.isNaN(parsedFloor)) {
          return next(new HttpError("Некорректный этаж", 400));
        }
        floor = parsedFloor;
      }

      if (typeof activeParam === "string" && activeParam.trim() !== "") {
        if (activeParam !== "true" && activeParam !== "false") {
          return next(new HttpError("Некорректное состояние", 400));
        }
        isActive = activeParam === "true";
      }

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