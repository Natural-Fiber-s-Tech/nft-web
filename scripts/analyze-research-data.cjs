const { readFileSync } = require("fs");

const data = JSON.parse(
  readFileSync("./public/content/research.json", "utf-8")
);

console.log("=== ANÁLISIS COMPLETO ===\n");
console.log("Total artículos:", data.length);
console.log("Activos:", data.filter((a) => !a.archived).length);
console.log("Archivados:", data.filter((a) => a.archived).length);

console.log("\n=== IDs ===");
const ids = data.map((a) => a.id).filter(Boolean);
const uniqueIds = new Set(ids);
console.log("Total IDs:", ids.length);
console.log("IDs únicos:", uniqueIds.size);

if (ids.length !== uniqueIds.size) {
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  const uniqueDups = [...new Set(duplicates)];
  console.log("⚠️  IDs DUPLICADOS:", uniqueDups.length);
  uniqueDups.forEach((id) => {
    const articles = data.filter((a) => a.id === id);
    console.log(`\n  ID: ${id} (aparece ${articles.length} veces)`);
    articles.forEach((a, i) => {
      console.log(
        `    ${i + 1}. Slug: ${a.slug}, Orden: ${a.order}, Archivado: ${
          a.archived || false
        }`
      );
    });
  });
}

console.log("\n=== SLUGS ===");
const slugs = data.map((a) => a.slug);
const uniqueSlugs = new Set(slugs);
console.log("Total slugs:", slugs.length);
console.log("Slugs únicos:", uniqueSlugs.size);

if (slugs.length !== uniqueSlugs.size) {
  const dupSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  const uniqueDupSlugs = [...new Set(dupSlugs)];
  console.log("⚠️  SLUGS DUPLICADOS:", uniqueDupSlugs.length);
  uniqueDupSlugs.forEach((slug) => {
    const articles = data.filter((a) => a.slug === slug);
    console.log(`\n  Slug: ${slug} (aparece ${articles.length} veces)`);
    articles.forEach((a, i) => {
      console.log(
        `    ${i + 1}. ID: ${a.id}, Orden: ${a.order}, Archivado: ${
          a.archived || false
        }`
      );
    });
  });
}

console.log("\n=== ÓRDENES ===");
const activeArticles = data.filter((a) => !a.archived);
const orders = activeArticles.map((a) => a.order);
const uniqueOrders = new Set(orders);
console.log("Artículos activos:", activeArticles.length);
console.log("Órdenes únicos:", uniqueOrders.size);

if (orders.length !== uniqueOrders.size) {
  const dupOrders = orders.filter((o, i) => orders.indexOf(o) !== i);
  const uniqueDupOrders = [...new Set(dupOrders)];
  console.log("⚠️  ÓRDENES DUPLICADOS en activos:", uniqueDupOrders.length);
  uniqueDupOrders.forEach((order) => {
    const articles = activeArticles.filter((a) => a.order === order);
    console.log(`\n  Orden: ${order} (${articles.length} artículos)`);
    articles.forEach((a, i) => {
      console.log(`    ${i + 1}. ID: ${a.id}, Slug: ${a.slug}`);
    });
  });
}
