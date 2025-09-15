import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import adminRoutes from "../routes/admin.routes";
import authRoutes from "../routes/auth.routes";
import userRoutes from "../routes/user.routes";
import messagesRoutes from "../routes/messages.routes";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true, // allow refresh cookie
}));
app.use(express.json());
app.use(cookieParser());

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ✅ Mount routers (paths must match your frontend calls)
app.use("/api/admin", adminRoutes);     // /api/admin/login
app.use("/api/auth", authRoutes);       // /api/auth/login | /api/auth/refresh | /api/auth/logout
app.use("/api/user", userRoutes);       // /api/user/questionnaire (GET/POST)
app.use("/api/messages", messagesRoutes);

// (Optional) last-resort 404 logger to help debug wrong paths
app.use((req, res) => {
  console.warn("[404]", req.method, req.originalUrl);
  res.status(404).json({ error: "Not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Smart-plate API listening on http://localhost:${PORT}`);
});
