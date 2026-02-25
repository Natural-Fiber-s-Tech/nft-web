import React from "react";
import { useAuth } from "../../../hooks/useAuth";

export default function AdminLayout({ children, section, setSection }) {
    const { logout } = useAuth();

    return (
        <div className="container-app pt-24 pb-16">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2 bg-white/50 p-1 rounded-xl backdrop-blur-sm border">
                    <button
                        className={`px-4 py-2 rounded-lg transition-colors ${section === "services"
                                ? "bg-red-600 text-white shadow-lg"
                                : "hover:bg-gray-100 text-gray-600"
                            }`}
                        onClick={() => setSection("services")}
                    >
                        Servicios
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg transition-colors ${section === "products"
                                ? "bg-red-600 text-white shadow-lg"
                                : "hover:bg-gray-100 text-gray-600"
                            }`}
                        onClick={() => setSection("products")}
                    >
                        Productos
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg transition-colors ${section === "team"
                                ? "bg-red-600 text-white shadow-lg"
                                : "hover:bg-gray-100 text-gray-600"
                            }`}
                        onClick={() => setSection("team")}
                    >
                        Equipo
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg transition-colors ${section === "research"
                                ? "bg-red-600 text-white shadow-lg"
                                : "hover:bg-gray-100 text-gray-600"
                            }`}
                        onClick={() => setSection("research")}
                    >
                        Investigación
                    </button>
                </div>

                <button
                    className="px-4 py-2 border rounded-lg hover:bg-red-50 text-red-600 border-red-200 transition-colors"
                    onClick={() => logout()}
                >
                    Salir
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-6">
                {children}
            </div>
        </div>
    );
}
