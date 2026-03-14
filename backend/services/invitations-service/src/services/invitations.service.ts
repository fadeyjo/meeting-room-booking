import { InvitationDetail, InviteDto, MyInviteDto, InvitationRequestDto, InvitationRequestItem } from "@shared-types/types/invitations";
import prisma from "../config/prisma";
import { HttpError } from "@shared-backend/utils/http-error";

export class InvitationsService {
    async invite(data: InviteDto, iniciatorId: number) {
        const roleNameNormalized = data.role.trim().toLowerCase();
        let dbRoleName = data.role;

        if (roleNameNormalized === "спикер") {
            dbRoleName = "Спикер";
        } else if (roleNameNormalized === "слушатель") {
            dbRoleName = "Слушатель";
        }
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

        const findedBook = await prisma.booking.findUnique({
            where: { book_id: data.booking_id },
            include: { room: true }
        });

        if (!findedBook) {
            throw new HttpError("Бронирование не найдено", 404);
        }

        if (findedBook.organizer_id !== iniciatorId) {
            throw new HttpError("Приглашать может только организатор", 403);
        }

        const meetingEnd = new Date(findedBook.booking_date);
        const endTime = new Date(findedBook.ended_at);
        meetingEnd.setHours(endTime.getHours(), endTime.getMinutes(), endTime.getSeconds(), 0);
        if (meetingEnd < new Date()) {
            throw new HttpError("Нельзя приглашать на встречу, которая уже прошла", 400);
        }

        if (findedBook.organizer_id === data.user_id) {
            throw new HttpError("Организатора приглашать не надо, он и так в встрече", 400);
        }

        const existingInvitation = await prisma.invitation.findFirst({
            where: {
                book_id: data.booking_id,
                guest_id: data.user_id
            },
            include: { status: true }
        });
        if (existingInvitation) {
            const st = existingInvitation.status?.status_name || "";
            if (st === "Принято" || st === "Ожидает") {
                throw new HttpError("Этот пользователь уже приглашён или уже в встрече", 400);
            }
        }

        const acceptedCount = await prisma.invitation.count({
            where: {
                book_id: data.booking_id,
                status: { status_name: "Принято" }
            }
        });
        const totalParticipants = 1 + acceptedCount;
        if (findedBook.room && totalParticipants >= findedBook.room.capacity) {
            throw new HttpError("Переговорка заполнена", 400);
        }

        let findedRole = await prisma.bookingRole.findUnique({
            where: { role_name: dbRoleName }
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
            role: dbRoleName,
            message: invitation.invite_message,
            status: "Ожидает",
            created_at: invitation.invitation_on.toISOString()
        }

        return res
    }

    async myInvites(iniciatorId: number, status?: string) {
        const findedPer = await prisma.person.findUnique({
            where: { person_id: iniciatorId }
        });

        if (!findedPer) {
            throw new HttpError("Инициатор не найден", 404);
        }

        let statusFilterId: number | undefined;

        if (status) {
            const normalized = status.trim().toLowerCase();
            let dbStatusName = status;

            if (normalized === "ожидает") {
                dbStatusName = "Ожидает";
            } else if (normalized === "принято") {
                dbStatusName = "Принято";
            } else if (normalized === "отклонено") {
                dbStatusName = "Отклонено";
            }

            const findedStatus = await prisma.invitationStatus.findUnique({
                where: { status_name: dbStatusName }
            });

            if (!findedStatus) {
                throw new HttpError("Статус не найден", 404);
            }

            statusFilterId = findedStatus.status_id;
        }

        const invites = await prisma.invitation.findMany({
            where: {
                guest_id: iniciatorId,
                ...(statusFilterId ? { status_id: statusFilterId } : {})
            },
            include: {
                booking: true,
                role: true,
                status: true
            }
        });

        const result: MyInviteDto[] = invites.map((inv) => ({
            id: inv.invitation_id,
            role: inv.role.role_name,
            message: inv.invite_message,
            status: inv.status?.status_name ?? "Ожидает",

            booking: {
                id: inv.booking.book_id,
                room_id: inv.booking.room_id,
                creator_id: inv.booking.organizer_id,
                title: inv.booking.title,
                description: inv.booking.booking_description,
                date: this.formatDateToYYYYMMDD(inv.booking.booking_date),
                start_time: this.formatDateToHHMM(inv.booking.started_at),
                end_time: this.formatDateToHHMM(inv.booking.ended_at),
                status: "active",
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
                status: true,
                guest: true,
            },
        });

        const result: InvitationDetail[] = invs.map((inv) => ({
            id: inv.invitation_id,
            booking_id: inv.book_id,
            user_id: inv.guest_id,
            role: inv.role.role_name,
            message: inv.invite_message,
            status: inv.status.status_name,
            created_at: inv.invitation_on.toISOString(),
            firstName: inv.guest.first_name,
            lastName: inv.guest.last_name,
            patronymic: inv.guest.patronymic ?? undefined,
        }));

        return result;
    }

    async accept(invitationId: number) {
        const findedInv = await prisma.invitation.findUnique({
            where: { invitation_id: invitationId },
            include: { booking: { include: { room: true } } }
        });

        if (!findedInv) {
            throw new HttpError("Приглашение не найдено", 404);
        }

        await prisma.invitation.update({
            where: { invitation_id: invitationId },
            data: { status_id: 2 }
        });

        const room = findedInv.booking.room;
        if (room) {
            const acceptedCount = await prisma.invitation.count({
                where: {
                    book_id: findedInv.book_id,
                    status: { status_name: "Принято" }
                }
            });
            if (1 + acceptedCount >= room.capacity) {
                const [pendingStatus, overflowDeclinedStatus] = await Promise.all([
                    prisma.invitationStatus.findUnique({ where: { status_name: "Ожидает" } }),
                    prisma.invitationStatus.findUnique({ where: { status_name: "Отменено (переполнение)" } })
                ]);
                if (pendingStatus && overflowDeclinedStatus) {
                    await prisma.invitation.updateMany({
                        where: {
                            book_id: findedInv.book_id,
                            status_id: pendingStatus.status_id
                        },
                        data: { status_id: overflowDeclinedStatus.status_id }
                    });
                }
            }
        }
    }

    async decline(invitationId: number) {
        const findedInv = await prisma.invitation.findUnique({
            where: { invitation_id: invitationId }
        });

        if (!findedInv) {
            throw new HttpError("Приглашение не найдено", 404);
        }

        await prisma.invitation.update({
            where: { invitation_id: invitationId },
            data: { status_id: 3 }
        });
    }

    async removeFromMeeting(invitationId: number, personId: number) {
        const findedInv = await prisma.invitation.findUnique({
            where: { invitation_id: invitationId },
            include: { booking: true, status: true }
        });

        if (!findedInv) {
            throw new HttpError("Приглашение не найдено", 404);
        }

        if (findedInv.booking.organizer_id !== personId) {
            throw new HttpError("Удалять с встречи может только организатор", 403);
        }

        if (findedInv.status.status_name !== "Принято") {
            throw new HttpError("Удалить можно только принявших приглашение", 400);
        }

        const declinedStatus = await prisma.invitationStatus.findUnique({ where: { status_name: "Отклонено" } });
        if (!declinedStatus) {
            throw new HttpError("Статус приглашения не найден", 500);
        }

        await prisma.invitation.update({
            where: { invitation_id: invitationId },
            data: { status_id: declinedStatus.status_id }
        });
    }

    async redactRole(invitationId: number, role: string, requesterPersonId: number) {
        const normalized = role.trim().toLowerCase();
        const dbRoleName = normalized === "спикер" ? "Спикер" : normalized === "слушатель" ? "Слушатель" : role;

        const findedInv = await prisma.invitation.findUnique({
            where: { invitation_id: invitationId },
            include: {
                status: true,
                booking: true,
            }
        });

        if (!findedInv) {
            throw new HttpError("Приглашение не найдено", 404);
        }

        if (findedInv.booking.organizer_id !== requesterPersonId) {
            throw new HttpError("Менять роль может только организатор", 403);
        }

        const findedRole = await prisma.bookingRole.findUnique({
            where: { role_name: dbRoleName }
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
            role: dbRoleName,
            message: data.invite_message,
            status: findedInv.status.status_name,
            created_at: data.invitation_on.toISOString()
        };

        return res;
    }

    async createRequest(data: InvitationRequestDto, requesterId: number) {
        const dbRoleName = data.role.trim().toLowerCase() === "спикер" ? "Спикер" : data.role.trim().toLowerCase() === "слушатель" ? "Слушатель" : data.role;
        const booking = await prisma.booking.findUnique({ where: { book_id: data.booking_id } });
        if (!booking) throw new HttpError("Бронирование не найдено", 404);
        const meetingEnd = new Date(booking.booking_date);
        const endTime = new Date(booking.ended_at);
        meetingEnd.setHours(endTime.getHours(), endTime.getMinutes(), endTime.getSeconds(), 0);
        if (meetingEnd < new Date()) {
            throw new HttpError("Встреча уже прошла", 400);
        }
        if (booking.organizer_id === requesterId) {
            throw new HttpError("Организатор приглашает через раздел «Пригласить»", 400);
        }
        const acceptedStatus = await prisma.invitationStatus.findUnique({ where: { status_name: "Принято" } });
        if (!acceptedStatus) throw new HttpError("Статус приглашения не найден", 500);
        const acceptedInv = await prisma.invitation.findFirst({
            where: {
                book_id: data.booking_id,
                guest_id: requesterId,
                status_id: acceptedStatus.status_id
            }
        });
        if (!acceptedInv) {
            throw new HttpError("запрос могут слать только те, кто уже в встрече", 403);
        }
        const guest = await prisma.person.findUnique({ where: { person_id: data.user_id } });
        if (!guest) throw new HttpError("Гость не найден", 404);
        if (data.user_id === booking.organizer_id) {
            throw new HttpError("Организатора приглашать запросом не надо", 400);
        }
        const existingInv = await prisma.invitation.findFirst({
            where: { book_id: data.booking_id, guest_id: data.user_id }
        });
        if (existingInv) throw new HttpError("Этот пользователь уже приглашён", 409);
        const pendingRequest = await prisma.invitationRequest.findFirst({
            where: { book_id: data.booking_id, guest_id: data.user_id, status: "pending" }
        });
        if (pendingRequest) throw new HttpError("Запрос на этого пользователя уже отправлен", 409);
        const role = await prisma.bookingRole.findUnique({ where: { role_name: dbRoleName } });
        if (!role) throw new HttpError("Роль не найдена", 404);
        const req = await prisma.invitationRequest.create({
            data: {
                book_id: data.booking_id,
                requested_by_id: requesterId,
                guest_id: data.user_id,
                role_id: role.role_id,
                invite_message: data.message ?? "",
                status: "pending",
                created_at: new Date()
            },
            include: {
                requested_by: true,
                guest: true,
                role: true,
                booking: true
            }
        });
        return this.toRequestItem(req);
    }

    toRequestItem(r: {
        request_id: number;
        book_id: number;
        requested_by_id: number;
        guest_id: number;
        invite_message: string;
        status: string;
        created_at: Date;
        decided_at: Date | null;
        decided_by_id: number | null;
        requested_by?: { first_name: string; last_name: string; patronymic: string | null };
        guest?: { first_name: string; last_name: string; patronymic: string | null };
        role?: { role_name: string };
        booking?: { title: string };
    }): InvitationRequestItem {
        const requesterName = r.requested_by
            ? [r.requested_by.last_name, r.requested_by.first_name, r.requested_by.patronymic].filter(Boolean).join(" ")
            : "";
        const guestName = r.guest
            ? [r.guest.last_name, r.guest.first_name, r.guest.patronymic].filter(Boolean).join(" ")
            : "";
        return {
            id: r.request_id,
            booking_id: r.book_id,
            requested_by_id: r.requested_by_id,
            requested_by_name: requesterName,
            guest_id: r.guest_id,
            guest_name: guestName,
            role: r.role?.role_name ?? "",
            message: r.invite_message,
            status: r.status as "pending" | "approved" | "rejected",
            created_at: r.created_at.toISOString(),
            decided_at: r.decided_at?.toISOString() ?? null
        };
    }

    async getIncomingRequests(organizerId: number): Promise<InvitationRequestItem[]> {
        const list = await prisma.invitationRequest.findMany({
            where: {
                status: "pending",
                booking: { organizer_id: organizerId }
            },
            include: {
                requested_by: true,
                guest: true,
                role: true,
                booking: true
            }
        });
        return list.map((r) => this.toRequestItem(r));
    }

    async getRequestsByBooking(bookingId: number, personId: number) {
        const booking = await prisma.booking.findUnique({ where: { book_id: bookingId } });
        if (!booking) throw new HttpError("Бронирование не найдено", 404);
        const isOrganizer = booking.organizer_id === personId;
        const where: { book_id: number; requested_by_id?: number } = { book_id: bookingId };
        if (!isOrganizer) where.requested_by_id = personId;
        const list = await prisma.invitationRequest.findMany({
            where,
            include: { requested_by: true, guest: true, role: true, booking: true }
        });
        return list.map((r) => this.toRequestItem(r));
    }

    async approveRequest(requestId: number, personId: number) {
        const req = await prisma.invitationRequest.findUnique({
            where: { request_id: requestId },
            include: { booking: { include: { room: true } } }
        });
        if (!req) throw new HttpError("Запрос не найден", 404);
        if (req.status !== "pending") throw new HttpError("Запрос уже рассмотрен", 400);
        if (req.booking.organizer_id !== personId) throw new HttpError("Подтверждать может только организатор", 403);

        const room = req.booking.room;
        if (room) {
            const acceptedCount = await prisma.invitation.count({
                where: {
                    book_id: req.book_id,
                    status: { status_name: "Принято" }
                }
            });
            if (1 + acceptedCount >= room.capacity) {
                throw new HttpError("Переговорка заполнена", 400);
            }
        }

        await prisma.$transaction([
            prisma.invitationRequest.update({
                where: { request_id: requestId },
                data: { status: "approved", decided_at: new Date(), decided_by_id: personId }
            }),
            prisma.invitation.create({
                data: {
                    invitation_on: new Date(),
                    initiator_id: personId,
                    guest_id: req.guest_id,
                    book_id: req.book_id,
                    role_id: req.role_id,
                    invite_message: req.invite_message,
                    status_id: 1
                }
            })
        ]);
    }

    async rejectRequest(requestId: number, personId: number) {
        const req = await prisma.invitationRequest.findUnique({
            where: { request_id: requestId },
            include: { booking: true }
        });
        if (!req) throw new HttpError("Запрос не найден", 404);
        if (req.status !== "pending") throw new HttpError("Запрос уже рассмотрен", 400);
        if (req.booking.organizer_id !== personId) throw new HttpError("Отклонять может только организатор", 403);
        await prisma.invitationRequest.update({
            where: { request_id: requestId },
            data: { status: "rejected", decided_at: new Date(), decided_by_id: personId }
        });
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