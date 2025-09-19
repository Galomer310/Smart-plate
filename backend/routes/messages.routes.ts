import { Router } from "express";
import { pool } from "../src/db";
import { requireAuth, type AuthedRequest } from "../auth/guards";
import { z } from "zod";
import bcrypt from "bcrypt";

const router = Router();

/* ----------------------------- Utils / Zod ----------------------------- */

const sendSchema = z.object({ body: z.string().trim().min(1).max(5000) });

function isUUID(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

/**
 * Make sure there is a row in `users` we can use for messaging as the Admin.
 * Why: `messages.sender_id/recipient_id` FK → users(id). But your admin logs in from `admins`.
 * Strategy:
 *  - If a `users.role='admin'` exists → use it.
 *  - Else, take the first row from `admins`, create a shadow `users` row (role='admin'), and return its id.
 */
async function ensureMessagingAdminUserId(): Promise<string> {
  // 1) Try to find existing 'admin' user in USERS
  const tryUser = await pool.query<{ id: string }>(
    `SELECT id FROM users WHERE role='admin' ORDER BY created_at ASC LIMIT 1`
  );
  if (tryUser.rows[0]?.id) return tryUser.rows[0].id;

  // 2) Fallback: take first admin from ADMINS table
  const tryAdmin = await pool.query<{ id: string; email: string; name?: string }>(
    `SELECT id, email, COALESCE(name, 'Admin') AS name FROM admins ORDER BY created_at ASC LIMIT 1`
  );
  const admin = tryAdmin.rows[0];
  if (!admin) throw new Error("No admin found in \`admins\` table");

  // 3) Insert a shadow admin into USERS for messaging FK compatibility
  const password_hash = await bcrypt.hash("!disabled-account!", 10);
  const inserted = await pool.query<{ id: string }>(
    `
      INSERT INTO users
        (name, email, password_hash, role, diet_start_date, diet_end_date, must_change_password, first_login)
      VALUES
        ($1,   $2,    $3,            'admin', NULL,             NULL,            FALSE,               FALSE)
      RETURNING id
    `,
    [admin.name ?? "Admin", admin.email.toLowerCase(), password_hash]
  );
  return inserted.rows[0].id;
}

/**
 * Resolve the current principal's messaging user id (exists in USERS):
 *  - user → their own users.id
 *  - admin → shadow admin users.id (ensure/create if needed)
 */
async function getMessagingUserId(req: AuthedRequest): Promise<string> {
  const role = req.user!.role;
  if (role === "user") return req.user!.id || req.user!.sub!;
  // admin
  return ensureMessagingAdminUserId();
}

/* ------------------------------- Routes -------------------------------- */

/** Unread for navbar pill */
router.get("/new", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const me = await getMessagingUserId(req);
    const { rows } = await pool.query(
      `
        SELECT id, sender_id, recipient_id, body, created_at, read_at
        FROM messages
        WHERE recipient_id = $1 AND read_at IS NULL
        ORDER BY created_at DESC
      `,
      [me]
    );
    return res.json({ messages: rows });
  } catch (e) {
    console.error("[GET /messages/new]", e);
    return res.status(500).json({ error: "Failed to load unread" });
  }
});

/** Resolve admin (returns USERS.id to satisfy FK) */
router.get("/my-admin", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "user")
    return res.status(403).json({ error: "Forbidden" });
  try {
    const adminUserId = await ensureMessagingAdminUserId();
    return res.json({ adminId: adminUserId });
  } catch (e) {
    console.error("[GET /messages/my-admin]", e);
    return res.status(500).json({ error: "Failed to resolve admin" });
  }
});

/**
 * Threads:
 *  - admin → list user threads with last message + unread count
 *  - user  → single “admin” thread summary, even if empty
 */
router.get("/threads", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const role = req.user!.role;

    if (role === "admin") {
      const me = await getMessagingUserId(req); // admin-as-user id

      const { rows } = await pool.query(
        `
        WITH last_msg AS (
          SELECT
            CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END AS other_id,
            MAX(m.created_at) AS last_created_at
          FROM messages m
          WHERE m.sender_id = $1 OR m.recipient_id = $1
          GROUP BY other_id
        ),
        unread AS (
          SELECT m.sender_id AS other_id, COUNT(*) AS unread_count
          FROM messages m
          WHERE m.recipient_id = $1 AND m.read_at IS NULL
          GROUP BY m.sender_id
        )
        SELECT
          lm.other_id,
          u.name,
          u.email,
          m.body AS last_body,
          lm.last_created_at,
          COALESCE(un.unread_count, 0) AS unread_count
        FROM last_msg lm
        JOIN users u ON u.id = lm.other_id
        /* 🔧 FIX: actually join the unread CTE alias 'un' */
        LEFT JOIN unread un ON un.other_id = lm.other_id
        LEFT JOIN messages m
          ON (
            (m.sender_id = $1 AND m.recipient_id = lm.other_id) OR
            (m.sender_id = lm.other_id AND m.recipient_id = $1)
          )
         AND m.created_at = lm.last_created_at
        ORDER BY lm.last_created_at DESC NULLS LAST
        LIMIT 100
        `,
        [me]
      );

      return res.json({ threads: rows });
    } else {
      // user → fabricate a single 'admin' thread summary
      const me = req.user!.id || req.user!.sub!;
      const adminId = await ensureMessagingAdminUserId();

      const { rows } = await pool.query(
        `
        SELECT
          $1::uuid AS other_id,
          'Admin'::text AS name,
          NULL::text AS email,
          (
            SELECT body FROM messages m
            WHERE (m.sender_id = $1 AND m.recipient_id = $2)
               OR (m.sender_id = $2 AND m.recipient_id = $1)
            ORDER BY m.created_at DESC LIMIT 1
          ) AS last_body,
          (
            SELECT created_at FROM messages m
            WHERE (m.sender_id = $1 AND m.recipient_id = $2)
               OR (m.sender_id = $2 AND m.recipient_id = $1)
            ORDER BY m.created_at DESC LIMIT 1
          ) AS last_created_at,
          (
            SELECT COUNT(*) FROM messages m
            WHERE m.sender_id = $1 AND m.recipient_id = $2 AND m.read_at IS NULL
          ) AS unread_count
        `,
        [adminId, me]
      );

      return res.json({ threads: rows });
    }
  } catch (e) {
    console.error("[GET /messages/threads] error:", e);
    return res.status(500).json({ error: "Failed to load threads" });
  }
});

/** Conversation + mark incoming as read */
router.get(
  "/conversation/:otherId",
  requireAuth,
  async (req: AuthedRequest, res) => {
    try {
      const me = await getMessagingUserId(req);
      const otherId = req.params.otherId;
      if (!isUUID(otherId))
        return res.status(400).json({ error: "Invalid otherId" });

      const limit = Math.max(
        1,
        Math.min(200, parseInt(String(req.query.limit || "50"), 10))
      );
      const before =
        req.query.before && !Number.isNaN(new Date(String(req.query.before)).getTime())
          ? new Date(String(req.query.before))
          : null;

      const params: any[] = [me, otherId, otherId, me];
      let where = `((sender_id = $1 AND recipient_id = $2) OR (sender_id = $3 AND recipient_id = $4))`;
      if (before) {
        params.push(before.toISOString());
        where += ` AND created_at < $${params.length}`;
      }

      const q = `
        SELECT id, sender_id, recipient_id, body, created_at, read_at
        FROM messages
        WHERE ${where}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      const { rows } = await pool.query(q, params);

      // Mark incoming as read (other → me)
      await pool.query(
        `UPDATE messages
           SET read_at = now()
         WHERE recipient_id = $1 AND sender_id = $2 AND read_at IS NULL`,
        [me, otherId]
      );

      return res.json({ messages: rows.reverse() });
    } catch (e: any) {
      console.error("[GET /messages/conversation/:otherId]", e);
      if (e?.code === "42P01")
        return res
          .status(500)
          .json({ error: "Table 'messages' does not exist. Run the migration." });
      return res.status(500).json({ error: "Failed to load conversation" });
    }
  }
);

/** Send */
router.post("/:otherId", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const me = await getMessagingUserId(req);
    const otherId = req.params.otherId;
    if (!isUUID(otherId))
      return res.status(400).json({ error: "Invalid otherId" });

    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ error: "Message body required (max 5000 chars)" });

    const { rows } = await pool.query(
      `
      INSERT INTO messages (sender_id, recipient_id, body)
      VALUES ($1, $2, $3)
      RETURNING id, sender_id, recipient_id, body, created_at, read_at
      `,
      [me, otherId, parsed.data.body]
    );

    return res.status(201).json({ message: rows[0] });
  } catch (e: any) {
    console.error("[POST /messages/:otherId] error:", e);
    if (e?.code === "42P01")
      return res
        .status(500)
        .json({ error: "Table 'messages' does not exist. Run the migration." });
    if (e?.code === "23503")
      return res.status(400).json({ error: "Recipient does not exist" }); // FK violation
    return res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
