import React, { useEffect, useMemo, useRef, useState } from "react";
import ProductFormComponent from "./ProductFormComponent";
import DetailIncompleteConfirmModal from "./DetailIncompleteConfirmModal";

import { translateText } from "../../hooks/useAutoTranslate";
import { uploadFileToSupabase, compressImageToWebP } from "../../../../lib/storage";

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
    // Archivos de imagen pendientes (se suben a Supabase al guardar)
    const [pendingPhotoFile, setPendingPhotoFile] = useState(null);
    const [pendingGalleryFiles, setPendingGalleryFiles] = useState([]); // [{blobUrl, file}]
    // Fichas técnicas pendientes (ES y EN)
    const [pendingSheetFiles, setPendingSheetFiles] = useState({ es: null, en: null });

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

            // 📸 Para imágenes: preview local con Blob URL + guardar File pendiente
            if (kind === "image" || kind === "gallery") {
                const blobUrl = URL.createObjectURL(file);
                if (kind === "image") {
                    setPendingPhotoFile(file);
                    setLocal((p) => ({ ...p, photos: blobUrl }));
                } else if (kind === "gallery") {
                    setPendingGalleryFiles((prev) => [...prev, { blobUrl, file }]);
                    setLocal((p) => ({
                        ...p,
                        gallery: [...(p.gallery || []), blobUrl],
                    }));
                }
                setUploading(false);
                return;
            }

            // 📄 Para PDFs (datasheets): preview blob URL + guardar File pendiente
            if (kind === "datasheet-es" || kind === "datasheet-en") {
                const lang = kind === "datasheet-es" ? "es" : "en";
                const blobUrl = URL.createObjectURL(file);
                // Guardamos el File para subirlo al guardar
                setPendingSheetFiles((prev) => ({ ...prev, [lang]: { file, blobUrl } }));
                // Preview local: el campo technical_sheet_{lang} muestra el nombre del archivo
                setLocal((p) => ({
                    ...p,
                    [`technical_sheet_${lang}`]: blobUrl,
                    [`_sheetName_${lang}`]: file.name,
                }));
                setUploading(false);
                return;
            }

            // Tipo de archivo no manejado
            console.warn('[uploadFile] kind no soportado:', kind);
        } catch (e) {
            if (kind?.startsWith('datasheet')) {
                alert(`No se pudo preparar el PDF (${kind}).\n${e?.message || e}`);
            }
            console.error('[ProductFormModal] uploadFile error', e);
        } finally {
            setUploading(false);
        }
    }

    function onDrop(kind, e) {
        e.preventDefault();
        if (isView) return;

        const files = Array.from(e.dataTransfer?.files || []);
        if (!files.length) return;

        if (kind === "gallery") {
            files.forEach((file) => uploadFile("gallery", file));
        } else {
            uploadFile(kind, files[0]);
        }
    }

    function onPick(kind) {
        if (isView) return;
        const inp = document.createElement("input");
        inp.type = "file";

        if (kind === "image") {
            inp.accept = "image/*";
            inp.onchange = (ev) => {
                const file = ev.target.files?.[0];
                if (file) uploadFile("image", file);
            };
        } else if (kind === "gallery") {
            inp.accept = "image/*";
            inp.multiple = true;
            inp.onchange = (ev) => {
                Array.from(ev.target.files || []).forEach((file) => uploadFile("gallery", file));
            };
        } else if (kind === "datasheet-es") {
            inp.accept = ".pdf,application/pdf";
            inp.onchange = (ev) => {
                const file = ev.target.files?.[0];
                if (file) uploadFile("datasheet-es", file);
            };
        } else if (kind === "datasheet-en") {
            inp.accept = ".pdf,application/pdf";
            inp.onchange = (ev) => {
                const file = ev.target.files?.[0];
                if (file) uploadFile("datasheet-en", file);
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

    const handleSaveWrapper = async () => {
        const err = validateCard();
        if (Object.keys(err).length > 0) {
            const errorMsg = Object.values(err).join("\n- ");
            alert(`Por favor, corrige los siguientes errores antes de guardar:\n- ${errorMsg}`);
            return;
        }

        setUploading(true);
        try {
            let finalData = { ...local };

            // 🚀 Subir imagen principal a Supabase (con conversión WebP)
            if (pendingPhotoFile) {
                try {
                    const webpFile = await compressImageToWebP(pendingPhotoFile);
                    const url = await uploadFileToSupabase(webpFile, 'nft-assets', 'assets/images/products/images');
                    finalData.photos = url;
                } catch (e) {
                    console.error('Error subiendo imagen principal:', e);
                    alert('Error subiendo la imagen. Verifica las políticas RLS del bucket en Supabase.');
                    return;
                }
            }

            // 🚀 Subir imágenes de galeria a Supabase
            if (pendingGalleryFiles.length > 0) {
                const uploadedGallery = [];
                for (const { blobUrl, file } of pendingGalleryFiles) {
                    try {
                        const webpFile = await compressImageToWebP(file);
                        const url = await uploadFileToSupabase(webpFile, 'nft-assets', 'assets/images/products/gallery');
                        uploadedGallery.push({ blobUrl, url });
                    } catch (e) {
                        console.error('Error subiendo imagen de galeria:', e);
                        uploadedGallery.push({ blobUrl, url: '' });
                    }
                }
                finalData.gallery = (finalData.gallery || []).map((item) => {
                    const match = uploadedGallery.find((g) => g.blobUrl === item);
                    return match ? match.url : item;
                }).filter(Boolean);
            }

            // 🚀 Subir fichas técnicas PDF a Supabase
            for (const lang of ['es', 'en']) {
                const pending = pendingSheetFiles[lang];
                if (pending?.file) {
                    try {
                        const url = await uploadFileToSupabase(pending.file, 'nft-assets', `assets/products/datasheets/${lang}`);
                        finalData[`technical_sheet_${lang}`] = url;
                    } catch (e) {
                        console.error(`Error subiendo ficha técnica ${lang.toUpperCase()}:`, e);
                        alert(`Error subiendo la ficha técnica ${lang.toUpperCase()}. Verifica las políticas RLS de Supabase.`);
                        return;
                    }
                }
                // Limpiar campo auxiliar de nombre
                delete finalData[`_sheetName_${lang}`];
            }

            // 🛡️ Sanitizar: nunca guardar blob: ni data: en Firestore
            const isLocal = (v) => typeof v === 'string' && (v.startsWith('blob:') || v.startsWith('data:'));
            if (isLocal(finalData.photos)) finalData.photos = '';
            if (isLocal(finalData.technical_sheet_es)) finalData.technical_sheet_es = '';
            if (isLocal(finalData.technical_sheet_en)) finalData.technical_sheet_en = '';
            if (Array.isArray(finalData.gallery)) {
                finalData.gallery = finalData.gallery.filter((u) => !isLocal(u));
            }

            if (isCreate && finalData.name_es) {
                const slug = generateSlug(finalData.name_es);
                if (slug) {
                    const random4 = Math.floor(1000 + Math.random() * 9000);
                    finalData.id = `${slug}-${random4}`;
                    finalData.slug = finalData.id;
                }
            }

            onSave?.(finalData);
            setPendingPhotoFile(null);
            setPendingGalleryFiles([]);
            setPendingSheetFiles({ es: null, en: null });
        } finally {
            setUploading(false);
        }
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
