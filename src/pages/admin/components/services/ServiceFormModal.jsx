import React, { useEffect, useMemo, useState } from "react";
import {
  RenderIcon,
  localIconMap,
  suggestedIconNames,
} from "../common/IconUtils";
import { ServiceCard } from "../../../../components/sections/Services";
import { useAutoTranslate } from "../../hooks/useAutoTranslate";
import ConfirmModal from "../common/ConfirmModal";
import ServiceFormComponent from "./ServiceFormComponent";

export default function ServiceFormModal({
  open,
  mode = "edit", // create | edit | view
  service,
  onClose,
  onSave,
  onRestore,
}) {
  const isView = mode === "view";
  const [activeLang, setActiveLang] = useState("es");
  const [data, setData] = useState(
    () =>
      service || {
        id: "service-" + Math.random().toString(36).slice(2, 8),
        icon: "Brain",
        title: { es: "", en: "" },
        description: { es: "", en: "" },
        features: { es: [""], en: [""] },
        whatsapp: "51988496839",
        order: "",
        archived: false,
      }
  );
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [visibleTooltips, setVisibleTooltips] = useState({});
  const original = useMemo(() => JSON.stringify(service || {}), [service]);

  useEffect(() => {
    if (open) {
      setActiveLang("es");
      setSubmitAttempted(false);
      if (service) {
        setData({
          ...service,
          order: service.archived ? "" : service.order || "",
        });
      } else {
        setData({
          id: "service-" + Math.random().toString(36).slice(2, 8),
          icon: "Brain",
          title: { es: "", en: "" },
          description: { es: "", en: "" },
          features: { es: [""], en: [""] },
          whatsapp: "51988496839",
          order: "",
          archived: false,
        });
      }
    }
  }, [open, service]);

  // ✅ Use shared translation hook (DRY principle) - Bidireccional
  // Si estamos en ES, traduce a EN; si estamos en EN, traduce a ES
  const { translating, autoTranslate } = useAutoTranslate(data, setData, {
    simpleFields: ["title", "description"],
    arrayFields: ["features"],
    sourceLang: activeLang, // ✅ Dinámico según idioma activo
    targetLang: activeLang === "es" ? "en" : "es", // ✅ Inverso
  });

  // Estados para modales
  const [modalState, setModalState] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
    details: null,
    onConfirm: null,
    confirmText: "Aceptar",
    showCancel: false,
  });

  // ✅ Helper function para convertir data a props de ServiceCard
  // Debe estar ANTES de useMemo pero puede ser función normal (no hook)
  const toCardProps = (s, lang) => ({
    icon: s.icon,
    title: s.title?.[lang] || "Título del Servicio",
    description: s.description?.[lang] || "Descripción del servicio",
    features: (s.features?.[lang] || []).filter(Boolean).length
      ? s.features?.[lang]
      : ["Característica de ejemplo"],
    whatsapp: s.whatsapp || "51988496839",
    lang: lang, // ✅ Pasar lang para que ServiceCard use messages[lang] directamente
  });

  // ✅ CRÍTICO: useMemo debe ejecutarse SIEMPRE, antes de cualquier return
  // Para cumplir con las reglas de hooks de React
  const previewService = useMemo(
    () => toCardProps(data, activeLang),
    [data, activeLang]
  );

  // ✅ Ahora sí es seguro tener early returns (después de todos los hooks)
  if (!open) return null;

  const hasChanges =
    JSON.stringify(data) !== (service ? JSON.stringify(service) : original);

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) {
      if (isView || !hasChanges) onClose();
      else setConfirmClose(true);
    }
  }

  // Helper para mostrar modales
  const showModal = (
    type,
    title,
    message,
    details = null,
    onConfirm = null,
    confirmText = "Aceptar",
    showCancel = false
  ) => {
    setModalState({
      open: true,
      type,
      title,
      message,
      details,
      onConfirm,
      confirmText,
      showCancel,
    });
  };

  const closeModal = () => {
    setModalState({ ...modalState, open: false });
  };

  const handleModalConfirm = () => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    closeModal();
  };

  function updateLangField(key, val) {
    setData((s) => ({ ...s, [key]: { ...(s[key] || {}), [activeLang]: val } }));
  }

  function updateField(key, val) {
    setData((s) => ({ ...s, [key]: val }));
  }

  // ✅ Auto-translate usando hook compartido con confirmación
  async function handleAutoTranslate() {
    if (isView) return;

    const sourceLang = activeLang;
    const targetLang = activeLang === "es" ? "en" : "es";

    // Verificar que hay contenido en el idioma fuente
    const hasSourceContent =
      (data.title?.[sourceLang] && data.title[sourceLang].trim()) ||
      (data.description?.[sourceLang] && data.description[sourceLang].trim()) ||
      (Array.isArray(data.features?.[sourceLang]) &&
        data.features[sourceLang].some((f) => f && f.trim()));

    if (!hasSourceContent) {
      showModal(
        "info",
        "Campos incompletos",
        `Primero completa los campos en ${sourceLang === "es" ? "Español" : "Inglés"
        } antes de traducir.`,
        null,
        null,
        "Entendido",
        false
      );
      return;
    }

    const result = await autoTranslate();

    if (result.needsConfirmation) {
      // Mostrar confirmación personalizada con modal
      showModal(
        "warning",
        "Confirmar sobrescritura",
        result.message,
        [
          `Traducción: ${sourceLang.toUpperCase()} → ${targetLang.toUpperCase()}`,
          "Algunos campos ya tienen traducciones",
          "Si aceptas, se sobrescribirán con las nuevas traducciones",
        ],
        async () => {
          // Forzar sobrescritura
          const forceResult = await autoTranslate(true);
          if (forceResult.success) {
            showModal(
              "success",
              "¡Traducción completada!",
              forceResult.message,
              null,
              null,
              "Aceptar",
              false
            );
            setActiveLang(targetLang); // Cambiar al idioma destino para revisar
          } else {
            showModal(
              "error",
              "Error de traducción",
              forceResult.message,
              null,
              null,
              "Cerrar",
              false
            );
          }
        },
        "Sobrescribir",
        true
      );
      return; // Importante: salir después de mostrar el modal de confirmación
    }

    if (result.success) {
      showModal(
        "success",
        "¡Traducción completada!",
        result.message,
        null,
        null,
        "Aceptar",
        false
      );
      setActiveLang(targetLang); // Cambiar al idioma destino para revisar
    } else {
      showModal(
        "error",
        "Error de traducción",
        result.message,
        null,
        null,
        "Cerrar",
        false
      );
    }
  }

  // ✅ Show missing translations using shared hook
  function handleShowMissingFields() {
    const missing = detectMissing();
    const targetLang = activeLang === "es" ? "en" : "es";

    if (missing.length === 0) {
      showModal(
        "success",
        "Traducción completa",
        "Todos los campos están traducidos correctamente.",
        null,
        null,
        "Entendido",
        false
      );
    } else {
      showModal(
        "info",
        "Campos pendientes de traducción",
        `Los siguientes campos necesitan traducción (${activeLang.toUpperCase()} → ${targetLang.toUpperCase()}):`,
        missing,
        () => setActiveLang(targetLang),
        "Ver traducciones",
        false
      );
    }
  }

  function submit(e) {
    e.preventDefault();
    if (isView) return onClose();
    const titleEs = (data.title?.es || "").trim();
    const descEs = (data.description?.es || "").trim();
    const featuresEs = (data.features?.es || [])
      .map((x) => (x || "").trim())
      .filter(Boolean);
    const whatsapp = (data.whatsapp || "").trim();
    const orderInvalid = data.order === "" || Number(data.order) < 1;
    const hasMissing =
      !titleEs ||
      !descEs ||
      featuresEs.length === 0 ||
      !whatsapp ||
      orderInvalid;
    if (hasMissing) {
      setSubmitAttempted(true);
      setActiveLang("es");
      const tooltips = {};
      if (!titleEs) tooltips.title = true;
      if (!descEs) tooltips.description = true;
      if (featuresEs.length === 0) tooltips.features = true;
      if (!whatsapp) tooltips.whatsapp = true;
      if (orderInvalid) tooltips.order = true;
      setVisibleTooltips(tooltips);
      setTimeout(() => setVisibleTooltips({}), 1000);
      return;
    }
    const auto = (valEs, valEn) =>
      valEn && valEn !== "" ? valEn : valEs || "";
    const payload = {
      ...data,
      title: {
        es: data.title?.es || "",
        en: auto(data.title?.es, data.title?.en),
      },
      description: {
        es: data.description?.es || "",
        en: auto(data.description?.es, data.description?.en),
      },
      features: {
        es: (data.features?.es || []).filter(Boolean),
        en:
          data.features?.en && data.features.en.length
            ? data.features.en
            : (data.features?.es || []).filter(Boolean),
      },
      order: Number(data.order),
    };
    onSave?.(payload);
    onClose?.();
  }

  // ============== MODO VIEW ==============
  if (mode === "view") {
    return (
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-transparent w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botones de idioma para modo VIEW */}
          <div className="w-full max-w-sm mx-auto mb-4 flex justify-center gap-2">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg border text-sm ${activeLang === "es"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white"
                }`}
              onClick={() => setActiveLang("es")}
            >
              Español (ES)
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg border text-sm ${activeLang === "en"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white"
                }`}
              onClick={() => setActiveLang("en")}
            >
              Inglés (EN)
            </button>
          </div>

          <div className="w-full max-w-sm mx-auto">
            <ServiceCard service={previewService} lang={previewService.lang} />
          </div>
          <div className="text-center mt-4">
            <button
              className="px-3 py-2 border rounded bg-white"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              {mode === "create" ? "Nuevo Servicio" : isView ? "Ver Servicio" : "Editar Servicio"}
            </h2>
          </div>
          {(!isView) ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAutoTranslate}
                disabled={translating}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
              >
                {translating ? "Traduciendo..." : `Traducir a ${activeLang === "es" ? "ingles" : "español"} (${activeLang.toUpperCase()} → ${activeLang === "es" ? "EN" : "ES"})`}
              </button>
              <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
              <span className="text-sm text-gray-500 font-medium whitespace-nowrap hidden sm:block">Idioma a modificar:</span>
              <div className="flex border rounded-lg overflow-hidden bg-white shadow-sm shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveLang("es")}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeLang === "es" ? "bg-[#e83d38] text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  ES
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLang("en")}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeLang === "en" ? "bg-[#e83d38] text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  EN
                </button>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600 ml-2"
                onClick={() =>
                  isView || !hasChanges ? onClose() : setConfirmClose(true)
                }
              >
                <span className="text-2xl font-light">×</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 font-medium whitespace-nowrap hidden sm:block">Idioma actual:</span>
              <div className="flex border rounded-lg overflow-hidden bg-white shadow-sm shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveLang("es")}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeLang === "es" ? "bg-[#e83d38] text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  ES
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLang("en")}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeLang === "en" ? "bg-[#e83d38] text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  EN
                </button>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600 ml-2"
                onClick={onClose}
              >
                <span className="text-2xl font-light">×</span>
              </button>
            </div>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-0">
          <form onSubmit={submit} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <ServiceFormComponent
                tab={activeLang}
                local={data}
                updateLangField={updateLangField}
                updateField={updateField}
                readOnly={isView}
                invalid={submitAttempted ? {
                  title: (data.title?.[activeLang] || "").trim() === "",
                  description: (data.description?.[activeLang] || "").trim() === "",
                  whatsapp: (data.whatsapp || "").trim() === "",
                } : {}}
              />
            </div>

            {/* Botones Flotantes Permanentes */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-4 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-3">
                <button
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  type="button"
                  onClick={() =>
                    isView || !hasChanges ? onClose() : setConfirmClose(true)
                  }
                >
                  {isView ? "Cerrar" : "Cancelar"}
                </button>
                {mode === "edit" && data.archived && (
                  <button
                    type="button"
                    className="px-5 py-2.5 bg-green-50 text-green-700 border border-green-200 font-medium rounded-lg hover:bg-green-100 transition-colors"
                    onClick={() => {
                      onRestore?.({ ...data });
                      onClose?.();
                    }}
                  >
                    Restaurar
                  </button>
                )}
                {!isView && (
                  <button className="px-6 py-2.5 bg-[#e83d38] text-white font-medium rounded-lg shadow-sm hover:bg-[#d63430] hover:shadow transition-all" type="submit">
                    Guardar Cambios
                  </button>
                )}
              </div>
            </div>
          </form>

          <div className="hidden md:flex flex-col p-6 items-center justify-start">
            <h4 className="text-sm font-semibold mb-3 text-gray-700">
              Vista previa
            </h4>
            <div className="w-full max-w-sm">
              <ServiceCard service={previewService} lang={previewService.lang} />
            </div>
          </div>
        </div>



        {confirmClose && (
          <div
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
            onClick={() => setConfirmClose(false)}
          >
            <div
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-lg font-semibold mb-2">
                ¿Cerrar sin guardar?
              </h4>
              <p className="text-gray-700 mb-4">
                Se perderán los cambios no guardados.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-2 border rounded"
                  onClick={() => setConfirmClose(false)}
                >
                  Continuar editando
                </button>
                <button
                  className="px-3 py-2 rounded bg-red-600 text-white"
                  onClick={onClose}
                >
                  Cerrar sin guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación/información estilizado */}
      <ConfirmModal
        open={modalState.open}
        onClose={closeModal}
        onConfirm={handleModalConfirm}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        details={modalState.details}
        confirmText={modalState.confirmText}
        cancelText="Cancelar"
        showCancel={modalState.showCancel}
      />
    </div>
  );
}

