import { NextFunction, Request, Response } from "express";
import type { RegisterDto, LoginDto, RefreshDto, LogoutDto, RedactPersonDto } from "@shared-types/types";
import { AuthService } from "../services/auth.service";
import { HttpError } from "@shared-backend/utils/http-error";

const authService = new AuthService();

export class AuthController {
  async searchUser(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = req.query.q as string;

      if (!sub) {
        return res.status(400).json({ message: "Параметр q обязателен" });
      }

      const result = await authService.searchUser(sub);

      res.json(result);
    } catch (error: any) {
      next(error)
    }
  }

  async redactPerson(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        next(new HttpError("ID пользователя не получен", 400));
        return;
      }

      const personData: RedactPersonDto = req.body;

      const result = await authService.redactPerson(personData, id);

      res.json(result);
    } catch (error: any) {
      next(error)
    }
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.getAllUsers();

      res.json(result);
    } catch (error: any) {
      next(error)
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken }: RefreshDto = req.body;

      const result = await authService.refresh(refreshToken);

      res.json(result);
    } catch (error: any) {
      next(error)
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: RegisterDto = req.body

      const result = await authService.register(dto);

      res.json(result);
    } catch (error: any) {
      next(error)
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password }: LoginDto = req.body;

      const result = await authService.login(email, password);

      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken }: LogoutDto = req.body;

      const result = await authService.logout(refreshToken);

      res.json(result);
    } catch (error: any) {
      next(error)
    }
  }
}