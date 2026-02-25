const { requireAuth } = require("../_lib/auth");
const { getContentShaAndText } = require("../_lib/github");

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (!requireAuth(req, res)) return;
  try {
    const path = process.env.TEAM_PATH || "public/content/team.json";
    const { content, sha } = await getContentShaAndText(path);
    res.end(
      JSON.stringify({ ok: true, sha, data: JSON.parse(content || "[]") })
    );
  } catch (e) {
    try {
      console.error("[api/team/list]", e?.message || e);
    } catch {}
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: "read_failed" }));
  }
};
