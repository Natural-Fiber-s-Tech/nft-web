import React, { useRef, useState } from "react";
import { FileText, Image as ImageIcon, Briefcase, ListChecks, Link, Upload, X } from "lucide-react";

export default function TeamFormComponent({
    tab = "es",
    local,
    updateLangField,
    updateField,
    readOnly = false,
    invalid = {},
    uploadPhoto,
    uploadCV,
    uploadMsg,
    cvMsg,
    fileInputRef,
    cvInputRef,
    onDropFile,
    onPickFile,
    onPickCV,
}) {
    const isES = tab === "es";

    const getLangVal = (key) => local[key]?.[tab] || "";
    const setLangVal = (key, val) => updateLangField(key, val);

    // States for drag & drop indication
    const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
    const [isDraggingCV, setIsDraggingCV] = useState(false);

    // Controladores de habilidades dinámicas
    const getSkills = () => {
        if (typeof local.skills === 'object' && local.skills !== null && !Array.isArray(local.skills)) {
            return local.skills[tab] || [];
        }
        if (Array.isArray(local.skills)) {
            return local.skills;
        }
        return [];
    };

    const handleSkillChange = (index, value) => {
        const updated = [...getSkills()];
        updated[index] = value;
        setLangVal("skills", updated);
    };

    const addSkill = () => {
        setLangVal("skills", [...getSkills(), ""]);
    };

    const removeSkill = (index) => {
        const updated = [...getSkills()];
        updated.splice(index, 1);
        setLangVal("skills", updated);
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 pb-48">
            {/* Información General */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-gray-500" />
                        Información General ({tab.toUpperCase()})
                    </h3>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nombre */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nombre *</label>
                            <input
                                disabled={readOnly}
                                value={getLangVal("name") || ""}
                                onChange={(e) => setLangVal("name", e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow ${invalid.name && isES ? "border-red-400 focus:ring-red-400" : "border-gray-300"
                                    }`}
                                placeholder="Nombre completo"
                            />
                        </div>

                        {/* Cargo */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Cargo *</label>
                            <input
                                disabled={readOnly}
                                value={getLangVal("role") || ""}
                                onChange={(e) => setLangVal("role", e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow ${invalid.role && isES ? "border-red-400 focus:ring-red-400" : "border-gray-300"
                                    }`}
                                placeholder="Cargo o posición"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Habilidades */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-gray-500" />
                        Habilidades ({tab.toUpperCase()})
                    </h3>
                    {!readOnly && (
                        <button
                            type="button"
                            onClick={addSkill}
                            className="text-sm text-[#e83d38] hover:bg-red-50 px-3 py-1.5 rounded-lg border border-[#e83d38] font-medium transition-colors"
                        >
                            + Añadir
                        </button>
                    )}
                </div>

                <div className="p-6 space-y-4">
                    {getSkills().map((val, index) => (
                        <div key={index} className="flex gap-3 items-start bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <span className="w-6 h-6 rounded-full bg-white text-gray-500 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm border border-gray-200">
                                {index + 1}
                            </span>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <input
                                        disabled={readOnly}
                                        value={val}
                                        onChange={(e) => handleSkillChange(index, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#e83d38] focus:border-transparent"
                                        placeholder={`Habilidad ${index + 1}`}
                                    />
                                </div>
                            </div>
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={() => removeSkill(index)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                                    title="Eliminar habilidad"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                    {getSkills().length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No hay habilidades añadidas.{!readOnly && " Añade una para mejorar el perfil del miembro del equipo."}
                        </div>
                    )}
                    {invalid.skills && isES && getSkills().length === 0 && (
                        <p className="text-xs text-red-500 mt-2">Debes añadir al menos una habilidad.</p>
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
                    <p className="text-sm text-gray-500 mt-1">Estos campos se aplican a ambos idiomas y manejan la foto de perfil y el CV.</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Foto Global */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700">Foto de Perfil * (4:3 recomendado)</label>
                            <div
                                className={`relative rounded-xl border-2 ${invalid.photo
                                    ? "border-red-500"
                                    : isDraggingPhoto ? "border-[#e83d38] bg-red-50" : "border-dashed border-gray-300"
                                    } bg-gray-50 flex items-center justify-center aspect-[4/3] text-gray-500 overflow-hidden transition-colors ${uploadPhoto?.uploading ? "opacity-50 cursor-wait" : ""
                                    }`}
                                onDragEnter={(e) => { e.preventDefault(); setIsDraggingPhoto(true); if(uploadPhoto?.dragEnter) uploadPhoto.dragEnter(e); }}
                                onDragLeave={(e) => { e.preventDefault(); setIsDraggingPhoto(false); if(uploadPhoto?.dragLeave) uploadPhoto.dragLeave(e); }}
                                onDragOver={(e) => { e.preventDefault(); if(uploadPhoto?.dragOver) uploadPhoto.dragOver(e); else e.dataTransfer.dropEffect = "copy"; }}
                                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingPhoto(false); onDropFile(e); }}
                                onClick={() => !uploadPhoto?.uploading && !readOnly && fileInputRef.current?.click()}
                            >
                                {uploadPhoto?.uploading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                                        <div className="text-sm text-gray-600">
                                            Subiendo imagen...
                                        </div>
                                    </div>
                                ) : local.photo || local.image ? (
                                    <>
                                        <img
                                            src={local.photo || local.image}
                                            alt="preview"
                                            className="w-full h-full object-contain rounded-xl"
                                        />
                                        {!readOnly && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateField("photo", "");
                                                    updateField("image", "");
                                                }}
                                                className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors z-10"
                                                title="Eliminar imagen"
                                            >
                                                <X className="w-4 h-4 text-white" />
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-center px-4">
                                        <Upload className="w-6 h-6" />
                                        <div className="text-sm">Arrastrar foto aquí</div>
                                        <div className="text-xs text-gray-400">o</div>
                                        <button
                                            type="button"
                                            className="px-3 py-1 rounded border bg-white"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadPhoto?.uploading || readOnly}
                                        >
                                            Buscar
                                        </button>
                                        <div className="text-xs text-gray-500">
                                            Máx. 5MB • JPG/PNG
                                        </div>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={onPickFile}
                                />
                            </div>
                            {(uploadMsg || uploadPhoto?.uploadMessage) && (
                                <div
                                    className={`text-xs mt-1 ${uploadPhoto?.uploadMessage?.includes("✅")
                                        ? "text-green-600"
                                        : uploadPhoto?.uploadMessage?.includes("❌")
                                            ? "text-red-600"
                                            : "text-yellow-600"
                                        }`}
                                >
                                    {uploadPhoto?.uploadMessage || uploadMsg}
                                </div>
                            )}
                            <input
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e83d38] focus:border-transparent text-sm"
                                placeholder="o pega o ingresa URL de imagen..."
                                value={local.photo || local.image || ""}
                                onChange={(e) => updateField("photo", e.target.value)}
                                disabled={readOnly}
                            />
                        </div>

                        {/* CV y Contacto */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    CV (PDF)
                                </label>
                                <div
                                    className={`space-y-4 p-4 border-2 border-dashed rounded-xl transition-colors ${isDraggingCV ? 'border-[#e83d38] bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                                    onDragEnter={(e) => { e.preventDefault(); setIsDraggingCV(true); if(uploadCV?.dragEnter) uploadCV.dragEnter(e); }}
                                    onDragLeave={(e) => { e.preventDefault(); setIsDraggingCV(false); if(uploadCV?.dragLeave) uploadCV.dragLeave(e); }}
                                    onDragOver={(e) => { e.preventDefault(); if(uploadCV?.dragOver) uploadCV.dragOver(e); else e.dataTransfer.dropEffect = "copy"; }}
                                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingCV(false); if(!readOnly) uploadCV.dropFile(e); }}
                                >
                                    <div className="flex items-center gap-2">
                                        <input
                                            className="flex-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e83d38] focus:border-transparent text-sm"
                                            placeholder="URL del PDF o arrastra archivo aquí..."
                                            value={local.src_cv_pdf || ""}
                                            onChange={(e) => updateField("src_cv_pdf", e.target.value)}
                                            disabled={readOnly}
                                        />
                                        <input
                                            ref={cvInputRef}
                                            type="file"
                                            accept=".pdf"
                                            className="hidden"
                                            onChange={onPickCV}
                                        />
                                        {!readOnly && (
                                            <button
                                                type="button"
                                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 transition-colors"
                                                onClick={() => cvInputRef.current?.click()}
                                                disabled={uploadCV?.uploading}
                                                title="Subir PDF local"
                                            >
                                                {uploadCV?.uploading ? (
                                                    <span className="animate-spin inline-block font-mono">⟳</span>
                                                ) : (
                                                    <Upload className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}
                                        {local.src_cv_pdf && (
                                            <a
                                                href={local.src_cv_pdf}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors flex items-center justify-center shrink-0"
                                                title="Visualizar PDF"
                                            >
                                                📄
                                            </a>
                                        )}
                                    </div>
                                    {(cvMsg || uploadCV?.uploadMessage) && (
                                        <div
                                            className={`text-xs mt-1 font-medium ${uploadCV?.uploadMessage?.includes("✅")
                                                ? "text-green-600"
                                                : uploadCV?.uploadMessage?.includes("❌")
                                                    ? "text-red-600"
                                                    : "text-amber-600"
                                                }`}
                                        >
                                            {uploadCV?.uploadMessage || cvMsg}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Link className="w-4 h-4 text-gray-500" />
                                    Enlace (Opcional)
                                </label>
                                <p className="text-xs text-gray-500 mb-1">LinkedIn, Portafolio u otra URL</p>
                                <input
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e83d38] focus:border-transparent text-sm"
                                    placeholder="https://"
                                    value={local.link_bio || ""}
                                    onChange={(e) => updateField("link_bio", e.target.value)}
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
