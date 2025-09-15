import "dotenv/config";
import bcrypt from "bcrypt";
import { pool } from "./db";

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@smart-plate.io";
  const password = process.env.ADMIN_PASSWORD || "Admin123!";

  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    `
    INSERT INTO admins (email, password_hash)
    VALUES ($1, $2)
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `,
    [email, hash]
  );

  console.log(`✅ Admin seeded: ${email}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Seed admin failed:", e);
  process.exit(1);
});
