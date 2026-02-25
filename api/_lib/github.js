const fetch = require("node-fetch");

const GITHUB_API = "https://api.github.com";

function encodePathSegments(p) {
  return String(p)
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

async function getContentShaAndText(path) {
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const token = process.env.GITHUB_TOKEN;
  const encPath = encodePathSegments(path);
  const url = `${GITHUB_API}/repos/${repo}/contents/${encPath}?ref=${branch}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "vercel-fn",
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub get content failed: ${res.status} ${txt}`);
  }
  const json = await res.json();
  const sha = json.sha;
  const content = Buffer.from(json.content || "", "base64").toString("utf8");
  return { sha, content };
}

async function putContent(path, message, text, sha) {
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const token = process.env.GITHUB_TOKEN;
  const encPath = encodePathSegments(path);
  const url = `${GITHUB_API}/repos/${repo}/contents/${encPath}`;
  const body = {
    message,
    content: Buffer.from(text, "utf8").toString("base64"),
    branch,
    sha,
  };
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "vercel-fn",
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub put content failed: ${res.status} ${txt}`);
  }
  return await res.json();
}

async function putBinaryContent(path, message, buffer, sha) {
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const token = process.env.GITHUB_TOKEN;
  const encPath = encodePathSegments(path);
  const url = `${GITHUB_API}/repos/${repo}/contents/${encPath}`;
  const body = {
    message,
    content: Buffer.isBuffer(buffer)
      ? buffer.toString("base64")
      : Buffer.from(buffer || "", "binary").toString("base64"),
    branch,
    sha,
  };
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "vercel-fn",
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub put content failed: ${res.status} ${txt}`);
  }
  return await res.json();
}

module.exports = { getContentShaAndText, putContent, putBinaryContent };
