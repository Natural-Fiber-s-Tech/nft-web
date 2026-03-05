import { useLanguage } from "../../context/hooks/useLanguage";
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Zap,
  Monitor,
  Shield,
  BarChart3,
  Settings,
  Camera,
  Microscope,
  Weight,
  Ruler,
  Activity,
  ChevronRight,
  SquarePlay,
} from "lucide-react";
// Eliminado: catálogo en src/data. Usamos exclusivamente /content/products.json
import ProductDetailTemplate from "../../components/products/ProductDetailTemplate";

// Feature card component supports icon as lucide component or icon name string
const iconMap = {
  BarChart3,
  Ruler,
  Activity,
  Monitor,
  Microscope,
  Shield,
  Settings,
  Camera,
  Weight,
};
const FeatureCard = ({ icon: IconOrName, title, description }) => {
  const Icon =
    typeof IconOrName === "string"
      ? iconMap[IconOrName] || BarChart3
      : IconOrName;
  return (
    <div className="group bg-white p-3 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center gap-2 mb-2 justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
          <Icon className="h-4 w-4 text-red-600" />
        </div>
      </div>
      <p className="text-gray-600 text-xs leading-relaxed">{description}</p>
    </div>
  );
};

// Specification row component
const SpecRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
    <span className="font-medium text-gray-700">{label}</span>
    <span className="text-gray-900 text-right max-w-xs">{value}</span>
  </div>
);

// Capability item component
const CapabilityItem = ({ children }) => (
  <div className="flex items-start space-x-3">
    <ChevronRight className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
    <span className="text-gray-700 leading-relaxed">{children}</span>
  </div>
);

// Product Media Carousel Component
const ProductMediaCarousel = ({ product }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get media items (video first, then images)
  const getMediaItems = () => {
    const items = [];

    // Add YouTube video if available
    if (product.video) {
      items.push({
        type: "video",
        url: product.video,
        title: `Video de ${product.name}`,
      });
    }

    // Add main product image
    items.push({
      type: "image",
      url: product.photos,
      title: product.name,
      alt: product.name,
    });

    return items;
  };

  const mediaItems = getMediaItems();
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
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const currentItem = mediaItems[currentIndex];

  const { t } = useLanguage();
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
            src={currentItem.url}
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
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200"
          >
            <ChevronRight className="h-5 w-5 text-gray-600 rotate-180" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200"
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
              {currentItem.type === "video"
                ? t("productDetail.ui.mediaVideo")
                : t("productDetail.ui.mediaImage")}{" "}
              - {currentIndex + 1} / {totalItems}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

// Main ProductDetail component
const ProductDetail = () => {
  const { t, language } = useLanguage();
  const { productId } = useParams();
  const [jsonProducts, setJsonProducts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { collection, getDocs } = await import("firebase/firestore");
        const { db } = await import("../../config/firebase");
        const querySnapshot = await getDocs(collection(db, "products"));

        let data = [];
        if (!querySnapshot.empty) {
          data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } else {
          const res = await fetch("/content/products.json", {
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          data = await res.json();
        }

        if (!cancelled) setJsonProducts(Array.isArray(data) ? data : null);
      } catch (err) {
        console.error("Error loading products:", err);
        if (!cancelled) setJsonProducts(null);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const jsonItem = Array.isArray(jsonProducts)
    ? jsonProducts.find((p) => p.id === productId)
    : null;

  // Parsea el jsonItem basándose en el lenguaje actual usando la convención del schema (Flat Schema)
  const product = jsonItem
    ? {
      id: productId,
      name: jsonItem[`name_${language}`] || jsonItem.name_es || productId,
      description: jsonItem[`description_${language}`] || jsonItem.description_es || "",
      photos: jsonItem.photos || "",
      video: jsonItem.video || "",
      technicalSheets: {
        es: jsonItem.technical_sheet_es || "",
        en: jsonItem.technical_sheet_en || "",
      },
      tag: jsonItem[`tag_${language}`] || jsonItem.tag_es || "",
      // Mantenemos listas vacías si ya no se usan a nivel template para evitar errores:
      features: [],
      specifications: {},
      capabilities: []
    }
    : null;

  // Build localized product view
  const localized = product;
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t("productDetail.ui.notFound")}
          </h1>
          <Link
            to="/productos"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            {t("productDetail.ui.backToProducts")}
          </Link>
        </div>
      </div>
    );
  }

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Hola, estoy interesado en obtener más información sobre el ${product.name}. ¿Podrían enviarme detalles sobre precios, disponibilidad y especificaciones técnicas?`
    );
    const phoneNumber = "51988496839";
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[1110px] mx-auto px-4 pt-4 pb-12">
        {/* Breadcrumb */}
        <div className="grid-ctx mb-4">
          <div className="span-12">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link to="/" className="hover:text-red-600 transition-colors">
                {t("nav.home")}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link
                to="/productos"
                className="hover:text-red-600 transition-colors"
              >
                {t("nav.products")}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900">{localized.name}</span>
            </div>
          </div>
        </div>

        <ProductDetailTemplate
          product={{
            ...product,
            name: localized.name,
            tagline: localized.tag,
            description: localized.description,
            features: localized.features,
          }}
          labels={{
            datasheetES: t("productDetail.ui.datasheetES"),
            datasheetEN: t("productDetail.ui.datasheetEN"),
            mainFeatures: t("productDetail.ui.mainFeatures"),
            technicalSpecs: t("productDetail.ui.technicalSpecs"),
            capabilities: t("productDetail.ui.capabilities"),
          }}
          editable={false}
        />
      </div>
    </div>
  );
};

export default ProductDetail;
