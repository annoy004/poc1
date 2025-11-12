import fetch from "node-fetch";
import { pgClient } from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

export async function handleQuery(question) {
  const { rows } = await pgClient.query("SELECT key, value FROM facts");
  const facts = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: `
You are an HR assistant.
Use only the following facts to answer clearly and concisely.

Facts:
${JSON.stringify(facts, null, 2)}

Question: ${question}
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
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No answer generated.";
}
