# Admin Hooks - Shared Translation System

## Overview

This directory contains shared hooks and utilities for the admin panel, following **DRY (Don't Repeat Yourself)** and **OOP (Object-Oriented Programming)** principles for scalability.

## useAutoTranslate Hook

### Purpose

Provides automatic translation functionality that can be reused across all admin modules (Products, Services, Team, Research, etc.).

### Features

- ✅ Auto-translate ES → EN using Google Translate API
- ✅ Detect missing translations dynamically
- ✅ Support for simple fields, arrays, and nested structures
- ✅ Rate limiting to prevent API throttling
- ✅ Error handling and user feedback
- ✅ Fully configurable per module

### Usage Example

#### 1. Import the hook

```jsx
import { useAutoTranslate } from "../../hooks/useAutoTranslate";
```

#### 2. Configure and use in your component

```jsx
function ServiceFormModal() {
  const [data, setData] = useState({
    title: { es: "", en: "" },
    description: { es: "", en: "" },
    features: { es: [], en: [] },
  });

  // ✅ Configure the hook
  const { translating, autoTranslate, detectMissing } = useAutoTranslate(
    data,
    setData,
    {
      simpleFields: ["title", "description"], // {es: "", en: ""}
      arrayFields: ["features"], // {es: [], en: []}
      sourceLang: "es",
      targetLang: "en",
    }
  );

  // ✅ Auto-translate button handler
  async function handleAutoTranslate() {
    const result = await autoTranslate();
    if (result.success) {
      alert(result.message);
      setActiveLang("en"); // Switch to EN to review
    } else {
      alert(result.message);
    }
  }

  // ✅ Show missing translations
  function handleShowMissing() {
    const missing = detectMissing();
    if (missing.length === 0) {
      alert("✅ Todos los campos están traducidos");
    } else {
      alert(`⚠️ Campos sin traducir:\n\n${missing.join("\n")}`);
      setActiveLang("en");
    }
  }

  return (
    <div>
      <button onClick={handleAutoTranslate} disabled={translating}>
        {translating ? "Traduciendo..." : "🌐 Auto-traducir"}
      </button>

      {detectMissing().length > 0 && (
        <span>
          {detectMissing().length} campo{detectMissing().length > 1 ? "s" : ""}{" "}
          sin traducir
        </span>
      )}
    </div>
  );
}
```

### Configuration Options

#### simpleFields

Array of field names with `{es: "", en: ""}` structure.

```jsx
simpleFields: ["title", "description", "tagline", "name"];
```

#### arrayFields

Array of field names with `{es: [], en: []}` structure.

```jsx
arrayFields: ["features", "benefits", "objectives"];
```

#### nestedFields

Array of objects for nested translations (e.g., array of objects with i18n fields).

```jsx
nestedFields: [
  {
    field: "featuresDetail", // Field name
    subFields: ["title", "description"], // Nested i18n fields
    label: "Características Detalladas", // Human-readable label
  },
];
```

**Example structure:**

```javascript
data.featuresDetail = [
  {
    icon: "Brain",
    title: { es: "Título", en: "Title" },
    description: { es: "Desc", en: "Desc" },
  },
];
```

#### sourceLang / targetLang

```jsx
sourceLang: 'es',  // Default: 'es'
targetLang: 'en',  // Default: 'en'
```

### Complete Examples

#### Services Module (Simple + Arrays)

```jsx
const { translating, autoTranslate, detectMissing } = useAutoTranslate(
  data,
  setData,
  {
    simpleFields: ["title", "description"],
    arrayFields: ["features"],
    sourceLang: "es",
    targetLang: "en",
  }
);
```

#### Products Module (Simple + Arrays + Nested)

```jsx
const { translating, autoTranslate, detectMissing } = useAutoTranslate(
  data,
  setData,
  {
    simpleFields: ["name", "tagline", "description", "descriptionDetail"],
    arrayFields: ["features"],
    nestedFields: [
      {
        field: "featuresDetail",
        subFields: ["title", "description"],
        label: "Características Detalladas",
      },
    ],
    sourceLang: "es",
    targetLang: "en",
  }
);
```

#### Team Module (Simple only)

```jsx
const { translating, autoTranslate, detectMissing } = useAutoTranslate(
  data,
  setData,
  {
    simpleFields: ["name", "role", "bio", "specialty"],
    sourceLang: "es",
    targetLang: "en",
  }
);
```

### Return Values

#### translating (boolean)

Indicates if translation is in progress. Use for loading states.

#### autoTranslate() (async function)

Performs automatic translation of all missing fields.

**Returns:**

```javascript
{
  success: true | false,
  message: "✅ ¡Traducción completada!..." | "❌ Error durante la traducción..."
}
```

#### detectMissing() (function)

Returns array of missing translation labels.

**Returns:**

```javascript
["• Título", "• Descripción", "• Características (3 items)"];
```

### Translation API

The hook uses **Google Translate API** (free, no auth required):

```javascript
https://translate.googleapis.com/translate_a/single
```

**Rate Limiting:**

- Simple fields: 200ms delay between translations
- Array items: 150ms delay between translations
- Nested fields: 150ms delay between translations

### Error Handling

- Network errors: Returns original text, logs error
- API errors: Returns original text, logs error
- Empty/null text: Skips translation
- User feedback: Returns `success: false` with error message

### Best Practices

1. **Always check `translating` state**

   ```jsx
   <button disabled={translating}>
     {translating ? "Traduciendo..." : "Auto-traducir"}
   </button>
   ```

2. **Show missing count dynamically**

   ```jsx
   const missing = detectMissing();
   {
     missing.length > 0 && (
       <span>
         {missing.length} campo{missing.length > 1 ? "s" : ""} sin traducir
       </span>
     );
   }
   ```

3. **Switch to target language after translation**

   ```jsx
   const result = await autoTranslate();
   if (result.success) {
     setActiveLang("en"); // Let user review translations
   }
   ```

4. **Alert user about missing translations**
   ```jsx
   function handleShowMissing() {
     const missing = detectMissing();
     if (missing.length === 0) {
       alert("✅ Todos los campos están traducidos");
     } else {
       alert(`⚠️ Campos sin traducir:\n\n${missing.join("\n")}`);
       setActiveLang("en");
     }
   }
   ```

### Migration Guide

#### Before (duplicated code in each module)

```jsx
// ServiceFormModal.jsx
async function handleAutoTranslate() {
  setTranslating(true);
  try {
    const res = await fetch("/api/translate", {
      /* ... */
    });
    // ... 50 lines of translation logic
  } catch (e) {
    // ... error handling
  } finally {
    setTranslating(false);
  }
}

function getMissingTranslations() {
  const missing = [];
  // ... 30 lines of detection logic
  return missing;
}
```

#### After (shared hook)

```jsx
// ServiceFormModal.jsx
const { translating, autoTranslate, detectMissing } = useAutoTranslate(
  data,
  setData,
  {
    simpleFields: ["title", "description"],
    arrayFields: ["features"],
  }
);

async function handleAutoTranslate() {
  const result = await autoTranslate();
  alert(result.message);
}
```

**Benefits:**

- ✅ 100+ lines of code eliminated per module
- ✅ Consistent behavior across all admin panels
- ✅ Single source of truth for translation logic
- ✅ Easy to add new modules (just configure fields)
- ✅ Centralized bug fixes and improvements

### Extending to Other Modules

#### Research Module

```jsx
const { translating, autoTranslate, detectMissing } = useAutoTranslate(
  data,
  setData,
  {
    simpleFields: ["title", "abstract", "keywords"],
    arrayFields: ["authors", "conclusions"],
    sourceLang: "es",
    targetLang: "en",
  }
);
```

#### Blog/News Module

```jsx
const { translating, autoTranslate, detectMissing } = useAutoTranslate(
  data,
  setData,
  {
    simpleFields: ["title", "summary", "content"],
    arrayFields: ["tags", "highlights"],
    sourceLang: "es",
    targetLang: "en",
  }
);
```

### Future Enhancements

Potential improvements for v2:

- [ ] Support for multiple translation providers (DeepL, Microsoft, custom API)
- [ ] Batch translation (all fields in single API call)
- [ ] Translation memory/cache (avoid re-translating identical text)
- [ ] Bidirectional translation (EN → ES)
- [ ] Progress callbacks for long translations
- [ ] Undo/redo functionality
- [ ] Translation quality suggestions

---

**Maintained by:** NFT Dev Team  
**Last Updated:** October 14, 2025  
**Version:** 1.0.0
