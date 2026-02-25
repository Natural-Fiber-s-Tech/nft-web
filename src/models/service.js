/**
 * Service model helpers
 * Normalizes admin/public service objects and enforces required fields.
 */

/**
 * @typedef {Object} LocalizedText
 * @property {string} es
 * @property {string} [en]
 */

/**
 * @typedef {Object} LocalizedArray
 * @property {string[]} es
 * @property {string[]} [en]
 */

/**
 * @typedef {Object} Service
 * @property {string} id
 * @property {string} icon
 * @property {LocalizedText} title
 * @property {LocalizedText} description
 * @property {LocalizedArray} features
 * @property {number} order
 * @property {boolean} archived
 * @property {string} whatsapp
 */

/**
 * Normalize a raw service-like object into a Service
 * @param {any} s
 * @returns {Service}
 */
export function normalizeService(s) {
  const id = s?.id || `service-${Math.random().toString(36).slice(2, 8)}`;
  const titleEs = (s?.title?.es ?? s?.title ?? "").toString();
  const titleEn = (s?.title?.en ?? "").toString();
  const descEs = (s?.description?.es ?? s?.description ?? "").toString();
  const descEn = (s?.description?.en ?? "").toString();
  const featsEs = Array.isArray(s?.features?.es)
    ? s.features.es.map((x) => String(x)).filter(Boolean)
    : Array.isArray(s?.features)
    ? s.features.map((x) => String(x)).filter(Boolean)
    : [];
  const featsEn = Array.isArray(s?.features?.en)
    ? s.features.en.map((x) => String(x)).filter(Boolean)
    : [];
  const order = Number(s?.order) > 0 ? Number(s.order) : 9999;
  const archived = !!s?.archived;
  const whatsapp = (s?.whatsapp || "51988496839").toString();
  const icon = (s?.icon || "Brain").toString();
  return {
    id,
    icon,
    title: { es: titleEs, en: titleEn || titleEs },
    description: { es: descEs, en: descEn || descEs },
    features: { es: featsEs, en: featsEn.length ? featsEn : featsEs },
    order,
    archived,
    whatsapp,
  };
}

/**
 * Compare services by order ASC, archived last
 */
export function compareByOrder(a, b) {
  if (!!a.archived && !b.archived) return 1;
  if (!a.archived && !!b.archived) return -1;
  return (a.order ?? 9999) - (b.order ?? 9999);
}

/**
 * Ensure active items have contiguous order 1..N
 * @param {Service[]} list
 * @returns {Service[]}
 */
export function normalizeServiceOrder(list) {
  const arr = Array.isArray(list) ? [...list] : [];
  const actives = arr
    .filter((x) => !x.archived)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  actives.forEach((it, i) => (it.order = i + 1));
  const map = new Map(actives.map((x) => [x.id, x]));
  return arr.map((x) => (x.archived ? x : map.get(x.id) || x));
}
