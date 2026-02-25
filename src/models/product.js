/** Minimal product model (placeholder for future persistence) */
export function normalizeProduct(p) {
  return {
    id: p?.id || `product-${Math.random().toString(36).slice(2, 8)}`,
    name: String(p?.name || "Producto"),
    description: String(p?.description || ""),
    features: Array.isArray(p?.features) ? p.features.map(String) : [],
    order: Number(p?.order) > 0 ? Number(p.order) : 9999,
    archived: !!p?.archived,
    image: String(p?.image || ""),
  };
}
export function compareByOrder(a, b) {
  if (!!a.archived && !b.archived) return 1;
  if (!a.archived && !!b.archived) return -1;
  return (a.order ?? 9999) - (b.order ?? 9999);
}
export function normalizeProductOrder(list) {
  const arr = Array.isArray(list) ? [...list] : [];
  const actives = arr
    .filter((x) => !x.archived)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  actives.forEach((it, i) => (it.order = i + 1));
  const map = new Map(actives.map((x) => [x.id, x]));
  return arr.map((x) => (x.archived ? x : map.get(x.id) || x));
}
