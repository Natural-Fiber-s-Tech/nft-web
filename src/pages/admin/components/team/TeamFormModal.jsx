import React, { useEffect, useMemo, useRef, useState } from "react";
import { TeamMemberCard } from "../../../../components/sections/Team";
import { Upload, X } from "lucide-react";
import { useAutoTranslate } from "../../hooks/useAutoTranslate";
import { useFileUpload } from "../../hooks/useFileUpload";
import { messages } from "../../../../config/i18n";
import ConfirmModal from "../common/ConfirmModal";
import TeamFormComponent from "./TeamFormComponent";
import { uploadFileToSupabase, compressImageToWebP } from "../../../../lib/storage";

export default function TeamFormModal({
  open,
  member,
  mode = "edit",
  onClose,
  onSave,
  onRestore,
}) {
  const [data, setData] = useState(() => member || {});
  const [showTip, setShowTip] = useState(null);
  const [activeLang, setActiveLang] = useState("es"); // ✅ Consistente con Services
  const fileInputRef = useRef(null);
  const cvInputRef = useRef(null); // ✅ Ref para input de CV
  const [uploadMsg, setUploadMsg] = useState("");
  const [cvMsg, setCvMsg] = useState(""); // ✅ Mensaje para upload de CV
  const [previewMode, setPreviewMode] = useState(
    mode === "view" ? "plain" : "overlay"
  ); // 'overlay' | 'plain'

  // Pending files to upload on save
  const [pendingPhotoFile, setPendingPhotoFile] = useState(null);
  const [pendingCVFile, setPendingCVFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para modales de confirmación y alertas
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });
  const [alertModal, setAlertModal] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
  });

  // Helpers para mostrar modales con mejor UX
  const showAlert = (message, type = "info", title = "Información") => {
    setAlertModal({
      open: true,
      type,
      title,
      message,
    });
  };

  const showConfirm = (
    message,
    onConfirm,
    type = "warning",
    title = "Confirmación"
  ) => {
    return new Promise((resolve) => {
      setConfirmModal({
        open: true,
        type,
        title,
        message,
        onConfirm: () => {
          onConfirm?.();
          resolve(true);
        },
      });
    });
  };

  // 🔥 Hook de upload de archivos (DRY pattern)
  const uploadPhoto = useFileUpload({
    accept: "image/*",
    usePreview: true, // No subir de inmediato
    maxSize: 5 * 1024 * 1024, // 5MB
    uploadPath: "public/assets/images/team/",
    onSuccess: (fileUrl, file) => {
      setPendingPhotoFile(file);
      setData((d) => ({ ...d, photo: fileUrl }));
    },
  });

  // ✅ Hook para subir CV (PDF)
  const uploadCV = useFileUpload({
    accept: ".pdf",
    usePreview: true, // No subir de inmediato
    maxSize: 10 * 1024 * 1024, // 10MB
    uploadPath: "public/assets/images/team/cvs/", // ✅ Ruta corregida
    onSuccess: (fileUrl, file) => {
      setPendingCVFile(file);
      setData((d) => ({ ...d, src_cv_pdf: fileUrl }));
    },
  });

  // 🔥 Hook de auto-traducción DINÁMICO - configuración basada en activeLang (como Products)
  const translationConfig = useMemo(
    () => ({
      simpleFields: ["name", "role", "bio"],
      arrayFields: ["skills"], // ✅ Incluir skills para traducción
      nestedFields: [],
      objectFields: [],
      sourceLang: activeLang, // ✅ Se actualiza cuando cambia activeLang
      targetLang: activeLang === "es" ? "en" : "es", // ✅ Se actualiza cuando cambia activeLang
    }),
    [activeLang]
  ); // ✅ Solo depende de activeLang

  const { translating, autoTranslate } = useAutoTranslate(
    data,
    setData,
    translationConfig
  );

  // Manejador de auto-traducción con confirmación y cambio de idioma
  const handleAutoTranslate = async () => {
    if (mode === "view") return;

    const sourceLang = activeLang;
    const targetLang = activeLang === "es" ? "en" : "es";

    console.log("🌐 [TEAM handleAutoTranslate] Iniciando:", {
      sourceLang,
      targetLang,
      activeLang,
      hasSkillsText: data.skillsText !== undefined,
      skillsTextPreview: data.skillsText?.substring(0, 50) + "...",
      currentDataSkills: data.skills,
    });

    // Verificar que hay contenido en el idioma fuente (usar data directamente)
    const hasSourceContent =
      (data.name?.[sourceLang] && data.name[sourceLang].trim()) ||
      (data.role?.[sourceLang] && data.role[sourceLang].trim()) ||
      (Array.isArray(data.skills?.[sourceLang]) &&
        data.skills[sourceLang].some((s) => s && s.trim()));

    if (!hasSourceContent) {
      showAlert(
        `Primero completa los campos en ${sourceLang === "es" ? "Español" : "Inglés"
        } antes de traducir.`,
        "warning",
        "Campos Requeridos"
      );
      return;
    }

    const result = await autoTranslate();

    if (result.needsConfirmation) {
      setConfirmModal({
        open: true,
        type: "warning",
        title: "Sobrescribir Traducción",
        message: result.message,
        onConfirm: async () => {
          const forceResult = await autoTranslate(true);
          if (forceResult.success) {
            showAlert(
              "¡Traducción completada!",
              "success",
              "Traducción Exitosa"
            );
            setActiveLang(targetLang); // ✅ Cambiar al idioma destino para revisar
          } else {
            showAlert(
              "Error de traducción: " + forceResult.message,
              "error",
              "Error"
            );
          }
        },
      });
    } else if (result.success) {
      showAlert("¡Traducción completada!", "success", "Traducción Exitosa");
      setActiveLang(targetLang); // ✅ Cambiar al idioma destino para revisar
    } else if (result.message) {
      showAlert("Error: " + result.message, "error", "Error de Traducción");
    }
  };

  // Helper para placeholders dinámicos
  const getPlaceholder = (key) => {
    return messages[activeLang]?.admin?.team?.placeholders?.[key] || "";
  };

  // Helpers for fields that may be string or { es, en }
  const getI18nVal = (val, lng) =>
    typeof val === "object"
      ? String(val?.[lng] ?? val?.es ?? val?.en ?? "")
      : String(val ?? "");
  const setI18nVal = (val, lng, next) => {
    const base =
      typeof val === "object"
        ? { es: getI18nVal(val, "es"), en: getI18nVal(val, "en") }
        : { es: getI18nVal(val, "es"), en: "" };
    return { ...base, [lng]: next };
  };

  useEffect(() => {
    console.log("🔍 TeamFormModal - member recibido:", member);
    console.log("🔍 TeamFormModal - member.skills:", member?.skills);
    console.log(
      "🔍 TeamFormModal - typeof member.skills:",
      typeof member?.skills
    );
    console.log(
      "🔍 TeamFormModal - Array.isArray(member.skills):",
      Array.isArray(member?.skills)
    );

    // ✅ Normalizar datos del member para asegurar estructura bilingüe
    if (member) {
      const normalizedMember = {
        ...member,
        // Asegurar que name es un objeto bilingüe
        name:
          typeof member.name === "object" && member.name !== null
            ? member.name
            : { es: String(member.name || ""), en: String(member.name || "") },
        // Asegurar que role es un objeto bilingüe
        role:
          typeof member.role === "object" && member.role !== null
            ? member.role
            : { es: String(member.role || ""), en: String(member.role || "") },
        // ✅ Inicializar campos nuevos
        src_cv_pdf: member.src_cv_pdf || "",
        link_bio: member.link_bio || "",
      };

      console.log("🔍 TeamFormModal - member normalizado:", normalizedMember);
      setData(normalizedMember);
    } else {
      setData({});
    }
  }, [member]);

  useEffect(() => {
    if (!open) setShowTip(null);
  }, [open]);

  // Reset language to Spanish when modal opens
  useEffect(() => {
    if (open) {
      setActiveLang("es");
    }
  }, [open]);

  // Limpiar cualquier lógica innecesaria de ciclo de vida (eliminado el sync temporal de skillsText porque ya no existe)

  const isView = mode === "view";
  const isCreate = mode === "create";
  const title = isView
    ? "Miembro"
    : isCreate
      ? "Nuevo Miembro"
      : "Editar Miembro";

  function validate() {
    const nameVal = getI18nVal(data?.name, activeLang);
    if (!nameVal.trim()) {
      setShowTip("name");
      setTimeout(() => setShowTip(null), 1000);
      return false;
    }
    const roleVal = getI18nVal(data?.role, activeLang);
    if (!roleVal.trim()) {
      setShowTip("role");
      setTimeout(() => setShowTip(null), 1000);
      return false;
    }
    if (!(data?.photo || data?.image || "").trim().length) {
      setShowTip("photo");
      setTimeout(() => setShowTip(null), 1000);
      return false;
    }
    // ✅ Validar la nueva versión array de skills
    const skillsArr = (typeof data.skills === "object" && data.skills !== null && !Array.isArray(data.skills)
      ? data.skills[activeLang] || []
      : Array.isArray(data.skills) ? data.skills : [])
      .map(s => s.trim())
      .filter(Boolean);
    if (!skillsArr.length) {
      setShowTip("skills");
      setTimeout(() => setShowTip(null), 1000);
      return false;
    }
    return true;
  }

  // ✅ Usar métodos del hook para drop y pick
  const onDropFile = (e) => {
    uploadPhoto.dropFile(e);
    if (uploadPhoto.uploadMessage) {
      setUploadMsg(uploadPhoto.uploadMessage);
      setTimeout(() => setUploadMsg(""), 3000);
    }
  };

  const onPickFile = (e) => {
    uploadPhoto.pickFile(e);
    if (uploadPhoto.uploadMessage) {
      setUploadMsg(uploadPhoto.uploadMessage);
      setTimeout(() => setUploadMsg(""), 3000);
    }
  };

  // ✅ Handler para CV
  const onPickCV = (e) => {
    uploadCV.pickFile(e);
    if (uploadCV.uploadMessage) {
      setCvMsg(uploadCV.uploadMessage);
      setTimeout(() => setCvMsg(""), 3000);
    }
  };

  async function submit(e) {
    e?.preventDefault?.();
    if (!validate()) return;

    setIsSaving(true);
    try {
      let finalData = { ...data };

      // 🚀 Subir foto a Supabase
      if (pendingPhotoFile) {
        try {
          const webpFile = await compressImageToWebP(pendingPhotoFile);
          finalData.photo = await uploadFileToSupabase(webpFile, 'nft-assets', 'assets/images/team');
        } catch (err) {
          console.error('Error subiendo foto:', err);
          showAlert('Error subiendo la imagen de perfil. Revisa las reglas de Storage.', 'error');
          return;
        }
      }

      // 🚀 Subir CV a Supabase
      if (pendingCVFile) {
        try {
          finalData.src_cv_pdf = await uploadFileToSupabase(pendingCVFile, 'nft-assets', 'assets/team/cv');
        } catch (err) {
          console.error('Error subiendo CV:', err);
          showAlert('Error subiendo el CV PDF. Revisa las reglas de Storage.', 'error');
          return;
        }
      }

      // 🛡️ Sanitizar: nunca guardar blob: ni data: en Firestore
      const isLocalUrl = (url) => typeof url === 'string' && (url.startsWith('blob:') || url.startsWith('data:'));
      if (isLocalUrl(finalData.photo)) finalData.photo = '';
      if (isLocalUrl(finalData.src_cv_pdf)) finalData.src_cv_pdf = '';

      // Obtener skills según el idioma, extrayendo el listado de arreglos filtrado
      const getSkillsForLang = (lng) => {
        let arr = [];
        if (typeof finalData.skills === "object" && finalData.skills !== null && !Array.isArray(finalData.skills)) {
          arr = finalData.skills[lng] || [];
        } else if (Array.isArray(finalData.skills)) {
          arr = finalData.skills;
        }
        return arr.filter(s => s && s.trim());
      };

      const nameES = getI18nVal(finalData.name, "es");
      const nameEN = getI18nVal(finalData.name, "en");
      const roleES = getI18nVal(finalData.role, "es");
      const roleEN = getI18nVal(finalData.role, "en");
      const skillsES = getSkillsForLang("es");
      const skillsEN = getSkillsForLang("en");

      const payload = {
        id: finalData.id || `team-${Math.random().toString(36).slice(2, 8)}`,
        name: { es: nameES.trim(), en: (nameEN || nameES).trim() },
        role: { es: roleES.trim(), en: (roleEN || roleES).trim() },
        photo: (finalData.photo || finalData.image || "").trim(),
        src_cv_pdf: (finalData.src_cv_pdf || "").trim(), // ✅ Campo correcto
        link_bio: (finalData.link_bio || "").trim(),     // ✅ Campo correcto
        skills: {
          es: skillsES.length > 0 ? skillsES : skillsEN,
          en: skillsEN.length > 0 ? skillsEN : skillsES,
        },
        order: Number(finalData.order) || undefined,
        archived: !!finalData.archived,
      };
      onSave?.(payload);
      setPendingPhotoFile(null);
      setPendingCVFile(null);
      onClose?.();
    } finally {
      setIsSaving(false);
    }
  }

  const Preview = useMemo(() => {
    // DEBUG: Ver data completo
    console.log("🔍 Preview - data COMPLETO:", data);
    console.log("🔍 Preview - data.skills:", data.skills);
    console.log("🔍 Preview - data.skillsText:", data.skillsText);
    console.log("🔍 Preview - typeof data.skills:", typeof data.skills);
    console.log(
      "🔍 Preview - Array.isArray(data.skills):",
      Array.isArray(data.skills)
    );

    // Construir objeto de skills bilingüe desde el array persistente

    // Construir objeto de skills bilingüe de forma segura
    let skillsObj = { es: [], en: [] };

    if (data?.skills && typeof data.skills === "object" && !Array.isArray(data.skills)) {
      // Si es un objeto (formato bilingüe), extraemos con validación de array
      skillsObj = {
        es: Array.isArray(data.skills.es) ? data.skills.es.filter(s => s && s.trim()) : [],
        en: Array.isArray(data.skills.en) ? data.skills.en.filter(s => s && s.trim()) : []
      };
    } else if (Array.isArray(data.skills)) {
      // Soporte para datos antiguos (legacy)
      const safeSkills = data.skills.filter(s => s && s.trim());
      skillsObj = { es: safeSkills, en: safeSkills };
    }

    // Pasar estructura completa para que TeamMemberCard pueda seleccionar según idioma
    const m = {
      // ✅ Asegurar que name y role siempre sean objetos bilingües válidos
      name:
        typeof data.name === "object" && data.name !== null
          ? data.name
          : { es: String(data.name || ""), en: String(data.name || "") },
      role:
        typeof data.role === "object" && data.role !== null
          ? data.role
          : { es: String(data.role || ""), en: String(data.role || "") },
      photo: data.photo || data.image || "",
      image: data.photo || data.image || "",
      skills: skillsObj, // Siempre objeto bilingüe {es: [], en: []}
      src_cv_pdf: data.src_cv_pdf || "", // ✅ Pasar al preview
      link_bio: data.link_bio || "",     // ✅ Pasar al preview
    };

    // DEBUG: Verificar Preview
    console.log("🔍 TeamFormModal Preview - activeLang:", activeLang);
    console.log("🔍 TeamFormModal Preview - data.name:", data.name);
    console.log("🔍 TeamFormModal Preview - data.role:", data.role);
    console.log("🔍 TeamFormModal Preview - data.skills:", data.skills);
    console.log("🔍 TeamFormModal Preview - skillsObj:", skillsObj);
    console.log("🔍 TeamFormModal Preview - member construido:", m);

    return m;
  }, [data, activeLang]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header estandarizado modales */}
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b shrink-0 z-20">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-gray-900 hidden md:block">{title}</h3>
          </div>

          {(!isView) ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAutoTranslate}
                disabled={translating}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
              >
                {translating ? "Traduciendo..." : `Traducir a ${activeLang === "es" ? "ingles" : "español"} (${activeLang.toUpperCase()} → ${activeLang === "es" ? "EN" : "ES"})`}
              </button>
              <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
              <span className="text-sm text-gray-500 font-medium whitespace-nowrap hidden sm:block">Idioma a modificar:</span>
              <div className="flex border rounded-lg overflow-hidden bg-white shadow-sm shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveLang("es")}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeLang === "es" ? "bg-[#e83d38] text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  ES
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLang("en")}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeLang === "en" ? "bg-[#e83d38] text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  EN
                </button>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600 ml-2"
                onClick={onClose}
              >
                <span className="text-2xl font-light">×</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 font-medium whitespace-nowrap hidden sm:block">Idioma actual:</span>
              <div className="flex border rounded-lg overflow-hidden bg-white shadow-sm shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveLang("es")}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeLang === "es" ? "bg-[#e83d38] text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  ES
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLang("en")}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeLang === "en" ? "bg-[#e83d38] text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  EN
                </button>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600 ml-2"
                onClick={onClose}
              >
                <span className="text-2xl font-light">×</span>
              </button>
            </div>
          )}
        </div>

        {/* Form Details + Preview Split Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-white relative">
          {/* Left Side: Form Details */}
          <div className="flex-1 bg-gray-50 overflow-y-auto w-full md:border-r border-gray-200 p-6 custom-scrollbar relative">
            <TeamFormComponent
              tab={activeLang}
              local={data}
              // TeamFormModal.jsx - Dentro del render de TeamFormComponent
              updateLangField={(field, value) => {
                setData(d => {
                  // Si estamos actualizando las skills
                  if (field === "skills" && Array.isArray(value)) {
                    const currentSkills = (typeof d.skills === 'object' && d.skills !== null && !Array.isArray(d.skills))
                      ? d.skills
                      : { es: [], en: [] };

                    // Sincronizamos la estructura:
                    // Si el nuevo array es más largo o corto, aplicamos el cambio a ambos
                    const newSkills = {
                      es: [...value],
                      en: [...value]
                    };

                    // Nota: Esto copiará el texto actual. 
                    // Si quieres que el texto ya existente en el otro idioma no se borre al editar uno,
                    // la lógica de TeamFormComponent (handleSkillChange) se encargará de la edición fina.
                    return { ...d, [field]: newSkills };
                  }

                  return { ...d, [field]: setI18nVal(d[field], activeLang, value) };
                });
              }}
              updateField={(f, v) => setData(d => ({ ...d, [f]: v }))}
              readOnly={isView}
              invalid={{
                name: showTip === "name",
                role: showTip === "role",
                photo: showTip === "photo",
                skills: showTip === "skills"
              }}
              uploadPhoto={uploadPhoto}
              uploadCV={uploadCV}
              uploadMsg={uploadMsg}
              cvMsg={cvMsg}
              fileInputRef={fileInputRef}
              cvInputRef={cvInputRef}
              onDropFile={onDropFile}
              onPickFile={onPickFile}
              onPickCV={onPickCV}
            />
          </div>

          {/* Right Side: Visual Preview */}
          <div className="w-full md:w-[450px] lg:w-[500px] bg-white overflow-y-auto pt-0 flex flex-col custom-scrollbar pb-24 md:pb-0 border-t md:border-t-0 border-gray-200 z-0">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 shadow-sm z-10 flex justify-between items-center shrink-0">
              <div>
                <h4 className="font-semibold text-gray-800">Vista Previa</h4>
                <p className="text-xs text-gray-500">Resultados en tiempo real</p>
              </div>

              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button
                  type="button"
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${previewMode === "plain"
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                  onClick={() => setPreviewMode("plain")}
                >
                  Tarjeta
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${previewMode === "overlay"
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                  onClick={() => setPreviewMode("overlay")}
                >
                  Overlay
                </button>
              </div>
            </div>

            <div className="p-8 bg-[#FAFAFA] min-h-full flex items-start justify-center">
              <div className="w-full">
                <TeamMemberCard
                  member={Preview}
                  forceOverlay={previewMode === "overlay"}
                  lang={activeLang}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        {!isView && (
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-t shrink-0 z-40 rounded-b-xl">
            {/* Status Info */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {data.id ? `ID: ${data.id}` : "Nuevo Miembro"}
              </div>

              {/* Input temporal oculto de order por defecto pero puede implementarse de nuevo */}
              {data.order && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded text-sm text-gray-600">
                  <span className="font-medium">Orden:</span> {data.order}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>

              {data.archived && onRestore && (
                <button
                  type="button"
                  onClick={() => onRestore({ ...data, order: Number(data.order) || undefined })}
                  className="px-5 py-2.5 bg-green-50 text-green-700 border border-green-200 font-medium rounded-lg hover:bg-green-100 transition-colors"
                >
                  Restaurar Miembro
                </button>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={isSaving || uploadPhoto?.uploading || uploadCV?.uploading}
                className={`px-6 py-2.5 font-medium rounded-lg shadow-sm transition-all flex items-center gap-2 ${isSaving || uploadPhoto?.uploading || uploadCV?.uploading
                  ? "bg-red-300 text-white cursor-wait"
                  : "bg-[#e83d38] text-white hover:bg-[#d63430] hover:shadow-md"
                  }`}
              >
                {isSaving || uploadPhoto?.uploading || uploadCV?.uploading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {isSaving ? "Guardando..." : "Subiendo archivo..."}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {isCreate ? "Guardar Miembro" : "Guardar Cambios"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales de Confirmación y Alertas */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="Aceptar"
        cancelText="Cancelar"
      />

      <ConfirmModal
        open={alertModal.open}
        onClose={() => setAlertModal({ ...alertModal, open: false })}
        onConfirm={() => setAlertModal({ ...alertModal, open: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText="Entendido"
        showCancel={false}
      />
    </div>
  );
}
