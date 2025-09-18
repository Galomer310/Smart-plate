import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");

export type TokenPayload = {
  id: string;
  sub?: string;
  role: "admin" | "user";
  first_login?: boolean;
  must_change_password?: boolean;
};

export const signAccess = (p: TokenPayload) =>
  jwt.sign({ ...p, sub: p.sub ?? p.id }, JWT_SECRET, { expiresIn: "1h" });

export const signRefresh = (p: TokenPayload) =>
  jwt.sign({ ...p, sub: p.sub ?? p.id }, JWT_SECRET, { expiresIn: "7d" });

export const verifyToken = (t: string) => jwt.verify(t, JWT_SECRET) as TokenPayload;
