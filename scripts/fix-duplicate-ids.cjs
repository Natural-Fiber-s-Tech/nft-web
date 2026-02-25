const fs = require("fs");

// Leer datos
const data = JSON.parse(
  fs.readFileSync("public/content/research.json", "utf8")
);

console.log("=== CORRECCIÓN DE IDs DUPLICADOS ===\n");

// Encontrar y corregir duplicados
const idCount = {};
data.forEach((article) => {
  idCount[article.id] = (idCount[article.id] || 0) + 1;
});

const duplicateIds = Object.keys(idCount).filter((id) => idCount[id] > 1);
console.log(`IDs duplicados encontrados: ${duplicateIds.length}\n`);

duplicateIds.forEach((dupId) => {
  const articles = data.filter((a) => a.id === dupId);
  console.log(`\n📌 ID duplicado: '${dupId}'`);
  console.log(`   Apariciones: ${articles.length}`);

  articles.forEach((article, index) => {
    console.log(
      `   ${index + 1}. Slug: ${article.slug}, Orden: ${article.order}`
    );

    // Si el slug tiene "-2", actualizar el ID también
    if (article.slug.endsWith("-2") && !article.id.endsWith("-2")) {
      const newId = article.slug; // Usar el slug como nuevo ID
      console.log(`      ✏️  Actualizando ID a: '${newId}'`);
      article.id = newId;
    }
  });
});

// Guardar
fs.writeFileSync(
  "public/content/research.json",
  JSON.stringify(data, null, 2),
  "utf8"
);
console.log("\n✅ Archivo corregido y guardado\n");

// Verificación final
const uniqueIds = new Set(data.map((a) => a.id));
const uniqueSlugs = new Set(data.map((a) => a.slug));

console.log("=== VERIFICACIÓN FINAL ===");
console.log(`Total artículos: ${data.length}`);
console.log(
  `IDs únicos: ${uniqueIds.size} ${
    uniqueIds.size === data.length ? "✅" : "⚠️"
  }`
);
console.log(
  `Slugs únicos: ${uniqueSlugs.size} ${
    uniqueSlugs.size === data.length ? "✅" : "⚠️"
  }`
);
