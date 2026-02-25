import React, { useEffect, useMemo, useState } from "react";
import {
  RenderIcon,
  localIconMap,
  suggestedIconNames,
} from "../common/IconUtils";
import { ServiceCard } from "../../../../components/sections/Services";
import { useAutoTranslate } from "../../hooks/useAutoTranslate";
import ConfirmModal from "../common/ConfirmModal";

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
        `Primero completa los campos en ${
          sourceLang === "es" ? "Español" : "Inglés"
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
              className={`px-3 py-1.5 rounded-lg border text-sm ${
                activeLang === "es"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white"
              }`}
              onClick={() => setActiveLang("es")}
            >
              Español (ES)
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg border text-sm ${
                activeLang === "en"
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
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h3 className="text-xl font-semibold">
            {mode === "create"
              ? "Crear Servicio"
              : mode === "edit"
              ? "Editar Servicio"
              : "Ver Servicio"}
          </h3>

          {/* Botones de idioma inline con el título */}
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg border text-sm ${
                  activeLang === "es"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white"
                }`}
                onClick={() => setActiveLang("es")}
              >
                Español (ES)
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg border text-sm ${
                  activeLang === "en"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white"
                }`}
                onClick={() => setActiveLang("en")}
              >
                Inglés (EN)
              </button>
            </div>

            {/* ✅ Botones de traducción - Dinámicos con dirección bidireccional */}
            {!isView &&
              (() => {
                // const missingTranslations = detectMissing();
                // const hasMissingTranslations = missingTranslations.length > 0;
                const targetLang = activeLang === "es" ? "EN" : "ES";

                return (
                  <div className="flex gap-2">
                    {/* Badge desactivado temporalmente (no funciona al 100%)
                    {hasMissingTranslations && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded border border-yellow-300 font-medium">
                        {missingTranslations.length} campo
                        {missingTranslations.length > 1 ? "s" : ""} →{" "}
                        {targetLang}
                      </span>
                    )}
                    */}

                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                        translating
                          ? "bg-gray-300 text-gray-600 cursor-wait"
                          : "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                      }`}
                      onClick={handleAutoTranslate}
                      disabled={translating}
                      title={`Traducir automáticamente ${activeLang.toUpperCase()} → ${targetLang}`}
                    >
                      {translating ? (
                        <>
                          <span className="inline-block animate-spin mr-1">
                            ⟳
                          </span>
                          Traduciendo...
                        </>
                      ) : (
                        `🌐 Traducir a ${targetLang}`
                      )}
                    </button>
                  </div>
                );
              })()}

            <button
              className="text-gray-500 text-2xl"
              onClick={() =>
                isView || !hasChanges ? onClose() : setConfirmClose(true)
              }
            >
              ×
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-0">
          <form onSubmit={submit} className="p-6 space-y-4">
            {/* ✅ Contenedor compacto de ID y Orden - Layout inline */}
            <div className="bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200">
              <div className="flex items-center gap-6">
                {/* ID - flex-1 con label inline */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    ID
                  </label>
                  <div
                    className="flex-1 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono text-sm truncate"
                    title={data.id}
                  >
                    {data.id || "Generando..."}
                  </div>
                </div>

                {/* Orden - Ancho fijo con label inline */}
                <div className="relative flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Orden *
                  </label>
                  <input
                    type="number"
                    min={1}
                    disabled={isView}
                    className={`w-20 px-3 py-1.5 border rounded text-sm ${
                      submitAttempted &&
                      (data.order === "" || Number(data.order) < 1)
                        ? "border-red-500 bg-white"
                        : "border-gray-300 bg-white"
                    }`}
                    placeholder="Orden"
                    value={data.order}
                    onChange={(e) => updateField("order", e.target.value)}
                  />
                  {visibleTooltips.order && (
                    <div className="absolute left-0 top-full mt-1 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
                      Campo Obligatorio
                    </div>
                  )}
                </div>
              </div>
            </div>{" "}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Icono</label>
              <div className="flex items-center gap-3">
                <div className="flex-grow flex items-center gap-3 bg-gray-50 border rounded p-2">
                  <RenderIcon
                    iconName={data.icon}
                    className="w-6 h-6 text-red-600"
                  />
                  <span className="text-sm text-gray-700 truncate">
                    {data.icon}
                  </span>
                </div>
                {!isView && (
                  <button
                    type="button"
                    className="px-3 py-2 rounded border bg-red-600/10 text-red-700 border-red-300"
                    onClick={() => setShowIconPicker(true)}
                  >
                    Buscar
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <label className="block text-xs text-gray-600 mb-1">
                Título ({activeLang.toUpperCase()})
              </label>
              <input
                disabled={isView}
                className={`border px-2 py-2 rounded w-full ${
                  submitAttempted &&
                  (data.title?.es || "").trim() === "" &&
                  activeLang === "es"
                    ? "border-red-500"
                    : ""
                }`}
                value={data.title?.[activeLang] || ""}
                onChange={(e) => updateLangField("title", e.target.value)}
              />
              {visibleTooltips.title && activeLang === "es" && (
                <div className="absolute left-0 top-full mt-1 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
                  Campo Obligatorio
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-xs text-gray-600 mb-1">
                Descripción ({activeLang.toUpperCase()})
              </label>
              <textarea
                disabled={isView}
                className={`border px-2 py-2 rounded w-full h-24 ${
                  submitAttempted &&
                  activeLang === "es" &&
                  (data.description?.es || "").trim() === ""
                    ? "border-red-500"
                    : ""
                }`}
                value={data.description?.[activeLang] || ""}
                onChange={(e) => updateLangField("description", e.target.value)}
              />
              {visibleTooltips.description && activeLang === "es" && (
                <div className="absolute left-0 top-full mt-1 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
                  Campo Obligatorio
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-xs text-gray-600 mb-1">
                Características ({activeLang.toUpperCase()}) — una por línea
              </label>
              <textarea
                disabled={isView}
                className={`border px-2 py-2 rounded w-full h-28 ${
                  submitAttempted &&
                  activeLang === "es" &&
                  (data.features?.es || [])
                    .map((x) => (x || "").trim())
                    .filter(Boolean).length === 0
                    ? "border-red-500"
                    : ""
                }`}
                value={(data.features?.[activeLang] || []).join("\n")}
                onChange={(e) =>
                  updateLangField("features", e.target.value.split("\n"))
                }
              />
              {visibleTooltips.features && activeLang === "es" && (
                <div className="absolute left-0 top-full mt-1 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
                  Campo Obligatorio
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-xs text-gray-600 mb-1">
                WhatsApp
              </label>
              <input
                disabled={isView}
                className={`border rounded w-full px-2 py-2 ${
                  submitAttempted && (data.whatsapp || "").trim() === ""
                    ? "border-red-500"
                    : ""
                }`}
                value={data.whatsapp || ""}
                onChange={(e) => updateField("whatsapp", e.target.value)}
              />
              {visibleTooltips.whatsapp && (
                <div className="absolute left-0 top-full mt-1 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
                  Campo Obligatorio
                </div>
              )}
            </div>
            <div className="pt-2 flex gap-2">
              {!isView && (
                <button className="btn-cta px-5 py-2" type="submit">
                  Guardar Cambios
                </button>
              )}
              {mode === "edit" && data.archived && (
                <button
                  type="button"
                  className="px-3 py-2 rounded border bg-green-600/10 text-green-700 border-green-300"
                  onClick={() => {
                    const invalid = data.order === "" || Number(data.order) < 1;
                    if (invalid) {
                      setSubmitAttempted(true);
                      setVisibleTooltips({ order: true });
                      setTimeout(() => setVisibleTooltips({}), 1000);
                      return;
                    }
                    onRestore?.({ ...data, order: Number(data.order) });
                    onClose?.();
                  }}
                >
                  Restaurar
                </button>
              )}
              <button
                className="px-3 py-2 border rounded"
                type="button"
                onClick={() =>
                  isView || !hasChanges ? onClose() : setConfirmClose(true)
                }
              >
                {isView ? "Cerrar" : "Cancelar"}
              </button>
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

        {showIconPicker && (
          <IconPicker
            onSelect={(name) => {
              setData((s) => ({ ...s, icon: name }));
              setShowIconPicker(false);
            }}
            onClose={() => setShowIconPicker(false)}
          />
        )}

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

function IconPicker({ onSelect, onClose }) {
  const [tab, setTab] = useState("local");
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 400);
    return () => clearTimeout(id);
  }, [term]);

  useEffect(() => {
    let active = true;
    async function search() {
      if (tab !== "web" || debounced.length < 3) return setResults([]);
      setLoading(true);
      try {
        const q = encodeURIComponent(debounced);
        const res = await fetch(`https://api.iconify.design/search?query=${q}`);
        const data = await res.json();
        if (!active) return;
        const items = Array.isArray(data?.icons) ? data.icons : [];
        setResults(items.map((x) => x));
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    search();
    return () => {
      active = false;
    };
  }, [tab, debounced]);

  const localIcons = Object.keys(localIconMap);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900/90 rounded-xl p-5 w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2">
            <button
              className={`px-3 py-1.5 rounded border ${
                tab === "local"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white"
              }`}
              onClick={() => setTab("local")}
            >
              Iconos Locales
            </button>
            <button
              className={`px-3 py-1.5 rounded border ${
                tab === "web"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white"
              }`}
              onClick={() => setTab("web")}
            >
              Buscar en la Web
            </button>
          </div>
          <button className="text-gray-500" onClick={onClose}>
            ×
          </button>
        </div>

        {tab === "web" && (
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar icono en inglés (ejm: database, brain)"
            className="w-full border rounded px-3 py-2 mb-3"
          />
        )}

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-72 overflow-y-auto pr-1">
          {tab === "local" &&
            (localIcons.length ? localIcons : suggestedIconNames).map(
              (name) => (
                <button
                  key={name}
                  onClick={() => onSelect(name)}
                  className="p-2 rounded hover:bg-red-200 flex flex-col items-center gap-1"
                >
                  <RenderIcon
                    iconName={name}
                    className="w-6 h-6 text-red-600"
                  />
                  <span className="text-[11px] text-gray-600 truncate w-full text-center">
                    {name}
                  </span>
                </button>
              )
            )}
          {tab === "web" &&
            (loading ? (
              <div className="col-span-full text-center text-sm text-gray-600">
                Buscando…
              </div>
            ) : results.length ? (
              results.slice(0, 60).map((full) => (
                <button
                  key={full}
                  onClick={() => onSelect(full)}
                  className="p-2 rounded hover:bg-red-200 flex flex-col items-center gap-1"
                >
                  <RenderIcon
                    iconName={full}
                    className="w-6 h-6 text-red-600"
                  />
                  <span className="text-[11px] text-gray-600 truncate w-full text-center">
                    {full.split(":").pop()}
                  </span>
                </button>
              ))
            ) : (
              <div className="col-span-full text-center text-sm text-gray-600">
                Sin resultados
              </div>
            ))}
        </div>

        <div className="mt-4 pt-3 border-t">
          <button className="w-full py-2 rounded border" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
