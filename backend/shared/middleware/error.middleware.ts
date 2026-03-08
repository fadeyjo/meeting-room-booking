// @ts-nocheck
import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/http-error";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      title: err.message,
      statusCode: err.statusCode
    });
  } else {
    console.error(err);
    res.status(500).json({
      title: "Internal server error",
      statusCode: 500
    });
  }
};