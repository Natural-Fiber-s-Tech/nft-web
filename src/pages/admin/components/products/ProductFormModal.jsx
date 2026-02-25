import React, { useEffect, useMemo, useRef, useState } from "react";
import { ProductFormComponentWithPicker as ProductFormComponent } from "./ProductFormComponent";
import DetailIncompleteConfirmModal from "./DetailIncompleteConfirmModal";
import { useAutoTranslate } from "../../hooks/useAutoTranslate";
import { useFileUpload } from "../../hooks/useFileUpload";

export default function ProductFormModal({
  open,
  mode = "view",
  product,
  onClose,
  onSave,
  onRestore,
}) {
  const isOpen = !!open;
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  const initial = useMemo(
    () =>
      product || {
        id: "product-" + Math.random().toString(36).slice(2, 8),
        name: { es: "", en: "" },
        tagline: { es: "", en: "" },
        description: { es: "", en: "" }, // short card description
        descriptionDetail: { es: "", en: "" },
        image: "",
        category: { es: "", en: "" },
        technicalSheets: { es: "", en: "" },
        features: { es: [""], en: [""] }, // short bullet points for card
        featuresDetail: [],
        specifications: { es: {}, en: {} },
        capabilities: { es: [], en: [] },
        youtubeVideo: "",
        additionalImages: [],
        order: 1,
        archived: false,
      },
    [product]
  );
  const [local, setLocal] = useState(initial);
  const [tab, setTab] = useState("es");
  const [previewTab, setPreviewTab] = useState("card"); // card | detail

  // 🔍 DEBUG: Log cuando cambia tab
  // DEBUG: Verificar estructura de features
  useEffect(() => {
    console.log("🟢 ProductFormModal - tab changed to:", tab);
    console.log("🟢 Current local.name:", local.name);
    console.log("🟢 Current local.description:", local.description);
    console.log("🟣 Current local.features:", local.features);
    console.log("🟣 local.features[tab]:", local.features?.[tab]);
  }, [tab, local.name, local.description, local.features, local.id]);
  const [cardErrors, setCardErrors] = useState({});
  const [detailErrors, setDetailErrors] = useState({});
  const [showHint, setShowHint] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const dzImgRef = useRef(null);
  const [showDetailConfirm, setShowDetailConfirm] = useState(false);
  const [pendingSave, setPendingSave] = useState(null); // holds next payload when awaiting confirm

  // 🔥 Hooks de upload de archivos (DRY pattern)
  const uploadImage = useFileUpload({
    accept: "image/*",
    maxSize: 5 * 1024 * 1024, // 5MB
    uploadPath: "public/assets/images/products/images/",
    onSuccess: (fileUrl) => setLocal((p) => ({ ...p, image: fileUrl })),
  });

  const uploadAdditionalImage = useFileUpload({
    accept: "image/*",
    maxSize: 5 * 1024 * 1024, // 5MB
    uploadPath: "public/assets/images/products/images/",
    onSuccess: (fileUrl) =>
      setLocal((p) => ({
        ...p,
        additionalImages: [...(p.additionalImages || []), fileUrl],
      })),
  });

  const uploadDatasheetES = useFileUpload({
    accept: ".pdf,application/pdf",
    maxSize: 10 * 1024 * 1024, // 10MB
    uploadPath: "public/assets/images/products/pdf/",
    onSuccess: (fileUrl) =>
      setLocal((p) => ({
        ...p,
        technicalSheets: { ...(p.technicalSheets || {}), es: fileUrl },
      })),
  });

  const uploadDatasheetEN = useFileUpload({
    accept: ".pdf,application/pdf",
    maxSize: 10 * 1024 * 1024, // 10MB
    uploadPath: "public/assets/images/products/pdf/",
    onSuccess: (fileUrl) =>
      setLocal((p) => ({
        ...p,
        technicalSheets: { ...(p.technicalSheets || {}), en: fileUrl },
      })),
  });

  // 🌐 Hook de traducción automática
  const { translating, autoTranslate } = useAutoTranslate(local, setLocal, {
    simpleFields: [
      "name",
      "tagline",
      "description",
      "descriptionDetail",
      "category",
    ],
    arrayFields: ["features", "capabilities"],
    nestedFields: [
      {
        field: "featuresDetail",
        subFields: ["title", "description"],
      },
    ],
    objectFields: ["specifications"],
    sourceLang: tab,
    targetLang: tab === "es" ? "en" : "es",
  });

  useEffect(() => {
    if (product) {
      // 🔧 FIX: Migrar datos legacy a estructura i18n
      const migrated = { ...product };

      // Migrar features si vienen como array simple
      if (Array.isArray(migrated.features)) {
        console.warn(
          "⚠️ Migrando features de array simple a estructura bilingüe"
        );
        migrated.features = {
          es: migrated.features,
          en: [],
        };
      }

      // Migrar category si viene como string
      if (typeof migrated.category === "string") {
        console.warn("⚠️ Migrando category de string a estructura bilingüe");
        migrated.category = {
          es: migrated.category,
          en: "",
        };
      }

      // Migrar specifications si viene como objeto plano
      if (
        migrated.specifications &&
        typeof migrated.specifications === "object" &&
        !migrated.specifications.es &&
        !migrated.specifications.en
      ) {
        console.warn("⚠️ Migrando specifications a estructura bilingüe");
        migrated.specifications = {
          es: migrated.specifications,
          en: {},
        };
      }

      // Migrar capabilities si viene como array simple
      if (Array.isArray(migrated.capabilities)) {
        console.warn("⚠️ Migrando capabilities de array a estructura bilingüe");
        migrated.capabilities = {
          es: migrated.capabilities,
          en: [],
        };
      }

      // 🔥 Migrar featuresDetail a nueva estructura con title/description bilingües
      if (Array.isArray(migrated.featuresDetail)) {
        let needsMigration = false;

        // Verificar si algún item NO tiene structure bilingüe
        migrated.featuresDetail.forEach((item) => {
          if (
            !item.title ||
            typeof item.title !== "object" ||
            !item.description ||
            typeof item.description !== "object"
          ) {
            needsMigration = true;
          }
        });

        if (needsMigration) {
          console.warn("⚠️ Migrando featuresDetail a estructura bilingüe");

          migrated.featuresDetail = migrated.featuresDetail.map((item, i) => {
            // Si ya tiene estructura bilingüe, mantener
            if (item.title && typeof item.title === "object") {
              return item;
            }

            // Migrar desde features[lang] legacy
            const titleES = migrated.features?.es?.[i] || "";
            const titleEN = migrated.features?.en?.[i] || "";

            return {
              icon: item.icon || "BarChart3",
              title: { es: titleES, en: titleEN },
              description: { es: "", en: "" },
            };
          });
        }
      }

      setLocal(migrated);
    }
  }, [product]);

  // Reset tab to Spanish when modal opens
  useEffect(() => {
    if (open) {
      setTab("es");
      setPreviewTab("card");
    }
  }, [open]);

  // ✅ Funciones que usan tab - IGUAL QUE SERVICES (usan closure)
  function updateLangField(key, val) {
    console.log("🔵 updateLangField called:", { key, val, currentTab: tab });
    setLocal((s) => {
      const updated = { ...s, [key]: { ...(s[key] || {}), [tab]: val } };
      console.log("🔵 updateLangField updated state:", {
        key,
        newValue: updated[key],
      });
      return updated;
    });
  }

  // 🔥 Nueva función para editar features con title/description separados
  function setFeaturesAt(idx, value, field = "title") {
    setLocal((prev) => {
      const fd = Array.isArray(prev.featuresDetail)
        ? [...prev.featuresDetail]
        : [];

      // Asegurar que existe el objeto en la posición idx
      while (fd.length <= idx) {
        fd.push({
          icon: "BarChart3",
          title: { es: "", en: "" },
          description: { es: "", en: "" },
        });
      }

      // Si el formato es legacy (sin title/description bilingües), migrar PRESERVANDO valores
      if (!fd[idx].title || typeof fd[idx].title !== "object") {
        const legacyTitle = prev.features?.[tab]?.[idx] || "";
        fd[idx] = {
          icon: fd[idx]?.icon || "BarChart3",
          title: {
            es: tab === "es" ? legacyTitle : "",
            en: tab === "en" ? legacyTitle : "",
          },
          description: { es: "", en: "" },
        };
      }

      // Actualizar el campo correcto (title o description) en el idioma activo
      if (field === "title") {
        fd[idx].title = {
          ...fd[idx].title, // ✅ Preservar otros idiomas
          [tab]: value,
        };
      } else if (field === "description") {
        fd[idx].description = {
          ...fd[idx].description, // ✅ Preservar otros idiomas
          [tab]: value,
        };
      }

      // 🔧 SINCRONIZAR features[idioma] para Vista Card
      // Extraer solo los títulos de featuresDetail para mantener compatibilidad
      const updatedFeatures = { ...prev.features };
      ["es", "en"].forEach((lang) => {
        updatedFeatures[lang] = fd.map((item) => item.title?.[lang] || "");
      });

      return {
        ...prev,
        featuresDetail: fd,
        features: updatedFeatures,
      };
    });
  }

  function addFeature() {
    setLocal((prev) => {
      const fd = Array.isArray(prev.featuresDetail)
        ? [...prev.featuresDetail]
        : [];
      // 🔥 Crear con estructura bilingüe para title/description
      fd.push({
        icon: "BarChart3",
        title: { es: "", en: "" },
        description: { es: "", en: "" },
      });

      // 🔧 SINCRONIZAR features[idioma] para Vista Card
      const updatedFeatures = { ...prev.features };
      ["es", "en"].forEach((lang) => {
        updatedFeatures[lang] = fd.map((item) => item.title?.[lang] || "");
      });

      return {
        ...prev,
        featuresDetail: fd,
        features: updatedFeatures,
      };
    });
  }

  function removeFeature(idx) {
    setLocal((prev) => {
      const fd = Array.isArray(prev.featuresDetail)
        ? [...prev.featuresDetail]
        : [];
      fd.splice(idx, 1);

      // 🔧 SINCRONIZAR features[idioma] para Vista Card
      const updatedFeatures = { ...prev.features };
      ["es", "en"].forEach((lang) => {
        updatedFeatures[lang] = fd.map((item) => item.title?.[lang] || "");
      });

      return {
        ...prev,
        featuresDetail: fd,
        features: updatedFeatures,
      };
    });
  }

  // Validators split by view (card/detail) and language rules
  function validateCard() {
    const e = {};
    if (!local?.id?.trim()) e.id = "ID requerido";
    if (!local?.name?.es?.trim()) e.name_es = "Nombre (ES) requerido";
    if (!local?.description?.es?.trim())
      e.desc_es = "Descripción (ES) requerida";
    if (!local?.image?.trim()) e.image = "Imagen requerida";
    // At least one non-empty feature in ES
    const feats = (local?.features?.es || [])
      .map((s) => (s || "").trim())
      .filter(Boolean);
    if (!feats.length) e.features = "Al menos 1 característica (ES)";
    setCardErrors(e);
    return e;
  }
  function validateDetail() {
    const e = {};
    const categoryValue =
      typeof local?.category === "object"
        ? local?.category?.es?.trim()
        : local?.category?.trim();
    if (!categoryValue) e.category = "Categoría requerida";
    if (!(local?.descriptionDetail?.es || local?.description?.es || "").trim())
      e.detail_es = "Descripción detallada (ES) requerida";
    setDetailErrors(e);
    return e;
  }

  async function uploadFromUrl(kind, urlStr) {
    const url = String(urlStr || "").trim();
    if (!url) return;
    if (url.startsWith("blob:")) {
      alert(
        "Esa URL es de tipo 'blob:' y no se puede importar directamente. Copia una URL https pública (Copiar dirección de imagen) o descarga el archivo y súbelo."
      );
      return;
    }
    setUploading(true);
    try {
      console.log("[adminx] uploadFromUrl start", { kind, url, id: local.id });
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, path: `/content/products/${local.id}/` }),
      });
      const debugHdr = res.headers.get("X-Upload-Debug");
      const data = await res.json().catch(() => ({}));
      console.log("[adminx] uploadFromUrl res", {
        status: res.status,
        ok: res.ok,
        debug: debugHdr,
        data,
      });
      if (!res.ok || !data?.ok) {
        const msg = data?.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      const hosted = data?.url || data?.path || "";
      if (!hosted) throw new Error("no_url");
      if (kind === "image") setLocal((p) => ({ ...p, image: hosted }));
      if (kind === "additional")
        setLocal((p) => ({
          ...p,
          additionalImages: [...(p.additionalImages || []), hosted],
        }));
    } catch (e) {
      alert(
        `No se pudo importar desde URL (${kind}). Detalle: ${
          e?.message || e
        }\nSi el sitio bloquea la descarga, descarga el archivo y súbelo manualmente.`
      );
      console.error("[adminx] uploadFromUrl error", e);
    } finally {
      setUploading(false);
    }
  }

  async function uploadFile(kind, file) {
    // kind: 'datasheet-es' | 'datasheet-en' | 'image' | 'additional'
    setUploading(true);
    try {
      if (!(file instanceof File || file instanceof Blob)) {
        // Soporta cuando accidentalmente nos pasan una URL (string)
        if (typeof file === "string") {
          setUploading(false);
          return uploadFromUrl(kind, file);
        }
      }

      // ✅ Para imágenes, usar preview local inmediato (como en Research y Team)
      if (kind === "image" || kind === "additional") {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          if (kind === "image") {
            setLocal((p) => ({ ...p, image: dataUrl }));
          } else if (kind === "additional") {
            setLocal((p) => ({
              ...p,
              additionalImages: [...(p.additionalImages || []), dataUrl],
            }));
          }
        };
        reader.readAsDataURL(file);
        setUploading(false);
        return; // ✅ No intentar upload async, solo preview local
      }

      // ✅ Para PDFs (datasheets), sí intentar upload async
      // 1) Intento multipart
      let url = "";
      try {
        const form = new FormData();
        form.append("file", file, file.name || `file-${Date.now()}.bin`);
        form.append("path", `/content/products/${local.id}/`);
        console.log("[adminx] upload multipart start", {
          kind,
          name: file?.name,
          size: file?.size,
          id: local.id,
        });
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const debugHdr = res.headers.get("X-Upload-Debug");
        const data = await res.json().catch(() => ({}));
        console.log("[adminx] upload multipart res", {
          status: res.status,
          ok: res.ok,
          debug: debugHdr,
          data,
        });
        if (res.ok && data?.ok) {
          url = data?.url || data?.path || "";
        } else {
          // 2) Fallback JSON base64 (cuando multipart no llega bien)
          console.log("[adminx] fallback base64 start", {
            kind,
            name: file?.name,
            size: file?.size,
          });
          const base64 = await new Promise((resolve, reject) => {
            try {
              const fr = new FileReader();
              fr.onload = () => {
                const s = String(fr.result || "");
                const i = s.indexOf(",");
                resolve(i >= 0 ? s.slice(i + 1) : s);
              };
              fr.onerror = reject;
              fr.readAsDataURL(file);
            } catch (e) {
              reject(e);
            }
          });
          const res2 = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: file.name || `file-${Date.now()}.bin`,
              path: `/content/products/${local.id}/`,
              data: base64,
            }),
          });
          const debugHdr2 = res2.headers.get("X-Upload-Debug");
          const data2 = await res2.json().catch(() => ({}));
          console.log("[adminx] fallback base64 res", {
            status: res2.status,
            ok: res2.ok,
            debug: debugHdr2,
            data: data2,
          });
          if (!res2.ok || !data2?.ok) {
            const msg = data2?.error || `HTTP ${res2.status}`;
            throw new Error(msg);
          }
          url = data2?.url || data2?.path || "";
        }
      } catch (inner) {
        // Re-lanza para la alerta superior
        console.error("[adminx] upload error inner", inner);
        throw inner;
      }

      if (!url) throw new Error("no_url");
      // ✅ Solo asignar URLs para datasheets (PDFs), no para imágenes
      if (kind === "datasheet-es")
        setLocal((p) => ({
          ...p,
          technicalSheets: { ...(p.technicalSheets || {}), es: url },
        }));
      if (kind === "datasheet-en")
        setLocal((p) => ({
          ...p,
          technicalSheets: { ...(p.technicalSheets || {}), en: url },
        }));
    } catch (e) {
      // ✅ Solo mostrar alert si es datasheet, imágenes ya tienen preview
      if (kind.startsWith("datasheet")) {
        alert(
          `No se pudo subir el archivo (${kind}).\nDetalle: ${
            e?.message || e
          }\n\nConsejos:\n- Evita URLs 'blob:' (no se pueden importar).\n- Usa el botón Importar URL con un enlace https público, o descarga el archivo y súbelo.\n- Asegúrate de tener vercel dev corriendo (puerto :3000) y variables GITHUB_* válidas.`
        );
      }
      console.error("[adminx] uploadFile error", e);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(kind, e) {
    e.preventDefault();
    if (isView) return;

    // 🔥 Usar hooks de upload según el tipo de archivo
    if (kind === "image") {
      return uploadImage.dropFile(e);
    }
    if (kind === "additional") {
      return uploadAdditionalImage.dropFile(e);
    }
    if (kind === "datasheet-es") {
      return uploadDatasheetES.dropFile(e);
    }
    if (kind === "datasheet-en") {
      return uploadDatasheetEN.dropFile(e);
    }

    // Fallback: Intentar URL si no hay archivo
    try {
      const items = e.dataTransfer?.items;
      if (items && items.length) {
        for (const it of items) {
          if (it.kind === "string") {
            const type = it.type || "text/plain";
            if (type === "text/uri-list" || type === "text/plain") {
              it.getAsString((text) => {
                const u = String(text || "").trim();
                console.log("[adminx] drop url", { kind, u });
                if (u) uploadFromUrl(kind, u);
              });
              return;
            }
          }
        }
      }
    } catch {}
  }

  function onPick(kind) {
    if (isView) return;
    const inp = document.createElement("input");
    inp.type = "file";

    // 🔥 Configurar según el tipo de archivo
    if (kind === "image") {
      inp.accept = "image/*";
      inp.onchange = (ev) => uploadImage.pickFile(ev);
    } else if (kind === "additional") {
      inp.accept = "image/*";
      inp.multiple = true;
      inp.onchange = (ev) => {
        // Para múltiples imágenes, procesar una por una
        const files = Array.from(ev.target.files || []);
        files.forEach((file) => uploadAdditionalImage.handleFile(file));
      };
    } else if (kind === "datasheet-es") {
      inp.accept = ".pdf,application/pdf";
      inp.onchange = (ev) => uploadDatasheetES.pickFile(ev);
    } else if (kind === "datasheet-en") {
      inp.accept = ".pdf,application/pdf";
      inp.onchange = (ev) => uploadDatasheetEN.pickFile(ev);
    } else {
      inp.accept = ".pdf,.doc,.docx";
      inp.onchange = (ev) => {
        const file = ev.target.files?.[0];
        if (file) uploadFile(kind, file);
      };
    }

    inp.click();
  }

  async function handleGenerateAI() {
    try {
      // Verificar si hay contenido existente
      const hasContent =
        local.name?.es ||
        local.name?.en ||
        local.description?.es ||
        local.description?.en ||
        (local.features?.es && local.features.es.length > 0) ||
        (local.features?.en && local.features.en.length > 0);

      if (hasContent) {
        const message = isEdit
          ? "⚠️ ADVERTENCIA: Estás editando un producto existente.\n\n" +
            "Al generar contenido con IA se sobrescribirán TODOS los campos actuales.\n\n" +
            "Esta acción es irreversible. ¿Deseas continuar?"
          : "⚠️ ADVERTENCIA: Ya existen campos llenos.\n\n" +
            "Al generar contenido con IA se sobrescribirán los datos existentes.\n\n" +
            "¿Deseas continuar?";

        const confirmed = confirm(message);
        if (!confirmed) return;
      }

      setGenerating(true);

      // Determinar cual PDF usar (priorizar idioma actual)
      const pdfUrl =
        local.technicalSheets?.[tab] ||
        local.technicalSheets?.es ||
        local.technicalSheets?.en;

      if (!pdfUrl) {
        alert("❌ Error: No hay ningún PDF cargado para generar contenido.");
        return;
      }

      // Fetch del PDF
      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) {
        throw new Error("No se pudo obtener el PDF");
      }

      const pdfBlob = await pdfResponse.blob();

      // Crear FormData
      const formData = new FormData();
      formData.append("pdf", pdfBlob, "document.pdf");

      // Llamar a la API de generación
      const response = await fetch("/api/generate-product-content", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || errorData.error || "Error del servidor"
        );
      }

      const responseData = await response.json();
      console.log("🔍 DEBUG - Respuesta completa del servidor:", responseData);

      // Extraer el contenido (puede estar en .content o directamente en la respuesta)
      const generatedContent = responseData.content || responseData;

      // DEBUG: Logging del contenido generado
      console.log("🔍 DEBUG - Contenido generado por IA:", generatedContent);

      // Aplicar contenido generado directamente al estado
      setLocal((prev) => {
        const newState = { ...prev };

        // Aplicar campos bilingües manteniendo la estructura correcta
        if (generatedContent.name) {
          newState.name = {
            es: generatedContent.name.es || prev.name?.es || "",
            en: generatedContent.name.en || prev.name?.en || "",
          };
        }

        if (generatedContent.tagline) {
          newState.tagline = {
            es: generatedContent.tagline.es || prev.tagline?.es || "",
            en: generatedContent.tagline.en || prev.tagline?.en || "",
          };
        }

        if (generatedContent.description) {
          newState.description = {
            es: generatedContent.description.es || prev.description?.es || "",
            en: generatedContent.description.en || prev.description?.en || "",
          };
        }

        if (generatedContent.descriptionDetail) {
          newState.descriptionDetail = {
            es:
              generatedContent.descriptionDetail.es ||
              prev.descriptionDetail?.es ||
              "",
            en:
              generatedContent.descriptionDetail.en ||
              prev.descriptionDetail?.en ||
              "",
          };
        }

        if (
          generatedContent.category &&
          typeof generatedContent.category === "object"
        ) {
          newState.category = {
            es: generatedContent.category.es || prev.category?.es || "",
            en: generatedContent.category.en || prev.category?.en || "",
          };
        }

        // Para arrays y objetos complejos
        if (generatedContent.featuresDetail) {
          // Normalizar diferentes formas que puede devolver el modelo:
          // - { es: [...], en: [...] }
          // - [ { title: {es,en}, description: {es,en} }, ... ]
          const iconDefaults = [
            "BarChart3",
            "Ruler",
            "Shield",
            "Monitor",
            "Activity",
            "Camera",
            "Weight",
            "Settings",
          ];

          const fd = [];

          // Case A: object with es/en arrays
          if (
            typeof generatedContent.featuresDetail === "object" &&
            !Array.isArray(generatedContent.featuresDetail) &&
            (generatedContent.featuresDetail.es ||
              generatedContent.featuresDetail.en)
          ) {
            const esArr = generatedContent.featuresDetail.es || [];
            const enArr = generatedContent.featuresDetail.en || [];
            const max = Math.max(esArr.length, enArr.length);
            for (let i = 0; i < max; i++) {
              const esItem = esArr[i] || {};
              const enItem = enArr[i] || {};

              const titleEs =
                (esItem.title && (esItem.title.es || esItem.title)) ||
                esItem ||
                "";
              const titleEn =
                (enItem.title && (enItem.title.en || enItem.title)) ||
                enItem ||
                "";

              const descEs =
                (esItem.description &&
                  (esItem.description.es || esItem.description)) ||
                "";
              const descEn =
                (enItem.description &&
                  (enItem.description.en || enItem.description)) ||
                "";

              fd.push({
                icon: iconDefaults[i % iconDefaults.length],
                title: {
                  es: String(titleEs || "").trim(),
                  en: String(titleEn || "").trim(),
                },
                description: {
                  es: String(descEs || "").trim(),
                  en: String(descEn || "").trim(),
                },
              });
            }
          } else if (Array.isArray(generatedContent.featuresDetail)) {
            // Case B: already an array of feature objects
            for (let i = 0; i < generatedContent.featuresDetail.length; i++) {
              const feature = generatedContent.featuresDetail[i] || {};
              fd.push({
                icon: feature.icon || iconDefaults[i % iconDefaults.length],
                title: feature.title || {
                  es: feature.title || "",
                  en: feature.title || "",
                },
                description: feature.description || {
                  es: feature.description || "",
                  en: feature.description || "",
                },
              });
            }
          }

          // Ensure length and fill defaults
          while (fd.length < 4) {
            const i = fd.length;
            fd.push({
              icon: iconDefaults[i % iconDefaults.length],
              title: { es: "", en: "" },
              description: { es: "", en: "" },
            });
          }

          newState.featuresDetail = fd;
          console.log(
            "🔧 DEBUG - FeaturesDetail normalizado aplicado:",
            newState.featuresDetail
          );
        } else {
          console.log("❌ DEBUG - No se recibió featuresDetail del servidor");
        }

        if (generatedContent.features) {
          newState.features = generatedContent.features;
        }

        if (generatedContent.capabilities) {
          newState.capabilities = generatedContent.capabilities;
        }

        if (generatedContent.specifications) {
          newState.specifications = generatedContent.specifications;
        }

        console.log("🔧 DEBUG - Nuevo estado completo aplicado:", newState);
        return newState;
      });

      // Mostrar modal de confirmación
      alert(
        "✅ ¡Contenido generado exitosamente!\n\n" +
          "📝 Se ha generado contenido tanto en español como en inglés.\n\n" +
          "🔍 Revisa antes de guardar para asegurar la calidad."
      );
    } catch (error) {
      console.error("Error generando contenido:", error);
      alert(
        "❌ Error generando contenido con IA:\n\n" +
          error.message +
          "\n\n" +
          "Verifica que el PDF sea válido y contenga texto legible."
      );
    } finally {
      setGenerating(false);
    }
  }

  function wordCount(text) {
    return (text || "").trim().split(/\s+/).filter(Boolean).length;
  }

  function onSubmit(e) {
    e?.preventDefault?.();
    const eCard = validateCard();
    const eDetail = validateDetail();
    const missingCard = Object.keys(eCard);
    const missingDetail = Object.keys(eDetail);
    // Permitir guardar con Card completa aunque detalle falte (confirmar)
    if (!missingCard.length && missingDetail.length) {
      setShowHint(true);
      const next = prepareNext();
      setPendingSave(next);
      setShowDetailConfirm(true);
      return;
    }
    // Si Card tiene errores, bloquear y mostrar hints
    if (missingCard.length) {
      setShowHint(true);
      try {
        const priority = ["name", "description"]; // orden básico para Card
        const first = priority.find((k) =>
          k === "description"
            ? !(local.description?.[tab] || "").trim()
            : k === "name"
            ? !(local?.name?.[tab] || "").trim()
            : false
        );
        if (first) {
          const input = document.querySelector(`[data-field="${first}"]`);
          if (input) {
            input.focus({ preventScroll: false });
            input.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      } catch {}
      return;
    }
    onSave?.(prepareNext());
  }

  function prepareNext() {
    const next = { ...local };

    // Normalizar campos de texto bilingües
    ["name", "tagline", "description", "descriptionDetail"].forEach((k) => {
      const obj = next[k] || {};
      if (!obj.en?.trim()) obj.en = obj.es || "";
      next[k] = obj;
    });

    // Normalizar category (debe ser objeto {es, en})
    if (typeof next.category === "string") {
      next.category = {
        es: next.category,
        en: "",
      };
    } else if (!next.category || typeof next.category !== "object") {
      next.category = { es: "", en: "" };
    }

    // Normalizar technicalSheets (debe ser objeto {es, en})
    if (typeof next.technicalSheets === "string") {
      next.technicalSheets = {
        es: next.technicalSheets,
        en: "",
      };
    } else if (
      !next.technicalSheets ||
      typeof next.technicalSheets !== "object"
    ) {
      next.technicalSheets = { es: "", en: "" };
    }

    // Normalizar features (debe ser objeto {es: [], en: []})
    if (Array.isArray(next.features)) {
      next.features = {
        es: next.features.filter(Boolean),
        en: [],
      };
    } else {
      next.features = {
        es: (next.features?.es || [])
          .map((s) => (s || "").trim())
          .filter(Boolean),
        en: (next.features?.en || [])
          .map((s) => (s || "").trim())
          .filter(Boolean),
      };
    }

    // Normalizar specifications (debe ser objeto {es: {}, en: {}})
    if (
      next.specifications &&
      typeof next.specifications === "object" &&
      !next.specifications.es &&
      !next.specifications.en
    ) {
      // Legacy: objeto plano sin es/en → migrar a bilingüe
      next.specifications = {
        es: next.specifications,
        en: {},
      };
    } else if (
      !next.specifications ||
      typeof next.specifications !== "object"
    ) {
      next.specifications = { es: {}, en: {} };
    }

    // Normalizar capabilities (debe ser objeto {es: [], en: []})
    if (Array.isArray(next.capabilities)) {
      next.capabilities = {
        es: next.capabilities.filter(Boolean),
        en: [],
      };
    } else if (!next.capabilities || typeof next.capabilities !== "object") {
      next.capabilities = { es: [], en: [] };
    }

    return next;
  }

  if (!isOpen) return null;

  const Title = isCreate
    ? "Nuevo Producto"
    : isEdit
    ? "Editar Producto"
    : "Vista de Producto";
  const hasES = !!local.technicalSheets?.es;
  const hasEN = !!local.technicalSheets?.en;
  const showGenerateAI = isCreate || isEdit; // Disponible en crear y editar
  const missingList = (
    previewTab === "card"
      ? Object.values(cardErrors)
      : Object.values(detailErrors)
  ).filter(Boolean);

  // Handler para traducción con confirmación
  const handleAutoTranslate = async () => {
    const result = await autoTranslate();

    if (result.needsConfirmation) {
      const confirmed = window.confirm(result.message);
      if (confirmed) {
        await autoTranslate(true); // Force overwrite
      }
    } else if (result.message) {
      alert(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl">
        <div className="px-6 py-4 border-b">
          {/* Título arriba */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">{Title}</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Fila de controles: Vista tabs (izquierda) y botones de idioma (derecha) */}
          <div className="flex items-center justify-between">
            {/* TabMenu: Vista Card | Vista Detalle (izquierda) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={`px-3 py-1 rounded-lg border text-sm ${
                  previewTab === "card"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white"
                }`}
                onClick={() => setPreviewTab("card")}
              >
                Vista Card
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-lg border text-sm ${
                  previewTab === "detail"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white"
                }`}
                onClick={() => setPreviewTab("detail")}
              >
                Vista Detalle
              </button>
            </div>

            {/* Botones de idioma (derecha) */}
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                {["es", "en"].map((l) => (
                  <button
                    type="button"
                    key={l}
                    className={`px-3 py-1.5 rounded-lg border text-sm ${
                      tab === l
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-white"
                    }`}
                    onClick={() => setTab(l)}
                  >
                    {l === "es" ? "Español (ES)" : "Inglés (EN)"}
                  </button>
                ))}
              </div>

              {/* Botón Auto-traducir - Con dirección */}
              {!isView &&
                (() => {
                  const targetLang = tab === "es" ? "EN" : "ES";

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
                      title={`Traducir automáticamente ${tab.toUpperCase()} → ${targetLang}`}
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
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Toolbar ID/Orden: solo en Vista Detalle; en Vista Card se muestran centrados en la plantilla */}
          {previewTab === "detail" && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">ID</label>
                <input
                  disabled={isView || isEdit}
                  value={local.id}
                  onChange={(e) =>
                    setLocal((p) => ({ ...p, id: e.target.value.trim() }))
                  }
                  className={`w-48 border rounded px-3 py-1.5 ${
                    cardErrors.id ? "border-red-400" : ""
                  }`}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Orden</label>
                <input
                  type="number"
                  disabled={isView || local.archived}
                  value={local.order ?? 1}
                  onChange={(e) =>
                    setLocal((p) => ({ ...p, order: Number(e.target.value) }))
                  }
                  className="w-20 border rounded px-3 py-1.5"
                  min={1}
                />
              </div>
              {uploading && (
                <span className="text-xs text-gray-500">Subiendo...</span>
              )}
            </div>
          )}
          {/* Nota de carga se muestra cerca del carrusel y CTA dentro del template */}

          {/* Editable Preview */}
          <ProductFormComponent
            mode={previewTab}
            tab={tab}
            local={local}
            setLocal={setLocal}
            hasES={hasES}
            hasEN={hasEN}
            updateLangField={updateLangField}
            setFeaturesAt={setFeaturesAt}
            addFeature={addFeature}
            removeFeature={removeFeature}
            onPick={onPick}
            onDrop={onDrop}
            generating={generating}
            readOnly={isView}
            onGenerate={showGenerateAI ? handleGenerateAI : undefined}
            invalid={
              previewTab === "card"
                ? {
                    name: tab === "es" ? !local?.name?.es?.trim() : false,
                    description:
                      tab === "es" ? !local?.description?.es?.trim() : false,
                    features:
                      tab === "es" &&
                      !(local?.features?.es || [])
                        .map((s) => (s || "").trim())
                        .filter(Boolean).length,
                  }
                : {
                    name: tab === "es" ? !local?.name?.es?.trim() : false,
                    tagline: tab === "es" ? !local?.tagline?.es?.trim() : false,
                    description:
                      tab === "es"
                        ? !(
                            (local?.descriptionDetail?.es || "").trim() ||
                            (local?.description?.es || "").trim()
                          )
                        : false,
                    category:
                      tab === "es"
                        ? typeof local?.category === "object"
                          ? !local?.category?.es?.trim()
                          : !local?.category?.trim()
                        : false,
                  }
            }
            showHints={showHint}
            uploading={uploading}
          />
          {showHint && (
            <div className="mt-2 text-sm text-red-600">
              <div className="font-semibold mb-1">
                Algunos campos son obligatorios:
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {missingList.length ? (
                  missingList.map((m, i) => <li key={i}>{m}</li>)
                ) : (
                  <li>Completa los resaltados en rojo</li>
                )}
              </ul>
              <div className="text-xs text-gray-600 mt-1">
                El aviso permanecerá visible hasta completar los campos.
              </div>
            </div>
          )}
        </div>
        {isEdit && local.archived && (
          <div className="px-6 pb-4 text-yellow-700">
            Este producto está archivado. Edite y use Restaurar para volver a
            activarlo.
          </div>
        )}

        <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
          <button className="px-3 py-2 border rounded" onClick={onClose}>
            Cerrar
          </button>
          {!isView && (
            <button className="btn-cta px-4 py-2" onClick={onSubmit}>
              {isCreate ? "Crear" : "Guardar"}
            </button>
          )}
        </div>
      </div>
      {/* Confirm modal when detail is incomplete */}
      <DetailIncompleteConfirmModal
        open={showDetailConfirm}
        message="La Vista Detalle tiene campos pendientes (p.ej., Categoría requerida). ¿Deseas guardar solo la Vista Card por ahora?"
        onCancel={() => {
          setShowDetailConfirm(false);
        }}
        onAccept={() => {
          setShowDetailConfirm(false);
          if (pendingSave) {
            onSave?.(pendingSave);
            setPendingSave(null);
          } else {
            onSave?.(prepareNext());
          }
        }}
      />
    </div>
  );
}

// Render confirm modal for incomplete detail
// Place after default export to keep file structure consistent
