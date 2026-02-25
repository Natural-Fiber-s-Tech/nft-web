/**
 * GET /api/research/list
 * Lista todos los artículos de investigación
 */

import fs from "fs/promises";
import path from "path";

const RESEARCH_JSON_PATH = path.join(
  process.cwd(),
  "public",
  "content",
  "research.json"
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    let data = [];

    try {
      const raw = await fs.readFile(RESEARCH_JSON_PATH, "utf8");
      const parsed = JSON.parse(raw);
      data = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.data)
        ? parsed.data
        : [];
    } catch (err) {
      // Si el archivo no existe, devolver array vacío
      if (err.code !== "ENOENT") {
        console.error("Error reading research.json:", err);
      }
      data = [];
    }

    return res.status(200).json({ ok: true, data });
  } catch (error) {
    console.error("Error in /api/research/list:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
