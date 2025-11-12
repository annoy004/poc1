import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDB, pgClient } from "./config/db.js";
import uploadRoutes from "./routes/upload.routes.js";
import askRoutes from "./routes/ask.routes.js";

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/upload", uploadRoutes);
app.use("/api/ask", askRoutes);

// Health check
app.get("/api/health", (_, res) => res.json({ ok: true }));

// Database status check
app.get("/api/db-status", async (_, res) => {
  try {
    const result = await pgClient.query("SELECT NOW()");
    res.json({ connected: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// Initialize DB on startup
initDB();

export default app;
