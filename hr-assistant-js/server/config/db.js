import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing from .env file");
  process.exit(1);
}

// ✅ Auto SSL detection
const useSSL = !process.env.DATABASE_URL.includes("-pooler");

export const pgClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

export async function initDB() {
  try {
    await pgClient.connect();
    console.log("✅ Connected to PostgreSQL");

    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS facts (
        key TEXT PRIMARY KEY,
        value TEXT,
        source_doc TEXT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Database initialized successfully");
  } catch (err) {
    console.error("❌ Database init failed:", err.message);
  }
}
