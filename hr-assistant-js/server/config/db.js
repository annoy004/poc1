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

    // --- Existing facts table ---
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS facts (
        key TEXT PRIMARY KEY,
        value TEXT,
        source_doc TEXT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // --- NEW hr_docs table ---
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS hr_docs (
        id UUID PRIMARY KEY,
        file_name TEXT NOT NULL,
        file_url TEXT,
        status TEXT NOT NULL DEFAULT 'processing',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("✅ All tables initialized successfully");
  } catch (err) {
    console.error("❌ Database init failed:", err.message);
  }
}
