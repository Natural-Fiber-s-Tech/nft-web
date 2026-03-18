import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../context/hooks/useLanguage";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { messages } from "../../config/i18n"; // ✅ Importar messages para admin preview
import {
  Brain,
  Settings,
  BookOpen,
  Users,
  BarChart3,
  Lightbulb,
} from "lucide-react";
// Fallback renderer to support admin preview where icon can be a string (local lucide name or iconify prefix:name)
import { RenderIcon as AdminRenderIcon } from "../../pages/admin/components/common/IconUtils";
// Eliminado: fallbacks en src/data. La fuente de verdad es public/content/services.json

// ================= ServiceCard =================
// Tarjeta individual de servicio (altura fija para alineación de grid)
export const ServiceCard = ({ service, buttonText, lang, globalPhone = "51988496839" }) => {
  const { t } = useLanguage();
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      `Buen día, estoy interesado en el servicio de ${service.title}`
    );
    window.open(`https://wa.me/${globalPhone}?text=${message}`, "_blank");
  };

  // ✅ Si lang está provisto (admin preview), usar messages directamente
  // De lo contrario, usar t() del contexto (web pública)
  const consultText = lang
    ? messages[lang]?.services?.consult ||
    (lang === "es" ? "Consultar" : "Consult")
    : buttonText || t("services.consult");

  return (
    <div
      className="rounded-2xl transition-all duration-500 group border border-gray-200 shadow-md hover:shadow-lg bg-white dark:bg-transparent"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03)), var(--glass-bg)",
        backdropFilter: "blur(10px) saturate(150%)",
        WebkitBackdropFilter: "blur(10px) saturate(150%)",
        borderColor: "var(--glass-border)",
      }}
    >
      <div className="flex flex-col h-[430px] p-8 rounded-2xl">
        {/* Icono */}
        <div
          className="h-20 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background:
              "radial-gradient(120px 120px at 30% 30%, rgba(240,82,82,0.18), rgba(240,82,82,0.06) 60%), rgba(255,255,255,0.06)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="text-red-600 transition-transform duration-700 ease-out group-hover:scale-110">
            <div className="w-16 h-16 flex items-center justify-center">
              {typeof service.icon === "function" ? (
                <service.icon className="w-10 h-10" />
              ) : (
                <AdminRenderIcon
                  iconName={service.icon}
                  className="w-10 h-10"
                />
              )}
            </div>
          </div>
        </div>
        {/* Contenido */}
        <div className="flex flex-col flex-1 px-3 py-2">
          <div>
            <h3 className="text-[15px] md:text-[16px] font-bold text-gray-900 leading-tight line-clamp-2 mb-2">
              {service.title}
            </h3>
            <p className="text-xs md:text-sm text-gray-600 leading-snug line-clamp-3 mb-3">
              {service.description}
            </p>
          </div>
          <div className="flex-1 flex flex-col">
            <ul className="space-y-1 text-xs md:text-sm text-gray-600 max-h-28 overflow-hidden">
              {service.features.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                  <span className="leading-snug">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={handleWhatsAppClick}
            className="mt-3 w-full btn-cta py-2 px-4 text-xs md:text-sm font-medium gap-2 cursor-pointer"
          >
            <svg
              className="w-4 h-4 md:w-5 md:h-5 "
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              fill="currentColor"
            >
              <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
            </svg>
            {consultText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= Services (lista) =================
const Services = ({ limit }) => {
  const { t, language } = useLanguage();
  const { settings } = useSiteSettings();
  const serviceIcons = [Brain, Settings, BookOpen, Users, BarChart3, Lightbulb];

  const globalPhone = (settings?.useSamePhone !== false ? settings?.phone : settings?.whatsapp)?.replace(/\s|\+|-/g, '') || "51988496839";

  // Map icon string name to lucide icon component
  const iconMap = useMemo(
    () => ({
      Brain,
      Settings,
      BookOpen,
      Users,
      BarChart3,
      Lightbulb,
    }),
    []
  );

  // Load dynamic services from JSON managed via Admin (/adminx)
  const [remoteServices, setRemoteServices] = useState(null);
  const [remoteError, setRemoteError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { collection, getDocs } = await import("firebase/firestore");
        const { db } = await import("../../config/firebase");
        const querySnapshot = await getDocs(collection(db, "services"));

        let data = [];
        if (!querySnapshot.empty) {
          data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } else {
          const res = await fetch("/content/services.json", {
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          data = await res.json();
        }
        if (cancelled) return;
        // Normalize and sort by optional "order"
        const normalized = (Array.isArray(data) ? data : [])
          .map((s) => ({
            id:
              s.id ||
              crypto.randomUUID?.() ||
              Math.random().toString(36).slice(2),
            icon: s.icon || "Brain",
            title:
              (s.title && (s.title[language] || s.title.es || s.title.en)) ||
              "",
            description:
              (s.description &&
                (s.description[language] ||
                  s.description.es ||
                  s.description.en)) ||
              "",
            features:
              (s.features &&
                (s.features[language] || s.features.es || s.features.en)) ||
              [],
            order: typeof s.order === "number" ? s.order : 9999,
            archived: !!s.archived,
          }))
          .sort((a, b) => a.order - b.order);
        setRemoteServices(normalized);
      } catch (e) {
        if (!cancelled) setRemoteError(String(e?.message || e));
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [language, iconMap]);
  // Sin fallbacks: sólo mostramos lo cargado desde JSON

  const benefits = [
    "Más de 15 años de experiencia en el sector",
    "Tecnología patentada internacionalmente",
    "Respaldo académico y científico",
    "Soporte técnico personalizado",
    "Resultados validados científicamente",
    "Alcance internacional en más de 15 países",
  ];

  // Preferimos lo remoto; si hay error o vacío, mostramos lista vacía con estado amable.
  const sourceRaw = remoteServices && !remoteError ? remoteServices : [];
  const source = sourceRaw.filter((s) => !s.archived);
  const displayed = limit ? source.slice(0, limit) : source;

  return (
    <section id="servicios" className="py-8 bg-gray-50 rounded-3xl shadow-lg">
      <div className="w-full mx-auto px-4">
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-center mb-3 tracking-tight">
            {t("services.title").split(" ")[0]}{" "}
            <span className="text-red-600">
              {t("services.title").split(" ").slice(1).join(" ")}
            </span>
          </h2>
          <p className="text-center text-[15px] text-gray-600 max-w-4xl mx-auto leading-snug">
            {t("services.lead")}
          </p>
        </div>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8">
            {displayed.map((service, i) => (
              <ServiceCard key={i} service={service} globalPhone={globalPhone} />
            ))}
          </div>
          {!limit && (
            <>
              <div className="mt-14 bg-white rounded-3xl border border-gray-100 shadow-3xl py-8 px-12">
                <h3 className="text-2xl font-bold text-center mb-6">
                  {t("services.whyChoose")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(t("services.benefits") || benefits).map((b, i) => (
                    <div
                      key={i}
                      className="flex items-start text-md text-gray-700"
                    >
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-3 mt-2"></span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center mt-12">
                <button
                  onClick={() => {
                    const message = encodeURIComponent(
                      "Hola, me interesa solicitar una consulta sobre sus servicios."
                    );
                    window.open(
                      `https://wa.me/${globalPhone}?text=${message}`,
                      "_blank"
                    );
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-10 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {t("services.consultAbout")}
                </button>
              </div>
            </>
          )}
          {limit && (
            <div className="text-center mt-10">
              <a
                href="/servicios"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {t("services.ctaAll")}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Services;
