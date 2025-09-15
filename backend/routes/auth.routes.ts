import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../src/db";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");

// helpers
type JwtPayload = { sub: string; role: "user" | "admin"; first_login?: boolean };
const signAccess = (p: JwtPayload) =>
  jwt.sign(p, JWT_SECRET, { expiresIn: "1h" });
const signRefresh = (p: JwtPayload) =>
  jwt.sign(p, JWT_SECRET, { expiresIn: "7d" });

// ---------- USER LOGIN ----------
const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = userLoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { email, password } = parsed.data;

  // only users (not admins) here
  const { rows } = await pool.query(
    `SELECT id, email, password_hash, first_login
     FROM users
     WHERE email=$1 AND role='user'
     LIMIT 1`,
    [email.trim()]
  );

  const user = rows[0];
  if (!user) {
    console.warn("[user.login] no user for email:", email);
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    console.warn("[user.login] bad password for", email);
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const payload: JwtPayload = {
    sub: user.id,
    role: "user",
    first_login: !!user.first_login,
  };

  // access in body, refresh in httpOnly cookie
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh({ sub: user.id, role: "user" });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,      // set true behind HTTPS in production
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({ token: accessToken, firstLogin: !!user.first_login });
});

// ---------- REFRESH ACCESS TOKEN ----------
router.post("/refresh", (req, res) => {
  const token = req.cookies?.refresh_token as string | undefined;
  if (!token) return res.status(401).json({ error: "No refresh token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    // optionally: check plan validity here before issuing new access token
    const access = signAccess({
      sub: decoded.sub,
      role: decoded.role,
      first_login: decoded.first_login,
    });
    return res.json({ token: access });
  } catch {
    return res.status(403).json({ error: "Invalid refresh token" });
  }
});

// ---------- LOGOUT ----------
router.post("/logout", (_req, res) => {
  res.clearCookie("refresh_token", { path: "/" });
  return res.json({ ok: true });
});

export default router;
