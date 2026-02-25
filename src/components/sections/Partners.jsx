import React from "react";
import { Link } from "react-router-dom";

import { useLanguage } from "../../context/hooks/useLanguage";

const partners = [
  { src: "/assets/images/partners/Maxcorp.png", alt: "Maxcorp" },
  { src: "/assets/images/partners/U-LIMA.png", alt: "Universidad de Lima" },
  { src: "/assets/images/partners/INTA.png", alt: "INTA" },
  {
    src: "/assets/images/partners/UCC.png",
    alt: "Universidad Católica de Córdoba",
  },
  { src: "/assets/images/partners/UNALM.png", alt: "UNALM" },
  { src: "/assets/images/partners/UNMSM.png", alt: "UNMSM" },
  { src: "/assets/images/partners/UNCP.png", alt: "UNCP" },
  { src: "/assets/images/partners/UNH.png", alt: "UNH" },
  {
    src: "/assets/images/partners/U-PUNO.png",
    alt: "Universidad Nacional del Altiplano Puno",
  },
  {
    src: "/assets/images/partners/Municipalidad_Corani.png",
    alt: "Municipalidad de Corani",
  },
];

const Partners = () => {
  const { t } = useLanguage();
  const marqueeLogos = [...partners, ...partners];

  return (
    <section id="investigacion" className="relative py-16 bg-neutral-10">
      <div className="w-full px-4">
        <div className="grid-ctx items-end mb-8">
          <div className="span-12">
            <p className="text-xs tracking-widest uppercase text-gray-500 mb-2">
              {t("partners.tagline")}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t("partners.title").split(" ")[0]}{" "}
              {t("partners.title").split(" ")[1]}{" "}
              <span className="text-red-600">
                {t("partners.title").split(" ")[2] || ""}
              </span>
            </h2>
          </div>
        </div>

        {/* Marquee */}
        <div className="relative">
          {/* edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-neutral-50 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-neutral-50 to-transparent" />

          <div className="overflow-hidden">
            <ul className="partners-marquee flex items-center gap-10 md:gap-16 will-change-transform">
              {marqueeLogos.map((logo, idx) => (
                <li key={idx} className="shrink-0">
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className="h-16 md:h-14 lg:h-16 w-auto object-contain opacity-80 hover:opacity-100 saturate-80 hover:saturate-100 transition duration-200"
                    loading="lazy"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center gap-10 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Link
            to="/investigacion"
            className="bg-red-600 hover:bg-red-700 text-white 
                           font-semibold py-3 px-8 rounded-lg 
                           transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {t("partners.cta")}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Partners;
