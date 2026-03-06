import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { RegisterDto } from "../dto/register.dto";
import { LoginDto } from "../dto/login.dto";
import { RefreshDto } from "../dto/refresh.dto";
import { LogoutDto } from "../dto/logout.dto";
import { HttpError } from "../utils/http-error";

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