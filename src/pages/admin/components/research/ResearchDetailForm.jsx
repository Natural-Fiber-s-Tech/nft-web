import React, { useState } from "react";
import { Upload, X, Plus, Link as LinkIcon } from "lucide-react";
import { useProducts } from "../../../../context/hooks/useProducts";

export default function ResearchDetailForm({
  formData,
  setFormData,
  onPickPDF,
  onDropPDF,
  readOnly = false,
}) {
  const [currentLang, setCurrentLang] = useState("es");
  const [newKeyword, setNewKeyword] = useState("");
  const { products } = useProducts();

  const activeProducts = products.filter((p) => !p.archived);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        localImage: event.target.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
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
    <div
      className={`max-w-4xl mx-auto space-y-6 ${
        readOnly ? "pointer-events-none opacity-75" : ""
      }`}
    >
      {readOnly && (
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
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

      {/* 1. IMAGEN PORTADA (Digital Twin: aspect 16:9) */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Imagen Portada (16:9) - La imagen contiene el título
        </label>
        <div className="relative aspect-[16/9] border-2 border-dashed border-gray-600 rounded-lg overflow-hidden bg-gray-800 hover:border-red-500 transition-colors max-w-2xl">
          {formData.localImage ? (
            <>
              <img
                src={formData.localImage}
                alt="Preview"
                className="w-full h-full object-contain"
              />
              <button
                onClick={() =>
                  setFormData((prev) => ({ ...prev, localImage: "" }))
                }
                className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </>
          ) : (
            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
              <Upload className="w-12 h-12 text-gray-500 mb-2" />
              <span className="text-sm text-gray-400">
                Click para subir imagen
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          💡 Nota: La imagen debe contener el título del artículo. No es
          necesario campo de texto adicional.
        </p>
      </div>

      {/* 1.5 TÍTULO - Compartido con Vista Card */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Título del Artículo ({currentLang.toUpperCase()})
        </label>
        <input
          type="text"
          value={formData.title?.[currentLang] || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              title: {
                ...prev.title,
                [currentLang]: e.target.value,
              },
            }))
          }
          placeholder={`Título en ${
            currentLang === "es" ? "español" : "inglés"
          }`}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500"
        />
        <p className="text-xs text-gray-400 mt-2">
          ℹ️ Este título se comparte entre Vista Card y Vista Detalle
        </p>
      </div>

      {/* 2. METADATA (Fecha + Revista) - Digital Twin */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Fecha de Publicación
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, date: e.target.value }))
            }
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Revista / Journal
          </label>
          <input
            type="text"
            value={formData.journal}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, journal: e.target.value }))
            }
            placeholder="Nombre de la revista"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500"
          />
        </div>
      </div>

      {/* 3. KEYWORDS - Digital Twin */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Keywords (se muestran como badges debajo de la fecha)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
            placeholder="Nueva keyword"
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500"
          />
          <button
            onClick={handleAddKeyword}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
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

      {/* 4. ABSTRACT / RESUMEN COMPLETO - Digital Twin */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Abstract / Resumen Completo ({currentLang.toUpperCase()})
        </label>
        <textarea
          value={
            typeof formData.abstract === "object"
              ? formData.abstract?.[currentLang] || ""
              : currentLang === "es"
              ? formData.abstract || ""
              : ""
          }
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              abstract:
                typeof prev.abstract === "object"
                  ? { ...prev.abstract, [currentLang]: e.target.value }
                  : {
                      es:
                        currentLang === "es"
                          ? e.target.value
                          : prev.abstract || "",
                      en: currentLang === "en" ? e.target.value : "",
                    },
            }))
          }
          placeholder="Resumen completo del artículo con todos los detalles..."
          rows={8}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 resize-none"
        />
        <p className="text-xs text-gray-400 mt-2">
          ℹ️ Este es el abstract completo que se muestra en la página de
          detalle. No confundir con el resumen de 30 palabras de la Vista Card.
        </p>
      </div>

      {/* 5. ENLACES (DOI + PDF) - Digital Twin */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Enlaces de Acceso a la Publicación
        </label>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            <LinkIcon className="w-3 h-3 inline mr-1" />
            DOI (Digital Object Identifier) - Opcional
          </label>
          <input
            type="url"
            value={formData.download_link_DOI || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                download_link_DOI: e.target.value,
              }))
            }
            placeholder="https://doi.org/10.xxxx/xxxxx"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">
            <LinkIcon className="w-3 h-3 inline mr-1" />
            PDF - Opcional
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                formData.download_link_pdf
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/50 hover:bg-green-600 hover:shadow-xl hover:-translate-y-0.5"
                  : "bg-gray-700 border border-gray-600 text-gray-400 hover:bg-gray-600"
              }`}
              onClick={onPickPDF}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDropPDF}
              title={
                formData.download_link_pdf
                  ? "PDF cargado - Click para cambiar"
                  : "Cargar PDF"
              }
            >
              {formData.download_link_pdf ? "✓ Cargado" : "Vacío"}
            </button>
            {formData.download_link_pdf && (
              <a
                href={formData.download_link_pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Ver PDF
              </a>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            📄 Opcional: Algunas revistas prohiben compartir PDFs directamente
          </p>
        </div>
      </div>

      {/* 6. AUTORES - Digital Twin */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Autores (se muestran en el bloque de citación)
        </label>
        <textarea
          value={formData.authorText || formData.author.join("; ")}
          onChange={(e) => {
            const inputValue = e.target.value;
            setFormData((prev) => ({
              ...prev,
              authorText: inputValue,
              // Procesar autores solo para guardar, pero mantener el texto original para edición
              author: inputValue
                ? inputValue
                    .split(";")
                    .map((a) => a.trim())
                    .filter((a) => a !== "")
                : [],
            }));
          }}
          placeholder="Apellido, Nombre(s); Apellido2, Nombre2(s); ..."
          rows={2}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          Separar autores con ; Se usarán en el formato de citación APA/MLA.
        </p>
      </div>

      {/* 7. PRODUCTOS RELACIONADOS */}
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

      {/* NOTA IMPORTANTE */}
      <div className="bg-gray-800 border-l-4 border-red-500 p-4 rounded-lg">
        <p className="text-sm text-gray-300">
          <strong className="text-white">📋 Formato de Citación:</strong> El
          componente InvestigacionDetail genera automáticamente las citas en
          formato APA y MLA usando los campos: autores, título, fecha, revista y
          DOI. No es necesario editar manualmente las citas.
        </p>
      </div>
    </div>
  );
}
