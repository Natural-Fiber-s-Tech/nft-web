# 📚 Tutorial Completo: Sistema de Autenticación

## 🎯 Índice

1. [¿Qué es la autenticación?](#qué-es-la-autenticación)
2. [Los 3 endpoints: LOGIN, LOGOUT, ME](#los-3-endpoints-login-logout-me)
3. [¿Qué es JWT y para qué sirve?](#qué-es-jwt-y-para-qué-sirve)
4. [Action-based vs múltiples endpoints](#action-based-vs-múltiples-endpoints)
5. [Flujo completo con ejemplos](#flujo-completo-con-ejemplos)

---

## 1. ¿Qué es la autenticación?

**Autenticación** = Verificar que eres quien dices ser.

### Ejemplo de la vida real:

- Entras a un banco 🏦
- Muestras tu DNI (credenciales)
- Te dan un brazalete 🎫 (token)
- Con el brazalete, puedes acceder a la caja fuerte (áreas protegidas)
- Al salir, devuelves el brazalete (logout)

### En tu app:

- Login = Mostrar DNI (username + password)
- Token/Cookie = Brazalete digital
- Logout = Devolver brazalete
- ME = Verificar que tu brazalete siga siendo válido

---

## 2. Los 3 endpoints: LOGIN, LOGOUT, ME

### 🔐 A. LOGIN - "Dame acceso"

**¿Qué hace?**

```javascript
// Usuario envía:
{
  action: "login",
  username: "admin",
  password: "secreto123"
}

// Servidor verifica:
1. ¿El usuario existe? ✓
2. ¿La contraseña es correcta? ✓
3. Crea un TOKEN (brazalete digital)
4. Lo guarda en una COOKIE (para recordarlo)
5. Responde: { ok: true }
```

**Analogía:**

```
👤 Usuario: "Hola, soy admin y mi contraseña es secreto123"
🏦 Servidor: *verifica en la base de datos*
🏦 Servidor: "Correcto, aquí está tu brazalete 🎫"
```

**Código real:**

```javascript
if (action === "login") {
  // 1. Verificar credenciales
  if (username === envUser && password === envPass) {
    // 2. Crear token JWT (brazalete)
    const token = jwt.sign({ u: username }, SECRET, { expiresIn: "2h" });

    // 3. Guardar en cookie (para que el navegador lo recuerde)
    setAuthCookie(res, token);

    // 4. Confirmar éxito
    return { ok: true };
  }
}
```

---

### 🚪 B. LOGOUT - "Ya no necesito acceso"

**¿Qué hace?**

```javascript
// Usuario envía:
{
  action: "logout"
}

// Servidor:
1. Borra la cookie (quita el brazalete)
2. Responde: { ok: true }
```

**Analogía:**

```
👤 Usuario: "Me voy, aquí está mi brazalete de vuelta 🎫"
🏦 Servidor: "Ok, brazalete destruido ✂️"
```

**Código real:**

```javascript
if (action === "logout") {
  // Borrar cookie (establecer en vacío con Max-Age=0)
  clearAuthCookie(res);
  return { ok: true };
}
```

---

### 🔍 C. ME - "¿Aún tengo acceso?"

**¿Qué hace?**

```javascript
// Usuario envía (automático al cargar la página):
GET /api/auth?action=me

// Servidor:
1. Lee la COOKIE del navegador
2. Verifica si el TOKEN es válido
3. Responde:
   - Si es válido: { authenticated: true, user: { name: "admin" } }
   - Si no: { authenticated: false }
```

**Analogía:**

```
👤 Usuario: "¿Mi brazalete todavía funciona? 🎫"
🏦 Servidor: *escanea el brazalete*
🏦 Servidor: "Sí, eres admin y tienes acceso hasta las 14:00"
```

**Código real:**

```javascript
if (action === "me") {
  // 1. Leer token de la cookie
  const user = verifyTokenFromCookie(req);

  // 2. Verificar si es válido
  if (!user) {
    return { authenticated: false };
  }

  // 3. Retornar info del usuario
  return { authenticated: true, user: { name: user.u } };
}
```

**¿Cuándo se ejecuta?**

- Al cargar la app (para ver si ya tienes sesión activa)
- Cada vez que recargas la página
- Cuando el token está por expirar (para renovarlo)

---

## 3. ¿Qué es JWT y para qué sirve?

### JWT = JSON Web Token

**Imagina un sobre sellado 📨**

```javascript
// Contenido del sobre (visible):
{
  "u": "admin",          // usuario
  "iat": 1698000000,     // cuándo se creó
  "exp": 1698007200      // cuándo expira (2 horas después)
}

// Sello (firma secreta):
"abc123xyz..."
// Solo el servidor puede crear este sello
// Si alguien modifica el contenido, el sello se rompe ❌
```

### ¿Para qué sirve?

**❌ Problema sin JWT:**

```javascript
// Usuario dice: "Soy admin"
// Servidor: "¿Cómo sé que eres admin?"
// Usuario: "Te lo digo cada vez que hago algo"
// Servidor: "Necesito verificar tu contraseña en cada petición" 😰
```

**✅ Solución con JWT:**

```javascript
// Usuario: *muestra token firmado* 🎫
// Servidor: *verifica firma* "El sello es válido, confío en ti" ✅
// No necesita verificar la contraseña cada vez
```

### Ventajas de JWT:

1. **Stateless** (sin estado):

   - El servidor NO guarda la sesión en memoria
   - Todo está en el token
   - Más escalable para muchos usuarios

2. **Seguro**:

   - Firmado con clave secreta (JWT_SECRET)
   - Si alguien modifica el token, la firma falla
   - No se puede falsificar

3. **Autoexpira**:
   ```javascript
   expiresIn: 60 * 60 * 2; // 2 horas
   ```
   - Después de 2 horas, el token deja de funcionar
   - Obliga al usuario a hacer login de nuevo
   - Reduce riesgo si alguien roba el token

### ¿Cómo se usa?

```javascript
// 1. Crear token (al hacer login)
const token = jwt.sign(
  { u: "admin" }, // Datos a guardar
  process.env.JWT_SECRET, // Clave secreta
  { expiresIn: 60 * 60 * 2 } // Expira en 2 horas
);

// 2. Guardar en cookie
setAuthCookie(res, token);

// 3. Verificar token (en cada petición protegida)
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log(decoded.u); // "admin"
} catch {
  // Token inválido o expirado
}
```

---

## 4. Action-based vs Múltiples endpoints

### ❌ Antes: 3 endpoints separados (DEPRECATED)

```javascript
// Archivo: api/auth/login.js
POST / api / auth / login;
{
  username, password;
}

// Archivo: api/auth/logout.js
POST / api / auth / logout;

// Archivo: api/auth/me.js
GET / api / auth / me;
```

**Problema:**

- 3 archivos = 3 funciones serverless
- Vercel Hobby limita a 12 funciones
- Código duplicado en cada archivo

---

### ✅ Ahora: 1 endpoint con actions (ACTION-BASED)

```javascript
// Archivo: api/auth.js (ÚNICO)

// POST para operaciones que cambian estado
POST /api/auth
{ action: "login", username, password }
{ action: "logout" }

// GET para consultas (solo lectura)
GET /api/auth?action=me
```

**Ventajas:**

1. **1 archivo = 1 función serverless** ✅
2. **Código centralizado** - más fácil de mantener
3. **Escalable** - puedes agregar más actions sin crear archivos

---

### ¿Qué significa "Action-based"?

**Action-based** = Un campo en el request indica QUÉ operación quieres hacer.

#### Ejemplo de la vida real:

```
❌ Antiguo: 3 ventanillas en el banco
🏦 Ventanilla 1: Solo depósitos
🏦 Ventanilla 2: Solo retiros
🏦 Ventanilla 3: Solo consultas

✅ Nuevo: 1 ventanilla que hace todo
🏦 Ventanilla única:
👤 "Quiero hacer un DEPÓSITO" (action: "deposit")
👤 "Quiero hacer un RETIRO" (action: "withdraw")
👤 "Quiero consultar mi SALDO" (action: "balance")
```

#### En código:

```javascript
// El servidor lee el "action" y decide qué hacer
const action = body.action; // "login", "logout", etc.

switch (action) {
  case "login":
  // ... lógica de login
  case "logout":
  // ... lógica de logout
  case "me":
  // ... lógica de verificación
}
```

---

### ¿Es más seguro 1 endpoint o 3?

**Respuesta: Es IGUAL de seguro** 🔒

La seguridad NO depende de cuántos endpoints tengas, sino de:

1. **Validación de credenciales** ✅

   ```javascript
   if (username !== envUser || password !== envPass) {
     return error("invalid_credentials");
   }
   ```

2. **JWT bien implementado** ✅

   ```javascript
   jwt.verify(token, SECRET); // Verifica firma
   ```

3. **Cookies seguras** ✅

   ```javascript
   HttpOnly; // JavaScript no puede leerla
   Secure; // Solo HTTPS en producción
   SameSite; // Previene CSRF
   ```

4. **Variables de entorno** ✅

   ```javascript
   // ❌ NUNCA:
   const SECRET = "abc123";

   // ✅ SIEMPRE:
   const SECRET = process.env.JWT_SECRET;
   ```

---

## 5. Flujo completo con ejemplos

### 📖 Caso de uso real: Usuario entra al CMS

```
┌─────────────────────────────────────────────────┐
│ 1️⃣  USUARIO ABRE LA APP                          │
└─────────────────────────────────────────────────┘
         │
         ▼
    [useAuth() hook se ejecuta]
         │
         ▼
    GET /api/auth?action=me
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
  ✅ Cookie   ❌ No cookie
  válida      o expirada
    │          │
    │          ▼
    │     [Redirige a LOGIN]
    │          │
    ▼          │
[Muestra CMS]  │
               │
┌──────────────┴──────────────────────────────────┐
│ 2️⃣  USUARIO HACE LOGIN                           │
└─────────────────────────────────────────────────┘
         │
         ▼
    [Ingresa username + password]
         │
         ▼
    POST /api/auth
    { action: "login", username, password }
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
  ✅ Válido  ❌ Inválido
    │          │
    │          ▼
    │     [Muestra error]
    │          │
    ▼          │
[Crea token]   │
[Guarda cookie]│
[Reload page]  │
    │          │
    └──────────┘
         │
┌────────┴────────────────────────────────────────┐
│ 3️⃣  USUARIO USA EL CMS                           │
└─────────────────────────────────────────────────┘
         │
    [Cada petición incluye la cookie automáticamente]
         │
         ▼
    POST /api/services/save
    Cookie: admin_token=eyJhbGc...
         │
         ▼
    [Servidor verifica token antes de guardar]
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
  ✅ Válido  ❌ Expirado
    │          │
    │          ▼
    │     [Error 401]
    │     [Redirige a login]
    │          │
    ▼          │
[Guarda datos] │
    │          │
    └──────────┘
         │
┌────────┴────────────────────────────────────────┐
│ 4️⃣  USUARIO HACE LOGOUT                          │
└─────────────────────────────────────────────────┘
         │
         ▼
    POST /api/auth
    { action: "logout" }
         │
         ▼
    [Borra cookie]
         │
         ▼
    [Reload page]
         │
         ▼
    [Muestra LOGIN de nuevo]
```

---

## 🎓 Resumen para recordar

| Concepto         | Explicación simple                                          |
| ---------------- | ----------------------------------------------------------- |
| **Login**        | Verificar credenciales y dar un "brazalete" (token)         |
| **Logout**       | Devolver el "brazalete" (borrar token)                      |
| **ME**           | Verificar si tu "brazalete" todavía es válido               |
| **JWT**          | "Sobre sellado" con tu info que el servidor puede verificar |
| **Cookie**       | Lugar donde el navegador guarda el token automáticamente    |
| **Action-based** | 1 endpoint que hace varias cosas según el campo "action"    |
| **Seguridad**    | No depende de cuántos endpoints, sino de buenas prácticas   |

---

## 🔐 Mejores prácticas que usamos

✅ **Variables de entorno** para secretos  
✅ **HttpOnly cookies** (JavaScript no puede leerlas)  
✅ **Tokens con expiración** (2 horas)  
✅ **Verificación en cada petición protegida**  
✅ **Action-based** para reducir funciones serverless  
✅ **Comentarios educativos** en el código

---

## 🚀 Siguiente nivel (opcional)

Si quieres aprender más:

- Refresh tokens (renovar sin pedir contraseña)
- 2FA (autenticación de dos factores)
- OAuth (login con Google/GitHub)
- Rate limiting (prevenir ataques de fuerza bruta)

¡Pero con lo que tienes ahora ya tienes un sistema profesional! 💪
