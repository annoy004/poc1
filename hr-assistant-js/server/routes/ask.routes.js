import express from "express";
import { handleQuery } from "../controllers/ask.controller.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Missing question" });

    const answer = await handleQuery(question);
    res.json({ answer });
  } catch (err) {
    console.error("Ask error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
