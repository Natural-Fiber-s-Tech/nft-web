# 🌐 Sistema de Traducción Automática

## Descripción

Sistema integrado para traducir automáticamente productos del español al inglés usando Google Translate API (sin necesidad de API key).

## Características

### 1. Script de Línea de Comandos

Traduce todos los productos del archivo `products.json` de forma masiva.

**Uso:**

```bash
npm run translate:products
```

**Funcionalidad:**

- ✅ Traduce todos los campos multiidioma (name, tagline, description, features, etc.)
- ✅ Crea respaldo automático antes de modificar
- ✅ Omite productos archivados
- ✅ Rate limiting para evitar bloqueos de API
- ✅ Logging detallado del progreso
- ✅ Manejo de errores (mantiene original si falla)

### 2. Botón "Auto-traducir" en CMS

Botón integrado en el modal de edición/creación de productos.

**Funcionalidad:**

- 🔍 **Detección inteligente**: Identifica qué campos faltan traducir
- 📊 **Indicador visual**: Badge amarillo muestra cuántos campos pendientes
- 🎯 **Traducción selectiva**: Solo traduce campos vacíos o duplicados
- ✅ **Confirmación**: Muestra lista de campos antes de traducir
- ⏳ **Loading state**: Indicador visual durante traducción
- 📝 **Revisión manual**: Permite ajustar traducciones después

**Ubicación:**
Modal de Products → Header → Junto a botones de idioma

**Criterios de Detección:**
Un campo necesita traducción si:

- El campo EN está vacío
- El campo EN es idéntico al ES
- Arrays EN están vacíos cuando ES tiene elementos

## Campos Traducidos

### Campos Simples

- `name` - Nombre del producto
- `tagline` - Tagline/eslogan
- `description` - Descripción corta (para card)
- `descriptionDetail` - Descripción detallada

### Campos de Array

- `features` - Lista de características (para card)

### Campos Complejos

- `featuresDetail[]` - Array de objetos con:
  - `title.es` → `title.en`
  - `description.es` → `description.en`

## Flujo de Trabajo Recomendado

### Para Productos Existentes

1. Ejecutar script masivo: `npm run translate:products`
2. Revisar traducciones en CMS
3. Ajustar manualmente si es necesario
4. Guardar cambios

### Para Nuevos Productos

1. Completar información en **Español**
2. Click en "🌐 Auto-traducir"
3. Revisar traducciones en tab **Inglés (EN)**
4. Ajustar si es necesario
5. Guardar

### Para Editar Productos

1. Si falta algún campo en inglés, aparecerá badge amarillo
2. Click en "🌐 Auto-traducir" para completar
3. O editar manualmente en tab Inglés

## Validación de Datos

### Al Guardar

El CMS valida campos obligatorios **solo en español**:

- ✅ Nombre (ES)
- ✅ Descripción (ES)
- ✅ Al menos 1 característica (ES)

### Recomendación

Aunque no es obligatorio tener traducciones al inglés para guardar, **se recomienda completarlas** para mejor experiencia en web pública.

## Limitaciones y Consideraciones

### Google Translate API Pública

- ✅ **Gratis** - No requiere API key
- ⚠️ **Rate limiting** - Pausas de 150-300ms entre llamadas
- ⚠️ **Calidad variable** - Términos técnicos pueden necesitar revisión
- ⚠️ **Sin garantía** - API no oficial, puede cambiar

### Rendimiento

- **Script masivo**: ~10-15 segundos por producto
- **Botón CMS**: ~5-10 segundos dependiendo de campos

### Casos Especiales

- **Términos técnicos**: Pueden requerir revisión manual
- **Nombres propios**: Generalmente se mantienen igual
- **Acrónimos**: Pueden traducirse incorrectamente
- **Emojis/símbolos**: Se preservan

## Manejo de Errores

### Si una traducción falla:

1. Se mantiene el texto original
2. Se registra error en consola
3. Continúa con siguiente campo

### Si el script completo falla:

1. Archivo original preservado
2. Respaldo disponible en `products-backup-{timestamp}.json`
3. Restaurar manualmente si es necesario

## Ejemplos

### Antes de Auto-traducir

```json
{
  "name": {
    "es": "MEDULÓMETRO",
    "en": "MEDULÓMETRO"  ← Duplicado
  },
  "features": {
    "es": ["Microscopio digital", "Multi-especie"],
    "en": []  ← Vacío
  }
}
```

### Después de Auto-traducir

```json
{
  "name": {
    "es": "MEDULÓMETRO",
    "en": "MEDULOMETER"  ✅ Traducido
  },
  "features": {
    "es": ["Microscopio digital", "Multi-especie"],
    "en": ["Digital microscope", "Multi-species"]  ✅ Traducido
  }
}
```

## Troubleshooting

### "No hay campos por traducir"

- Todos los campos EN ya tienen contenido diferente a ES
- No hay acción necesaria

### Traducción lenta

- Normal debido a rate limiting
- No interrumpir el proceso

### Traducción incorrecta

- Editar manualmente en tab Inglés
- Guardar cambios

### Error de red

- Verificar conexión a internet
- Reintentar operación

## Roadmap Futuro

- [ ] Traducción de `specifications` (object keys)
- [ ] Traducción de `capabilities` (array)
- [ ] Soporte para más idiomas
- [ ] Cache de traducciones comunes
- [ ] Glosario de términos técnicos
- [ ] Traducción de imágenes con texto
- [ ] Integración con DeepL API (mejor calidad)

## Contacto y Soporte

Para reportar problemas o sugerencias sobre el sistema de traducción, documentar en Issues del proyecto.
