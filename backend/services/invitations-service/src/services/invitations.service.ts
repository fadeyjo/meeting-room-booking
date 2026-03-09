import { InvitationDetail, InviteDto, MyInviteDto } from "@shared-types/types/invitations";
import prisma from "../config/prisma";
import { HttpError } from "@shared-backend/utils/http-error";

export class InvitationsService {
    async invite(data: InviteDto, iniciatorId: number) {
        let findedPer = await prisma.person.findUnique({
            where: { person_id: iniciatorId }
        })

        if (!findedPer) {
            throw new HttpError("Инициатор не найден", 404);
        }

        findedPer = await prisma.person.findUnique({
            where: { person_id: data.user_id }
        })

        if (!findedPer) {
            throw new HttpError("Гость не найден", 404);
        }

        let findedBook = await prisma.booking.findUnique({
            where: { book_id: data.booking_id }
        });

        if (!findedBook) {
            throw new HttpError("Бронь не найдена", 404);
        }

        let findedRole = await prisma.bookingRole.findUnique({
            where: { role_name: data.role }
        });

        if (!findedRole) {
            throw new HttpError("Роль не найдена", 404);
        }

        const invitation = await prisma.invitation.create({
            data: {
                invitation_on: new Date(),
                initiator_id: iniciatorId,
                guest_id: data.user_id,
                book_id: data.booking_id,
                role_id: findedRole.role_id,
                invite_message: data.message,
                status_id: 1
            }
        });

        const res: InvitationDetail = {
            id: invitation.invitation_id,
            booking_id: invitation.book_id,
            user_id: invitation.guest_id,
            role: data.role,
            message: invitation.invite_message,
            status: "Ожидает",
            created_at: invitation.invitation_on.toISOString()
        }

        return res
    }

    async myInvites(iniciatorId: number, status: string) {
        const findedPer = await prisma.person.findUnique({
            where: { person_id: iniciatorId }
        });

        if (!findedPer) {
            throw new HttpError("Инициатор не найден", 404);
        }

        const findedStatus = await prisma.invitationStatus.findUnique({
            where: { status_name: status }
        });

        if (!findedStatus) {
            throw new HttpError("Статус не найден", 404);
        }

        const invites = await prisma.invitation.findMany({
            where: {
                guest_id: iniciatorId,
                status_id: findedStatus.status_id
            },
            include: {
                booking: true,
                role: true
            }
        });

        const result: MyInviteDto[] = invites.map((inv) => ({
            id: inv.invitation_id,
            role: inv.role.role_name,
            message: inv.invite_message,
            status: status,

            booking: {
                id: inv.booking.book_id,
                room_id: inv.booking.room_id,
                creator_id: inv.booking.organizer_id,
                title: inv.booking.title,
                description: inv.booking.booking_description,
                date: this.formatDateToYYYYMMDD(inv.booking.booking_date),
                start_time: this.formatDateToHHMM(inv.booking.started_at),
                end_time: this.formatDateToHHMM(inv.booking.ended_at),
                status: "Лох",
                created_at: inv.booking.created_at.toISOString()
            }
        }));

        return result;
    }

    async myInvitesByBooking(bookingId: number) {
        const findedBooking = await prisma.booking.findUnique({
            where: { book_id: bookingId }
        });

        if (!findedBooking) {
            throw new HttpError("Бронирование не найдено", 404);
        }

        const invs = await prisma.invitation.findMany({
            where: { book_id: bookingId },
            include: {
                role: true,
                status: true
            }
        });

        const result: InvitationDetail[] = invs.map((inv) => ({
            id: inv.invitation_id,
            booking_id: inv.book_id,
            user_id: inv.guest_id,
            role: inv.role.role_name,
            message: inv.invite_message,
            status: inv.status.status_name,
            created_at: inv.invitation_on.toISOString()
        }));

        return result;
    }

    async accept(invitationId: number) {
        let findedInv = await prisma.invitation.findUnique({
            where: { invitation_id: invitationId }
        });

        if (!findedInv) {
            throw new HttpError("Приглашение не найдено", 404);
        }

        await prisma.invitation.update({
            where: { invitation_id: invitationId },
            data: {
                status_id: 2
            }
        });
    }

    async decline(invitationId: number) {
        let findedInv = await prisma.invitation.findUnique({
            where: { invitation_id: invitationId }
        });

        if (!findedInv) {
            throw new HttpError("Приглашение не найдено", 404);
        }

        await prisma.invitation.update({
            where: { invitation_id: invitationId },
            data: {
                status_id: 3
            }
        });
    }

    async redactRole(invitationId: number, role: string) {
        let findedInv = await prisma.invitation.findUnique({
            where: { invitation_id: invitationId },
            include: {
                status: true
            }
        });

        if (!findedInv) {
            throw new HttpError("Приглашение не найдено", 404);
        }

        let findedRole = await prisma.bookingRole.findUnique({
            where: { role_name: role }
        });

        if (!findedRole) {
            throw new HttpError("Роль не найдена", 404);
        }

        const data = await prisma.invitation.update({
            data: {
                role_id: findedRole.role_id
            },
            where: { invitation_id: invitationId }
        });

        const res: InvitationDetail = {
            id: data.invitation_id,
            booking_id: data.book_id,
            user_id: data.guest_id,
            role: role,
            message: data.invite_message,
            status: findedInv.status.status_name,
            created_at: data.invitation_on.toISOString()
        };

        return res;
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