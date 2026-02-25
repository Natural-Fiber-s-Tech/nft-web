const {
  signToken,
  setAuthCookie,
  clearAuthCookie,
  verifyTokenFromCookie,
} = require("./_lib/auth");

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

  // Normalizar path tal como llega en la petición original
  const fullUrl = req.url || "";
  // req.url may include query string
  const pathname = (() => {
    try {
      return new URL(fullUrl, "http://localhost").pathname;
    } catch {
      return String(fullUrl).split("?")[0];
    }
  })();

  // Decide action based on path and method
  try {
    // ✅ NUEVO: Sistema action-based para /api/auth
    // En lugar de múltiples rutas (/api/auth/login, /api/auth/logout, etc.)
    // ahora usamos una sola ruta /api/auth con un campo "action" en el body
    if (pathname.endsWith("/api/auth") && req.method === "POST") {
      const parsed = await readParsedBody(req);
      const action = (parsed?.action || "").trim();

      // 🔐 LOGIN: Valida credenciales y crea cookie de sesión
      if (action === "login") {
        const username = (parsed?.username || "").trim();
        const password = (parsed?.password || "").trim();

        // Verificar que las variables de entorno existan
        if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
          res.statusCode = 500;
          return res.end(
            JSON.stringify({
              ok: false,
              error: "missing_env_admin_credentials",
            })
          );
        }
        if (!process.env.JWT_SECRET) {
          res.statusCode = 500;
          return res.end(
            JSON.stringify({ ok: false, error: "missing_env_jwt_secret" })
          );
        }

        // Comparar credenciales con las almacenadas en .env
        const envUser = (process.env.ADMIN_USERNAME || "").trim();
        const envPass = (process.env.ADMIN_PASSWORD || "").trim();
        const okUser = username === envUser;
        const okPass = password === envPass;

        if (!okUser || !okPass) {
          res.statusCode = 401;
          return res.end(
            JSON.stringify({ ok: false, error: "invalid_credentials" })
          );
        }

        // ✅ Credenciales válidas: crear token JWT y cookie
        const token = signToken({ u: username });
        setAuthCookie(res, token);
        return res.end(JSON.stringify({ ok: true }));
      }

      // 🚪 LOGOUT: Elimina la cookie de sesión
      // Nota: Usa POST (no GET) porque cambia el estado del servidor
      if (action === "logout") {
        clearAuthCookie(res);
        return res.end(JSON.stringify({ ok: true }));
      }

      // ❌ Action no reconocido para POST
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: "invalid_action" }));
    }

    // ✅ NUEVO: Verificación de sesión con GET (operación de solo lectura)
    // GET /api/auth?action=me
    // Ventaja: usa query params porque GET no tiene body
    if (pathname.endsWith("/api/auth") && req.method === "GET") {
      const url = new URL(req.url, "http://localhost");
      const action = url.searchParams.get("action");

      // 🔍 ME: Verifica si hay una sesión activa (cookie válida)
      if (action === "me") {
        const user = verifyTokenFromCookie(req);
        if (!user) {
          return res.end(JSON.stringify({ authenticated: false }));
        }
        return res.end(
          JSON.stringify({ authenticated: true, user: { name: user.u } })
        );
      }

      // ❌ Action no reconocido para GET
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: "invalid_action" }));
    }

    // ✅ Todas las rutas legacy eliminadas - ahora solo usamos action-based
    // Si llegamos aquí, la ruta o método no está permitido
    res.statusCode = 404;
    return res.end(JSON.stringify({ ok: false, error: "not_found" }));
  } catch (err) {
    console.error("[api/auth] error", err?.message || err);
    res.statusCode = 500;
    return res.end(JSON.stringify({ ok: false, error: "server_error" }));
  }
};
