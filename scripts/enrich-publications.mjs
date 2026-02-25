#!/usr/bin/env node
/**
 * Enrich posts.json using Crossref (DOI, authors, PDF) and optionally Unpaywall for open-access PDFs.
 *
 * Usage:
 *   node scripts/enrich-publications.mjs --email you@example.com --limit 50 --dry
 *
 * Notes:
 * - Requires Node 18+ (global fetch). If not available, install node 18+.
 * - Creates a backup file next to posts.json before writing.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const POSTS_PATH = path.join(
  ROOT,
  "public",
  "assets",
  "images",
  "investigation",
  "posts.json"
);
const PDF_DIR = path.join(
  ROOT,
  "public",
  "assets",
  "images",
  "investigation",
  "pdf"
);

// Parse args
const args = process.argv.slice(2);
const getArg = (name, def = undefined) => {
  const i = args.findIndex(
    (a) => a === `--${name}` || a.startsWith(`--${name}=`)
  );
  if (i === -1) return def;
  const eq = args[i].indexOf("=");
  if (eq !== -1) return args[i].slice(eq + 1);
  return args[i + 1] ?? def;
};

const UNPAYWALL_EMAIL = getArg("email", process.env.UNPAYWALL_EMAIL);
const LIMIT = Number(getArg("limit", "0")) || 0; // 0 = no limit
const DRY_RUN = Boolean(args.find((a) => a === "--dry" || a === "--dry-run"));
const FORCE_DOWNLOAD = Boolean(
  args.find((a) => a === "--force" || a === "--download" || a === "--pdf")
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const normalize = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenSetSim = (a, b) => {
  const A = new Set(normalize(a).split(" "));
  const B = new Set(normalize(b).split(" "));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / Math.max(A.size, B.size);
};

const pickBestCrossref = (title, items = []) => {
  let best = null;
  let bestScore = 0;
  for (const it of items) {
    const t = Array.isArray(it.title) ? it.title[0] : it.title;
    const score = tokenSetSim(title, t);
    if (score > bestScore) {
      best = it;
      bestScore = score;
    }
  }
  return { best, score: bestScore };
};

const crossrefLookup = async (title) => {
  const url = `https://api.crossref.org/works?rows=10&query.bibliographic=${encodeURIComponent(
    title
  )}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "fiberstech-enrich/1.0 (mailto:bot@fiberstech.com)",
    },
  });
  if (!res.ok) throw new Error(`Crossref ${res.status}`);
  const json = await res.json();
  const items = json?.message?.items || [];
  const { best, score } = pickBestCrossref(title, items);
  if (!best) return null;
  return { item: best, score };
};

const unpaywallLookup = async (doi) => {
  if (!UNPAYWALL_EMAIL) return null;
  const url = `https://api.unpaywall.org/v2/${encodeURIComponent(
    doi
  )}?email=${encodeURIComponent(UNPAYWALL_EMAIL)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const oa = json?.oa_location || json?.best_oa_location;
  const pdf = oa?.url_for_pdf || oa?.url;
  return { pdf };
};

const toAuthors = (crAuthors = []) =>
  (crAuthors || [])
    .map((a) => `${a?.given ?? ""} ${a?.family ?? ""}`.trim())
    .filter(Boolean);

const extractFromHtml = (html, baseUrl) => {
  const out = { doi: null, authors: [], pdf: null };
  // 1) meta citation_author (múltiples)
  const authorMetaRegex =
    /<meta[^>]*name=["']citation_author["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = authorMetaRegex.exec(html))) {
    const name = m[1].trim();
    if (name) out.authors.push(name);
  }
  // 1b) meta citation_pdf_url
  const pdfMeta = html.match(
    /<meta[^>]*name=["']citation_pdf_url["'][^>]*content=["']([^"']+)["'][^>]*>/i
  );
  if (pdfMeta) {
    try {
      out.pdf = new URL(pdfMeta[1].trim(), baseUrl).toString();
    } catch {}
  }
  // 2) meta citation_doi
  const doiMeta = html.match(
    /<meta[^>]*name=["']citation_doi["'][^>]*content=["']([^"']+)["'][^>]*>/i
  );
  if (doiMeta) out.doi = `https://doi.org/${doiMeta[1].trim()}`;
  // 3) Enlaces a doi.org
  if (!out.doi) {
    const doiLink = html.match(/https?:\/\/doi\.org\/[\w\/.\-()]+/i);
    if (doiLink) out.doi = doiLink[0];
  }
  // 4) JSON-LD con author
  const ldBlocks = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];
  for (const [, jsonText] of ldBlocks) {
    try {
      const json = JSON.parse(jsonText);
      const author = json?.author || json?.authors;
      if (author) {
        const list = Array.isArray(author) ? author : [author];
        for (const a of list) {
          const name = typeof a === "string" ? a : a?.name;
          if (name) out.authors.push(name);
        }
      }
    } catch {}
  }
  // 5) PDF enlaces
  const pdfMatch = html.match(/href=\"([^\"]+\.pdf)\"/i);
  if (pdfMatch) {
    const url = new URL(pdfMatch[1], baseUrl);
    out.pdf = url.toString();
  }
  // Deduplicate authors
  out.authors = [...new Set(out.authors.filter(Boolean))];
  return out;
};

const isHttp = (u) => typeof u === "string" && /^https?:\/\//i.test(u);
const localPdfPathFor = (slug) =>
  `/assets/images/investigacion/pdf/${slug}.pdf`;
const localPdfFsPathFor = (slug) => path.join(PDF_DIR, `${slug}.pdf`);

const run = async () => {
  const raw = fs.readFileSync(POSTS_PATH, "utf8");
  const posts = JSON.parse(raw);
  const updated = [...posts];

  let processed = 0;
  let dl = 0,
    skipped = 0,
    missing = 0;
  for (let i = 0; i < updated.length; i++) {
    const p = updated[i];
    const needsDOI = !p.download_link_DOI;
    const needsPDF = !p.download_link_pdf;
    const needsAuthors =
      !p.author || (Array.isArray(p.author) && p.author.length === 0);
    if (!needsDOI && !needsPDF && !needsAuthors) continue;

    try {
      // Normalizar href: si apunta a fiberstech.com, usar localhost:8080
      const normalizedHref = (() => {
        if (!p.href) return undefined;
        try {
          const u = new URL(p.href);
          if (u.hostname.includes("fiberstech.com")) {
            return `http://localhost:8080${u.pathname}${u.search}`;
          }
          return p.href;
        } catch {
          return p.href;
        }
      })();

      const lookup = await crossrefLookup(p.title);
      if (lookup && lookup.score >= 0.5) {
        const cr = lookup.item;
        const doi = cr.DOI ? `https://doi.org/${cr.DOI}` : p.download_link_DOI;
        const authors = toAuthors(cr.author);
        const pdfFromCR = (cr.link || []).find(
          (l) =>
            (l["content-type"] || "").includes("pdf") ||
            (l.URL || "").endsWith(".pdf")
        )?.URL;

        if (needsDOI && doi) p.download_link_DOI = doi;
        if (needsAuthors && authors.length) p.author = authors;
        if (needsPDF && pdfFromCR) p.download_link_pdf = pdfFromCR;

        if (needsPDF && !p.download_link_pdf && doi) {
          const upw = await unpaywallLookup(cr.DOI);
          if (upw?.pdf) p.download_link_pdf = upw.pdf;
        }
      }
      // Complementar con scrape de la página original si se tiene href
      let extra = { doi: null, authors: [], pdf: null };
      if ((needsDOI || needsPDF || needsAuthors) && normalizedHref) {
        try {
          const resp = await fetch(normalizedHref, {
            headers: { "User-Agent": "fiberstech-enrich/1.0" },
          });
          if (resp.ok) {
            const html = await resp.text();
            extra = extractFromHtml(html, normalizedHref);
            if (needsDOI && extra.doi && !p.download_link_DOI)
              p.download_link_DOI = extra.doi;
            if (
              needsAuthors &&
              extra.authors.length &&
              (!p.author || p.author.length === 0)
            )
              p.author = extra.authors;
            if (
              extra.pdf &&
              (!p.download_link_pdf || isHttp(p.download_link_pdf))
            )
              p.download_link_pdf = extra.pdf;
          }
        } catch {}
      }

      // Determinar URL remota candidata del PDF
      let pdfSource = null;
      if (isHttp(p.download_link_pdf)) pdfSource = p.download_link_pdf;
      if (!pdfSource && extra.pdf) pdfSource = extra.pdf;
      if (!pdfSource && lookup && lookup.item) {
        const cr = lookup.item;
        const fromCR = (cr.link || []).find(
          (l) =>
            (l["content-type"] || "").includes("pdf") ||
            (l.URL || "").endsWith(".pdf")
        )?.URL;
        if (fromCR) pdfSource = fromCR;
        if (!pdfSource && cr.DOI) {
          const upw = await unpaywallLookup(cr.DOI);
          if (upw?.pdf) pdfSource = upw.pdf;
        }
      }
      if (!pdfSource && p.download_link_DOI) {
        const doiClean = p.download_link_DOI.replace(
          /https?:\/\/doi\.org\//i,
          ""
        );
        const upw = await unpaywallLookup(doiClean);
        if (upw?.pdf) pdfSource = upw.pdf;
      }

      // Descargar archivo local si hay fuente o si el archivo local no existe y se puede resolver una
      if (!DRY_RUN) {
        fs.mkdirSync(PDF_DIR, { recursive: true });
        const destFs = localPdfFsPathFor(p.slug);
        const destExists = fs.existsSync(destFs);
        const shouldDownload = pdfSource && (!destExists || FORCE_DOWNLOAD);
        if (shouldDownload) {
          try {
            const res = await fetch(pdfSource);
            if (res.ok) {
              const buf = Buffer.from(await res.arrayBuffer());
              fs.writeFileSync(destFs, buf);
              p.download_link_pdf = localPdfPathFor(p.slug);
              dl++;
              console.log(`PDF descargado en: ${destFs}`);
            }
          } catch (e) {
            console.warn(
              `No se pudo descargar PDF para ${p.slug}: ${e.message}`
            );
          }
        } else if (destExists && !FORCE_DOWNLOAD) {
          skipped++;
          console.log(`PDF ya existe, omitido: ${destFs}`);
        } else if (!destExists && (!pdfSource || !isHttp(pdfSource))) {
          missing++;
          console.warn(
            `No se encontró URL de PDF para ${p.slug}. href= ${p.href || "N/A"}`
          );
        }
      }
    } catch (e) {
      console.warn(`Lookup fallido para "${p.title}"`, e.message);
    }

    processed++;
    if (LIMIT && processed >= LIMIT) break;
    await sleep(500); // rate-limit agradable
  }

  const changes = JSON.stringify(updated, null, 2);
  if (DRY_RUN) {
    console.log("\n--- Dry run, sin escribir archivo. Vista previa ---\n");
    console.log(
      changes.slice(0, 2000) + (changes.length > 2000 ? "\n... (truncado)" : "")
    );
    return;
  }

  const backupPath = POSTS_PATH.replace(
    /posts\.json$/,
    `posts.backup.${new Date().toISOString().slice(0, 10)}.json`
  );
  fs.writeFileSync(backupPath, raw);
  fs.writeFileSync(POSTS_PATH, changes);
  console.log(`\nActualizado ${POSTS_PATH}`);
  console.log(`Backup creado en ${backupPath}`);
  console.log(
    `Resumen PDF -> descargados: ${dl}, omitidos: ${skipped}, sin-fuente: ${missing}`
  );
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
