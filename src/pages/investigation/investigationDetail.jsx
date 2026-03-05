import { useLanguage } from "../../context/hooks/useLanguage";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  ExternalLink,
  FileText,
  CircleAlert,
} from "lucide-react";

const PHONE_NUMBER = "51988496839"; // usado en otras partes del sitio

const InvestigationDetail = ({
  article: articleProp = null,
  isPreview = false,
}) => {
  const { slug } = useParams();
  const { t, language } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doiUrl, setDoiUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Si es preview, no cargar JSON (ya tenemos articleProp)
    if (isPreview) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const { collection, getDocs } = await import("firebase/firestore");
        const { db } = await import("../../config/firebase");
        const querySnapshot = await getDocs(collection(db, "research"));

        let data = [];
        if (!querySnapshot.empty) {
          data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } else {
          const res = await fetch("/content/research.json");
          data = await res.json();
        }

        // Filtrar solo artículos activos (no archivados)
        const activeArticles = data.filter((article) => !article.archived);

        setArticles(activeArticles);

        console.log("📄 [InvestigationDetail] Loaded articles from Firestore:", {
          total: data.length,
          active: activeArticles.length,
          archived: data.length - activeArticles.length,
        });
      } catch (e) {
        console.error("Error cargando research desde Firestore", e);
        setError("No se pudo cargar la base de publicaciones.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isPreview]);

  const article = useMemo(() => {
    // Si es preview, usar la prop directamente
    if (isPreview && articleProp) return articleProp;
    // Si no, buscar en articles
    return articles.find((a) => a.slug === slug);
  }, [articles, slug, isPreview, articleProp]);

  // Detectar el idioma efectivo del artículo
  const effectiveLanguage = useMemo(() => {
    if (!article) return language;
    // Si el artículo tiene un campo lang, usarlo como fallback si no hay traducción
    if (article.lang) return article.lang;
    // Si el título es objeto bilingüe, usar el idioma actual
    if (typeof article.title === "object") return language;
    // Por defecto, asumir que es inglés si es string
    return "en";
  }, [article, language]);

  // Intentar resolver DOI/PDF: 1) JSON; 2) scrape básico del HTML de href buscando doi.org; 3) fallback a WhatsApp
  useEffect(() => {
    if (!article) return;

    const initialDoi = article.download_link_DOI?.trim();
    const initialPdf = article.download_link_pdf?.trim();
    if (initialDoi) setDoiUrl(initialDoi);
    if (initialPdf) setPdfUrl(initialPdf);

    // Scrape en runtime si falta DOI. Puede fallar por CORS en cuyo caso ignoramos.
    const tryScrape = async () => {
      if (initialDoi || !article.href) return;
      try {
        const resp = await fetch(article.href, { mode: "cors" });
        const html = await resp.text();
        // Buscar patrón de DOI típico
        const doiMatch = html.match(/https?:\/\/doi\.org\/[\w\/.\-()]+/i);
        if (doiMatch) {
          setDoiUrl(doiMatch[0]);
        }
        // Buscar PDF absoluto si existiera
        const pdfMatch = html.match(/href=\"([^\"]+\.pdf)\"/i);
        if (pdfMatch && !initialPdf) {
          // Resolver relativo si corresponde
          const url = new URL(pdfMatch[1], article.href);
          setPdfUrl(url.toString());
        }
      } catch (e) {
        console.warn("Scrape saltado por CORS o error de red", e);
      }
    };
    tryScrape();
  }, [article]);

  const openPublication = () => {
    if (doiUrl) {
      window.open(doiUrl, "_blank", "noopener,noreferrer");
      return;
    }
    // Fallback a WhatsApp si no hay DOI
    const text = encodeURIComponent(
      t("researchDetail.waFallback", {
        title: article?.title ?? "(sin título)",
      })
    );
    window.open(`https://wa.me/${PHONE_NUMBER}?text=${text}`, "_blank");
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(
        language === "en" ? "en-US" : "es-ES",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container-app py-12">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <CircleAlert className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold mb-2">
            {t("researchDetail.notFound")}
          </h2>
          <Link to="/investigacion" className="text-red-600 hover:underline">
            {t("research.back")}
          </Link>
        </div>
      </div>
    );
  }

  // Wrapper condicional: sin padding si es preview
  const Wrapper = isPreview ? "div" : "div";
  const wrapperClass = isPreview ? "" : "w-full max-w-[1110px] mx-auto px-4 py-6";

  return (
    <div className={wrapperClass}>
      {/* Card principal */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Imagen */}
        <div className="bg-gray-50 ring-1 ring-gray-200 aspect-[16/9] flex items-center justify-center">
          {article.localImage ? (
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
              className="w-full h-full object-contain"
            />
          ) : (
            <BookOpen className="h-12 w-12 text-red-300" />
          )}
        </div>

        {/* Contenido */}
        <div className="p-6 md:p-8">
          {/* Título del artículo */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {typeof article.title === "string"
              ? article.title
              : article.title?.[language] ||
              article.title?.[effectiveLanguage] ||
              article.title?.es ||
              article.title?.en ||
              "Sin título"}
          </h1>

          {/* Meta */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" /> {formatDate(article.date)}
            </span>
            <span className="bg-red-100 text-red-800 font-semibold px-2 py-1 rounded-full">
              {article.journal}
            </span>
          </div>

          {/* Keywords como subtítulo */}
          {article.keywords && article.keywords.length > 0 && (
            <div className="mt-4 text-gray-600">
              <h2 className="text-base font-semibold text-gray-900 mb-2">
                {t("researchDetail.keywords")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {article.keywords.map((k, i) => (
                  <span
                    key={i}
                    className="bg-gray-100 text-gray-700 text-xs inline-flex items-center h-6 px-2 rounded"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Abstract completo */}
          <div className="mt-5">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              {t("researchDetail.abstract")}
            </h2>
            <p className="text-gray-700 text-sm text-justify leading-relaxed">
              {typeof article.abstract === "string"
                ? article.abstract
                : article.abstract?.[language] ||
                article.abstract?.[effectiveLanguage] ||
                article.abstract?.es ||
                article.abstract?.en ||
                ""}
            </p>
          </div>

          {/* Acciones */}
          <div className="mt-6 flex flex-wrap gap-3">
            {isPreview ? (
              // En preview: botones visualmente iguales pero sin funcionalidad
              <>
                <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg">
                  <ExternalLink className="h-4 w-4" />
                  {t("researchDetail.openPublication")}
                </div>
                {(article.download_link_pdf || pdfUrl) && (
                  <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg">
                    <FileText className="h-4 w-4" /> {t("researchDetail.pdf")}
                  </div>
                )}
              </>
            ) : (
              // En web pública: botones funcionales
              <>
                <button
                  onClick={openPublication}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  <ExternalLink className="h-4 w-4" />{" "}
                  {t("researchDetail.openPublication")}
                </button>
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
                  >
                    <FileText className="h-4 w-4" /> {t("researchDetail.pdf")}
                  </a>
                )}
              </>
            )}
          </div>

          {/* Cita (APA/MLA) */}
          <CitationBlock article={article} doiUrl={doiUrl} />
        </div>
      </div>
    </div>
  );
};

// Bloque de cita con botón copiar
const CitationBlock = ({ article, doiUrl }) => {
  const { t, currentLang } = useLanguage();
  const [style, setStyle] = useState("APA");
  const authorsRaw = article.author || article.autor || article.authors; // soporta futuras claves

  const authorsList = useMemo(() => {
    if (!authorsRaw) return [];
    if (Array.isArray(authorsRaw)) return authorsRaw;
    // separar por ; o , si es string
    return String(authorsRaw)
      .split(/;|\|/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [authorsRaw]);

  // ✅ Extraer título según idioma (soporta string o objeto bilingüe)
  const articleTitle = useMemo(() => {
    if (!article.title) return "Sin título";
    if (typeof article.title === "string") return article.title;
    if (typeof article.title === "object") {
      return (
        article.title[currentLang] ||
        article.title.es ||
        article.title.en ||
        "Sin título"
      );
    }
    return String(article.title);
  }, [article.title, currentLang]);

  const parts = useMemo(() => {
    const d = new Date(article.date);
    const monthsEs = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
    return {
      year: isNaN(d) ? "" : String(d.getFullYear()),
      day: isNaN(d) ? "" : String(d.getDate()),
      monthName: isNaN(d) ? "" : monthsEs[d.getMonth()],
    };
  }, [article.date]);

  const formatAuthorAPA = (name) => {
    // Si ya está en formato "Apellido, Nombre(s)" -> "Apellido, N."
    if (name.includes(",")) {
      const [surname, names] = name.split(",", 2);
      if (!names || !names.trim()) return surname.trim();

      const namesParts = names.trim().split(/\s+/);
      const initials = namesParts
        .map((p) => (p ? p[0].toUpperCase() + "." : ""))
        .join(" ");
      return `${surname.trim()}, ${initials}`.trim();
    }

    // Si está en formato "Nombre Apellido" -> "Apellido, N."
    const parts = name.split(/\s+/);
    if (parts.length === 1) return name;
    const last = parts.pop();
    const initials = parts
      .map((p) => (p ? p[0].toUpperCase() + "." : ""))
      .join(" ");
    return `${last}, ${initials}`.trim();
  };

  // ✅ Unir autores con "; " (con espacio después del punto y coma)
  const authorsAPA = authorsList.length
    ? authorsList.map(formatAuthorAPA).join("; ")
    : "Autores no disponibles";

  const authorsMLA = authorsList.length
    ? authorsList.join("; ")
    : "Autores no disponibles";

  const apa = `${authorsAPA} (${parts.year}). ${articleTitle}. ${article.journal
    }. ${doiUrl || article.href || ""}`.trim();
  const mla = `${authorsMLA}. "${articleTitle}." ${article.journal}, ${parts.day
    } ${parts.monthName} ${parts.year}. ${doiUrl || article.href || ""}`.trim();

  const text = style === "APA" ? apa : mla;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.warn("No se pudo copiar al portapapeles", e);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center text-sm justify-between mt-24 mb-8">
        <h3 className="text-base font-semibold text-gray-900">
          {t("researchDetail.citation")}
        </h3>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">
            {t("researchDetail.format")}{" "}
          </h2>
          <button
            className={`px-3 py-1 rounded border font-semibold transition-colors ${style === "APA"
              ? "bg-red-600 text-white  hover:bg-red-700"
              : "bg-gray-100 text-gray-600  hover:bg-gray-200"
              }`}
            onClick={() => setStyle("APA")}
          >
            APA
          </button>
          <button
            className={`px-3 py-1 rounded border font-semibold transition-colors ${style === "MLA"
              ? "bg-red-600 text-white  hover:bg-red-700"
              : "bg-gray-100 text-gray-600  hover:bg-gray-200"
              }`}
            onClick={() => setStyle("MLA")}
          >
            MLA
          </button>
          <button
            onClick={copy}
            className="ml-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
            title={t("researchDetail.copy")}
          >
            {t("researchDetail.copy")}
          </button>
        </div>
      </div>
      <p className="text-gray-700 text-sm leading-relaxed">{text}</p>
      {!authorsRaw && (
        <p className="mt-2 text-xs text-gray-500">
          {t("researchDetail.authorsMissing")}
        </p>
      )}
    </div>
  );
};

export default InvestigationDetail;
