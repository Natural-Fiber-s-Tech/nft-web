<div align="center">

# Fiberstech — Landing 2025

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=061e26)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=fff)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2023-F7DF1E?logo=javascript&logoColor=000)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/Code_Style-Prettier-ff69b4?logo=prettier&logoColor=white)](https://prettier.io)

Landing minimalista construida con React + Vite y Tailwind CSS v4.1. Incluye un sistema de grilla reutilizable (12/8/4 columnas), componentes accesibles y diseño responsive.

</div>

## Secciones de la Landing

- Hero: slider 16:9 con bordes redondeados y overlay para legibilidad.
- About: bloque informativo + video, estadísticas y diferenciales de valor.
- Products: cards con imagen, features, CTA y botón para descargar folleto (PDF).
- Partners: carrusel tipo marquee de instituciones/aliados.
- Team: carrusel de 3 en 3 con overlay de especialidades al hover.
- Footer: marca + contacto + redes, en 2 columnas desde md.

## Stack y arquitectura

- React 18 + Vite 5 (HMR, build rápido)
- Tailwind CSS 4.1 (utilidades y diseño escalable)
- Grilla utilitaria 12/8/4 (clases `container-app`, `grid-ctx`, `span-*`, `start-*`)
- Assets locales (imágenes y PDF en `src/assets`)

## Estructura principal

```
src/
	components/
		layout/
			Navbar.jsx
			Footer.jsx
		sections/
			Hero.jsx
			About.jsx
			Products.jsx
			Partners.jsx
			Team.jsx
	styles/
		grid-overlay.css
		partners.css
```

## Cómo ejecutar

Requisitos: Node.js 18+ y npm.

```powershell
# Instalar dependencias
npm install

# Ambiente de desarrollo (HMR)
npm run dev

# Build de producción
npm run build

# Previsualizar el build localmente
npm run preview
```

### Admin (/adminx) en local sin errores 401/500

Tienes dos formas de hacerlo funcionar en desarrollo:

1. Modo mock (recomendado):

- Copia `.env.local.example` a `.env.local`.
- Asegúrate de que `MOCK_API=true` y `COOKIE_SECURE=false` en `.env.local`.
- Reinicia el servidor de Vite: `npm run dev`.
- Abre `http://localhost:5173/adminx` y entra con `ADMIN_USERNAME`/`ADMIN_PASSWORD` definidos.

En este modo, las rutas `/api/*` se manejan en el mismo Vite y guardan JSON en `public/content/*.json`.

2. Modo proxy a funciones (vercel dev):

- Lanza `vercel dev` (puerto 3000) en otra terminal.
- Deja `MOCK_API=false` u omite esa variable.
- Define en `.env` (o variables de Vercel) los secretos: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, `GITHUB_REPO`, `GITHUB_TOKEN`, `SERVICES_PATH`, `PRODUCTS_PATH`, `TEAM_PATH`.
- Inicia `npm run dev` para que Vite proxyee `/api` a `http://localhost:3000`.

Si ves 404/401/500:

- Verifica que hayas iniciado sesión en `/api/auth/login` desde `/adminx`.
- En modo mock: confirma `MOCK_API=true` y reinicia `npm run dev`.
- En modo vercel: confirma que `vercel dev` está corriendo y que las variables de entorno están bien definidas.

## Notas destacadas

- Slider del Hero mantiene proporción 16:9, sin solaparse con el navbar fijo.
- Team/Partners usan transiciones suaves y bordes redondeados consistentes.
- Footer responsivo: dos columnas desde `md`, íconos de contacto y redes.
- Productos: botón “Descargar Folleto Empresarial” abre el PDF en nueva pestaña.

## Próximos pasos (roadmap)

- Páginas internas para cada sección (rutas dedicadas).
- Marcado de navegación activo por sección (scroll spy / IntersectionObserver).
- Internacionalización (i18n) usando el contexto de idioma.

---

Si este repo te es útil, considera darle una ⭐ en GitHub.
