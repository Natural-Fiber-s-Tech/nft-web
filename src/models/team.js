/** Team model */
export function normalizeTeamMember(m) {
  // Helper para normalizar campos bilingües
  const normalizeBilingual = (raw, fallback = "") => {
    if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
      // Ya es bilingüe {es, en}
      return {
        es: String(raw.es || raw.en || fallback),
        en: String(raw.en || raw.es || fallback),
      };
    }
    // Legacy: string simple → duplicar a ambos idiomas
    const str = String(raw || fallback);
    return { es: str, en: str };
  };

  // Helper para normalizar skills bilingües
  const normalizeSkills = (raw) => {
    // Si ya es objeto bilingüe {es: [], en: []}
    if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
      return {
        es: Array.isArray(raw.es)
          ? raw.es.map((s) => String(s).trim()).filter(Boolean)
          : [],
        en: Array.isArray(raw.en)
          ? raw.en.map((s) => String(s).trim()).filter(Boolean)
          : [],
      };
    }

    // Si es array simple (legacy)
    if (Array.isArray(raw)) {
      const normalized = raw.map((s) => String(s).trim()).filter(Boolean);
      return { es: normalized, en: normalized };
    }

    // Si es string (legacy)
    if (typeof raw === "string") {
      const normalized = raw
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);
      return { es: normalized, en: normalized };
    }

    // Vacío
    return { es: [], en: [] };
  };

  return {
    id: m?.id || `team-${Math.random().toString(36).slice(2, 8)}`,
    name: normalizeBilingual(m?.name, ""),
    role: normalizeBilingual(m?.role ?? m?.position, ""),
    bio: normalizeBilingual(m?.bio, ""),
    photo: String(m?.photo ?? m?.image ?? ""),
    src_cv_pdf: String(m?.src_cv_pdf || ""),
    link_bio: String(m?.link_bio || ""),
    skills: normalizeSkills(m?.skills),
    order: Number(m?.order) > 0 ? Number(m.order) : 9999,
    archived: !!m?.archived,
  };
}
export function compareByOrder(a, b) {
  if (!!a.archived && !b.archived) return 1;
  if (!a.archived && !!b.archived) return -1;
  return (a.order ?? 9999) - (b.order ?? 9999);
}
export function normalizeTeamOrder(list) {
  const arr = Array.isArray(list) ? [...list] : [];
  const actives = arr
    .filter((x) => !x.archived)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Create updated active items WITHOUT MUTATION
  const updatedActives = actives.map((it, i) => ({
    ...it,
    order: i + 1,
  }));

  const map = new Map(updatedActives.map((x) => [x.id, x]));
  return arr.map((x) => (x.archived ? x : map.get(x.id) || x));
}
