import React, { useEffect, useMemo, useRef, useState } from "react";
import { TeamMemberCard } from "../../../../components/sections/Team";
import { Upload, X } from "lucide-react";
import { useAutoTranslate } from "../../hooks/useAutoTranslate";
import { useFileUpload } from "../../hooks/useFileUpload";
import { messages } from "../../../../config/i18n";
import ConfirmModal from "../common/ConfirmModal";

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
    maxSize: 5 * 1024 * 1024, // 5MB
    uploadPath: "public/assets/images/team/",
    onSuccess: (fileUrl) => setData((d) => ({ ...d, photo: fileUrl })),
  });

  // ✅ Hook para subir CV (PDF)
  const uploadCV = useFileUpload({
    accept: ".pdf",
    maxSize: 10 * 1024 * 1024, // 10MB
    uploadPath: "public/assets/images/team/cvs/", // ✅ Ruta corregida
    onSuccess: (fileUrl) => setData((d) => ({ ...d, src_cv_pdf: fileUrl })),
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

    // ✅ SINCRONIZAR SKILLS: Si hay skillsText pendiente, sincronizar con data.skills antes de traducir
    if (data.skillsText !== undefined) {
      console.log(
        "🔄 Sincronizando skillsText con data.skills para traducción..."
      );
      const currentSkills = data.skillsText
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);

      // Preservar skills del otro idioma (targetLang)
      let otherSkills = [];
      if (
        typeof data.skills === "object" &&
        data.skills !== null &&
        !Array.isArray(data.skills)
      ) {
        otherSkills = data.skills[targetLang] || [];
      }

      // ✅ CORREGIDO: Actualizar directamente el estado en lugar de variable temporal
      const updatedSkills = {
        [sourceLang]: currentSkills,
        [targetLang]: otherSkills,
      };

      console.log("✅ Skills sincronizados:", {
        sourceLang: `${sourceLang} (${currentSkills.length} items)`,
        targetLang: `${targetLang} (${otherSkills.length} items)`,
        skillsData: updatedSkills,
      });

      // Sincronizar al estado antes de la traducción
      setData((prevData) => ({
        ...prevData,
        skills: updatedSkills,
        skillsText: undefined, // Limpiar skillsText después de sincronizar
      }));
    }

    // Verificar que hay contenido en el idioma fuente (usar data directamente)
    const hasSourceContent =
      (data.name?.[sourceLang] && data.name[sourceLang].trim()) ||
      (data.role?.[sourceLang] && data.role[sourceLang].trim()) ||
      (Array.isArray(data.skills?.[sourceLang]) &&
        data.skills[sourceLang].some((s) => s && s.trim()));

    if (!hasSourceContent) {
      showAlert(
        `Primero completa los campos en ${
          sourceLang === "es" ? "Español" : "Inglés"
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
        // Asegurar que bio es un objeto bilingüe
        bio:
          typeof member.bio === "object" && member.bio !== null
            ? member.bio
            : { es: String(member.bio || ""), en: String(member.bio || "") },
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

  // ✅ CORREGIDO: Sincronizar cambios pendientes antes de cambiar idioma
  useEffect(() => {
    // Al cambiar de idioma, PRIMERO sincronizar skillsText con data.skills
    // para no perder cambios pendientes, LUEGO limpiar skillsText
    setData((prevData) => {
      const newData = { ...prevData };

      // Si hay skillsText pendiente, sincronizar con data.skills antes de limpiar
      if (prevData.skillsText !== undefined) {
        console.log(
          "🔄 [useEffect activeLang] Sincronizando skillsText pendiente antes de cambiar idioma..."
        );

        const currentSkills = prevData.skillsText
          .split(/\r?\n|,/)
          .map((s) => s.trim())
          .filter(Boolean);

        // Determinar el idioma anterior (antes del cambio)
        const previousLang = activeLang === "es" ? "en" : "es";

        // Asegurar que skills es un objeto bilingüe
        if (
          typeof newData.skills !== "object" ||
          newData.skills === null ||
          Array.isArray(newData.skills)
        ) {
          newData.skills = { es: [], en: [] };
        }

        // Actualizar el idioma anterior con los cambios pendientes
        newData.skills[previousLang] = currentSkills;

        console.log(
          `✅ [useEffect activeLang] Skills sincronizados para ${previousLang}:`,
          currentSkills
        );
      }

      // Limpiar skillsText para cargar desde data.skills[activeLang] en el nuevo idioma
      delete newData.skillsText;

      return newData;
    });
  }, [activeLang]); // Solo cuando cambia el idioma

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
    // ✅ CORREGIDO: Usar la misma lógica que el textarea para validar skills
    const skillsStr =
      data.skillsText !== undefined
        ? data.skillsText
        : typeof data.skills === "object" &&
          data.skills !== null &&
          !Array.isArray(data.skills)
        ? (data.skills[activeLang] || []).join("\n") // Extraer del objeto bilingüe
        : Array.isArray(data.skills)
        ? data.skills.join("\n")
        : "";
    if (!skillsStr.trim().length) {
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

  function submit(e) {
    e?.preventDefault?.();
    if (!validate()) return;

    // Obtener skills según el idioma
    const getSkillsForLang = (lng) => {
      // Si existe skillsText, usar ese valor (editando actualmente)
      if (data.skillsText !== undefined) {
        // Solo actualizar el idioma actual
        if (lng === activeLang) {
          return data.skillsText
            .split(/\r?\n|,/)
            .map((s) => s.trim())
            .filter(Boolean);
        }
        // Para el otro idioma, mantener el valor existente
        if (
          typeof data.skills === "object" &&
          data.skills !== null &&
          !Array.isArray(data.skills)
        ) {
          return data.skills[lng] || [];
        }
        // Fallback: array simple legacy
        if (Array.isArray(data.skills)) {
          return data.skills;
        }
        return [];
      }

      // Si skills es objeto bilingüe
      if (
        typeof data.skills === "object" &&
        data.skills !== null &&
        !Array.isArray(data.skills)
      ) {
        return data.skills[lng] || [];
      }

      // Si skills es array simple (legacy)
      if (Array.isArray(data.skills)) {
        return data.skills;
      }

      return [];
    };

    const nameES = getI18nVal(data.name, "es");
    const nameEN = getI18nVal(data.name, "en");
    const roleES = getI18nVal(data.role, "es");
    const roleEN = getI18nVal(data.role, "en");
    const bioES = getI18nVal(data.bio, "es");
    const bioEN = getI18nVal(data.bio, "en");
    const skillsES = getSkillsForLang("es");
    const skillsEN = getSkillsForLang("en");

    const payload = {
      id: data.id || `team-${Math.random().toString(36).slice(2, 8)}`,
      name: { es: nameES.trim(), en: (nameEN || nameES).trim() },
      role: { es: roleES.trim(), en: (roleEN || roleES).trim() },
      bio: { es: bioES, en: bioEN || bioES },
      photo: (data.photo || data.image || "").trim(),
      src_cv_pdf: (data.src_cv_pdf || "").trim(), // ✅ Campo correcto
      link_bio: (data.link_bio || "").trim(),     // ✅ Campo correcto
      skills: {
        es: skillsES.length > 0 ? skillsES : skillsEN,
        en: skillsEN.length > 0 ? skillsEN : skillsES,
      },
      order: Number(data.order) || undefined,
      archived: !!data.archived,
    };
    onSave?.(payload);
    onClose?.();
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

    // Construir objeto de skills bilingüe
    let skillsObj = {};

    if (data.skillsText !== undefined) {
      // Estamos editando: data.skillsText tiene el texto del idioma actual
      const currentSkills = data.skillsText
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);

      // Preservar skills del otro idioma
      const otherLang = activeLang === "es" ? "en" : "es";
      let otherSkills = [];

      if (
        typeof data.skills === "object" &&
        data.skills !== null &&
        !Array.isArray(data.skills)
      ) {
        otherSkills = data.skills[otherLang] || [];
      }

      // Construir objeto bilingüe completo
      skillsObj = {
        [activeLang]: currentSkills,
        [otherLang]: otherSkills,
      };
    } else if (
      typeof data.skills === "object" &&
      data.skills !== null &&
      !Array.isArray(data.skills)
    ) {
      // Skills ya están en formato bilingüe
      skillsObj = data.skills;
    } else if (Array.isArray(data.skills)) {
      // Skills legacy (array simple) - asignar a ambos idiomas
      skillsObj = {
        es: data.skills,
        en: data.skills,
      };
    } else {
      // Sin skills
      skillsObj = { es: [], en: [] };
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b">
          {/* Header: Título + botones idioma + auto-traducir + Cerrar */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold">{title}</h3>

            <div className="flex items-center gap-3">
              {/* Botones de idioma - SIEMPRE visibles */}
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-lg border text-sm ${
                    activeLang === "es"
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white"
                  }`}
                  onClick={() => setActiveLang("es")}
                >
                  Español (ES)
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-lg border text-sm ${
                    activeLang === "en"
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white"
                  }`}
                  onClick={() => setActiveLang("en")}
                >
                  Inglés (EN)
                </button>
              </div>

              {/* Botón de auto-traducción - Solo en modo edit/create */}
              {!isView &&
                (() => {
                  const targetLang = activeLang === "es" ? "EN" : "ES";

                  return (
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                        translating
                          ? "bg-gray-300 text-gray-600 cursor-wait"
                          : "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                      }`}
                      onClick={handleAutoTranslate}
                      disabled={translating}
                      title={`Traducir automáticamente ${activeLang.toUpperCase()} → ${targetLang}`}
                    >
                      {translating ? (
                        <>
                          <span className="inline-block animate-spin mr-1">
                            ⟳
                          </span>
                          Traduciendo...
                        </>
                      ) : (
                        `🌐 Traducir a ${targetLang}`
                      )}
                    </button>
                  );
                })()}

              {/* Botón de cerrar */}
              <button className="text-gray-500 text-2xl" onClick={onClose}>
                ×
              </button>
            </div>
          </div>
        </div>
        <div
          className={`grid grid-cols-1 ${
            mode !== "view" ? "md:grid-cols-2" : ""
          } gap-6 p-6`}
        >
          {!isView && (
            <form className="space-y-3" onSubmit={submit}>
              {/* ✅ Contenedor compacto de ID y Orden - Layout inline */}
              <div className="bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200">
                <div className="flex items-center gap-6">
                  {/* ID - flex-1 con label inline */}
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      ID
                    </label>
                    <div
                      className="flex-1 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-gray-600 font-mono text-sm truncate"
                      title={data.id || "(auto)"}
                    >
                      {data.id || "(auto)"}
                    </div>
                  </div>

                  {/* Orden - Ancho fijo con label inline */}
                  <div className="relative flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      Orden *
                    </label>
                    <input
                      type="number"
                      className={`w-20 px-3 py-1.5 border rounded text-sm text-center ${
                        showTip === "order"
                          ? "border-red-500 bg-white"
                          : "border-gray-300 bg-white"
                      }`}
                      value={data.order ?? ""}
                      onChange={(e) =>
                        setData((d) => ({ ...d, order: e.target.value }))
                      }
                      disabled={isView}
                    />
                    {showTip === "order" && (
                      <div className="absolute left-0 top-full mt-1 text-xs text-red-600">
                        Campo obligatorio
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Foto (4:3 recomendado, JPG/PNG, arrastrar o buscar)
                </label>
                <div
                  className={`relative rounded-xl border-2 ${
                    showTip === "photo"
                      ? "border-red-500"
                      : "border-dashed border-gray-300"
                  } bg-gray-50 flex items-center justify-center aspect-[4/3] text-gray-500 overflow-hidden ${
                    uploadPhoto.uploading ? "opacity-50 cursor-wait" : ""
                  }`}
                  onDrop={onDropFile}
                  onDragOver={uploadPhoto.dragOver}
                >
                  {uploadPhoto.uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                      <div className="text-sm text-gray-600">
                        Subiendo imagen...
                      </div>
                    </div>
                  ) : data.photo || data.image ? (
                    <>
                      <img
                        src={data.photo || data.image}
                        alt="preview"
                        className="w-full h-full object-contain rounded-xl"
                      />
                      {!isView && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setData((d) => ({ ...d, photo: "", image: "" }));
                          }}
                          className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors z-10"
                          title="Eliminar imagen"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center px-4">
                      <Upload className="w-6 h-6" />
                      <div className="text-sm">Arrastrar imagen aquí</div>
                      <div className="text-xs text-gray-400">o</div>
                      <button
                        type="button"
                        className="px-3 py-1 rounded border"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadPhoto.uploading}
                      >
                        Buscar
                      </button>
                      <div className="text-xs text-gray-500">
                        Máx. 5MB • JPG/PNG
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPickFile}
                  />
                </div>
                {(uploadMsg || uploadPhoto.uploadMessage) && (
                  <div
                    className={`text-xs mt-1 ${
                      uploadPhoto.uploadMessage?.includes("✅")
                        ? "text-green-600"
                        : uploadPhoto.uploadMessage?.includes("❌")
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {uploadPhoto.uploadMessage || uploadMsg}
                  </div>
                )}
                <input
                  className="w-full border rounded px-3 py-2 mt-2"
                  placeholder="o pega aquí una URL pública de la foto"
                  value={data.photo || data.image || ""}
                  onChange={(e) =>
                    setData((d) => ({ ...d, photo: e.target.value }))
                  }
                  disabled={isView}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Nombre (requerido)
                </label>
                <input
                  className={`w-full border rounded px-3 py-2 ${
                    showTip === "name" ? "border-red-500" : ""
                  }`}
                  placeholder={getPlaceholder("name")}
                  value={getI18nVal(data.name, activeLang)}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      name: setI18nVal(d.name, activeLang, e.target.value),
                    }))
                  }
                  disabled={isView}
                />
                {showTip === "name" && (
                  <div className="text-xs text-red-600 mt-1">
                    Campo obligatorio
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Cargo (requerido)
                </label>
                <input
                  className={`w-full border rounded px-3 py-2 ${
                    showTip === "role" ? "border-red-500" : ""
                  }`}
                  placeholder={getPlaceholder("role")}
                  value={getI18nVal(data.role, activeLang)}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      role: setI18nVal(d.role, activeLang, e.target.value),
                    }))
                  }
                  disabled={isView}
                />
                {showTip === "role" && (
                  <div className="text-xs text-red-600 mt-1">
                    Campo obligatorio
                  </div>
                )}
              </div>

              {/* CV Upload Section */}
              <div className="bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200">
                <label className="block text-sm font-medium mb-1">
                  CV (PDF) y Biografía
                </label>
                <div className="space-y-3">
                  {/* CV Upload */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Archivo PDF (src_cv_pdf)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        className="flex-1 border rounded px-3 py-2 text-sm"
                        placeholder="URL del PDF o subir archivo..."
                        value={data.src_cv_pdf || ""}
                        onChange={(e) =>
                          setData((d) => ({ ...d, src_cv_pdf: e.target.value }))
                        }
                        disabled={isView}
                      />
                      {/* Hidden file input for CV */}
                      <input
                        ref={cvInputRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={onPickCV}
                      />
                      {!isView && (
                        <button
                          type="button"
                          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition-colors"
                          onClick={() => cvInputRef.current?.click()}
                          disabled={uploadCV.uploading}
                          title="Subir PDF"
                        >
                          {uploadCV.uploading ? (
                            <span className="animate-spin inline-block">⟳</span>
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      {/* Download/View button if CV exists */}
                      {data.src_cv_pdf && (
                        <a
                          href={data.src_cv_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                          title="Ver CV actual"
                        >
                          📄
                        </a>
                      )}
                    </div>
                    {(cvMsg || uploadCV.uploadMessage) && (
                      <div
                        className={`text-xs mt-1 ${
                          uploadCV.uploadMessage?.includes("✅")
                            ? "text-green-600"
                            : uploadCV.uploadMessage?.includes("❌")
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {uploadCV.uploadMessage || cvMsg}
                      </div>
                    )}
                  </div>

                  {/* Link Bio */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Enlace Biografía (link_bio) - Opcional
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="https://linkedin.com/in/..."
                      value={data.link_bio || ""}
                      onChange={(e) =>
                        setData((d) => ({ ...d, link_bio: e.target.value }))
                      }
                      disabled={isView}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Skills (una por línea o separadas por coma) - requerido
                </label>
                <textarea
                  className={`w-full border rounded px-3 py-2 h-28 ${
                    showTip === "skills" ? "border-red-500" : ""
                  }`}
                  placeholder={getPlaceholder("skills")}
                  value={
                    data.skillsText !== undefined
                      ? data.skillsText
                      : typeof data.skills === "object" &&
                        data.skills !== null &&
                        !Array.isArray(data.skills)
                      ? (data.skills[activeLang] || []).join("\n")
                      : Array.isArray(data.skills)
                      ? data.skills.join("\n")
                      : ""
                  }
                  onChange={(e) =>
                    setData((d) => ({ ...d, skillsText: e.target.value }))
                  }
                  disabled={isView}
                />
                {showTip === "skills" && (
                  <div className="text-xs text-red-600 mt-1">
                    Campo obligatorio
                  </div>
                )}
              </div>
              {!isView && (
                <div className="pt-2 space-y-3">
                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <button type="submit" className="btn-cta px-4 py-2">
                      {isCreate ? "Guardar" : "Guardar Cambios"}
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 border rounded"
                      onClick={onClose}
                    >
                      Cancelar
                    </button>
                    {data.archived ? (
                      <button
                        type="button"
                        className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                        onClick={() =>
                          onRestore?.({
                            ...data,
                            order: Number(data.order) || undefined,
                          })
                        }
                      >
                        Restaurar
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </form>
          )}
          <div className="flex flex-col h-full">
            <div className="flex gap-2 mb-2 justify-end md:justify-center lg:justify-center">
              <button
                type="button"
                className={`px-3 py-1 rounded-lg border ${
                  previewMode === "overlay"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white"
                }`}
                onClick={() => setPreviewMode("overlay")}
              >
                Vista Overlay
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-lg border ${
                  previewMode === "plain"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white"
                }`}
                onClick={() => setPreviewMode("plain")}
              >
                Vista Sin Overlay
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
                <TeamMemberCard
                  member={Preview}
                  forceOverlay={previewMode === "overlay"}
                  lang={activeLang}
                />
              </div>
            </div>
          </div>
        </div>
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
