import React, { useState, useRef } from "react";
import { Upload, X, Plus } from "lucide-react";
import ArticleCard from "../../../../components/research/ArticleCard";
import { useProducts } from "../../../../context/hooks/useProducts";

export default function ResearchCardForm({
  formData,
  setFormData,
  isNew,
  readOnly = false,
  uploadImage, // ⚠️ Hook de upload pasado desde ResearchFormModal
}) {
  const [currentLang, setCurrentLang] = useState("es");
  const [newKeyword, setNewKeyword] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const { products } = useProducts();

  const activeProducts = products.filter((p) => !p.archived);

  // ✅ Usar hook de upload si está disponible, sino fallback a FileReader
  const handleImageUpload = async (e) => {
    if (uploadImage) {
      uploadImage.pickFile(e);
    } else {
      // Fallback: FileReader directo
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          localImage: event.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ Drag & Drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (uploadImage) {
      uploadImage.dropFile(e);
    } else {
      // Fallback: FileReader directo
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFormData((prev) => ({
            ...prev,
            localImage: event.target.result,
          }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && formData.keywords.length < 6) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()],
      }));
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (index) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index),
    }));
  };

  const handleProductToggle = (productName) => {
    setFormData((prev) => {
      const isSelected = prev.products.includes(productName);
      return {
        ...prev,
        products: isSelected
          ? prev.products.filter((p) => p !== productName)
          : [...prev.products, productName],
      };
    });
  };

  // Preview data para ArticleCard
  const previewData = {
    ...formData,
    title: formData.title[currentLang] || formData.title.es || "",
    summary_30w:
      formData.summary_30w[currentLang] || formData.summary_30w.es || "",
  };

  return (
    <div
      className={`grid grid-cols-2 gap-6 h-full ${
        readOnly ? "pointer-events-none opacity-75" : ""
      }`}
    >
      {/* LEFT: Form con scroll */}
      <div className="overflow-y-auto pr-4 space-y-4 max-h-[70vh]">
        {readOnly && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-300">
              📖 Modo solo lectura - Los campos no se pueden editar
            </p>
          </div>
        )}

        {/* Language Toggle - COMENTADO: Ahora se controla desde el header del modal
        <div className="flex gap-2">
          <button
            onClick={() => !readOnly && setCurrentLang("es")}
            disabled={readOnly}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentLang === "es"
                ? "bg-red-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Español (ES)
          </button>
          <button
            onClick={() => !readOnly && setCurrentLang("en")}
            disabled={readOnly}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentLang === "en"
                ? "bg-red-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Inglés (EN)
          </button>
        </div>
        */}

        {/* 1. IMAGEN (aspect 16:9) - con Drag & Drop */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Imagen Portada (16:9)
          </label>
          <div
            className={`relative aspect-[16/9] border-2 border-dashed rounded-lg overflow-hidden transition-colors ${
              isDragging
                ? "border-red-500 bg-red-500/10"
                : "border-gray-600 bg-gray-800 hover:border-red-500"
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {formData.localImage ? (
              <>
                <img
                  src={formData.localImage}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                {!readOnly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData((prev) => ({ ...prev, localImage: "" }));
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors z-10"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}
              </>
            ) : (
              <>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("🖱️ Click en zona de imagen");
                    console.log(
                      "📁 fileInputRef.current:",
                      fileInputRef.current
                    );
                    console.log("🔒 readOnly:", readOnly);
                    if (!readOnly && fileInputRef.current) {
                      console.log("✅ Abriendo file picker...");
                      fileInputRef.current.click();
                    } else {
                      console.log("❌ No se puede abrir file picker");
                    }
                  }}
                  className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group"
                >
                  <Upload
                    className={`w-12 h-12 mb-2 transition-colors ${
                      isDragging
                        ? "text-red-500"
                        : "text-gray-500 group-hover:text-red-400"
                    }`}
                  />
                  <span
                    className={`text-sm transition-colors ${
                      isDragging
                        ? "text-red-400"
                        : "text-gray-400 group-hover:text-red-300"
                    }`}
                  >
                    {isDragging
                      ? "Suelta la imagen aquí"
                      : "Click o arrastra imagen aquí"}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    JPG, PNG, WebP (16:9 recomendado)
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={readOnly}
                />
              </>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {formData.localImage
              ? `✅ Imagen cargada (${Math.round(
                  formData.localImage.length / 1024
                )}KB)`
              : "⚠️ Sin imagen"}
          </p>
        </div>

        {/* 2. METADATA (Revista + Fecha) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Revista
            </label>
            <input
              type="text"
              value={formData.journal}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, journal: e.target.value }))
              }
              placeholder="Nombre de la revista"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
            />
          </div>
        </div>

        {/* 3. TÍTULO */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Título ({currentLang.toUpperCase()})
          </label>
          <input
            type="text"
            value={formData.title[currentLang]}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                title: { ...prev.title, [currentLang]: e.target.value },
              }))
            }
            placeholder="Título del artículo"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm"
          />
        </div>

        {/* 4. RESUMEN 30 PALABRAS */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Resumen breve - 30 palabras ({currentLang.toUpperCase()})
          </label>
          <textarea
            value={formData.summary_30w[currentLang]}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                summary_30w: {
                  ...prev.summary_30w,
                  [currentLang]: e.target.value,
                },
              }))
            }
            placeholder="Resumen corto (máximo 30 palabras)"
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 resize-none text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            Palabras:{" "}
            {formData.summary_30w[currentLang]?.split(/\s+/).filter(Boolean)
              .length || 0}{" "}
            / 30
          </p>
        </div>

        {/* 5. KEYWORDS */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Keywords (máx. 6)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
              placeholder="Nueva keyword"
              disabled={formData.keywords.length >= 6}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 disabled:opacity-50 text-sm"
            />
            <button
              onClick={handleAddKeyword}
              disabled={formData.keywords.length >= 6}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.keywords.map((keyword, index) => (
              <span
                key={index}
                className="bg-gray-700 text-white text-sm px-3 py-1 rounded-full flex items-center gap-2"
              >
                {keyword}
                <button
                  onClick={() => handleRemoveKeyword(index)}
                  className="hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 6. PRODUCTOS RELACIONADOS */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Productos Relacionados{" "}
            <span className="text-gray-400 font-normal">
              (marcar para agregar)
            </span>
          </label>
          <div className="max-h-64 overflow-y-auto bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
              {activeProducts
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((product) => {
                  const productName =
                    product.name?.es || product.name?.en || product.id;
                  return (
                    <label
                      key={product.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 px-2 py-0 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.products.includes(productName)}
                        onChange={() => handleProductToggle(productName)}
                        className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-300 truncate">
                        {productName}
                      </span>
                    </label>
                  );
                })}

              {/* Opción "Otros" */}
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 px-2 py-0 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={formData.products.includes("Otros")}
                  onChange={() => handleProductToggle("Otros")}
                  className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 flex-shrink-0"
                />
                <span className="text-sm text-gray-400 italic truncate">
                  Otros
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Preview Sticky */}
      <div className="sticky top-0 h-fit max-h-[70vh] overflow-y-auto">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Vista Previa</h3>
            <span className="text-xs text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
              Idioma: {currentLang.toUpperCase()}
            </span>
          </div>
          <div className="max-w-md mx-auto">
            <ArticleCard article={previewData} isPreview={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
