import prisma from "../config/prisma";

export class RoomsService {
  async getRooms(floorIn: number, isActive: Boolean) {
    const rooms = await prisma.room.findMany(
      {
        where: {
          AND: [
            { floor: floorIn },
            {  }
          ]
        }
      }
    );
  }
}