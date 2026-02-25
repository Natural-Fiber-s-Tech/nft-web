# 🛠️ Scripts de Utilidades - FibersTech

Esta carpeta contiene scripts de mantenimiento, análisis y automatización para el proyecto.

---

## 📋 Índice de Scripts

### 🔍 **Análisis y Auditoría**

#### `analyze-research-data.cjs`
**Propósito:** Auditar el archivo `research.json` para detectar problemas de integridad.

**Detecta:**
- ✅ IDs duplicados
- ✅ Slugs duplicados
- ✅ Órdenes duplicados en artículos activos
- ✅ Estadísticas generales (total activos/archivados)

**Uso:**
```bash
node scripts/analyze-research-data.cjs
```

**Output:**
```
📊 ANÁLISIS DE research.json
Total artículos: 12
Activos: 10
Archivados: 2

⚠️ Problemas encontrados:
- 2 IDs duplicados
- 1 slug duplicado
```

---

#### `report-publications.mjs`
**Propósito:** Generar reporte de publicaciones científicas.

**Genera:**
- 📄 CSV con todas las publicaciones
- 📝 Markdown con estadísticas
- 📊 Análisis por año/revista

**Uso:**
```bash
node scripts/report-publications.mjs
```

**Output:** `reports/publications_report.csv` y `reports/publications_report.md`

---

### 🧹 **Limpieza y Corrección**

#### `clean-research-data.cjs`
**Propósito:** Limpiar automáticamente `research.json` eliminando duplicados y artículos inválidos.

**Acciones:**
- ❌ Elimina artículos sin ID
- ❌ Elimina duplicados (mantiene primero encontrado)
- ✅ Verifica integridad final
- 💾 Guarda archivo limpio

**Uso:**
```bash
node scripts/clean-research-data.cjs
```

**⚠️ PRECAUCIÓN:** Modifica `public/content/research.json` directamente.

---

#### `fix-duplicate-ids.cjs`
**Propósito:** Corregir IDs duplicados basándose en sufijos de slugs.

**Lógica:**
- Si slug termina en "-2" pero ID no coincide → Actualiza ID para que coincida
- Ejemplo: `slug: "nft-sensor-2"` → `id: "nft-sensor-2"`

**Uso:**
```bash
node scripts/fix-duplicate-ids.cjs
```

---

### 🧪 **Testing y Validación**

#### `test-order-change.cjs`
**Propósito:** Simular reordenamiento de artículos sin modificar archivos reales.

**Simula:**
1. Estado inicial (orden 1 y 2)
2. Mover artículo del orden 1 al 2
3. Normalización de órdenes
4. Detección de duplicados

**Uso:**
```bash
node scripts/test-order-change.cjs
```

**Output:** Log paso a paso del proceso de reordenamiento.

---

#### `verify_cv_changes.cjs`
**Propósito:** Verificar que el sistema de CVs del equipo esté correctamente implementado.

**Verifica:**
- ✅ Campo `src_cv_pdf` en `team.json`
- ✅ Botones "View CV" en `Team.jsx`
- ✅ Rutas de upload en `TeamFormModal.jsx`
- ✅ Preservación de campos en `normalizeTeamMember()`

**Uso:**
```bash
node scripts/verify_cv_changes.cjs
```

**Output:** Reporte JSON con status de cada verificación.

---

#### `validate-i18n.js`
**Propósito:** Validar que las traducciones estén completas en español e inglés.

**Verifica:**
- ✅ Todas las claves existen en ambos idiomas
- ✅ No hay traducciones vacías
- ✅ Estructura de objetos coincide

**Uso:**
```bash
node scripts/validate-i18n.js
```

---

#### `test-auth.cjs` / `test-auth.js`
**Propósito:** Probar el sistema de autenticación del panel admin.

**Prueba:**
- ✅ Login con credenciales válidas
- ✅ Login con credenciales inválidas
- ✅ Verificación de sesión
- ✅ Logout

**Uso:**
```bash
node scripts/test-auth.cjs
# o
node scripts/test-auth.js
```

---

### 🌍 **Traducción y i18n**

#### `translate-products.mjs`
**Propósito:** Traducir productos de español a inglés usando API de traducción.

**Traduce:**
- 📝 Nombres de productos
- 📝 Descripciones
- 📝 Características
- 📝 Categorías

**Uso:**
```bash
node scripts/translate-products.mjs
```

**Requiere:** API key de servicio de traducción (DeepL, Google Translate, etc.)

---

#### `enrich-publications.mjs`
**Propósito:** Enriquecer publicaciones científicas obteniendo metadata desde DOI.

**Obtiene:**
- 📄 Título completo
- 👥 Autores
- 📚 Revista
- 📅 Año de publicación
- 🔗 URL oficial

**Uso:**
```bash
node scripts/enrich-publications.mjs
```

**API usada:** CrossRef, PubMed u otra API de publicaciones científicas.

---

### 📢 **Notificaciones**

#### `notify-complete.js`
**Propósito:** Enviar notificación cuando una tarea se completa.

**Envía:**
- 📱 Mensaje vía WhatsApp (u otro canal)
- ✅ Reporte de tarea completada
- 📊 Estadísticas de cambios

**Uso:**
```bash
node scripts/notify-complete.js
```

**Requiere:** Configuración de API de notificaciones (Twilio, WhatsApp Business, etc.)

---

## 🔧 Configuración

### Requisitos Generales:
```bash
Node.js >= 18.0.0
```

### Variables de Entorno:
Algunos scripts requieren variables de entorno. Crear `.env` en la raíz del proyecto:

```bash
# Traducción
DEEPL_API_KEY=tu_api_key_aqui
GOOGLE_TRANSLATE_API_KEY=tu_api_key_aqui

# Notificaciones
TWILIO_ACCOUNT_SID=tu_sid
TWILIO_AUTH_TOKEN=tu_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Publicaciones científicas
CROSSREF_EMAIL=tu_email@dominio.com
```

---

## 📚 Categorización de Scripts

### **Uso Regular (Ejecutar frecuentemente):**
- `validate-i18n.js` - Antes de cada deploy
- `test-auth.cjs` - Después de cambios en autenticación
- `analyze-research-data.cjs` - Después de ediciones en panel admin

### **Mantenimiento Ocasional:**
- `clean-research-data.cjs` - Solo cuando hay duplicados
- `fix-duplicate-ids.cjs` - Solo cuando análisis detecta problemas
- `verify_cv_changes.cjs` - Después de cambios en sistema de CVs

### **Herramientas de Desarrollo:**
- `test-order-change.cjs` - Testing de lógica de reordenamiento
- `translate-products.mjs` - Una vez por producto nuevo
- `enrich-publications.mjs` - Una vez por publicación nueva
- `report-publications.mjs` - Cuando necesites estadísticas

### **Utilidades Automáticas:**
- `notify-complete.js` - Llamado por otros scripts/CI/CD

---

## 🚨 Scripts Peligrosos (Modifican Datos)

⚠️ **ESTOS SCRIPTS MODIFICAN ARCHIVOS DIRECTAMENTE:**

- `clean-research-data.cjs` - Modifica `public/content/research.json`
- `fix-duplicate-ids.cjs` - Modifica `public/content/research.json`
- `translate-products.mjs` - Modifica `public/content/products.json`
- `enrich-publications.mjs` - Modifica `public/content/research.json`

**Recomendación:** Hacer commit antes de ejecutarlos para poder revertir cambios.

---

## 📝 Buenas Prácticas

### Antes de ejecutar scripts que modifican datos:

```bash
# 1. Ver estado actual
git status

# 2. Hacer commit de cambios pendientes
git add .
git commit -m "Cambios antes de ejecutar scripts"

# 3. Ejecutar script
node scripts/clean-research-data.cjs

# 4. Si algo sale mal, revertir
git checkout public/content/research.json
```

---

## 🔄 Integración con CI/CD

Algunos scripts pueden integrarse en GitHub Actions:

```yaml
# .github/workflows/validate.yml
name: Validate Data
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: node scripts/validate-i18n.js
      - run: node scripts/analyze-research-data.cjs
```

---

## 📞 Soporte

Si algún script falla:
1. Verificar versión de Node.js: `node --version`
2. Revisar logs de error
3. Verificar que los archivos de datos existan
4. Contactar al equipo de desarrollo

---

_Última actualización: Febrero 2026_

