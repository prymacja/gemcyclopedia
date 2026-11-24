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
  "Epiphanius - On the Twelve Gemstones - Latin.md": {
    id: "Texts/Epiphanius - On the Twelve Gemstones",
    file: "Epiphanius - On the Twelve Gemstones - Latin.html",
  },
  "Hildegard - Physica Stones - Latin.md": {
    id: "Texts/Hildegard - Physica Stones",
    file: "Hildegard - Physica Stones - Latin.html",
  },
  "Isidore - Etymologies Book XVI - Latin.md": {
    id: "Texts/Isidore - Etymologies Book XVI",
    file: "Isidore - Etymologies Book XVI - Latin.html",
  },
  "Marbodus - De lapidibus - Latin.md": {
    id: "Texts/Marbodus - De lapidibus",
    file: "Marbodus - De lapidibus - Latin.html",
  },
  "Thomas Aquinas - De operationibus occultis naturae - Latin.md": {
    id: "Texts/Thomas Aquinas - De operationibus occultis naturae (excerpt)",
    file: "Thomas Aquinas - De operationibus occultis naturae - Latin.html",
  },
};

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

function buildIndex(pages) {
  const cards = pages.map((page) => `<a class="index-card" href="${escapeHtml(encodeURI(page.file))}"><span class="index-card-title">${escapeHtml(page.title)}</span><span class="index-card-summary">${escapeHtml(page.extent || page.author || "Latin source text")}</span><small>${escapeHtml(page.status || "Latin text")}</small></a>`).join("");
  return `<!DOCTYPE html>
<html data-locale="la" data-theme="dark" lang="la"><head>
<meta charset="utf-8"/><meta content="width=device-width, initial-scale=1" name="viewport"/><meta content="dark light" name="color-scheme"/>
<meta content="Latin source texts and complete cited passages used by Gemcyclopedia." name="description"/><title>Source library · Latin · Gemcyclopedia</title>
<link href="../../assets/gem-mark.svg" rel="icon" type="image/svg+xml"/><link href="../../assets/site.css?v=3" rel="stylesheet"/>
<script defer="" src="../../assets/content-index.js?v=${contentIndexVersion}"></script><script defer="" src="../../assets/site.js?v=4"></script></head>
<body class="content-page" data-current-page="__texts_browse__" data-site-base="../.."><header class="topbar">
<button aria-expanded="false" aria-label="Open navigation" class="mobile-nav-toggle" id="mobile-nav-toggle">☰</button><a class="brand" href="../../en/index.html"><strong data-i18n="brand">Gemcyclopedia</strong></a>
<div class="search-wrap"><label class="sr-only" data-i18n="searchLabel" for="site-search">Search the encyclopedia</label><input autocomplete="off" id="site-search" placeholder="Search gems, powers, places, and sources…" type="search"/><kbd>⌘ K</kbd><div class="search-results" id="search-results" role="listbox"></div></div>
<div class="top-actions"><button aria-label="Switch light and dark appearance" class="theme-toggle" id="theme-toggle" title="Switch light and dark appearance" type="button">◐</button><label class="language-select"><span data-i18n="language">Language</span><select aria-label="Language" id="language-select"><option value="en">English · EN</option><option value="pl">Polski · PL</option></select></label></div></header>
<div class="page-shell"><aside class="left-rail" id="left-rail"><div class="rail-label">DISCOVER</div><nav class="primary-nav"><a class="home-link" data-i18n="home" href="../../en/index.html">Home</a><a data-i18n="gems" href="../../Gems/index.html">Gems</a><a data-i18n="powers" href="../../Powers/Browse.html">Powers</a><a data-i18n="locations" href="../../Locations/Browse.html">Locations</a><a data-i18n="sources" href="index.html">Sources</a></nav></aside><main class="main-column" id="main-content">
<div class="breadcrumbs"><a data-i18n="home" href="../../en/index.html">Home</a><span>/</span><span>Source library · Latin</span></div><div class="article-toolbar"><span class="page-type">Source library</span></div>
<section class="index-intro"><p class="eyebrow">${pages.length} Latin texts</p><h1>Source library · Latin</h1><p>Complete texts and clearly scoped cited passages. Each entry names its edition, witness, and transcription status.</p></section>
<section class="alpha-group"><div class="index-grid">${cards}</div></section>
<footer class="site-footer"><span>Created by Adrian Skoczkowski 2026, Contact at: <a href="mailto:pajakiyt@gmail.com">pajakiyt@gmail.com</a></span><a href="../../en/index.html">Gemcyclopedia</a></footer></main></div></body></html>`;
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

function main() {
  if (!fs.existsSync(vaultTexts)) throw new Error(`Vault text directory not found: ${vaultTexts}`);
  fs.mkdirSync(outputDir, { recursive: true });
  const inputFiles = fs.readdirSync(vaultTexts)
    .filter((file) => file.toLowerCase().endsWith("- latin.md"))
    .sort((a, b) => a.localeCompare(b, "en"));
  const pages = [];
  const routeMap = {};
  for (const inputFile of inputFiles) {
    const raw = fs.readFileSync(path.join(vaultTexts, inputFile), "utf8");
    const { frontMatter, body } = extractMarkdown(raw);
    const mapping = localePages[inputFile];
    const outputFile = mapping?.file || inputFile.replace(/\.md$/i, ".html");
    const id = mapping?.id || `Texts/Latin/${slug(firstHeading(body, frontMatter.title || inputFile))}`;
    const title = firstHeading(body, frontMatter.title || inputFile.replace(/\.md$/i, ""));
    const description = frontMatter.extent || frontMatter.source || "Latin source text";
    const content = markdownToHtml(body);
    const outputPath = path.join(outputDir, outputFile);
    fs.writeFileSync(outputPath, shell({ title, description, pageId: id, content, hasLocaleMap: Boolean(mapping) }), "utf8");
    pages.push({ file: outputFile, title: frontMatter.title || title, author: frontMatter.author || "", extent: frontMatter.extent || "", status: frontMatter.status || "Latin text" });
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
