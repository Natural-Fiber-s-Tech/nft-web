import { useState, useEffect } from "react";
import { fetchJson } from "../lib/api";

/**
 * 🔐 useAuth: Hook that checks if the user is authenticated.
 *
 * Refactored action-based system:
 * - GET /api/auth?action=me
 */
export function useAuth() {
    const [auth, setAuth] = useState({ loading: true, ok: false });
    useEffect(() => {
        (async () => {
            try {
                const d = await fetchJson("/api/auth?action=me");
                setAuth({ loading: false, ok: !!d.authenticated });
            } catch {
                setAuth({ loading: false, ok: false });
            }
        })();
    }, []);

    async function login(username, password) {
        try {
            const payload = {
                action: "login",
                username: (username || "").trim(),
                password: (password || "").trim(),
            };
            const d = await fetchJson("/api/auth", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (d?.ok) {
                window.location.reload();
                return { success: true };
            } else {
                return { success: false, error: "Credenciales inválidas" };
            }
        } catch (err) {
            const msg = String(err?.message || err);
            if (msg.includes("404")) {
                return {
                    success: false,
                    error:
                        "API no disponible (404). ¿Iniciaste `vercel dev` en el puerto 3000?",
                };
            }
            return { success: false, error: "No se pudo iniciar sesión: " + msg };
        }
    }

    async function logout() {
        try {
            await fetchJson("/api/auth", {
                method: "POST",
                body: JSON.stringify({ action: "logout" }),
            });
        } catch (err) {
            console.warn("Logout API error:", err);
        } finally {
            window.location.reload();
        }
    }

    return { ...auth, login, logout };
}
