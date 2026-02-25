import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { useLanguage } from "../../context/hooks/useLanguage";

/**
 * Componente reutilizable para mostrar una tarjeta de artículo de investigación
 * Usado en:
 * 1. investigationLanding.jsx (landing público)
 * 2. CMS Admin (vista previa en tiempo real)
 */
const ArticleCard = ({ article, isPreview = false }) => {
  const [imageError, setImageError] = useState(false);
  const { t, language } = useLanguage();

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(
        language === "en" ? "en-US" : "es-ES",
        {
          year: "numeric",
          month: "short",
        }
      );
    } catch {
      return dateString;
    }
  };

  // Si es preview en CMS, no usar Link
  const Wrapper = isPreview ? "div" : Link;
  const wrapperProps = isPreview
    ? { className: "block" }
    : { to: `/investigacion/${article.slug}` };

  return (
    <Wrapper
      {...wrapperProps}
      className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 flex flex-col"
    >
      {/* Imagen - relación 16:9, ring y bordes redondeados */}
      <div className="relative overflow-hidden flex-shrink-0 rounded-t-2xl bg-gray-50 ring-1 ring-gray-200 aspect-[16/9]">
        {!imageError && article.localImage ? (
          <img
            src={article.localImage}
            alt={
              typeof article.title === "string"
                ? article.title
                : article.title?.[language] ||
                  article.title?.es ||
                  article.title?.en ||
                  "Artículo"
            }
            className="w-full h-full object-contain rounded-t-2xl"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-red-300 mx-auto mb-2" />
              <p className="text-xs text-red-400">
                {t("research.landing.imageNotAvailable")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col min-h-0">
        {/* Metadata */}
        <div className="flex items-center justify-between mb-2 sm:mb-3 flex-shrink-0">
          <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
            {article.journal}
          </span>
          <span className="text-xs sm:text-sm text-gray-500">
            {formatDate(article.date)}
          </span>
        </div>

        {/* Título */}
        <div className="mb-2 sm:mb-3 flex-shrink-0 min-h-[3.5rem] sm:min-h-[3.75rem] md:min-h-[3.75rem] lg:min-h-[3.75rem] xl:min-h-[3.75rem]">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-3 group-hover:text-red-600 transition-colors leading-tight">
            {typeof article.title === "string"
              ? article.title
              : article.title?.[language] ||
                article.title?.es ||
                article.title?.en ||
                "Sin título"}
          </h3>
        </div>

        {/* Resumen */}
        <div className="text-gray-600 text-xs mb-2 sm:mb-3 flex-shrink-0 min-h-[3.75rem] sm:min-h-[3.75rem] md:min-h-[3.75rem] lg:min-h-[3.75rem] xl:min-h-[3.75rem]">
          <p
            className="leading-relaxed"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {typeof article.summary_30w === "string"
              ? article.summary_30w
              : article.summary_30w?.[language] ||
                article.summary_30w?.es ||
                article.summary_30w?.en ||
                ""}
          </p>
        </div>

        {/* Keywords: fixed 2-row height, chips constant height */}
        <div className="flex flex-wrap gap-1 mb-2 sm:mb-3 flex-shrink-0 h-[3.25rem] overflow-hidden content-start">
          {article.keywords && article.keywords.length > 0 && (
            <>
              {article.keywords.slice(0, 6).map((keyword, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-600 text-xs inline-flex items-center h-6 px-2 rounded whitespace-nowrap border border-gray-200"
                >
                  {keyword}
                </span>
              ))}
            </>
          )}
        </div>

        {/* Productos relacionados */}
        <div className="border-t pt-1 sm:pt-2 flex-shrink-0">
          {article.products && article.products.length > 0 ? (
            <>
              <p className="text-xs text-gray-500 mb-1">
                {t("research.landing.relatedProducts")}
              </p>
              <div className="flex flex-wrap gap-1">
                {article.products.slice(0, 2).map((product, index) => (
                  <span
                    key={index}
                    className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded"
                  >
                    {product}
                  </span>
                ))}
                {article.products.length > 2 && (
                  <span className="text-xs text-gray-400">
                    {t("research.landing.moreCount", {
                      count: article.products.length - 2,
                    })}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="text-xs text-gray-400">
              {t("research.landing.noRelatedProducts")}
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
};

export default ArticleCard;
