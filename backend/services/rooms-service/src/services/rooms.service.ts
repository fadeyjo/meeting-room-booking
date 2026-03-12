import { RoomDetail } from "@shared-types/types/rooms";
import prisma from "../config/prisma";
import { HttpError } from "@shared-backend/utils/http-error";

export class RoomsService {
  async getRoomById(id: number) {
    const room = await prisma.room.findUnique({
      where: {
        room_id: id
      },
    });

    if (!room) {
      throw new HttpError("Комната не найдена", 404)
    }

    const result: RoomDetail = {
      id: room.room_id,
      name: room.room_name,
      floor: room.floor,
      capacity: room.capacity,
      has_projector: room.has_projector,
      has_tv: room.has_tv,
      has_whiteboard: room.has_whiteboard,
      is_active: room.is_active,
      description: room.room_description,
    };

    return result;
  }

  async getRooms(floorIn?: number, isActive?: boolean) {
    const where: any = {};

    if (typeof floorIn === "number") {
      where.floor = floorIn;
    }

    if (typeof isActive === "boolean") {
      where.is_active = isActive;
    }

    const rooms = await prisma.room.findMany({ where });

    const result: RoomDetail[] = rooms.map((room: any) => ({
      id: room.room_id,
      name: room.room_name,
      floor: room.floor,
      capacity: room.capacity,
      has_projector: room.has_projector,
      has_tv: room.has_tv,
      has_whiteboard: room.has_whiteboard,
      is_active: room.is_active,
      description: room.room_description,
    }));

    return result;
  }
}