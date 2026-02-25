import React, { useState, useEffect } from "react";
import { useLanguage } from "../../context/hooks/useLanguage";

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useLanguage();

  const slides = [
    {
      image: "/assets/images/hero/Edgar_fibra_portada4-1536x799.jpg",
      title: t("hero.slides.0.title"),
      subtitle: t("hero.slides.0.subtitle"),
    },
    {
      image: "/assets/images/hero/banner3-1536x1023.jpg",
      title: t("hero.slides.1.title"),
      subtitle: t("hero.slides.1.subtitle"),
    },
    {
      image: "/assets/images/hero/IMG_4648-scaled.jpg",
      title: t("hero.slides.2.title"),
      subtitle: t("hero.slides.2.subtitle"),
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section
      id="inicio"
      className="relative overflow-hidden rounded-[1rem] shadow-lg"
    >
      {/* Aspect Ratio 16:9 wrapper */}
      <div
        className="relative w-full rounded-[1rem] overflow-hidden"
        style={{ paddingTop: "56.25%" }}
      >
        {/* Slides */}
        <div className="absolute inset-0 rounded-[1rem] overflow-hidden">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-2000 ease-in-out rounded-[1rem] overflow-hidden
              ${index === currentSlide ? "opacity-100" : "opacity-0"}`}
            >
              {/* Overlay gradient - Removido el rojo para ver las imágenes claramente */}
              <div className="absolute inset-0 z-10 rounded-[1rem]" />

              {/* Background image with 3D effect (img-based for better responsiveness) */}
              <div
                className="absolute inset-0 transition-all duration-[2000ms] rounded-[1rem] overflow-hidden"
                style={{
                  transform:
                    index === currentSlide
                      ? "scale(1) perspective(1000px) rotateY(0deg)"
                      : index === (currentSlide + 1) % slides.length
                        ? "scale(0.9) perspective(1000px) rotateY(-15deg) translateX(5%)"
                        : "scale(0.9) perspective(1000px) rotateY(15deg) translateX(-5%)",
                  transformOrigin: "center center",
                  backfaceVisibility: "hidden",
                }}
              >
                {/* images rounded 1rem */}
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover object-center rounded-[1rem]"
                  loading="eager"
                />
              </div>

              {/* Content */}
              <div className="absolute inset-0 z-20 flex items-center justify-center ">
                <div className=" bg-opacity-50 w-full flex justify-center">
                  <div className="max-w-5xl px-4 sm:px-6 lg:px-8 text-center pt-12 md:pt-0">
                    <h1
                      className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6 translate-y-8 animate-fadeIn drop-shadow-lg/50 leading-tight">
                      {slide.title}
                    </h1>
                    <p
                      className="text-base sm:text-xl md:text-2xl text-white mb-6 sm:mb-8 max-w-3xl mx-auto translate-y-8 animate-fadeIn drop-shadow-md/50 leading-relaxed">
                      {slide.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all hover:scale-110 backdrop-blur-sm"
        aria-label={t("hero.prev")}
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all hover:scale-110 backdrop-blur-sm"
        aria-label={t("hero.next")}
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Dots navigation */}
      <div className="absolute bottom-3 md:bottom-5 lg:bottom-7 left-1/2 transform -translate-x-1/2 z-30 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors
              ${index === currentSlide
                ? "bg-white"
                : "bg-white/50 hover:bg-white/75"
              }`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
