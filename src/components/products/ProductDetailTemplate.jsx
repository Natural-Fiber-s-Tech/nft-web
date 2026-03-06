import React, { useMemo } from "react";
import { icons, Zap, Download, SquarePlay, Camera, ChevronRight } from "lucide-react";
import { useLanguage } from "../../context/hooks/useLanguage";
import { messages } from "../../config/i18n";

// Lightweight presentational components copied/adapted from ProductDetail.jsx
// Minimal icon rendering that accepts lucide component, known string, or iconify "prefix:name"
const localIconMap = {
    BarChart3: icons.BarChart3,
    Settings: icons.Settings,
    Monitor: icons.Monitor,
    Microscope: icons.Microscope,
    Shield: icons.Shield,
    Ruler: icons.Ruler,
    Activity: icons.Activity,
    Weight: icons.Weight,
};

const RenderIcon = ({ icon, className = "h-4 w-4 text-red-600" }) => {
    if (!icon) return <icons.Settings className={className} />;
    if (typeof icon === "function")
        return React.createElement(icon, { className });
    if (typeof icon === "string") {
        if (localIconMap[icon]) {
            const I = localIconMap[icon];
            return <I className={className} />;
        }
        const IconCmp = icons[icon];
        if (IconCmp) {
            return <IconCmp className={className} />;
        }
        if (icon.includes(":")) {
            const [prefix, name] = icon.split(":");
            const url = `https://api.iconify.design/${prefix}/${name}.svg?color=%23ef4444`;
            return <img src={url} alt={icon} className={className} />;
        }
    }
    return <icons.Settings className={className} />;
};

const FeatureCard = ({
    feature,
    editable,
    onEdit,
    onPickIcon,
    getPlaceholder,
    currentLang
}) => {
    const title = feature[`title_${currentLang}`] || feature.title_es || feature.title;
    const description = feature[`description_${currentLang}`] || feature.description_es || feature.description;
    const icon = feature.icon;

    return (
        <div className="group bg-white p-3 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-2 justify-between">
                {editable ? (
                    <input
                        className={`text-sm font-semibold text-gray-900 w-full bg-transparent ${editable ? "border rounded px-2 py-1" : "border-0"
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
                <div className="flex items-center gap-1 shrink-0">
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
                    className={`text-gray-600 text-xs leading-relaxed w-full bg-transparent flex-grow ${editable ? "border rounded px-2 py-1" : "border-0"
                        }`}
                    disabled={!editable}
                    value={description || ""}
                    onChange={(e) => onEdit?.("description", e.target.value)}
                    placeholder={
                        getPlaceholder?.("featureDescription") || "Descripción opcional"
                    }
                />
            ) : (
                <p className="text-gray-600 text-xs leading-relaxed flex-grow">{description}</p>
            )}
        </div>
    );
};

const SpecRow = ({ label, value, editable, onEditLabel, onEditValue }) => {
    const isTempKey = label && label.startsWith("__temp_");
    const displayLabel = isTempKey ? "" : label;

    return (
        <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0 gap-2">
            {editable ? (
                <input
                    className={`font-medium text-gray-700 bg-transparent ${editable ? "border rounded px-2 py-1 w-40" : "border-0"
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
                    className={`text-gray-900 text-right bg-transparent flex-1 ${editable ? "border rounded px-2 py-1" : "border-0"
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
        <icons.ChevronRight className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        {editable ? (
            <input
                className={`text-gray-700 leading-relaxed bg-transparent flex-1 ${editable ? "border rounded px-2 py-1" : "border-0"
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

// Old legacy components (MediaCard) removed due to Flat Schema Migration

// Product Media Carousel Component
const PublicMediaCarousel = ({ product, getText }) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    // Get media items (video first, then images)
    const getMediaItems = React.useMemo(() => {
        const items = [];

        // Add YouTube video if available (soporta Schema Flat 'video' y legacy)
        if (product.video || product.youtubeVideo) {
            items.push({
                type: "video",
                url: product.video || product.youtubeVideo,
                title: `Video de ${getText("name")}`,
            });
        }

        // Add main product image
        const mainImage = product.photos || product.image;
        if (mainImage) {
            items.push({
                type: "image",
                url: mainImage,
                title: getText("name"),
                alt: getText("name"),
            });
        }

        // Add additional gallery images
        const additionalImages = product.gallery || product.additionalImages || [];
        if (Array.isArray(additionalImages) && additionalImages.length > 0) {
            additionalImages.forEach((url, index) => {
                if (url) {
                    items.push({
                        type: "image",
                        url,
                        title: `${getText("name")} - Galería ${index + 1}`,
                        alt: `${getText("name")} - Galería ${index + 1}`,
                    });
                }
            });
        }

        return items.length ? items : [{ type: "image", url: mainImage, title: getText("name"), alt: getText("name") }];
    }, [product]);

    const mediaItems = getMediaItems;
    const totalItems = mediaItems.length;

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % totalItems);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    // Get YouTube video ID from URL
    const getYouTubeVideoId = (url) => {
        const regex =
            /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = (url || "").match(regex);
        return match ? match[1] : null;
    };

    const currentItem = mediaItems[currentIndex] || {};

    return (
        <div className="relative h-full flex flex-col">
            {/* Main Media Display with spotlight background */}
            <div
                className="flex-grow flex items-center justify-center mb-4 min-h-80 rounded-2xl overflow-hidden"
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
                {currentItem.type === "video" ? (
                    <div className="w-full h-full max-h-80 rounded-xl overflow-hidden">
                        <iframe
                            src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                                currentItem.url
                            )}`}
                            title={currentItem.title}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                ) : (
                    <img
                        src={currentItem.url || "/assets/images/logo/logo_NFT.png"}
                        alt={currentItem.alt}
                        className="w-full h-auto rounded-xl max-h-80 object-contain"
                        onError={(e) => {
                            e.target.src = "/assets/images/logo/logo_NFT.png";
                        }}
                    />
                )}
            </div>

            {/* Navigation Controls */}
            {totalItems > 1 && (
                <>
                    {/* Previous/Next Buttons */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 z-10"
                    >
                        <ChevronRight className="h-5 w-5 text-gray-600 rotate-180" />
                    </button>

                    <button
                        onClick={nextSlide}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 z-10"
                    >
                        <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>

                    {/* Dots Indicator */}
                    <div className="flex justify-center space-x-2 mt-0">
                        {mediaItems.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-200 ${index === currentIndex
                                    ? "bg-red-600"
                                    : "bg-gray-300 hover:bg-gray-400"
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Media Type Indicator */}
                    <div className="text-center mt-3">
                        <span className="text-xs text-gray-500 flex items-center justify-center gap-1">
                            {currentItem.type === "video" ? (
                                <SquarePlay className="h-6 w-6" />
                            ) : (
                                <Camera className="h-6 w-6" />
                            )}
                            {currentItem.type === "video" ? "Video" : "Imagen"} - {currentIndex + 1} / {totalItems}
                        </span>
                    </div>
                </>
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

    const { language: lang } = useLanguage();

    // Usar adminLang si está disponible (admin CMS), sino usar lang del contexto (web pública)
    const currentLang = adminLang || lang;

    // Helper para obtener texto en idioma correcto
    const getText = (field) => {
        // 1. Probar esquema plano: name_es o name_en
        const flatKey = `${field}_${currentLang}`;
        if (product[flatKey]) return product[flatKey];

        // 2. Probar esquema plano por defecto (español)
        const flatKeyEs = `${field}_es`;
        if (product[flatKeyEs]) return product[flatKeyEs];

        // 3. Probar estructura original
        if (!product[field]) return "";
        if (typeof product[field] === "string") return product[field];
        return product[field][currentLang] || product[field].es || "";
    };

    // Helper para placeholders dinámicos
    const getPlaceholder = (key) => {
        return messages[currentLang]?.admin?.products?.placeholders?.[key] || "";
    };

    // ≡ƒöÑ Replicar lógica de Features bilingües
    let features = [];
    if (Array.isArray(product.features)) {
        features = product.features;
    } else if (product.features && product.features[currentLang]) {
        features = product.features[currentLang];
    } else if (product.features && product.features.es) {
        features = product.features.es;
    }

    // 🌿 Specifications: extraer por currentLang si es objeto bilingüe + nueva specifications_list plana
    const specsEntries = (() => {
        let entries = [];

        // 1. Extraer del objeto legacy (si existe)
        if (product.specifications) {
            if (editable) {
                entries = Object.entries(product.specifications);
            } else if (product.specifications[currentLang]) {
                entries = Object.entries(product.specifications[currentLang]);
            } else if (product.specifications.es || product.specifications.en) {
                entries = Object.entries(product.specifications.es || product.specifications.en);
            } else {
                entries = Object.entries(product.specifications);
            }
        }

        // 2. Anexar de specifications_list plana (si existe)
        if (Array.isArray(product.specifications_list)) {
            product.specifications_list.forEach(spec => {
                const k = spec[`key_${currentLang}`] || spec.key_es || spec.key_en || spec.key;
                const v = spec[`value_${currentLang}`] || spec.value_es || spec.value_en || spec.value;
                if (k || v) {
                    entries.push([k || "Propiedad", v || ""]);
                }
            });
        }

        return entries;
    })();

    let capabilities = [];
    if (product[`capabilities_${currentLang}`] && Array.isArray(product[`capabilities_${currentLang}`])) {
        capabilities = product[`capabilities_${currentLang}`];
    } else if (product[`capabilities_es`] && Array.isArray(product[`capabilities_es`])) {
        // Fallback to spanish if language missing
        capabilities = product[`capabilities_es`];
    } else if (Array.isArray(product.capabilities)) {
        // Legacy flat
        capabilities = product.capabilities;
    } else if (product.capabilities && product.capabilities[currentLang]) {
        // Legacy object
        capabilities = product.capabilities[currentLang];
    } else if (product.capabilities && product.capabilities.es) {
        capabilities = product.capabilities.es;
    }

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
                                        className={`text-3xl lg:text-4xl font-bold text-gray-900 bg-transparent border rounded px-2 py-1 ${invalid?.name ? "border-red-500 ring-1 ring-red-300" : ""
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
                                        className={`bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full border ${invalid?.category
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
                                    {getText("category") || getText("tag")}
                                </span>
                            )}
                        </div>
                        {editable ? (
                            <div className="relative">
                                <input
                                    className="text-xl text-gray-500 font-medium mb-3 bg-transparent border rounded px-2 py-1 w-full"
                                    value={product[`subtitle_${currentLang}`] || product.subtitle_es || product.subtitle || ""}
                                    onChange={(e) => handleEdit([`subtitle_${currentLang}`], e.target.value)}
                                    placeholder="Subtítulo del producto"
                                />
                            </div>
                        ) : getText("subtitle") ? (
                            <h2 className="text-lg text-red-600 font-medium mb-3">
                                {getText("subtitle")}
                            </h2>
                        ) : null}
                        {editable ? (
                            <div className="relative">
                                <textarea
                                    className={`text-gray-700 leading-relaxed mb-4 w-full bg-transparent border rounded px-2 py-2 ${invalid?.description
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
                            <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
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
                                            className={`text-xs px-3 py-2 rounded-lg font-medium transition-all duration-200 ${product.technicalSheets?.es
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
                                            className={`text-xs px-3 py-2 rounded-lg font-medium transition-all duration-200 ${product.technicalSheets?.en
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
                                        className={`inline-flex items-center gap-2 font-semibold py-3 px-4 rounded-xl border transition-all duration-200 ${generating ||
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

            {/* Características Principales (Flat Schema / New Products) */}
            {(product.main_features && product.main_features.length > 0) && (
                <div className="grid-ctx mb-6">
                    <div className="span-12">
                        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
                            {labels.mainFeatures}
                        </h2>
                    </div>
                    <div className="span-12 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {product.main_features.map((feat, i) => {
                            const hasTitle = feat[`title_${currentLang}`] || feat.title_es || feat.title;
                            if (!hasTitle) return null;

                            return (
                                <div key={feat.id || i} className="h-full">
                                    <FeatureCard
                                        feature={feat}
                                        editable={editable}
                                        onEdit={(field, val) => handleEdit(["main_features", i, field], val)}
                                        onPickIcon={() => onPickIcon?.(i)}
                                        getPlaceholder={getPlaceholder}
                                        currentLang={currentLang}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Especificaciones y Media Carousel side-by-side */}
            <div className="grid-ctx mb-6">
                <div className="span-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">

                        {/* Especificaciones Técnicas */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg h-full">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                {labels.technicalSpecs}
                            </h3>
                            {specsEntries.length > 0 ? (
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
                                            <button className="text-sm px-3 py-2 border rounded" onClick={() => handleEdit(["specs", "add"], "")}>+ Agregar</button>
                                            <button className="text-sm px-3 py-2 border rounded" onClick={() => handleEdit(["specs", "remove", "last"], "")}>− Eliminar</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-gray-500 text-sm">
                                    No hay especificaciones técnicas detalladas.
                                </div>
                            )}
                        </div>

                        {/* Media - Compartido entre idiomas */}
                        <div>
                            <PublicMediaCarousel product={product} getText={getText} />
                        </div>

                    </div>
                </div>
            </div>

            {/* Capacidades */}
            {capabilities.length > 0 && (
                <div className="grid-ctx mb-8">
                    <div className="span-12">
                        <div className="bg-white rounded-2xl p-6 shadow-lg">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                {labels.capabilities}
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                                    <button className="text-sm px-3 py-2 border rounded" onClick={() => handleEdit(["capabilities", "add"], "")}>+ Agregar capacidad</button>
                                    <button className="text-sm px-3 py-2 border rounded" onClick={() => handleEdit(["capabilities", "remove", "last"], "")}>− Eliminar última</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
