import { useLanguage } from "../../context/hooks/useLanguage";
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";

// Components
import ProductDetailTemplate from "../../components/products/ProductDetailTemplate";

// Main ProductDetail component
const ProductDetail = () => {
  const { t, language } = useLanguage();
  const { productSlug } = useParams();
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
    ? jsonProducts.find((p) => p.slug === productSlug || p.id === productSlug)
    : null;

  // Parsea el jsonItem basándose en el lenguaje actual usando la convención del schema (Flat Schema)
  const product = jsonItem
    ? {
      ...jsonItem,
      id: jsonItem.id, // always preserve original ID
      name: typeof jsonItem[`name_${language}`] === "string" ? jsonItem[`name_${language}`] : typeof jsonItem.name_es === "string" ? jsonItem.name_es : typeof jsonItem.name === "string" ? jsonItem.name : jsonItem.name?.[language] || jsonItem.name?.es || jsonItem.id,
      subtitle: typeof jsonItem[`subtitle_${language}`] === "string" ? jsonItem[`subtitle_${language}`] : typeof jsonItem.subtitle_es === "string" ? jsonItem.subtitle_es : typeof jsonItem.subtitle === "string" ? jsonItem.subtitle : jsonItem.subtitle?.[language] || jsonItem.subtitle?.es || "",
      description: typeof jsonItem[`description_${language}`] === "string" ? jsonItem[`description_${language}`] : typeof jsonItem.description_es === "string" ? jsonItem.description_es : typeof jsonItem.description === "string" ? jsonItem.description : jsonItem.description?.[language] || jsonItem.description?.es || "",
      photos: jsonItem.photos || jsonItem.image || "",
      video: jsonItem.video || jsonItem.youtubeVideo || "",
      technicalSheets: {
        es: jsonItem.technical_sheet_es || jsonItem.technicalSheets?.es || "",
        en: jsonItem.technical_sheet_en || jsonItem.technicalSheets?.en || "",
      },
      tag: jsonItem[`tag_${language}`] || jsonItem.tag_es || jsonItem.category || "",
      // Mantenemos listas vacías por defecto si no están, pero leemos los valores si existen
      features: jsonItem.features || [],
      specifications: jsonItem.specifications || {},
      specifications_list: jsonItem.specifications_list || [],
      capabilities: jsonItem.capabilities || [],
      main_features: jsonItem.main_features || [],
      gallery: jsonItem.gallery || jsonItem.additionalImages || []
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
            subtitle: localized.subtitle,
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
