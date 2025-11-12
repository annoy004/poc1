import fetch from "node-fetch";
import { pgClient } from "../config/db.js";
import dotenv from "dotenv";
import { extractTextFromFile } from "../utils/extractText.js";
dotenv.config();

const canonicalMap = {
  penalty: ["penalty", "general_penalty", "late_attendance_penalty"],
  bonus_percentage: ["bonus", "bonus_percentage", "annual_bonus"],
  leave_days: ["leave_days", "annual_leave_days", "paid_leave_days"],
  maternity_leave_weeks: ["maternity_leave_weeks", "maternity_leave_days"],
  paternity_leave_days: ["paternity_leave_days", "paternity_leave_weeks"],
  sick_leave_days: ["sick_leave", "sick_leave_days"],
  raise_average: ["raise_average", "average_raise"],
  raise_good: ["raise_good", "good_raise"],
  raise_excellent: ["raise_excellent", "excellent_raise"],
};

/* 🧠 Normalize keys to canonical form */
function normalizeKey(rawKey) {
  const cleanKey = rawKey.toLowerCase().trim();
  for (const [canonical, variants] of Object.entries(canonicalMap)) {
    if (variants.includes(cleanKey)) return canonical;
  }
  return cleanKey;
}

/* 🧱 Ensure DB schema supports canonical_key and unique constraint */
async function ensureColumnExists() {
  await pgClient.query(`
    DO $$
    BEGIN
     
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'facts' AND column_name = 'canonical_key'
      ) THEN
        ALTER TABLE facts ADD COLUMN canonical_key TEXT;
      END IF;


      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'facts_canonical_key_unique'
      ) THEN
        ALTER TABLE facts ADD CONSTRAINT facts_canonical_key_unique UNIQUE (canonical_key);
      END IF;
    END
    $$;
  `);
}

export async function handleUpload(fileBuffer, fileName) {
  await ensureColumnExists();

  const text = await extractTextFromFile(fileBuffer, fileName);
  if (!text.trim()) {
    console.warn("⚠️ No text extracted from file");
    return { updated: 0 };
  }

  console.log(`📄 Extracted text from ${fileName}:`, text.slice(0, 200));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: `
Extract HR-related data as JSON key-value pairs.
Example: {"penalty": 3000, "leave_days": 15, "bonus_percentage": 10}

Text:
"""${text}"""
            `,
          },
        ],
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  let jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";

  jsonText = jsonText.replace(/```json|```/g, "").trim();

  
  let facts;
  try {
    facts = JSON.parse(jsonText);
  } catch {
    console.error("❌ Invalid JSON from Gemini:", jsonText);
    return { updated: 0 };
  }

  /* 4️⃣ Store/Update normalized facts in PostgreSQL */
  for (const [key, value] of Object.entries(facts)) {
    const canonicalKey = normalizeKey(key);
    await pgClient.query(
      `
      INSERT INTO facts (key, canonical_key, value, source_doc)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (canonical_key) DO UPDATE
      SET value = EXCLUDED.value,
          source_doc = EXCLUDED.source_doc,
          last_updated = CURRENT_TIMESTAMP
      `,
      [key, canonicalKey, String(value), fileName]
    );
  }

  console.log(`✅ Updated ${Object.keys(facts).length} facts from ${fileName}`);
  return { updated: Object.keys(facts).length };
}
