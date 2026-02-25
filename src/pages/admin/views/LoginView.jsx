import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";

export default function LoginView() {
    const [form, setForm] = useState({ username: "", password: "" });
    const [showPass, setShowPass] = useState(false);
    const auth = useAuth();
    const [loading, setLoading] = useState(false);

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        const res = await auth.login(form.username, form.password);
        if (!res.success) {
            alert(res.error);
            setLoading(false);
        }
        // If success, window reloads, so no need to setLoading(false)
    }

    return (
        <div className="container-app pt-24 pb-16">
            <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
            <form
                onSubmit={handleLogin}
                className="max-w-sm space-y-3 bg-white p-6 rounded-xl shadow"
            >
                <input
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Usuario"
                    value={form.username}
                    onChange={(e) =>
                        setForm((f) => ({ ...f, username: e.target.value }))
                    }
                />
                <div className="relative">
                    <input
                        className="w-full border px-3 py-2 rounded pr-10"
                        placeholder="Contraseña"
                        type={showPass ? "text" : "password"}
                        value={form.password}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, password: e.target.value }))
                        }
                    />
                    <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                        onClick={() => setShowPass((v) => !v)}
                        aria-label={showPass ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                        {showPass ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                </div>
                <button
                    className="btn-cta px-4 py-2 w-full disabled:opacity-50"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Entrando..." : "Entrar"}
                </button>
            </form>
        </div>
    );
}
