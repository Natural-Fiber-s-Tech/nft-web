/** Minimal research/publication model */
export function normalizeResearch(r) {
  return {
    id: r?.id || `pub-${Math.random().toString(36).slice(2, 8)}`,
    title: String(r?.title || ""),
    abstract: String(r?.abstract || ""),
    url: String(r?.url || ""),
    pdf: String(r?.pdf || ""),
    order: Number(r?.order) > 0 ? Number(r.order) : 9999,
    archived: !!r?.archived,
    year: Number(r?.year) || undefined,
  };
}
export function compareByOrder(a, b) {
  if (!!a.archived && !b.archived) return 1;
  if (!a.archived && !!b.archived) return -1;
  return (a.order ?? 9999) - (b.order ?? 9999);
}
export function normalizeResearchOrder(list) {
  const arr = Array.isArray(list) ? [...list] : [];
  const actives = arr
    .filter((x) => !x.archived)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  actives.forEach((it, i) => (it.order = i + 1));
  const map = new Map(actives.map((x) => [x.id, x]));
  return arr.map((x) => (x.archived ? x : map.get(x.id) || x));
}
