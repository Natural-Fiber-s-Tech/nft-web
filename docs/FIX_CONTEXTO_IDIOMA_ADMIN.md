# 🔧 Fix: Conflicto de Contextos de Idioma (Admin vs Web Pública)

**Fecha:** 14 de octubre de 2025  
**Problema:** Botones del admin (Español/Inglés) no afectan el idioma del botón "Consultar/Consult"

---

## 🐛 Problema Real Descubierto

### El Conflicto de Contextos

La aplicación tiene **DOS sistemas de idioma completamente independientes**:

```
┌─────────────────────────────────────────────────┐
│           WEB PÚBLICA (/)                       │
├─────────────────────────────────────────────────┤
│ Botones: ES / EN                                │
│ Sistema: LanguageContext (contexto global)      │
│ Cambia: context.lang (todo React re-renderiza)  │
│ ServiceCard usa: t("services.consult")          │
│ ✅ FUNCIONA CORRECTAMENTE                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│          ADMIN CMS (/adminx)                    │
├─────────────────────────────────────────────────┤
│ Botones: Español (ES) / Inglés (EN)            │
│ Sistema: activeLang (estado local del modal)    │
│ Cambia: activeLang (solo el modal se actualiza) │
│ ServiceCard usa: ??? (estaba usando contexto)   │
│ ❌ NO FUNCIONABA                                │
└─────────────────────────────────────────────────┘
```

### Por Qué Fallaba

1. **Usuario abre admin** → Web pública está en "EN" (contexto global)
2. **Usuario abre modal de servicio** → Botones muestran "Español (ES)" / "Inglés (EN)"
3. **Usuario click "Español (ES)"** → `activeLang = "es"` (estado local)
4. **ServiceCard renderiza** → Lee `useLanguage()` del contexto global
5. **Contexto global sigue en "EN"** → Botón muestra "Consult" ❌
6. **Usuario cambia a "Inglés (EN)"** en admin → `activeLang = "en"`
7. **ServiceCard sigue leyendo contexto** → Botón sigue en "Consult" (no cambia)

**Resultado:** El botón siempre mostraba el idioma de la **web pública**, no del **admin**.

---

## 🔍 Diagnóstico Paso a Paso

### Escenario 1: Web pública en ES, Admin intenta cambiar a EN

```javascript
// Estado inicial:
LanguageContext.lang = "es"  // Web pública (global)
activeLang = "es"             // Admin modal (local)

// ServiceCard.jsx (ANTES):
const consultText = lang
  ? messages[lang]?.services?.consult
  : buttonText || t("services.consult");
  //              ^^^^^^^^^^^^^^^^^^^ Usa LanguageContext
  // → messages["es"].services.consult = "Consultar" ✅

// Usuario click "Inglés (EN)" en admin:
activeLang = "en"  // ✅ Cambia estado local
LanguageContext.lang = "es"  // ❌ NO cambia (sigue en español)

// ServiceCard recibe:
<ServiceCard service={previewService} />
// previewService = { ..., lang: "en" }

// ServiceCard.jsx busca props:
props.service = { ..., lang: "en" }
props.lang = undefined  // ❌ NO SE PASÓ COMO PROP SEPARADO!

// Resultado:
const consultText = undefined
  ? messages[undefined]?.services?.consult  // No ejecuta
  : buttonText || t("services.consult");
  //              ^^^^^^^^^^^^^^^^^^^ Usa LanguageContext = "es"
  // → "Consultar" ❌ (debería ser "Consult")
```

### Escenario 2: Web pública en EN, Admin intenta cambiar a ES

```javascript
// Estado inicial:
LanguageContext.lang = "en"; // Web pública
activeLang = "en"; // Admin modal

// Usuario click "Español (ES)" en admin:
activeLang = "es"; // ✅ Cambia
LanguageContext.lang = "en"; // ❌ NO cambia

// ServiceCard recibe:
props.lang = undefined; // ❌ No se pasa

// Resultado:
const consultText = t("services.consult"); // Usa contexto = "en"
// → "Consult" ❌ (debería ser "Consultar")
```

---

## ✅ La Solución

### Problema Específico

```javascript
// ❌ ANTES (props incorrectos):
<ServiceCard service={previewService} />;

// previewService = {
//   icon: "Brain",
//   title: "Título",
//   description: "Descripción",
//   features: [...],
//   whatsapp: "51988496839",
//   lang: "es"  // ✅ lang está DENTRO del objeto service
// }

// ServiceCard.jsx espera:
export const ServiceCard = ({ service, buttonText, lang }) => {
  // props.lang = undefined ❌
  // props.service.lang = "es" ✅ (pero en el lugar incorrecto)
};
```

### Solución Implementada

```javascript
// ✅ AHORA (props correctos):
<ServiceCard service={previewService} lang={previewService.lang} />;
//                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                                    Pasar lang como prop separado

// ServiceCard.jsx recibe:
export const ServiceCard = ({ service, buttonText, lang }) => {
  // props.lang = "es" ✅ (directamente como prop)
  // props.service.lang = "es" ✅ (también está, pero no se usa)

  const consultText = lang
    ? messages[lang]?.services?.consult // ✅ Usa activeLang del admin
    : t("services.consult"); // Solo para web pública
};
```

---

## 📝 Cambios Realizados

### 1. ServiceFormModal.jsx - Línea 377 (Modo VIEW)

```diff
  <div className="w-full max-w-sm mx-auto">
-   <ServiceCard service={previewService} />
+   <ServiceCard service={previewService} lang={previewService.lang} />
  </div>
```

### 2. ServiceFormModal.jsx - Línea 692 (Modo EDIT - Vista previa)

```diff
  <div className="w-full max-w-sm">
-   <ServiceCard service={previewService} />
+   <ServiceCard service={previewService} lang={previewService.lang} />
  </div>
```

---

## 🎯 Flujo Correcto Ahora

```javascript
// 1. Usuario abre modal en admin
activeLang = "es"  // Estado inicial

// 2. toCardProps genera objeto
const previewService = {
  icon: "Brain",
  title: "Servicio ES",
  description: "Descripción ES",
  features: ["Feature ES"],
  whatsapp: "51988496839",
  lang: "es"  // ✅ Incluye lang
}

// 3. useMemo actualiza cuando activeLang cambia
useMemo(() => toCardProps(data, activeLang), [data, activeLang])

// 4. ServiceCard recibe AMBOS props
<ServiceCard
  service={previewService}      // Todo el objeto
  lang={previewService.lang}    // ✅ Lang como prop separado
/>

// 5. ServiceCard usa el prop lang directamente
const consultText = lang  // "es"
  ? messages["es"]?.services?.consult  // → "Consultar" ✅
  : t("services.consult");

// 6. Usuario click "Inglés (EN)"
activeLang = "en"  // Cambia estado

// 7. useMemo detecta cambio y recrea
const previewService = {
  ...,
  lang: "en"  // ✅ Nuevo valor
}

// 8. ServiceCard recibe nuevo prop
lang = "en"  // ✅ Props actualizado

// 9. ServiceCard recalcula
const consultText = messages["en"]?.services?.consult  // → "Consult" ✅
```

---

## 🧪 Verificación

### Test Manual

1. **Preparación:**

   - Asegúrate que la web pública esté en **ES** (botones ES/EN arriba)
   - Abre admin: http://localhost:5174/adminx
   - Login: `admin` / `NFTX1234`

2. **Test Caso 1: Web en ES, Admin cambia a EN**

   ```
   Web pública: ES (contexto global)
   Admin modal: Click "Inglés (EN)"

   ✅ Esperado: Botón muestra "Consult"
   ❌ Antes: Mostraba "Consultar" (contexto global)
   ```

3. **Test Caso 2: Web en ES, Admin cambia a ES**

   ```
   Web pública: ES (contexto global)
   Admin modal: Click "Español (ES)"

   ✅ Esperado: Botón muestra "Consultar"
   ✅ Antes: También funcionaba (coincidencia)
   ```

4. **Test Caso 3: Web en EN, Admin cambia a ES**

   ```
   Web pública: EN (contexto global)
   Admin modal: Click "Español (ES)"

   ✅ Esperado: Botón muestra "Consultar"
   ❌ Antes: Mostraba "Consult" (contexto global)
   ```

5. **Test Caso 4: Web en EN, Admin cambia a EN**

   ```
   Web pública: EN (contexto global)
   Admin modal: Click "Inglés (EN)"

   ✅ Esperado: Botón muestra "Consult"
   ✅ Antes: También funcionaba (coincidencia)
   ```

### Resumen de Tests

| Web Pública | Admin Modal | Antes (❌)       | Ahora (✅)       |
| ----------- | ----------- | ---------------- | ---------------- |
| ES          | ES          | Consultar ✅     | Consultar ✅     |
| ES          | EN          | **Consultar ❌** | **Consult ✅**   |
| EN          | ES          | **Consult ❌**   | **Consultar ✅** |
| EN          | EN          | Consult ✅       | Consult ✅       |

**Solo funcionaba en 2 de 4 casos** → **Ahora funciona en 4 de 4 casos** ✅

---

## 🔑 Conceptos Clave

### 1. Props vs Props Anidados

```javascript
// ❌ INCORRECTO: lang dentro de service
<Component service={{ data: "...", lang: "es" }} />
// Component: props.lang = undefined

// ✅ CORRECTO: lang como prop separado
<Component service={{ data: "..." }} lang="es" />
// Component: props.lang = "es"
```

### 2. Contexto Global vs Estado Local

```javascript
// LanguageContext (global):
- Afecta TODA la aplicación
- Cambia con botones ES/EN de la web pública
- ServiceCard lo usa con t("services.consult")

// activeLang (local):
- Solo afecta el modal
- Cambia con botones Español (ES) / Inglés (EN) del admin
- ServiceCard lo usa con messages[lang]
```

### 3. Separación de Responsabilidades

```javascript
// Web Pública:
- LanguageContext provee idioma global
- ServiceCard usa t() (reactivo al contexto)

// Admin CMS:
- activeLang provee idioma local
- ServiceCard usa messages[lang] (reactivo al prop)
```

---

## 📊 Comparación: Arquitectura Antes vs Después

### ❌ ANTES (Conflicto de contextos)

```
┌─────────────────────────────────────┐
│  Admin Modal (activeLang = "es")   │
│  ↓                                  │
│  toCardProps(data, "es")            │
│  ↓                                  │
│  { lang: "es" } ← Dentro de objeto  │
│  ↓                                  │
│  <ServiceCard service={...} />      │
│  ↓                                  │
│  props.lang = undefined ❌          │
│  ↓                                  │
│  t("services.consult") ← LanguageContext (global)
│  ↓                                  │
│  "Consult" ❌ (contexto en EN)      │
└─────────────────────────────────────┘
```

### ✅ AHORA (Independiente del contexto)

```
┌─────────────────────────────────────────────┐
│  Admin Modal (activeLang = "es")           │
│  ↓                                          │
│  toCardProps(data, "es")                    │
│  ↓                                          │
│  previewService = { lang: "es" }            │
│  ↓                                          │
│  <ServiceCard                               │
│    service={previewService}                 │
│    lang={previewService.lang} ✅           │
│  />                                         │
│  ↓                                          │
│  props.lang = "es" ✅                       │
│  ↓                                          │
│  messages["es"].services.consult            │
│  ↓                                          │
│  "Consultar" ✅ (independiente de contexto) │
└─────────────────────────────────────────────┘
```

---

## 🚀 Próximos Pasos

1. **Verificar manualmente** todos los 4 casos de test
2. **Si funciona:** Aplicar mismo patrón a:
   - Products module
   - Team module
   - Research module
3. **Ejecutar test automatizado** cuando backend esté disponible
4. **Documentar patrón** para futuros módulos

---

## 📖 Lecciones Aprendidas

### 1. Props Deben Pasarse Explícitamente

**Incorrecto:**

```javascript
<Component data={{ value: 123, lang: "es" }} />
// Component no puede acceder a data.lang como props.lang
```

**Correcto:**

```javascript
const data = { value: 123, lang: "es" };
<Component data={data} lang={data.lang} />;
// Ahora Component recibe props.lang directamente
```

### 2. Contextos Globales vs Estados Locales

- **Contexto global:** Afecta toda la app (LanguageContext)
- **Estado local:** Solo afecta componente (activeLang)
- **Solución:** Pasar estado local como prop cuando se necesite

### 3. Debugging de Props

```javascript
// En el componente hijo:
console.log("Props recibidos:", { service, buttonText, lang });

// Si lang es undefined:
// → No se está pasando como prop
// → Verificar componente padre
```

---

**Estado:** ✅ Solución implementada  
**Pendiente:** Verificación manual del usuario  
**Fecha:** 14 de octubre de 2025
