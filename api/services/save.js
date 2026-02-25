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
    const path = process.env.SERVICES_PATH || "public/content/services.json";
    if (!Array.isArray(data)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: "invalid_payload" }));
    }
    // ensure we have current sha
    const { sha } = await getContentShaAndText(path);
    await putContent(
      path,
      message || "chore(admin): update services.json",
      JSON.stringify(data, null, 2),
      sha
    );
    res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: "write_failed" }));
  }
};
