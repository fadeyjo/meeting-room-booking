import { NextFunction, Request, Response } from "express";
import type { RegisterDto, LoginDto, RefreshDto, LogoutDto } from "@shared-types/types";
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

export class AuthController {
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