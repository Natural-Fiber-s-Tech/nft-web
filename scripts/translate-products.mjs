#!/usr/bin/env node
/**
 * Script para traducir automáticamente todos los productos de español a inglés
 * usando Google Translate API (gratis sin API key usando biblioteca no oficial)
 *
 * Uso: node scripts/translate-products.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta al archivo products.json
const PRODUCTS_PATH = path.join(__dirname, "../public/content/products.json");

/**
 * Traduce texto usando Google Translate (método sin API key)
 * @param {string} text - Texto a traducir
 * @param {string} from - Idioma origen (default: 'es')
 * @param {string} to - Idioma destino (default: 'en')
 * @returns {Promise<string>} - Texto traducido
 */
async function translateText(text, from = "es", to = "en") {
  if (!text || typeof text !== "string" || text.trim() === "") {
    return text;
  }

  try {
    // Usar la API pública de Google Translate (sin auth)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(
      text
    )}`;

    const response = await fetch(url);
    const data = await response.json();

    // La respuesta es un array complejo, extraer el texto traducido
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0].map((item) => item[0]).join("");
    }

    return text; // Si falla, devolver el original
  } catch (error) {
    console.error(
      `❌ Error traduciendo: "${text.substring(0, 50)}..."`,
      error.message
    );
    return text; // Si falla, devolver el original
  }
}

/**
 * Traduce un objeto recursivamente
 * @param {any} obj - Objeto a traducir
 * @param {string} path - Ruta del campo (para logging)
 * @returns {Promise<any>} - Objeto traducido
 */
async function translateObject(obj, path = "") {
  if (typeof obj === "string") {
    if (obj.trim() === "") return obj;

    console.log(`   🔄 Traduciendo: ${path}`);
    const translated = await translateText(obj);
    console.log(
      `      ES: ${obj.substring(0, 60)}${obj.length > 60 ? "..." : ""}`
    );
    console.log(
      `      EN: ${translated.substring(0, 60)}${
        translated.length > 60 ? "..." : ""
      }`
    );

    // Pequeña pausa para no saturar la API
    await new Promise((resolve) => setTimeout(resolve, 300));

    return translated;
  }

  if (Array.isArray(obj)) {
    const result = [];
    for (let i = 0; i < obj.length; i++) {
      result.push(await translateObject(obj[i], `${path}[${i}]`));
    }
    return result;
  }

  if (obj && typeof obj === "object") {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = await translateObject(value, `${path}.${key}`);
    }
    return result;
  }

  return obj;
}

/**
 * Traduce un producto completo
 * @param {Object} product - Producto a traducir
 * @returns {Promise<Object>} - Producto traducido
 */
async function translateProduct(product) {
  const translated = { ...product };

  // Campos multiidioma a traducir
  const multilingualFields = [
    "name",
    "tagline",
    "description",
    "descriptionDetail",
    "features",
  ];

  for (const field of multilingualFields) {
    if (translated[field]?.es && typeof translated[field].es === "string") {
      // Campo de texto simple
      if (
        translated[field].en === translated[field].es ||
        !translated[field].en?.trim()
      ) {
        console.log(`   🔄 Traduciendo ${field}...`);
        translated[field].en = await translateText(translated[field].es);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } else if (Array.isArray(translated[field]?.es)) {
      // Array de strings (features)
      const needsTranslation =
        !Array.isArray(translated[field].en) ||
        translated[field].en.length === 0 ||
        translated[field].en.length !== translated[field].es.length ||
        translated[field].es.some(
          (item, idx) => item === translated[field].en[idx]
        );

      if (needsTranslation) {
        console.log(`   🔄 Traduciendo ${field} array...`);
        translated[field].en = [];
        for (const item of translated[field].es) {
          const translatedItem = await translateText(item);
          translated[field].en.push(translatedItem);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    }
  }

  // featuresDetail es más complejo
  if (Array.isArray(translated.featuresDetail)) {
    for (let i = 0; i < translated.featuresDetail.length; i++) {
      const feature = translated.featuresDetail[i];

      // Traducir title
      if (feature.title?.es) {
        if (
          feature.title.en === feature.title.es ||
          !feature.title.en?.trim()
        ) {
          feature.title.en = await translateText(feature.title.es);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      // Traducir description
      if (feature.description?.es) {
        if (
          feature.description.en === feature.description.es ||
          !feature.description.en?.trim()
        ) {
          feature.description.en = await translateText(feature.description.es);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    }
  }

  return translated;
}

/**
 * Main function
 */
async function main() {
  console.log("\n🌐 ===== TRADUCCIÓN AUTOMÁTICA DE PRODUCTOS =====\n");

  // Leer archivo products.json
  console.log("📖 Leyendo productos...");
  const data = fs.readFileSync(PRODUCTS_PATH, "utf8");
  const products = JSON.parse(data);

  console.log(`✅ ${products.length} productos encontrados\n`);

  // Crear respaldo
  const backupPath = PRODUCTS_PATH.replace(
    ".json",
    `-backup-${Date.now()}.json`
  );
  fs.writeFileSync(backupPath, data, "utf8");
  console.log(`💾 Respaldo creado: ${path.basename(backupPath)}\n`);

  // Traducir cada producto
  const translatedProducts = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(
      `\n📦 [${i + 1}/${products.length}] Traduciendo: ${
        product.name?.es || product.id
      }`
    );
    console.log(`   ID: ${product.id}`);

    if (product.archived) {
      console.log(`   ⏭️  OMITIDO (archivado)`);
      translatedProducts.push(product);
      continue;
    }

    try {
      const translated = await translateProduct(product);
      translatedProducts.push(translated);
      console.log(`   ✅ Completado`);
    } catch (error) {
      console.error(`   ❌ Error:`, error.message);
      translatedProducts.push(product); // Mantener original si falla
    }
  }

  // Guardar resultado
  console.log("\n💾 Guardando productos traducidos...");
  fs.writeFileSync(
    PRODUCTS_PATH,
    JSON.stringify(translatedProducts, null, 2),
    "utf8"
  );

  console.log("✅ ¡Traducción completada!\n");
  console.log(`📄 Archivo actualizado: ${PRODUCTS_PATH}`);
  console.log(`📄 Respaldo guardado: ${backupPath}\n`);
}

// Ejecutar
main().catch((error) => {
  console.error("\n❌ Error fatal:", error);
  process.exit(1);
});
