import React, { useState } from "react";
import { ProductCard } from "../../../../components/sections/Products";
import ProductDetailTemplate from "../../../../components/products/ProductDetailTemplate";
import IconPicker from "../common/IconPicker";

export default function ProductFormComponent({
  mode = "card", // 'card' | 'detail'
  tab = "es",
  local,
  setLocal,
  hasES,
  hasEN,
  updateLangField, // ✅ Recibe las funciones del padre
  setFeaturesAt,
  addFeature,
  removeFeature,
  onPick,
  onDrop,
  generating,
  readOnly = false,
  onPickIcon,
  onGenerate,
  invalid,
  showHints,
  uploading,
}) {
  // 🔍 DEBUG: Log cuando cambian props
  console.log("🟡 ProductFormComponent render:", {
    mode,
    tab,
    localName: local?.name,
    localDescription: local?.description,
    localFeatures: local?.features,
  });
  const change = (field, value) =>
    setLocal((prev) => ({ ...prev, [field]: value }));
  const changeLang = (field, value) =>
    setLocal((prev) => ({
      ...prev,
      [field]: { ...(prev[field] || {}), [tab]: value },
    }));

  const ensureFeaturesDetail = (arrLen) =>
    setLocal((prev) => {
      const fd = Array.isArray(prev.featuresDetail)
        ? [...prev.featuresDetail]
        : [];
      while (fd.length < arrLen) fd.push({ icon: "BarChart3" });
      return { ...prev, featuresDetail: fd };
    });

  // Card mode: reuse public ProductCard at realistic size
  if (mode === "card") {
    // ✅ CORRECCIÓN: Vista Card debe usar directamente features[idioma]
    // No usar featuresDetail que es para Vista Detalle
    const cardFeatures = Array.isArray(local.features?.[tab])
      ? local.features[tab]
      : [];

    const cardProduct = {
      id: local.id,
      name: local.name?.[tab] || "",
      image: local.image || "",
      description: local.description?.[tab] || "",
      features: cardFeatures,
    };

    console.log("🔴 Card mode - cardProduct:", cardProduct);
    console.log("🔴 Card mode - tab:", tab, "name:", local.name?.[tab]);
    return (
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Original editable template (big card with inline inputs) */}
        <div className="w-full">
          {/* ✅ Contenedor compacto de ID y Orden - Layout inline */}
          <div className="mb-3 max-w-sm mx-auto">
            <div className="bg-transparent rounded-lg px-0 py-2.5  border-gray-200 ">
              <div className="flex items-center gap-6">
                {/* ID - flex-1 con label inline */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    ID
                  </label>
                  <input
                    disabled={readOnly || local?.mode === "edit"}
                    value={local.id}
                    onChange={(e) =>
                      setLocal((p) => ({ ...p, id: e.target.value.trim() }))
                    }
                    className={`flex-1 px-3 py-1.5 border rounded text-sm font-mono truncate ${
                      invalid?.id
                        ? "border-red-400 bg-white"
                        : "border-gray-300 bg-white"
                    }`}
                    title={local.id}
                  />
                </div>

                {/* Orden - Ancho fijo con label inline */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Orden *
                  </label>
                  <input
                    type="number"
                    disabled={readOnly || local.archived}
                    value={local.order ?? 1}
                    onChange={(e) =>
                      setLocal((p) => ({ ...p, order: Number(e.target.value) }))
                    }
                    className="w-20 px-3 py-1.5 border border-gray-300 rounded text-sm bg-white text-center"
                    min={1}
                  />
                </div>

                {/* Indicador de carga */}
                {uploading && (
                  <div className="flex-shrink-0">
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      Subiendo...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {!readOnly && (
            <div
              className="mb-3 max-w-sm mx-auto rounded-xl overflow-hidden border border-dashed border-gray-300 p-2 flex items-center justify-center text-xs text-gray-500 cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop?.("image", e)}
              onClick={() => onPick?.("image")}
              title="Click o arrastra aquí para cambiar la imagen"
            >
              Click o arrastra aquí para cambiar la imagen de la Card
            </div>
          )}

          {/* Image URL (only if present) */}

          <div className="max-w-sm mx-auto text-[12px] text-gray-700 mb-2 flex items-center gap-2 border-1 py-1 px-2 rounded-xl">
            <span className="text-gray-600">URL:</span>
            {local.image ? (
              <a
                href={local.image}
                target="_blank"
                rel="noreferrer"
                className="truncate hover:underline text-gray-500 flex-1"
                title={local.image}
              >
                {local.image}
              </a>
            ) : null}
          </div>

          {/* Editable big card */}
          <div className="w-full max-w-sm mx-auto">
            <ProductCard
              product={cardProduct}
              lang={tab}
              disabled
              editable={!readOnly}
              previewMode={true}
              onEdit={(path, value) => {
                const [head, idx] = path;
                if (head === "name") return updateLangField("name", value);
                if (head === "description")
                  return updateLangField("description", value);
                if (head === "features") {
                  return setFeaturesAt(idx, value);
                }
              }}
              invalid={invalid}
              showHints={showHints}
            />
          </div>

          {/* Features add/remove controls below */}
          {!readOnly && (
            <div className="mt-4">
              <div className="flex items-center justify-center gap-6 mb-2">
                <span className="text-xs font-medium">Características</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs px-2 py-1 border rounded"
                    onClick={addFeature}
                  >
                    + Agregar
                  </button>
                  <button
                    type="button"
                    className="text-xs px-2 py-1 border rounded"
                    onClick={() => {
                      const arr = Array.isArray(local.features?.[tab])
                        ? [...local.features[tab]]
                        : [];
                      if (arr.length > 0) removeFeature(arr.length - 1);
                    }}
                  >
                    − Quitar Última
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Non-editable live preview with small heading */}
        <div className="w-full">
          <div className="w-full flex justify-center mb-16">
            <div
              className={`px-3 py-1 rounded-lg border text-md bg-red-600 text-white border-red-600`}
            >
              Vista Previa
            </div>
          </div>
          <div className="w-full max-w-sm mx-auto">
            <ProductCard
              product={cardProduct}
              lang={tab}
              disabled
              editable={false}
              previewMode={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // Detail mode: reuse public ProductDetail layout as a template
  const productForTemplate = {
    id: local.id,
    name:
      typeof local.name === "object"
        ? local.name?.[tab] || local.name?.es || local.name?.en || ""
        : String(local.name || ""),
    category:
      typeof local.category === "object"
        ? local.category?.[tab] ||
          local.category?.es ||
          local.category?.en ||
          ""
        : String(local.category || ""),
    tagline:
      typeof local.tagline === "object"
        ? local.tagline?.[tab] || local.tagline?.es || local.tagline?.en || ""
        : String(local.tagline || ""),
    description:
      typeof local.descriptionDetail === "object"
        ? local.descriptionDetail[tab] ||
          local.descriptionDetail?.es ||
          local.descriptionDetail?.en ||
          ""
        : typeof local.description === "object"
        ? local.description[tab] ||
          local.description?.es ||
          local.description?.en ||
          ""
        : String(local.description || ""),
    image: local.image || "",
    technicalSheets: local.technicalSheets || {},
    features: (Array.isArray(local.featuresDetail)
      ? local.featuresDetail
      : []
    ).map((detail, i) => {
      // Nuevo formato: featuresDetail tiene title/description bilingües
      if (detail.title && typeof detail.title === "object") {
        return {
          title: detail.title[tab] || "",
          description: detail.description?.[tab] || "",
          icon: detail.icon || "BarChart3",
        };
      }
      // Legacy: features[tab] es array de strings (solo títulos)
      const legacyFeatures = local.features?.[tab] || [];
      return {
        title: legacyFeatures[i] || "",
        description: "",
        icon: detail.icon || "BarChart3",
      };
    }),
    specifications:
      typeof local.specifications === "object" &&
      typeof local.specifications?.[tab] === "object" &&
      !Array.isArray(local.specifications?.[tab])
        ? local.specifications[tab]
        : typeof local.specifications === "object" &&
          !local.specifications?.es &&
          !local.specifications?.en
        ? local.specifications // Legacy: objeto plano sin es/en
        : {},
    capabilities: Array.isArray(local.capabilities?.[tab])
      ? local.capabilities[tab]
      : Array.isArray(local.capabilities)
      ? local.capabilities
      : [],
    youtubeVideo: local.youtubeVideo || "",
    additionalImages: local.additionalImages || [],
  };

  // 🔍 DEBUG: Verificar productForTemplate en modo detail
  console.log("🟣 Detail mode - productForTemplate:", productForTemplate);

  const handleEdit = (path, value) => {
    if (!Array.isArray(path) || !path.length) return;
    const [head, ...rest] = path;
    if (head === "name") return updateLangField("name", value);
    if (head === "category") return changeLang("category", value);
    if (head === "tagline") return updateLangField("tagline", value);
    if (head === "description")
      return updateLangField("descriptionDetail", value);
    if (head === "features") {
      if (rest[0] === "add") return addFeature();
      if (rest[0] === "remove" && rest[1] === "last") {
        const fd = Array.isArray(local.featuresDetail)
          ? local.featuresDetail
          : [];
        if (fd.length > 0) return removeFeature(fd.length - 1);
        return;
      }
      if (rest[0] === "reorder") {
        const { from, to } = value || {};
        setLocal((prev) => {
          const fd = Array.isArray(prev.featuresDetail)
            ? [...prev.featuresDetail]
            : [];
          if (from == null || to == null || from === to) return prev;
          const [movedFd] = fd.splice(from, 1);
          fd.splice(
            to,
            0,
            movedFd || {
              icon: "BarChart3",
              title: { es: "", en: "" },
              description: { es: "", en: "" },
            }
          );
          return {
            ...prev,
            featuresDetail: fd,
          };
        });
        return;
      }
      const [idx, field] = rest;
      if (field === "title") return setFeaturesAt(idx, value, "title");
      if (field === "description")
        return setFeaturesAt(idx, value, "description");
    }
    if (head === "additionalImages") {
      if (rest[0] === "remove") {
        const idx = rest[1];
        return setLocal((prev) => {
          const arr = Array.isArray(prev.additionalImages)
            ? [...prev.additionalImages]
            : [];
          arr.splice(idx, 1);
          return { ...prev, additionalImages: arr };
        });
      }
      if (rest[0] === "reorder") {
        const { from, to } = value || {};
        return setLocal((prev) => {
          const arr = Array.isArray(prev.additionalImages)
            ? [...prev.additionalImages]
            : [];
          if (from == null || to == null || from === to) return prev;
          const [moved] = arr.splice(from, 1);
          arr.splice(to, 0, moved);
          return { ...prev, additionalImages: arr };
        });
      }
    }
    if (head === "youtubeVideo") return change("youtubeVideo", value);
    if (head === "category") return changeLang("category", value);
    if (head === "specsLabel") {
      const [key] = rest;
      return setLocal((prev) => {
        // Handle i18n structure: specifications.es, specifications.en
        const isI18n =
          typeof prev.specifications?.es === "object" ||
          typeof prev.specifications?.en === "object";
        if (isI18n) {
          // 🔥 FIX: Solo renombrar en el idioma activo [tab], no en ambos
          const currentSpecs = { ...(prev.specifications?.[tab] || {}) };
          const currentValue = currentSpecs[key];
          delete currentSpecs[key];
          currentSpecs[value] = currentValue;

          return {
            ...prev,
            specifications: {
              ...prev.specifications,
              [tab]: currentSpecs,
            },
          };
        } else {
          // Legacy fallback
          const specs = { ...(prev.specifications || {}) };
          const val = specs[key];
          delete specs[key];
          specs[value] = val;
          return { ...prev, specifications: specs };
        }
      });
    }
    if (head === "specsValue") {
      const [key] = rest;
      return setLocal((prev) => {
        const isI18n =
          typeof prev.specifications?.es === "object" ||
          typeof prev.specifications?.en === "object";
        if (isI18n) {
          return {
            ...prev,
            specifications: {
              ...(prev.specifications || {}),
              [tab]: { ...(prev.specifications?.[tab] || {}), [key]: value },
            },
          };
        } else {
          // Legacy fallback
          return {
            ...prev,
            specifications: { ...(prev.specifications || {}), [key]: value },
          };
        }
      });
    }
    if (head === "specs") {
      if (rest[0] === "add") {
        return setLocal((prev) => {
          const isI18n =
            typeof prev.specifications?.es === "object" ||
            typeof prev.specifications?.en === "object";
          if (isI18n) {
            // Generar una key temporal única para evitar colisiones
            const tempKey = `__temp_${Date.now()}`;
            // Solo agregar en el idioma activo (tab), no en ambos
            return {
              ...prev,
              specifications: {
                ...prev.specifications,
                [tab]: {
                  ...(prev.specifications?.[tab] || {}),
                  [tempKey]: "",
                },
              },
            };
          } else {
            // Legacy
            const tempKey = `__temp_${Date.now()}`;
            return {
              ...prev,
              specifications: { ...(prev.specifications || {}), [tempKey]: "" },
            };
          }
        });
      }
      if (rest[0] === "remove" && rest[1] === "last") {
        return setLocal((prev) => {
          const isI18n =
            typeof prev.specifications?.es === "object" ||
            typeof prev.specifications?.en === "object";
          if (isI18n) {
            // 🔥 FIX: Solo eliminar del idioma activo [tab], no de ambos
            const entries = Object.entries(prev.specifications?.[tab] || {});
            if (!entries.length) return prev;
            entries.pop();
            return {
              ...prev,
              specifications: {
                ...prev.specifications,
                [tab]: Object.fromEntries(entries),
              },
            };
          } else {
            // Legacy
            const entries = Object.entries(prev.specifications || {});
            if (!entries.length) return prev;
            entries.pop();
            return { ...prev, specifications: Object.fromEntries(entries) };
          }
        });
      }
    }
    if (head === "capabilities") {
      if (rest[0] === "add") {
        return setLocal((prev) => {
          const isI18n =
            Array.isArray(prev.capabilities?.es) ||
            Array.isArray(prev.capabilities?.en);
          if (isI18n) {
            return {
              ...prev,
              capabilities: {
                es: [...(prev.capabilities?.es || []), ""],
                en: [...(prev.capabilities?.en || []), ""],
              },
            };
          } else {
            // Legacy
            return {
              ...prev,
              capabilities: [...(prev.capabilities || []), ""],
            };
          }
        });
      }
      if (rest[0] === "remove" && rest[1] === "last") {
        return setLocal((prev) => {
          const isI18n =
            Array.isArray(prev.capabilities?.es) ||
            Array.isArray(prev.capabilities?.en);
          if (isI18n) {
            const arrES = Array.isArray(prev.capabilities?.es)
              ? [...prev.capabilities.es]
              : [];
            const arrEN = Array.isArray(prev.capabilities?.en)
              ? [...prev.capabilities.en]
              : [];
            if (arrES.length) arrES.pop();
            if (arrEN.length) arrEN.pop();
            return { ...prev, capabilities: { es: arrES, en: arrEN } };
          } else {
            // Legacy
            const arr = Array.isArray(prev.capabilities)
              ? [...prev.capabilities]
              : [];
            if (arr.length) arr.pop();
            return { ...prev, capabilities: arr };
          }
        });
      }
      const [idx] = rest;
      return setLocal((prev) => {
        const isI18n =
          Array.isArray(prev.capabilities?.es) ||
          Array.isArray(prev.capabilities?.en);
        if (isI18n) {
          const arr = Array.isArray(prev.capabilities?.[tab])
            ? [...prev.capabilities[tab]]
            : [];
          arr[idx] = value;
          return {
            ...prev,
            capabilities: { ...(prev.capabilities || {}), [tab]: arr },
          };
        } else {
          // Legacy
          const arr = Array.isArray(prev.capabilities)
            ? [...prev.capabilities]
            : [];
          arr[idx] = value;
          return { ...prev, capabilities: arr };
        }
      });
    }
  };

  return (
    <ProductDetailTemplate
      product={productForTemplate}
      adminLang={tab}
      labels={{
        datasheetES: tab === "es" ? "Ficha ES" : "Datasheet ES",
        datasheetEN: tab === "es" ? "Ficha EN" : "Datasheet EN",
        mainFeatures:
          tab === "es" ? "Características Principales" : "Main Features",
        technicalSpecs:
          tab === "es"
            ? "Especificaciones Técnicas"
            : "Technical Specifications",
        capabilities: tab === "es" ? "Capacidades" : "Capabilities",
      }}
      editable={!readOnly}
      onEdit={handleEdit}
      onPick={onPick}
      onDrop={onDrop}
      onPickIcon={onPickIcon}
      onGenerate={onGenerate}
      generating={generating}
      invalid={invalid}
      showHints={showHints}
    />
  );
}

// Inline Icon Picker modal
export function FeatureIconPicker({ open, onClose, onSelect }) {
  if (!open) return null;
  return <IconPicker onSelect={onSelect} onClose={onClose} />;
}

// Wrap default export to render icon picker overlay when invoked
export function ProductFormComponentWithPicker(props) {
  const [local, setLocal] = [props.local, props.setLocal];
  const [iconPickerIndex, setIconPickerIndex] = useState(null);

  const onSelectIcon = (iconName) => {
    const idx = iconPickerIndex;
    setIconPickerIndex(null);
    if (idx == null) return;
    setLocal((prev) => {
      const fd = Array.isArray(prev.featuresDetail)
        ? [...prev.featuresDetail]
        : [];
      while (fd.length <= idx) fd.push({ icon: "BarChart3" });
      fd[idx] = { ...(fd[idx] || {}), icon: iconName };
      return { ...prev, featuresDetail: fd };
    });
  };

  const Comp = ProductFormComponent;
  return (
    <>
      <Comp
        {...props}
        local={local}
        setLocal={setLocal}
        onPickIcon={(idx) => setIconPickerIndex(idx)}
      />
      <FeatureIconPicker
        open={iconPickerIndex != null}
        onClose={() => setIconPickerIndex(null)}
        onSelect={onSelectIcon}
      />
    </>
  );
}
