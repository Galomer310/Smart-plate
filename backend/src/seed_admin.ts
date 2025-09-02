import { pool } from "./db";
import bcrypt from "bcrypt";

async function main() {
  const email = "admin@smartplate.local";   // <-- your fixed admin login
  const password = "Admin123!";             // <-- change anytime; continues to work
  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO users (name, email, role, password_hash, first_login)
     VALUES ($1, $2, 'admin', $3, false)
     ON CONFLICT (email) DO NOTHING`,
    ["Admin", email, hash]
  );

  console.log("Seeded admin:", { email, password });
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
