// Script de validación para verificar estructura i18n en products.json
// Ejecutar con: node scripts/validate-i18n.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCTS_PATH = path.join(__dirname, "../public/content/products.json");

function validateI18nStructure() {
  console.log("🔍 Validando estructura i18n en products.json...\n");

  try {
    const data = fs.readFileSync(PRODUCTS_PATH, "utf8");
    const products = JSON.parse(data);

    let errors = [];
    let warnings = [];
    let passedCount = 0;

    products.forEach((product, idx) => {
      const id = product.id || `producto-${idx}`;
      console.log(`\n📦 Validando: ${id}`);

      // Validar fields i18n obligatorios
      const i18nFields = [
        "name",
        "tagline",
        "description",
        "descriptionDetail",
        "features",
        "category",
        "specifications",
        "capabilities",
      ];

      i18nFields.forEach((field) => {
        if (!product[field]) {
          warnings.push(`  ⚠️  ${id}: Falta campo "${field}"`);
          return;
        }

        // Validar estructura i18n según tipo de dato
        if (field === "features") {
          // Debe ser {es: [], en: []}
          if (!product[field].es || !Array.isArray(product[field].es)) {
            errors.push(
              `  ❌ ${id}.${field}: No tiene estructura {es: [], en: []}`
            );
          } else if (!product[field].en || !Array.isArray(product[field].en)) {
            warnings.push(`  ⚠️  ${id}.${field}.en: Array vacío o faltante`);
          } else {
            console.log(
              `  ✅ ${id}.${field}: OK (${product[field].es.length} items ES, ${product[field].en.length} items EN)`
            );
            passedCount++;
          }
        } else if (field === "specifications") {
          // Debe ser {es: {key:val}, en: {key:val}}
          if (!product[field].es || typeof product[field].es !== "object") {
            errors.push(
              `  ❌ ${id}.${field}: No tiene estructura {es: {}, en: {}}`
            );
          } else if (
            !product[field].en ||
            typeof product[field].en !== "object"
          ) {
            warnings.push(`  ⚠️  ${id}.${field}.en: Objeto vacío o faltante`);
          } else {
            const keysES = Object.keys(product[field].es).length;
            const keysEN = Object.keys(product[field].en).length;
            console.log(
              `  ✅ ${id}.${field}: OK (${keysES} specs ES, ${keysEN} specs EN)`
            );
            passedCount++;
          }
        } else if (field === "capabilities") {
          // Debe ser {es: [], en: []}
          if (!product[field].es || !Array.isArray(product[field].es)) {
            errors.push(
              `  ❌ ${id}.${field}: No tiene estructura {es: [], en: []}`
            );
          } else if (!product[field].en || !Array.isArray(product[field].en)) {
            warnings.push(`  ⚠️  ${id}.${field}.en: Array vacío o faltante`);
          } else {
            console.log(
              `  ✅ ${id}.${field}: OK (${product[field].es.length} items ES, ${product[field].en.length} items EN)`
            );
            passedCount++;
          }
        } else if (field === "category") {
          // Debe ser {es: "...", en: "..."}
          if (typeof product[field] === "string") {
            errors.push(
              `  ❌ ${id}.${field}: Es string, debe ser {es: "", en: ""}`
            );
          } else if (!product[field].es) {
            errors.push(`  ❌ ${id}.${field}: Falta ${field}.es`);
          } else if (!product[field].en) {
            warnings.push(`  ⚠️  ${id}.${field}.en: Vacío o faltante`);
          } else {
            console.log(`  ✅ ${id}.${field}: OK`);
            passedCount++;
          }
        } else {
          // Campos string i18n simples: {es: "", en: ""}
          if (typeof product[field] === "string") {
            errors.push(
              `  ❌ ${id}.${field}: Es string, debe ser {es: "", en: ""}`
            );
          } else if (!product[field].es) {
            errors.push(`  ❌ ${id}.${field}: Falta ${field}.es`);
          } else if (!product[field].en) {
            warnings.push(`  ⚠️  ${id}.${field}.en: Vacío o faltante`);
          } else {
            console.log(`  ✅ ${id}.${field}: OK`);
            passedCount++;
          }
        }
      });
    });

    // Resumen
    console.log("\n\n📊 RESUMEN DE VALIDACIÓN\n");
    console.log(`✅ Validaciones pasadas: ${passedCount}`);
    console.log(`⚠️  Advertencias: ${warnings.length}`);
    console.log(`❌ Errores críticos: ${errors.length}\n`);

    if (warnings.length > 0) {
      console.log("⚠️  ADVERTENCIAS (no bloquean, pero revisar):");
      warnings.forEach((w) => console.log(w));
      console.log();
    }

    if (errors.length > 0) {
      console.log("❌ ERRORES CRÍTICOS (deben corregirse):");
      errors.forEach((e) => console.log(e));
      console.log();
      process.exit(1);
    }

    console.log("🎉 Validación completada exitosamente!\n");
    return true;
  } catch (error) {
    console.error("❌ Error al leer/parsear products.json:", error.message);
    process.exit(1);
  }
}

// Ejecutar validación
validateI18nStructure();
