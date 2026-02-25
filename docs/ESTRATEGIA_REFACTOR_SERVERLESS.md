# 🔥 Estrategia de Refactorización de Funciones Serverless

## 📊 Situación actual

```
FUNCIONES SERVERLESS ACTUALES:
1. api/auth.js ✅ (Ya optimizado con action-based)
2. api/services/list.js
3. api/services/save.js
4. api/products/list.js
5. api/products/save.js
6. api/team/list.js
7. api/team/save.js
8. api/research/list.js
9. api/research/save.js
10. api/upload.js
11. api/generate-product-content.js

HELPERS (NO cuentan):
- api/_lib/auth.js
- api/_lib/github.js

TOTAL: 11 funciones
LÍMITE VERCEL HOBBY: 12 funciones
MARGEN: 1 función ⚠️ (muy justo)
```

---

## 🎯 Propuestas de optimización

### ⭐ OPCIÓN 1: Unificar list + save por recurso (RECOMENDADO)

**Concepto:** Igual que hicimos con `auth.js`, fusionar operaciones relacionadas

```
ANTES (8 funciones):
api/services/list.js
api/services/save.js
api/products/list.js
api/products/save.js
api/team/list.js
api/team/save.js
api/research/list.js
api/research/save.js

DESPUÉS (4 funciones):
api/services.js     (list + save)
api/products.js     (list + save + backups + restore)
api/team.js         (list + save)
api/research.js     (list + save)

AHORRO: 4 funciones ✅
```

**Ventajas:**
- ✅ Reduce de 11 a 7 funciones (margen de 5)
- ✅ Código centralizado por recurso
- ✅ Fácil de debuggear (cada recurso en su archivo)
- ✅ Mantiene separación de responsabilidades

**Ejemplo de implementación:**

```javascript
// api/services.js
const { requireAuth } = require('./_lib/auth');
const { getContentShaAndText, putContent } = require('./_lib/github');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  // Determinar operación según método y path
  const operation = (() => {
    if (req.method === 'GET') return 'list';
    if (req.method === 'POST') return 'save';
    return 'unknown';
  })();

  try {
    // LIST: GET /api/services
    if (operation === 'list') {
      // ✅ No requiere auth en modo dev (público puede leer)
      const { content, sha } = await getContentShaAndText('public/content/services.json');
      return res.end(JSON.stringify({
        ok: true,
        sha,
        data: JSON.parse(content || '[]')
      }));
    }

    // SAVE: POST /api/services
    if (operation === 'save') {
      // ✅ Requiere autenticación
      const user = requireAuth(req);
      if (!user) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ ok: false, error: 'unauthorized' }));
      }

      const body = await readBody(req);
      const data = body.data || [];
      
      await putContent(
        'public/content/services.json',
        JSON.stringify(data, null, 2),
        body.message || 'Update services from CMS'
      );

      return res.end(JSON.stringify({ ok: true }));
    }

    // Método no permitido
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));

  } catch (err) {
    console.error('[api/services] error:', err.message);
    res.statusCode = 500;
    return res.end(JSON.stringify({ ok: false, error: 'server_error' }));
  }
};
```

**RESULTADO FINAL:**
```
1. api/auth.js             ✅ login/logout/me
2. api/services.js         ✅ list/save
3. api/products.js         ✅ list/save/backups/restore
4. api/team.js             ✅ list/save
5. api/research.js         ✅ list/save
6. api/upload.js           ✅ file uploads
7. api/generate-product-content.js  ✅ AI generation

TOTAL: 7 funciones
MARGEN: 5 funciones para futuras features 🚀
```

---

### 🔥 OPCIÓN 2: Super-unificación con action-based v2 (AVANZADO)

**Concepto:** Una sola función para TODOS los CRUD

```
DESPUÉS (1 función):
api/crud.js

Endpoints:
GET  /api/crud?resource=services
POST /api/crud?resource=services
GET  /api/crud?resource=products
POST /api/crud?resource=products
...

AHORRO: 7 funciones ✅
```

**Ventajas:**
- ✅ Máxima reducción (de 11 a 5 funciones)
- ✅ Lógica compartida (auth, GitHub, validación)
- ✅ Fácil agregar nuevos recursos

**Desventajas:**
- ❌ Más complejo de debuggear
- ❌ Un error afecta a todos los recursos
- ❌ Más difícil de mantener

**Ejemplo:**

```javascript
// api/crud.js (MEGA-FUNCTION)
module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const resource = url.searchParams.get('resource'); // services, products, team, research
  const operation = req.method === 'GET' ? 'list' : 'save';

  // Map de recursos a rutas
  const resourcePaths = {
    services: 'public/content/services.json',
    products: 'public/content/products.json',
    team: 'public/content/team.json',
    research: 'public/content/research.json'
  };

  const path = resourcePaths[resource];
  if (!path) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ ok: false, error: 'invalid_resource' }));
  }

  // ... lógica compartida para todos los recursos
};
```

---

### 🎨 OPCIÓN 3: Híbrida (EQUILIBRIO)

**Concepto:** Agrupar por "dominio" en lugar de por "recurso"

```
DESPUÉS (3 funciones):
api/content.js       → services, products, team, research (CRUD)
api/media.js         → upload, generate-product-content
api/auth.js          → login, logout, me

AHORRO: 5 funciones ✅
```

**Ventajas:**
- ✅ Balance entre reducción y mantenibilidad
- ✅ Agrupa responsabilidades similares

**Desventajas:**
- ❌ `api/content.js` puede ser muy grande

---

## 📋 Comparación de opciones

| Criterio | Opción 1 | Opción 2 | Opción 3 |
|----------|----------|----------|----------|
| **Funciones finales** | 7 | 5 | 4 |
| **Margen restante** | 5 | 7 | 8 |
| **Complejidad** | Baja | Alta | Media |
| **Mantenibilidad** | ✅ Alta | ❌ Baja | ⚠️ Media |
| **Debugging** | ✅ Fácil | ❌ Difícil | ⚠️ Moderado |
| **Escalabilidad** | ✅ Buena | ✅ Excelente | ⚠️ Buena |

---

## 🎯 MI RECOMENDACIÓN: OPCIÓN 1

**Por qué:**

1. **Balance perfecto** entre reducción y mantenibilidad
2. **Fácil de implementar** (patrón ya usado en `auth.js`)
3. **Debugging simple** (cada recurso en su archivo)
4. **Margen suficiente** (5 funciones libres)
5. **Evolutivo** (puedes agregar backups/restore después)

---

## 🚀 Plan de implementación (OPCIÓN 1)

### Fase 1: Refactorizar Services (ejemplo guía)
```bash
1. Crear api/services.js (fusionar list + save)
2. Probar en local con npm run dev
3. Probar endpoints:
   - GET /api/services (list)
   - POST /api/services (save)
4. Si funciona, eliminar api/services/
5. Commit: "refactor: unify services endpoints"
```

### Fase 2: Refactorizar Products
```bash
1. Crear api/products.js (list + save + backups + restore)
2. Probar todos los endpoints
3. Eliminar api/products/
4. Commit: "refactor: unify products endpoints"
```

### Fase 3: Refactorizar Team
```bash
1. Crear api/team.js
2. Probar
3. Eliminar api/team/
4. Commit: "refactor: unify team endpoints"
```

### Fase 4: Refactorizar Research
```bash
1. Crear api/research.js
2. Probar
3. Eliminar api/research/
4. Commit: "refactor: unify research endpoints"
```

### Fase 5: Deploy y verificar
```bash
1. git push
2. Vercel auto-deploy
3. Probar CMS en producción
4. Verificar count de funciones en Vercel Dashboard
```

---

## 🧪 Cómo verificar el count de funciones en Vercel

1. Ve a: https://vercel.com/XtianCarlosQ/web-nft-react-2025/settings/functions
2. Verás lista de todas las funciones deployadas
3. Cuenta las que están bajo `/api/`
4. Objetivo: ≤ 12 funciones

---

## 💡 Bonus: Futuras optimizaciones

Si en el futuro necesitas más funciones:

### Opción A: Upgrade a Vercel Pro ($20/mes)
- 100 funciones serverless
- Más RAM y tiempo de ejecución
- Analytics avanzados

### Opción B: Mover helpers fuera de api/
```bash
# Mover _lib/ fuera de api/ para que sea más explícito
src/_lib/auth.js
src/_lib/github.js

# En funciones serverless:
const { requireAuth } = require('../../src/_lib/auth');
```

### Opción C: Usar Edge Functions (más ligeras)
```javascript
// api/services.js con config para Edge
export const config = {
  runtime: 'edge', // Más rápido y no cuenta para el límite
};
```

---

## 📊 Resumen ejecutivo

| Métrica | Actual | Después OPCIÓN 1 | Mejora |
|---------|--------|-------------------|--------|
| Funciones | 11 | 7 | -36% |
| Margen | 1 | 5 | +400% |
| Archivos CRUD | 8 | 4 | -50% |
| Complejidad | Media | Baja | ✅ |

**Siguiente paso:** ¿Empezamos con Services como ejemplo guía? 🚀
