import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");

export type Role = "admin" | "user";

export interface AuthedUser {
  id: string;          // normalized (falls back to sub)
  role: Role;
  sub?: string;        // original sub if present
}

export interface AuthedRequest extends Request {
  user?: AuthedUser;
}

function getBearer(req: Request): string | null {
  const raw = req.headers.authorization || (req.headers as any).Authorization;
  if (!raw || typeof raw !== "string") return null;
  const [type, token] = raw.split(" ");
  return type?.toLowerCase() === "bearer" && token ? token : null;
}

function getToken(req: Request): string | null {
  return (
    getBearer(req) ||
    (req as any).cookies?.access_token ||
    (req as any).cookies?.token ||
    (req as any).cookies?.refresh_token ||
    null
  );
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const role: Role = decoded.role;
    const id = decoded.id || decoded.sub;
    if (!id || !role) return res.status(401).json({ error: "Unauthorized" });

    req.user = { id, role, sub: decoded.sub };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  return requireAuth(req, res, () => {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    next();
  });
}
