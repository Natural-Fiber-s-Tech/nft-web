/**
 * Utilidades comunes para operaciones CRUD en el CMS Admin
 *
 * Estas funciones proporcionan una lógica consistente para:
 * - Normalización de orden (sin gaps en números de orden)
 * - Inserción/actualización de elementos con reordenamiento automático
 * - Restauración de elementos archivados
 * - Archivado de elementos con preservación de orden
 */

/**
 * Normaliza el orden de elementos activos para que sean consecutivos (1, 2, 3...)
 * Los elementos archivados mantienen su orden original pero no se renumeran
 *
 * @param {Array} list - Lista de elementos con propiedades { id, order, archived, ... }
 * @returns {Array} - Lista con orden normalizado
 */
export function normalizeOrder(list) {
  const arr = Array.isArray(list) ? [...list] : [];

  // Separar activos y archivados
  const active = arr
    .filter((r) => !r.archived)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Renumerar activos consecutivamente
  const updatedActive = active.map((item, idx) => ({
    ...item,
    order: idx + 1,
  }));

  // Los archivados mantienen su orden original
  const archived = arr.filter((r) => r.archived);

  // Retornar activos + archivados
  return [...updatedActive, ...archived];
}

/**
 * Lógica para guardar/actualizar un elemento con reordenamiento inteligente
 *
 * Casos manejados:
 * 1. Si el elemento está archivado: agregarlo sin desplazar nada
 * 2. Si es nuevo o se cambia de orden: insertar en la posición target y desplazar el resto
 *
 * @param {Array} currentRows - Estado actual de la lista
 * @param {Object} payload - Elemento a guardar/actualizar
 * @returns {Array} - Nueva lista normalizada
 */
export function upsertWithReorder(currentRows, payload) {
  // Eliminar el elemento si ya existe (para actualización)
  const others = currentRows.filter((r) => r.id !== payload.id);
  const compact = normalizeOrder(others);

  // Si está archivado, solo agregarlo sin desplazar
  if (payload.archived) {
    return normalizeOrder([...compact, payload]);
  }

  // Calcular posición target dentro del rango válido
  const active = compact.filter((x) => !x.archived);
  const activeCount = active.length;
  const req = Number(payload.order) || activeCount + 1;
  const target = Math.max(1, Math.min(req, activeCount + 1));

  // Desplazar elementos con order >= target
  const shifted = compact.map((r) => {
    if (!r.archived && Number(r.order) >= target) {
      return { ...r, order: Number(r.order) + 1 };
    }
    return r;
  });

  // Agregar el nuevo/actualizado en la posición target
  const next = [...shifted, { ...payload, archived: false, order: target }];

  return normalizeOrder(next);
}

/**
 * Lógica para restaurar un elemento archivado
 *
 * @param {Array} currentRows - Estado actual de la lista
 * @param {Object} toRestore - Elemento a restaurar
 * @returns {Array} - Nueva lista normalizada
 */
export function restoreItem(currentRows, toRestore) {
  const compact = normalizeOrder(currentRows);
  const active = compact.filter((x) => !x.archived);
  const max = Math.max(0, ...active.map((x) => Number(x.order) || 0));

  // Calcular posición solicitada (dentro del rango válido)
  const req = Math.max(
    1,
    Math.min(Number(toRestore.order) || max + 1, max + 1)
  );

  // Desplazar elementos activos con order >= req
  const shifted = compact.map((r) => {
    if (!r.archived && Number(r.order) >= req) {
      return { ...r, order: Number(r.order) + 1 };
    }
    return r;
  });

  // Actualizar el elemento a restaurar
  const next = shifted.map((r) =>
    r.id === toRestore.id ? { ...r, archived: false, order: req } : r
  );

  return normalizeOrder(next);
}

/**
 * Lógica para archivar un elemento
 *
 * @param {Array} currentRows - Estado actual de la lista
 * @param {Object} toArchive - Elemento a archivar
 * @returns {Array} - Nueva lista normalizada
 */
export function archiveItem(currentRows, toArchive) {
  const next = currentRows.map((r) =>
    r.id === toArchive.id ? { ...r, archived: true } : r
  );

  return normalizeOrder(next);
}

/**
 * Utilidad para asegurar que un payload tenga todos los campos necesarios
 *
 * @param {Object} formData - Datos del formulario
 * @param {Object} original - Elemento original (si existe)
 * @returns {Object} - Payload con todos los campos necesarios
 */
export function ensurePayloadFields(formData, original = null) {
  return {
    ...formData,
    // Si es edición, preservar el ID original
    id: formData.id || original?.id || formData.slug,
    // Asegurar que order sea número
    order: Number(formData.order) || 0,
    // Asegurar que archived sea booleano
    archived: Boolean(formData.archived),
  };
}

/**
 * Calcula el rango válido para el campo "orden" según el contexto
 *
 * @param {Array} currentRows - Lista actual de elementos
 * @param {string} mode - Modo: 'create' | 'edit' | 'restore'
 * @param {Object} currentItem - Elemento actual (para edit/restore)
 * @returns {Object} - { min: number, max: number, activeCount: number }
 */
export function getOrderRange(currentRows, mode, currentItem = null) {
  const active = currentRows.filter((x) => !x.archived);
  const activeCount = active.length;

  if (mode === "create") {
    // Crear: puede ir del 1 hasta el total de activos + 1
    return { min: 1, max: activeCount + 1, activeCount };
  }

  if (mode === "restore") {
    // Restaurar: puede ir del 1 hasta el total de activos + 1
    return { min: 1, max: activeCount + 1, activeCount };
  }

  if (mode === "edit") {
    // Editar activo: puede ir del 1 hasta el total de activos
    const isArchived = currentItem?.archived || false;
    if (isArchived) {
      // Si está archivado pero se está "editando", comportarse como restore
      return { min: 1, max: activeCount + 1, activeCount };
    }
    return { min: 1, max: activeCount, activeCount };
  }

  // Fallback
  return { min: 1, max: activeCount || 1, activeCount: activeCount || 0 };
}

/**
 * Valida el campo "orden" según el contexto
 *
 * @param {number|string} order - Valor del orden a validar
 * @param {Array} currentRows - Lista actual de elementos
 * @param {string} mode - Modo: 'create' | 'edit' | 'restore'
 * @param {Object} currentItem - Elemento actual (para edit/restore)
 * @returns {Object} - { valid: boolean, error: string|null, min: number, max: number }
 */
export function validateOrder(order, currentRows, mode, currentItem = null) {
  const { min, max } = getOrderRange(currentRows, mode, currentItem);

  // Verificar que sea un número
  const num = Number(order);
  if (isNaN(num)) {
    return {
      valid: false,
      error: `Debe ser un número entero entre ${min} y ${max}`,
      min,
      max,
    };
  }

  // Verificar que sea entero
  if (!Number.isInteger(num)) {
    return {
      valid: false,
      error: `Debe ser un número entero (sin decimales) entre ${min} y ${max}`,
      min,
      max,
    };
  }

  // Verificar que esté en el rango
  if (num < min || num > max) {
    return {
      valid: false,
      error: `El orden debe estar entre ${min} y ${max}`,
      min,
      max,
    };
  }

  return {
    valid: true,
    error: null,
    min,
    max,
  };
}
