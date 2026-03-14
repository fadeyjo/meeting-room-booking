import { BookingDetail, NewBookingDto, TimeSlot } from "@shared-types/types/bookings";
import prisma from "../config/prisma";
import { HttpError } from "@shared-backend/utils/http-error";
import { RoomWithSlots } from "@shared-types/types";

export class BookingsService {
    async newBooking(newBooking: NewBookingDto, organizerId: number) {
        let findedPer = await prisma.person.findUnique(
            {
                where: { person_id : organizerId }
            }
        );

        if (!findedPer) {
            throw new HttpError("Пользователь не найден", 404);
        }

        let findedRoom = await prisma.room.findUnique(
            {
                where: { room_id : newBooking.room_id }
            }
        );

        if (!findedRoom) {
            throw new HttpError("Комната не найдена", 404);
        }

        if (this.parseTimeToMinutesFromString(newBooking.start_time) >= this.parseTimeToMinutesFromString(newBooking.end_time)) {
            throw new HttpError("Конец должен быть позже начала", 400);
        }

        if (this.parseTimeToMinutesFromString(newBooking.start_time) < 480) {
            throw new HttpError("Начало не раньше 8:00", 400);
        }

        if (this.parseTimeToMinutesFromString(newBooking.end_time) > 1020) {
            throw new HttpError("Окончание не позже 17:00", 400);
        }

        const intersection = await this.intersection(newBooking.room_id, newBooking.date, newBooking.start_time, newBooking.end_time);

        if (intersection)
            throw new HttpError("пересечение с другими бронями", 409);

        const startedAt = this.timeStringToDate(newBooking.date, newBooking.start_time);
        const endedAt = this.timeStringToDate(newBooking.date, newBooking.end_time);

        const response = await prisma.booking.create({
            data: {
                title: newBooking.title,
                organizer_id: organizerId,
                created_at: new Date(),
                room_id: newBooking.room_id,
                booking_date: new Date(newBooking.date),
                started_at: startedAt,
                ended_at: endedAt,
                booking_description: newBooking.description ?? ""
            }
        })

        const result: BookingDetail = {
            id: response.book_id,
            room_id: response.room_id,
            creator_id: response.organizer_id,
            title: response.title,
            description: response.booking_description,
            date: this.formatDateToYYYYMMDD(response.booking_date),
            start_time: this.formatDateToHHMM(response.started_at),
            end_time: this.formatDateToHHMM(response.ended_at),
            status: "active",
            created_at: response.created_at.toISOString(),
        }

        return result;
    }
  
    async getMyBookings(personId: number): Promise<BookingDetail[]> {
        const findedPer = await prisma.person.findUnique({
          where: { person_id: personId },
        });
      
        if (!findedPer) {
          throw new HttpError("Пользователь не найден", 404);
        }
      
        const bookings = await prisma.booking.findMany({
          where: { organizer_id: personId },
        });
      
        const result: BookingDetail[] = bookings.map((b) => ({
          id: b.book_id,
          room_id: b.room_id,
          creator_id: b.organizer_id,
          title: b.title,
          description: b.booking_description,
          date: this.formatDateToYYYYMMDD(b.booking_date),
          start_time: this.formatDateToHHMM(b.started_at),
          end_time: this.formatDateToHHMM(b.ended_at),
          status: "active",
          created_at: b.created_at.toISOString(),
        }));
      
        return result;
    }
  
    async getMyMeetings(personId: number) {
        let findedPer = await prisma.person.findUnique(
            {
                where: { person_id : personId }
            }
        );

        if (!findedPer) {
            throw new HttpError("Пользователь не найден", 404);
        }

        const bookings = await prisma.booking.findMany({
            where: {
                OR: [
                    { organizer_id: personId },
                    {
                        invitations: {
                            some: {
                                guest_id: personId,
                                status: {
                                    status_name: "Принято",
                                },
                            },
                        },
                    },
                ],
            },
        });
      
        const result: BookingDetail[] = bookings.map((b) => ({
            id: b.book_id,
            room_id: b.room_id,
            creator_id: b.organizer_id,
            title: b.title,
            description: b.booking_description,
            date: this.formatDateToYYYYMMDD(b.booking_date),
            start_time: this.formatDateToHHMM(b.started_at),
            end_time: this.formatDateToHHMM(b.ended_at),
            status: "active",
            created_at: b.created_at.toISOString(),
        }));
      
        return result;
    }
  
    async getBookingDetail(bookingId: number) {
        const booking = await prisma.booking.findUnique({
            where: { book_id: bookingId },
            include: {
                room: true,
                organizer: true,
                invitations: {
                    include: {
                        guest: true,
                        role: true,
                        status: true,
                    },
                },
            },
        });

        if (!booking) {
            throw new HttpError("Бронирование не найдено", 404);
        }

        const personBrief = (p: { person_id: number; first_name: string; last_name: string; patronymic: string | null }) => ({
            id: p.person_id,
            firstName: p.first_name,
            lastName: p.last_name,
            patronymic: p.patronymic ?? undefined,
        });

        const accepted = booking.invitations.filter((inv) => inv.status.status_name === "Принято");
        const speakers = accepted.filter((inv) => inv.role.role_name === "Спикер").map((inv) => personBrief(inv.guest));
        const listeners = accepted.filter((inv) => inv.role.role_name === "Слушатель").map((inv) => personBrief(inv.guest));

        const result: BookingDetail = {
            id: booking.book_id,
            room_id: booking.room_id,
            creator_id: booking.organizer_id,
            title: booking.title,
            description: booking.booking_description,
            date: this.formatDateToYYYYMMDD(booking.booking_date),
            start_time: this.formatDateToHHMM(booking.started_at),
            end_time: this.formatDateToHHMM(booking.ended_at),
            status: "active",
            created_at: booking.created_at.toISOString(),
            room: {
                id: booking.room.room_id,
                name: booking.room.room_name,
                floor: booking.room.floor,
                capacity: booking.room.capacity,
                has_projector: booking.room.has_projector,
                has_tv: booking.room.has_tv,
                has_whiteboard: booking.room.has_whiteboard,
                is_active: booking.room.is_active,
                description: booking.room.room_description,
            },
            creator: personBrief(booking.organizer),
            speakers,
            listeners,
        };

        return result;
    }

    async cancelBooking(bookingId: number, personId: number) {
        const booking = await prisma.booking.findUnique({
            where: { book_id: bookingId }
        });
        if (!booking) {
            throw new HttpError("Бронирование не найдено", 404);
        }
        if (booking.organizer_id !== personId) {
            throw new HttpError("Отменить может только организатор", 403);
        }
        await prisma.booking.delete({
            where: { book_id: bookingId }
        });
    }
  
    async getOccupiedSlotsByRoom(roomId: number, date: string): Promise<TimeSlot[]> {
        const bookings = await prisma.booking.findMany({
            where: {
                room_id: roomId,
                booking_date: new Date(date),
            },
            orderBy: { started_at: "asc" },
        });
        return bookings.map((b) => ({
            start_time: this.formatDateToHHMM(b.started_at),
            end_time: this.formatDateToHHMM(b.ended_at),
        }));
    }

    async getFreeTimeSlotsByRoom(roomId: number, date: string) {
        const [freeSlots, occupied] = await Promise.all([
            this.computeFreeSlotsForBookings(roomId, date),
            this.getOccupiedSlotsByRoom(roomId, date),
        ]);
        return { free: freeSlots, occupied };
    }

    async computeFreeSlotsForBookings(roomId: number, date: string): Promise<TimeSlot[]> {
        const bookings = await prisma.booking.findMany({
            where: {
                room_id: roomId,
                booking_date: new Date(date),
            },
            orderBy: { started_at: "asc" },
        });

        const WORK_START = 8 * 60;
        const WORK_END = 17 * 60;

        let current = WORK_START;
        const freeSlots: TimeSlot[] = [];

        for (const b of bookings) {
            const start = this.timeToMinutes(b.started_at);
            const end = this.timeToMinutes(b.ended_at);

            if (start > current) {
                freeSlots.push({
                    start_time: this.minutesToHHMM(current),
                    end_time: this.minutesToHHMM(start),
                });
            }
            current = Math.max(current, end);
        }

        if (current < WORK_END) {
            freeSlots.push({
                start_time: this.minutesToHHMM(current),
                end_time: this.minutesToHHMM(WORK_END),
            });
        }

        return freeSlots;
    }
  
    async getRoomsFreeSlots(date: string) {
        const rooms = await prisma.room.findMany({
            include: {
                bookings: {
                    where: {
                        booking_date: new Date(date)
                    },
                    orderBy: {
                        started_at: "asc"
                    }
                }
            }
        });

        const WORK_START = 8 * 60;
        const WORK_END = 17 * 60;

        const result = rooms.map(room => {
            let current = WORK_START;
            const slots: TimeSlot[] = [];
            const occupied: TimeSlot[] = room.bookings.map((b) => ({
                start_time: this.formatDateToHHMM(b.started_at),
                end_time: this.formatDateToHHMM(b.ended_at),
            }));

            for (const booking of room.bookings) {
                const start = this.timeToMinutes(booking.started_at);
                const end = this.timeToMinutes(booking.ended_at);

                if (start > current) {
                    slots.push({
                        start_time: this.minutesToHHMM(current),
                        end_time: this.minutesToHHMM(start)
                    });
                }
                current = Math.max(current, end);
            }

            if (current < WORK_END) {
                slots.push({
                    start_time: this.minutesToHHMM(current),
                    end_time: this.minutesToHHMM(WORK_END)
                });
            }

            const res: RoomWithSlots = {
                room: {
                    id: room.room_id,
                    name: room.room_name,
                    floor: room.floor,
                    capacity: room.capacity,
                    has_projector: room.has_projector,
                    has_tv: room.has_tv,
                    has_whiteboard: room.has_whiteboard,
                    is_active: room.is_active,
                    description: room.room_description
                },
                slots,
                occupied,
            };

            return res;
        });

        return result;
    }

    async intersection(roomId: number, date: string, startTime: string, endTime: string) {
        const bookings = await prisma.booking.findMany({
            where: {
                room_id: roomId,
                booking_date: new Date(date),
            },
        });

        const newBookStart = this.parseTimeToMinutesFromString(startTime);
        const newBookEnd = this.parseTimeToMinutesFromString(endTime);

        for (const b of bookings) {
            const start = this.timeToMinutes(b.started_at);
            const end = this.timeToMinutes(b.ended_at);
            if (start < newBookEnd && end > newBookStart) return true;
        }

        return false;
    }

    timeStringToDate(dateYmd: string, time: string): Date {
        const normalized = time.length === 5 ? `${time}:00` : time;
        return new Date(`${dateYmd}T${normalized}`);
    }

    parseTimeToMinutes(hours: number, minutes: number) {
        return hours * 60 + minutes;
    }

    parseTimeToMinutesFromString(time: string) {
        const words = time.split(":").map(Number);

        return words[0] * 60 + words[1]
    }

    formatDateToHHMM(date: Date): string {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    }

    formatDateToYYYYMMDD(date: Date): string {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }

    timeToMinutes(date: Date): number {
        return date.getHours() * 60 + date.getMinutes();
    }

    minutesToHHMM(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
          
        const hh = hours.toString().padStart(2, "0");
        const mm = mins.toString().padStart(2, "0");
          
        return `${hh}:${mm}`;
    }
}