import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { pool } from "../src/db";
import { requireAuth, type AuthedRequest } from "../auth/guards";
import { signAccess, signRefresh } from "../auth/jwt";

const router = Router();

const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/* USER LOGIN */
router.post("/login", async (req, res) => {
  const parsed = userLoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { email, password } = parsed.data;

  const { rows } = await pool.query(
    `SELECT id, email, password_hash, first_login, must_change_password
       FROM users
      WHERE email=$1 AND role='user'
      LIMIT 1`,
    [email.trim().toLowerCase()]
  );

  const user = rows[0];
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const payload = {
    id: user.id,
    sub: user.id,
    role: "user" as const,
    first_login: !!user.first_login,
    must_change_password: !!user.must_change_password,
  };

  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    token: accessToken,
    firstLogin: !!user.first_login,
    mustChangePassword: !!user.must_change_password,
  });
});

/* NEW: who am I (for client to check mustChangePassword any time) */
router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  try {
    if (req.user!.role !== "user") return res.status(403).json({ error: "Forbidden" });
    const { rows } = await pool.query(
      `SELECT id, email, first_login, must_change_password
         FROM users
        WHERE id=$1 AND role='user'
        LIMIT 1`,
      [req.user!.id]
    );
    const u = rows[0];
    if (!u) return res.status(404).json({ error: "Not found" });
    return res.json({
      id: u.id,
      firstLogin: !!u.first_login,
      mustChangePassword: !!u.must_change_password,
    });
  } catch (e: any) {
    console.error("[auth/me] error:", e?.message || e);
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

/* FORCE CHANGE PASSWORD
   New policy: 8–64 chars, at least 1 digit and 1 symbol (no case requirement)
*/
const changeSchema = z.object({
  newPassword: z
    .string()
    .min(8)
    .max(64)
    .regex(/^(?=.*\d)(?=.*[^\w\s]).{8,64}$/),
});

router.post("/change-password", requireAuth, async (req: AuthedRequest, res) => {
  try {
    if (req.user!.role !== "user") return res.status(403).json({ error: "Forbidden" });

    const parsed = changeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Weak password" });

    const hash = await bcrypt.hash(parsed.data.newPassword, 12);
    await pool.query(
      `UPDATE users
          SET password_hash = $1,
              must_change_password = FALSE,
              first_login = FALSE
        WHERE id = $2 AND role='user'`,
      [hash, req.user!.id]
    );

    return res.json({ ok: true });
  } catch (e: any) {
    console.error("[auth/change-password] error:", e?.message || e);
    return res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;
