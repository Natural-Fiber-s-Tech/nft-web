import React, { useMemo } from "react";
import {
  ChevronRight,
  Download,
  Zap,
  Camera,
  SquarePlay,
  BarChart3,
  Settings,
  Monitor,
  Microscope,
  Shield,
  Ruler,
  Activity,
  Weight,
} from "lucide-react";
import { useLanguage } from "../../context/hooks/useLanguage";
import { messages } from "../../config/i18n";

// Lightweight presentational components copied/adapted from ProductDetail.jsx
// Minimal icon rendering that accepts lucide component, known string, or iconify "prefix:name"
const localIconMap = {
  BarChart3,
  Settings,
  Monitor,
  Microscope,
  Shield,
  Ruler,
  Activity,
  Weight,
};

const RenderIcon = ({ icon, className = "h-4 w-4 text-red-600" }) => {
  if (!icon) return <BarChart3 className={className} />;
  if (typeof icon === "function")
    return React.createElement(icon, { className });
  if (typeof icon === "string") {
    if (localIconMap[icon]) {
      const I = localIconMap[icon];
      return <I className={className} />;
    }
    if (icon.includes(":")) {
      const [prefix, name] = icon.split(":");
      const url = `https://api.iconify.design/${prefix}/${name}.svg?color=%23ef4444`;
      return <img src={url} alt={icon} className={className} />;
    }
  }
  return <BarChart3 className={className} />;
};

const FeatureCard = ({
  feature,
  editable,
  onEdit,
  onPickIcon,
  getPlaceholder,
}) => {
  const { title, description, icon } = feature || {};
  return (
    <div className="group bg-white p-3 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center gap-2 mb-2 justify-between">
        {editable ? (
          <input
            className={`text-sm font-semibold text-gray-900 w-full bg-transparent ${
              editable ? "border rounded px-2 py-1" : "border-0"
            }`}
            disabled={!editable}
            value={title || ""}
            onChange={(e) => onEdit?.("title", e.target.value)}
            placeholder={getPlaceholder?.("featureTitle") || "Título"}
          />
        ) : (
          <h3 className="text-sm font-semibold text-gray-900 w-full">
            {title}
          </h3>
        )}
        <div className="flex items-center gap-1">
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
            <RenderIcon icon={icon} className="h-4 w-4 text-red-600" />
          </div>
          {editable && (
            <button
              type="button"
              className="text-[11px] px-2 py-1 border rounded"
              onClick={onPickIcon}
              title="Cambiar icono"
            >
              Icono
            </button>
          )}
        </div>
      </div>
      {editable ? (
        <textarea
          className={`text-gray-600 text-xs leading-relaxed w-full bg-transparent ${
            editable ? "border rounded px-2 py-1" : "border-0"
          }`}
          disabled={!editable}
          value={description || ""}
          onChange={(e) => onEdit?.("description", e.target.value)}
          placeholder={
            getPlaceholder?.("featureDescription") || "Descripción opcional"
          }
        />
      ) : (
        <p className="text-gray-600 text-xs leading-relaxed">{description}</p>
      )}
    </div>
  );
};

const SpecRow = ({ label, value, editable, onEditLabel, onEditValue }) => {
  // Detectar si es una key temporal
  const isTempKey = label && label.startsWith("__temp_");
  const displayLabel = isTempKey ? "" : label;

  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0 gap-2">
      {editable ? (
        <input
          className={`font-medium text-gray-700 bg-transparent ${
            editable ? "border rounded px-2 py-1 w-40" : "border-0"
          }`}
          disabled={!editable}
          value={displayLabel}
          onChange={(e) => onEditLabel?.(e.target.value)}
          placeholder="Nombre (ej: Peso)"
        />
      ) : (
        <span className="font-medium text-gray-700 w-40">{displayLabel}</span>
      )}
      {editable ? (
        <input
          className={`text-gray-900 text-right bg-transparent flex-1 ${
            editable ? "border rounded px-2 py-1" : "border-0"
          }`}
          disabled={!editable}
          value={value}
          onChange={(e) => onEditValue?.(e.target.value)}
          placeholder="Valor (ej: 5 Kg)"
        />
      ) : (
        <span className="text-gray-900 text-right flex-1">{value}</span>
      )}
    </div>
  );
};

const CapabilityItem = ({ text, editable, onEdit }) => (
  <div className="flex items-start space-x-3">
    <ChevronRight className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
    {editable ? (
      <input
        className={`text-gray-700 leading-relaxed bg-transparent flex-1 ${
          editable ? "border rounded px-2 py-1" : "border-0"
        }`}
        disabled={!editable}
        value={text}
        onChange={(e) => onEdit?.(e.target.value)}
      />
    ) : (
      <span className="text-gray-700 leading-relaxed flex-1">{text}</span>
    )}
  </div>
);

const MediaCard = ({
  product,
  editable,
  onPickImage,
  onDropImage,
  onAddAdditional,
  onRemoveAdditional,
  onEditYouTube,
  getText, // Añadido para manejo de textos bilingües
  getPlaceholder, // Añadido para placeholders
}) => {
  const mediaItems = useMemo(() => {
    const items = [];
    if (product.youtubeVideo)
      items.push({ type: "video", url: product.youtubeVideo });
    if (product.image) items.push({ type: "image", url: product.image });
    if (Array.isArray(product.additionalImages))
      product.additionalImages.forEach((url) =>
        items.push({ type: "image", url })
      );
    return items.length ? items : [{ type: "image", url: product.image }];
  }, [product]);

  const first = mediaItems[0];
  const getYouTubeId = (url) => {
    const m = (url || "").match(/(?:v=|be\/)\??([^&#\s]{11})/);
    return m ? m[1] : null;
  };

  return (
    <div className="bg-white rounded-2xl p-6 pb-3 shadow-lg h-full">
      <div
        className="flex-grow flex items-center justify-center mb-4 rounded-2xl overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.12), rgba(255,255,255,0.04) 45%, rgba(0,0,0,0.02) 80%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -20px 60px rgba(0,0,0,0.25)",
          border: "1px solid var(--glass-border)",
          WebkitBackdropFilter: "blur(8px) saturate(140%)",
          backdropFilter: "blur(8px) saturate(140%)",
        }}
        onDragOver={(e) => editable && e.preventDefault()}
        onDrop={(e) => editable && onDropImage?.(e)}
        onClick={() => editable && onPickImage?.()}
        title={
          editable ? "Haz clic o arrastra para cambiar imagen/video" : undefined
        }
      >
        {first?.type === "video" && first.url ? (
          <div className="w-full aspect-video rounded-xl overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(first.url)}`}
              title={getText("name")}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="w-full aspect-video rounded-xl overflow-hidden flex items-center justify-center">
            <img
              src={first?.url || "/assets/images/logo/logo_NFT.png"}
              alt={getText("name")}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = "/assets/images/logo/logo_NFT.png";
              }}
            />
          </div>
        )}
      </div>
      {editable && (
        <div className="space-y-3">
          <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
            {first?.type === "video" ? (
              <SquarePlay className="h-4 w-4" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            Clic o arrastra para cambiar
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">YouTube URL</label>
            <input
              className="flex-1 border rounded px-2 py-1 text-xs"
              placeholder={getPlaceholder?.("youtubeUrl") || "URL del video"}
              value={product.youtubeVideo || ""}
              onChange={(e) => onEditYouTube?.(e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600">
                Imágenes adicionales
              </span>
              <button
                type="button"
                className="text-xs px-2 py-1 border rounded"
                onClick={onAddAdditional}
              >
                + Agregar imagen
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(product.additionalImages || []).map((url, idx) => (
                <div
                  key={idx}
                  className="relative border rounded overflow-hidden group"
                  draggable={editable}
                  onDragStart={(e) =>
                    editable &&
                    e.dataTransfer.setData("text/plain", String(idx))
                  }
                  onDragOver={(e) => editable && e.preventDefault()}
                  onDrop={(e) => {
                    if (!editable) return;
                    const from = Number(e.dataTransfer.getData("text/plain"));
                    const to = idx;
                    if (!Number.isNaN(from) && from !== to)
                      onRemoveAdditional?.(from, to, true);
                  }}
                >
                  <img
                    src={url}
                    alt={`img-${idx}`}
                    className="w-full h-16 object-cover"
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-white/80 border opacity-0 group-hover:opacity-100"
                    onClick={() => onRemoveAdditional?.(idx)}
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple carousel for public view (video + images)
const PublicMediaCarousel = ({ product, getText }) => {
  const [idx, setIdx] = React.useState(0);
  const items = useMemo(() => {
    const res = [];
    if (product.youtubeVideo)
      res.push({ type: "video", url: product.youtubeVideo });
    if (product.image) res.push({ type: "image", url: product.image });
    if (Array.isArray(product.additionalImages))
      res.push(
        ...product.additionalImages.map((u) => ({ type: "image", url: u }))
      );
    return res.length ? res : [{ type: "image", url: product.image }];
  }, [product]);
  const total = items.length;
  const getYouTubeId = (url) => {
    const m = (url || "").match(
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return m ? m[1] : null;
  };
  const cur = items[idx] || {};
  return (
    <div className="relative h-full flex flex-col">
      <div
        className="flex-grow flex items-center justify-center mb-4 rounded-2xl overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.12), rgba(255,255,255,0.04) 45%, rgba(0,0,0,0.02) 80%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -20px 60px rgba(0,0,0,0.25)",
          border: "1px solid var(--glass-border)",
          WebkitBackdropFilter: "blur(8px) saturate(140%)",
          backdropFilter: "blur(8px) saturate(140%)",
        }}
      >
        {cur.type === "video" ? (
          <div className="w-full aspect-video rounded-xl overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(cur.url)}`}
              title={getText("name")}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="w-full aspect-video rounded-xl overflow-hidden flex items-center justify-center">
            <img
              src={cur.url || "/assets/images/logo/logo_NFT.png"}
              alt={getText("name")}
              className="w-full h-full object-contain"
              onError={(e) =>
                (e.currentTarget.src = "/assets/images/logo/logo_NFT.png")
              }
            />
          </div>
        )}
      </div>
      {total > 1 && (
        <div className="flex justify-center space-x-2 mt-0">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-3 h-3 rounded-full ${
                i === idx ? "bg-red-600" : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ProductDetailTemplate({
  product,
  adminLang, // ✅ NEW: Idioma del admin para placeholders
  labels = {
    datasheetES: "Ficha ES",
    datasheetEN: "Ficha EN",
    mainFeatures: "Características Principales",
    technicalSpecs: "Especificaciones Técnicas",
    capabilities: "Capacidades",
  },
  editable = false,
  onEdit,
  onPick,
  onDrop,
  onPickIcon,
  onGenerate,
  generating = false,
  invalid,
  showHints = false,
}) {
  if (!product) return null;

  const { lang } = useLanguage();

  // Usar adminLang si está disponible (admin CMS), sino usar lang del contexto (web pública)
  const currentLang = adminLang || lang;

  // Helper para obtener texto en idioma correcto
  const getText = (field) => {
    if (!product[field]) return "";
    if (typeof product[field] === "string") return product[field];
    return product[field][currentLang] || product[field].es || "";
  };

  // Helper para placeholders dinámicos
  const getPlaceholder = (key) => {
    return messages[currentLang]?.admin?.products?.placeholders?.[key] || "";
  };

  // 🔥 Replicar lógica de Features: product ya viene filtrado por idioma desde productForTemplate
  const features = Array.isArray(product.features) ? product.features : [];

  // 🔥 Specifications: product.specifications ya viene filtrado por idioma [tab] desde productForTemplate
  // En modo editable (admin): productForTemplate ya extrajo solo [tab]
  // En modo público: puede venir con estructura bilingüe, extraer por currentLang
  const specsObject = (() => {
    if (!product.specifications) return {};

    // Si editable, product.specifications ya viene como objeto plano filtrado por [tab]
    if (editable) {
      return product.specifications;
    }

    // Si NO editable (web pública), puede tener estructura bilingüe
    if (product.specifications?.es || product.specifications?.en) {
      return product.specifications[currentLang] || {};
    }

    // Legacy: objeto plano
    return product.specifications;
  })();
  const specsEntries = Object.entries(specsObject);

  const capabilities = Array.isArray(product.capabilities)
    ? product.capabilities
    : [];

  const handleEdit = (path, value) => onEdit?.(path, value);

  return (
    <div className="min-h-[60vh]">
      <div className="grid-ctx mb-6">
        <div className="span-12">
          <div className="mb-4">
            <div className="flex items-center justify-left mb-3 gap-3 flex-wrap">
              {editable ? (
                <div className="relative">
                  <input
                    className={`text-3xl lg:text-4xl font-bold text-gray-900 bg-transparent border rounded px-2 py-1 ${
                      invalid?.name ? "border-red-500 ring-1 ring-red-300" : ""
                    }`}
                    value={product.name || ""}
                    onChange={(e) => handleEdit(["name"], e.target.value)}
                    placeholder={getPlaceholder("name")}
                    data-field="name"
                  />
                  {showHints && invalid?.name && (
                    <div className="absolute -top-6 left-0 bg-red-600 text-white text-xs rounded px-2 py-0.5 shadow">
                      Campo obligatorio
                    </div>
                  )}
                </div>
              ) : (
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  {getText("name")}
                </h1>
              )}
              {editable ? (
                <div className="relative">
                  <input
                    className={`bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full border ${
                      invalid?.category
                        ? "border-red-500 ring-1 ring-red-300"
                        : ""
                    }`}
                    value={product.category || ""}
                    onChange={(e) => handleEdit(["category"], e.target.value)}
                    placeholder={getPlaceholder("category")}
                    data-field="category"
                  />
                  {showHints && invalid?.category && (
                    <div className="absolute -top-6 left-0 bg-red-600 text-white text-xs rounded px-2 py-0.5 shadow">
                      Campo obligatorio
                    </div>
                  )}
                </div>
              ) : (
                <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
                  {getText("category")}
                </span>
              )}
            </div>
            {editable ? (
              <div className="relative">
                <input
                  className={`text-lg text-red-600 font-medium mb-3 bg-transparent border rounded px-2 py-1 w-full ${
                    invalid?.tagline ? "border-red-500 ring-1 ring-red-300" : ""
                  }`}
                  value={product.tagline || ""}
                  onChange={(e) => handleEdit(["tagline"], e.target.value)}
                  placeholder={getPlaceholder("tagline")}
                  data-field="tagline"
                />
                {showHints && invalid?.tagline && (
                  <div className="absolute -top-6 left-0 bg-red-600 text-white text-xs rounded px-2 py-0.5 shadow">
                    Campo obligatorio
                  </div>
                )}
              </div>
            ) : (
              <p className="text-lg text-red-600 font-medium mb-3">
                {getText("tagline")}
              </p>
            )}
            {editable ? (
              <div className="relative">
                <textarea
                  className={`text-gray-700 leading-relaxed mb-4 w-full bg-transparent border rounded px-2 py-2 ${
                    invalid?.description
                      ? "border-red-500 ring-1 ring-red-300"
                      : ""
                  }`}
                  rows={4}
                  value={product.description || ""}
                  onChange={(e) => handleEdit(["description"], e.target.value)}
                  placeholder={getPlaceholder("description")}
                  data-field="description"
                />
                {showHints && invalid?.description && (
                  <div className="absolute -top-6 left-0 bg-red-600 text-white text-xs rounded px-2 py-0.5 shadow">
                    Campo obligatorio
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-700 leading-relaxed mb-4">
                {getText("description")}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/51988496839?text=${encodeURIComponent(
                  `Hola, estoy interesado en el producto: ${getText("name")}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-3 px-6 rounded-xl opacity-80 cursor-hand hover:opacity-100 transition-opacity hover:shadow-lg hover:-translate-y-0.5"
              >
                <Zap className="h-5 w-5" />
                WhatsApp
              </a>
              <div className="flex gap-2 flex-wrap items-center">
                <div className="flex items-center gap-2">
                  <a
                    href={product.technicalSheets?.es || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (editable) {
                        e.preventDefault();
                        onPick?.("datasheet-es");
                      }
                    }}
                    onDragOver={(e) => editable && e.preventDefault()}
                    onDrop={(e) => editable && onDrop?.("datasheet-es", e)}
                    className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl border border-gray-200 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    {labels.datasheetES}
                  </a>
                  {editable && (
                    <button
                      type="button"
                      className={`text-xs px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                        product.technicalSheets?.es
                          ? "bg-green-500 text-white shadow-lg shadow-green-500/50 hover:bg-green-600 hover:shadow-xl hover:-translate-y-0.5"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => onPick?.("datasheet-es")}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => onDrop?.("datasheet-es", e)}
                      title={
                        product.technicalSheets?.es
                          ? "PDF cargado - Click para cambiar"
                          : "Cargar Ficha ES"
                      }
                    >
                      {product.technicalSheets?.es ? "✓ Cargado" : "Vacío"}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={product.technicalSheets?.en || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (editable) {
                        e.preventDefault();
                        onPick?.("datasheet-en");
                      }
                    }}
                    onDragOver={(e) => editable && e.preventDefault()}
                    onDrop={(e) => editable && onDrop?.("datasheet-en", e)}
                    className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl border border-gray-200 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    {labels.datasheetEN}
                  </a>
                  {editable && (
                    <button
                      type="button"
                      className={`text-xs px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                        product.technicalSheets?.en
                          ? "bg-green-500 text-white shadow-lg shadow-green-500/50 hover:bg-green-600 hover:shadow-xl hover:-translate-y-0.5"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => onPick?.("datasheet-en")}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => onDrop?.("datasheet-en", e)}
                      title={
                        product.technicalSheets?.en
                          ? "PDF cargado - Click para cambiar"
                          : "Cargar Ficha EN"
                      }
                    >
                      {product.technicalSheets?.en ? "✓ Cargado" : "Vacío"}
                    </button>
                  )}
                </div>
                {editable && onGenerate && (
                  <button
                    type="button"
                    onClick={onGenerate}
                    disabled={
                      generating ||
                      !(
                        product.technicalSheets?.es ||
                        product.technicalSheets?.en
                      )
                    }
                    className={`inline-flex items-center gap-2 font-semibold py-3 px-4 rounded-xl border transition-all duration-200 ${
                      generating ||
                      !(
                        product.technicalSheets?.es ||
                        product.technicalSheets?.en
                      )
                        ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-transparent shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    }`}
                    title={
                      !(product.technicalSheets?.es || product.technicalSheets?.en)
                        ? "Debes cargar al menos un PDF para generar contenido con IA"
                        : "Generar contenido automáticamente con IA basado en el PDF"
                    }
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                        Generando...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generar IA
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid-ctx mb-6">
        <div className="span-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            {labels.mainFeatures}
          </h2>
        </div>
        <div className="span-12 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              draggable={editable}
              onDragStart={(e) => {
                if (!editable) return;
                e.dataTransfer.setData("text/plain", String(i));
              }}
              onDragOver={(e) => editable && e.preventDefault()}
              onDrop={(e) => {
                if (!editable) return;
                const from = Number(e.dataTransfer.getData("text/plain"));
                const to = i;
                if (!Number.isNaN(from) && from !== to)
                  handleEdit(["features", "reorder"], { from, to });
              }}
            >
              <FeatureCard
                feature={f}
                editable={editable}
                onEdit={(field, val) => handleEdit(["features", i, field], val)}
                onPickIcon={() => onPickIcon?.(i)}
                getPlaceholder={getPlaceholder}
              />
            </div>
          ))}
          {editable && (
            <div className="flex items-center gap-2">
              <button
                className="text-sm px-3 py-2 border rounded"
                onClick={() => handleEdit(["features", "add"], "")}
              >
                + Agregar característica
              </button>
              <button
                className="text-sm px-3 py-2 border rounded"
                onClick={() => handleEdit(["features", "remove", "last"], "")}
              >
                − Eliminar última característica
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Specs (independiente por idioma) + Media (compartido) */}
      <div className="grid-ctx mb-6">
        <div className="span-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {/* 📊 Specifications - Independiente por idioma [tab] */}
            <div className="bg-white rounded-2xl p-6 shadow-lg h-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {labels.technicalSpecs}
              </h3>
              <div className="space-y-1">
                {specsEntries.map(([key, value], idx) => (
                  <SpecRow
                    key={idx}
                    label={key}
                    value={value}
                    editable={editable}
                    onEditLabel={(val) => handleEdit(["specsLabel", key], val)}
                    onEditValue={(val) => handleEdit(["specsValue", key], val)}
                  />
                ))}
                {editable && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      className="text-sm px-3 py-2 border rounded"
                      onClick={() => handleEdit(["specs", "add"], "")}
                    >
                      + Agregar especificación
                    </button>
                    <button
                      className="text-sm px-3 py-2 border rounded"
                      onClick={() =>
                        handleEdit(["specs", "remove", "last"], "")
                      }
                    >
                      − Eliminar última
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 🖼️ Media - Compartido entre idiomas (imagen/video es universal) */}
            <div>
              {editable ? (
                <MediaCard
                  product={product}
                  editable={editable}
                  onPickImage={() => onPick?.("image")}
                  onDropImage={(e) => onDrop?.("image", e)}
                  onAddAdditional={() => onPick?.("additional")}
                  onRemoveAdditional={(from, to, reorder) => {
                    if (reorder)
                      return handleEdit(["additionalImages", "reorder"], {
                        from,
                        to,
                      });
                    return handleEdit(["additionalImages", "remove", from], "");
                  }}
                  onEditYouTube={(val) => handleEdit(["youtubeVideo"], val)}
                  getText={getText}
                  getPlaceholder={getPlaceholder}
                />
              ) : (
                <PublicMediaCarousel product={product} getText={getText} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="grid-ctx mb-8">
        <div className="span-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {labels.capabilities}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {capabilities.map((c, idx) => (
                <CapabilityItem
                  key={idx}
                  text={c}
                  editable={editable}
                  onEdit={(val) => handleEdit(["capabilities", idx], val)}
                />
              ))}
            </div>
            {editable && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  className="text-sm px-3 py-2 border rounded"
                  onClick={() => handleEdit(["capabilities", "add"], "")}
                >
                  + Agregar capacidad
                </button>
                <button
                  className="text-sm px-3 py-2 border rounded"
                  onClick={() =>
                    handleEdit(["capabilities", "remove", "last"], "")
                  }
                >
                  − Eliminar última
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
