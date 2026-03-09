import React, { useState, useEffect } from "react";
import { Upload, X, Plus, Link as LinkIcon } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import { normalizeTeamMember } from "../../../../models/team";
import { useProducts } from "../../../../context/hooks/useProducts";

const formatAuthorName = (fullName) => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return fullName;
  if (parts.length === 2) return `${parts[1]}, ${parts[0]}`;
  if (parts.length === 3) return `${parts[1]} ${parts[2]}, ${parts[0]}`;
  if (parts.length >= 4) {
    const apellidos = parts.slice(-2).join(" ");
    const nombres = parts.slice(0, -2).join(" ");
    return `${apellidos}, ${nombres}`;
  }
  return fullName;
};

export default function ResearchDetailForm({
  formData,
  setFormData,
  activeLang = "es",
  onPickPDF,
  onDropPDF,
  readOnly = false,
}) {
  const [newKeyword, setNewKeyword] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const { products } = useProducts();

  useEffect(() => {
    async function loadTeam() {
      try {
        const querySnapshot = await getDocs(collection(db, "team"));
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          const normalized = data.map(normalizeTeamMember).filter(m => !m.archived);
          setTeamMembers(normalized);
        }
      } catch (error) {
        console.error("Error cargando equipo:", error);
      }
    }
    loadTeam();
  }, []);

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

  const handleTeamAuthorToggle = (memberName) => {
    setFormData((prev) => {
      const currentList = prev.authorText !== undefined
        ? prev.authorText.split(";").map(a => a.trim()).filter(Boolean)
        : (prev.author || []);

      const isSelected = currentList.includes(memberName);
      const newList = isSelected
        ? currentList.filter((a) => a !== memberName)
        : [...currentList, memberName];

      return {
        ...prev,
        authorText: newList.join("; "),
        author: newList,
      };
    });
  };

  return (
    <div className={`space-y-6 pb-20 ${readOnly ? "pointer-events-none opacity-75" : ""}`}>
      {readOnly && (
        <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            📖 Modo solo lectura - Los campos no se pueden editar
          </p>
        </div>
      )}

      {/* 1. IMAGEN PORTADA (Digital Twin: aspect 16:9) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">1. Imagen de Cabecera Detalle (16:9)</h3>
        </div>
        <div className="p-6">
          <div className="relative aspect-[16/9] border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 hover:border-[#e83d38] transition-colors max-w-2xl group cursor-pointer">
            {formData.localImage ? (
              <>
                <img
                  src={formData.localImage}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData((prev) => ({ ...prev, localImage: "" }));
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm z-10"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </>
            ) : (
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                <Upload className="w-10 h-10 text-gray-400 mb-2 group-hover:text-gray-500 transition-colors" />
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">
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
          <p className="text-xs text-gray-500 mt-3">
            💡 Nota: La imagen debe contener el título del artículo.
          </p>
        </div>
      </div>

      {/* Metadata Form Block */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">2. Información del Artículo ({activeLang.toUpperCase()})</h3>
        </div>
        <div className="p-6 space-y-6">
          {/* 1.5 TÍTULO - Compartido con Vista Card */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título del Artículo
            </label>
            <input
              type="text"
              value={formData.title?.[activeLang] || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  title: {
                    ...prev.title,
                    [activeLang]: e.target.value,
                  },
                }))
              }
              placeholder="Título completo del artículo"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              ℹ️ Este título se sincroniza automáticamente con la Vista Tarjeta
            </p>
          </div>

          {/* 2. METADATA (Fecha + Revista) - Digital Twin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Publicación
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revista / Journal
              </label>
              <input
                type="text"
                value={formData.journal}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, journal: e.target.value }))
                }
                placeholder="Nombre de la revista"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow text-sm"
              />
            </div>
          </div>

          {/* 6. AUTORES */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Autores (para el bloque de citación)
            </label>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto mb-2 custom-scrollbar">
              <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">Miembros del equipo</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {teamMembers.sort((a, b) => (a.order || 0) - (b.order || 0)).map((member) => {
                  const rawName = `${member.name.es}`;
                  const memberName = formatAuthorName(rawName);

                  // Helper for checking if selected using the actual value 
                  const currentAuthorList = formData.authorText !== undefined
                    ? formData.authorText.split(";").map(a => a.trim()).filter(Boolean)
                    : (formData.author || []);

                  const isSelected = currentAuthorList.includes(memberName);

                  return (
                    <label
                      key={member.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-white px-2 py-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-200 group"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTeamAuthorToggle(memberName)}
                        className="w-4 h-4 text-[#e83d38] bg-white border-gray-300 rounded focus:ring-red-500 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate">
                        {memberName}
                      </span>
                    </label>
                  );
                })}
                {teamMembers.length === 0 && (
                  <span className="text-sm text-gray-400 italic">No hay miembros disponibles en el equipo</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-medium mb-1.5 uppercase tracking-wider">Autores Externos / Todos los autores</p>
              <textarea
                value={formData.authorText !== undefined ? formData.authorText : formData.author?.join("; ") || ""}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    authorText: inputValue,
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Escribe aquí nombres adicionales de externos. Separar autores con ; Se usarán en formato APA/MLA.
              </p>
            </div>
          </div>

          {/* 4. ABSTRACT / RESUMEN COMPLETO - Digital Twin */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
              Abstract / Resumen Completo
            </label>
            <textarea
              value={
                typeof formData.abstract === "object"
                  ? formData.abstract?.[activeLang] || ""
                  : activeLang === "es"
                    ? formData.abstract || ""
                    : ""
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  abstract:
                    typeof prev.abstract === "object"
                      ? { ...prev.abstract, [activeLang]: e.target.value }
                      : {
                        es:
                          activeLang === "es"
                            ? e.target.value
                            : prev.abstract || "",
                        en: activeLang === "en" ? e.target.value : "",
                      },
                }))
              }
              placeholder="Cuerpo completo del artículo o abstract detallado..."
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow resize-y text-sm leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Link and Docs Block */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">3. Enlaces y Documentos Complementarios</h3>
        </div>
        <div className="p-6 space-y-6">
          {/* 5. ENLACES (DOI + PDF) - Digital Twin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LinkIcon className="w-4 h-4 inline mr-1.5 text-gray-500" />
                DOI (Identificador Digital)
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#e83d38] focus:border-transparent transition-shadow text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LinkIcon className="w-4 h-4 inline mr-1.5 text-gray-500" />
                Archivo PDF (Opcional)
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm border shadow-sm ${formData.download_link_pdf
                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
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
                  <Upload className="w-4 h-4" />
                  {formData.download_link_pdf ? "PDF Cargado" : "Seleccionar PDF"}
                </button>
                {formData.download_link_pdf && (
                  <a
                    href={formData.download_link_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                  >
                    Ver archivo
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                📄 Opcional: Para lectura o descarga directa
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NOTA IMPORTANTE */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg flex gap-3 shadow-sm mx-1">
        <div className="text-blue-500 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
        </div>
        <p className="text-sm text-blue-900 leading-relaxed">
          <strong className="font-semibold block mb-1">Citas Automáticas (APA/MLA):</strong>
          El componente interno en la plataforma generará automáticamente la cita académica utilizando los parámetros que suministres: <code>Autores</code>, <code>Título</code>, <code>Año</code>, y <code>Revista</code>.
        </p>
      </div>
    </div>
  );
}
