// @ts-nocheck
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.sendStatus(401);
  }

  const token = authHeader.split(" ")[1] as string;

  try {
    const decoded = verifyAccessToken(token)

    req.person = decoded;

    next();
  } catch {
    return res.sendStatus(401);
  }
};