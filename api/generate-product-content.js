// generate-product-content.js
// Endpoint: recibe un PDF (ES), produce JSON bilingüe listo para Card/Detalle.
// Modelo: gemini-2.5-flash-lite
import fs from "fs";
import path from "path";
import formidable from "formidable";
import pdfParse from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL_ID = "gemini-2.5-flash-lite";

// ---------- helpers ----------
const readPdfText = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const { text } = await pdfParse(dataBuffer);
  return text;
};

const normalize = (s) =>
  s
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n+ */g, "\n")
    .trim();

const sectionize = (raw) => {
  const t = normalize(raw);

  // Detección de cabeceras frecuentes en tus fichas (ES)
  const sections = {
    titulo: t.split("\n")[0]?.slice(0, 120) || "",
    funcionalidad: "",
    especificaciones: "",
    sistemas: "",
    otros: "",
  };

  // Cortes aproximados por encabezados comunes
  const idxFunc = t.search(/\bFUNCIONALIDAD\b/i);
  const idxEspec = t.search(/\bESPECIFICACIONES\b/i);
  const idxSist = t.search(/\bSISTEMAS?\b/i);

  const end = t.length;

  const slice = (start, stop) => (start >= 0 ? t.slice(start, stop) : "");

  sections.funcionalidad = slice(
    idxFunc,
    idxEspec > -1 ? idxEspec : idxSist > -1 ? idxSist : end
  );
  sections.especificaciones = slice(idxEspec, idxSist > -1 ? idxSist : end);
  sections.sistemas = slice(idxSist, end);

  // Resto (intro/beneficios)
  const minStart = Math.min(
    ...[idxFunc, idxEspec, idxSist].filter((i) => i > -1)
  );
  sections.otros =
    minStart > 0 ? t.slice(0, minStart) : t.slice(0, Math.min(4000, end));

  // Limitar por sección manteniendo señales (para modelos ligeros)
  const clamp = (s, max) => (s.length > max ? s.slice(0, max) : s);
  return {
    ...sections,
    funcionalidad: clamp(sections.funcionalidad, 12000),
    especificaciones: clamp(sections.especificaciones, 8000),
    sistemas: clamp(sections.sistemas, 6000),
    otros: clamp(sections.otros, 6000),
  };
};

const buildPrompt = ({ productSlug, capabilitiesTarget, pdfSections }) => {
  const pdfText = [
    pdfSections.titulo,
    "\n\nSECCIÓN: INTRO/OTROS\n",
    pdfSections.otros,
    "\n\nSECCIÓN: FUNCIONALIDAD\n",
    pdfSections.funcionalidad,
    "\n\nSECCIÓN: ESPECIFICACIONES\n",
    pdfSections.especificaciones,
    "\n\nSECCIÓN: SISTEMAS\n",
    pdfSections.sistemas,
  ]
    .join("")
    .trim();

  // Reuso literal del prompt maestro (arriba), con interpolaciones:
  return `
ROLE: You are an extraction and structuring engine. You read a single Spanish PDF text about ONE product and output a bilingual, UX-ready JSON for two front-end views (Card/Detail). Do not add Markdown. Output JSON ONLY.

GROUNDING RULES (very strict):
- Use ONLY facts present in the PDF text below. Do NOT invent specs, features, or numbers.
- If a field truly has no support in the PDF, omit that key OR leave it empty ("") but keep array sizes when required.
- Prefer measurable/technical phrasing over marketing fluff.

UX DEFINITIONS:
- features (Card): EXACTLY 4 short phrases (3–6 words) capturing WHAT the product does / measures / outputs (not benefits). No punctuation at the end.
- featuresDetail (Detail): EXACTLY 4 objects, same order as features. Each object:
  - title: 1–2 words related to the corresponding feature_i (title ≠ the full feature_i text)
  - description: 10–22 words that explain HOW/WHAT with a concrete, technical angle (no benefits).
- capabilities: operational BENEFITS. Size MUST be ${capabilitiesTarget}. Do not repeat features textually.
- specifications: pick 4–6 key comparable specs (peso, dimensiones, alimentación, sensores/cámara, garantía, materiales, sistemas, etc.). Keys concise.

BILINGUAL REQUIREMENT:
- Provide ES and EN for ALL user-facing fields. If the PDF is only in Spanish, translate to English faithfully.

OUTPUT SHAPE (JSON ONLY):
{
  "name": { "es": "", "en": "" },
  "category": { "es": "", "en": "" },
  "tagline": { "es": "", "en": "" },
  "description": { "es": "", "en": "" },
  "descriptionDetail": { "es": "", "en": "" },
  "features": { "es": ["", "", "", ""], "en": ["", "", "", ""] },
  "featuresDetail": {
    "es": [{ "title": "", "description": "" }, { "title": "", "description": "" }, { "title": "", "description": "" }, { "title": "", "description": "" }],
    "en": [{ "title": "", "description": "" }, { "title": "", "description": "" }, { "title": "", "description": "" }, { "title": "", "description": "" }]
  },
  "specifications": { "es": { "": "", "": "", "": "", "": "" }, "en": { "": "", "": "", "": "", "": "" } },
  "capabilities": { "es": ["", "", "", ${
    capabilitiesTarget > 4
      ? '"",'.repeat(capabilitiesTarget - 4).slice(0, -1)
      : ""
  }], "en": ["", "", "", ${
    capabilitiesTarget > 4
      ? '"",'.repeat(capabilitiesTarget - 4).slice(0, -1)
      : ""
  }] }
}

CONSTRAINTS:
- features.length == 4; featuresDetail.length == 4; capabilities.length == ${capabilitiesTarget}.
- featuresDetail[i].title is a 1–2 word label derived from features[i] (not identical copy).
- Numbers/units must match the PDF exactly.

CHECKLIST BEFORE EMITTING:
- [ ] 4 features (3–6 words each).
- [ ] 4 featuresDetail mapped 1–1 (titles 1–2 words, descriptions 10–22 words).
- [ ] ${capabilitiesTarget} capabilities (benefits), non-redundant.
- [ ] 4–6 concise specs.
- [ ] ES/EN for all user-facing fields.

PDF TEXT (Spanish, source-of-truth) for ${productSlug}:
<<<BEGIN>>>
${pdfText}
<<<END>>>`;
};

// Valida estructura mínima exigida
const validateStructured = (o, capabilitiesTarget) => {
  try {
    if (!o || typeof o !== "object") return "Empty or non-object";
    const reqTop = [
      "name",
      "category",
      "tagline",
      "description",
      "descriptionDetail",
      "features",
      "featuresDetail",
      "specifications",
      "capabilities",
    ];
    for (const k of reqTop) if (!(k in o)) return `Missing key: ${k}`;

    const must4 = (arr) => Array.isArray(arr) && arr.length === 4;
    if (!must4(o.features?.es) || !must4(o.features?.en))
      return "features must be 4/4";
    if (!must4(o.featuresDetail?.es) || !must4(o.featuresDetail?.en))
      return "featuresDetail must be 4/4";
    if (
      !Array.isArray(o.capabilities?.es) ||
      o.capabilities.es.length !== capabilitiesTarget
    )
      return "capabilities.es wrong size";
    if (
      !Array.isArray(o.capabilities?.en) ||
      o.capabilities.en.length !== capabilitiesTarget
    )
      return "capabilities.en wrong size";

    // titles 1–2 words
    const allTitles = [
      ...o.featuresDetail.es.map((x) => x.title),
      ...o.featuresDetail.en.map((x) => x.title),
    ];
    if (allTitles.some((t) => !t || t.split(/\s+/).length > 2))
      return "featuresDetail.title must be 1–2 words";

    return null; // ok
  } catch {
    return "validation error";
  }
};

// ---------- HTTP handler ----------
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let tempFilePath = null;
  try {
    // 1) Parse multipart (PDF)
    const form = formidable({ multiples: false, keepExtensions: true });
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, flds, fls) =>
        err ? reject(err) : resolve({ fields: flds, files: fls })
      );
    });

    const productSlug = fields.productSlug?.toString() || "producto";
    const capabilitiesTarget = Number(fields.capabilitiesTarget || 4);
    const file = files?.pdf;
    if (!file?.filepath) {
      return res
        .status(400)
        .json({ error: "PDF file is required (field name: pdf)" });
    }
    tempFilePath = file.filepath;

    // 2) Extraer texto y seccionarlo
    const rawText = await readPdfText(tempFilePath);
    const pdfSections = sectionize(rawText);

    // 3) Primera llamada al modelo
    const prompt = buildPrompt({
      productSlug,
      capabilitiesTarget,
      pdfSections,
    });
    const model = genAI.getGenerativeModel({ model: MODEL_ID });
    const first = await model.generateContent([{ text: prompt }]);
    const firstText = first.response.text().trim();

    // A veces el modelo devuelve ```json ... ```
    const strip = (s) => s.replace(/^```json\s*|\s*```$/g, "");
    let parsed;
    try {
      parsed = JSON.parse(strip(firstText));
    } catch (e) {
      // Intentar recuperar JSON interno
      const m = firstText.match(/\{[\s\S]*\}$/);
      parsed = m ? JSON.parse(m[0]) : null;
    }

    let errMsg = validateStructured(parsed, capabilitiesTarget);
    if (errMsg) {
      // 4) Reintento ÚNICO con mensaje correctivo
      const corrective = `
The previous output violated: ${errMsg}.
Re-generate STRICTLY following all constraints. Output JSON ONLY.`;
      const second = await model.generateContent([
        { text: prompt + "\n\n" + corrective },
      ]);
      const secondText = second.response.text().trim();
      try {
        parsed = JSON.parse(strip(secondText));
      } catch (e) {
        const m = secondText.match(/\{[\s\S]*\}$/);
        parsed = m ? JSON.parse(m[0]) : null;
      }
      errMsg = validateStructured(parsed, capabilitiesTarget);
      if (errMsg) {
        return res
          .status(422)
          .json({
            error: "Model output invalid after retry",
            detail: errMsg,
            raw: secondText,
          });
      }
    }

    // 5) Responder JSON final
    return res.status(200).json({
      success: true,
      productSlug,
      content: parsed,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Internal error" });
  } finally {
    // 6) Limpieza segura SOLO si existe archivo temporal
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {}
    }
  }
}
