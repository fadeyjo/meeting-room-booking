import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/http-error";

export const authorizeRole = (roleId: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.person)
    {
      next(new HttpError("Не авторизован", 401))
      return
    }
    
    const perRoleId: number = req.person.roleId;

    if (!perRoleId) {
      next(new HttpError("Не авторизован", 401))
      return
    }

    if (perRoleId !== roleId) {
      next(new HttpError("Нет доступа", 403))
      return
    }

    next();
  };
};