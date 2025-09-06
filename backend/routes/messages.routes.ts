import { Router } from "express";
import { pool } from "../src/db";
import { requireAuth, type AuthedRequest } from "../auth/guards";
import { z } from "zod";

const router = Router();

/** zod for send */
const sendSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

function isUUID(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

/**
 * GET /api/messages/my-admin
 * Users call this to find the admin's id to chat with.
 */
router.get("/my-admin", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "user") return res.status(403).json({ error: "Forbidden" });
  try {
    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM users WHERE role='admin' ORDER BY created_at ASC LIMIT 1`
    );
    if (!rows[0]) return res.status(404).json({ error: "No admin available" });
    return res.json({ adminId: rows[0].id });
  } catch (e) {
    console.error("[GET /messages/my-admin]", e);
    return res.status(500).json({ error: "Failed to resolve admin" });
  }
});

/**
 * GET /api/messages/threads
 * Admin: all user threads with last message + unread count.
 * User: a single 'admin' thread summary (exists even with no messages yet).
 */
router.get("/threads", requireAuth, async (req: AuthedRequest, res) => {
  const me = req.user!.sub;
  const role = req.user!.role;

  try {
    if (role === "admin") {
      const { rows } = await pool.query(
        `
        SELECT
          u.id AS other_id,
          u.name,
          u.email,
          (
            SELECT body FROM messages m
            WHERE (m.sender_id = u.id AND m.recipient_id = $1)
               OR (m.sender_id = $1 AND m.recipient_id = u.id)
            ORDER BY m.created_at DESC LIMIT 1
          ) AS last_body,
          (
            SELECT created_at FROM messages m
            WHERE (m.sender_id = u.id AND m.recipient_id = $1)
               OR (m.sender_id = $1 AND m.recipient_id = u.id)
            ORDER BY m.created_at DESC LIMIT 1
          ) AS last_created_at,
          (
            SELECT COUNT(*) FROM messages m
            WHERE m.sender_id = u.id AND m.recipient_id = $1 AND m.read_at IS NULL
          ) AS unread_count
        FROM users u
        WHERE u.role = 'user'
          AND EXISTS (
            SELECT 1 FROM messages m
            WHERE (m.sender_id = u.id AND m.recipient_id = $1)
               OR (m.sender_id = $1 AND m.recipient_id = u.id)
          )
        ORDER BY last_created_at DESC NULLS LAST
        LIMIT 100
        `,
        [me]
      );
      return res.json({ threads: rows });
    } else {
      // user → fabricate a single 'admin' thread (even if empty)
      const adminRow = await pool.query<{ id: string }>(
        `SELECT id FROM users WHERE role='admin' ORDER BY created_at ASC LIMIT 1`
      );
      const adminId = adminRow.rows[0]?.id;
      if (!adminId) return res.json({ threads: [] });

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
    console.error("[GET /messages/threads]", e);
    return res.status(500).json({ error: "Failed to load threads" });
  }
});

/**
 * GET /api/messages/conversation/:otherId?before=ISO&limit=50
 * Returns messages ASC and marks incoming as read.
 */
router.get("/conversation/:otherId", requireAuth, async (req: AuthedRequest, res) => {
  const me = req.user!.sub;
  const otherId = req.params.otherId;
  if (!isUUID(otherId)) return res.status(400).json({ error: "Invalid otherId" });

  const limit = Math.max(1, Math.min(200, parseInt(String(req.query.limit || "50"), 10)));
  const before = req.query.before ? new Date(String(req.query.before)) : null;

  try {
    const params: any[] = [me, otherId, otherId, me];
    let where = `((sender_id = $1 AND recipient_id = $2) OR (sender_id = $3 AND recipient_id = $4))`;
    if (before && !Number.isNaN(before.getTime())) {
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

    // mark incoming as read
    await pool.query(
      `UPDATE messages SET read_at = now() WHERE recipient_id = $1 AND sender_id = $2 AND read_at IS NULL`,
      [me, otherId]
    );

    return res.json({ messages: rows.reverse() });
  } catch (e: any) {
    console.error("[GET /messages/conversation/:otherId]", e);
    if (e?.code === "42P01") return res.status(500).json({ error: "Table 'messages' does not exist. Run the SQL migration." });
    return res.status(500).json({ error: "Failed to load conversation" });
  }
});

/**
 * POST /api/messages/:otherId  { body }
 * Send message me → otherId
 */
router.post("/:otherId", requireAuth, async (req: AuthedRequest, res) => {
  const me = req.user!.sub;
  const otherId = req.params.otherId;
  if (!isUUID(otherId)) return res.status(400).json({ error: "Invalid otherId" });

  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Message body required (max 5000 chars)" });

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO messages (sender_id, recipient_id, body)
      VALUES ($1, $2, $3)
      RETURNING id, sender_id, recipient_id, body, created_at, read_at
      `,
      [me, otherId, parsed.data.body]
    );
    return res.json({ message: rows[0] });
  } catch (e: any) {
    console.error("[POST /messages/:otherId]", e);
    if (e?.code === "42P01") return res.status(500).json({ error: "Table 'messages' does not exist. Run the SQL migration." });
    if (e?.code === "23503") return res.status(400).json({ error: "Recipient does not exist" }); // FK violation
    return res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
