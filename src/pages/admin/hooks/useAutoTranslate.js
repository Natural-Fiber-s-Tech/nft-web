/**
 * useAutoTranslate Hook v2.0
 *
 * Shared translation utility for all admin modules (Products, Services, Team, Research, etc.)
 * Follows DRY (Don't Repeat Yourself) and OOP principles for scalability.
 * Now supports bidirectional translation (ES↔EN) and change detection.
 *
 * Usage:
 * ```jsx
 * const { translating, autoTranslate, detectMissing } = useAutoTranslate(data, setData, config);
 *
 * // Auto-translate
 * await autoTranslate();
 *
 * // Get missing translations
 * const missing = detectMissing();
 * ```
 */

import { useState } from "react";

/**
 * Google Translate API (free, no auth required)
 * Alternative: Microsoft Translator, DeepL, or custom backend
 */
export async function translateText(text, from = "es", to = "en") {
  if (!text || typeof text !== "string" || text.trim() === "") return text;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(
      text
    )}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0].map((item) => item[0]).join("");
    }
    return text;
  } catch (error) {
    console.error("❌ Error traduciendo:", text.substring(0, 50), error);
    return text; // Return original on error
  }
}

/**
 * Compara dos valores y determina si son diferentes
 * Maneja strings, arrays y objetos
 */
function isDifferent(value1, value2) {
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) return true;
    return value1.some((item, idx) => item !== value2[idx]);
  }
  return value1 !== value2;
}

/**
 * Main hook for auto-translation
 *
 * @param {Object} data - Current form data (local state)
 * @param {Function} setData - State setter function
 * @param {Object} config - Translation configuration
 * @param {Array<string>} config.simpleFields - Fields with {es: "", en: ""} structure
 * @param {Array<string>} config.arrayFields - Fields with {es: [], en: []} structure
 * @param {Array<Object>} config.nestedFields - Fields with nested translations
 * @param {string} config.sourceLang - Source language (default: 'es')
 * @param {string} config.targetLang - Target language (default: 'en')
 *
 * @returns {Object} Translation utilities
 */
export function useAutoTranslate(data, setData, config = {}) {
  const [translating, setTranslating] = useState(false);

  const {
    simpleFields = [],
    arrayFields = [],
    nestedFields = [],
    objectFields = [], // NEW: Support for object fields like specifications {es: {key: val}, en: {key: val}}
    sourceLang = "es",
    targetLang = "en",
  } = config;

  /**
   * Detecta si hay campos en el idioma ACTIVO que tienen contenido
   * Solo revisa el idioma SOURCE (no compara entre idiomas)
   *
   * Lógica simple:
   * - Si el campo source tiene texto → Badge lo cuenta
   * - NO compara con el idioma destino
   *
   * Ejemplo:
   * - Vista Español: Detecta si title.es, description.es, features.es tienen contenido
   * - Vista Inglés: Detecta si title.en, description.en, features.en tienen contenido
   *
   * @returns {Object} { hasChanges: boolean, fieldsToTranslate: Array }
   */
  function detectChanges() {
    const fieldsWithContent = [];

    console.log(
      "🔍 [DEBUG detectChanges] Detectando campos con contenido en idioma activo:",
      {
        sourceLang,
        simpleFields,
        arrayFields,
        nestedFields,
      }
    );

    // 1. Check simple fields (title, description, etc.)
    for (const field of simpleFields) {
      const sourceValue = data[field]?.[sourceLang];

      console.log(`🔍 [DEBUG] Campo simple "${field}":`, {
        sourceValue:
          sourceValue?.substring(0, 50) +
          (sourceValue?.length > 50 ? "..." : ""),
        sourceLength: sourceValue?.length || 0,
      });

      // Si el campo source tiene contenido, lo contamos
      if (sourceValue && sourceValue.trim()) {
        console.log(
          `✅ [DETECTADO] Campo "${field}" - Tiene contenido en ${sourceLang}`
        );
        fieldsWithContent.push({
          field,
          type: "simple",
        });
      } else {
        console.log(
          `⚪ [VACÍO] Campo "${field}" - Sin contenido en ${sourceLang}`
        );
      }
    }

    // 2. Check array fields (features, tags, etc.)
    for (const field of arrayFields) {
      const sourceArray = data[field]?.[sourceLang];

      console.log(`🔍 [DEBUG] Campo array "${field}":`, {
        sourceArray,
        sourceLength: sourceArray?.length || 0,
      });

      // Si el array source tiene items con contenido, lo contamos
      if (Array.isArray(sourceArray) && sourceArray.length > 0) {
        const sourceFiltered = sourceArray.filter(
          (item) => item && item.trim()
        );

        if (sourceFiltered.length > 0) {
          console.log(
            `✅ [DETECTADO] Campo array "${field}" - Tiene ${sourceFiltered.length} items en ${sourceLang}`
          );
          fieldsWithContent.push({
            field,
            type: "array",
          });
        } else {
          console.log(
            `⚪ [VACÍO] Campo array "${field}" - Sin items con contenido en ${sourceLang}`
          );
        }
      } else {
        console.log(
          `⚪ [VACÍO] Campo array "${field}" - Array vacío en ${sourceLang}`
        );
      }
    }

    // 3. Check nested fields (para estructuras complejas como products.specifications)
    for (const nestedConfig of nestedFields) {
      const { field, subFields } = nestedConfig;
      if (Array.isArray(data[field])) {
        for (let i = 0; i < data[field].length; i++) {
          const item = data[field][i];
          for (const subField of subFields) {
            const sourceValue = item[subField]?.[sourceLang];

            // Si el campo nested source tiene contenido, lo contamos
            if (sourceValue && sourceValue.trim()) {
              console.log(
                `✅ [DETECTADO] Campo nested "${field}[${i}].${subField}" - Tiene contenido en ${sourceLang}`
              );
              fieldsWithContent.push({
                field: `${field}[${i}].${subField}`,
                type: "nested",
              });
            }
          }
        }
      }
    }

    // Check objectFields (e.g., specifications: {es: {key: val}, en: {}})
    for (const field of objectFields) {
      const sourceObj = data[field]?.[sourceLang];

      if (
        sourceObj &&
        typeof sourceObj === "object" &&
        !Array.isArray(sourceObj)
      ) {
        const keys = Object.keys(sourceObj).filter(
          (k) => sourceObj[k] && String(sourceObj[k]).trim()
        );

        if (keys.length > 0) {
          console.log(
            `✅ [DETECTADO] Campo object "${field}" - Tiene ${keys.length} keys en ${sourceLang}`
          );
          fieldsWithContent.push({ field, type: "object" });
        }
      }
    }

    console.log("📊 [DEBUG RESUMEN detectChanges]:", {
      fieldsWithContent,
      totalCampos: fieldsWithContent.length,
    });

    return {
      hasChanges: fieldsWithContent.length > 0,
      fieldsToTranslate: fieldsWithContent,
    };
  }

  /**
   * Auto-translate fields
   * Lógica simple:
   * 1. SIEMPRE traduce cuando se presiona el botón (no depende del badge)
   * 2. Revisa si el destino YA tiene contenido
   * 3. Si destino tiene contenido → Modal de confirmación
   * 4. Si se acepta o destino vacío → Procede con traducción
   *
   * @param {boolean} forceOverwrite - Si es true, sobrescribe sin preguntar
   */
  async function autoTranslate(forceOverwrite = false) {
    if (translating) {
      return {
        success: false,
        message: "Ya hay una traducción en progreso...",
      };
    }

    console.log("🌐 [autoTranslate] Iniciando traducción:", {
      sourceLang,
      targetLang,
      forceOverwrite,
    });

    // Verificar si el idioma destino YA tiene contenido (para mostrar modal de confirmación)
    let hasTargetContent = false;

    // Check simple fields
    for (const field of simpleFields) {
      const targetValue = data[field]?.[targetLang];
      if (targetValue && targetValue.trim()) {
        hasTargetContent = true;
        break;
      }
    }

    // Check array fields (solo si aún no se detectó contenido)
    if (!hasTargetContent) {
      for (const field of arrayFields) {
        const targetArray = data[field]?.[targetLang];
        if (
          Array.isArray(targetArray) &&
          targetArray.some((item) => item && item.trim())
        ) {
          hasTargetContent = true;
          break;
        }
      }
    }

    // Check objectFields (solo si aún no se detectó contenido)
    if (!hasTargetContent) {
      for (const field of objectFields) {
        const targetObj = data[field]?.[targetLang];
        if (
          targetObj &&
          typeof targetObj === "object" &&
          !Array.isArray(targetObj)
        ) {
          const keys = Object.keys(targetObj).filter(
            (k) => targetObj[k] && String(targetObj[k]).trim()
          );
          if (keys.length > 0) {
            hasTargetContent = true;
            break;
          }
        }
      }
    }

    console.log("🔍 [autoTranslate] Verificación de destino:", {
      hasTargetContent,
      targetLang,
    });

    // Si el destino tiene contenido y no se forzó sobrescribir, retornar para pedir confirmación
    if (hasTargetContent && !forceOverwrite) {
      return {
        success: false,
        needsConfirmation: true,
        message: `Ya existen traducciones en ${
          targetLang === "es" ? "Español" : "Inglés"
        }. ¿Deseas sobreescribirlas?`,
      };
    }

    setTranslating(true);

    try {
      const updated = { ...data };

      // 1. Translate simple string fields {es: "", en: ""}
      for (const field of simpleFields) {
        if (updated[field]?.[sourceLang] && updated[field][sourceLang].trim()) {
          console.log(`🔄 Traduciendo ${field}...`);
          updated[field][targetLang] = await translateText(
            updated[field][sourceLang],
            sourceLang,
            targetLang
          );
          await new Promise((resolve) => setTimeout(resolve, 200)); // Rate limiting
        }
      }

      // 2. Translate array fields {es: [], en: []}
      for (const field of arrayFields) {
        if (
          Array.isArray(updated[field]?.[sourceLang]) &&
          updated[field][sourceLang].length > 0
        ) {
          console.log(`🔄 Traduciendo ${field}...`);
          updated[field][targetLang] = [];
          for (const item of updated[field][sourceLang]) {
            if (item && item.trim()) {
              const translated = await translateText(
                item,
                sourceLang,
                targetLang
              );
              updated[field][targetLang].push(translated);
              await new Promise((resolve) => setTimeout(resolve, 150));
            }
          }
        }
      }

      // 3. Translate nested fields (e.g., featuresDetail array with {title: {es, en}, description: {es, en}})
      for (const nestedConfig of nestedFields) {
        const { field, subFields } = nestedConfig;
        if (Array.isArray(updated[field])) {
          for (let i = 0; i < updated[field].length; i++) {
            const item = updated[field][i];
            for (const subField of subFields) {
              if (
                item[subField]?.[sourceLang] &&
                item[subField][sourceLang].trim()
              ) {
                console.log(`🔄 Traduciendo ${field}[${i}].${subField}...`);
                item[subField][targetLang] = await translateText(
                  item[subField][sourceLang],
                  sourceLang,
                  targetLang
                );
                await new Promise((resolve) => setTimeout(resolve, 150));
              }
            }
          }
        }
      }

      // 4. Translate object fields (e.g., specifications: {es: {key: val}, en: {}})
      for (const field of objectFields) {
        const sourceObj = updated[field]?.[sourceLang];

        if (
          sourceObj &&
          typeof sourceObj === "object" &&
          !Array.isArray(sourceObj)
        ) {
          console.log(`🔄 Traduciendo object field ${field}...`);

          // 🔥 FIX: Limpiar el objeto target completamente antes de traducir
          // Esto evita que se acumulen keys antiguas cuando renombras en el idioma source
          updated[field][targetLang] = {};
          const targetObj = updated[field][targetLang];

          // 🔥 Mantener el orden original usando Object.keys()
          const keys = Object.keys(sourceObj);

          for (const key of keys) {
            const value = sourceObj[key];

            // Saltar keys temporales vacías
            if (!value || !String(value).trim()) {
              continue;
            }

            // 🔥 Traducir TANTO la key COMO el value
            // Si la key es temporal (__temp_123), mantenerla igual
            // Si la key es real ("Peso"), traducirla ("Weight")
            let translatedKey = key;
            if (!key.startsWith("__temp_")) {
              translatedKey = await translateText(key, sourceLang, targetLang);
              await new Promise((resolve) => setTimeout(resolve, 150));
            }

            const translatedValue = await translateText(
              String(value),
              sourceLang,
              targetLang
            );

            targetObj[translatedKey] = translatedValue;
            console.log(
              `  ✅ ${key} → ${translatedKey}: ${value} → ${translatedValue}`
            );
            await new Promise((resolve) => setTimeout(resolve, 150));
          }
        }
      }

      setData(updated);

      const targetLangName = targetLang === "es" ? "Español" : "Inglés";
      console.log(
        `✅ [autoTranslate] Traducción completada a ${targetLangName}`
      );

      return {
        success: true,
        message: `✅ ¡Traducción completada a ${targetLangName}! Revisa los campos y ajusta si es necesario.`,
      };
    } catch (error) {
      console.error("❌ Error en auto-traducción:", error);
      return {
        success: false,
        message:
          "❌ Error durante la traducción. Algunos campos pueden no haberse traducido.",
      };
    } finally {
      setTranslating(false);
    }
  }

  /**
   * Detect fields with content in active language (for badge display)
   *
   * @returns {Array<string>} List of field labels
   */
  function detectMissing() {
    const changes = detectChanges();
    const labels = [];

    for (const change of changes.fieldsToTranslate) {
      const fieldName = change.field.split("[")[0]; // Remove array indices
      const label = fieldLabel(fieldName);
      labels.push(`• ${label}`);
    }

    return labels;
  }

  /**
   * Convert field name to human-readable label
   */
  function fieldLabel(field) {
    const labels = {
      name: "Nombre",
      title: "Título",
      tagline: "Tagline",
      description: "Descripción",
      descriptionDetail: "Descripción Detallada",
      category: "Categoría",
      features: "Características",
      featuresDetail: "Características Detalladas",
      capabilities: "Capacidades",
      specifications: "Especificaciones",
      bio: "Biografía",
      role: "Rol",
      specialty: "Especialidad",
      objectives: "Objetivos",
      methodology: "Metodología",
      results: "Resultados",
    };
    return labels[field] || field.charAt(0).toUpperCase() + field.slice(1);
  }

  return {
    translating,
    autoTranslate,
    detectMissing,
    detectChanges, // Exportar también para uso avanzado
  };
}

/**
 * Batch translate multiple texts at once (with rate limiting)
 */
export async function batchTranslate(
  texts,
  from = "es",
  to = "en",
  delayMs = 150
) {
  const results = [];
  for (const text of texts) {
    const translated = await translateText(text, from, to);
    results.push(translated);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return results;
}
