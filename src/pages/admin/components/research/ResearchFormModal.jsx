import React, { useState, useEffect } from "react";
import { X, Edit, Globe, RotateCcw } from "lucide-react";
import ResearchCardForm from "./ResearchCardForm";
import ResearchDetailForm from "./ResearchDetailForm";
import ArticleCard from "../../../../components/research/ArticleCard";
import InvestigationDetail from "../../../investigation/investigationDetail.jsx";
import { LanguageProvider } from "../../../../context/LanguageContext.jsx";
import { useLanguage } from "../../../../context/hooks/useLanguage.js";
import { validateOrder, getOrderRange } from "../../../../lib/crud";
import FieldRequiredModal from "./FieldRequiredModal";
import DetailIncompleteConfirmModal from "../products/DetailIncompleteConfirmModal";
import { useFileUpload } from "../../hooks/useFileUpload";
import { translateText } from "../../hooks/useAutoTranslate";
import { uploadFileToSupabase, compressImageToWebP } from "../../../../lib/storage";

// Función helper para generar slug desde título
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, "") // Solo letras, números, espacios y guiones
    .trim()
    .replace(/\s+/g, "-") // Espacios a guiones
    .replace(/-+/g, "-"); // Guiones múltiples a uno solo
}

export default function ResearchFormModal({
  open,
  article,
  onClose,
  onSave,
  onRestore,
  mode = "edit",
  allRows = [], // ✅ Necesario para validar orden
}) {
  // Estado local para el idioma del form (reemplaza a previewLanguage)
  const [activeLang, setActiveLang] = useState("es");
  const [activeTab, setActiveTab] = useState("card");
  const [currentMode, setCurrentMode] = useState(mode);
  const [orderError, setOrderError] = useState(null);
  const [showOrderTooltip, setShowOrderTooltip] = useState(false);
  // Archivos pendientes (se suben a Supabase solo al guardar)
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [pendingPdfFile, setPendingPdfFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [translating, setTranslating] = useState(false);


  // Estados para validación elegante
  const [cardErrors, setCardErrors] = useState({});
  const [detailErrors, setDetailErrors] = useState({});
  const [showFieldRequired, setShowFieldRequired] = useState(false);
  const [showDetailConfirm, setShowDetailConfirm] = useState(false);
  const [formData, setFormData] = useState({
    id: "", // ⚠️ IMPORTANTE: Debe preservarse el ID al editar
    slug: "", // ⚠️ IMPORTANTE: Preservar slug generado automáticamente
    order: 0,
    localImage: "",
    journal: "",
    date: new Date().toISOString().split("T")[0],
    title: { es: "", en: "" },
    summary_30w: { es: "", en: "" },
    keywords: [],
    author: [],
    products: [],
    // Campos para vista detalle
    abstract: "", // Abstract completo (puede ser string o objeto bilingüe)
    fullSummary: { es: "", en: "" },
    download_link_DOI: "",
    download_link_pdf: "",
    archived: false,
  });

  // Manejadores de selección de archivos (solo preview local, sin subir)
  const handleImagePick = (file) => {
    if (!file) return;
    setPendingImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setFormData((p) => ({ ...p, localImage: previewUrl }));
  };

  const handlePdfPick = (file) => {
    if (!file) return;
    setPendingPdfFile(file);
    const previewUrl = URL.createObjectURL(file);
    // Guardamos la preview URL del PDF para mostrarla en el formulario
    setFormData((p) => ({ ...p, download_link_pdf: previewUrl, pdfFileName: file.name }));
  };

  // ✅ Validación para vista Card
  const validateCard = () => {
    const errors = {};
    const titleEsOrEn = formData.title.es || formData.title.en;

    if (!formData.id) errors.id = "ID es requerido";
    if (!titleEsOrEn)
      errors.title = "Título es requerido (al menos en un idioma)";
    if (!formData.date) errors.date = "Fecha de publicación es requerida";
    if (formData.keywords.length === 0)
      errors.keywords = "Debe agregar al menos una keyword";

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ Validación para vista Detail
  const validateDetail = () => {
    const errors = {};

    // Verificar abstract (puede ser string o objeto bilingüe)
    const hasAbstract =
      typeof formData.abstract === "object"
        ? formData.abstract.es || formData.abstract.en
        : formData.abstract;

    if (!hasAbstract) {
      errors.abstract = "Abstract/Resumen completo es requerido";
    }

    // Validar PDF requerido (porque de ahí sale la imagen)
    if (!formData.download_link_pdf && !formData.localImage) {
      errors.download_link_pdf = "Debe subir un documento PDF para extraer la portada.";
    }

    setDetailErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Cargar datos si estamos editando
  useEffect(() => {
    if (article) {
      setFormData({
        id: article.id || article.slug, // ⚠️ CRÍTICO: Preservar ID para edición
        slug: article.slug || "",
        order: article.order || 0,
        localImage: article.localImage || "",
        journal: article.journal || "",
        date: article.date || new Date().toISOString().split("T")[0],
        // Si title es string, convertir a objeto bilingüe
        title:
          typeof article.title === "string"
            ? { es: article.title, en: article.title }
            : article.title || { es: "", en: "" },
        // Si summary_30w es string, convertir a objeto bilingüe
        summary_30w:
          typeof article.summary_30w === "string"
            ? { es: article.summary_30w, en: article.summary_30w }
            : article.summary_30w || { es: "", en: "" },
        keywords: article.keywords || [],
        author: article.author || [],
        products: article.products || [],
        // ✅ Abstract completo (mantener formato original)
        abstract: article.abstract || "",
        download_link_DOI: article.download_link_DOI || "",
        download_link_pdf: article.download_link_pdf || "",
        archived: article.archived || false,
      });
    } else {
      // Generar ID automático para nuevo artículo
      const randomId = `research-${Math.random().toString(36).substring(2, 9)}`;
      setFormData((prev) => ({
        ...prev,
        id: randomId,
        slug: "", // Se generará desde el título al guardar
      }));
    }
  }, [article]);

  // Reset mode cuando cambia article o mode prop
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode, article]);

  // Reset mode cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      // Cuando se cierra, resetear al modo original
      setCurrentMode(mode);
    }
  }, [open, mode]);

  // ✅ Generar slug automáticamente cuando el usuario escribe el título (solo en modo create)
  useEffect(() => {
    if (currentMode === "create" && formData.title) {
      const titleText = formData.title.es || formData.title.en;
      if (titleText && titleText.length > 3) {
        const autoSlug = generateSlug(titleText);
        setFormData((prev) => ({
          ...prev,
          slug: autoSlug,
        }));
      }
    }
  }, [formData.title, currentMode]);

  const handleSave = async () => {
    // ✅ Validar vista Card
    const cardValid = validateCard();
    const detailValid = validateDetail();

    if (!cardValid) {
      // Mostrar modal con campos faltantes
      setShowFieldRequired(true);
      return;
    }

    // ✅ Validar orden usando función común
    const orderValidation = validateOrder(
      formData.order,
      allRows,
      currentMode === "restore"
        ? "restore"
        : currentMode === "create"
          ? "create"
          : "edit",
      article
    );

    if (!orderValidation.valid) {
      setOrderError(orderValidation.error);
      setShowOrderTooltip(true);
      setTimeout(() => setShowOrderTooltip(false), 3000);
      return;
    }

    // ✅ Si Card está OK pero Detail incompleto → mostrar confirmación
    if (cardValid && !detailValid) {
      setShowDetailConfirm(true);
      return;
    }

    // ✅ Todo OK → Guardar
    await prepareAndSave();
  };

  // Función para preparar datos y guardar
  const prepareAndSave = async () => {
    setIsSaving(true);
    try {
      let finalData = { ...formData };

      // 🚀 Subir imagen a Supabase si hay un archivo pendiente
      if (pendingImageFile) {
        try {
          // Comprimir y convertir a WebP antes de subir
          const webpFile = await compressImageToWebP(pendingImageFile);
          const imageUrl = await uploadFileToSupabase(webpFile, 'nft-assets', 'assets/images/investigation/images');
          finalData.localImage = imageUrl;
        } catch (e) {
          console.error("Error subiendo imagen:", e);
          alert("Error subiendo la imagen. Verifica las políticas del bucket en Supabase.");
          setIsSaving(false);
          return;
        }
      }

      // 🚀 Subir PDF a Supabase si hay un archivo pendiente
      if (pendingPdfFile) {
        try {
          const pdfUrl = await uploadFileToSupabase(pendingPdfFile, 'nft-assets', 'assets/images/investigation/pdf');
          finalData.download_link_pdf = pdfUrl;
        } catch (e) {
          console.error("Error subiendo PDF:", e);
          alert("Error subiendo el PDF. Verifica las políticas del bucket en Supabase.");
          setIsSaving(false);
          return;
        }
      }

      // 🛡️ SANITIZACIÓN: nunca guardar blob: o data: URLs en Firestore
      // (causaría el error "value longer than 1048487 bytes")
      const isLocalUrl = (url) => url && (url.startsWith('blob:') || url.startsWith('data:'));
      if (isLocalUrl(finalData.localImage)) {
        finalData.localImage = ""; // Limpiar — el usuario deberá re-subir la imagen
      }
      if (isLocalUrl(finalData.download_link_pdf)) {
        finalData.download_link_pdf = "";
      }

      // Limpiar el campo auxiliar pdfFileName antes de guardar
      delete finalData.pdfFileName;

      // ✅ Generar slug desde título si no existe
      if (!finalData.slug && (finalData.title.es || finalData.title.en)) {
        const titleForSlug = finalData.title.es || finalData.title.en;
        finalData.slug = generateSlug(titleForSlug);
      }

      // ⚠️ IMPORTANTE: Preservar el estado archived del artículo original
      if (currentMode === "edit" && article) {
        finalData.archived = article.archived;
      }

      await onSave(finalData);
      // Limpiar archivos pendientes
      setPendingImageFile(null);
      setPendingPdfFile(null);
      onClose();
    } catch (error) {
      console.error("❌ Error al guardar:", error);
      alert("❌ Error al guardar el artículo: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = async () => {
    // ✅ Validar Card antes de restaurar
    const cardValid = validateCard();
    if (!cardValid) {
      setShowFieldRequired(true);
      return;
    }

    // ✅ Validar orden para modo restore
    const orderValidation = validateOrder(
      formData.order,
      allRows,
      "restore",
      article
    );

    if (!orderValidation.valid) {
      setOrderError(orderValidation.error);
      setShowOrderTooltip(true);
      setTimeout(() => setShowOrderTooltip(false), 3000);
      return;
    }

    try {
      // ✅ Preparar datos con archived: false y guardar cambios también
      const dataToRestore = {
        ...formData,
        archived: false, // ⚠️ IMPORTANTE: Cambiar estado a activo
      };

      console.log("🔄 Restaurando artículo:", dataToRestore);

      if (onRestore) {
        await onRestore(dataToRestore);
        console.log("✅ Artículo restaurado y cambios guardados");
        onClose();
      }
    } catch (error) {
      console.error("❌ Error al restaurar:", error);
      alert("❌ Error al restaurar el artículo");
    }
  };

  const handleOrderChange = (value) => {
    setFormData((prev) => ({ ...prev, order: value }));

    // Validar en tiempo real
    const orderValidation = validateOrder(
      value,
      allRows,
      currentMode === "restore"
        ? "restore"
        : currentMode === "create"
          ? "create"
          : "edit",
      article
    );

    if (!orderValidation.valid) {
      setOrderError(orderValidation.error);
      setShowOrderTooltip(true);
      // Auto-ocultar tooltip después de 3 segundos
      setTimeout(() => setShowOrderTooltip(false), 3000);
    } else {
      setOrderError(null);
      setShowOrderTooltip(false);
    }
  };

  const handleEditMode = () => {
    setCurrentMode("edit");
  };

  const handleAutoTranslate = async () => {
    const src = activeLang;            // idioma de origen (el activo)
    const tgt = src === "es" ? "en" : "es"; // idioma destino

    // Verificar que haya algo que traducir
    const hasContent =
      formData.title?.[src]?.trim() ||
      formData.summary_30w?.[src]?.trim() ||
      (typeof formData.abstract === "object" ? formData.abstract?.[src] : formData.abstract)?.trim() ||
      formData.fullSummary?.[src]?.trim();

    if (!hasContent) return;

    setTranslating(true);
    try {
      const delay = (ms) => new Promise((r) => setTimeout(r, ms));

      const tTitle = formData.title?.[src]?.trim()
        ? await translateText(formData.title[src], src, tgt)
        : null;
      await delay(150);

      const tSumm = formData.summary_30w?.[src]?.trim()
        ? await translateText(formData.summary_30w[src], src, tgt)
        : null;
      await delay(150);

      const abstractSrc =
        typeof formData.abstract === "object"
          ? formData.abstract?.[src] || ""
          : (src === "es" ? formData.abstract : "") || "";
      const tAbs = abstractSrc.trim()
        ? await translateText(abstractSrc, src, tgt)
        : null;
      await delay(150);

      const tFull = formData.fullSummary?.[src]?.trim()
        ? await translateText(formData.fullSummary[src], src, tgt)
        : null;

      setFormData((prev) => {
        const updated = { ...prev };
        if (tTitle !== null) updated.title = { ...prev.title, [tgt]: tTitle.trim() };
        if (tSumm !== null) updated.summary_30w = { ...prev.summary_30w, [tgt]: tSumm.trim() };
        if (tAbs !== null) {
          const currAbstract = typeof prev.abstract === "object" ? prev.abstract : { [src]: prev.abstract };
          updated.abstract = { ...currAbstract, [tgt]: tAbs.trim() };
        }
        if (tFull !== null) updated.fullSummary = { ...prev.fullSummary, [tgt]: tFull.trim() };
        return updated;
      });
    } catch (error) {
      console.error("Error en autotraducción:", error);
      alert("Hubo un error al traducir automáticamente.");
    } finally {
      setTranslating(false);
    }
  };


  if (!open) return null;

  const isViewMode = currentMode === "view";
  const isRestoreMode = currentMode === "restore";
  const isEditableMode = !isViewMode; // edit, create, o restore son editables

  // ✅ Calcular rango válido de orden
  const orderRange = getOrderRange(
    allRows,
    currentMode === "restore"
      ? "restore"
      : currentMode === "create"
        ? "create"
        : "edit",
    article
  );

  // Preparar objeto para vista previa (componentes públicos)
  const previewArticle = {
    ...formData,
    // Asegurar formato correcto
    title:
      typeof formData.title === "string"
        ? { es: formData.title, en: formData.title }
        : formData.title,
    summary_30w:
      typeof formData.summary_30w === "string"
        ? { es: formData.summary_30w, en: formData.summary_30w }
        : formData.summary_30w,
    abstract:
      typeof formData.abstract === "string"
        ? formData.abstract
        : formData.abstract,
    fullSummary:
      typeof formData.fullSummary === "string"
        ? { es: formData.fullSummary, en: formData.fullSummary }
        : formData.fullSummary,
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header estandarizado */}
        <div className="px-6 py-4 bg-gray-50 flex flex-col md:flex-row items-start md:items-center justify-between border-b shrink-0 z-20 gap-4">

          {/* Fila 1: Título + Badges */}
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              {isViewMode
                ? "Ver Artículo"
                : isRestoreMode
                  ? "Restaurar Artículo"
                  : currentMode === "create"
                    ? "Nuevo Artículo"
                    : "Editar Artículo"}
            </h2>
            {isViewMode && (
              <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full border border-blue-200">
                Solo lectura
              </span>
            )}
            {isRestoreMode && (
              <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full border border-emerald-200">
                Modo Restaurar
              </span>
            )}
            {article?.archived && !isRestoreMode && (
              <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded-full border border-amber-200">
                Archivado
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Opciones de Idioma y Tabs - Mostradas como los productos */}
            {!isViewMode && (
              <div className="flex items-center gap-3 mr-2">
                <button
                  type="button"
                  onClick={handleAutoTranslate}
                  disabled={translating}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  {translating ? "Traduciendo..." : `Traducir a ${activeLang === "es" ? "ingles" : "español"} (${activeLang.toUpperCase()} → ${activeLang === "es" ? "EN" : "ES"})`}
                </button>
                <div className="w-px h-6 bg-gray-200 hidden md:block"></div>
                <span className="text-sm text-gray-500 font-medium hidden md:block">Idioma:</span>
                <div className="flex border rounded-lg overflow-hidden bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setActiveLang("es")}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeLang === "es" ? "bg-[#e83d38] text-white" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    ES
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLang("en")}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeLang === "en" ? "bg-[#e83d38] text-white" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    EN
                  </button>
                </div>
              </div>
            )}

            {/* View/Edit Actions */}
            {isViewMode && (
              <div className="flex items-center gap-2 border-r pr-4 mr-2 border-gray-200">
                <span className="text-sm text-gray-500 font-medium mr-1">Preview en:</span>
                <div className="flex border rounded-lg overflow-hidden bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setActiveLang("es")}
                    className={`px-3 py-1 text-sm font-medium transition-colors ${activeLang === "es" ? "bg-gray-800 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    ES
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLang("en")}
                    className={`px-3 py-1 text-sm font-medium transition-colors ${activeLang === "en" ? "bg-gray-800 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    EN
                  </button>
                </div>
                <button
                  onClick={handleEditMode}
                  className="flex items-center gap-2 ml-4 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
              </div>
            )}

            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Layout Side-by-Side para los formularios, muy parecido a Products */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-white">

          {/* Columna Izquierda: Formulario (Vista Card o Vista Detalle) */}
          <div className="flex-1 overflow-y-auto w-full p-6 border-r border-gray-100 bg-white">

            {/* Tabs de sección */}
            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab("card")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "card"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Vista Tarjeta
              </button>
              <button
                onClick={() => setActiveTab("detail")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "detail"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Vista Detalle
              </button>
            </div>

            {isViewMode ? (
              // Vista Solo Lectura Stats (en la parte izq)
              <div className="space-y-4 max-w-lg">
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 shadow-inner">
                  <h4 className="text-gray-700 font-semibold mb-4 border-b pb-2">Datos Técnicos</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">ID / Slug:</span>
                      <span className="font-mono text-gray-800 bg-white px-2 border rounded shadow-sm overflow-hidden text-ellipsis max-w-[200px]" title={formData.slug}>{formData.slug}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Orden:</span>
                      <span className="font-mono text-gray-800 bg-white px-2 border rounded shadow-sm">{formData.order}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Formulario interactivo
              <div className="space-y-6">
                {/* Bloque Info del ID y Orden en edicion */}
                <div className="bg-gray-50 rounded-xl px-5 py-4 border border-gray-200">
                  <div className="flex items-center gap-6">
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-600 whitespace-nowrap">ID / Slug</label>
                      <div className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded text-gray-700 font-mono text-sm truncate" title={formData.slug || formData.id}>
                        {formData.slug || formData.id || "Generando..."}
                      </div>
                    </div>

                    <div className="relative flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
                        Orden * <span className="text-xs text-gray-400">({orderRange.min}-{orderRange.max})</span>
                      </label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => handleOrderChange(e.target.value)}
                        className={`w-20 px-3 py-1.5 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:ring-2 focus:ring-[#e83d38] ${orderError ? "border-red-500 animate-shake focus:ring-red-500" : ""}`}
                        min={orderRange.min}
                        max={orderRange.max}
                        step="1"
                      />
                      {showOrderTooltip && orderError && (
                        <div className="absolute left-0 top-full mt-2 bg-red-600 text-white text-xs px-3 py-2 rounded shadow-lg z-10 animate-fade-in max-w-xs whitespace-normal">
                          ⚠️ {orderError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {activeTab === "card" ? (
                  <ResearchCardForm
                    formData={formData}
                    setFormData={setFormData}
                    activeLang={activeLang}
                    isNew={!article}
                    readOnly={false}
                    onImagePick={handleImagePick}
                  />
                ) : (
                  <ResearchDetailForm
                    formData={formData}
                    setFormData={setFormData}
                    activeLang={activeLang}
                    readOnly={false}
                    onImagePick={handleImagePick}
                    onPdfPick={handlePdfPick}
                  />
                )}
              </div>
            )}
          </div>

          {/* Columna Derecha: Vista Previa */}
          <div className="w-full md:w-[450px] lg:w-[500px] bg-[#FAFAFA] overflow-y-auto border-t md:border-t-0 md:border-l border-gray-200 z-0">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 shadow-sm z-10 flex justify-between items-center shrink-0">
              <div>
                <h4 className="font-semibold text-gray-800">Vista Previa</h4>
                <p className="text-xs text-gray-500">Resultados en tiempo real ({activeLang.toUpperCase()})</p>
              </div>
            </div>

            <div className="p-8 flex items-start justify-center">
              <LanguageProvider>
                <PreviewWrapper language={activeLang}>
                  {activeTab === "card" ? (
                    <div className="w-full">
                      <ArticleCard article={previewArticle} isPreview={true} />
                    </div>
                  ) : (
                    <div className="w-full scale-90 transform origin-top h-min">
                      <InvestigationDetail article={previewArticle} isPreview={true} />
                    </div>
                  )}
                </PreviewWrapper>
              </LanguageProvider>
            </div>
          </div>
        </div>

        {/* Sticky Footer Claro */}
        {!isViewMode && (
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-t shrink-0 z-40 rounded-b-xl">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Status: {currentMode === "create" ? "Borrador" : "Editando"}
            </div>
            <div className="flex justify-end gap-3 flex-1 sm:flex-none">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>

              {isRestoreMode ? (
                <button
                  onClick={handleRestore}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 rounded-lg transition-colors font-medium shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar Artículo
                </button>
              ) : currentMode === "edit" && article?.archived ? (
                <>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                  >
                    Guardar Cambios
                  </button>
                  <button
                    onClick={handleRestore}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 rounded-lg transition-colors font-medium shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restaurar
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-[#e83d38] hover:bg-[#d63430] text-white rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2"
                >
                  <svg className="w-5 h-5 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {currentMode === "create" ? "Crear Artículo" : "Guardar Cambios"}
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ✅ Modal de Validación - Campos Requeridos */}
      <FieldRequiredModal
        open={showFieldRequired}
        missingFields={Object.entries(cardErrors).map(([key, msg]) => msg)}
        viewName="Vista Card"
        onAccept={() => setShowFieldRequired(false)}
        onCancel={() => setShowFieldRequired(false)}
      />

      {/* ✅ Modal de Confirmación - Vista Detail Incompleta */}
      <DetailIncompleteConfirmModal
        open={showDetailConfirm}
        onAccept={async () => {
          setShowDetailConfirm(false);
          await prepareAndSave();
        }}
        onCancel={() => setShowDetailConfirm(false)}
      />
    </div>
  );
}

// Componente helper para sincronizar el idioma del preview con el contexto
function PreviewWrapper({ language, children }) {
  const { language: contextLang, toggleLanguage } = useLanguage();

  useEffect(() => {
    if (contextLang !== language) {
      toggleLanguage(language);
    }
  }, [language, contextLang, toggleLanguage]);

  return <>{children}</>;
}
