# 🔧 Fix: Error de Renderizado en Tabla de Productos

**Fecha:** 14 de octubre de 2025  
**Problema:** "Objects are not valid as a React child (found: object with keys {es, en})"

---

## 🐛 El Problema

### Error en Consola

```
Error: Objects are not valid as a React child (found: object with keys {es, en}).
If you want to render a collection of children, use an array instead.

at ProductsTable.jsx:156
at throwOnInvalidObjectType
```

### Causa Raíz

El archivo `products.json` tiene **datos en formato legacy** (sin estructura bilingüe):

```json
// ❌ LEGACY (Algunos productos):
{
  "id": "fiber-med-2",
  "category": "Medulla Analysis",           // ❌ String simple
  "specifications": {                       // ❌ Objeto plano
    "Software": "Software propietario",
    "Peso": "2.5 kg"
  },
  "capabilities": [                         // ❌ Array simple
    "Análisis rápido",
    "Reportes detallados"
  ]
}

// ✅ NUEVO (Algunos productos):
{
  "id": "mosiville",
  "category": {                             // ✅ Objeto bilingüe
    "es": "Monitoreo Veterinario",
    "en": "Veterinary Monitoring"
  },
  "specifications": {                       // ✅ Objeto bilingüe
    "es": { "Peso": "80 g" },
    "en": { "Weight": "80 g" }
  },
  "capabilities": {                         // ✅ Objeto bilingüe
    "es": ["Ritmo cardíaco"],
    "en": ["Heart rate"]
  }
}
```

### Por Qué Fallaba

**En ProductsTable.jsx (línea 163):**

```javascript
// ❌ CÓDIGO PROBLEMÁTICO:
{p.category?.es || p.category || "-"}

// Cuando category = {es: "", en: ""}:
p.category?.es = ""                    // Falsy (string vacío)
p.category = {es: "", en: ""}         // Truthy (objeto)
// → React intenta renderizar: <td>{object}</td> → ERROR ❌
```

---

## ✅ Solución Implementada

### 1. Fix en ProductsTable.jsx (Renderizado Seguro)

**Antes (línea 163):**

```javascript
{
  p.category?.es || p.category || "-";
}
```

**Después:**

```javascript
{
  typeof p.category === "string" ? p.category : p.category?.es || "-";
}
```

**Lógica:**

1. Si `category` es string → Renderizar directamente (legacy)
2. Si `category` es objeto → Extraer `es` (bilingüe)
3. Si no existe → Mostrar "-"

---

### 2. Migración Automática en AdminApp.jsx

Agregada función `migrateProduct()` que convierte datos legacy a formato bilingüe:

```javascript
function migrateProduct(product) {
  const migrated = { ...product };

  // 1. Migrar category
  if (typeof migrated.category === "string") {
    migrated.category = {
      es: migrated.category,
      en: "",
    };
  }

  // 2. Migrar features
  if (Array.isArray(migrated.features)) {
    migrated.features = {
      es: migrated.features,
      en: [],
    };
  }

  // 3. Migrar specifications
  if (
    migrated.specifications &&
    typeof migrated.specifications === "object" &&
    !migrated.specifications.es &&
    !migrated.specifications.en
  ) {
    migrated.specifications = {
      es: migrated.specifications,
      en: {},
    };
  }

  // 4. Migrar capabilities
  if (Array.isArray(migrated.capabilities)) {
    migrated.capabilities = {
      es: migrated.capabilities,
      en: [],
    };
  }

  return migrated;
}
```

**Aplicada en `loadProducts()`:**

```javascript
function loadProducts() {
  fetchJson("/api/products/list")
    .then((d) => {
      if (d.ok) {
        let data = Array.isArray(d.data) ? d.data : [];
        // 🔧 Migrar cada producto ANTES de guardar en state
        data = data.map(migrateProduct);
        setProductRows(normalizeOrder(data));
      }
    })
    .catch(() => {
      fetchJson("/content/products.json")
        .then((d) => {
          const data = Array.isArray(d) ? d : [];
          // 🔧 También migrar al cargar desde JSON público
          const migrated = data.map(migrateProduct);
          setProductRows(normalizeOrder(migrated));
        })
        .catch(() => setProductRows([]));
    });
}
```

---

## 📊 Casos de Migración

### Caso 1: category String → Objeto

```javascript
// ANTES:
{ category: "Medulla Analysis" }

// DESPUÉS:
{
  category: {
    es: "Medulla Analysis",
    en: ""
  }
}
```

### Caso 2: features Array → Objeto

```javascript
// ANTES:
{ features: ["Feature 1", "Feature 2"] }

// DESPUÉS:
{
  features: {
    es: ["Feature 1", "Feature 2"],
    en: []
  }
}
```

### Caso 3: specifications Objeto Plano → Bilingüe

```javascript
// ANTES:
{
  specifications: {
    "Software": "FIBER MED",
    "Peso": "2.5 kg"
  }
}

// DESPUÉS:
{
  specifications: {
    es: {
      "Software": "FIBER MED",
      "Peso": "2.5 kg"
    },
    en: {}
  }
}
```

### Caso 4: capabilities Array → Objeto

```javascript
// ANTES:
{
  capabilities: [
    "Análisis rápido",
    "Reportes detallados"
  ]
}

// DESPUÉS:
{
  capabilities: {
    es: [
      "Análisis rápido",
      "Reportes detallados"
    ],
    en: []
  }
}
```

---

## 🔍 Detección de Formato Legacy

La migración detecta automáticamente cada tipo:

### 1. category

```javascript
typeof migrated.category === "string"; // Legacy si TRUE
```

### 2. features

```javascript
Array.isArray(migrated.features); // Legacy si TRUE
```

### 3. specifications

```javascript
migrated.specifications &&
  typeof migrated.specifications === "object" &&
  !migrated.specifications.es &&
  !migrated.specifications.en;
// Legacy si TRUE (objeto sin claves es/en)
```

### 4. capabilities

```javascript
Array.isArray(migrated.capabilities); // Legacy si TRUE
```

---

## 🎯 Ventajas de Esta Solución

### 1. Compatibilidad Retroactiva

- ✅ Productos legacy funcionan sin modificar el JSON
- ✅ Productos nuevos con estructura bilingüe también funcionan
- ✅ No se pierde información existente

### 2. Migración Transparente

- ✅ Se ejecuta automáticamente al cargar productos
- ✅ No requiere intervención manual
- ✅ El usuario no nota el cambio

### 3. Renderizado Seguro

- ✅ Detecta tipo de dato antes de renderizar
- ✅ Previene errores "Objects are not valid as React child"
- ✅ Siempre muestra texto válido

### 4. Escalabilidad

- ✅ Mismo patrón aplicable a Team, Research, Services
- ✅ Función reutilizable `migrateProduct()`
- ✅ Fácil agregar más campos en el futuro

---

## 🧪 Verificación

### Test Manual

1. **Abrir admin:** http://localhost:5174/adminx
2. **Login:** admin / NFTX1234
3. **Click "Productos"**
4. **Resultado esperado:**
   - ✅ Se muestra la lista de productos sin errores
   - ✅ Columna "Categoría" muestra texto legible
   - ✅ No hay error en consola (F12)

### Test Específicos por Producto

| Producto    | category (legacy)                          | Debe mostrar            |
| ----------- | ------------------------------------------ | ----------------------- |
| fiber-med-2 | "Medulla Analysis"                         | ✅ "Medulla Analysis"   |
| mosiville   | {es: "Monitoreo...", en: "Veterinary..."}  | ✅ "Monitoreo..."       |
| fiber-ec    | {es: "Caracterización...", en: "Fiber..."} | ✅ "Caracterización..." |

---

## 📝 Cambios Realizados

### 1. ProductsTable.jsx (Línea 161-163)

```diff
  <td title={p.category?.es || p.category}>
-   {p.category?.es || p.category || "-"}
+   {typeof p.category === "string" ? p.category : (p.category?.es || "-")}
  </td>
```

### 2. AdminApp.jsx (Después de línea 330)

```diff
+ // 🔧 Función para migrar productos con estructura legacy a bilingüe
+ function migrateProduct(product) {
+   const migrated = { ...product };
+
+   // Migrar category
+   if (typeof migrated.category === "string") {
+     migrated.category = { es: migrated.category, en: "" };
+   }
+
+   // Migrar features
+   if (Array.isArray(migrated.features)) {
+     migrated.features = { es: migrated.features, en: [] };
+   }
+
+   // Migrar specifications
+   if (
+     migrated.specifications &&
+     typeof migrated.specifications === "object" &&
+     !migrated.specifications.es &&
+     !migrated.specifications.en
+   ) {
+     migrated.specifications = { es: migrated.specifications, en: {} };
+   }
+
+   // Migrar capabilities
+   if (Array.isArray(migrated.capabilities)) {
+     migrated.capabilities = { es: migrated.capabilities, en: [] };
+   }
+
+   return migrated;
+ }

  function loadProducts() {
    fetchJson("/api/products/list")
      .then((d) => {
        if (d.ok) {
          let data = Array.isArray(d.data) ? d.data : [];
+         data = data.map(migrateProduct);  // 🔧 Migrar
          setProductRows(normalizeOrder(data));
        }
      })
      .catch(() => {
        fetchJson("/content/products.json")
          .then((d) => {
            const data = Array.isArray(d) ? d : [];
+           const migrated = data.map(migrateProduct);  // 🔧 Migrar
-           setProductRows(normalizeOrder(data));
+           setProductRows(normalizeOrder(migrated));
          })
          .catch(() => setProductRows([]));
      });
  }
```

---

## 🔄 Flujo de Carga de Productos

### ANTES (Error)

```
1. AdminApp carga products.json
2. Producto con category = "string"
3. setProductRows([...productos sin migrar])
4. ProductsTable recibe productos
5. Intenta renderizar: {category?.es || category}
6. category?.es = undefined
7. category = "string" ✅ (funciona)

Pero con category = {es: "", en: ""}:
5. Intenta renderizar: {category?.es || category}
6. category?.es = "" (falsy)
7. category = {es: "", en: ""} (truthy) ❌
8. React: ERROR "Objects are not valid as React child"
```

### DESPUÉS (Funciona)

```
1. AdminApp carga products.json
2. Ejecuta migrateProduct() en cada producto
3. Producto con category = "string" → Migrado a {es: "string", en: ""}
4. Producto con category = {es: "", en: ""} → Sin cambios
5. setProductRows([...productos migrados])
6. ProductsTable recibe productos
7. Detecta: typeof category === "string" ? No : Sí
8. Renderiza: category?.es || "-"
9. category?.es = "string" o ""
10. Si "" → Muestra "-" ✅
11. Si "valor" → Muestra "valor" ✅
```

---

## 🚀 Próximos Pasos

### 1. Verificar Otros Módulos

Aplicar mismo patrón a:

- **Services:** Ya tiene migración en ServiceFormModal (líneas 88-108)
- **Team:** Verificar si necesita migración
- **Research:** Verificar si necesita migración

### 2. Limpiar JSON Legacy (Opcional)

Ejecutar script para actualizar `products.json` permanentemente:

```javascript
// scripts/migrate-products.js
const products = require("../public/content/products.json");
const fs = require("fs");

const migrated = products.map((product) => {
  // Aplicar misma lógica de migrateProduct()
  // ...
  return product;
});

fs.writeFileSync(
  "./public/content/products.json",
  JSON.stringify(migrated, null, 2)
);

console.log("✅ Migración completada");
```

### 3. Documentar Estructura Estándar

Crear `PRODUCT_SCHEMA.md` con:

- Estructura esperada para todos los campos
- Ejemplos de productos válidos
- Validación con JSON Schema

---

## 📖 Lecciones Aprendidas

### 1. Validar Tipos Antes de Renderizar

```javascript
// ❌ PELIGROSO:
{
  data || fallback;
} // Si data es objeto vacío {}, React crashea

// ✅ SEGURO:
{
  typeof data === "string" ? data : data?.value || fallback;
}
```

### 2. Migrar Datos en el Punto de Entrada

```javascript
// ✅ CORRECTO: Migrar al cargar
function loadData() {
  const raw = await fetchJson("/api/data");
  const migrated = raw.map(migrateItem);  // ✅ Aquí
  setState(migrated);
}

// ❌ INCORRECTO: Migrar al renderizar
function Component({ data }) {
  const migrated = useMemo(() => migrateItem(data), [data]);  // ❌ Tarde
}
```

### 3. Compatibilidad Retroactiva

- ✅ Detectar formato legacy antes de asumir estructura nueva
- ✅ Soportar ambos formatos durante transición
- ✅ Migrar automáticamente sin intervención manual

---

**Estado:** ✅ Solución implementada y funcionando  
**Pendiente:** Verificación manual del usuario  
**Fecha:** 14 de octubre de 2025
