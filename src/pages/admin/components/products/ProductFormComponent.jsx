import React, { useState } from "react";
import { Upload, FileText, Image as ImageIcon, Video, Plus, Trash2, ListChecks, Search, ChevronDown } from "lucide-react";
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

        // Direct match
        if (name.toLowerCase().includes(searchLower)) return true;

        // Spanish keyword match
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
                                        className={`p - 2 flex items - center justify - center rounded - md hover: bg - gray - 100 transition - colors ${value === name ? 'bg-red-50 text-[#e83d38]' : 'text-gray-600'} `}
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

export default function ProductFormComponent({
    tab = "es",
    local,
    setLocal,
    updateFlatField,
    updateRawField,
    onPick,
    onDrop,
    readOnly = false,
    invalid = {},
    uploading,
}) {
    const isES = tab === "es";

    // Helpers globales para hacer binding a los campos con sufijos (name_es, description_en)
    const getVal = (field) => local[`${field}_${tab}`] || "";
    const setVal = (field, val) => updateFlatField(field, val);

    // Helpers para arrary de features
    const getFeatures = () => local.main_features || [];

    const handleFeatureChange = (index, field, value) => {
        const updated = [...getFeatures()];
        updated[index][`${field}_${tab}`] = value;
        updateRawField("main_features", updated);
    };

    const handleFeatureIconChange = (index, iconId) => {
        const updated = [...getFeatures()];
        updated[index].icon = iconId;
        updateRawField("main_features", updated);
    };

    const addFeature = () => {
        const newFeature = {
            id: "feat-" + Math.random().toString(36).substr(2, 6),
            icon: "Settings",
            title_es: "", title_en: "",
            preview_es: "", preview_en: "",
            description_es: "", description_en: "",
        };
        updateRawField("main_features", [...getFeatures(), newFeature]);
    };

    const removeFeature = (index) => {
        const updated = [...getFeatures()];
        updated.splice(index, 1);
        updateRawField("main_features", updated);
    };

    // Helpers para arrary de capabilities (multi-idioma)
    const getCapabilities = () => local[`capabilities_${tab}`] || [];

    const handleCapabilityChange = (index, value) => {
        const updated = [...getCapabilities()];
        updated[index] = value;
        updateRawField(`capabilities_${tab}`, updated);
    };

    const addCapability = () => {
        updateRawField(`capabilities_${tab}`, [...getCapabilities(), ""]);
    };

    const removeCapability = (index) => {
        const updated = [...getCapabilities()];
        updated.splice(index, 1);
        updateRawField(`capabilities_${tab}`, updated);
    };

    // Helpers para Especificaciones Técnicas (lista de key/value multi-idioma)
    const getSpecifications = () => local.specifications_list || [];

    const handleSpecChange = (index, field, value) => {
        const updated = [...getSpecifications()];
        updated[index][`${field}_${tab}`] = value;
        updateRawField("specifications_list", updated);
    };

    const addSpecification = () => {
        const newSpec = {
            id: "spec-" + Math.random().toString(36).substr(2, 6),
            key_es: "", key_en: "",
            value_es: "", value_en: "",
        };
        updateRawField("specifications_list", [...getSpecifications(), newSpec]);
    };

    const removeSpecification = (index) => {
        const updated = [...getSpecifications()];
        updated.splice(index, 1);
        updateRawField("specifications_list", updated);
    };

    const removeGalleryImage = (index) => {
        const updated = [...(local.gallery || [])];
        updated.splice(index, 1);
        updateRawField("gallery", updated);
    };

    const addGalleryUrl = () => {
        const url = window.prompt("Introduce la URL de la imagen secundaria:");
        if (url) {
            updateRawField("gallery", [...(local.gallery || []), url]);
        }
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
                    {/* Nombre y Tag */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nombre del Producto *</label>
                            <input
                                disabled={readOnly}
                                value={getVal("name") || ""}
                                onChange={(e) => setVal("name", e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow ${invalid.name_es && isES ? "border-red-400 focus:ring-red-400" : "border-gray-300"
                                    }`}
                                placeholder="Ej. Máquina de Tejer Circular..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Etiqueta / Categoría *</label>
                            <input
                                disabled={readOnly}
                                value={getVal("tag") || ""}
                                onChange={(e) => setVal("tag", e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow ${invalid.tag_es && isES ? "border-red-400 focus:ring-red-400" : "border-gray-300"
                                    }`}
                                placeholder="Ej. Novedad, Tejido de Punto, Accesorios..."
                            />
                        </div>
                    </div>

                    {/* Subtitulo */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Subtitulo *</label>
                        <textarea
                            disabled={readOnly}
                            value={getVal("subtitle") || ""}
                            onChange={(e) => setVal("subtitle", e.target.value)}
                            rows={1}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow resize-y ${invalid.subtitle_es && isES ? "border-red-400 focus:ring-red-400" : "border-gray-300"
                                }`}
                            placeholder="Subtitulo del producto..."
                        />
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Descripción *</label>
                        <textarea
                            disabled={readOnly}
                            value={getVal("description") || ""}
                            onChange={(e) => setVal("description", e.target.value)}
                            rows={4}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow resize-y ${invalid.desc_es && isES ? "border-red-400 focus:ring-red-400" : "border-gray-300"
                                }`}
                            placeholder="Descripción principal del producto..."
                        />
                    </div>
                </div>
            </div>

            {/* Multimedia (Independiente del idioma) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-gray-500" />
                        Multimedia (Global)
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Estos campos se aplican a todos los idiomas.</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Foto Principal */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700">Imagen Principal *</label>
                            <div
                                className={`border - 2 ${invalid.image ? 'border-red-300 bg-red-50' : 'border-dashed border-gray-300'} rounded - xl p - 4 text - center cursor - pointer hover: bg - gray - 50 transition - colors relative overflow - hidden group`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => !readOnly && onDrop("image", e)}
                                onClick={() => !readOnly && onPick("image")}
                            >
                                {local.photos ? (
                                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-100">
                                        <img
                                            src={local.photos}
                                            alt="Producto"
                                            className="w-full h-full object-contain"
                                        />
                                        {!readOnly && (
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white font-medium flex items-center gap-2">
                                                    <Upload className="w-4 h-4" /> Cambiar Imagen
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-8 flex flex-col items-center justify-center opacity-70">
                                        <Upload className="w-8 h-8 text-gray-400 mb-3" />
                                        <span className="text-sm font-medium text-gray-600">Click o arrastra para subir imagen</span>
                                        <span className="text-xs text-gray-400 mt-1">JPG, PNG, WebP (Max 5MB)</span>
                                    </div>
                                )}
                                {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-sm font-medium text-blue-600">Subiendo...</div>}
                            </div>

                            <div className="flex gap-2 items-center text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                <span className="shrink-0 font-medium">URL:</span>
                                <input
                                    type="text"
                                    value={local.photos || ""}
                                    onChange={(e) => updateRawField('photos', e.target.value)}
                                    disabled={readOnly}
                                    className="bg-transparent border-none flex-1 outline-none truncate"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        {/* Video */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700">Video de Demostración (Opcional)</label>
                            <div className="space-y-3 relative group">
                                <input
                                    disabled={readOnly}
                                    value={local.video || ""}
                                    onChange={(e) => updateRawField("video", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow pl-10"
                                    placeholder="URL de YouTube (ej. https://youtube.com/watch...)"
                                />
                                <Video className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                            </div>
                            {local.video && local.video.includes('youtu') && (
                                <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                    <iframe
                                        src={local.video.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                        className="w-full h-full"
                                        title="Video Preview"
                                        allowFullScreen
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Galería de Imágenes Adicionales */}
                    <div className="pt-6 border-t border-gray-200 space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-sm font-medium text-gray-800">Galería de Imágenes Adicionales</h4>
                                <p className="text-xs text-gray-500 mt-1">Sube otras imágenes para acompañar el carrusel del producto.</p>
                            </div>
                            {!readOnly && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={addGalleryUrl}
                                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        + Añadir URL Manual
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onPick("gallery")}
                                        className="px-3 py-1.5 text-xs font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 flex items-center gap-1 transition-colors"
                                    >
                                        <Upload className="w-3 h-3" /> Subir Archivo
                                    </button>
                                </div>
                            )}
                        </div>

                        <div
                            className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => !readOnly && onDrop("gallery", e)}
                        >
                            {(local.gallery || []).map((url, i) => (
                                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                                    <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                    {!readOnly && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => removeGalleryImage(i)}
                                                className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {!readOnly && (local.gallery || []).length === 0 && (
                                <div className="col-span-full py-8 flex flex-col items-center justify-center opacity-70 cursor-pointer hover:opacity-100 transition-opacity" onClick={() => onPick("gallery")}>
                                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-500 font-medium">Arrastra imágenes aquí o haz clic para subir</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Ficha Técnica (Dependiente del idioma) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-500" />
                        Ficha Técnica / Datasheet ({tab.toUpperCase()})
                    </h3>
                </div>

                <div className="p-6">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">Archivo PDF Técnico (Opcional)</label>
                        <div className="flex gap-4 items-center">
                            <button
                                type="button"
                                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm font-medium text-gray-700 bg-white hover:bg-gray-50 inline-flex items-center gap-2 transition-colors disabled:opacity-50"
                                onClick={() => !readOnly && onPick(`datasheet-${tab}`)}
                                disabled={readOnly || uploading}
                            >
                                <Upload className="w-4 h-4" />
                                Subir PDF {tab.toUpperCase()}
                            </button>

                            <div
                                className="flex-1 flex px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => !readOnly && onDrop(`datasheet-${tab}`, e)}
                            >
                                <input
                                    disabled={readOnly}
                                    value={getVal("technical_sheet") || ""}
                                    onChange={(e) => setVal("technical_sheet", e.target.value)}
                                    className="w-full bg-transparent border-none text-sm outline-none font-mono text-gray-600"
                                    placeholder="Arrastra el PDF aquí o pega la URL..."
                                />
                            </div>
                        </div>

                        {getVal("technical_sheet") && (
                            <div className="pt-2">
                                <a
                                    href={getVal("technical_sheet")}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium w-fit"
                                >
                                    Ver Archivo PDF Actual
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Características Principales (Main Features) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center rounded-t-xl">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-gray-500" />
                        Características Principales (Main Features) - {tab.toUpperCase()}
                    </h3>
                    <button
                        type="button"
                        onClick={addFeature}
                        disabled={readOnly}
                        className="px-3 py-1.5 text-sm font-medium text-[#e83d38] bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Agregar Feature
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {getFeatures().length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            No hay características principales agregadas. Haz clic en "Agregar Feature".
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {getFeatures().map((feat, index) => {
                                const titleVal = feat[`title_${tab}`] ?? "";
                                const previewVal = feat[`preview_${tab}`] ?? "";
                                const descVal = feat[`description_${tab}`] ?? "";

                                return (
                                    <div key={feat.id || index} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 shadow-sm relative">
                                        {!readOnly && (
                                            <button
                                                type="button"
                                                onClick={() => removeFeature(index)}
                                                className="absolute top-3 right-3 text-red-400 hover:text-red-600 bg-white border border-red-100 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                                                title="Eliminar característica"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Icono + Título */}
                                            <div className="space-y-3">
                                                <div className="flex gap-3">
                                                    <div className="w-1/3">
                                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Icono</label>
                                                        <FeatureIconPicker
                                                            disabled={readOnly}
                                                            value={feat.icon || "Settings"}
                                                            onChange={(newIcon) => handleFeatureIconChange(index, newIcon)}
                                                        />
                                                    </div>
                                                    <div className="w-2/3">
                                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Título ({tab}) *</label>
                                                        <input
                                                            disabled={readOnly}
                                                            value={titleVal}
                                                            onChange={(e) => handleFeatureChange(index, "title", e.target.value)}
                                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#e83d38] bg-white transition-shadow"
                                                            placeholder="Ej. Alta Producción"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Preview */}
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Vista Previa ({tab})</label>
                                                    <input
                                                        disabled={readOnly}
                                                        value={previewVal}
                                                        onChange={(e) => handleFeatureChange(index, "preview", e.target.value)}
                                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#e83d38] bg-white transition-shadow"
                                                        placeholder="Breve sumario visible en la tarjeta del producto, Ej. 54 RPM"
                                                    />
                                                </div>
                                            </div>

                                            {/* Descripción Larga */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Descripción Detallada ({tab})</label>
                                                <textarea
                                                    disabled={readOnly}
                                                    value={descVal}
                                                    onChange={(e) => handleFeatureChange(index, "description", e.target.value)}
                                                    rows={4}
                                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#e83d38] bg-white transition-shadow resize-y"
                                                    placeholder="Descripción para mostrar dentro de la vista de detalle del producto..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Especificaciones Técnicas (Specifications List) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center rounded-t-xl">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-gray-500" />
                        Especificaciones Técnicas - {tab.toUpperCase()}
                    </h3>
                    <button
                        type="button"
                        onClick={addSpecification}
                        disabled={readOnly}
                        className="px-3 py-1.5 text-sm font-medium text-[#e83d38] bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Agregar Especificación
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {getSpecifications().length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            No hay especificaciones técnicas. Haz clic en "Agregar Especificación".
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="hidden md:grid grid-cols-12 gap-4 px-4 pb-2 border-b border-gray-100">
                                <div className="col-span-4 text-xs font-semibold text-gray-500 uppercase">Nombre / Atributo</div>
                                <div className="col-span-8 text-xs font-semibold text-gray-500 uppercase">Valor</div>
                            </div>

                            {getSpecifications().map((spec, index) => {
                                const keyVal = spec[`key_${tab}`] ?? "";
                                const valVal = spec[`value_${tab}`] ?? "";

                                return (
                                    <div key={spec.id || index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 md:p-0 md:px-4 items-center bg-gray-50 md:bg-transparent rounded-xl md:rounded-none relative group">
                                        {!readOnly && (
                                            <button
                                                type="button"
                                                onClick={() => removeSpecification(index)}
                                                className="absolute -right-2 -top-2 md:static md:col-span-1 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors order-first md:order-last flex justify-center bg-white md:bg-transparent shadow-sm md:shadow-none border border-gray-200 md:border-transparent"
                                                title="Eliminar especificación"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}

                                        <div className="md:col-span-4 order-2 md:order-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase md:hidden mb-1 block">Atributo ({tab})</label>
                                            <input
                                                disabled={readOnly}
                                                value={keyVal}
                                                onChange={(e) => handleSpecChange(index, "key", e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#e83d38] bg-white transition-shadow"
                                                placeholder="Ej. Peso, Dimensiones, Voltaje..."
                                            />
                                        </div>

                                        <div className="md:col-span-7 order-3 md:order-2">
                                            <label className="text-xs font-semibold text-gray-500 uppercase md:hidden mb-1 block">Valor ({tab})</label>
                                            <input
                                                disabled={readOnly}
                                                value={valVal}
                                                onChange={(e) => handleSpecChange(index, "value", e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#e83d38] bg-white transition-shadow"
                                                placeholder="Ej. 15 Kg, 20x30 cm, 220V..."
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Capacidades (Capabilities) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-gray-500" />
                        Capacidades Adicionales (Global)
                    </h3>
                    <button
                        type="button"
                        onClick={addCapability}
                        disabled={readOnly}
                        className="px-3 py-1.5 text-sm font-medium text-[#e83d38] bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Agregar Capacidad
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {getCapabilities().length === 0 ? (
                        <div className="text-center py-4 text-gray-500 text-sm">
                            No hay capacidades agregadas. (Ej: "Producción de 5000 unidades/hora")
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {getCapabilities().map((cap, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <input
                                            disabled={readOnly}
                                            value={cap || ""}
                                            onChange={(e) => handleCapabilityChange(index, e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#e83d38] transition-shadow"
                                            placeholder="Escribe la capacidad del producto aquí..."
                                        />
                                    </div>
                                    {!readOnly && (
                                        <button
                                            type="button"
                                            onClick={() => removeCapability(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                            title="Eliminar capacidad"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
