import { NextFunction, Request, Response } from "express";
import { HttpError } from "@shared-backend/utils/http-error";
import { BookingsService } from "src/services/bookings.service";
import { NewBookingDto } from "@shared-types/types/bookings";

const bookingsService = new BookingsService();

export class BookingsController {
    async newBooking(req: Request, res: Response, next: NextFunction) {
      try {
          if (!req.person)
          {
              next(new HttpError("Не авторизован", 401));
              return;
          }
  
          const newBookings: NewBookingDto = req.body;
  
          const result = await bookingsService.newBooking(newBookings, req.person.personId);
  
          res.status(201).json(result);
      }
      catch(err: any) {
          next(err)
      }
    }
  
    async getMyBookings(req: Request, res: Response, next: NextFunction) {
      try {
          if (!req.person)
          {
              next(new HttpError("Не авторизован", 401));
              return;
          }
  
          const result = await bookingsService.getMyBookings(req.person.personId);
  
          res.json(result);
      }
      catch(err: any) {
          next(err)
      }
    }
  
    async getMyMeetings(req: Request, res: Response, next: NextFunction) {
      try {
          if (!req.person)
          {
              next(new HttpError("Не авторизован", 401));
              return;
          }
  
          const result = await bookingsService.getMyMeetings(req.person.personId);
  
          res.json(result);
      }
      catch(err: any) {
          next(err)
      }
    }
  
    async getBookingDetail(req: Request, res: Response, next: NextFunction) {
      try {
          const bookId = Number(req.params.id);
  
          const result = await bookingsService.getBookingDetail(bookId);
  
          res.json(result);
      }
      catch(err: any) {
          next(err)
      }
    }

    async cancelBooking(req: Request, res: Response, next: NextFunction) {
      try {
          if (!req.person) {
              next(new HttpError("Не авторизован", 401));
              return;
          }
          const bookId = Number(req.params.id);
          if (isNaN(bookId)) {
              next(new HttpError("Некорректный ID бронирования", 400));
              return;
          }
          await bookingsService.cancelBooking(bookId, req.person.personId);
          res.sendStatus(200);
      } catch (err: any) {
          next(err);
      }
    }
  
    async getFreeTimeSlotsByRoom(req: Request, res: Response, next: NextFunction) {
      try {
          if (!req.params.id)
          {
              next(new HttpError("Не передан roomId", 400));
              return;
          }
  
          if (!req.query.date)
          {
              next(new HttpError("Не передан date", 400));
              return;
          }
  
          const result = await bookingsService.getFreeTimeSlotsByRoom(Number(req.params.id), req.query.date as string);
  
          res.json(result);
      }
      catch(err: any) {
          next(err)
      }
    }

    async getRoomsByFreeSlots(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.query.date)
            {
                next(new HttpError("Не передан date", 400));
                return;
            }
    
            const result = await bookingsService.getRoomsFreeSlots(req.query.date as string);
    
            res.json(result);
        }
        catch(err: any) {
            next(err)
        }
    }
}