import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../src/db";
import { signAccessToken, signRefreshToken } from "../auth/jwt";
import { AuthedRequest, requireAuth, requireAdmin } from "../auth/guards";

const router = Router();

/** ADMIN LOGIN: sets refresh cookie, returns access token */
router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  const { rows } = await pool.query(
    `SELECT id, name, email, role, password_hash, first_login
       FROM users WHERE email=$1`,
    [email]
  );
  const user = rows[0];
  if (!user || user.role !== "admin") return res.status(401).json({ error: "Invalid admin credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid admin credentials" });

  const payload = { sub: user.id, role: user.role, first_login: user.first_login };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie("rt", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  return res.json({ token: accessToken });
});

/** DASHBOARD LIST (admin-only) */
router.get("/dashboard", requireAuth, requireAdmin, async (_req: AuthedRequest, res) => {
  const { rows } = await pool.query(`
    SELECT
      u.id,
      u.email,
      u.name,
      COALESCE(u.age, 0) AS age,
      u.diet_time,
      COALESCE(p.height, NULL) AS height,
      COALESCE(p.weight, NULL) AS weight,
      COALESCE(p.subscription_plan, NULL) AS subscription_plan,
      COALESCE(p.subscription_price, NULL) AS subscription_price,
      COALESCE(p.training_category, NULL) AS training_category
    FROM users u
    LEFT JOIN user_profile p ON p.user_id = u.id
    WHERE u.role='user'
    ORDER BY u.created_at DESC
  `);
  res.json({ users: rows });
});

/** CREATE USER (admin-only) — only 4 fields required */
router.post("/users", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { name, email, password, dietTime } = req.body ?? {};
  if (!name || !email || !password || !dietTime) {
    return res.status(400).json({ error: "name, email, password, dietTime are required" });
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, role, password_hash, first_login, diet_time)
       VALUES ($1, $2, 'user', $3, false, $4)
       RETURNING id, name, email, role, first_login, diet_time`,
      [name, email, hash, dietTime]
    );

    const u = rows[0];
    res.status(201).json({
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        firstLogin: u.first_login,
        diet_time: u.diet_time,
      },
    });
  } catch (e: any) {
    if (e.code === "23505") return res.status(409).json({ error: "Email already exists" });
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

/** DELETE USER (admin-only) */
router.delete("/users/:userId", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  await pool.query(`DELETE FROM users WHERE id=$1 AND role='user'`, [req.params.userId]);
  res.json({ ok: true });
});

/** UPDATE SUBSCRIPTION (admin-only) */
router.put("/users/:userId/subscribe", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { userId } = req.params;
  const { height, weight, subscriptionPlan, subscriptionPrice, trainingCategory } = req.body ?? {};

  await pool.query(
    `
    INSERT INTO user_profile (user_id, height, weight, subscription_plan, subscription_price, training_category)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (user_id) DO UPDATE
      SET height=EXCLUDED.height,
          weight=EXCLUDED.weight,
          subscription_plan=EXCLUDED.subscription_plan,
          subscription_price=EXCLUDED.subscription_price,
          training_category=EXCLUDED.training_category,
          updated_at=now()
    `,
    [userId, height ?? null, weight ?? null, subscriptionPlan ?? null, subscriptionPrice ?? null, trainingCategory ?? null]
  );

  res.json({ ok: true });
});

export default router;
