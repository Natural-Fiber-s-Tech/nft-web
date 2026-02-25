/**
 * POST /api/research/save
 * Guarda todos los artículos de investigación
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
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { data, message = "update research" } = req.body;

    if (!Array.isArray(data)) {
      return res
        .status(400)
        .json({ ok: false, error: "data must be an array" });
    }

    // Asegurar que el directorio existe
    const dir = path.dirname(RESEARCH_JSON_PATH);
    await fs.mkdir(dir, { recursive: true });

    // Guardar en formato legible
    await fs.writeFile(
      RESEARCH_JSON_PATH,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    console.log(`✅ Research saved: ${data.length} articles - ${message}`);

    return res
      .status(200)
      .json({ ok: true, message: "Research articles saved successfully" });
  } catch (error) {
    console.error("Error in /api/research/save:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
