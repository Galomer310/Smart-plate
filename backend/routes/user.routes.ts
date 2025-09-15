import { Router } from "express";
import { z } from "zod";
import { pool } from "../src/db";
import { AuthedRequest, requireAuth } from "../auth/guards";

const router = Router();
const APP_TZ = process.env.APP_TZ || "UTC";

/* ------------------------- Plan endpoint (prefers explicit dates) ------------------------- */
router.get("/plan", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "user") return res.status(403).json({ error: "Forbidden" });
  const userId = req.user!.sub;

  try {
    const q = await pool.query(
      `
      SELECT
        diet_start_date,
        diet_end_date,
        (created_at AT TIME ZONE $1)::date AS created_local,
        (now()       AT TIME ZONE $1)::date AS today_local
      FROM users
      WHERE id=$2
      LIMIT 1
      `,
      [APP_TZ, userId]
    );
    const row = q.rows[0];
    if (!row) return res.status(404).json({ error: "User not found" });

    let startDate: string | null = row.diet_start_date;
    let endDate: string | null   = row.diet_end_date;

    // Legacy fallback: if not set, start = created+1, end = null (unknown)
    if (!startDate) {
      const s = new Date(`${row.created_local}T00:00:00Z`);
      const sPlus1 = new Date(s.getTime() + 1 * 86400000);
      startDate = sPlus1.toISOString().slice(0, 10);
    }

    const todayStr: string = row.today_local;
    const today = new Date(`${todayStr}T00:00:00Z`);
    const s = startDate ? new Date(`${startDate}T00:00:00Z`) : null;

    let dayIndex = 0;
    let dietDays = 0;
    let expired = false;

    if (s) {
      if (today < s) dayIndex = 0;
      else dayIndex = Math.floor((today.getTime() - s.getTime()) / 86400000) + 1;
    }

    if (startDate && endDate) {
      const e = new Date(`${endDate}T00:00:00Z`);
      dietDays = Math.floor((e.getTime() - new Date(`${startDate}T00:00:00Z`).getTime()) / 86400000) + 1;
      expired = today > e;
      // clamp dayIndex to [1..dietDays]
      if (dayIndex > dietDays) dayIndex = dietDays;
    }

    return res.json({
      startDate,
      endDate,
      dietDays,
      dayIndex,
      expired,
      tz: APP_TZ,
    });
  } catch (e) {
    console.error("[GET /api/user/plan] error:", e);
    return res.status(500).json({ error: "Failed to compute plan" });
  }
});

/* ------------------------- Meals: today's snapshot ------------------------- */
router.get("/meals", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "user") return res.status(403).json({ error: "Forbidden" });
  const userId = req.user!.sub;

  try {
    const dQ = await pool.query(`SELECT (now() AT TIME ZONE $1)::date AS today`, [APP_TZ]);
    const today: string = dQ.rows[0].today;

    const { rows } = await pool.query(
      `SELECT id, meal_date, meal_name, carbs, protein, fat
       FROM user_meals
       WHERE user_id=$1 AND meal_date=$2
       ORDER BY meal_name`,
      [userId, today]
    );

    const byName: Record<string, any> = {};
    for (const r of rows) byName[r.meal_name] = r;

    return res.json({ meals: rows, byName, date: today });
  } catch (e) {
    console.error("[GET /api/user/meals] error:", e);
    return res.status(500).json({ error: "Failed to load meals" });
  }
});

/* ------------------------- Questionnaire (get/upsert) ------------------------- */
const questionnaireSchema = z.object({
  height: z.string().trim().min(1, "גובה נדרש"),
  weight: z.string().trim().min(1, "משקל נדרש"),
  age: z.coerce.number().int().min(20).max(90),

  allergies: z.string().optional(),
  program_goal: z.string().optional(),
  body_improvement: z.string().optional(),
  medical_issues: z.string().optional(),
  takes_medications: z.string().optional(),
  pregnant_or_postpartum: z.string().optional(),
  menopause_symptoms: z.string().optional(),
  breakfast_regular: z.string().optional(),
  digestion_issues: z.string().optional(),
  snacking_between_meals: z.string().optional(),
  organized_eating: z.string().optional(),
  avoid_food_groups: z.string().optional(),
  water_intake: z.string().optional(),
  diet_type: z.string().optional(),
  regular_activity: z.string().optional(),
  training_place: z.string().optional(),
  training_frequency: z.string().optional(),
  activity_type: z.string().optional(),
  body_feeling: z.string().optional(),
  sleep_hours: z.string().optional(),
});

router.get("/questionnaire", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "user") return res.status(403).json({ error: "Forbidden" });
  const userId = req.user!.sub;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM user_questionnaire WHERE user_id=$1`,
      [userId]
    );
    if (!rows[0]) return res.json({ exists: false });
    return res.json({ exists: true, data: rows[0] });
  } catch (e) {
    console.error("[GET /api/user/questionnaire] error:", e);
    return res.status(500).json({ error: "Database error" });
  }
});

router.post("/questionnaire", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "user") return res.status(403).json({ error: "Forbidden" });
  const userId = req.user!.sub;

  const parsed = questionnaireSchema.safeParse(req.body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => i.message).join(", ");
    return res.status(400).json({ error: `Validation error: ${issues}` });
  }
  const q = parsed.data;

  try {
    await pool.query(
      `
      INSERT INTO user_questionnaire (
        user_id, height, weight, age, allergies, program_goal, body_improvement,
        medical_issues, takes_medications, pregnant_or_postpartum, menopause_symptoms,
        breakfast_regular, digestion_issues, snacking_between_meals, organized_eating,
        avoid_food_groups, water_intake, diet_type, regular_activity, training_place,
        training_frequency, activity_type, body_feeling, sleep_hours, submitted_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,
        $12,$13,$14,$15,
        $16,$17,$18,$19,$20,
        $21,$22,$23,$24, now()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        height=EXCLUDED.height,
        weight=EXCLUDED.weight,
        age=EXCLUDED.age,
        allergies=EXCLUDED.allergies,
        program_goal=EXCLUDED.program_goal,
        body_improvement=EXCLUDED.body_improvement,
        medical_issues=EXCLUDED.medical_issues,
        takes_medications=EXCLUDED.takes_medications,
        pregnant_or_postpartum=EXCLUDED.pregnant_or_postpartum,
        menopause_symptoms=EXCLUDED.menopause_symptoms,
        breakfast_regular=EXCLUDED.breakfast_regular,
        digestion_issues=EXCLUDED.digestion_issues,
        snacking_between_meals=EXCLUDED.snacking_between_meals,
        organized_eating=EXCLUDED.organized_eating,
        avoid_food_groups=EXCLUDED.avoid_food_groups,
        water_intake=EXCLUDED.water_intake,
        diet_type=EXCLUDED.diet_type,
        regular_activity=EXCLUDED.regular_activity,
        training_place=EXCLUDED.training_place,
        training_frequency=EXCLUDED.training_frequency,
        activity_type=EXCLUDED.activity_type,
        body_feeling=EXCLUDED.body_feeling,
        sleep_hours=EXCLUDED.sleep_hours,
        submitted_at=now()
      `,
      [
        userId,
        q.height, q.weight, q.age,
        q.allergies ?? null, q.program_goal ?? null, q.body_improvement ?? null,
        q.medical_issues ?? null, q.takes_medications ?? null, q.pregnant_or_postpartum ?? null, q.menopause_symptoms ?? null,
        q.breakfast_regular ?? null, q.digestion_issues ?? null, q.snacking_between_meals ?? null, q.organized_eating ?? null,
        q.avoid_food_groups ?? null, q.water_intake ?? null, q.diet_type ?? null, q.regular_activity ?? null, q.training_place ?? null,
        q.training_frequency ?? null, q.activity_type ?? null, q.body_feeling ?? null, q.sleep_hours ?? null,
      ]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/user/questionnaire] error:", e);
    return res.status(500).json({ error: "Database error" });
  }
});

/* Optional: named export used by /auth/refresh if you wired it earlier */
export async function blockIfPlanExpiredForRefresh(req: any, res: any, next: any) {
  try {
    const userId = res.locals?.userId || req.user?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const q = await pool.query(
      `SELECT diet_start_date, diet_end_date FROM users WHERE id=$1`,
      [userId]
    );
    const row = q.rows[0];
    if (!row) return res.status(401).json({ error: "Unauthorized" });

    const todayStr = (await pool.query(`SELECT (now() AT TIME ZONE $1)::date AS d`, [APP_TZ])).rows[0].d as string;

    if (row.diet_start_date && row.diet_end_date) {
      const end = new Date(`${row.diet_end_date}T00:00:00Z`);
      const today = new Date(`${todayStr}T00:00:00Z`);
      if (today > end) return res.status(403).json({ error: "Plan expired" });
    }
    return next();
  } catch (e) {
    console.error("[blockIfPlanExpiredForRefresh] error:", e);
    return res.status(500).json({ error: "Internal error" });
  }
}

export default router;
