import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../src/db";
import { AuthedRequest, requireAuth } from "../auth/guards";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../auth/jwt";

const router = Router();

/** USER LOGIN */
router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  const { rows } = await pool.query(
    `SELECT id, name, email, role, password_hash, first_login
       FROM users WHERE email=$1`,
    [email]
  );
  const user = rows[0];
  if (!user || user.role !== "user") return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  await pool.query(`UPDATE users SET last_login=now() WHERE id=$1`, [user.id]);

  const payload = { sub: user.id, role: user.role, first_login: user.first_login };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie("rt", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set true when behind HTTPS
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      firstLogin: user.first_login,
    },
    tokens: { accessToken },
  });
});

/** CHANGE PASSWORD */
router.post("/change-password", requireAuth, async (req: AuthedRequest, res) => {
  const { newPassword } = req.body ?? {};
  if (!newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ error: "newPassword (min 8 chars) is required" });
  }
  const userId = req.user!.sub;
  const newHash = await bcrypt.hash(newPassword, 10);
  await pool.query(`UPDATE users SET password_hash=$1, first_login=false WHERE id=$2`, [newHash, userId]);
  res.json({ ok: true });
});

/** REFRESH ACCESS TOKEN (uses cookie) */
router.post("/refresh", async (req, res) => {
  const rt = (req as any).cookies?.rt;
  if (!rt) return res.status(401).json({ error: "No refresh token" });
  try {
    const payload = verifyRefreshToken(rt);
    const accessToken = signAccessToken(payload);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

/** LOGOUT (clears cookie) */
router.post("/logout", (_req, res) => {
  res.clearCookie("rt", { path: "/" });
  res.json({ ok: true });
});

export default router;
