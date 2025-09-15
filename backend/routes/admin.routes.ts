import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { pool } from "../src/db";
import { AuthedRequest, requireAuth } from "../auth/guards";
import { signAccessToken } from "../auth/jwt";

const router = Router();

/* ------------------------- Admin login (unchanged API) ------------------------- */
const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { email, password } = parsed.data;

  try {
    const q = await pool.query(
      `SELECT id, password_hash, role, first_login
       FROM users
       WHERE email = $1 AND role = 'admin'
       LIMIT 1`,
      [email.toLowerCase()]
    );

    const row = q.rows[0];
    if (!row) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signAccessToken({
      sub: row.id,
      role: "admin",
      first_login: !!row.first_login,
    });

    return res.json({ token });
  } catch (e) {
    console.error("[POST /api/admin/login] error:", e);
    return res.status(500).json({ error: "Login failed" });
  }
});

/* ------------------------- Dashboard list ------------------------- */
/* Returns users + questionnaire/profile fields used by your table/details modal */
router.get("/dashboard", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const q = await pool.query(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      COALESCE(q.age, u.age) AS age,
      u.diet_start_date,
      u.diet_end_date,

      /* questionnaire (details modal) */
      q.height                         AS height,
      q.weight                         AS weight,
      q.age                            AS q_age,
      q.allergies,
      q.program_goal,
      q.body_improvement,
      q.medical_issues,
      q.takes_medications,
      q.pregnant_or_postpartum,
      q.menopause_symptoms,
      q.breakfast_regular,
      q.digestion_issues,
      q.snacking_between_meals,
      q.organized_eating,
      q.avoid_food_groups,
      q.water_intake,
      q.diet_type,
      q.regular_activity,
      q.training_place,
      q.training_frequency,
      q.activity_type,
      q.body_feeling,
      q.sleep_hours,
      q.submitted_at,

      /* profile fallback fields */
      p.height                         AS height_profile,
      p.weight                         AS weight_profile

    FROM users u
    LEFT JOIN user_questionnaire q ON q.user_id = u.id
    LEFT JOIN user_profile       p ON p.user_id = u.id
    ORDER BY u.created_at ASC
    `
  );

  return res.json({ users: q.rows });
});

/* ------------------------- Create user with explicit dates ------------------------- */
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),   // YYYY-MM-DD
});

router.post("/users", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { name, email, password, startDate, endDate } = parsed.data;

  if (new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({ error: "End date must be on/after start date" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const q = await pool.query(
      `INSERT INTO users (name, email, role, password_hash, first_login, diet_start_date, diet_end_date)
       VALUES ($1,$2,'user',$3,TRUE,$4,$5)
       RETURNING id`,
      [name, email.toLowerCase(), hash, startDate, endDate]
    );

    return res.json({ id: q.rows[0].id });
  } catch (e: any) {
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error("[POST /api/admin/users] error:", e);
    return res.status(500).json({ error: "Failed to create user" });
  }
});

/* ------------------------- Delete user ------------------------- */
router.delete("/users/:id", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  await pool.query(`DELETE FROM users WHERE id=$1`, [req.params.id]);
  return res.json({ ok: true });
});

export default router;
