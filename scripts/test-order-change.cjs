const fs = require("fs");

// Leer datos
const data = JSON.parse(
  fs.readFileSync("public/content/research.json", "utf8")
);

console.log("=== SIMULACIÓN DE CAMBIO DE ORDEN ===\n");
console.log(`Total artículos antes: ${data.length}`);
console.log(`Activos: ${data.filter((a) => !a.archived).length}`);
console.log(`Archivados: ${data.filter((a) => a.archived).length}\n`);

// Mostrar artículos con orden 1 y 2
const active = data
  .filter((a) => !a.archived)
  .sort((a, b) => a.order - b.order);
const article1 = active.find((a) => a.order === 1);
const article2 = active.find((a) => a.order === 2);

console.log("📌 Artículo orden 1 (ANTES):");
console.log(`   ID: ${article1?.id}`);
console.log(`   Slug: ${article1?.slug}`);
console.log(`   Título: ${article1?.title?.es || article1?.title}`);
console.log(`   Orden: ${article1?.order}\n`);

console.log("📌 Artículo orden 2 (ANTES):");
console.log(`   ID: ${article2?.id}`);
console.log(`   Slug: ${article2?.slug}`);
console.log(`   Título: ${article2?.title?.es || article2?.title}`);
console.log(`   Orden: ${article2?.order}\n`);

console.log("🔄 SIMULANDO: Cambiar artículo del orden 1 al orden 2...\n");

// Simular la lógica de upsertWithReorder
// 1. Eliminar el artículo que vamos a mover
const others = data.filter((r) => r.id !== article1.id);
console.log(`   1. Eliminado artículo (ID: ${article1.id})`);
console.log(`      Restantes: ${others.length}\n`);

// 2. Normalizar (activos consecutivos)
const normalizeOrder = (list) => {
  const arr = Array.isArray(list) ? [...list] : [];
  const actives = arr
    .filter((r) => !r.archived)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const updatedActive = actives.map((item, idx) => ({
    ...item,
    order: idx + 1,
  }));

  const archived = arr.filter((r) => r.archived);
  return [...updatedActive, ...archived];
};

const compact = normalizeOrder(others);
console.log(`   2. Normalizado (orden consecutivo)`);
console.log(`      Total: ${compact.length}\n`);

// 3. Calcular target (quiere ir a orden 2)
const activeCompact = compact.filter((x) => !x.archived);
const activeCount = activeCompact.length;
const req = 2; // Quiere orden 2
const target = Math.max(1, Math.min(req, activeCount + 1));

console.log(`   3. Target calculado: ${target}`);
console.log(`      (Min: 1, Max: ${activeCount + 1}, Solicitado: ${req})\n`);

// 4. Desplazar artículos con order >= target
const shifted = compact.map((r) => {
  if (!r.archived && Number(r.order) >= target) {
    return { ...r, order: Number(r.order) + 1 };
  }
  return r;
});

console.log(`   4. Desplazados artículos con orden >= ${target}`);
const shiftedActive = shifted
  .filter((x) => !x.archived)
  .sort((a, b) => a.order - b.order);
console.log(`      Primeros 5 órdenes después del desplazamiento:`);
shiftedActive.slice(0, 5).forEach((a) => {
  console.log(`      - Orden ${a.order}: ${a.slug.substring(0, 50)}...`);
});
console.log();

// 5. Agregar el artículo movido en la posición target
const next = [...shifted, { ...article1, archived: false, order: target }];

console.log(`   5. Agregado artículo movido en orden ${target}`);
console.log(`      Total artículos: ${next.length}\n`);

// 6. Normalizar final
const result = normalizeOrder(next);

console.log(`   6. Normalización final`);
console.log(`      Total: ${result.length}\n`);

// Mostrar resultado
const resultActive = result
  .filter((a) => !a.archived)
  .sort((a, b) => a.order - b.order);
const newArticle1 = resultActive.find((a) => a.order === 1);
const newArticle2 = resultActive.find((a) => a.order === 2);

console.log("=== RESULTADO ===\n");
console.log("📌 Artículo orden 1 (DESPUÉS):");
console.log(`   ID: ${newArticle1?.id}`);
console.log(`   Slug: ${newArticle1?.slug}`);
console.log(`   Título: ${newArticle1?.title?.es || newArticle1?.title}`);
console.log(`   Orden: ${newArticle1?.order}\n`);

console.log("📌 Artículo orden 2 (DESPUÉS):");
console.log(`   ID: ${newArticle2?.id}`);
console.log(`   Slug: ${newArticle2?.slug}`);
console.log(`   Título: ${newArticle2?.title?.es || newArticle2?.title}`);
console.log(`   Orden: ${newArticle2?.order}\n`);

// Verificar integridad
const resultIds = result.map((a) => a.id);
const uniqueIds = new Set(resultIds);
console.log("=== VERIFICACIÓN DE INTEGRIDAD ===");
console.log(`Total artículos: ${result.length}`);
console.log(
  `IDs únicos: ${uniqueIds.size} ${
    uniqueIds.size === result.length ? "✅" : "❌"
  }`
);
console.log(`Activos: ${result.filter((a) => !a.archived).length}`);
console.log(`Archivados: ${result.filter((a) => a.archived).length}`);

if (uniqueIds.size !== result.length) {
  console.log("\n❌ ERROR: Se detectaron IDs duplicados!");
} else {
  console.log("\n✅ SUCCESS: No hay duplicados, todos los IDs son únicos");
}
