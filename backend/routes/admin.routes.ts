// backend/src/routes/admin.routes.ts
import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { pool } from "../src/db";              // keep your existing pathing
import { requireAdmin } from "../auth/guards";  // guard middleware
import { signAccess, signRefresh } from "../auth/jwt";

const router = Router();

/* ───────────────────────── Schemas ───────────────────────── */
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

/* ───────────────────── Admin Login (public) ───────────────────── */
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

  // NOTE: set secure:true in production (HTTPS)
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({ token: accessToken });
});

/* ───────────────────── All routes below require admin ───────────────────── */
router.use(requireAdmin);

/* GET /api/admin/dashboard
   Returns the admin table rows. We enrich the SELECT so BMI can be computed.
*/
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

        -- questionnaire/profile snippets for table
        q.age            AS q_age,
        q.program_goal   AS program_goal,

        -- ✅ add questionnaire height/weight so BMI can be computed even if profile is empty
        q.height         AS q_height,
        q.weight         AS q_weight,

        -- profile snapshot
        p.height         AS height_profile,
        p.weight         AS weight_profile

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

/* ✅ GET /api/admin/users/:id
   Returns a *full* joined record (user + questionnaire + profile) for the Details modal.
*/
router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
      SELECT
        u.*,

        -- questionnaire (alias snake→snake so frontend can coalesce reliably)
        q.height                AS q_height,
        q.weight                AS q_weight,
        q.age                   AS q_age,
        q.allergies             AS allergies,
        q.program_goal          AS program_goal,
        q.body_improvement      AS body_improvement,
        q.medical_issues        AS medical_issues,
        q.takes_medications     AS takes_medications,
        q.pregnant_or_postpartum AS pregnant_or_postpartum,
        q.menopause_symptoms    AS menopause_symptoms,
        q.breakfast_regular     AS breakfast_regular,
        q.digestion_issues      AS digestion_issues,
        q.snacking_between_meals AS snacking_between_meals,
        q.organized_eating      AS organized_eating,
        q.avoid_food_groups     AS avoid_food_groups,
        q.water_intake          AS water_intake,
        q.diet_type             AS diet_type,
        q.regular_activity      AS regular_activity,
        q.training_place        AS training_place,
        q.training_frequency    AS training_frequency,
        q.activity_type         AS activity_type,
        q.body_feeling          AS body_feeling,
        q.sleep_hours           AS sleep_hours,
        q.submitted_at          AS submitted_at,

        -- profile (kept separate in case you expand later)
        p.height                AS height_profile,
        p.weight                AS weight_profile

      FROM users u
      LEFT JOIN user_questionnaire q ON q.user_id = u.id
      LEFT JOIN user_profile       p ON p.user_id = u.id
      WHERE u.id = $1
      LIMIT 1
      `,
      [id]
    );

    const user = rows[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ user });
  } catch (e: any) {
    console.error("[admin/users/:id][GET] error:", e?.message || e);
    return res.status(500).json({ error: "Failed to load user details" });
  }
});

/* POST /api/admin/users — create user */
router.post("/users", async (req, res) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

    const { name, email, password, startDate, endDate } = parsed.data;

    // unique check
    const exists = await pool.query(
      `SELECT 1 FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1`,
      [email]
    );
    const count = (exists as any).rowCount ?? ((exists as any).rows?.length ?? 0);
    if (Number(count) > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `
      INSERT INTO users
        (name, email, password_hash, role, diet_start_date, diet_end_date, must_change_password, first_login)
      VALUES
        ($1,   $2,    $3,            'user', $4,              $5,              TRUE,                TRUE)
      RETURNING id, name, email, role, diet_start_date, diet_end_date, must_change_password, first_login
      `,
      [name.trim(), email.trim().toLowerCase(), password_hash, startDate, endDate]
    );

    return res.status(201).json({ user: rows[0] });
  } catch (e: any) {
    console.error("[admin/users][POST] error:", e?.message || e);
    return res.status(500).json({ error: "Failed to create user" });
  }
});

/* DELETE /api/admin/users/:id */
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM users WHERE id = $1 AND role = 'user'", [id]);
    return res.json({ ok: true });
  } catch (e: any) {
    console.error("[admin/users/:id][DELETE] error:", e?.message || e);
    return res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
