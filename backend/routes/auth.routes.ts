// backend/routes/auth.routes.ts
import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { pool } from "../src/db";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../auth/jwt";
import { blockIfPlanExpiredForRefresh } from "./user.routes";

const router = Router();

// Cookie settings for refresh token
const isProd = process.env.NODE_ENV === "production";
const RT_COOKIE_NAME = "rt";
const rtCookieOpts = {
  httpOnly: true,
  sameSite: ("lax" as const),
  secure: isProd,
  path: "/",           // adjust if you serve API under a sub-path
  maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days
};

// ---------- Login (USER) ----------
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email or password" });
  }
  const { email, password } = parsed.data;

  try {
    const { rows } = await pool.query<{
      id: string;
      email: string;
      name: string | null;
      password_hash: string;
      role: "admin" | "user";
      diet_time: string | null;
      created_at: Date;
    }>(
      "SELECT id, email, name, password_hash, role, diet_time, created_at FROM users WHERE email=$1",
      [email]
    );

    const user = rows[0];
    if (!user || user.role !== "user") {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // Access & Refresh
    const accessToken = signAccessToken({
      sub: user.id,
      role: "user",
      first_login: false,
    });

    const refreshToken = signRefreshToken({
      sub: user.id,
      role: "user",
      first_login: false
    });

    // Set refresh cookie
    res.cookie(RT_COOKIE_NAME, refreshToken, rtCookieOpts);

    // Return shape expected by frontend user Login.tsx
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        diet_time: user.diet_time,
      },
      tokens: { accessToken },
    });
  } catch (e) {
    console.error("[POST /auth/login] error:", e);
    return res.status(500).json({ error: "Login failed" });
  }
});

// ---------- Refresh (USER or ADMIN) ----------
router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies?.[RT_COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "Missing refresh token" });

    let payload: { sub: string; role: "admin" | "user" };
    try {
      payload = verifyRefreshToken(token) as any;
    } catch {
      // invalid/expired RT
      res.clearCookie(RT_COOKIE_NAME, { ...rtCookieOpts, maxAge: 0 });
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // If this is a USER, enforce plan window (no new AT if expired)
    if (payload.role === "user") {
      // Make userId available to the guard
      (res.locals as any).userId = payload.sub;

      // Run guard — it will clear cookie + 403 if expired and end the response
      await new Promise<void>((resolve) => {
        blockIfPlanExpiredForRefresh(req, res, () => {
          resolve(); // only resolves if not expired
        });
      });
      if (res.headersSent) return; // guard already handled the response
    }

    // Issue new AT (and rotate RT)
    const accessToken = signAccessToken({
      sub: payload.sub,
      role: payload.role,
      first_login: false,
    });
    const newRefresh = signRefreshToken({
      sub: payload.sub, role: payload.role,
      first_login: false
    });

    res.cookie(RT_COOKIE_NAME, newRefresh, rtCookieOpts);
    return res.json({ token: accessToken });
  } catch (e) {
    console.error("[POST /auth/refresh] error:", e);
    return res.status(500).json({ error: "Failed to refresh token" });
  }
});

// ---------- Logout ----------
router.post("/logout", async (_req, res) => {
  res.clearCookie(RT_COOKIE_NAME, { ...rtCookieOpts, maxAge: 0 });
  return res.json({ ok: true });
});

export default router;
