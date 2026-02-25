const { requireAuth } = require("./_lib/auth");
const { getContentShaAndText, putBinaryContent } = require("./_lib/github");
const fetch = require("node-fetch");

// Read raw body robustly (supports environments that pre-parse req.body)
async function readRawBody(req, contentType) {
  // Some runtimes expose req.rawBody for webhooks/multipart
  if (req.rawBody && Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (req.body != null) {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === "string") return Buffer.from(req.body, "utf8");
    // If multipart and body is object, do NOT stringify (it loses binary)
    if ((contentType || "").startsWith("multipart/")) {
      // Fallback to stream read below
    } else {
      try {
        // If it's already an object (JSON parsed), re-stringify
        return Buffer.from(JSON.stringify(req.body), "utf8");
      } catch {}
    }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (!requireAuth(req, res)) return;
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: "method_not_allowed" }));
  }
  try {
    const contentType = (req.headers["content-type"] || "").toLowerCase();
    const raw = await readRawBody(req, contentType);
    const dbg0 = { ct: contentType, raw: raw?.length || 0 };
    try {
      console.log("[upload] start", dbg0);
    } catch {}
    let targetPath = "public/uploads/";
    let filename = `file-${Date.now()}`;
    let fileBuffer = null;

    if (contentType.startsWith("application/json")) {
      // JSON payload supports:
      // - { name, data(base64), path }
      // - { name?, url, path }  // server-side fetch (avoids browser CORS)
      let parsed = {};
      try {
        parsed = JSON.parse(raw.toString("utf8"));
      } catch {
        parsed = typeof req.body === "object" && req.body ? req.body : {};
      }
      try {
        console.log("[upload] json keys", Object.keys(parsed || {}));
      } catch {}
      const name = (parsed?.name || filename).toString();
      let p = (parsed?.path || targetPath).toString();
      const base64 = (parsed?.data || "").toString();
      const remoteUrl = (parsed?.url || "").toString();
      // sanitize path
      p = p.trim().replace(/^\/+/, "");
      if (!p.startsWith("public/")) p = "public/" + p;
      targetPath = p;
      if (base64) {
        // base64 data branch
        filename = name.replace(/[^a-zA-Z0-9._-]/g, "-");
        try {
          fileBuffer = Buffer.from(base64, "base64");
        } catch {
          res.statusCode = 400;
          return res.end(
            JSON.stringify({ ok: false, error: "invalid_base64" })
          );
        }
      } else if (remoteUrl) {
        // server-side fetch branch
        try {
          const resp = await fetch(remoteUrl);
          if (!resp.ok) {
            res.statusCode = 400;
            try {
              console.log("[upload] fetch_failed", remoteUrl, resp.status);
            } catch {}
            res.setHeader("X-Upload-Debug", `fetch_failed:${resp.status}`);
            return res.end(
              JSON.stringify({
                ok: false,
                error: "fetch_failed",
                status: resp.status,
              })
            );
          }
          const buf = await resp.buffer();
          fileBuffer = buf;
          // determine filename
          if (parsed?.name) {
            filename = name.replace(/[^a-zA-Z0-9._-]/g, "-");
          } else {
            try {
              const u = new URL(remoteUrl);
              const base =
                u.pathname.split("/").filter(Boolean).pop() || filename;
              filename = base.replace(/[^a-zA-Z0-9._-]/g, "-");
            } catch {
              filename = name.replace(/[^a-zA-Z0-9._-]/g, "-");
            }
          }
        } catch (err) {
          res.statusCode = 400;
          try {
            console.log("[upload] fetch_error", err?.message || err);
          } catch {}
          res.setHeader("X-Upload-Debug", "fetch_error");
          return res.end(JSON.stringify({ ok: false, error: "fetch_error" }));
        }
      } else {
        res.statusCode = 400;
        try {
          console.log("[upload] json_no_file");
        } catch {}
        res.setHeader("X-Upload-Debug", "json_no_file");
        return res.end(JSON.stringify({ ok: false, error: "no_file" }));
      }
    } else if (contentType.startsWith("multipart/form-data")) {
      // naive multipart parser
      const boundary = contentType.split("boundary=")[1];
      const buffer = raw;
      const parts = buffer.toString("binary").split(`--${boundary}`);
      try {
        console.log("[upload] multipart parts", parts.length);
      } catch {}
      for (const part of parts) {
        if (!part || part === "--\r\n") continue;
        const [rawHeaders, rawBody] = part.split("\r\n\r\n");
        if (!rawHeaders || !rawBody) continue;
        const headers = rawHeaders.toString();
        if (headers.includes('name="path"')) {
          const val = rawBody.split("\r\n")[0];
          if (val) {
            let p = String(val).trim().replace(/^\/+/, "");
            if (!p.startsWith("public/")) p = "public/" + p;
            targetPath = p;
          }
        }
        if (headers.includes('name="file"')) {
          const m = headers.match(/filename="([^"]+)"/);
          if (m) filename = m[1];
          const bodyBin = Buffer.from(rawBody, "binary");
          fileBuffer = bodyBin.slice(0, Math.max(0, bodyBin.length - 2));
        }
      }
      if (!fileBuffer) {
        res.statusCode = 400;
        try {
          console.log("[upload] multipart_no_file");
        } catch {}
        res.setHeader("X-Upload-Debug", "multipart_no_file");
        return res.end(JSON.stringify({ ok: false, error: "no_file" }));
      }
    } else {
      res.statusCode = 400;
      try {
        console.log("[upload] invalid_content_type", contentType);
      } catch {}
      res.setHeader("X-Upload-Debug", "invalid_content_type");
      return res.end(
        JSON.stringify({ ok: false, error: "invalid_content_type" })
      );
    }
    // Compose GitHub path under public/
    const fullPath = `${targetPath}${
      targetPath.endsWith("/") ? "" : "/"
    }${filename}`.replace(/^\/+/, "");
    // Try to get sha (if the file exists) to allow overwrite
    let sha = undefined;
    try {
      const stat = await getContentShaAndText(fullPath);
      sha = stat.sha;
    } catch {}
    await putBinaryContent(
      fullPath,
      `chore(upload): ${fullPath}`,
      fileBuffer,
      sha
    );
    const url = `/${fullPath.replace(/^public\//, "")}`;
    res.setHeader("X-Upload-Debug", "ok");
    res.end(JSON.stringify({ ok: true, path: fullPath, url }));
  } catch (e) {
    res.statusCode = 500;
    try {
      console.log("[upload] exception", e?.message || e);
    } catch {}
    res.setHeader("X-Upload-Debug", "exception");
    res.end(JSON.stringify({ ok: false, error: "upload_failed" }));
  }
};
