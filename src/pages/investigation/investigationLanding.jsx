import React, { useState, useEffect } from "react";
import { useLanguage } from "../../context/hooks/useLanguage";
import ArticleCard from "../../components/research/ArticleCard";
import {
  Search,
  Filter,
  Calendar,
  BookOpen,
  Award,
  ChevronDown,
  X,
  Settings,
} from "lucide-react";

const InvestigationLanding = () => {
  const { t, language } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJournal, setSelectedJournal] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [sortBy, setSortBy] = useState("order");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticles = async () => {
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
          const response = await fetch("/content/research.json");
          data = await response.json();
        }

        // Filtrar solo artículos activos (no archivados)
        const activeArticles = data.filter((article) => !article.archived);

        setArticles(activeArticles);
        setFilteredArticles(activeArticles);
        setLoading(false);

        console.log("📚 [InvestigationLanding] Loaded articles from Firestore:", {
          total: data.length,
          active: activeArticles.length,
          archived: data.length - activeArticles.length,
        });
      } catch (error) {
        console.error("Error loading articles from Firestore:", error);
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  // Obtener listas únicas para filtros
  const uniqueJournals = [
    ...new Set(articles.map((article) => article.journal)),
  ];
  const uniqueYears = [
    ...new Set(articles.map((article) => new Date(article.date).getFullYear())),
  ].sort((a, b) => b - a);

  // KPIs para el encabezado
  const publicationsCount = articles.length;
  const journalsCount = new Set(articles.map((a) => a.journal)).size;
  const yearsRange = articles.length
    ? {
      min: Math.min(...articles.map((a) => new Date(a.date).getFullYear())),
      max: Math.max(...articles.map((a) => new Date(a.date).getFullYear())),
    }
    : { min: 0, max: 0 };
  const yearsOfResearch = articles.length
    ? yearsRange.max - yearsRange.min + 1
    : 0;
  const productsCount = 9; // A la fecha, solicitados por el cliente

  // Definir items de KPI para renderizar con map (escalable)
  const kpiItems = [
    {
      id: "pubs",
      Icon: BookOpen,
      value: publicationsCount,
      label: t("research.publications"),
    },
    {
      id: "years",
      Icon: Calendar,
      value: yearsOfResearch,
      label: t("research.years"),
    },
    {
      id: "journals",
      Icon: Award,
      value: journalsCount,
      label: t("research.journals"),
    },
    {
      id: "products",
      Icon: Settings,
      value: productsCount,
      label: t("research.products"),
    },
  ];

  // Filtrar y ordenar artículos
  useEffect(() => {
    let filtered = articles.filter((article) => {
      // Helper para obtener texto del campo (puede ser string o objeto bilingüe)
      const getText = (field) => {
        if (!field) return "";
        if (typeof field === "string") return field;
        if (typeof field === "object") {
          return field[language] || field.es || field.en || "";
        }
        return "";
      };

      const titleText = getText(article.title);
      const abstractText = getText(article.abstract);
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch =
        titleText.toLowerCase().includes(searchLower) ||
        abstractText.toLowerCase().includes(searchLower) ||
        (Array.isArray(article.keywords) &&
          article.keywords.some((keyword) =>
            keyword.toLowerCase().includes(searchLower)
          ));

      const matchesJournal =
        !selectedJournal || article.journal === selectedJournal;

      const matchesYear =
        !selectedYear ||
        new Date(article.date).getFullYear().toString() === selectedYear;

      return matchesSearch && matchesJournal && matchesYear;
    });

    // Ordenar
    switch (sortBy) {
      case "order":
        filtered.sort((a, b) => (a.order || 999) - (b.order || 999));
        break;
      case "date-desc":
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case "date-asc":
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "title-asc":
        filtered.sort((a, b) => {
          const titleA =
            typeof a.title === "string"
              ? a.title
              : a.title?.[language] || a.title?.es || "";
          const titleB =
            typeof b.title === "string"
              ? b.title
              : b.title?.[language] || b.title?.es || "";
          return titleA.localeCompare(titleB);
        });
        break;
      case "title-desc":
        filtered.sort((a, b) => {
          const titleA =
            typeof a.title === "string"
              ? a.title
              : a.title?.[language] || a.title?.es || "";
          const titleB =
            typeof b.title === "string"
              ? b.title
              : b.title?.[language] || b.title?.es || "";
          return titleB.localeCompare(titleA);
        });
        break;
      default:
        break;
    }

    setFilteredArticles(filtered);
  }, [articles, searchTerm, selectedJournal, selectedYear, sortBy, language]);

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedJournal("");
    setSelectedYear("");
    setSortBy("date-desc");
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("research.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-app pt-8 pb-12">
        {/* Encabezado */}
        <div className="grid-ctx mb-8">
          <div className="span-12 text-center">
            <h1 className="text-3xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-3">
              {t("research.center").split(" ")[0]}{" "}
              <span className="text-red-600">
                {t("research.center").split(" ").slice(1).join(" ")}
              </span>
            </h1>
            <p className="text-gray-600 text-lg md:text-lg max-w-4xl mx-auto">
              {t("research.landing.headerLead", { count: publicationsCount })}
            </p>
          </div>
          {/* KPIs */}
          <div className="span-12">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {kpiItems.map(({ id, Icon, value, label }) => (
                <div
                  key={id}
                  className="bg-white rounded-2xl shadow-md p-5 h-32 flex flex-col items-center justify-center text-center transition duration-200 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="text-center">
                    <div className="text-red-600/90 flex justify-center">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="mt-3 text-3xl font-bold text-gray-900">
                      {value}
                    </div>
                    <div className="text-gray-500 text-sm">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Filtros y Búsqueda */}
        <div className="grid-ctx mb-8">
          <div className="span-12">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {/* Barra de búsqueda */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder={t("research.landing.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-0 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Botón de filtros móvil */}
              <div className="flex items-center justify-between mb-4 md:hidden">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                >
                  <Filter className="h-5 w-5" />
                  {t("research.landing.filters")}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""
                      }`}
                  />
                </button>
                {(searchTerm || selectedJournal || selectedYear) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                    {t("research.landing.clear")}
                  </button>
                )}
              </div>

              {/* Filtros */}
              <div
                className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${showFilters ? "block" : "hidden md:grid"
                  }`}
              >
                <select
                  value={selectedJournal}
                  onChange={(e) => setSelectedJournal(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:border-gray-600"
                >
                  <option value="">{t("research.landing.allJournals")}</option>
                  {uniqueJournals.map((journal) => (
                    <option key={journal} value={journal}>
                      {journal}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:border-gray-600"
                >
                  <option value="">{t("research.landing.allYears")}</option>
                  {uniqueYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:border-gray-600"
                >
                  <option value="order">
                    {t("research.landing.sort.order")}
                  </option>
                  <option value="date-desc">
                    {t("research.landing.sort.dateDesc")}
                  </option>
                  <option value="date-asc">
                    {t("research.landing.sort.dateAsc")}
                  </option>
                  <option value="title-asc">
                    {t("research.landing.sort.titleAsc")}
                  </option>
                  <option value="title-desc">
                    {t("research.landing.sort.titleDesc")}
                  </option>
                </select>

                <div className="hidden md:flex items-center">
                  {(searchTerm || selectedJournal || selectedYear) && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                      {t("research.landing.clearFilters")}
                    </button>
                  )}
                </div>
              </div>

              {/* Contador de resultados */}
              <div className="mt-4 text-sm text-gray-600">
                {t("research.landing.resultsCount", {
                  shown: filteredArticles.length,
                  total: articles.length,
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Artículos */}
        <div className="grid-ctx">
          <div className="span-12">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("research.landing.emptyTitle")}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t("research.landing.emptyDesc")}
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {t("research.landing.clearFilters")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
                {filteredArticles.map((article, idx) => (
                  <ArticleCard
                    key={`${article.slug}-${idx}`}
                    article={article}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestigationLanding;
