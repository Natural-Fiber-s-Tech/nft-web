const { requireAuth } = require("../_lib/auth");
const { getContentShaAndText, putContent } = require("../_lib/github");

async function readParsedBody(req) {
  try {
    if (req.body != null) {
      if (typeof req.body === "string") {
        try {
          return JSON.parse(req.body);
        } catch {
          return {};
        }
      }
      if (typeof req.body === "object") return req.body;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8");
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  } catch {
    return {};
  }
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (!requireAuth(req, res)) return;
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: "method_not_allowed" }));
  }
  try {
    const parsed = await readParsedBody(req);
    const { data, message } = parsed;
    const path = process.env.TEAM_PATH || "public/content/team.json";
    if (!Array.isArray(data)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: "invalid_payload" }));
    }
    if (data.length === 0) {
      console.warn("[team/save] Warning: Attempting to save empty array");
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: "empty_data" }));
    }
    const { sha } = await getContentShaAndText(path);
    await putContent(
      path,
      message || "chore(admin): update team.json",
      JSON.stringify(data, null, 2),
      sha
    );
    res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    console.error("[team/save] Error:", e);
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: "write_failed" }));
  }
};
