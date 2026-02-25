/**
 * Research Data Maintenance Script
 * Usage: node src/lib/maintenance/research.js <command>
 * Commands: analyze, clean, fix-ids
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../');
const RESEARCH_PATH = path.join(ROOT, 'public/content/research.json');

function loadData() {
    if (!fs.existsSync(RESEARCH_PATH)) {
        console.error(`❌ File not found: ${RESEARCH_PATH}`);
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(RESEARCH_PATH, 'utf-8'));
}

function saveData(data) {
    fs.writeFileSync(RESEARCH_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Saved to ${RESEARCH_PATH}`);
}

function analyze() {
    console.log("=== ANALYZE RESEARCH DATA ===\n");
    const data = loadData();

    console.log("Total articles:", data.length);
    console.log("Active:", data.filter((a) => !a.archived).length);
    console.log("Archived:", data.filter((a) => a.archived).length);

    const ids = data.map((a) => a.id).filter(Boolean);
    const uniqueIds = new Set(ids);

    if (ids.length !== uniqueIds.size) {
        console.log(`\n⚠️  DUPLICATE IDs: ${ids.length - uniqueIds.size}`);
        const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
        [...new Set(duplicates)].forEach(id => {
            console.log(`  - ID: ${id} (count: ${ids.filter(x => x === id).length})`);
        });
    } else {
        console.log("\n✅ No duplicate IDs found.");
    }

    const slugs = data.map((a) => a.slug);
    const uniqueSlugs = new Set(slugs);

    if (slugs.length !== uniqueSlugs.size) {
        console.log(`\n⚠️  DUPLICATE SLUGS: ${slugs.length - uniqueSlugs.size}`);
    } else {
        console.log("✅ No duplicate slugs found.");
    }
}

function clean() {
    console.log("=== CLEAN RESEARCH DATA ===\n");
    const data = loadData();
    console.log(`Before: ${data.length} articles`);

    const existsId = new Set();
    const existsSlug = new Set();

    const cleaned = data.filter((param, index) => {
        // 1. Must have ID
        if (!param.id) {
            console.log(`❌ Removing item at index ${index} (No ID)`);
            return false;
        }

        // 2. Remove duplicates
        if (existsId.has(param.id)) {
            console.log(`❌ Removing duplicate ID: ${param.id}`);
            return false;
        }
        existsId.add(param.id);

        return true;
    });

    console.log(`After: ${cleaned.length} articles`);

    if (data.length !== cleaned.length) {
        saveData(cleaned);
    } else {
        console.log("Target file already clean.");
    }
}

function fixIds() {
    console.log("=== FIX DUPLICATE IDs ===\n");
    const data = loadData();
    let modified = false;

    const idCount = {};
    data.forEach(a => { idCount[a.id] = (idCount[a.id] || 0) + 1; });

    const duplicates = Object.keys(idCount).filter(id => idCount[id] > 1);

    if (duplicates.length === 0) {
        console.log("✅ No duplicate IDs to fix.");
        return;
    }

    duplicates.forEach(dupId => {
        console.log(`Fixing duplicate ID: ${dupId}`);
        const items = data.filter(a => a.id === dupId);

        // Skip the first one, fix the rest
        items.forEach((item, idx) => {
            if (idx === 0) return; // Keep first

            // Generate new ID from slug if possible, or append random
            if (item.slug && item.slug !== dupId) {
                item.id = item.slug;
                console.log(`  -> Updated to use slug: ${item.id}`);
            } else {
                item.id = `${dupId}-${idx + 1}`;
                console.log(`  -> Appended index: ${item.id}`);
            }
            modified = true;
        });
    });

    if (modified) {
        saveData(data);
    }
}

// CLI Router
const command = process.argv[2];
switch (command) {
    case 'analyze': analyze(); break;
    case 'clean': clean(); break;
    case 'fix-ids': fixIds(); break;
    default:
        console.log("Usage: node research.js [analyze|clean|fix-ids]");
        process.exit(1);
}
