// @ts-nocheck
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";

export interface AccessTokenPayload extends JwtPayload {
  personId: number;
  roleId: number;
}

export const generateAccessToken = (payload: AccessTokenPayload) => {
  const accessExpires =
    (process.env.JWT_ACCESS_EXPIRE_M as string + "m") as StringValue;

  const options: SignOptions = { expiresIn: accessExpires };

  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, options);
};

export const generateRefreshToken = (payload: AccessTokenPayload) => {
  const refreshExpires =
    (process.env.JWT_REFRESH_EXPIRE_D as string + "d") as StringValue;

  const options: SignOptions = { expiresIn: refreshExpires };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, options);
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as AccessTokenPayload;
};