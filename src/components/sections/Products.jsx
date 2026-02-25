import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Clock, Award, Microscope } from "lucide-react";
import { useLanguage } from "../../context/hooks/useLanguage";
import { messages } from "../../config/i18n";
// Eliminado: catálogo fallback en src/data. Usamos exclusivamente /content/products.json

export const ProductCard = ({
  product,
  lang, // ✅ NEW: Idioma explícito para admin preview
  disabled = false,
  editable = false,
  onEdit,
  invalid,
  showHints,
  previewMode = false, // Nuevo: si es true, usa directamente product sin buscar traducciones
}) => {
  const { t, lang: contextLang } = useLanguage();
  // Usar lang prop si está disponible, sino usar contexto
  const currentLang = lang || contextLang;

  // Overlay from i18n kept optional; canonical data provides defaults
  // En modo preview del admin, no buscar traducciones adicionales
  const raw =
    editable || previewMode ? null : t(`products.cards.${product.id}`);
  const cardT = raw && typeof raw === "object" ? raw : {};

  // Helper para obtener texto en idioma correcto
  const getText = (field) => {
    if (!product[field]) return "";
    if (typeof product[field] === "string") return product[field];
    return product[field][currentLang] || product[field].es || "";
  };

  // Button text with lang prop support
  const buttonText = lang
    ? messages[lang]?.products?.viewDetails ||
    (lang === "es" ? "Ver Detalles" : "View Details")
    : t("products.viewDetails");

  // Helper para placeholders dinámicos (admin)
  const getPlaceholder = (key) => {
    return messages[currentLang]?.admin?.products?.placeholders?.[key] || "";
  };

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-xl transition-all duration-500 group">
      {/* Card Container */}
      <div className="flex flex-col h-[500px] p-6 rounded-2xl shadow-2xl">
        {/* Image Section - Fixed height */}
        <div className="h-52 bg-gradient-to-r from-transparent via-white to-transparent rounded-2xl overflow-hidden pb-4 pt-2">
          <div className="w-full h-full flex items-center justify-center transform transition-transform duration-700 ease-out group-hover:scale-120">
            <img
              src={product.image || "/assets/images/logo/logo_NFT.png"}
              alt={getText("name")}
              className="h-full w-auto object-contain"
              onError={(e) => {
                e.currentTarget.src = "/assets/images/logo/logo_NFT.png";
              }}
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-grow px-3">
          {/* Header - Fixed height */}
          <div className="h-32">
            {editable ? (
              <div className="relative">
                <input
                  className={`text-lg font-bold text-gray-900 mb-3 w-full border rounded px-2 py-1 ${invalid?.name ? "border-red-500 ring-1 ring-red-300" : ""
                    }`}
                  value={product.name || ""}
                  onChange={(e) => onEdit?.(["name"], e.target.value)}
                  placeholder={getPlaceholder("name")}
                  data-field="name"
                />
                {showHints && invalid?.name && (
                  <div className="absolute -top-5 left-0 bg-red-600 text-white text-[11px] rounded px-2 py-0.5 shadow">
                    Campo obligatorio
                  </div>
                )}
              </div>
            ) : (
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {previewMode ? getText("name") : cardT.name || getText("name")}
              </h3>
            )}
            {editable ? (
              <div className="relative">
                <textarea
                  className={`text-sm text-gray-700 leading-relaxed w-full border rounded px-2 py-1 ${invalid?.description
                    ? "border-red-500 ring-1 ring-red-300"
                    : ""
                    }`}
                  rows={3}
                  value={product.description || ""}
                  onChange={(e) => onEdit?.(["description"], e.target.value)}
                  placeholder={getPlaceholder("description")}
                  data-field="description"
                />
                {showHints && invalid?.description && (
                  <div className="absolute -top-5 left-0 bg-red-600 text-white text-[11px] rounded px-2 py-0.5 shadow">
                    Campo obligatorio
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                {previewMode
                  ? getText("description")
                  : cardT.description || getText("description")}
              </p>
            )}
          </div>

          {/* Features List - Fixed height */}
          <div className="h-36 overflow-hidden relative pb-6">
            <ul className="space-y-1">
              {(editable || previewMode
                ? product.features
                : cardT.features || product.features
              ).map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start text-sm text-gray-600 min-w-0"
                >
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                  {editable ? (
                    <input
                      className={`flex-1 border rounded px-2 py-1 text-sm ${showHints && invalid?.features && !feature?.trim()
                        ? "border-red-500 ring-1 ring-red-300"
                        : ""
                        }`}
                      value={feature || ""}
                      onChange={(e) =>
                        onEdit?.(["features", index], e.target.value)
                      }
                      placeholder={getPlaceholder("characteristic")}
                      data-field={index === 0 ? "features" : undefined}
                    />
                  ) : (
                    <span className="flex-1 line-clamp-2">{feature}</span>
                  )}
                </li>
              ))}
            </ul>
            {/* Fade overlay para ocultar la zona recortada con gradiente */}
            <div className="product-fade-overlay" />
          </div>

          {/* Button Section - Fixed position at bottom */}
          <div className="mt-auto">
            {disabled ? (
              <div className="block w-full text-center btn-cta py-2 px-4 text-sm font-medium opacity-60 cursor-default select-none">
                {buttonText}
              </div>
            ) : (
              <Link
                to={`/productos/${product.id}`}
                className="block w-full text-center btn-cta py-2 px-4 text-sm font-medium cursor-pointer"
              >
                {buttonText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// limit: cantidad máxima de productos a mostrar (undefined para todos)
const Products = ({ limit }) => {
  const { t, language } = useLanguage();
  const [jsonProducts, setJsonProducts] = useState(null);
  const [loadedFromJson, setLoadedFromJson] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/content/products.json", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setJsonProducts(Array.isArray(data) ? data : null);
          setLoadedFromJson(true);
        }
      } catch {
        if (!cancelled) {
          setJsonProducts(null);
          setLoadedFromJson(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Construir tarjetas sólo desde JSON gestionado por Admin
  const products = useMemo(() => {
    const data = Array.isArray(jsonProducts) ? jsonProducts : [];
    return data
      .filter((p) => !p.archived)
      .sort((a, b) => (a.order || 999) - (b.order || 999))
      .map((p) => {
        const overlay = t(`products.cards.${p.id}`);
        const o = overlay && typeof overlay === "object" ? overlay : {};
        const name = (p.name && p.name[language]) || p.name || "";
        const description =
          o.description || (p.description && p.description[language]) || "";
        const features =
          o.features || (p.features && p.features[language]) || [];
        return {
          id: p.id,
          name,
          image: p.image,
          description,
          features,
        };
      });
  }, [jsonProducts, language, t]);

  return (
    <section id="productos" className="py-8 bg-gray-0 rounded-3xl shadow-lg">
      <div className="w-full mx-auto px-4">
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-center mb-3 tracking-tight">
            {t("products.title").split(" ")[0]}{" "}
            <span className="text-red-600">
              {t("products.title").split(" ").slice(1).join(" ")}
            </span>
          </h2>
          <p className="text-center text-[15px] text-gray-600 max-w-4xl mx-auto leading-snug">
            {t("products.lead")}
          </p>
        </div>

        {/* Insights / Highlights - stacked layout */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 sm:grid-cols-2 gap-4 ">
          {[
            { icon: Brain, ...t("products.highlights.0") },
            { icon: Clock, ...t("products.highlights.1") },
            { icon: Award, ...t("products.highlights.2") },
            { icon: Microscope, ...t("products.highlights.3") },
          ].map(({ icon: Icon, title, description }, i) => (
            <div
              key={i}
              className="group text-center p-4 rounded-2xl border border-gray-200 transition-all duration-300 shadow-md hover:-translate-y-0.5 hover:shadow-lg bg-white/90 dark:bg-transparent"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03)), var(--glass-bg)",
                backdropFilter: "blur(10px) saturate(150%)",
                WebkitBackdropFilter: "blur(10px) saturate(150%)",
                borderColor: "var(--glass-border)",
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 group-hover:scale-[1.03] transition"
                style={{
                  background:
                    "radial-gradient(120px 120px at 30% 30%, rgba(240,82,82,0.18), rgba(240,82,82,0.06) 60%), rgba(255,255,255,0.06)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <Icon className="h-8 w-8 text-red-600" strokeWidth={1.6} />
              </div>
              <h3 className="font-semibold mb-2 text-sm md:text-[15px] tracking-tight text-gray-900">
                {title}
              </h3>
              <p className="text-xs md:text-[13px] leading-snug max-w-[22ch] mx-auto text-gray-600">
                {description}
              </p>
            </div>
          ))}
        </div>

        {/* Products grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8">
            {(limit ? products.slice(0, limit) : products).map(
              (product, index) => (
                <ProductCard key={index} product={product} />
              )
            )}
          </div>

          {/* CTA Button "Descargar Folleto Empresarial"*/}
          <div className="text-center mt-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
            {limit && (
              <Link
                to="/productos"
                className="bg-red-600 hover:bg-red-700 text-white 
                             font-semibold py-3 px-8 rounded-lg 
                             transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {t("products.viewAll")}
              </Link>
            )}
            {/* ubicación del archivo: 
                C:\PROYECTOS\web_nft_react\web_nft_react_2025\public\assets\images\products\CATALOGO_NFT_2025_12_02.pdf*/}
            <a
              href="/assets/images/products/CATALOGO_NFT_2025_12_02.pdf"
              target="_blank"
              rel="noreferrer"
              className="bg-red-600 hover:bg-red-700 text-white 
                           font-semibold py-3 px-8 rounded-lg 
                           transition-all duration-300 shadow-xl hover:shadow-2xl"
            >
              {t("products.brochureLong")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Products;
