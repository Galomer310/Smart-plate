import dotenv from "dotenv";
dotenv.config();

export const PORT = Number(process.env.PORT || 5000);
export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
export const DATABASE_URL = process.env.DATABASE_URL || "";
export const JWT_SECRET = process.env.JWT_SECRET || "";
export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || (JWT_SECRET ? `${JWT_SECRET}_refresh` : "");

if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");
if (!DATABASE_URL) console.warn("[env] DATABASE_URL is not set (Neon connection).");
