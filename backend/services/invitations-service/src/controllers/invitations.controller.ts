import { HttpError } from "@shared-backend/utils/http-error";
import { InviteDto, RedactInvitationRole, InvitationRequestDto } from "@shared-types/types/invitations";
import { NextFunction, Request, Response } from "express";
import { InvitationsService } from "src/services/invitations.service";

const invitationsService = new InvitationsService();

export class InvitationsController {
    async invite(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.person)
            {
                next(new HttpError("Не авторизован", 401));
                return;
            }

            const data: InviteDto = req.body;
    
            const result = await invitationsService.invite(data, req.person.personId);
    
            res.status(201).json(result);
        }
        catch(err: any) {
            next(err)
        }
    }

    async myInvites(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.person)
            {
                next(new HttpError("Не авторизован", 401));
                return;
            }

            const status = typeof req.query.status === "string" ? req.query.status : undefined;
    
            const result = await invitationsService.myInvites(req.person.personId, status)
    
            res.json(result);
        }
        catch(err: any) {
            next(err)
        }
    }

    async myInvitesByBooking(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.params.id)
            {
                next(new HttpError("Не передан bookingId", 400));
                return;
            }
    
            const result = await invitationsService.myInvitesByBooking(Number(req.params.id));
    
            res.json(result);
        }
        catch(err: any) {
            next(err)
        }
    }

    async accept(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.params.id)
            {
                next(new HttpError("Не передан id приглашения", 400));
                return;
            }
    
            await invitationsService.accept(Number(req.params.id));
    
            res.sendStatus(200);
        }
        catch(err: any) {
            next(err)
        }
    }

    async decline(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.params.id) {
                next(new HttpError("Не передан id приглашения", 400));
                return;
            }
            await invitationsService.decline(Number(req.params.id));
            res.sendStatus(200);
        } catch (err: any) {
            next(err);
        }
    }

    async removeFromMeeting(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.params.id) {
                next(new HttpError("Не передан id приглашения", 400));
                return;
            }
            if (!req.person) {
                next(new HttpError("Не авторизован", 401));
                return;
            }
            await invitationsService.removeFromMeeting(Number(req.params.id), req.person.personId);
            res.sendStatus(200);
        } catch (err: any) {
            next(err);
        }
    }

    async redactRole(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.params.id) {
                next(new HttpError("не передано id приглашения", 400));
                return;
            }

            if (!req.person) {
                next(new HttpError("Не авторизован", 401));
                return;
            }

            const { role }: RedactInvitationRole = req.body;
    
            const result = await invitationsService.redactRole(Number(req.params.id), role, req.person.personId);
    
            res.json(result);
        }
        catch(err: any) {
            next(err)
        }
    }

    async createRequest(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.person) {
                next(new HttpError("Не авторизован", 401));
                return;
            }
            const data: InvitationRequestDto = req.body;
            const result = await invitationsService.createRequest(
                { ...data, message: data.message ?? "" },
                req.person.personId
            );
            res.status(201).json(result);
        } catch (err: any) {
            next(err);
        }
    }

    async getIncomingRequests(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.person) {
                next(new HttpError("Не авторизован", 401));
                return;
            }
            const result = await invitationsService.getIncomingRequests(req.person.personId);
            res.json(result);
        } catch (err: any) {
            next(err);
        }
    }

    async getRequestsByBooking(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.person) {
                next(new HttpError("Не авторизован", 401));
                return;
            }
            const bookingId = Number(req.params.bookingId);
            if (isNaN(bookingId)) {
                next(new HttpError("Некорректный ID бронирования", 400));
                return;
            }
            const result = await invitationsService.getRequestsByBooking(bookingId, req.person.personId);
            res.json(result);
        } catch (err: any) {
            next(err);
        }
    }

    async approveRequest(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.person) {
                next(new HttpError("Не авторизован", 401));
                return;
            }
            const id = Number(req.params.id);
            if (isNaN(id)) {
                next(new HttpError("Некорректный ID запроса", 400));
                return;
            }
            await invitationsService.approveRequest(id, req.person.personId);
            res.sendStatus(200);
        } catch (err: any) {
            next(err);
        }
    }

    async rejectRequest(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.person) {
                next(new HttpError("Не авторизован", 401));
                return;
            }
            const id = Number(req.params.id);
            if (isNaN(id)) {
                next(new HttpError("Некорректный ID запроса", 400));
                return;
            }
            await invitationsService.rejectRequest(id, req.person.personId);
            res.sendStatus(200);
        } catch (err: any) {
            next(err);
        }
    }
}