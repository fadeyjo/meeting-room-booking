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
            throw new HttpError("Дата окончания должна быть позже даты окончания", 400);
        }

        if (this.parseTimeToMinutesFromString(newBooking.start_time) < 480) {
            throw new HttpError("Дата начала не раньше 8:00", 400);
        }

        if (this.parseTimeToMinutesFromString(newBooking.end_time) > 1020) {
            throw new HttpError("Дата окончания не похже 17:00", 400);
        }

        const intersection = await this.intersection(newBooking.date, newBooking.start_time, newBooking.end_time)

        if (intersection)
            throw new HttpError("Пересечние с другими бронями", 409);

        const response = await prisma.booking.create({
            data: {
                title: newBooking.title,
                organizer_id: organizerId,
                created_at: new Date(),
                room_id: newBooking.room_id,
                booking_date: newBooking.date,
                started_at: newBooking.start_time,
                ended_at: newBooking.end_time,
                booking_description: newBooking.description
            }
        })

        const result: BookingDetail = {
            id: response.book_id,
            room_id: response.room_id,
            creator_id: response.organizer_id,
            title: response.title,
            description: response.booking_description,
            date: this.formatDateToYYYYMMDD(response.booking_date),
            start_time: this.formatDateToHHMM(response.created_at),
            end_time: this.formatDateToHHMM(response.ended_at),
            status: "Лох",
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
          status: "Лох",
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
                    { invitations: { some: { guest_id: personId } } },
                ],
            }
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
            status: "Лох",
            created_at: b.created_at.toISOString(),
        }));
      
        return result;
    }
  
    async getBookingDetail(bookingId: number) {
        let booking = await prisma.booking.findUnique(
            {
                where: { book_id : bookingId }
            }
        );

        if (!booking) {
            throw new HttpError("Бронирование не найдено", 404);
        }

        const result: BookingDetail = {
            id: booking.book_id,
            room_id: booking.room_id,
            creator_id: booking.organizer_id,
            title: booking.title,
            description: booking.booking_description,
            date: this.formatDateToYYYYMMDD(booking.booking_date),
            start_time: this.formatDateToHHMM(booking.started_at),
            end_time: this.formatDateToHHMM(booking.ended_at),
            status: "Лох",
            created_at: booking.created_at.toISOString(),
        };

        return result;
    }
  
    async getFreeTimeSlotsByRoom(roomId: number, date: string) {
        const bookings = await prisma.booking.findMany({
          where: {
            room_id: roomId,
            booking_date: new Date(date),
          },
          orderBy: {
            started_at: "asc",
          },
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
                slots
            };
  
            return res
        });
  
        return result;
    }

    async intersection(date: string, startTime: string, endTime: string) {
        const bookings = await prisma.booking.findMany(
            {
                where : { booking_date : date }
            }
        );

        const newBookStart = this.parseTimeToMinutesFromString(startTime);
        const newBookEnd = this.parseTimeToMinutesFromString(endTime);

        for (let i = 0; i < bookings.length; i++) {
            const start = this.parseTimeToMinutes(bookings[i].started_at.getHours(), bookings[i].started_at.getMinutes())
            const end = this.parseTimeToMinutes(bookings[i].ended_at.getHours(), bookings[i].ended_at.getMinutes())

            if (end > newBookStart || start < newBookEnd)
                return true;
        }

        return false;
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