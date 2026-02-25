#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const POSTS_PATH = path.join(
  ROOT,
  "public",
  "assets",
  "images",
  "investigation",
  "posts.json"
);
const REPORT_DIR = path.join(ROOT, "reports");
fs.mkdirSync(REPORT_DIR, { recursive: true });

const posts = JSON.parse(fs.readFileSync(POSTS_PATH, "utf8"));
const rows = [];
let doi = 0,
  pdf = 0,
  author = 0;
for (const p of posts) {
  const hasDOI = !!(p.download_link_DOI && String(p.download_link_DOI).trim());
  const hasPDF = !!(p.download_link_pdf && String(p.download_link_pdf).trim());
  const hasAuthor = !!(
    p.author &&
    ((Array.isArray(p.author) && p.author.length) ||
      (!Array.isArray(p.author) && String(p.author).trim()))
  );
  if (hasDOI) doi++;
  if (hasPDF) pdf++;
  if (hasAuthor) author++;
  rows.push({
    slug: p.slug,
    title: p.title,
    journal: p.journal,
    year: new Date(p.date).getFullYear(),
    hasDOI,
    hasPDF,
    hasAuthor,
    doi: p.download_link_DOI || "",
    pdf: p.download_link_pdf || "",
    author: Array.isArray(p.author) ? p.author.join("; ") : p.author || "",
  });
}

const csvHeader =
  "slug,title,journal,year,hasDOI,hasPDF,hasAuthor,doi,pdf,author";
const csv = [
  csvHeader,
  ...rows.map((r) =>
    [
      r.slug,
      JSON.stringify(r.title),
      JSON.stringify(r.journal),
      r.year,
      r.hasDOI,
      r.hasPDF,
      r.hasAuthor,
      JSON.stringify(r.doi),
      JSON.stringify(r.pdf),
      JSON.stringify(r.author),
    ].join(",")
  ),
].join("\n");

const mdLines = [
  "# Publicaciones - Estado de Metadatos",
  "",
  `- Total: ${posts.length}`,
  `- DOI: ${doi}/${posts.length}`,
  `- PDF: ${pdf}/${posts.length}`,
  `- Autor: ${author}/${posts.length}`,
  "",
  "| Año | Journal | Título | DOI | Autor | PDF |",
  "| --- | --- | --- | --- | --- | --- |",
  ...rows.map(
    (r) =>
      `| ${r.year} | ${r.journal} | ${r.title} | ${r.hasDOI ? "✓" : "✗"} | ${
        r.hasAuthor ? "✓" : "✗"
      } | ${r.hasPDF ? "✓" : "✗"} |`
  ),
];

const outCsv = path.join(REPORT_DIR, "publications_report.csv");
const outMd = path.join(REPORT_DIR, "publications_report.md");
fs.writeFileSync(outCsv, csv);
fs.writeFileSync(outMd, mdLines.join("\n"));

console.log("CSV:", outCsv);
console.log("MD :", outMd);
