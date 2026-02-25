const fs = require('fs');

// Leer datos
const data = JSON.parse(fs.readFileSync('public/content/research.json', 'utf8'));

console.log('=== LIMPIEZA DE DATOS ===\n');
console.log(`Total artículos antes: ${data.length}`);

// Filtrar artículos válidos
const cleanedData = data.filter((article, index) => {
  // Eliminar artículos sin ID
  if (!article.id) {
    console.log(`❌ Eliminando artículo SIN ID en índice ${index}:`);
    console.log(`   Título: ${article.title?.es || article.title}`);
    console.log(`   Slug: ${article.slug}\n`);
    return false;
  }
  
  // Eliminar duplicados (mantener solo la primera aparición)
  const firstIndex = data.findIndex(a => a.id === article.id);
  if (firstIndex !== index) {
    console.log(`❌ Eliminando DUPLICADO ID '${article.id}' en índice ${index}`);
    console.log(`   (El original está en índice ${firstIndex})`);
    console.log(`   Slug duplicado: ${article.slug}`);
    console.log(`   Slug original: ${data[firstIndex].slug}\n`);
    return false;
  }
  
  return true;
});

console.log(`\n=== RESULTADO ===`);
console.log(`Original: ${data.length} artículos`);
console.log(`Limpio: ${cleanedData.length} artículos`);
console.log(`Eliminados: ${data.length - cleanedData.length}\n`);

// Guardar datos limpios
fs.writeFileSync('public/content/research.json', JSON.stringify(cleanedData, null, 2), 'utf8');
console.log('✅ Archivo limpiado y guardado\n');

// Verificación final
const uniqueIds = new Set(cleanedData.map(a => a.id));
const uniqueSlugs = new Set(cleanedData.map(a => a.slug));

console.log('=== VERIFICACIÓN FINAL ===');
console.log(`Total artículos: ${cleanedData.length}`);
console.log(`IDs únicos: ${uniqueIds.size} ${uniqueIds.size === cleanedData.length ? '✅' : '⚠️'}`);
console.log(`Slugs únicos: ${uniqueSlugs.size} ${uniqueSlugs.size === cleanedData.length ? '✅' : '⚠️'}`);

// Contar activos/archivados
const actives = cleanedData.filter(a => !a.archived).length;
const archived = cleanedData.filter(a => a.archived).length;
console.log(`\nActivos: ${actives}`);
console.log(`Archivados: ${archived}`);
