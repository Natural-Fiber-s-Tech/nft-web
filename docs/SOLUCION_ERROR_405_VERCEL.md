# 🚨 Solución Error 405 en Vercel

## Problema
```
Error 405: No se pudo iniciar sesión
URL: https://www.fiberstech.com/adminx
```

## Causa
Vercel necesita las **variables de entorno** configuradas en el dashboard.

---

## ✅ Pasos para solucionar

### 1. Ir a Vercel Dashboard
```
https://vercel.com/XtianCarlosQ/web-nft-react-2025/settings/environment-variables
```

### 2. Agregar estas 3 variables

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `JWT_SECRET` | `tu_secreto_super_seguro_123` | Clave para firmar tokens JWT |
| `ADMIN_USERNAME` | `admin` | Usuario del CMS |
| `ADMIN_PASSWORD` | `tu_contraseña_segura` | Contraseña del CMS |

**⚠️ IMPORTANTE:**
- Usa contraseñas SEGURAS (mínimo 12 caracteres)
- NO uses las mismas que en desarrollo
- JWT_SECRET debe ser diferente a dev

### 3. Ejemplo de valores seguros

```bash
# Generar JWT_SECRET seguro (en tu terminal local):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Resultado ejemplo:
# 8f3d4c2b1a9e7f6d5c4b3a2e1f8d7c6b5a4e3d2c1b9a8f7e6d5c4b3a2e1f0d
```

### 4. Guardar y Re-deploy

1. Click en "Save" en cada variable
2. Vercel preguntará: "Re-deploy with new environment variables?"
3. Click en "Redeploy"

---

## 🧪 Verificar que funcione

1. Espera a que termine el deploy (2-3 minutos)
2. Ve a: `https://www.fiberstech.com/adminx`
3. Ingresa las credenciales que pusiste en `ADMIN_USERNAME` y `ADMIN_PASSWORD`
4. ✅ Debería funcionar el login

---

## 📋 Checklist

- [ ] Variables agregadas en Vercel Dashboard
- [ ] JWT_SECRET diferente a "devsecret"
- [ ] ADMIN_PASSWORD segura (no "admin123")
- [ ] Re-deploy ejecutado
- [ ] Login probado en producción
- [ ] Logout probado
- [ ] Guardar datos en CMS probado

---

## 🔒 Mejores prácticas

### ❌ NO HACER:
```bash
# .env (este archivo NO se sube a Vercel)
JWT_SECRET=devsecret  # ❌ Demasiado simple
ADMIN_PASSWORD=admin  # ❌ Inseguro
```

### ✅ HACER:
```bash
# Vercel Dashboard Environment Variables
JWT_SECRET=8f3d4c2b1a9e7f6d5c4b3a2e1f8d7c6b...  # ✅ 64 caracteres hex
ADMIN_USERNAME=adminNFT                      # ✅ Username único
ADMIN_PASSWORD=MyS3cur3P@ssw0rd!2025         # ✅ 12+ chars, símbolos
```

---

## 🐛 Si sigue sin funcionar

### Revisar logs de Vercel:
1. Ve a: `https://vercel.com/XtianCarlosQ/web-nft-react-2025/deployments`
2. Click en el último deployment
3. Tab "Functions"
4. Click en `api/auth`
5. Ver logs de errores

### Errores comunes:

**Error: "missing_env"**
```
Solución: Verifica que las 3 variables estén guardadas
```

**Error: "invalid_credentials"**
```
Solución: Username/password incorrectos
```

**Error: 404 Not Found**
```
Solución: Asegúrate de que api/auth.js esté en el repo
Comando: git status
Verificar que api/auth.js aparezca en la lista
```

---

## 🚀 Después de solucionar

Una vez funcione el login:

1. ✅ Probar crear/editar servicios
2. ✅ Probar crear/editar productos
3. ✅ Probar crear/editar team
4. ✅ Probar crear/editar research
5. ✅ Verificar que se guarden en GitHub
6. ✅ Verificar que la web pública muestre los cambios

---

## 💡 Tip: Testing rápido

```bash
# En tu terminal local, prueba el endpoint de producción:
curl -X POST https://www.fiberstech.com/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"login","username":"admin","password":"tu_password"}'

# Debería retornar:
# {"ok":true}

# Si retorna error 500:
# - Variables de entorno faltan

# Si retorna error 401:
# - Credenciales incorrectas

# Si retorna error 405:
# - Archivo api/auth.js no está deployado
```
