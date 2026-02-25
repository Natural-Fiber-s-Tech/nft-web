# 🔧 Fix: Estructura Bilingüe en Products.json + Validación al Guardar

**Fecha:** 14 de octubre de 2025  
**Problema:** Al crear/editar productos, se guardaba con estructura legacy (no bilingüe)

---

## 🐛 El Problema

### Causa Raíz

Cuando se **creaba o editaba** un producto en el CMS admin, los datos se guardaban con **estructura incorrecta**:

```json
// ❌ GUARDADO INCORRECTO (después de editar):
{
  "id": "fiber-med-2",
  "category": "Medulla Analysis",           // ❌ String en lugar de {es, en}
  "specifications": {                       // ❌ Objeto plano sin es/en
    "Tipo": "...",
    "Peso": "..."
  },
  "capabilities": [                         // ❌ Array simple sin es/en
    "Feature 1",
    "Feature 2"
  ]
}

// ✅ ESPERADO (estructura bilingüe):
{
  "id": "fiber-med-2",
  "category": {
    "es": "Análisis de Medulación",
    "en": "Medulla Analysis"
  },
  "specifications": {
    "es": { "Tipo": "...", "Peso": "..." },
    "en": { "Type": "...", "Weight": "..." }
  },
  "capabilities": {
    "es": ["Feature 1", "Feature 2"],
    "en": ["Feature 1", "Feature 2"]
  }
}
```

### Por Qué Ocurría

La función `prepareNext()` en **ProductFormModal.jsx** (línea 722) solo validaba:

- ✅ `name`, `tagline`, `description`, `descriptionDetail` → OK
- ✅ `features` → OK
- ❌ `category` → **NO validaba**
- ❌ `technicalSheets` → **NO validaba**
- ❌ `specifications` → **NO validaba**
- ❌ `capabilities` → **NO validaba**

**Resultado:** Al guardar, estos campos se guardaban con estructura incorrecta.

---

## ✅ Solución Implementada

### 1. Limpieza Manual de products.json

Corregí **todos los productos** con estructura incorrecta:

#### Productos Corregidos:

**A. product-ytqox7:**

```json
// ANTES:
"specifications": {},
"capabilities": [],

// AHORA:
"specifications": { "es": {}, "en": {} },
"capabilities": { "es": [], "en": [] },
```

**B. fiber-med-2:**

```json
// ANTES:
"specifications": {
  "Tipo": "Equipo automático...",
  "Peso": "8 kg",
  ...
},
"capabilities": [
  "Determinar cantidad de fibras...",
  ...
],

// AHORA:
"specifications": {
  "es": {
    "Tipo": "Equipo automático...",
    "Peso": "8 kg",
    ...
  },
  "en": {
    "Type": "Automatic desktop...",
    "Weight": "8 kg",
    ...
  }
},
"capabilities": {
  "es": [
    "Determinar cantidad de fibras...",
    ...
  ],
  "en": [
    "Determine number of fibers...",
    ...
  ]
},
```

**C. product-61mbvh y product-urjq4c:**

```json
// ANTES:
"category": "",
"specifications": {},
"capabilities": [],

// AHORA:
"category": { "es": "", "en": "" },
"specifications": { "es": {}, "en": {} },
"capabilities": { "es": [], "en": [] },
```

---

### 2. Actualización de prepareNext() en ProductFormModal.jsx

Agregué **validación completa** para todos los campos bilingües:

```javascript
function prepareNext() {
  const next = { ...local };

  // 1. Normalizar campos de texto bilingües (YA EXISTÍA)
  ["name", "tagline", "description", "descriptionDetail"].forEach((k) => {
    const obj = next[k] || {};
    if (!obj.en?.trim()) obj.en = obj.es || "";
    next[k] = obj;
  });

  // 2. ✅ NUEVO: Normalizar category
  if (typeof next.category === "string") {
    next.category = { es: next.category, en: "" };
  } else if (!next.category || typeof next.category !== "object") {
    next.category = { es: "", en: "" };
  }

  // 3. ✅ NUEVO: Normalizar technicalSheets
  if (typeof next.technicalSheets === "string") {
    next.technicalSheets = { es: next.technicalSheets, en: "" };
  } else if (
    !next.technicalSheets ||
    typeof next.technicalSheets !== "object"
  ) {
    next.technicalSheets = { es: "", en: "" };
  }

  // 4. ✅ MEJORADO: Normalizar features (ahora detecta array legacy)
  if (Array.isArray(next.features)) {
    next.features = { es: next.features.filter(Boolean), en: [] };
  } else {
    next.features = {
      es: (next.features?.es || [])
        .map((s) => (s || "").trim())
        .filter(Boolean),
      en: (next.features?.en || [])
        .map((s) => (s || "").trim())
        .filter(Boolean),
    };
  }

  // 5. ✅ NUEVO: Normalizar specifications
  if (
    next.specifications &&
    typeof next.specifications === "object" &&
    !next.specifications.es &&
    !next.specifications.en
  ) {
    // Legacy: objeto plano → migrar a bilingüe
    next.specifications = { es: next.specifications, en: {} };
  } else if (!next.specifications || typeof next.specifications !== "object") {
    next.specifications = { es: {}, en: {} };
  }

  // 6. ✅ NUEVO: Normalizar capabilities
  if (Array.isArray(next.capabilities)) {
    next.capabilities = { es: next.capabilities.filter(Boolean), en: [] };
  } else if (!next.capabilities || typeof next.capabilities !== "object") {
    next.capabilities = { es: [], en: [] };
  }

  return next;
}
```

---

## 📊 Casos de Validación

### Caso 1: category String → Objeto

```javascript
// INPUT:
{ category: "Medulla Analysis" }

// OUTPUT:
{
  category: {
    es: "Medulla Analysis",
    en: ""
  }
}
```

### Caso 2: category Vacío → Objeto Vacío

```javascript
// INPUT:
{ category: "" }
// o
{ category: undefined }

// OUTPUT:
{
  category: {
    es: "",
    en: ""
  }
}
```

### Caso 3: features Array → Objeto

```javascript
// INPUT:
{ features: ["Feature 1", "Feature 2"] }

// OUTPUT:
{
  features: {
    es: ["Feature 1", "Feature 2"],
    en: []
  }
}
```

### Caso 4: specifications Objeto Plano → Bilingüe

```javascript
// INPUT:
{
  specifications: {
    "Peso": "8 kg",
    "Tipo": "Portátil"
  }
}

// OUTPUT:
{
  specifications: {
    es: {
      "Peso": "8 kg",
      "Tipo": "Portátil"
    },
    en: {}
  }
}
```

### Caso 5: capabilities Array → Objeto

```javascript
// INPUT:
{
  capabilities: [
    "Análisis rápido",
    "Reportes automáticos"
  ]
}

// OUTPUT:
{
  capabilities: {
    es: [
      "Análisis rápido",
      "Reportes automáticos"
    ],
    en: []
  }
}
```

### Caso 6: Datos ya Bilingües → Sin Cambios

```javascript
// INPUT:
{
  category: { es: "Monitoreo", en: "Monitoring" },
  specifications: {
    es: { "Peso": "80 g" },
    en: { "Weight": "80 g" }
  },
  capabilities: {
    es: ["Monitoreo remoto"],
    en: ["Remote monitoring"]
  }
}

// OUTPUT:
// ✅ Sin cambios (ya tiene estructura correcta)
```

---

## 🔍 Detección de Estructura Legacy

### category

```javascript
typeof next.category === "string"; // Legacy si TRUE
```

### technicalSheets

```javascript
typeof next.technicalSheets === "string"; // Legacy si TRUE
```

### features

```javascript
Array.isArray(next.features); // Legacy si TRUE
```

### specifications

```javascript
next.specifications &&
  typeof next.specifications === "object" &&
  !next.specifications.es &&
  !next.specifications.en;
// Legacy si TRUE (objeto sin claves es/en)
```

### capabilities

```javascript
Array.isArray(next.capabilities); // Legacy si TRUE
```

---

## 🎯 Flujo de Guardado Correcto

### ANTES (Estructura se corrompía)

```
1. Usuario edita producto en admin
2. Click "Guardar"
3. prepareNext() ejecuta
   ✅ Valida: name, tagline, description, features
   ❌ NO valida: category, specifications, capabilities
4. Guarda con estructura incorrecta
5. products.json se corrompe ❌
```

### AHORA (Estructura se preserva)

```
1. Usuario edita producto en admin
2. Click "Guardar"
3. prepareNext() ejecuta
   ✅ Valida: name, tagline, description, features
   ✅ NUEVO: Valida category → {es, en}
   ✅ NUEVO: Valida technicalSheets → {es, en}
   ✅ NUEVO: Valida specifications → {es: {}, en: {}}
   ✅ NUEVO: Valida capabilities → {es: [], en: []}
4. Guarda con estructura bilingüe correcta ✅
5. products.json se mantiene consistente ✅
```

---

## 🧪 Verificación

### Test Manual - Crear Producto

1. **Abrir admin:** http://localhost:5174/adminx
2. **Login:** admin / NFTX1234
3. **Click "Productos" → "Nuevo Producto"**
4. **Llenar formulario:**
   - Nombre: "Test Product"
   - Categoría: "Test Category"
   - Features: ["Feature 1", "Feature 2"]
   - Specifications: Agregar algunos campos
   - Capabilities: Agregar algunos items
5. **Click "Guardar"**
6. **Verificar en products.json:**
   ```json
   {
     "id": "product-xxx",
     "name": { "es": "Test Product", "en": "Test Product" },
     "category": { "es": "Test Category", "en": "" },
     "features": { "es": ["Feature 1", "Feature 2"], "en": [] },
     "specifications": { "es": {...}, "en": {} },
     "capabilities": { "es": [...], "en": [] }
   }
   ```
   ✅ **TODAS las estructuras deben ser bilingües**

### Test Manual - Editar Producto Existente

1. **Abrir admin → Productos**
2. **Click "Editar" en cualquier producto**
3. **Modificar algún campo** (ej: description)
4. **Click "Guardar"**
5. **Verificar en products.json:**
   - ✅ category sigue siendo `{es, en}`
   - ✅ specifications sigue siendo `{es: {}, en: {}}`
   - ✅ capabilities sigue siendo `{es: [], en: []}`
   - ✅ NO se convierten a string/array simple

---

## 📝 Cambios Realizados

### 1. products.json (Limpieza Manual)

**Productos corregidos:**

- `product-ytqox7` (línea 919-940)
- `fiber-med-2` (línea 941-1063)
- `product-61mbvh` (línea 1064-1108)
- `product-urjq4c` (línea 1109-1165)

**Campos corregidos:**

```diff
- "category": "",
+ "category": { "es": "", "en": "" },

- "specifications": {},
+ "specifications": { "es": {}, "en": {} },

- "capabilities": [],
+ "capabilities": { "es": [], "en": [] },

- "specifications": { "Tipo": "...", "Peso": "..." },
+ "specifications": {
+   "es": { "Tipo": "...", "Peso": "..." },
+   "en": { "Type": "...", "Weight": "..." }
+ },

- "capabilities": ["Feature 1", "Feature 2"],
+ "capabilities": {
+   "es": ["Feature 1", "Feature 2"],
+   "en": ["Feature 1", "Feature 2"]
+ },
```

### 2. ProductFormModal.jsx (Validación al Guardar)

**Líneas 722-796:**

```diff
  function prepareNext() {
    const next = { ...local };

    // Normalizar campos de texto (ya existía)
    ["name", "tagline", "description", "descriptionDetail"].forEach((k) => {
      const obj = next[k] || {};
      if (!obj.en?.trim()) obj.en = obj.es || "";
      next[k] = obj;
    });

+   // ✅ NUEVO: Normalizar category
+   if (typeof next.category === "string") {
+     next.category = { es: next.category, en: "" };
+   } else if (!next.category || typeof next.category !== "object") {
+     next.category = { es: "", en: "" };
+   }
+
+   // ✅ NUEVO: Normalizar technicalSheets
+   if (typeof next.technicalSheets === "string") {
+     next.technicalSheets = { es: next.technicalSheets, en: "" };
+   } else if (!next.technicalSheets || typeof next.technicalSheets !== "object") {
+     next.technicalSheets = { es: "", en: "" };
+   }

-   // Compact features (versión simple)
-   next.features = {
-     es: (next.features?.es || []).map(...).filter(Boolean),
-     en: (next.features?.en || []).map(...).filter(Boolean),
-   };
+   // ✅ MEJORADO: Normalizar features (detecta array legacy)
+   if (Array.isArray(next.features)) {
+     next.features = { es: next.features.filter(Boolean), en: [] };
+   } else {
+     next.features = {
+       es: (next.features?.es || []).map(...).filter(Boolean),
+       en: (next.features?.en || []).map(...).filter(Boolean),
+     };
+   }
+
+   // ✅ NUEVO: Normalizar specifications
+   if (
+     next.specifications &&
+     typeof next.specifications === "object" &&
+     !next.specifications.es &&
+     !next.specifications.en
+   ) {
+     next.specifications = { es: next.specifications, en: {} };
+   } else if (!next.specifications || typeof next.specifications !== "object") {
+     next.specifications = { es: {}, en: {} };
+   }
+
+   // ✅ NUEVO: Normalizar capabilities
+   if (Array.isArray(next.capabilities)) {
+     next.capabilities = { es: next.capabilities.filter(Boolean), en: [] };
+   } else if (!next.capabilities || typeof next.capabilities !== "object") {
+     next.capabilities = { es: [], en: [] };
+   }

    return next;
  }
```

---

## 🚀 Próximos Pasos

### 1. Aplicar Mismo Patrón a Otros Módulos

- **Services:** Verificar si `ServiceFormModal` tiene mismo problema
- **Team:** Verificar normalización al guardar
- **Research:** Verificar normalización al guardar

### 2. Script de Validación (Opcional)

Crear script que valide estructura de todos los productos:

```javascript
// scripts/validate-products-structure.js
const products = require("../public/content/products.json");

products.forEach((product) => {
  // Validar category
  if (
    typeof product.category !== "object" ||
    !product.category.hasOwnProperty("es")
  ) {
    console.error(`❌ ${product.id}: category estructura incorrecta`);
  }

  // Validar specifications
  if (!product.specifications?.es || !product.specifications?.en) {
    console.error(`❌ ${product.id}: specifications estructura incorrecta`);
  }

  // Validar capabilities
  if (
    !Array.isArray(product.capabilities?.es) ||
    !Array.isArray(product.capabilities?.en)
  ) {
    console.error(`❌ ${product.id}: capabilities estructura incorrecta`);
  }
});

console.log("✅ Validación completada");
```

### 3. Documentar Esquema Estándar

Crear `PRODUCT_SCHEMA.md` con:

- Estructura completa esperada
- Validación con JSON Schema
- Ejemplos de productos válidos

---

## 📖 Lecciones Aprendidas

### 1. Validar Datos Antes de Guardar

```javascript
// ❌ PELIGROSO: Guardar sin validar
onSave?.(local);

// ✅ SEGURO: Normalizar antes de guardar
function prepareNext() {
  const next = { ...local };
  // Validar y normalizar TODOS los campos
  return next;
}
onSave?.(prepareNext());
```

### 2. Migración en Múltiples Capas

- **Capa 1:** Carga (AdminApp.jsx) → Migrar al cargar ✅
- **Capa 2:** Modal (ProductFormModal.jsx) → Migrar al abrir ✅
- **Capa 3:** Guardado → **Validar antes de guardar** ✅ (NUEVA)

### 3. Estructura Consistente

Todos los campos bilingües deben seguir el mismo patrón:

- Textos: `{es: "...", en: "..."}`
- Arrays: `{es: [...], en: [...]}`
- Objetos: `{es: {...}, en: {...}}`

---

**Estado:** ✅ products.json limpio + Validación implementada  
**Pendiente:** Testing manual por usuario  
**Fecha:** 14 de octubre de 2025
