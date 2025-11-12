import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse-fixed";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

/**
 * Extracts text from PDF, DOCX, XLSX, or TXT files.
 */
export async function extractTextFromFile(buffer, fileName) {
  const ext = path.extname(fileName).toLowerCase();

  switch (ext) {
    case ".pdf": {
      try {
        const parsed = await pdfParse(buffer);
        return parsed.text || "";
      } catch (err) {
        console.warn("⚠️ PDF parsing failed:", err.message);
        return buffer.toString("utf8");
      }
    }

    case ".docx": {
      try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value || "";
      } catch (err) {
        console.warn("⚠️ DOCX parsing failed:", err.message);
        return buffer.toString("utf8");
      }
    }

    case ".xlsx": {
      try {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        let text = "";
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
          text += `\nSheet: ${sheetName}\n${sheet}`;
        });
        return text;
      } catch (err) {
        console.warn("⚠️ XLSX parsing failed:", err.message);
        return buffer.toString("utf8");
      }
    }

    case ".txt": {
      return buffer.toString("utf8");
    }

    default:
      console.warn(`⚠️ Unsupported file type: ${ext}`);
      return buffer.toString("utf8");
  }
}
