// backend/routes/user.routes.ts
import { Router, type Request, type Response, type NextFunction } from "express";
import { pool } from "../src/db";
import { requireAuth, type AuthedRequest } from "../auth/guards";
import { z } from "zod";

const router = Router();

/* ---------------------------------- */
/* Helper functions (plan window)     */
/* ---------------------------------- */

// Parse a number of days out of a free-form diet_time string, e.g. "21 days" -> 21
function parseDietDays(text?: string | null): number {
  if (!text) return 0;
  const m = String(text).match(/\d+/);
  return m ? Math.max(0, parseInt(m[0], 10)) : 0;
}

function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
function diffDays(a: Date, b: Date): number {
  return Math.floor((toDateOnly(a).getTime() - toDateOnly(b).getTime()) / 86_400_000);
}

/**
 * Load plan info for a user from DB and compute enroll/start/end & diet-day counters.
 * Returns JS Dates and flags. Throws if user not found.
 */
export async function getPlanInfoForUser(userId: string) {
  const { rows } = await pool.query<{ created_at: Date; diet_time: string | null }>(
    "SELECT created_at, diet_time FROM users WHERE id = $1",
    [userId]
  );
  const row = rows[0];
  if (!row) throw new Error("User not found");

  const enrollDate = toDateOnly(new Date(row.created_at));
  const startDate = addDays(enrollDate, 1); // diet starts the day after registration
  const dietDays = parseDietDays(row.diet_time);

  const endDate = dietDays > 0 ? addDays(startDate, dietDays - 1) : startDate;

  const today = toDateOnly(new Date());
  let todayDietDay = 0;
  if (today >= startDate) {
    todayDietDay = diffDays(today, startDate) + 1; // 1-based
  }
  const expired = dietDays > 0 && todayDietDay > dietDays;

  return { enrollDate, startDate, endDate, dietDays, todayDietDay, expired };
}

/**
 * Middleware to use in your REFRESH route.
 * Assumes you already verified the refresh token and set res.locals.userId = <uuid>.
 *
 * Example in auth.routes.ts (inside refresh handler, after verifying RT):
 *   res.locals.userId = payload.sub;
 *   await blockIfPlanExpiredForRefresh(req, res, next); // will end response if expired
 *   // then issue new access token...
 */
export async function blockIfPlanExpiredForRefresh(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId: string | undefined =
      (res.locals && res.locals.userId) || (req as any).userId;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId for plan check" });
    }

    const plan = await getPlanInfoForUser(userId);
    if (plan.expired) {
      // Stop refresh: clear refresh cookie and refuse new access token
      res.clearCookie("rt", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", // adjust if you set a custom path for the RT cookie
      });
      return res.status(403).json({ error: "Plan expired" });
    }

    return next();
  } catch (e) {
    console.error("[refresh-plan-guard] error:", e);
    return res.status(500).json({ error: "Error checking plan window" });
  }
}

/* ---------------------------------- */
/* Questionnaire endpoints             */
/* ---------------------------------- */

/** GET current user's questionnaire (if exists) */
router.get("/questionnaire", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "user") {
    return res
      .status(403)
      .json({ error: "Forbidden (admin cannot submit questionnaire)" });
  }
  const userId = req.user!.sub;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM user_questionnaire WHERE user_id=$1`,
      [userId]
    );
    if (!rows[0]) return res.json({ exists: false });
    return res.json({ exists: true, data: rows[0] });
  } catch (e) {
    console.error("[GET /questionnaire] DB error:", e);
    return res
      .status(500)
      .json({ error: "Database error while reading questionnaire" });
  }
});

// Zod schema: only height, weight (text) are free, age is coerced and validated
const questionnaireSchema = z.object({
  height: z.string().trim().min(1, "גובה נדרש"),
  weight: z.string().trim().min(1, "משקל נדרש"),
  age: z
    .coerce.number()
    .int()
    .min(20, "הגיל חייב להיות בין 20 ל-90")
    .max(90, "הגיל חייב להיות בין 20 ל-90"),

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

/** POST submit questionnaire */
router.post("/questionnaire", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "user") {
    return res
      .status(403)
      .json({ error: "Forbidden (admin cannot submit questionnaire)" });
  }
  const userId = req.user!.sub;

  // Validate & coerce
  const parsed = questionnaireSchema.safeParse(req.body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message).join(", ");
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
        training_frequency, activity_type, body_feeling, sleep_hours
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,
        $12,$13,$14,$15,
        $16,$17,$18,$19,$20,
        $21,$22,$23,$24
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
        q.height,
        q.weight,
        q.age,
        q.allergies ?? null,
        q.program_goal ?? null,
        q.body_improvement ?? null,
        q.medical_issues ?? null,
        q.takes_medications ?? null,
        q.pregnant_or_postpartum ?? null,
        q.menopause_symptoms ?? null,
        q.breakfast_regular ?? null,
        q.digestion_issues ?? null,
        q.snacking_between_meals ?? null,
        q.organized_eating ?? null,
        q.avoid_food_groups ?? null,
        q.water_intake ?? null,
        q.diet_type ?? null,
        q.regular_activity ?? null,
        q.training_place ?? null,
        q.training_frequency ?? null,
        q.activity_type ?? null,
        q.body_feeling ?? null,
        q.sleep_hours ?? null,
      ]
    );
    return res.json({ ok: true });
  } catch (e: any) {
    console.error("[POST /questionnaire] DB error:", e);
    // Common guardrails: missing table or wrong column types
    if (e?.code === "42P01") {
      return res.status(500).json({
        error:
          "Database table user_questionnaire does not exist. Run the provided SQL migration.",
      });
    }
    return res
      .status(500)
      .json({ error: "Database error while saving questionnaire" });
  }
});

/* ---------------------------------- */
/* Plan info endpoint                  */
/* ---------------------------------- */

/** GET current user plan window & diet-day counter */
router.get("/plan", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "user") {
    return res.status(403).json({ error: "Forbidden" });
  }
  const userId = req.user!.sub;

  try {
    const plan = await getPlanInfoForUser(userId);
    const { enrollDate, startDate, endDate, dietDays, todayDietDay, expired } =
      plan;

    return res.json({
      enrollDate: enrollDate.toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      dietDays,
      todayDietDay,
      expired,
    });
  } catch (e) {
    console.error("[GET /plan] error:", e);
    return res.status(500).json({ error: "Failed to compute plan window" });
  }
});

export default router;
