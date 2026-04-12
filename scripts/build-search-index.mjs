/**
 * Genera search-index.json a partir de los HTML de documentación.
 * Ejecutar desde la raíz del proyecto: node scripts/build-search-index.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const DOC_GLOBS = [
  "index.html",
  "articulos.html",
  "referencias-api.html",
  "tutoriales.html",
  "programacion-cuantica.html",
  ...fs.readdirSync(path.join(ROOT, "paginas")).map((f) => `paginas/${f}`),
].filter((rel) => {
  const full = path.join(ROOT, rel);
  return fs.existsSync(full) && rel.endsWith(".html");
});

function stripTags(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstHeading(html) {
  const m = html.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i);
  return m ? stripTags(m[1]) : "";
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripTags(m[1]) : "";
}

function extractMainInner(html) {
  const m = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  return m ? m[1] : "";
}

/** Secciones hermanas bajo <main>: cada <section id="..."> hasta la siguiente o el cierre. */
function extractSections(mainInner) {
  const opens = [];
  const re = /<section\b[^>]*?\bid\s*=\s*["']([^"']+)["'][^>]*/gi;
  let match;
  while ((match = re.exec(mainInner)) !== null) {
    opens.push({
      id: match[1],
      openEnd: re.lastIndex,
      index: match.index,
    });
  }
  const out = [];
  for (let i = 0; i < opens.length; i++) {
    const start = opens[i].openEnd;
    const end = i + 1 < opens.length ? opens[i + 1].index : mainInner.length;
    const chunk = mainInner.slice(start, end);
    const closeIdx = chunk.lastIndexOf("</section>");
    const inner = closeIdx >= 0 ? chunk.slice(0, closeIdx) : chunk;
    out.push({ id: opens[i].id, inner });
  }
  return out;
}

const pages = {};
const entries = [];

for (const rel of DOC_GLOBS) {
  const full = path.join(ROOT, rel);
  let html;
  try {
    html = fs.readFileSync(full, "utf8");
  } catch {
    continue;
  }
  if (html.includes("http-equiv") && html.includes("refresh") && rel === "learning.html") {
    continue;
  }

  const pageTitle = extractTitle(html);
  pages[rel.replace(/\\/g, "/")] = pageTitle;

  const mainInner = extractMainInner(html);
  if (!mainInner) continue;

  for (const { id, inner } of extractSections(mainInner)) {
    const t = firstHeading(inner) || id;
    const txt = stripTags(inner);
    if (!txt) continue;
    entries.push({
      p: rel.replace(/\\/g, "/"),
      id,
      t,
      txt,
    });
  }
}

const payload = {
  version: 1,
  pages,
  entries,
};

const outPath = path.join(ROOT, "search-index.json");
fs.writeFileSync(outPath, JSON.stringify(payload), "utf8");
console.log(`Wrote ${entries.length} entries from ${DOC_GLOBS.length} files → search-index.json`);
