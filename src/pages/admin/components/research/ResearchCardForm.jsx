import React, { useState, useRef } from "react";
import { Upload, X, Plus } from "lucide-react";
import ArticleCard from "../../../../components/research/ArticleCard";
import { useProducts } from "../../../../context/hooks/useProducts";

export default function ResearchCardForm({
  formData,
  setFormData,
  activeLang = "es",
  isNew,
  readOnly = false,
  onImagePick,
}) {
  const [newKeyword, setNewKeyword] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const { products } = useProducts();

  const activeProducts = products.filter((p) => !p.archived);

  const handleImageChange = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    onImagePick?.(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    handleImageChange(file);
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

  return (
    <div className={`space-y-6 pb-20 ${readOnly ? "pointer-events-none opacity-75" : ""}`}>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">1. Imagen de Portada (16:9)</h3>
        </div>
        <div className="p-6">
          <div
            className={`relative aspect-[16/9] max-w-lg border-2 border-dashed rounded-xl overflow-hidden transition-colors cursor-pointer ${isDragging ? "border-[#e83d38] bg-red-50" : "border-gray-300 bg-gray-50 hover:border-gray-400"}`}
            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !readOnly && fileInputRef.current?.click()}
          >
            {formData.localImage ? (
              <>
                <img src={formData.localImage} alt="Preview" className="w-full h-full object-contain" />
                {!readOnly && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setFormData((prev) => ({ ...prev, localImage: "" })); }}
                    className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors z-10 shadow-sm"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Upload className={`w-10 h-10 mb-2 transition-colors ${isDragging ? "text-[#e83d38]" : "text-gray-400"}`} />
                  <span className={`text-sm font-medium transition-colors ${isDragging ? "text-[#e83d38]" : "text-gray-600"}`}>
                    {isDragging ? "Suelta la imagen aquí" : "Click o arrastra imagen aquí"}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">JPG, PNG, WebP (16:9 recomendado)</span>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleImageChange(e.target.files?.[0])} className="hidden" disabled={readOnly} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bloque Metadata */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">2. Datos de Publicación</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Revista</label>
            <input
              type="text"
              value={formData.journal}
              onChange={(e) => setFormData((prev) => ({ ...prev, journal: e.target.value }))}
              placeholder="Nombre de la revista"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Oficial</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow text-sm"
            />
          </div>
        </div>
      </div>

      {/* Bloque Textos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">3. Textos Descriptivos ({activeLang.toUpperCase()})</h3>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título de la investigación *</label>
            <input
              type="text"
              value={formData.title[activeLang] || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  title: { ...prev.title, [activeLang]: e.target.value },
                }))
              }
              placeholder="Título del artículo"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resumen breve (máx. 30 palabras) *</label>
            <textarea
              value={formData.summary_30w[activeLang] || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  summary_30w: {
                    ...prev.summary_30w,
                    [activeLang]: e.target.value,
                  },
                }))
              }
              placeholder="Resumen corto para la tarjeta"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow resize-y text-sm"
            />
            <p className="text-xs text-gray-500 mt-2 text-right">
              Palabras: {formData.summary_30w[activeLang]?.split(/\s+/).filter(Boolean).length || 0} / 30
            </p>
          </div>
        </div>
      </div>

      {/* Etiquetas Relacionadas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">4. Etiquetas & Filtros globales</h3>
        </div>
        <div className="p-6 space-y-8">
          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Keywords / Palabras Clave (máx. 6)</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
                placeholder="Escribe una nueva keyword y presiona enter"
                disabled={formData.keywords.length >= 6}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-[#e83d38] focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
              />
              <button
                onClick={handleAddKeyword}
                disabled={formData.keywords.length >= 6 || !newKeyword.trim()}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.keywords.length === 0 && (
                <span className="text-sm text-gray-400 italic">No hay keywords asignadas</span>
              )}
              {formData.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 border border-gray-200 text-sm px-3 py-1 rounded-full flex items-center gap-2 font-medium"
                >
                  {keyword}
                  <button
                    onClick={() => handleRemoveKeyword(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Productos Relacionados <span className="text-gray-400 font-normal ml-1"> (para el pie del artículo)</span>
            </label>
            <div className="max-h-64 overflow-y-auto bg-gray-50 rounded-xl p-4 border border-gray-200 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {activeProducts
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((product) => {
                    const productName = product.name?.es || product.name?.en || product.id;
                    return (
                      <label
                        key={product.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-white px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-gray-200 group"
                      >
                        <input
                          type="checkbox"
                          checked={formData.products.includes(productName)}
                          onChange={() => handleProductToggle(productName)}
                          className="w-4 h-4 text-[#e83d38] bg-white border-gray-300 rounded focus:ring-red-500 flex-shrink-0"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate font-medium">
                          {productName}
                        </span>
                      </label>
                    );
                  })}

                {/* Opción "Otros" */}
                <label className="flex items-center gap-3 cursor-pointer hover:bg-white px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-gray-200 group">
                  <input
                    type="checkbox"
                    checked={formData.products.includes("Otros")}
                    onChange={() => handleProductToggle("Otros")}
                    className="w-4 h-4 text-[#e83d38] bg-white border-gray-300 rounded focus:ring-red-500 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-500 italic truncate font-medium">
                    Otros
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
