#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const siteRoot = path.resolve(__dirname, "..");
const vaultTexts = process.env.GEMCYCLOPEDIA_VAULT_TEXTS || "D:/Obsidian/Gemcyclopedia/Texts";
const outputDir = path.join(siteRoot, "la", "Texts");
const contentIndexVersion = 4;
// Only map pages whose complete standalone text or complete cited passages are present.
const localePages = {
  "Albertus - Book of Minerals - Latin.md": {
    id: "Texts/Albertus - Book of Minerals (Text Only)",
    file: "Albertus - Book of Minerals - Latin.html",
  },
  "Augustine - City of God XXI.4 - Latin.md": {
    id: "Texts/Augustine - City of God XXI.4 Excerpts",
    file: "Augustine - City of God XXI.4 - Latin.html",
  },
  "Bartholomaeus - De proprietatibus rerum Book XVI - Latin.md": {
    id: "Texts/Bartholomaeus Anglicanus - De proprietatibus rerum",
    file: "Bartholomaeus - De proprietatibus rerum Book XVI - Latin.html",
  },
  "Camillo Leonardi - Speculum Lapidum cited entries - Latin.md": {
    id: "Texts/Camillo Leonardi - Speculum Lapidum",
    file: "Camillo Leonardi - Speculum Lapidum cited entries - Latin.html",
  },
  "Epiphanius - On the Twelve Gemstones - Latin.md": {
    id: "Texts/Epiphanius - On the Twelve Gemstones",
    file: "Epiphanius - On the Twelve Gemstones - Latin.html",
  },
  "Hildegard - Physica Stones - Latin.md": {
    id: "Texts/Hildegard - Physica Stones",
    file: "Hildegard - Physica Stones - Latin.html",
  },
  "Isidore - Etymologies - Latin.md": {
    id: "Texts/Isidore - Etymologies Book XVI",
    file: "Isidore - Etymologies - Latin.html",
  },
  "Isidore - Etymologies Book XVI - Latin.md": {
    id: "Texts/Isidore - Etymologies Book XVI",
    file: "Isidore - Etymologies Book XVI - Latin.html",
  },
  "Pliny - Naturalis historia - Latin.md": {
    id: "Texts/Pliny - Naturalis historia",
    file: "Pliny - Naturalis historia - Latin.html",
  },
  "Marbodus - De lapidibus - Latin.md": {
    id: "Texts/Marbodus - De lapidibus",
    file: "Marbodus - De lapidibus - Latin.html",
  },
  "Thomas Aquinas - De operationibus occultis naturae - Latin.md": {
    id: "Texts/Thomas Aquinas - De operationibus occultis naturae (excerpt)",
    file: "Thomas Aquinas - De operationibus occultis naturae - Latin.html",
  },
  "Thomas Cantimpre - Liber de natura rerum - Latin.md": {
    id: "Texts/Thomas Cantimpre - Liber de natura rerum",
    file: "Thomas Cantimpre - Liber de natura rerum - Latin.html",
  },
};

// Keep these unreviewed working copies out of generated Latin pages. Remove an entry
// here when its transcription is ready to publish; the vault Markdown stays intact.
const excludedLatinSources = new Map([
  ["Camillo Leonardi - Speculum Lapidum - Latin.md", {
    reason: "Full OCR working copy is not scan-collated.",
    legacyFiles: [],
  }],
  ["Camillo Leonardi - Speculum Lapidum cited entries A-B batch - Latin.md", {
    reason: "Working alphabetic batch; it is not yet consolidated with the full cited-entry scope.",
    legacyFiles: [],
  }],
  ["Camillo Leonardi - Speculum Lapidum cited entries C batch - Latin.md", {
    reason: "Separate scan-collated batch; it is not yet consolidated with the full cited-entry scope.",
    legacyFiles: [],
  }],
  ["Camillo Leonardi - Speculum Lapidum cited entries D-H batch - Latin.md", {
    reason: "Working alphabetic batch; it is not yet consolidated with the full cited-entry scope.",
    legacyFiles: [],
  }],
  ["Camillo Leonardi - Speculum Lapidum cited entries I-M batch - Latin.md", {
    reason: "Working alphabetic batch; it is not yet consolidated with the full cited-entry scope.",
    legacyFiles: [],
  }],
  ["Camillo Leonardi - Speculum Lapidum cited entries N-R batch - Latin.md", {
    reason: "Separate scan-collated batch; it is not yet consolidated with the full cited-entry scope.",
    legacyFiles: [],
  }],
  ["Camillo Leonardi - Speculum Lapidum cited entries S-Z batch - Latin.md", {
    reason: "Separate scan-collated batch; it is not yet consolidated with the full cited-entry scope.",
    legacyFiles: [],
  }],
  ["Isidore - Etymologies Book XVI - Latin.md", {
    reason: "Consolidated into the combined Etymologiae source page.",
    legacyFiles: ["Isidore - Etymologies Book XVI - Latin.html"],
  }],
  ["Isidore - Etymologies XII.6.49, 51-53 - Latin.md", {
    reason: "Consolidated into the combined Etymologiae source page.",
    legacyFiles: ["Isidore - Etymologies XII.6.49, 51-53 - Latin.html"],
  }],
  ["Pliny - Naturalis Historia VIII.57 Lynx-stone - Latin.md", {
    reason: "Consolidated into the Naturalis historia source page.",
    legacyFiles: ["Pliny - Naturalis Historia VIII.57 Lynx-stone - Latin.html"],
  }],
  ["Pliny - Naturalis Historia IX.35 Pearls - Latin.md", {
    reason: "Consolidated into the Naturalis historia source page.",
    legacyFiles: ["Pliny - Naturalis Historia IX.35 Pearls - Latin.html"],
  }],
  ["Thomas Cantimpre - Liber XIV.1-15 collation - Latin.md", {
    reason: "Working manuscript-collation note, not a finished source page.",
    legacyFiles: ["Thomas Cantimpre - Liber XIV.1-15 collation - Latin.html"],
  }],
  ["Thomas Cantimpre - Liber XIV.1-15 full transcription - Latin.md", {
    reason: "Working manuscript transcription batch awaiting consolidation.",
    legacyFiles: ["Thomas Cantimpre - Liber XIV.1-15 full transcription - Latin.html"],
  }],
  ["Thomas Cantimpre - Liber XIV.16-30 collation - Latin.md", {
    reason: "Working manuscript-collation note, not a finished source page.",
    legacyFiles: ["Thomas Cantimpre - Liber XIV.16-30 collation - Latin.html"],
  }],
  ["Thomas Cantimpre - Liber XIV.16-30 full transcription - Latin.md", {
    reason: "Working manuscript transcription batch awaiting consolidation.",
    legacyFiles: ["Thomas Cantimpre - Liber XIV.16-30 full transcription - Latin.html"],
  }],
  ["Thomas Cantimpre - Liber XIV.31-45 collation - Latin.md", {
    reason: "Working manuscript-collation note, not a finished source page.",
    legacyFiles: ["Thomas Cantimpre - Liber XIV.31-45 collation - Latin.html"],
  }],
  ["Thomas Cantimpre - Liber XIV.31-45 full transcription - Latin.md", {
    reason: "Working manuscript transcription batch awaiting consolidation.",
    legacyFiles: ["Thomas Cantimpre - Liber XIV.31-45 full transcription - Latin.html"],
  }],
  ["Thomas Cantimpre - Liber XIV.46-60 collation - Latin.md", {
    reason: "Working manuscript-collation note, not a finished source page.",
    legacyFiles: ["Thomas Cantimpre - Liber XIV.46-60 collation - Latin.html"],
  }],
  ["Thomas Cantimpre - Liber XIV.46-60 full transcription - Latin.md", {
    reason: "Working manuscript transcription batch awaiting consolidation.",
    legacyFiles: ["Thomas Cantimpre - Liber XIV.46-60 full transcription - Latin.html"],
  }],
  ["Thomas Cantimpre - Liber XIV.61-71 collation - Latin.md", {
    reason: "Working manuscript-collation note, not a finished source page.",
    legacyFiles: ["Thomas Cantimpre - Liber XIV.61-71 collation - Latin.html"],
  }],
  ["Thomas Cantimpre - Liber XIV.61-71 full transcription - Latin.md", {
    reason: "Working manuscript transcription batch awaiting consolidation.",
    legacyFiles: ["Thomas Cantimpre - Liber XIV.61-71 full transcription - Latin.html"],
  }],
]);

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function slug(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function inlineMarkdown(source) {
  const protectedHtml = [];
  const protect = (html) => {
    const token = `\uE000${protectedHtml.length}\uE001`;
    protectedHtml.push(html);
    return token;
  };
  let text = String(source).trim();
  text = text.replace(/`([^`]+)`/g, (_, code) => protect(`<code>${escapeHtml(code)}</code>`));
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const cleanHref = href.trim();
    const safeHref = escapeHtml(cleanHref);
    const external = /^https?:\/\//i.test(cleanHref);
    return protect(`<a href="${safeHref}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${inlineMarkdown(label)}</a>`);
  });
  text = escapeHtml(text);
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  text = text.replace(/_([^_]+)_/g, "<em>$1</em>");
  return text.replace(/\uE000(\d+)\uE001/g, (_, index) => protectedHtml[Number(index)]);
}

function extractMarkdown(markdown) {
  let body = markdown.replace(/^\uFEFF/, "");
  const frontMatter = {};
  if (body.startsWith("---\n")) {
    const end = body.indexOf("\n---", 4);
    if (end >= 0) {
      const yaml = body.slice(4, end);
      for (const line of yaml.split(/\r?\n/)) {
        const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (match) frontMatter[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
      }
      body = body.slice(end + 4).replace(/^\r?\n/, "");
    }
  }
  body = body.replace(/<!--[\s\S]*?-->/g, "");
  return { frontMatter, body };
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const out = [];
  let paragraph = [];
  let quote = [];
  let list = [];
  let listType = "ul";

  const flushParagraph = () => {
    if (paragraph.length) {
      const parts = paragraph.filter((part) => part.text.trim());
      if (parts.length) {
        const joined = parts.map((part, index) => `${inlineMarkdown(part.text.trim())}${index < parts.length - 1 ? (part.hardBreak ? "<br/>" : " ") : ""}`).join("");
        out.push(`<p>${joined}</p>`);
      }
      paragraph = [];
    }
  };
  const flushQuote = () => {
    if (quote.length) {
      const content = quote.map((line) => `<p>${inlineMarkdown(line)}</p>`).join("");
      out.push(`<blockquote>${content}</blockquote>`);
      quote = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      out.push(`<${listType}>${list.map((item) => `<li${listType === "ol" && Number.isInteger(item.value) ? ` value="${item.value}"` : ""}>${inlineMarkdown(item.text)}</li>`).join("")}</${listType}>`);
      list = [];
    }
  };
  const flushBlocks = () => { flushParagraph(); flushQuote(); flushList(); };

  for (const rawLine of lines) {
    const hardBreak = / {2,}$/.test(rawLine);
    const line = rawLine.trimEnd();
    if (!line.trim()) { flushBlocks(); continue; }
    if (/^\s*<!--/.test(line)) { flushBlocks(); continue; }
    if (/^\s*---+\s*$/.test(line)) { flushBlocks(); out.push("<hr/>"); continue; }
    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      flushBlocks();
      const level = heading[1].length;
      const title = heading[2].trim();
      const id = slug(title.replace(/\*|`/g, ""));
      out.push(`<h${level} id="${escapeHtml(id)}">${inlineMarkdown(title)}</h${level}>`);
      continue;
    }
    const quoteLine = line.match(/^\s*>\s?(.*)$/);
    if (quoteLine) {
      flushParagraph(); flushList();
      quote.push(quoteLine[1]);
      continue;
    }
    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*(\d+)[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph(); flushQuote();
      const nextType = ordered ? "ol" : "ul";
      if (list.length && listType !== nextType) flushList();
      listType = nextType;
      list.push(ordered
        ? { text: ordered[2], value: Number(ordered[1]) }
        : { text: unordered[1], value: null });
      continue;
    }
    const numberedVerse = line.match(/^\s*(\d{3})\s{2,}(.+)$/);
    if (numberedVerse) {
      flushBlocks();
      out.push(`<div class="latin-verse-line"><span class="latin-line-number">${numberedVerse[1]}</span><span>${inlineMarkdown(numberedVerse[2])}</span></div>`);
      continue;
    }
    flushQuote(); flushList();
    paragraph.push({ text: line, hardBreak });
  }
  flushBlocks();
  return out.join("\n");
}

function firstHeading(body, fallback) {
  const match = body.match(/^#\s+(.+)$/m);
  return match ? match[1].replace(/\*|`/g, "") : fallback;
}

function shell({ title, description, pageId, content, hasLocaleMap }) {
  const languageControl = hasLocaleMap
    ? '<label class="language-select"><span data-i18n="language">Language</span><select aria-label="Language" id="language-select"><option value="en">English · EN</option><option value="pl">Polski · PL</option></select></label>'
    : '<span class="source-badge">Latin · LA</span>';
  return `<!DOCTYPE html>
<html data-locale="la" data-theme="dark" lang="la">
<head>
<meta charset="utf-8"/><meta content="width=device-width, initial-scale=1" name="viewport"/>
<meta content="dark light" name="color-scheme"/><meta content="${escapeHtml(description)}" name="description"/>
<title>${escapeHtml(title)} · Gemcyclopedia</title>
<link href="../../assets/gem-mark.svg" rel="icon" type="image/svg+xml"/>
<link href="../../assets/site.css?v=3" rel="stylesheet"/>
<script defer="" src="../../assets/content-index.js?v=${contentIndexVersion}"></script>
<script defer="" src="../../assets/site.js?v=4"></script>
<style>.article-text{line-height:1.75}.article-text pre{white-space:pre-wrap;overflow-wrap:anywhere;font-family:Georgia,serif}.latin-verse-line{display:grid;grid-template-columns:2.8em minmax(0,1fr);font-family:Georgia,serif;line-height:1.55}.latin-line-number{color:var(--muted,#777);font-size:.8em;text-align:right;padding-right:.8em;user-select:none}</style>
</head>
<body class="content-page" data-current-page="${escapeHtml(pageId)}" data-site-base="../..">
<header class="topbar">
<button aria-expanded="false" aria-label="Open navigation" class="mobile-nav-toggle" id="mobile-nav-toggle">☰</button>
<a class="brand" href="../../en/index.html"><strong data-i18n="brand">Gemcyclopedia</strong></a>
<div class="search-wrap"><label class="sr-only" data-i18n="searchLabel" for="site-search">Search the encyclopedia</label><input autocomplete="off" id="site-search" placeholder="Search gems, powers, places, and sources…" type="search"/><kbd>⌘ K</kbd><div class="search-results" id="search-results" role="listbox"></div></div>
<div class="top-actions"><button aria-label="Switch light and dark appearance" class="theme-toggle" id="theme-toggle" title="Switch light and dark appearance" type="button">◐</button>${languageControl}</div>
</header>
<div class="page-shell with-toc">
<aside class="left-rail" id="left-rail"><div class="rail-label">DISCOVER</div><nav class="primary-nav"><a class="home-link" data-i18n="home" href="../../en/index.html">Home</a><a data-i18n="gems" href="../../Gems/index.html">Gems</a><a data-i18n="powers" href="../../Powers/Browse.html">Powers</a><a data-i18n="locations" href="../../Locations/Browse.html">Locations</a><a data-i18n="sources" href="index.html">Sources</a></nav><div class="rail-divider"></div><button class="rail-action" data-i18n="randomArticle" id="random-article">Open random article</button><button class="rail-action" data-i18n="randomGem" id="random-gem">Open random gem</button></aside>
<main class="main-column" id="main-content">
<div class="breadcrumbs"><a data-i18n="home" href="../../en/index.html">Home</a><span>/</span><a href="index.html">Source library · Latin</a><span>/</span><span>Source text</span></div>
<div class="article-toolbar"><span class="page-type">Source text · Latin</span></div>
<article class="article-content" data-page-title="${escapeHtml(title)}"><div class="article-text">${content}</div></article>
<footer class="site-footer"><span>Created by Adrian Skoczkowski 2026, Contact at: <a href="mailto:pajakiyt@gmail.com">pajakiyt@gmail.com</a></span><a href="../../en/index.html">Gemcyclopedia</a></footer>
</main><aside class="right-rail"><div class="rail-card"><h2 data-i18n="contents">On this page</h2><nav class="toc"></nav></div></aside>
</div></body></html>
`;
}

function updateLocaleMap(routes) {
  const indexPath = path.join(siteRoot, "assets", "content-index.js");
  const source = fs.readFileSync(indexPath, "utf8");
  const marker = '"pageLocales":';
  const propAt = source.indexOf(marker);
  if (propAt < 0) throw new Error("pageLocales property is missing from content-index.js");
  const objectStart = source.indexOf("{", propAt + marker.length);
  let depth = 0, quoted = false, escaped = false, objectEnd = -1;
  for (let i = objectStart; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') quoted = false;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === "{") depth++;
    if (ch === "}" && --depth === 0) { objectEnd = i + 1; break; }
  }
  if (objectEnd < 0) throw new Error("Could not find the end of pageLocales");
  const locales = JSON.parse(source.slice(objectStart, objectEnd));
  for (const locale of Object.values(locales)) {
    if (locale.la?.startsWith("la/Texts/")) delete locale.la;
  }
  for (const [id, route] of Object.entries(routes)) {
    if (!fs.existsSync(path.join(siteRoot, route))) throw new Error(`Latin target is missing: ${route}`);
    locales[id] = { ...(locales[id] || {}), la: route };
  }
  locales.__texts_browse__ = {
    ...(locales.__texts_browse__ || {}),
    en: "Texts/index.html",
    pl: "pl/Texts/index.html",
    la: "la/Texts/index.html",
  };
  return source.slice(0, objectStart) + JSON.stringify(locales) + source.slice(objectEnd);
}

function outputFileFor(inputFile) {
  return localePages[inputFile]?.file || inputFile.replace(/\.md$/i, ".html");
}

function removeStaleExcludedPages() {
  const resolvedOutputDir = path.resolve(outputDir);
  for (const [inputFile, exclusion] of excludedLatinSources) {
    const outputFiles = new Set([outputFileFor(inputFile), ...exclusion.legacyFiles]);
    for (const file of outputFiles) {
      if (path.basename(file) !== file || !/\.html$/i.test(file)) {
        throw new Error(`Unsafe stale Latin output path for ${inputFile}: ${file}`);
      }
      const outputPath = path.resolve(resolvedOutputDir, file);
      if (path.dirname(outputPath) !== resolvedOutputDir) {
        throw new Error(`Stale Latin output is outside la/Texts: ${file}`);
      }
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
  }
}

function bumpSourcePageContentIndex() {
  for (const relativeDir of ["Texts", path.join("pl", "Texts"), path.join("la", "Texts")]) {
    const directory = path.join(siteRoot, relativeDir);
    for (const file of fs.readdirSync(directory)) {
      if (!file.toLowerCase().endsWith(".html")) continue;
      const pagePath = path.join(directory, file);
      const html = fs.readFileSync(pagePath, "utf8");
      const updated = html.replace(new RegExp("(content-index[.]js[?]v=)([0-9]+)", "g"), (_, prefix, version) => `${prefix}${Math.max(contentIndexVersion, Number(version))}`);
      if (updated !== html) fs.writeFileSync(pagePath, updated, "utf8");
    }
  }
}

const latinDisplayTitles = {
  "Aberdeen Bestiary - Fire Stones and Magnes - Latin.md": "Bestiarium Aberdonense — Loci selecti de lapidibus igniferis et magnete",
  "Aelian - De natura animalium IV.17 and XV.8 - Latin.md": "Aeliani De natura animalium, IV.17 et XV.8",
  "Albertus - Book of Minerals - Latin.md": "Albertus Magnus — De mineralibus, liber II, tractatus II",
  "Ambrose - Hexaemeron V.33 - Latin.md": "Ambrosius — Hexaemeron V.33",
  "Augustine - City of God XXI.4 - Latin.md": "Augustinus — De civitate Dei XXI.4",
  "Bartholomaeus - De proprietatibus rerum Book XVI - Latin.md": "Bartholomaeus Anglicus — De proprietatibus rerum, liber XVI",
  "Bartholomaeus - De proprietatibus rerum XIII.26 and XVIII.68 - Latin.md": "Bartholomaeus Anglicus — De proprietatibus rerum, loci XIII.26 et XVIII.68",
  "Camillo Leonardi - Speculum Lapidum - Latin.md": "Camillus Leonardi — Speculum lapidum (textus integer)",
  "Camillo Leonardi - Speculum Lapidum cited entries - Latin.md": "Camillus Leonardi — Speculum lapidum, loci selecti",
  "Epiphanius - On the Twelve Gemstones - Latin.md": "Epiphanius — Liber de XII gemmis",
  "Hildegard - Physica Stones - Latin.md": "Hildegardis Bingenensis — Physica, liber IV: De lapidibus",
  "Isidore - Etymologies - Latin.md": "Isidorus Hispalensis — Etymologiae",
  "Isidore - Etymologies Book XVI - Latin.md": "Isidorus Hispalensis — Etymologiae, liber XVI: De lapidibus et metallis",
  "Isidore - Etymologies XII.6.49, 51-53 - Latin.md": "Isidorus Hispalensis — Etymologiae XII.6.49, 51–53",
  "Jacques de Vitry - Historia orientalis, cited passages 88 and 90 - Latin.md": "Iacobus de Vitriaco — Historia orientalis, capita LXXXVIII et XC",
  "Marbodus - De lapidibus - Latin.md": "Marbodus Redonensis — Liber lapidum",
  "Other Sources - Latin.md": "Fontes ceteri — loci Latini",
  "Ovid - Metamorphoses XV.391-417 - Latin.md": "P. Ovidius Naso — Metamorphoses XV.391–417",
  "Physiologus Version Y - Piroboli and Lapis Indicus - Latin.md": "Physiologus Latinus, versio Y — De lapidibus pirobolis et de lapide senditicho",
  "Pliny - Naturalis historia - Latin.md": "C. Plinius Secundus — Naturalis historia",
  "Pliny - Naturalis Historia IX.35 Pearls - Latin.md": "C. Plinius Secundus — Naturalis historia IX.35.105–124",
  "Pliny - Naturalis Historia VIII.57 Lynx-stone - Latin.md": "C. Plinius Secundus — Naturalis historia VIII.57: De lyncurio",
  "Solinus - Collectanea rerum memorabilium - Latin.md": "C. Iulius Solinus — Collectanea rerum memorabilium",
  "Thomas Aquinas - De operationibus occultis naturae - Latin.md": "Thomas Aquinas — Ad quendam militem ultramontanum",
  "Thomas Cantimpre - Liber de natura rerum - Latin.md": "Thomas Cantimpratensis — Liber de natura rerum, liber XIV",
  "Thomas Cantimpre - Liber de natura rerum IV.15, IV.58, IV.61 - Latin.md": "Thomas Cantimpratensis — Liber de natura rerum, capita IV.15, IV.58 et IV.61",
};

const latinSourceStarts = {
  "Aberdeen Bestiary - Fire Stones and Magnes - Latin.md": "## De lapidibus igniferis",
  "Aelian - De natura animalium IV.17 and XV.8 - Latin.md": "## Liber IV, §17",
  "Albertus - Book of Minerals - Latin.md": "TRACTATUS II",
  "Ambrose - Hexaemeron V.33 - Latin.md": "## V.33",
  "Augustine - City of God XXI.4 - Latin.md": "### 4.1",
  "Bartholomaeus - De proprietatibus rerum Book XVI - Latin.md": "De lapidibus terrae",
  "Bartholomaeus - De proprietatibus rerum XIII.26 and XVIII.68 - Latin.md": "## Liber XIII, capitulum XXVI",
  "Camillo Leonardi - Speculum Lapidum - Latin.md": "Quicquid in humanos gemmarum parturit usus",
  "Camillo Leonardi - Speculum Lapidum cited entries - Latin.md": "## Egyptilla",
  "Epiphanius - On the Twelve Gemstones - Latin.md": "### §1",
  "Hildegard - Physica Stones - Latin.md": "## Praefatio",
  "Isidore - Etymologies - Latin.md": "Concharum multa genera sunt;",
  "Isidore - Etymologies Book XVI - Latin.md": "## Chapter 1",
  "Isidore - Etymologies XII.6.49, 51-53 - Latin.md": "### XII.6.49",
  "Jacques de Vitry - Historia orientalis, cited passages 88 and 90 - Latin.md": "## Chapter LXXXVIII",
  "Marbodus - De lapidibus - Latin.md": "Gemmis a gummi",
  "Ovid - Metamorphoses XV.391-417 - Latin.md": "391  Haec tamen",
  "Physiologus Version Y - Piroboli and Lapis Indicus - Latin.md": "## De lapidibus pirobolis",
  "Pliny - Naturalis historia - Latin.md": "Lyncum umor",
  "Pliny - Naturalis Historia IX.35 Pearls - Latin.md": "### Naturalis historia IX.35.105",
  "Pliny - Naturalis Historia VIII.57 Lynx-stone - Latin.md": "Lyncum umor",
  "Solinus - Collectanea rerum memorabilium - Latin.md": "## Praefatio",
  "Thomas Aquinas - De operationibus occultis naturae - Latin.md": "Quoniam in quibusdam naturalibus",
  "Thomas Cantimpre - Liber de natura rerum - Latin.md": "## Prologus",
  "Thomas Cantimpre - Liber de natura rerum IV.15, IV.58, IV.61 - Latin.md": "## IV.15",
};

const editorialBlock = /^(?:>\s*)?\*\*(?:Witness|Text note|Textual scope|Edition|Language|Extent|Coverage|Transcription|Digital witness|Digital sources|Online text|Reference|OCR note|Reading note|Name distinction|Boundary note|Scope|License|Source edition|Source status|Printed source|Parallel text|Citation note|Text source|Editorial note|Complete cited passage|Digital text|Witness and|Witness distinction|Chapter-number crosswalk|Independent witness|Complete extent|Contents from the edition|Edition limitation|Text and provenance|Transcription and limits|Frontmatter|Attribution|Locus|Collation checkpoint|Crosswalk note|Anchor crosswalks)/i;
const stopHeading = /^(?:Edition(?: and|\b)|Text and edition|Attribution|Transcription limits|Source status|Book IV citations not yet transcribed|Witness, scope|Witness and edition links|Digital witness and scan links|Frontmatter|Anchor crosswalks and unresolved coverage)\b/i;
const cantimpreEditorialParagraph = /^(?:\*\*)?(?:This complete chapter\b|The English and Polish source pages cite\b|The wording of Thomas's complete\b|The quoted parallel is independently inspectable\b|Chapter alignment\b|The\b|This\b|These\b|Both\b|Neither\b|A related\b|A source\b|A separate\b|Brackets\b|Square brackets\b|Punctuation\b|Word division\b|Spelling\b|Attribution\b|MS 0320\b|Valenciennes\b|Wrocław\b|UPenn\b|In the\b|Freshly checked\b|No distinct\b|Do not\b|Keep\b|Compare\b|See\b)/i;

function stripCantimpreEditorialBrackets(block) {
  return block
    .replace(/\[\*?Prooemium[^\]]*\]/gi, "")
    .replace(/\[(?:f{1,2}\.?\s*\d+[rv]?|MS\s*0320|The eye passage|reading uncertain|words uncertain)[^\]]*\]/gi, " […] ")
    .replace(/\[([^\]]*);[^\]]*\b(?:description|uncertain|unclear|illegible|reading|rubric|red extension|passage|text|body|chapter|word|page|scan|source)\b[^\]]*\]/gi, (_, before) => {
      const possibleReading = before.trim();
      return possibleReading && !/^(?:f{1,2}\.?\s*\d|MS\b|The\b)/i.test(possibleReading) ? `[${possibleReading}]` : " […] ";
    })
    .replace(/\s+R\s+174,\s*p\.\s*\d+,\s+has\b.*$/i, "");
}

function stripEditorialBracketAnnotations(block) {
  return block.replace(/\[([^\]]+)\]/g, (full, contents) => {
    if (!/\b(?:the|this|first|second|sentence|continues|headword|partly|obscured|decorated|initial|folio|page|scan|image|witness|reading|uncertain|unclear|illegible|unreadable|chapter|passage|manuscript|rubric|supplied|OCR|text|source|corresponding|description|words?)\b/i.test(contents)) return full;
    const candidate = contents.split(/[;:—]/, 1)[0].trim();
    if (candidate && /^[\p{L}\s/?'-]+\??$/u.test(candidate) && !/\b(?:the|this|first|second|headword|folio|page|scan|image|reading|uncertain|unclear|illegible|unreadable|description|words?|continues|sentence|decorated|initial|obscured|partly|incerta)\b/i.test(candidate)) return `[${candidate}]`;
    return " ";
  });
}

function extractExternalLinks(markdown, raw) {
  const found = [];
  const add = (label, url) => {
    const cleanUrl = String(url || "").trim().replace(/[)>.,;]+$/, "");
    if (!/^https?:\/\//i.test(cleanUrl) || found.some((entry) => entry.url === cleanUrl)) return;
    // Passage-level scan locators stay in the working transcription; the page
    // footer lists each digital witness once so it remains a short source list.
    if (/\/page\/[^/?#]+(?:\/mode\/1up)?(?:[?#]|$)/i.test(cleanUrl)) return;
    const rawLabel = String(label || "").replace(/[*_`]/g, "").trim();
    const genericLabels = {
      "scan url": "digital scan",
      "ocr url": "digital OCR",
      "source url": "digital source",
      "source urls": "digital sources",
      "page range": "digital facsimile",
    };
    const cleanLabel = genericLabels[rawLabel.toLowerCase()] || rawLabel;
    found.push({ label: cleanLabel, url: cleanUrl });
  };
  for (const match of markdown.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)) add(match[1], match[2]);
  const yaml = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (yaml) {
    let activeKey = "source";
    for (const line of yaml[1].split(/\r?\n/)) {
      const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (field) {
        activeKey = field[1].replaceAll("_", " ");
        const valueUrl = field[2].match(/https?:\/\/[^\s"']+/);
        if (valueUrl) add(activeKey, valueUrl[0]);
      } else {
        const listUrl = line.match(/^\s*-\s*["']?(https?:\/\/[^\s"']+)/);
        if (listUrl) add(activeKey, listUrl[1]);
      }
    }
  }
  return found;
}

function latinizedHeading(block, inputFile) {
  let result = block.replace(/^(#{2,6}\s+)Chapter\s+(\d+)\s+—\s*/i, (_, hashes, number) => {
    const values = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
    let n = Number(number), roman = "";
    for (const [value, symbol] of values) while (n >= value) { roman += symbol; n -= value; }
    return hashes + "Caput " + roman + " — ";
  }).replace(/^(#{2,6}\s+)Chapter\s+([IVXLCDM]+)\s+—\s*/i, "$1Caput $2 — ")
    .replace(/^(#{2,6}\s+)Liber IV,\s*§17\s+—.*$/i, "$1Liber IV, caput XVII")
    .replace(/^(#{2,6}\s+)Liber XV,\s*§8\s+—.*$/i, "$1Liber XV, caput VIII")
    .replace(/^(#{2,6}\s+)Chapter LXXXVIII\s+—\s*\*?De feris\*?:.*$/i, "$1Caput LXXXVIII — De feris")
    .replace(/^(#{2,6}\s+)Chapter XC\s+—\s*\*?De avibus quibusdam et piscibus raris\*?:.*$/i, "$1Caput XC — De avibus quibusdam et piscibus raris");
  if (inputFile === "Jacques de Vitry - Historia orientalis, cited passages 88 and 90 - Latin.md") {
    result = result
      .replace(/^(#{2,6}\s+)Caput LXXXVIII\s+—.*$/i, "$1Caput LXXXVIII — De feris")
      .replace(/^(#{2,6}\s+)Caput XC\s+—.*$/i, "$1Caput XC — De avibus quibusdam et piscibus raris");
  }
  if (inputFile === "Aberdeen Bestiary - Fire Stones and Magnes - Latin.md") {
    result = result.replace(/^(#{2,6}\s+)(De lapidibus igniferis|De magnete)\s+—\s+fol\.\s*\d+[rv]$/i, "$1$2");
  }
  if (inputFile === "Thomas Cantimpre - Liber de natura rerum IV.15, IV.58, IV.61 - Latin.md") {
    result = result.replace(/\s+\((?:confirmed in MS 320|unrubricated in this witness)\)/gi, "");
  }
  if (inputFile === "Camillo Leonardi - Speculum Lapidum cited entries - Latin.md") {
    result = result
      .replace(/^(#{2,6}\s+)Book\s+([IVXLCDM]+),\s*chapter\s+([IVXLCDM]+)\s+—\s+introduction\b.*$/i, "$1Liber $2, caput $3 — Prooemium")
      .replace(/^(#{2,6}\s+)Book\s+([IVXLCDM]+),\s*chapter\s+([IVXLCDM]+)\b/i, "$1Liber $2, caput $3")
      .replace(/\s+—\s+(?:1502 index and later prose witnesses|1502 cross-references and later prose witnesses)\s*$/i, "")
      .replace(/\s+\((?=[^)]*\b(?:cited for|English source heading|first chrysolite passage|second chrysolite passage|PDF|scan|witness|complete brief entry|printed p\.|UPenn|MS 0320|Valenciennes|Agate|Amethyst|Beryl|Amber|Emerald|Sapphire|Ruby|Diamond|Chalcedony)\b)[^)]*\)/gi, "");
  }
  if (inputFile === "Thomas Cantimpre - Liber de natura rerum - Latin.md") {
    result = result
      .replace(/^## Additional Book XIV readings from Valenciennes MS 0320$/i, "## Capitula XIV alia ex codice Valentiniano")
      .replace(/^## Additional Book XIV witness readings$/i, "## Alia testimonia libri XIV")
      .replace(/^## MS 0320 collation supplements for XIV\.1–15 and XIV\.31–45$/i, "## Testimonia codicis MS 0320")
      .replace(/^(#{2,6}\s+)MS 0320 supplement\s+—\s+(XIV\.\d+),\s+\*?(.*?)(?:\s+\([^)]*\))?\*?$/i, "$1Testimonium MS 0320 — caput $2, $3")
      .replace(/^(#{2,6}\s+)XIV\.7, XIV\.9, XIV\.11, and XIV\.15\s+—\s+selected readings$/i, "$1Capita XIV.7, XIV.9, XIV.11 et XIV.15 — lectiones")
      .replace(/^(#{2,6}\s+)XIV\.31–45\s+—\s+manuscript readings and unresolved spans$/i, "$1Capita XIV.31–45")
      .replace(/^(#{2,6}\s+)XIV\.69\s+—\s+Parallel witness: Wrocław R 174, printed pp\.\s*179–180$/i, "$1Caput XIV.69 — alterum testimonium (R 174)")
      .replace(/^(#{2,6}\s+)XIV\.([0-9]+[–-][0-9]+)\s+—\s+Valenciennes MS 0320\b.*$/i, "$1Capita XIV.$2 — testimonium MS 0320")
      .replace(/\s+\((?=[^)]*\b(?:first chrysolite passage|second chrysolite passage|MS 0320|UPenn|Wrocław|printed p\.|complete brief entry|scan-collated|ff?\.\s*\d)\b)[^)]*\)/gi, "");
  }
  return result;
}

function collectionMarkdown(body) {
  const entries = [];
  for (const match of body.matchAll(/^\s*-\s*\[([^\]]+)\]\(([^)]+)\)/gm)) {
    const target = decodeURIComponent(match[2].replace(/%20/g, " "));
    const inputName = Object.keys(latinDisplayTitles).find((name) => name.replace(/\.md$/i, ".html") === target);
    if (inputName && !excludedLatinSources.has(inputName)) entries.push({ href: match[2], title: latinDisplayTitles[inputName] });
  }
  const first = entries.slice(0, 15), second = entries.slice(15);
  return "# Fontes ceteri — loci Latini\n\n## De lapidibus et animalibus\n\n" +
    first.map((entry) => "- [" + entry.title + "](" + entry.href + ")").join("\n") +
    "\n\n## De margaritis aliisque rebus\n\n" +
    second.map((entry) => "- [" + entry.title + "](" + entry.href + ")").join("\n");
}

function prepareLatinSource(inputFile, body, raw) {
  const links = extractExternalLinks(body, raw);
  if (inputFile === "Other Sources - Latin.md") {
    return { markdown: collectionMarkdown(body), links, preview: "Sunt lapides igniferi in quodam monte Orientis, qui Graece terrobolem dicuntur, masculus et femina." };
  }
  const marker = latinSourceStarts[inputFile];
  if (!marker) throw new Error("No Latin text start marker for " + inputFile);
  const blocks = body.replace(/\r/g, "").split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const start = blocks.findIndex((block) => block.toLowerCase().includes(marker.toLowerCase()));
  if (start < 0) throw new Error("Latin text start marker not found in " + inputFile + ": " + marker);
  const kept = [];
  for (const original of blocks.slice(start)) {
    const block = stripEditorialBracketAnnotations(
      inputFile === "Thomas Cantimpre - Liber de natura rerum - Latin.md"
        ? stripCantimpreEditorialBrackets(original.trim())
        : original.trim(),
    );
    const firstLine = block.split("\n", 1)[0].trim();
    const heading = firstLine.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const title = heading[1].replace(/[*_`]/g, "").trim();
      if (stopHeading.test(title)) break;
      if (inputFile === "Thomas Cantimpre - Liber de natura rerum - Latin.md" && /^(?:MS 0320 transcription|MS 0320 parallel|Review note|Witness and method|Prose witnesses)\b/i.test(title)) continue;
      if (/^(?:Textus Latinus|Latin|Text|Edition and digital sources?)$/i.test(title)) continue;
      if (/^Frontmatter$/i.test(title)) break;
    }
    if (inputFile === "Thomas Cantimpre - Liber de natura rerum - Latin.md" && /^\s*[-*]\s+/.test(block)) continue;
    if (editorialBlock.test(block) || cantimpreEditorialParagraph.test(block) || /^This transcription follows\b/i.test(block) || /^Two readings\b/i.test(block) || /^The original 1597 print\b/i.test(block)) continue;
    if (/^\s*[-*]\s*\[[^\]]+\]\(https?:\/\//i.test(block) || /\]\(https?:\/\//i.test(block)) continue;
    if (/^\s*---+\s*$/.test(block)) continue;
    if (/^\s*#\s/.test(block)) continue;
    kept.push(latinizedHeading(block, inputFile));
  }
  const markdown = kept.join("\n\n");
  const isPreviewText = (block) => {
    if (/^#{1,6}\s/.test(block) || /^\s*[-*]\s/.test(block) || /^\*\*/.test(block)) return false;
    const plain = block.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`>]/g, "").replace(/\s+/g, " ").trim();
    return plain.length >= 30 && !/^[A-Z\s.,;:]+$/.test(plain);
  };
  const previewCandidates = kept.filter(isPreviewText);
  const previewBlock = previewCandidates.find((block) => block.replace(/\s+/g, " ").trim().length >= 75) || previewCandidates[0];
  const previewText = previewBlock ? previewBlock.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`>]/g, "").replace(/\s+/g, " ").trim() : "";
  const preview = previewText.length > 145 ? previewText.slice(0, 145).replace(/\s+\S*$/, "").replace(/[ ,;:]+$/, "") + "…" : previewText;
  const pageLinks = inputFile === "Thomas Cantimpre - Liber de natura rerum - Latin.md"
    ? [
        { label: "MS 0320 — Bibliothèque municipale de Valenciennes", url: "https://patrimoine-numerique.ville-valenciennes.fr/ark:/29755/B_596066101_MS_0320/v0003" },
        { label: "LJS 23 — XIV.39, De iudaico", url: "https://archive.org/details/ljs23" },
        { label: "R 174 — XIV.65, XIV.67, XIV.69, XIV.71", url: "https://bibliotekacyfrowa.pl/dlibra/publication/35140/edition/38233/liber-de-natura-rerum-thomas-de-cantimpre-1201-1272-http-viaf-org-viaf-100174390" },
        { label: "Bibliotheca Ichtya — VII.51, De margaritis", url: "https://ichtya.unicaen.fr/lab/bibliotheque/TC7_lat.xml/LAT.tc.7.51.html" },
        { label: "Editio Boese 1973 — Liber de natura rerum", url: "https://books.google.com/books?id=dTwJAQAAMAAJ" },
        { label: "Isidorus Hispalensis — Etymologiae XVI.4.12", url: "https://monumenta.ch/latein/text.php?domain=&hide_apparatus=&inframe=1&lang=0&level=4&links=&rumpfid=Isidorus%2C+Etymologiae%2C+Liber+16%2C+++4&tabelle=Isidorus&translation_links=" },
        { label: "Historia orientalis, cap. XC — De ostreis (Bibliotheca Ichtya)", url: "https://ichtya.unicaen.fr/lab/bibliotheque/AM_lat.xml/LAT.am.24.html?focus=LAT.am.24.1.12" },
      ]
    : links;
  return { markdown, links: pageLinks, preview };
}

function simpleSourceLinks(author, fallbackTitle, links) {
  const sourceAuthor = author || fallbackTitle;
  return links.map((entry) => {
    const label = entry.label || fallbackTitle;
    const url = escapeHtml(entry.url);
    return "<p>" + escapeHtml(sourceAuthor) + " — " + escapeHtml(label) + " — <a href=\"" + url + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + url + "</a></p>";
  }).join("\n");
}

function buildIndex(pages) {
  const sorted = [...pages].sort((a, b) => a.title.localeCompare(b.title, "en"));
  const letters = [...new Set(sorted.map((page) => page.title.normalize("NFKD").replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase()).filter(Boolean))];
  const nav = letters.map((letter) => "<a href=\"#letter-" + letter.toLowerCase() + "\">" + letter + "</a>").join("");
  const groups = letters.map((letter) => {
    const cards = sorted.filter((page) => page.title.normalize("NFKD").replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase() === letter)
      .map((page) => "<a class=\"index-card\" href=\"" + escapeHtml(encodeURI(page.file)) + "\"><span class=\"index-card-title\">" + escapeHtml(page.title) + "</span><span class=\"index-card-summary\">" + escapeHtml(page.summary || "") + "</span></a>").join("");
    return "<section class=\"alpha-group\" id=\"letter-" + letter.toLowerCase() + "\"><h2>" + letter + "</h2><div class=\"index-grid\">" + cards + "</div></section>";
  }).join("");
  return "<!DOCTYPE html>\n<html data-locale=\"la\" data-theme=\"dark\" lang=\"la\"><head>\n<meta charset=\"utf-8\"/><meta content=\"width=device-width, initial-scale=1\" name=\"viewport\"/><meta content=\"dark light\" name=\"color-scheme\"/>\n<meta content=\"Fontes Latini Gemcyclopediae.\" name=\"description\"/><title>Fontes Latini · Gemcyclopedia</title>\n<link href=\"../../assets/gem-mark.svg\" rel=\"icon\" type=\"image/svg+xml\"/><link href=\"../../assets/site.css?v=3\" rel=\"stylesheet\"/>\n<script defer=\"\" src=\"../../assets/content-index.js?v=" + contentIndexVersion + "\"></script><script defer=\"\" src=\"../../assets/site.js?v=4\"></script></head>\n<body class=\"content-page\" data-current-page=\"__texts_browse__\" data-site-base=\"../..\"><header class=\"topbar\">\n<button aria-expanded=\"false\" aria-label=\"Open navigation\" class=\"mobile-nav-toggle\" id=\"mobile-nav-toggle\">☰</button><a class=\"brand\" href=\"../../en/index.html\"><strong data-i18n=\"brand\">Gemcyclopedia</strong></a>\n<div class=\"search-wrap\"><label class=\"sr-only\" data-i18n=\"searchLabel\" for=\"site-search\">Search the encyclopedia</label><input autocomplete=\"off\" id=\"site-search\" placeholder=\"Search gems, powers, places, and sources…\" type=\"search\"/><kbd>⌘ K</kbd><div class=\"search-results\" id=\"search-results\" role=\"listbox\"></div></div>\n<div class=\"top-actions\"><button aria-label=\"Switch light and dark appearance\" class=\"theme-toggle\" id=\"theme-toggle\" title=\"Switch light and dark appearance\" type=\"button\">◐</button><label class=\"language-select\"><span data-i18n=\"language\">Language</span><select aria-label=\"Language\" id=\"language-select\"><option value=\"en\">English · EN</option><option value=\"pl\">Polski · PL</option></select></label></div></header>\n<div class=\"page-shell\"><aside class=\"left-rail\" id=\"left-rail\"><div class=\"rail-label\">DISCOVER</div><nav class=\"primary-nav\"><a class=\"home-link\" data-i18n=\"home\" href=\"../../en/index.html\">Home</a><a data-i18n=\"gems\" href=\"../../Gems/index.html\">Gems</a><a data-i18n=\"powers\" href=\"../../Powers/Browse.html\">Powers</a><a data-i18n=\"locations\" href=\"../../Locations/Browse.html\">Locations</a><a data-i18n=\"sources\" href=\"index.html\">Sources</a></nav></aside><main class=\"main-column\" id=\"main-content\">\n<div class=\"breadcrumbs\"><a data-i18n=\"home\" href=\"../../en/index.html\">Home</a><span>/</span><span>Fontes Latini</span></div><div class=\"article-toolbar\"><span class=\"page-type\">Bibliotheca fontium</span></div>\n<section class=\"index-intro\"><p class=\"eyebrow\">" + pages.length + " textus Latini</p><h1>Fontes Latini</h1><div class=\"letter-nav\">" + nav + "</div></section>" + groups + "\n<footer class=\"site-footer\"><span>Created by Adrian Skoczkowski 2026, Contact at: <a href=\"mailto:pajakiyt@gmail.com\">pajakiyt@gmail.com</a></span><a href=\"../../en/index.html\">Gemcyclopedia</a></footer></main></div></body></html>";
}

function main() {
  if (!fs.existsSync(vaultTexts)) throw new Error(`Vault text directory not found: ${vaultTexts}`);
  fs.mkdirSync(outputDir, { recursive: true });
  removeStaleExcludedPages();
  const inputFiles = fs.readdirSync(vaultTexts)
    .filter((file) => file.toLowerCase().endsWith("- latin.md"))
    .sort((a, b) => a.localeCompare(b, "en"));
  const pages = [];
  const routeMap = {};
  for (const inputFile of inputFiles) {
    const exclusion = excludedLatinSources.get(inputFile);
    if (exclusion) {
      process.stdout.write(`Skipped excluded Latin source: ${inputFile} (${exclusion.reason})\n`);
      continue;
    }
    const raw = fs.readFileSync(path.join(vaultTexts, inputFile), "utf8");
    const { frontMatter, body } = extractMarkdown(raw);
    const mapping = localePages[inputFile];
    const outputFile = outputFileFor(inputFile);
    const id = mapping?.id || `Texts/Latin/${slug(firstHeading(body, frontMatter.title || inputFile))}`;
    const title = latinDisplayTitles[inputFile] || firstHeading(body, frontMatter.title || inputFile.replace(/\.md$/i, ""));
    const prepared = prepareLatinSource(inputFile, body, raw);
    const description = "Latin source text";
    const content = markdownToHtml(prepared.markdown) + "\n" + simpleSourceLinks(frontMatter.author || title, title, prepared.links);
    const outputPath = path.join(outputDir, outputFile);
    fs.writeFileSync(outputPath, shell({ title, description, pageId: id, content, hasLocaleMap: Boolean(mapping) }), "utf8");
    pages.push({ file: outputFile, title, author: frontMatter.author || "", summary: prepared.preview || "" });
    if (mapping) routeMap[mapping.id] = `la/Texts/${outputFile}`;
  }
  fs.writeFileSync(path.join(outputDir, "index.html"), buildIndex(pages), "utf8");
  const indexPath = path.join(siteRoot, "assets", "content-index.js");
  const updatedIndex = updateLocaleMap(routeMap);
  fs.writeFileSync(indexPath, updatedIndex, "utf8");
  bumpSourcePageContentIndex();
  process.stdout.write(`Built ${pages.length} Latin source pages and updated ${Object.keys(routeMap).length} language routes.\n`);
}

main();
