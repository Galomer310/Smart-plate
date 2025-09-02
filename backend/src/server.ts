import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { PORT, FRONTEND_ORIGIN } from "./env";
import authRoutes from "../routes/auth.routes";
import adminRoutes from "../routes/admin.routes";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true, // allow cookies for refresh token
  })
);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`Smart-plate API listening on http://localhost:${PORT}`);
});
