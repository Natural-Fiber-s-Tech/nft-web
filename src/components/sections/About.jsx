import React from "react";
import concytecPdf from "../../assets/images/About/Resolucion-CONCYTEC.pdf";
import Team from "./Team";
import {
  Users,
  Target,
  Eye,
  ShieldCheck,
  CalendarPlus2,
  BookOpenCheck,
  Globe,
} from "lucide-react";
import { useLanguage } from "../../context/hooks/useLanguage";

const StatCard = ({ icon, value, label }) => (
  <div className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
    <div className="flex flex-col items-center text-center">
      <div className="text-red-600 mb-4">{icon}</div>
      <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  </div>
);

// Sección reutilizable: Hero (varía estilos según resume)
const SectionHero = ({ resume }) => {
  const { t } = useLanguage();
  return (
    <div
      className={`grid-ctx ${resume ? "min-h-[360px] mb-[50px]" : "min-h-[220px] mb-[40px]"
        } items-stretch`}
    >
      <div
        className={`span-12 rounded-2xl shadow-lg ${resume ? "bg-gray-50" : "bg-white p-8"
          }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 items-center justify-items-center">
          {/* Texto */}
          <div
            className={`w-full flex flex-col px-8 justify-center ${resume ? "text-center md:text-left md:pl-8" : ""
              }`}
          >
            <h3 className="text-2xl font-bold text-gray-900">
              {t("about.title")}
            </h3>
            <h3 className="text-3xl lg:text-3xl font-bold text-red-600 mb-6">
              FIBERSTECH
            </h3>
            <p className="text-gray-700 text-sm text-justify leading-relaxed">
              {t("about.intro")}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-12 my-12">
              <a
                href={concytecPdf}
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 font-semibold underline underline-offset-4 hover:text-green-800 transition-colors"
              >
                {t("about.concytecLink")}
              </a>
            </div>
          </div>
          {/* Video */}
          <div className="w-full">
            <div className="relative w-full rounded-xl overflow-hidden shadow-2xl">
              {/* 16:9 aspect ratio */}
              <div className="pt-[60%]"></div>
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/HUVLqti1SCY"
                title="Video corporativo - Natural Fiber's Tech"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sección reutilizable: Stats
const SectionStats = ({ stats }) => {
  const { t } = useLanguage();
  return (
    <div className="grid-ctx mb-[40px]">
      <div className="span-12">
        <h3 className="text-2xl font-bold text-center text-gray-900 mb-6">
          {t("about.statsTitle")}
        </h3>
      </div>
      <div className="span-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  );
};

// Sección reutilizable: Qué nos hace únicos
const SectionUnique = () => {
  const { t } = useLanguage();
  return (
    <div className="grid-ctx mb-[50px]">
      <div className="span-12">
        <h3 className="text-2xl font-bold text-center text-gray-900 mb-6">
          {t("about.unique.title")}
        </h3>
      </div>
      <div className="span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {/* Innovación */}
        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="text-red-600 mb-4 flex justify-center">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
            {t("about.unique.innovation.title")}
          </h3>
          <p className="text-gray-600">{t("about.unique.innovation.desc")}</p>
        </div>
        {/* Precisión */}
        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="text-red-600 mb-4 flex justify-center">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
            {t("about.unique.precision.title")}
          </h3>
          <p className="text-gray-600">{t("about.unique.precision.desc")}</p>
        </div>
      </div>
    </div>
  );
};

// Tarjeta para principios
const PrincipleCard = ({ icon: Icon, title, text }) => (
  <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
    <div className="text-red-600 mb-3">
      <Icon className="w-8 h-8" />
    </div>
    <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
    <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
  </div>
);

// Sección Historia
const SectionHistory = () => {
  const { t } = useLanguage();
  return (
    <div className="grid-ctx mb-[40px]">
      <div className="span-12 bg-white rounded-2xl p-8 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          {t("about.history.title")}
        </h3>
        <div className="prose max-w-none text-gray-700">
          <p>{t("about.history.p1")}</p>
          <br />
          <p>{t("about.history.p2")}</p>
          <br />
          <p>{t("about.history.p3")}</p>
          <br />
          <p>{t("about.history.p4")}</p>
        </div>
      </div>
    </div>
  );
};

// Sección Principios
const SectionPrinciples = ({ principles }) => {
  const { t } = useLanguage();
  return (
    <div className="grid-ctx mb-[40px]">
      <div className="span-12">
        <h3 className="text-2xl font-bold text-center text-gray-900 mb-6">
          {t("about.principles.title")}
        </h3>
      </div>
      <div className="span-12 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {principles.map((p, i) => (
          <PrincipleCard key={i} {...p} />
        ))}
      </div>
    </div>
  );
};

// Sección CTA (varía según resume)
const SectionCTA = ({ resume }) => {
  const { t } = useLanguage();
  return (
    <div className="grid-ctx">
      <div className="span-12 text-center">
        <div className="bg-gray-0 pb-12">
          {resume ? (
            <>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {t("about.cta.title")}
              </h3>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                {t("about.cta.lead")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/#nosotros"
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {t("about.cta.moreAboutUs")}
                </a>
                <a
                  href="https://wa.me/51988496839?text=Hola%2C%20me%20interesa%20conocer%20m%C3%A1s%20sobre%20la%20empresa%20y%20sus%20soluciones."
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white hover:bg-red-600 text-red-600 hover:text-white border-2 border-red-600 font-semibold py-3 px-8 rounded-lg transition-all duration-300"
                >
                  {t("about.cta.contactUs")}
                </a>
              </div>
            </>
          ) : (
            <button
              onClick={() => {
                const message = encodeURIComponent(
                  "Hola, me interesa conocer más sobre la empresa y sus soluciones."
                );
                const phoneNumber = "51988496839";
                window.open(
                  `https://wa.me/${phoneNumber}?text=${message}`,
                  "_blank"
                );
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold mt-8 py-3 px-10 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {t("about.cta.talkToAdvisor")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const About = ({ resume = false }) => {
  const { t } = useLanguage();
  // Stats unificados (siempre 4) usando íconos de lucide-react
  const stats = [
    {
      icon: <CalendarPlus2 className="w-10 h-10" />,
      value: "2016",
      label: t("about.stats.founded"),
    },
    {
      icon: <Globe className="w-10 h-10" />,
      value: "15+",
      label: t("about.stats.countries"),
    },
    {
      icon: <Users className="w-10 h-10" />,
      value: "630K+",
      label: t("about.stats.fibers"),
    },
    {
      icon: <BookOpenCheck className="w-10 h-10" />,
      value: "7+",
      label: t("about.stats.innovations"),
    },
  ];

  const principles = [
    {
      icon: Target,
      title: t("about.principles.mission.title"),
      text: t("about.principles.mission.desc"),
    },
    {
      icon: Eye,
      title: t("about.principles.vision.title"),
      text: t("about.principles.vision.desc"),
    },
    {
      icon: ShieldCheck,
      title: t("about.principles.values.title"),
      text: t("about.principles.values.desc"),
    },
  ];

  return (
    <section
      id="nosotros"
      className="bg-gray-50 rounded-2xl shadow-lg pt-[50px]"
    >
      <div className="w-full px-4">
        <SectionHero resume={resume} />
        <SectionStats stats={stats} />
        <SectionUnique />
        {!resume && (
          <>
            <SectionHistory />
            <SectionPrinciples principles={principles} />
            <Team />
          </>
        )}
        <SectionCTA resume={resume} />
      </div>
    </section>
  );
};

export default About;
