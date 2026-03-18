import React, { useState } from "react";
import { FileText, Image as ImageIcon, Search, ChevronDown, ListChecks } from "lucide-react";
import { icons } from "lucide-react";

const SPANISH_KEYWORDS = {
    usuario: ["user", "person", "account", "profile"],
    archivo: ["file", "document", "folder"],
    configuracion: ["setting", "gear", "cog", "slider"],
    escudo: ["shield", "security", "protect"],
    seguridad: ["shield", "lock", "key"],
    caja: ["box", "package", "cube"],
    tiempo: ["clock", "time", "timer", "watch"],
    estrella: ["star", "award", "medal"],
    corazon: ["heart"],
    grafico: ["chart", "graph", "trend", "activity"],
    herramienta: ["tool", "wrench", "hammer"],
    correo: ["mail", "envelope", "send"],
    mensaje: ["message", "chat", "send"],
    foto: ["image", "photo", "camera", "picture"],
    video: ["video", "camera", "film", "youtube"],
    pantalla: ["monitor", "screen", "display", "tv"],
    computadora: ["computer", "laptop", "pc"],
    teclado: ["keyboard"],
    raton: ["mouse"],
    nube: ["cloud", "upload", "download"],
    telefono: ["phone", "call", "smartphone", "mobile"],
    fuego: ["fire", "flame", "hot"],
    agua: ["droplet", "water", "liquid", "wet"],
    sol: ["sun", "light", "day"],
    luna: ["moon", "dark", "night"],
    mundo: ["globe", "world", "earth"],
    mapa: ["map", "location", "pin", "navigation"],
    ojo: ["eye", "view", "watch", "see"],
    basura: ["trash", "delete", "remove", "bin"],
    Lapiz: ["pencil", "edit", "write", "pen"],
    medida: ["ruler", "measure", "scale", "size"],
    peso: ["weight", "scale", "heavy"],
    precisión: ["microscope", "target", "focus", "crosshair"],
    precision: ["microscope", "target", "focus", "crosshair"],
    sistema: ["cpu", "memory", "chip", "network", "server"],
    flecha: ["arrow", "chevron", "direction", "pointer"]
};

const FeatureIconPicker = ({ value, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");

    // limit to 50 icons to avoid UI freezing
    const iconNames = Object.keys(icons).filter(name => {
        if (!/^[A-Z]/.test(name)) return false;

        const searchLower = search.toLowerCase();
        if (!searchLower) return true;

        if (name.toLowerCase().includes(searchLower)) return true;

        for (const [esKey, enWords] of Object.entries(SPANISH_KEYWORDS)) {
            if (esKey.includes(searchLower)) {
                if (enWords.some(enWord => name.toLowerCase().includes(enWord))) {
                    return true;
                }
            }
        }
        return false;
    }).slice(0, 50);

    const CurrentIcon = icons[value] || icons.Settings;

    return (
        <div className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#e83d38] h-[38px]"
            >
                <div className="flex items-center gap-2 truncate">
                    <CurrentIcon className="w-4 h-4 text-gray-600 shrink-0" />
                    <span className="truncate">{value || "Seleccionar..."}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
            </button>

            {isOpen && !disabled && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden p-2 left-0">
                        <div className="relative mb-2">
                            <Search className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
                            <input
                                autoFocus
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#e83d38]"
                                placeholder="Buscar ícono (ej. shield)"
                            />
                        </div>
                        <div className="grid grid-cols-5 gap-1 max-h-48 overflow-y-auto p-1">
                            {iconNames.map(name => {
                                const IconItem = icons[name];
                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => {
                                            onChange(name);
                                            setIsOpen(false);
                                            setSearch("");
                                        }}
                                        className={`p-2 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors ${value === name ? 'bg-red-50 text-[#e83d38]' : 'text-gray-600'} `}
                                        title={name}
                                    >
                                        <IconItem className="w-5 h-5" />
                                    </button>
                                );
                            })}
                        </div>
                        {iconNames.length === 0 && (
                            <div className="text-center py-4 text-xs text-gray-500">
                                No se encontraron íconos
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default function ServiceFormComponent({
    tab = "es",
    local,
    updateLangField,
    updateField,
    readOnly = false,
    invalid = {}
}) {
    const isES = tab === "es";

    const getLangVal = (key) => local[key]?.[tab] || "";
    const setLangVal = (key, val) => updateLangField(key, val);

    const getFeatures = () => local.features?.[tab] || [];
    const handleFeatureChange = (index, value) => {
        const updated = [...getFeatures()];
        updated[index] = value;
        setLangVal("features", updated);
    };
    const addFeature = () => {
        setLangVal("features", [...getFeatures(), ""]);
    };
    const removeFeature = (index) => {
        const updated = [...getFeatures()];
        updated.splice(index, 1);
        setLangVal("features", updated);
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 pb-48">
            {/* Información General */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-500" />
                        Información General ({tab.toUpperCase()})
                    </h3>
                </div>

                <div className="p-6 space-y-6">
                    {/* Título */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Título del Servicio *</label>
                        <input
                            disabled={readOnly}
                            value={getLangVal("title") || ""}
                            onChange={(e) => setLangVal("title", e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow ${invalid.title && isES ? "border-red-400 focus:ring-red-400" : "border-gray-300"
                                }`}
                            placeholder="Ej. Consultoría Especializada..."
                        />
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Descripción *</label>
                        <textarea
                            disabled={readOnly}
                            value={getLangVal("description") || ""}
                            onChange={(e) => setLangVal("description", e.target.value)}
                            rows={4}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow resize-y ${invalid.description && isES ? "border-red-400 focus:ring-red-400" : "border-gray-300"
                                }`}
                            placeholder="Descripción del servicio..."
                        />
                    </div>
                </div>
            </div>

            {/* Características */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-gray-500" />
                        Características Principales ({tab.toUpperCase()})
                    </h3>
                    {!readOnly && (
                        <button
                            type="button"
                            onClick={addFeature}
                            className="text-sm text-[#e83d38] hover:bg-red-50 px-3 py-1.5 rounded-lg border border-[#e83d38] font-medium transition-colors"
                        >
                            + Añadir
                        </button>
                    )}
                </div>

                <div className="p-6 space-y-4">
                    {getFeatures().map((val, index) => (
                        <div key={index} className="flex gap-3 items-start bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <span className="w-6 h-6 rounded-full bg-white text-gray-500 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm border border-gray-200">
                                {index + 1}
                            </span>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <input
                                        disabled={readOnly}
                                        value={val}
                                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#e83d38] focus:border-transparent"
                                        placeholder={`Característica ${index + 1}`}
                                    />
                                </div>
                            </div>
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={() => removeFeature(index)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                                    title="Eliminar característica"
                                >
                                    <icons.Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                    {getFeatures().length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No hay características añadidas.{!readOnly && " Añade una para mejorar la presentación del servicio."}
                        </div>
                    )}
                </div>
            </div>

            {/* Configuración Global */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-gray-500" />
                        Configuración Global
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Estos campos se aplican a ambos idiomas.</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Ícono Global */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Ícono del Servicio *</label>
                            <FeatureIconPicker
                                disabled={readOnly}
                                value={local.icon || "Settings"}
                                onChange={(name) => updateField("icon", name)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
