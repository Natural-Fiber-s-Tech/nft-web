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
  // Estado local para el idioma del preview (no depende del contexto)
  const [previewLanguage, setPreviewLanguage] = useState("es");
  const [activeTab, setActiveTab] = useState("card");
  const [currentMode, setCurrentMode] = useState(mode);
  const [orderError, setOrderError] = useState(null);
  const [showOrderTooltip, setShowOrderTooltip] = useState(false);

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

  // 🔥 Hooks de upload de archivos (DRY pattern - similar a Products)
  const uploadPDF = useFileUpload({
    accept: ".pdf,application/pdf",
    maxSize: 10 * 1024 * 1024, // 10MB
    uploadPath: "public/assets/images/investigation/pdf/",
    onSuccess: (fileUrl) =>
      setFormData((p) => ({ ...p, download_link_pdf: fileUrl })),
  });

  const uploadImage = useFileUpload({
    accept: "image/*",
    maxSize: 5 * 1024 * 1024, // 5MB
    uploadPath: "public/assets/images/investigation/images/",
    onSuccess: (fileUrl) => setFormData((p) => ({ ...p, localImage: fileUrl })),
  });

  // ✅ Validación para vista Card
  const validateCard = () => {
    const errors = {};
    const titleEsOrEn = formData.title.es || formData.title.en;

    if (!formData.id) errors.id = "ID es requerido";
    if (!titleEsOrEn)
      errors.title = "Título es requerido (al menos en un idioma)";
    if (!formData.localImage) errors.localImage = "Imagen es requerida";
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
    try {
      // ✅ Generar slug desde título si no existe
      let finalData = { ...formData };
      if (!finalData.slug && (finalData.title.es || finalData.title.en)) {
        const titleForSlug = finalData.title.es || finalData.title.en;
        finalData.slug = generateSlug(titleForSlug);
      }

      // ⚠️ IMPORTANTE: Preservar el estado archived del artículo original
      // Solo cambiar archived cuando se usa el botón "Restaurar"
      if (currentMode === "edit" && article) {
        finalData.archived = article.archived; // Mantener estado original
      }

      console.log("🔍 DEBUG - Datos a guardar:", finalData);
      console.log("🔍 DEBUG - ID generado:", finalData.id);
      console.log("🔍 DEBUG - Slug generado:", finalData.slug);
      console.log("🔍 DEBUG - Estado archived:", finalData.archived);

      await onSave(finalData);
      console.log("✅ Artículo guardado exitosamente");
      onClose();
    } catch (error) {
      console.error("❌ Error al guardar:", error);
      alert("❌ Error al guardar el artículo: " + error.message);
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden"
      onClick={(e) => {
        // Cerrar solo si se hace click en el overlay (no en el modal)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con título, tabs y botón cerrar */}
        <div className="px-6 pt-4 pb-3 border-b border-gray-700">
          {/* Fila 1: Título + Badges + Botón Cerrar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">
                {isViewMode
                  ? "Ver Artículo"
                  : isRestoreMode
                    ? "Restaurar Artículo"
                    : currentMode === "create"
                      ? "Nuevo Artículo"
                      : "Editar Artículo"}
              </h2>
              {isViewMode && (
                <span className="bg-blue-500/20 text-blue-400 text-xs font-medium px-2 py-1 rounded-full">
                  Solo lectura
                </span>
              )}
              {isRestoreMode && (
                <span className="bg-green-500/20 text-green-400 text-xs font-medium px-2 py-1 rounded-full">
                  Modo Restaurar
                </span>
              )}
              {article?.archived && !isRestoreMode && (
                <span className="bg-orange-500/20 text-orange-400 text-xs font-medium px-2 py-1 rounded-full">
                  Archivado
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Fila 2: Tabs de Vista y Idioma en un solo contenedor */}
          <div className="flex items-center justify-between gap-4">
            {/* Tabs de Vista */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("card")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "card"
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
              >
                Vista Card
              </button>
              <button
                onClick={() => setActiveTab("detail")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "detail"
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
              >
                Vista Detalle
              </button>
            </div>

            {/* Tabs de Idioma - SIEMPRE VISIBLE en todos los modos */}
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewLanguage("es")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${previewLanguage === "es"
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
              >
                Español (ES)
              </button>
              <button
                onClick={() => setPreviewLanguage("en")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${previewLanguage === "en"
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
              >
                English (EN)
              </button>
            </div>
          </div>

          {/* Fila 3: Botón Editar centrado (solo en modo view) */}
          {isViewMode && (
            <div className="flex justify-center mt-3 pt-3 border-t border-gray-700">
              <button
                onClick={handleEditMode}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 bg-black/70">
          {isViewMode ? (
            // MODO VIEW: Mostrar vista previa renderizada
            <div className="space-y-3">
              {/* ✅ Información de registro - Layout inline (igual que modo edit) */}
              <div className="bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-700">
                <div className="flex items-center gap-6">
                  {/* ID/Slug - flex-1 con label inline */}
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-400 whitespace-nowrap">
                      ID / Slug
                    </label>
                    <div
                      className="flex-1 px-3 py-1.5 bg-gray-900/50 border border-gray-600 rounded text-gray-300 font-mono text-sm truncate"
                      title={formData.slug}
                    >
                      {formData.slug}
                    </div>
                  </div>

                  {/* Orden - Ancho fijo con label inline */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-400 whitespace-nowrap">
                      Orden
                    </label>
                    <div className="px-3 py-1.5 bg-gray-900/50 border border-gray-600 rounded text-white text-sm w-20 text-center font-mono">
                      {formData.order}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vista renderizada según tab activo */}
              {activeTab === "card" ? (
                <LanguageProvider>
                  <PreviewWrapper language={previewLanguage}>
                    <div className="max-w-md mx-auto">
                      <h3 className="text-white text-lg font-semibold mb-4 text-center">
                        📄 Vista Previa - Tarjeta de Investigación
                      </h3>
                      <ArticleCard article={previewArticle} isPreview={true} />
                    </div>
                  </PreviewWrapper>
                </LanguageProvider>
              ) : (
                <LanguageProvider>
                  <PreviewWrapper language={previewLanguage}>
                    {/* Vista Detalle: renderizar componente completo sin wrappers adicionales */}
                    <InvestigationDetail
                      article={previewArticle}
                      isPreview={true}
                    />
                  </PreviewWrapper>
                </LanguageProvider>
              )}
            </div>
          ) : (
            // MODO EDIT/CREATE/RESTORE: Mostrar formularios
            <div className="space-y-6">
              {/* ✅ Contenedor compacto de ID/Slug y Orden - Layout inline */}
              {isEditableMode && (
                <div className="bg-gray-800/50 rounded-lg px-4 py-2.5 border border-gray-700">
                  <div className="flex items-center gap-6">
                    {/* ID/Slug - flex-1 con label inline */}
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-400 whitespace-nowrap">
                        ID / Slug
                      </label>
                      <div
                        className="flex-1 px-3 py-1.5 bg-gray-900/50 border border-gray-600 rounded text-gray-300 font-mono text-sm truncate"
                        title={formData.slug || formData.id}
                      >
                        {formData.slug || formData.id || "Generando..."}
                      </div>
                    </div>

                    {/* Orden - Ancho fijo con label inline */}
                    <div className="relative flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-400 whitespace-nowrap">
                        Orden *{" "}
                        <span className="text-xs text-gray-500">
                          ({orderRange.min}-{orderRange.max})
                        </span>
                      </label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => handleOrderChange(e.target.value)}
                        className={`w-20 px-3 py-1.5 bg-gray-900/50 border rounded text-white text-sm transition-all ${orderError
                          ? "border-red-500 animate-shake"
                          : "border-gray-600 focus:border-red-500"
                          }`}
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
              )}

              {/* Formularios según tab activo */}
              {activeTab === "card" ? (
                <ResearchCardForm
                  formData={formData}
                  setFormData={setFormData}
                  isNew={!article}
                  readOnly={false}
                  uploadImage={uploadImage}
                />
              ) : (
                <ResearchDetailForm
                  formData={formData}
                  setFormData={setFormData}
                  readOnly={false}
                  onPickPDF={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".pdf,application/pdf";
                    input.onchange = (e) => uploadPDF.pickFile(e);
                    input.click();
                  }}
                  onDropPDF={(e) => uploadPDF.dropFile(e)}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isViewMode && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700 bg-gray-800/50">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>

            {isRestoreMode ? (
              // ✅ Modo Restore: Solo botón Restaurar
              <button
                onClick={handleRestore}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium shadow-lg"
              >
                <RotateCcw className="w-4 h-4" />
                Restaurar Artículo
              </button>
            ) : currentMode === "edit" && article?.archived ? (
              // ✅ Modo Edit de registro archivado: Mostrar ambos botones
              <>
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-lg"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={handleRestore}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium shadow-lg"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar
                </button>
              </>
            ) : (
              // ✅ Modo Edit normal o Create: Solo botón guardar
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-lg"
              >
                {currentMode === "create"
                  ? "Crear Artículo"
                  : "Guardar Cambios"}
              </button>
            )}
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
