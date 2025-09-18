import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { pool } from "../src/db";
import { requireAdmin } from "../auth/guards";
import { signAccess, signRefresh } from "../auth/jwt";

const router = Router();

/* ───────── Schemas ───────── */
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const createUserSchema = z.object({
  name: z.string().min(1, "name is required"),
  email: z.string().email("valid email required"),
  password: z.string().min(6, "password min 6 chars"),
  startDate: z.string().min(1), // YYYY-MM-DD
  endDate: z.string().min(1),   // YYYY-MM-DD
});

/* ───────── Helpers ───────── */
async function emailExists(email: string): Promise<boolean> {
  const q = await pool.query(
    "SELECT 1 FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1",
    [email]
  );
  const count = (q as any).rowCount ?? ((q as any).rows?.length ?? 0);
  return Number(count) > 0;
}

/* ───────── ADMIN LOGIN (public, uses `admins` table) ───────── */
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { email, password } = parsed.data;

  const { rows } = await pool.query(
    `SELECT id, email, password_hash
       FROM admins
      WHERE email = $1
      LIMIT 1`,
    [email.trim().toLowerCase()]
  );

  const admin = rows[0];
  if (!admin) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const payload = { id: admin.id, sub: admin.id, role: "admin" as const };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true in production HTTPS
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({ token: accessToken });
});

/* ───────── PROTECT EVERYTHING AFTER THIS ───────── */
router.use(requireAdmin);

/* GET /api/admin/dashboard — users + joined profile/questionnaire */
router.get("/dashboard", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.diet_start_date,
        u.diet_end_date,
        u.first_login,
        u.must_change_password,

        -- aliases for your frontend
        q.age          AS q_age,
        q.program_goal AS program_goal,
        p.height       AS height_profile,
        p.weight       AS weight_profile

      FROM users u
      LEFT JOIN user_questionnaire q ON q.user_id = u.id
      LEFT JOIN user_profile       p ON p.user_id = u.id
      WHERE u.role = 'user'
      ORDER BY u.created_at DESC NULLS LAST
      `
    );

    return res.json({ users: rows });
  } catch (e: any) {
    console.error("[admin/dashboard][GET] error:", e?.message || e);
    return res.status(500).json({ error: "Failed to load dashboard" });
  }
});

/* POST /api/admin/users — create user with must_change_password = TRUE
   NOTE: removed 'updated_at' column since your table doesn't have it.
         also rely on created_at DEFAULT now() (we don't set it explicitly).
*/
router.post("/users", async (req, res) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid payload",
        details: parsed.error.flatten(),
      });
    }
    const { name, email, password, startDate, endDate } = parsed.data;

    if (await emailExists(email)) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const insertSql = `
      INSERT INTO users
        (name, email, password_hash, role, diet_start_date, diet_end_date,
         must_change_password, first_login)
      VALUES
        ($1,   $2,    $3,            'user', $4,             $5,
         TRUE,               TRUE)
      RETURNING id
    `;

    const { rows } = await pool.query(insertSql, [
      name.trim(),
      email.trim().toLowerCase(),
      password_hash,
      startDate,
      endDate,
    ]);

    return res.status(201).json({ id: rows[0].id });
  } catch (e: any) {
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error("[admin/users][POST] error:", e?.message || e);
    return res.status(500).json({ error: "Failed to create user" });
  }
});

/* DELETE /api/admin/users/:id */
router.delete("/users/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = $1 AND role='user'", [String(req.params.id)]);
    return res.json({ ok: true });
  } catch (e: any) {
    console.error("[admin/users/:id][DELETE] error:", e?.message || e);
    return res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
