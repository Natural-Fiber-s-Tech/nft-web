import React, { useEffect, useMemo, useRef, useState } from "react";
import ProductFormComponent from "./ProductFormComponent";
import DetailIncompleteConfirmModal from "./DetailIncompleteConfirmModal";
import { useFileUpload } from "../../hooks/useFileUpload";
import { translateText } from "../../hooks/useAutoTranslate";

export default function ProductFormModal({
    open,
    mode = "view",
    product,
    onClose,
    onSave,
    onRestore,
}) {
    const isOpen = !!open;
    const isView = mode === "view";
    const isEdit = mode === "edit";
    const isCreate = mode === "create";

    const initial = useMemo(
        () =>
            product || {
                id: "product-" + Math.random().toString(36).slice(2, 8),
                name_es: "",
                name_en: "",
                description_es: "",
                description_en: "",
                photos: "",
                video: "",
                technical_sheet_es: "",
                technical_sheet_en: "",
                tag_en: "",
                main_features: [],
                gallery: [],
                capabilities_es: [],
                capabilities_en: [],
                order: 1,
                archived: false,
            },
        [product]
    );
    const [local, setLocal] = useState(initial);
    const [tab, setTab] = useState("es");
    const [previewTab, setPreviewTab] = useState("card"); // card | detail

    useEffect(() => {
        if (product) {
            setLocal(product);
        }
    }, [product]);

    // Reset tab to Spanish when modal opens
    useEffect(() => {
        if (open) {
            setTab("es");
            setPreviewTab("card");
        }
    }, [open]);

    const [cardErrors, setCardErrors] = useState({});
    const [detailErrors, setDetailErrors] = useState({});
    const [showHint, setShowHint] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const dzImgRef = useRef(null);
    const [showDetailConfirm, setShowDetailConfirm] = useState(false);
    const [pendingSave, setPendingSave] = useState(null);
    const [translating, setTranslating] = useState(false);

    // Funciones de actualización planas con sufijos
    function updateFlatField(baseField, val) {
        const key = `${baseField}_${tab}`;
        setLocal((s) => ({ ...s, [key]: val }));
    }

    function updateRawField(field, val) {
        setLocal((s) => ({ ...s, [field]: val }));
    }

    async function handleAutoTranslate() {
        if (translating) return;

        const hasContentEn = local.name_en || local.description_en || local.tag_en || local.capabilities_en?.length > 0;
        if (hasContentEn) {
            if (!window.confirm("Ya hay contenido en Inglés. ¿Deseas sobreescribir las traducciones?")) {
                return;
            }
        }

        setTranslating(true);
        try {
            const updated = { ...local };

            // Helper with delay to avoid rate limit
            const t = async (text) => {
                if (!text || !text.trim()) return text;
                const res = await translateText(text, "es", "en");
                await new Promise((resolve) => setTimeout(resolve, 150));
                return res;
            };

            // Simple Flat Fields
            updated.name_en = await t(updated.name_es);
            updated.subtitle_en = await t(updated.subtitle_es);
            updated.description_en = await t(updated.description_es);
            updated.tag_en = await t(updated.tag_es);

            // capabilities
            if (Array.isArray(updated.capabilities_es) && updated.capabilities_es.length > 0) {
                updated.capabilities_en = [];
                for (const cap of updated.capabilities_es) {
                    updated.capabilities_en.push(await t(cap));
                }
            }

            // main_features
            if (Array.isArray(updated.main_features) && updated.main_features.length > 0) {
                const nextFeatures = [];
                for (const item of updated.main_features) {
                    const newItem = { ...item };
                    newItem.title_en = await t(item.title_es);
                    newItem.preview_en = await t(item.preview_es);
                    newItem.description_en = await t(item.description_es);
                    nextFeatures.push(newItem);
                }
                updated.main_features = nextFeatures;
            }

            // specifications_list
            if (Array.isArray(updated.specifications_list) && updated.specifications_list.length > 0) {
                const nextSpecs = [];
                for (const spec of updated.specifications_list) {
                    const newSpec = { ...spec };
                    if (!spec.key_es?.startsWith('__temp_')) {
                        newSpec.key_en = await t(spec.key_es);
                    } else {
                        newSpec.key_en = spec.key_es;
                    }
                    newSpec.value_en = await t(spec.value_es);
                    nextSpecs.push(newSpec);
                }
                updated.specifications_list = nextSpecs;
            }

            setLocal(updated);
            alert("Traducción a Inglés completada exitosamente. Recuerde revisar los campos antes de guardar debido a que las traducciones pueden no ser muy precisas.");
        } catch (error) {
            console.error("Translation error:", error);
            alert("Hubo un error al traducir algunos campos.");
        } finally {
            setTranslating(false);
        }
    }

    // Validators simplificados
    function validateCard() {
        const e = {};
        if (!local?.id?.trim()) e.id = "ID requerido";
        if (!local?.name_es?.trim()) e.name_es = "Nombre (ES) requerido";
        if (!local?.description_es?.trim()) e.desc_es = "Descripción (ES) requerida";
        if (!local?.photos?.trim()) e.image = "Imagen requerida";
        if (!local?.tag_es?.trim()) e.tag_es = "Categoría/Tag (ES) requerida";

        setCardErrors(e);
        return e;
    }

    function validateDetail() {
        // Ya no hacemos diferencia de validación obligatoria porque todo está expuesto en una vista principal
        const e = {};
        setDetailErrors(e);
        return e;
    }

    // Hook mock de upload de archivos
    const uploadImage = useFileUpload({
        accept: "image/*",
        maxSize: 5 * 1024 * 1024,
        uploadPath: "public/assets/images/products/",
        onSuccess: (fileUrl) => updateRawField('photos', fileUrl),
    });

    const uploadGalleryImage = useFileUpload({
        accept: "image/*",
        maxSize: 5 * 1024 * 1024,
        uploadPath: "public/assets/images/products/",
        onSuccess: (fileUrl) => {
            setLocal((p) => ({
                ...p,
                gallery: [...(p.gallery || []), fileUrl],
            }));
        },
    });

    const uploadDatasheetES = useFileUpload({
        accept: ".pdf,application/pdf",
        maxSize: 10 * 1024 * 1024,
        uploadPath: "public/assets/images/products/pdf/",
        onSuccess: (fileUrl) => updateRawField('technical_sheet_es', fileUrl),
    });

    const uploadDatasheetEN = useFileUpload({
        accept: ".pdf,application/pdf",
        maxSize: 10 * 1024 * 1024,
        uploadPath: "public/assets/images/products/pdf/",
        onSuccess: (fileUrl) => updateRawField('technical_sheet_en', fileUrl),
    });

    async function uploadFromUrl(kind, urlStr) {
        const url = String(urlStr || "").trim();
        if (!url) return;
        if (url.startsWith("blob:")) {
            alert(
                "Esa URL es de tipo 'blob:' y no se puede importar directamente. Copia una URL https pública (Copiar dirección de imagen) o descarga el archivo y súbelo."
            );
            return;
        }
        setUploading(true);
        try {
            console.log("[adminx] uploadFromUrl start", { kind, url, id: local.id });
            const res = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, path: `/content/products/${local.id}/` }),
            });
            const debugHdr = res.headers.get("X-Upload-Debug");
            const data = await res.json().catch(() => ({}));
            console.log("[adminx] uploadFromUrl res", {
                status: res.status,
                ok: res.ok,
                debug: debugHdr,
                data,
            });
            if (!res.ok || !data?.ok) {
                const msg = data?.error || `HTTP ${res.status}`;
                throw new Error(msg);
            }
            const hosted = data?.url || data?.path || "";
            if (!hosted) throw new Error("no_url");
            if (kind === "image") setLocal((p) => ({ ...p, photos: hosted })); // using photos flat field
            if (kind === "gallery") {
                setLocal((p) => ({
                    ...p,
                    gallery: [...(p.gallery || []), hosted],
                }));
            }
        } catch (e) {
            alert(
                `No se pudo importar desde URL (${kind}). Detalle: ${e?.message || e
                }\nSi el sitio bloquea la descarga, descarga el archivo y súbelo manualmente.`
            );
            console.error("[adminx] uploadFromUrl error", e);
        } finally {
            setUploading(false);
        }
    }

    async function uploadFile(kind, file) {
        // kind: 'datasheet-es' | 'datasheet-en' | 'image' | 'additional'
        setUploading(true);
        try {
            if (!(file instanceof File || file instanceof Blob)) {
                // Soporta cuando accidentalmente nos pasan una URL (string)
                if (typeof file === "string") {
                    setUploading(false);
                    return uploadFromUrl(kind, file);
                }
            }

            // ✅ Para imágenes, usar preview local inmediato (como en Research y Team)
            if (kind === "image" || kind === "gallery") {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target.result;
                    if (kind === "image") {
                        setLocal((p) => ({ ...p, photos: dataUrl })); // using flat field
                    } else if (kind === "gallery") {
                        setLocal((p) => ({
                            ...p,
                            gallery: [...(p.gallery || []), dataUrl],
                        }));
                    }
                };
                reader.readAsDataURL(file);
                setUploading(false);
                return; // ✅ No intentar upload async, solo preview local
            }

            // ✅ Para PDFs (datasheets), sí intentar upload async
            // 1) Intento multipart
            let url = "";
            try {
                const form = new FormData();
                form.append("file", file, file.name || `file-${Date.now()}.bin`);
                form.append("path", `/content/products/${local.id}/`);
                console.log("[adminx] upload multipart start", {
                    kind,
                    name: file?.name,
                    size: file?.size,
                    id: local.id,
                });
                const res = await fetch("/api/upload", { method: "POST", body: form });
                const debugHdr = res.headers.get("X-Upload-Debug");
                const data = await res.json().catch(() => ({}));
                console.log("[adminx] upload multipart res", {
                    status: res.status,
                    ok: res.ok,
                    debug: debugHdr,
                    data,
                });
                if (res.ok && data?.ok) {
                    url = data?.url || data?.path || "";
                } else {
                    // 2) Fallback JSON base64 (cuando multipart no llega bien)
                    console.log("[adminx] fallback base64 start", {
                        kind,
                        name: file?.name,
                        size: file?.size,
                    });
                    const base64 = await new Promise((resolve, reject) => {
                        try {
                            const fr = new FileReader();
                            fr.onload = () => {
                                const s = String(fr.result || "");
                                const i = s.indexOf(",");
                                resolve(i >= 0 ? s.slice(i + 1) : s);
                            };
                            fr.onerror = reject;
                            fr.readAsDataURL(file);
                        } catch (e) {
                            reject(e);
                        }
                    });
                    const res2 = await fetch("/api/upload", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: file.name || `file-${Date.now()}.bin`,
                            path: `/content/products/${local.id}/`,
                            data: base64,
                        }),
                    });
                    const debugHdr2 = res2.headers.get("X-Upload-Debug");
                    const data2 = await res2.json().catch(() => ({}));
                    console.log("[adminx] fallback base64 res", {
                        status: res2.status,
                        ok: res2.ok,
                        debug: debugHdr2,
                        data: data2,
                    });
                    if (!res2.ok || !data2?.ok) {
                        const msg = data2?.error || `HTTP ${res2.status}`;
                        throw new Error(msg);
                    }
                    url = data2?.url || data2?.path || "";
                }
            } catch (inner) {
                // Re-lanza para la alerta superior
                console.error("[adminx] upload error inner", inner);
                throw inner;
            }

            if (!url) throw new Error("no_url");
            // ✅ Solo asignar URLs para datasheets (PDFs), no para imágenes
            if (kind === "datasheet-es")
                setLocal((p) => ({
                    ...p,
                    technicalSheets: { ...(p.technicalSheets || {}), es: url },
                }));
            if (kind === "datasheet-en")
                setLocal((p) => ({
                    ...p,
                    technicalSheets: { ...(p.technicalSheets || {}), en: url },
                }));
        } catch (e) {
            // ✅ Solo mostrar alert si es datasheet, imágenes ya tienen preview
            if (kind.startsWith("datasheet")) {
                alert(
                    `No se pudo subir el archivo (${kind}).\nDetalle: ${e?.message || e
                    }\n\nConsejos:\n- Evita URLs 'blob:' (no se pueden importar).\n- Usa el botón Importar URL con un enlace https público, o descarga el archivo y súbelo.\n- Asegúrate de tener vercel dev corriendo (puerto :3000) y variables GITHUB_* válidas.`
                );
            }
            console.error("[adminx] uploadFile error", e);
        } finally {
            setUploading(false);
        }
    }

    function onDrop(kind, e) {
        e.preventDefault();
        if (isView) return;

        // 🔥 Usar hooks de upload según el tipo de archivo
        if (kind === "image") {
            return uploadImage.dropFile(e);
        }
        if (kind === "gallery") {
            return uploadGalleryImage.dropFile(e);
        }
        if (kind === "datasheet-es") {
            return uploadDatasheetES.dropFile(e);
        }
        if (kind === "datasheet-en") {
            return uploadDatasheetEN.dropFile(e);
        }

        // Fallback: Intentar URL si no hay archivo
        try {
            const items = e.dataTransfer?.items;
            if (items && items.length) {
                for (const it of items) {
                    if (it.kind === "string") {
                        const type = it.type || "text/plain";
                        if (type === "text/uri-list" || type === "text/plain") {
                            it.getAsString((text) => {
                                const u = String(text || "").trim();
                                console.log("[adminx] drop url", { kind, u });
                                if (u) uploadFromUrl(kind, u);
                            });
                            return;
                        }
                    }
                }
            }
        } catch { }
    }

    function onPick(kind) {
        if (isView) return;
        const inp = document.createElement("input");
        inp.type = "file";

        // 🔥 Configurar según el tipo de archivo
        if (kind === "image") {
            inp.accept = "image/*";
            inp.onchange = (ev) => uploadImage.pickFile(ev);
        } else if (kind === "gallery") {
            inp.accept = "image/*";
            inp.multiple = true;
            inp.onchange = (ev) => {
                // Para múltiples imágenes, procesar una por una
                const files = Array.from(ev.target.files || []);
                files.forEach((file) => uploadGalleryImage.handleFile(file));
            };
        } else if (kind === "datasheet-es") {
            inp.accept = ".pdf,application/pdf";
            inp.onchange = (ev) => uploadDatasheetES.pickFile(ev);
        } else if (kind === "datasheet-en") {
            inp.accept = ".pdf,application/pdf";
            inp.onchange = (ev) => uploadDatasheetEN.pickFile(ev);
        } else {
            inp.accept = ".pdf,.doc,.docx";
            inp.onchange = (ev) => {
                const file = ev.target.files?.[0];
                if (file) uploadFile(kind, file);
            };
        }

        inp.click();
    }

    async function handleGenerateAI() {
        alert("Generación IA temporalmente deshabilitada en la nueva vista simplificada.");
    }

    const generateSlug = (text) => {
        if (!text) return "";
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
            .trim()
            .replace(/\s+/g, "-") // Replace spaces with hyphens
            .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
    };

    function onSubmit(e) {
        e?.preventDefault?.();
        const eCard = validateCard();
        const missingCard = Object.keys(eCard);

        // Si Card tiene errores, bloquear y mostrar hints
        if (missingCard.length) {
            setShowHint(true);
            const errorMsg = Object.values(eCard).join(", ");
            alert(`Faltan campos obligatorios:\n${errorMsg}`);
            try {
                const priority = ["name_es", "desc_es"]; // orden básico
                const first = missingCard.find(k => priority.includes(k)) || missingCard[0];
                const input = document.querySelector(`[name="${first}"]`);
                if (input) {
                    input.focus({ preventScroll: false });
                    input.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            } catch { }
            return;
        }

        let finalData = { ...local };
        if (isCreate && finalData.name_es) {
            const slug = generateSlug(finalData.name_es);
            if (slug) finalData.slug = `${slug}-${local.id.slice(-4)}`;
        }
        onSave?.(finalData);
    }

    const handleSaveWrapper = () => {
        const err = validateCard();
        if (Object.keys(err).length > 0) {
            const errorMsg = Object.values(err).join("\n- ");
            alert(`Por favor, corrige los siguientes errores antes de guardar:\n- ${errorMsg}`);
            return;
        }

        let finalData = { ...local };
        if (isCreate && finalData.name_es) {
            const slug = generateSlug(finalData.name_es);
            if (slug) finalData.slug = `${slug}-${local.id.slice(-4)}`;
        }
        onSave?.(finalData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Status Bar */}
                <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            {isCreate ? "Nuevo Producto" : isView ? "Ver Producto" : "Editar Producto"}
                        </h2>
                    </div>
                    {(isCreate || isEdit) && (
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleAutoTranslate}
                                disabled={translating}
                                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {translating ? "Traduciendo..." : "Traducir a ingles (ES → EN)"}
                            </button>
                            <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
                            <span className="text-sm text-gray-500 font-medium">Idioma a modificar:</span>
                            <div className="flex border rounded-lg overflow-hidden bg-white shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setTab("es")}
                                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${tab === "es" ? "bg-[#e83d38] text-white" : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    ES
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTab("en")}
                                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${tab === "en" ? "bg-[#e83d38] text-white" : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    EN
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto w-full p-6 bg-white shrink-[3] min-h-[500px]">
                    <ProductFormComponent
                        tab={tab}
                        local={local}
                        setLocal={setLocal}
                        updateFlatField={updateFlatField}
                        updateRawField={updateRawField}
                        onPick={onPick}
                        onDrop={onDrop}
                        readOnly={isView}
                        uploading={uploading}
                        invalid={showHint ? cardErrors : {}}
                    />
                </div>

                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-xl shrink-0 border-t">
                    {isView && local?.archived && (
                        <button
                            type="button"
                            onClick={() => onRestore?.(local)}
                            className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors border border-emerald-200"
                        >
                            Restaurar Producto
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white"
                    >
                        {isView ? "Cerrar" : "Cancelar"}
                    </button>
                    {!isView && (
                        <button
                            type="button"
                            onClick={() => {
                                setShowHint(true);
                                handleSaveWrapper();
                            }}
                            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                        >
                            {isCreate ? "Crear y Guardar" : "Guardar Cambios"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Render confirm modal for incomplete detail
// Place after default export to keep file structure consistent
