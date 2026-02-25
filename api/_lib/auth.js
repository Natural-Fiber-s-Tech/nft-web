const jwt = require("jsonwebtoken");

const COOKIE_NAME = "admin_token";

function signToken(payload, expiresInSeconds = 60 * 60 * 2) {
  const secret = process.env.JWT_SECRET;
  return jwt.sign(payload, secret, { expiresIn: expiresInSeconds });
}

function parseCookie(req) {
  const cookie = req.headers.cookie || "";
  const part = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(COOKIE_NAME + "="));
  if (!part) return null;
  return decodeURIComponent(part.split("=")[1] || "");
}

function verifyTokenFromCookie(req) {
  const token = parseCookie(req);
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function setAuthCookie(res, token, maxAgeSeconds = 60 * 60 * 2) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAgeSeconds}`,
  ];
  const secure = String(process.env.COOKIE_SECURE ?? "true") !== "false";
  if (secure) parts.push(`Secure`);
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearAuthCookie(res) {
  const parts = [
    `${COOKIE_NAME}=`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=0`,
  ];
  const secure = String(process.env.COOKIE_SECURE ?? "true") !== "false";
  if (secure) parts.push(`Secure`);
  res.setHeader("Set-Cookie", parts.join("; "));
}

function requireAuth(req, res) {
  const user = verifyTokenFromCookie(req);
  if (!user) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "unauthorized" }));
    return null;
  }
  return user;
}

module.exports = {
  signToken,
  verifyTokenFromCookie,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
};
