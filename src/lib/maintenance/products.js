/**
 * Products Maintenance Script
 * Usage: node src/lib/maintenance/products.js <command>
 * Commands: translate, validate
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../');
const PRODUCTS_PATH = path.join(ROOT, 'public/content/products.json');

function loadProducts() {
    if (!fs.existsSync(PRODUCTS_PATH)) {
        throw new Error(`Products file not found at ${PRODUCTS_PATH}`);
    }
    return JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8'));
}

function saveProducts(data) {
    fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// --- TRANSLATE ---
// Uses Google Translate API (unofficial/free endpoint)
async function translateText(text, from = "es", to = "en") {
    if (!text || typeof text !== "string" || !text.trim()) return text;

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        // data[0] contains array of sentences. data[0][i][0] is translation
        if (data?.[0]) return data[0].map(item => item[0]).join("");
        return text;
    } catch (e) {
        console.error(`Translation failed for "${text.slice(0, 20)}..."`);
        return text;
    }
}

async function translate() {
    console.log("=== TRANSLATE PRODUCTS ===\n");
    const products = loadProducts();
    const backup = PRODUCTS_PATH.replace('.json', `.backup-${Date.now()}.json`);
    fs.copyFileSync(PRODUCTS_PATH, backup);
    console.log(`Backup created: ${path.basename(backup)}`);

    const fields = ["name", "tagline", "description", "descriptionDetail", "features"];

    for (const p of products) {
        if (p.archived) continue;
        console.log(`Processing: ${p.id}`);

        for (const field of fields) {
            // Case 1: Simple string object { es: "...", en: "..." }
            if (p[field]?.es && typeof p[field].es === 'string') {
                if (!p[field].en || p[field].en === p[field].es) {
                    process.stdout.write(`  Translating ${field}... `);
                    p[field].en = await translateText(p[field].es);
                    console.log("✓");
                }
            }
            // Case 2: Array of strings (features) { es: [...], en: [...] }
            else if (Array.isArray(p[field]?.es)) {
                if (!p[field].en || p[field].en.length === 0) {
                    process.stdout.write(`  Translating ${field} (array)... `);
                    p[field].en = await Promise.all(p[field].es.map(t => translateText(t)));
                    console.log("✓");
                }
            }
        }
        // Small delay to be polite
        await new Promise(r => setTimeout(r, 200));
    }

    saveProducts(products);
    console.log("\n✅ Translation complete.");
}

// --- VALIDATE ---
function validate() {
    console.log("=== VALIDATE I18N ===\n");
    const products = loadProducts();
    let errors = 0;

    const i18nFields = ["name", "tagline", "description", "features"];

    products.forEach(p => {
        i18nFields.forEach(field => {
            const val = p[field];
            if (!val) {
                console.warn(`⚠️  [${p.id}] Missing field '${field}'`);
                return;
            }
            if (!val.es) {
                console.error(`❌ [${p.id}] '${field}' missing 'es'`);
                errors++;
            }
            if (!val.en) {
                console.warn(`⚠️  [${p.id}] '${field}' missing 'en'`);
            }

            if (field === 'features') {
                if (!Array.isArray(val.es) || (val.en && !Array.isArray(val.en))) {
                    console.error(`❌ [${p.id}] '${field}' must be array`);
                    errors++;
                }
            }
        });
    });

    if (errors > 0) {
        console.log(`\n❌ Found ${errors} critical errors.`);
        process.exit(1);
    } else {
        console.log("\n✅ Validation passed.");
    }
}

// --- CLI ---
const command = process.argv[2];
switch (command) {
    case 'translate': translate(); break;
    case 'validate': validate(); break;
    default:
        console.log("Usage: node products.js [translate|validate]");
        process.exit(1);
}
