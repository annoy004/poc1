import express from "express";
import multer from "multer";
import { handleUpload } from "../controllers/upload.controller.js"; // ✅ fixed

const router = express.Router();
const upload = multer(); // uses memory storage

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const result = await handleUpload(req.file.buffer, req.file.originalname);
    res.json(result);
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

