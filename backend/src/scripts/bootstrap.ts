import "dotenv/config";
import fs from "fs";
import path from "path";
import { pool } from "../db";

async function run() {
  const file = path.resolve(__dirname, "../../sql/000_bootstrap.sql");
  const sql = fs.readFileSync(file, "utf8");
  console.log("Applying SQL bootstrap from:", file);
  await pool.query(sql);
  console.log("✅ Database bootstrap completed");
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Bootstrap failed:", e);
  process.exit(1);
});
