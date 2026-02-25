# 🚨 Instrucciones: Ejecutar Test de Servicios

**Fecha:** 14 de octubre de 2025  
**Test:** `tests/admin-services-button-language.spec.js`

---

## ⚠️ Problema Actual

El test automatizado **no puede ejecutarse** porque requiere que el **backend de autenticación** esté corriendo.

### Error del Test:

```
Error: expect(locator).toBeVisible() failed
Locator: locator('button:has-text("Servicios")')
Expected: visible
Timeout: 5000ms
```

### Causa:

El login funciona (✅), pero después del login el botón "Servicios" no aparece porque:

1. El backend `/api/auth/login` necesita estar corriendo
2. El admin necesita cargar datos desde `/api/services`, `/api/products`, etc.

---

## ✅ Solución: Ejecutar Backend y Test

### Paso 1: Iniciar Backend (Vercel Dev)

```powershell
# Terminal 1: Iniciar Vercel Dev en puerto 3000
cd C:\PROYECTOS\web_nft_react\web_nft_react_2025
vercel dev --listen 3000
```

**Esperar hasta ver:**

```
Ready! Available at http://localhost:3000
```

### Paso 2: Iniciar Frontend (Vite)

```powershell
# Terminal 2: Iniciar Vite en puerto 5174
cd C:\PROYECTOS\web_nft_react\web_nft_react_2025
npm run dev
```

**Esperar hasta ver:**

```
VITE v5.x.x  ready in XXX ms
➜  Local:   http://localhost:5174/
```

### Paso 3: Ejecutar Test

```powershell
# Terminal 3: Ejecutar test de Playwright
cd C:\PROYECTOS\web_nft_react\web_nft_react_2025

# Opción 1: Con navegador visible (headed)
npm run test:services:headed

# Opción 2: Sin navegador (headless, más rápido)
npm run test:services

# Opción 3: Modo debug (paso a paso)
npm run test:services:debug
```

---

## 🔧 Alternativa: Test Manual

Si no puedes ejecutar el backend, realiza el test **manualmente**:

### Paso 1: Abrir Admin

1. Abrir http://localhost:5174/adminx
2. **Login:**
   - Usuario: `admin`
   - Contraseña: `admin123`
3. Click en botón "Entrar"

### Paso 2: Abrir Servicio en Modo VIEW

1. Click en botón "**Servicios**"
2. Buscar cualquier servicio en la tabla
3. Click en el **ícono de ojo azul** (botón "Ver")
4. Se abre el modal con vista previa del servicio

### Paso 3: Cambiar Idioma

1. En la parte superior del modal hay 2 botones:

   - 🇪🇸 **Español (ES)** (rojo)
   - 🇬🇧 **Inglés (EN)** (gris)

2. **Click en "Español (ES)":**

   - El botón del ServiceCard debe mostrar: **"Consultar"** ✅

3. **Click en "Inglés (EN)":**

   - El botón del ServiceCard debe mostrar: **"Consult"** ✅

4. **Alternar varias veces:**
   - ES → "Consultar" ✅
   - EN → "Consult" ✅
   - ES → "Consultar" ✅

### Paso 4: Resultado Esperado

- ✅ El botón **SÍ cambia** de idioma
- ✅ No hay texto residual del otro idioma
- ✅ Funciona al alternar múltiples veces
- ✅ useMemo recrea `previewService` correctamente

### Paso 5: Si Falla

Si el botón **NO cambia** de idioma:

1. **Abrir DevTools** (F12)
2. **Pestaña Console** → Ver si hay errores
3. **Pestaña React DevTools:**

   - Buscar componente `ServiceFormModal`
   - Ver prop `previewService`
   - Ver state `activeLang`
   - Cambiar idioma → `previewService` debe cambiar

4. **Verificar código:**
   - `ServiceFormModal.jsx` línea 95-100
   - `useMemo` debe tener `[data, activeLang]` como dependencies
   - `toCardProps` debe usar `messages[lang]?.services?.consult`

---

## 📊 Checklist de Verificación Manual

| Paso | Descripción                                         | ✅/❌ |
| ---- | --------------------------------------------------- | ----- |
| 1    | Login exitoso en /adminx                            |       |
| 2    | Click en "Servicios" muestra tabla                  |       |
| 3    | Click en ícono ojo abre modal                       |       |
| 4    | Vista previa muestra ServiceCard                    |       |
| 5    | Botones ES/EN visibles en modal                     |       |
| 6    | Click "Español" → botón dice "Consultar"            |       |
| 7    | Click "Inglés" → botón dice "Consult"               |       |
| 8    | Alternar 3 veces → siempre cambia                   |       |
| 9    | Sin errores en consola                              |       |
| 10   | Comparar con web pública (/) → mismo comportamiento |       |

---

## 🐛 Debug

Si el botón NO cambia:

```javascript
// En ServiceFormModal.jsx, agregar console.log:

const previewService = useMemo(() => {
  console.log("🔍 useMemo ejecutándose:", { activeLang, data });
  return toCardProps(data, activeLang);
}, [data, activeLang]);

// Al cambiar idioma, deberías ver en consola:
// 🔍 useMemo ejecutándose: { activeLang: "es", data: {...} }
// 🔍 useMemo ejecutándose: { activeLang: "en", data: {...} }
```

---

## 📝 Resultado del Test Manual

**Fecha:** ******\_\_\_******  
**Tester:** ******\_\_\_******

**Resultado:** ☐ ✅ PASA | ☐ ❌ FALLA

**Observaciones:**

```
(Describe qué sucedió, capturas de pantalla, errores en consola, etc.)






```

---

## 🎯 Próximos Pasos

### Si el Test Pasa:

1. ✅ El bug está resuelto
2. ✅ useMemo funciona correctamente
3. ✅ Aplicar el mismo patrón a Products (20 campos)
4. ✅ Actualizar documentación

### Si el Test Falla:

1. ❌ Revisar `ServiceFormModal.jsx` líneas 85-100
2. ❌ Verificar que `toCardProps` usa parámetro `lang`
3. ❌ Verificar que `useMemo` tiene dependencies correctas
4. ❌ Verificar que `ServiceCard` recibe prop `buttonText`
5. ❌ Revisar imports de `i18n` (`messages`)

---

## 📚 Archivos Relevantes

| Archivo                                | Ubicación                              | Descripción            |
| -------------------------------------- | -------------------------------------- | ---------------------- |
| ServiceFormModal.jsx                   | `src/pages/admin/components/services/` | Modal con useMemo      |
| Services.jsx                           | `src/components/sections/`             | ServiceCard componente |
| i18n.js                                | `src/config/`                          | Traducciones           |
| useAutoTranslate.js                    | `src/pages/admin/hooks/`               | Hook de traducción     |
| admin-services-button-language.spec.js | `tests/`                               | Test automatizado      |

---

## ✅ Confirmación

Una vez ejecutado el test (automático o manual), completar:

- [ ] Test ejecutado el: ******\_\_\_******
- [ ] Resultado: ☐ ✅ PASA | ☐ ❌ FALLA
- [ ] Botón cambia correctamente de idioma: ☐ SÍ | ☐ NO
- [ ] useMemo recrea previewService: ☐ SÍ | ☐ NO
- [ ] Sin errores en consola: ☐ SÍ | ☐ NO
- [ ] Comportamiento igual que web pública: ☐ SÍ | ☐ NO

**Firma:** ******\_\_\_******

---

**Última actualización:** 14 de octubre de 2025  
**Pendiente:** Ejecutar test cuando backend esté disponible
