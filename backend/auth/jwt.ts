import jwt, { SignOptions } from "jsonwebtoken";
import { JWT_SECRET, JWT_REFRESH_SECRET } from "../src/env";

export interface JwtPayload {
  sub: string;               // user id
  role: "admin" | "user";
  first_login: boolean;
}

export function signAccessToken(payload: JwtPayload, opts: SignOptions = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m", ...opts });
}

export function signRefreshToken(payload: JwtPayload, opts: SignOptions = {}) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "30d", ...opts });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
}
