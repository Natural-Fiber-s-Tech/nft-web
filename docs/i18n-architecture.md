# Arquitectura de Internacionalización (i18n)

## Resumen Ejecutivo

Este proyecto implementa una arquitectura de i18n de **2 capas** para separar claramente traducciones estáticas (UI pública y admin) y contenido dinámico editable.

**IMPORTANTE**: El CMS NO puede escribir en `src/` (solo en deploy time). Por lo tanto, todas las traducciones de labels del admin están hardcoded en los componentes. Solo el contenido dinámico (productos, servicios) está en JSON editable.

---

## 📋 Las 2 Capas de i18n

### 1. **Traducciones de Interfaz (UI Estática)** → `src/config/i18n.js`

**Propósito**: Textos estáticos de la interfaz del sitio web público Y del CMS (navegación, títulos de secciones, labels de formularios, botones, etc.)

**⚠️ LIMITACIÓN**: Como este archivo está en `src/`, el CMS no puede modificarlo dinámicamente. Los labels del admin están hardcoded.

**Estructura**:

```javascript
export const messages = {
  es: {
    nav: {
      home: "Inicio",
      products: "Productos",
      services: "Servicios",
      // ...
    },
    hero: {
      title: "Innovación en Análisis de Fibras",
      // ...
    },
    // ... otras secciones
  },
  en: {
    nav: {
      home: "Home",
      products: "Products",
      // ...
    },
    // ...
  },
};
```

**Uso**:

```jsx
// En cualquier componente público
import { useLanguage } from "../context/LanguageContext";

function Navbar() {
  const { t, language, toggleLanguage } = useLanguage();

  return (
    <nav>
      <a href="/">{t("nav.home")}</a>
      <a href="/productos">{t("nav.products")}</a>
      {/* ... */}
    </nav>
  );
}
```

**Características**:

- ✅ Versionado con git (cambios trackeable)
- ✅ Modificable solo por desarrolladores
- ✅ No editable desde CMS
- ✅ Traducciones completas garantizadas en build time

---

### 2. **Contenido Dinámico Editable** → `public/content/*.json`

**Propósito**: Contenido creado/editado desde el CMS por usuarios no técnicos (productos, servicios, publicaciones, equipo)

**⚠️ CRÍTICO**: Este es el ÚNICO lugar donde el CMS puede escribir en producción (Vercel permite escribir en `public/` via GitHub API).

**Estructura**:

```json
// public/content/products.json
[
  {
    "id": "fiber-ec",
    "name": {
      "es": "FIBER EC",
      "en": "FIBER EC"
    },
    "description": {
      "es": "Caracterizador electrónico...",
      "en": "Electronic characterizer..."
    },
    "category": {
      "es": "Caracterización de Fibras",
      "en": "Fiber Characterization"
    },
    "features": {
      "es": ["MDF", "Factor de Confort", "..."],
      "en": ["MDF", "Comfort Factor", "..."]
    },
    "specifications": {
      "es": {
        "Peso": "10 kg",
        "Dimensiones": "25.3 cm x 18.8 cm x 38.5 cm"
      },
      "en": {
        "Weight": "10 kg",
        "Dimensions": "25.3 cm x 18.8 cm x 38.5 cm"
      }
    },
    "capabilities": {
      "es": [
        "Evaluación de mechas completas",
        "Miles de mediciones por muestra"
      ],
      "en": [
        "Evaluation of complete rovings",
        "Thousands of measurements per sample"
      ]
    }
  }
]
```

**Convención de Estructura**:

Para **strings simples**:

```json
{
  "field": {
    "es": "Texto en español",
    "en": "Text in English"
  }
}
```

Para **arrays**:

```json
{
  "features": {
    "es": ["Característica 1", "Característica 2"],
    "en": ["Feature 1", "Feature 2"]
  }
}
```

Para **objetos (specifications)**:

```json
{
  "specifications": {
    "es": {
      "Peso": "10 kg",
      "Dimensiones": "25 x 18 cm"
    },
    "en": {
      "Weight": "10 kg",
      "Dimensions": "25 x 18 cm"
    }
  }
}
```

**Uso en componentes públicos**:

```jsx
import { useLanguage } from "../context/LanguageContext";

function ProductDetail({ product }) {
  const { language } = useLanguage();

  return (
    <div>
      <h1>{product.name[language]}</h1>
      <p>{product.description[language]}</p>
      <p>Categoría: {product.category[language]}</p>

      <h2>Especificaciones</h2>
      <ul>
        {Object.entries(product.specifications[language]).map(([key, val]) => (
          <li key={key}>
            {key}: {val}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Uso en CMS (admin)**:

```jsx
function ProductFormModal({ product }) {
  const [local, setLocal] = useState(product);
  const [tab, setTab] = useState("es"); // idioma de edición

  const updateField = (field, value) => {
    setLocal((prev) => ({
      ...prev,
      [field]: { ...prev[field], [tab]: value },
    }));
  };

  return (
    <div>
      {/* Toggle ES/EN */}
      <button onClick={() => setTab("es")}>Español</button>
      <button onClick={() => setTab("en")}>English</button>

      {/* Formulario editable */}
      <input
        value={local.name?.[tab] || ""}
        onChange={(e) => updateField("name", e.target.value)}
      />

      {/* Vista previa en idioma seleccionado */}
      <ProductCard
        product={{
          name: local.name?.[tab],
          description: local.description?.[tab],
        }}
      />
    </div>
  );
}
```

**Características**:

- ✅ Almacenado en JSON (fácil de parsear/editar)
- ✅ Editable desde CMS sin código
- ✅ Versionado con git (cada commit guarda el historial)
- ✅ Auto-traducción con Google Translate API integrada
- ✅ Estructura consistente: todo campo de usuario tiene `{es, en}`

**Por qué en JSON y no en base de datos**:

- **Git como base de datos**: Historial completo de cambios
- **Vercel auto-deploy**: Cada push redeploy automático en 2-3 min
- **Cero costo**: No necesita DB hosting (Vercel Hobby gratuito)
- **Auditable**: Diff de git muestra exactamente qué cambió
- **Respaldos**: GitHub = backup automático

---

## 🔄 Flujo de Trabajo Completo

### Para Desarrolladores

#### 1. Agregar nueva traducción estática (UI pública)

```bash
# Editar src/config/i18n.js
export const messages = {
  es: {
    newSection: {
      title: "Nuevo Título",
      subtitle: "Subtítulo"
    }
  },
  en: {
    newSection: {
      title: "New Title",
      subtitle: "Subtitle"
    }
  }
};

# Usar en componente
const { t } = useLanguage();
<h1>{t("newSection.title")}</h1>
```

#### 2. Agregar traducción del CMS

```bash
# Editar src/config/admin-i18n.js
export const adminMessages = {
  es: {
    team: {
      newMember: "Nuevo Miembro",
      editMember: "Editar Miembro"
    }
  },
  en: {
    team: {
      newMember: "New Member",
      editMember: "Edit Member"
    }
  }
};

# Usar en admin
const { t } = useAdminTranslation();
<h2>{t("team.newMember")}</h2>
```

#### 3. Agregar nuevo campo editable (contenido dinámico)

```bash
# Actualizar public/content/products.json
{
  "id": "product-1",
  "newField": {
    "es": "Valor en español",
    "en": "Value in English"
  }
}

# Actualizar componente de lectura
<p>{product.newField[language]}</p>

# Actualizar formulario CMS
<input
  value={local.newField?.[tab] || ""}
  onChange={(e) => updateField("newField", e.target.value)}
/>
```

---

### Para Usuarios del CMS (No Técnicos)

1. **Acceder al CMS**: `https://tu-sitio.com/adminx`
2. **Iniciar sesión**: Credenciales configuradas en Vercel
3. **Editar contenido**:
   - Seleccionar idioma (ES/EN) con botones en la parte superior
   - Completar campos en español
   - Cambiar a inglés
   - Usar botón "Auto-traducir" o completar manualmente
4. **Vista previa**: Ver cómo se verá en el sitio (Card/Detalle)
5. **Guardar**: Click en "Guardar" → commit a GitHub → redeploy automático

**Tiempo de publicación**: 2-3 minutos después de guardar

---

## 🎯 Principios de Diseño

### 1. **Separation of Concerns**

- **UI estático** (código) ≠ **Contenido dinámico** (datos)
- **Admin UI** ≠ **Public UI**

### 2. **Developer Experience**

- Autocompletado en IDE con TypeScript (futuro)
- Navegación fácil con `Ctrl+Click` en strings i18n
- Búsqueda global con `grep "products.title"`

### 3. **User Experience (CMS)**

- Vista previa en tiempo real
- Auto-traducción con IA
- Validaciones visuales (campos requeridos en rojo)
- Tooltips explicativos

### 4. **Performance**

- Bundle splitting: Admin no carga en público
- Lazy loading de traducciones admin
- JSON estático = caching perfecto en CDN

### 5. **Maintainability**

- Estructura predecible: `{es:{}, en:{}}`
- Migración sencilla: buscar/reemplazar en JSON
- Validación en build time (falta implementar)

---

## 🛠️ Mejoras Futuras

### Corto Plazo

- [ ] TypeScript para type-safety en traducciones
- [ ] Validación de completitud (alertar si falta traducción)
- [ ] Exportar/importar JSON para editores externos

### Mediano Plazo

- [ ] Soporte para más idiomas (PT, FR, etc.)
- [ ] Preview side-by-side (ES y EN en simultáneo)
- [ ] Histórico de cambios en UI del CMS

### Largo Plazo

- [ ] Traducción colaborativa (múltiples usuarios)
- [ ] Integración con servicios de traducción profesional
- [ ] Sistema de aprobación de traducciones

---

## 📚 Referencias y Recursos

### Documentación Relacionada

- React i18n: https://react.i18next.com/
- Vercel Git Integration: https://vercel.com/docs/concepts/git
- GitHub API: https://docs.github.com/rest/repos/contents

### Archivos Clave

```
src/
├── config/
│   ├── i18n.js           # Traducciones sitio público
│   └── admin-i18n.js     # Traducciones CMS
├── context/
│   └── LanguageContext.jsx  # Hook useLanguage()
public/
└── content/
    ├── products.json     # Contenido productos
    ├── services.json     # Contenido servicios
    ├── team.json         # Contenido equipo
    └── research.json     # Contenido investigación
```

---

## ⚠️ Advertencias y Caveats

### 1. **Sincronización de idiomas**

Si un usuario edita solo en español y olvida inglés, el campo inglés quedará vacío. Solución:

- Auto-traducción con botón "Traducir automáticamente"
- Validación visual (muestra campos faltantes)

### 2. **Commits en GitHub**

Cada "Guardar" en CMS = 1 commit. Esto puede generar muchos commits. Solución:

- Usar mensajes descriptivos automáticos
- Squash periódico de commits (opcional)

### 3. **Cache de Vercel**

Cambios pueden tardar 2-3 min en verse. Esto es normal (tiempo de build + CDN propagation).

### 4. **Estructura legacy**

Productos antiguos pueden tener estructura plana (sin `{es,en}`). El código incluye fallbacks:

```javascript
const categoryValue =
  typeof local?.category === "object" ? local?.category?.es : local?.category; // fallback para datos legacy
```

---

## 🎓 Conclusión

Esta arquitectura logra un balance entre:

- **Flexibilidad**: Usuarios no técnicos pueden editar contenido
- **Control**: Desarrolladores controlan UI y estructura
- **Performance**: Sin overhead de base de datos
- **Confiabilidad**: Git como fuente de verdad con historial completo

Es una solución ideal para sitios web corporativos con contenido dinámico moderado (<100 productos) y presupuesto limitado (Vercel Hobby gratuito).
