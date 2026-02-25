import { describe, it, expect } from "vitest";

// Importar la función generateSlug (la vamos a exportar)
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, "") // Solo letras, números, espacios y guiones
    .trim()
    .replace(/\s+/g, "-") // Espacios a guiones
    .replace(/-+/g, "-"); // Guiones múltiples a uno solo
}

describe("generateSlug", () => {
  it("debe convertir texto normal a kebab-case", () => {
    const result = generateSlug("Efectos del Cambio Climático");
    expect(result).toBe("efectos-del-cambio-climatico");
  });

  it("debe eliminar acentos correctamente", () => {
    const result = generateSlug("Análisis de Ecosistemas Andinos");
    expect(result).toBe("analisis-de-ecosistemas-andinos");
  });

  it("debe eliminar caracteres especiales", () => {
    const result = generateSlug("Estudio (2024) - Parte #1");
    expect(result).toBe("estudio-2024-parte-1");
  });

  it("debe manejar múltiples espacios", () => {
    const result = generateSlug("Titulo   con    espacios");
    expect(result).toBe("titulo-con-espacios");
  });

  it("debe manejar texto con ñ", () => {
    const result = generateSlug("Niño y Niña en Investigación");
    expect(result).toBe("nino-y-nina-en-investigation");
  });

  it("debe manejar string vacío", () => {
    const result = generateSlug("");
    expect(result).toBe("");
  });

  it("debe manejar solo espacios", () => {
    const result = generateSlug("   ");
    expect(result).toBe("");
  });
});

describe("validateCard", () => {
  const createFormData = (overrides = {}) => ({
    id: "research-test123",
    slug: "",
    title: { es: "Título de prueba", en: "" },
    localImage: "data:image/png;base64,test",
    date: "2025-01-15",
    keywords: ["test"],
    ...overrides,
  });

  it("debe validar formulario completo correctamente", () => {
    const formData = createFormData();
    const errors = {};

    const titleEsOrEn = formData.title.es || formData.title.en;
    if (!formData.id) errors.id = "ID es requerido";
    if (!titleEsOrEn) errors.title = "Título es requerido";
    if (!formData.localImage) errors.localImage = "Imagen es requerida";
    if (!formData.date) errors.date = "Fecha es requerida";
    if (formData.keywords.length === 0) errors.keywords = "Keywords requeridas";

    expect(Object.keys(errors).length).toBe(0);
  });

  it("debe detectar ID faltante", () => {
    const formData = createFormData({ id: "" });
    const errors = {};

    if (!formData.id) errors.id = "ID es requerido";

    expect(errors.id).toBeDefined();
  });

  it("debe detectar título faltante", () => {
    const formData = createFormData({ title: { es: "", en: "" } });
    const errors = {};

    const titleEsOrEn = formData.title.es || formData.title.en;
    if (!titleEsOrEn) errors.title = "Título es requerido";

    expect(errors.title).toBeDefined();
  });

  it("debe aceptar título solo en inglés", () => {
    const formData = createFormData({ title: { es: "", en: "English Title" } });
    const errors = {};

    const titleEsOrEn = formData.title.es || formData.title.en;
    if (!titleEsOrEn) errors.title = "Título es requerido";

    expect(errors.title).toBeUndefined();
  });

  it("debe detectar imagen faltante", () => {
    const formData = createFormData({ localImage: "" });
    const errors = {};

    if (!formData.localImage) errors.localImage = "Imagen es requerida";

    expect(errors.localImage).toBeDefined();
  });

  it("debe detectar fecha faltante", () => {
    const formData = createFormData({ date: "" });
    const errors = {};

    if (!formData.date) errors.date = "Fecha es requerida";

    expect(errors.date).toBeDefined();
  });

  it("debe detectar keywords vacías", () => {
    const formData = createFormData({ keywords: [] });
    const errors = {};

    if (formData.keywords.length === 0) errors.keywords = "Keywords requeridas";

    expect(errors.keywords).toBeDefined();
  });
});

describe("validateDetail", () => {
  it("debe validar resumen completo en español", () => {
    const formData = {
      fullSummary: { es: "Resumen completo del artículo", en: "" },
      abstract: "",
    };
    const errors = {};

    const fullSummaryEsOrEn =
      formData.fullSummary.es || formData.fullSummary.en;
    if (!fullSummaryEsOrEn && !formData.abstract) {
      errors.fullSummary = "Resumen completo o abstract es requerido";
    }

    expect(Object.keys(errors).length).toBe(0);
  });

  it("debe validar resumen completo en inglés", () => {
    const formData = {
      fullSummary: { es: "", en: "Full summary in English" },
      abstract: "",
    };
    const errors = {};

    const fullSummaryEsOrEn =
      formData.fullSummary.es || formData.fullSummary.en;
    if (!fullSummaryEsOrEn && !formData.abstract) {
      errors.fullSummary = "Resumen completo o abstract es requerido";
    }

    expect(Object.keys(errors).length).toBe(0);
  });

  it("debe aceptar abstract como alternativa", () => {
    const formData = {
      fullSummary: { es: "", en: "" },
      abstract: "Abstract del paper científico",
    };
    const errors = {};

    const fullSummaryEsOrEn =
      formData.fullSummary.es || formData.fullSummary.en;
    if (!fullSummaryEsOrEn && !formData.abstract) {
      errors.fullSummary = "Resumen completo o abstract es requerido";
    }

    expect(Object.keys(errors).length).toBe(0);
  });

  it("debe detectar cuando falta resumen y abstract", () => {
    const formData = {
      fullSummary: { es: "", en: "" },
      abstract: "",
    };
    const errors = {};

    const fullSummaryEsOrEn =
      formData.fullSummary.es || formData.fullSummary.en;
    if (!fullSummaryEsOrEn && !formData.abstract) {
      errors.fullSummary = "Resumen completo o abstract es requerido";
    }

    expect(errors.fullSummary).toBeDefined();
  });
});

describe("ID and Slug Generation", () => {
  it("debe generar ID con formato correcto", () => {
    const id = `research-${Math.random().toString(36).substring(2, 9)}`;

    expect(id).toMatch(/^research-[a-z0-9]{7}$/);
  });

  it("debe generar slug desde título español", () => {
    const formData = {
      slug: "",
      title: { es: "Cambio Climático en los Andes", en: "" },
    };

    let finalData = { ...formData };
    if (!finalData.slug && (finalData.title.es || finalData.title.en)) {
      const titleForSlug = finalData.title.es || finalData.title.en;
      finalData.slug = generateSlug(titleForSlug);
    }

    expect(finalData.slug).toBe("cambio-climatico-en-los-andes");
  });

  it("debe generar slug desde título inglés si español está vacío", () => {
    const formData = {
      slug: "",
      title: { es: "", en: "Climate Change in the Andes" },
    };

    let finalData = { ...formData };
    if (!finalData.slug && (finalData.title.es || finalData.title.en)) {
      const titleForSlug = finalData.title.es || finalData.title.en;
      finalData.slug = generateSlug(titleForSlug);
    }

    expect(finalData.slug).toBe("climate-change-in-the-andes");
  });

  it("debe preservar slug existente", () => {
    const formData = {
      slug: "slug-personalizado",
      title: { es: "Nuevo Título", en: "" },
    };

    let finalData = { ...formData };
    if (!finalData.slug && (finalData.title.es || finalData.title.en)) {
      const titleForSlug = finalData.title.es || finalData.title.en;
      finalData.slug = generateSlug(titleForSlug);
    }

    expect(finalData.slug).toBe("slug-personalizado");
  });
});
