#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const siteRoot = path.resolve(__dirname, "..");
const dataDir = path.join(__dirname, "data", "latin-gems");
const outputDir = path.join(siteRoot, "la", "Gems");
const indexPath = path.join(siteRoot, "assets", "content-index.js");

function esc(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function attr(value) { return esc(value).replaceAll("`", "&#96;"); }

function slug(value) {
  return String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function loadData() {
  if (!fs.existsSync(dataDir)) return [];
  const rows = [];
  for (const file of fs.readdirSync(dataDir).filter((name) => name.endsWith(".json")).sort()) {
    const batch = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
    if (!Array.isArray(batch)) throw new Error(`${file} must contain a JSON array`);
    for (const row of batch) rows.push({ ...row, _file: file });
  }
  const sitePages = new Map(readSiteData().pages.map((page) => [page.id, page]));
  for (const row of rows) {
    const page = sitePages.get(row.id);
    if (!page?.featureImage) continue;
    row.featureImage = page.featureImage;
    const sourcePath = path.join(siteRoot, page.href || `${row.id}.html`);
    if (!fs.existsSync(sourcePath)) continue;
    const sourceHtml = fs.readFileSync(sourcePath, "utf8");
    const imageBlock = sourceHtml.match(/<div class="infobox-image">([\s\S]*?)<\/div>\s*<div class="infobox-table">/)?.[1] || "";
    row.imageSource = imageBlock.match(/<a[^>]+href="(https:\/\/[^\"]+)"/)?.[1] || "";
  }
  const seen = new Set();
  for (const row of rows) {
    if (!row.id || !row.title || !row.summary || !Array.isArray(row.overview) || !Array.isArray(row.sources) || !row.sources.length) {
      throw new Error(`${row.id || row.title || row._file} needs id, title, summary, overview, and at least one source`);
    }
    if (!row.id.startsWith("Gems/")) throw new Error(`${row.id}: id must begin Gems/`);
    if (seen.has(row.id)) throw new Error(`Duplicate Latin gem entry ${row.id}`);
    seen.add(row.id);
    for (const [label, value] of row.overview) {
      if (!label || !value) throw new Error(`${row.id}: overview rows require a label and value`);
    }
    for (const source of row.sources) {
      if (!source.title || !source.href || !source.text) throw new Error(`${row.id}: each source requires title, href, and text`);
      if (source.href.startsWith("../Texts/")) {
        const [relativePath, anchor] = source.href.split("#", 2);
        const sourcePath = path.resolve(outputDir, decodeURIComponent(relativePath));
        if (!sourcePath.startsWith(path.join(siteRoot, "la", "Texts") + path.sep) || !fs.existsSync(sourcePath)) {
          throw new Error(`${row.id}: Latin source page does not exist: ${source.href}`);
        }
        if (anchor && !fs.readFileSync(sourcePath, "utf8").includes(`id="${anchor}"`)) {
          throw new Error(`${row.id}: Latin source anchor does not exist: ${source.href}`);
        }
      } else if (!/^https:\/\/[a-z0-9.-]+\//i.test(source.href)) {
        throw new Error(`${row.id}: source href must be a local Latin text page or HTTPS link: ${source.href}`);
      }
    }
  }
  return rows;
}

function paragraph(text) { return `<p>${esc(text)}</p>`; }

function renderPage(row) {
  const filename = row.file || `${row.id.slice("Gems/".length)}.html`;
  const pageId = row.id;
  const title = row.title;
  const summary = esc(row.summary);
  const overviewRows = row.overview.map(([label, value]) => `<tr><th scope="row">${esc(label)}</th><td>${esc(value)}</td></tr>`).join("");
  const witnesses = row.sources.map((source, i) => `<section class="latin-testimony"><h3 id="witness-${i + 1}">${esc(source.title)}</h3>${paragraph(source.text)}<p><a href="${attr(source.href)}">Textum fontis lege</a></p></section>`).join("\n");
  const sourceList = row.sources.map((source, i) => `<li><a href="${attr(source.href)}">${esc(source.title)}</a></li>`).join("\n");
  const image = row.featureImage ? `<div class="infobox-image"><figure class="embedded-image"><img alt="${attr(title)}" loading="lazy" src="../../${row.featureImage.split("/").map(encodeURIComponent).join("/")}"/></figure><p><em>${row.imageSource ? `<a href="${attr(row.imageSource)}" target="_blank" rel="noopener noreferrer">Fons imaginis</a>` : `<a href="../../${row.featureImage.split("/").map(encodeURIComponent).join("/")}">Fons imaginis</a>`}.</em></p></div>` : "";
  return `<!DOCTYPE html>
<html data-locale="la" data-theme="dark" lang="la">
<head>
<meta charset="utf-8"/><meta content="width=device-width, initial-scale=1" name="viewport"/>
<meta content="dark light" name="color-scheme"/><meta content="${attr(row.summary)}" name="description"/>
<title>${esc(title)} · Gemcyclopedia</title>
<link href="../../assets/gem-mark.svg" rel="icon" type="image/svg+xml"/>
<link href="../../assets/site.css?v=3" rel="stylesheet"/>
<script defer="" src="../../assets/content-index.js?v=6"></script><script defer="" src="../../assets/site.js?v=6"></script>
<style>.article-content[data-page-title]{line-height:1.7}.latin-testimony{margin-block:1.5rem}.latin-testimony p{font-family:Georgia,serif}.latin-testimony a{font-family:inherit}</style>
</head>
<body class="content-page" data-current-page="${attr(pageId)}" data-site-base="../..">
<header class="topbar"><button aria-expanded="false" aria-label="Open navigation" class="mobile-nav-toggle" id="mobile-nav-toggle">☰</button><a class="brand" href="../../en/index.html"><strong data-i18n="brand">Gemcyclopedia</strong></a><div class="search-wrap"><label class="sr-only" data-i18n="searchLabel" for="site-search">Search the encyclopedia</label><input autocomplete="off" id="site-search" placeholder="Search gems, powers, places, and sources…" type="search"/><kbd>⌘ K</kbd><div class="search-results" id="search-results" role="listbox"></div></div><div class="top-actions"><button aria-label="Switch light and dark appearance" class="theme-toggle" id="theme-toggle" title="Switch light and dark appearance" type="button">◐</button><label class="language-select"><span data-i18n="language">Lingua</span><select aria-label="Language" id="language-select"><option value="en">English · EN</option><option value="pl">Polski · PL</option></select></label></div></header>
<div class="page-shell with-toc"><aside class="left-rail" id="left-rail"><div class="rail-label">DISCOVER</div><nav class="primary-nav"><a class="home-link" data-i18n="home" href="../../en/index.html">Home</a><a data-i18n="gems" href="index.html">Gems</a><a data-i18n="powers" href="../../Powers/Browse.html">Powers</a><a data-i18n="locations" href="../../Locations/Browse.html">Locations</a><a data-i18n="sources" href="../Texts/index.html">Sources</a></nav><div class="rail-divider"></div><button class="rail-action" data-i18n="randomArticle" id="random-article">Open random article</button><button class="rail-action" data-i18n="randomGem" id="random-gem">Open random gem</button></aside>
<main class="main-column" id="main-content"><div class="breadcrumbs"><a data-i18n="home" href="../../en/index.html">Home</a><span>/</span><a href="index.html">Gemme Latine</a><span>/</span><span>${esc(title)}</span></div><div class="article-toolbar"><span class="page-type">Gemma · Latin</span></div>
<article class="article-content" data-page-title="${attr(title)}"><div class="article-heading"><div><h1>${esc(title)}</h1></div></div><aside class="article-infobox"><h2 id="overview">${esc(title)}</h2>${image}<div class="infobox-table"><table class="overview-table"><tbody>${overviewRows}</tbody></table></div></aside><div class="article-text">
<h2 id="summarium">Summarium</h2>${paragraph(summary)}
<h2 id="testimonia">Testimonia</h2>${witnesses}
<h2 id="fontes">Fontes</h2><ol>${sourceList}</ol>
</div></article><footer class="site-footer"><span>Gemcyclopedia · 2026</span><a href="../../en/index.html">Gemcyclopedia</a></footer></main><aside class="right-rail"><div class="rail-card"><h2 data-i18n="contents">In hac pagina</h2><nav class="toc"></nav></div></aside></div></body></html>`;
}

function renderIndex(rows) {
  const collator = new Intl.Collator("la");
  const sorted = [...rows].sort((a, b) => collator.compare(a.title, b.title));
  const letters = [...new Set(sorted.map((row) => row.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "")[0].toUpperCase()))];
  const nav = letters.map((letter) => `<a href="#letter-${slug(letter)}">${esc(letter)}</a>`).join(" ");
  const groups = letters.map((letter) => {
    const group = sorted.filter((row) => row.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "")[0].toUpperCase() === letter);
    return `<section id="letter-${slug(letter)}"><h2>${esc(letter)}</h2><ul>${group.map((row) => `<li><a href="${attr(row.file || `${row.id.slice("Gems/".length)}.html`)}">${esc(row.title)}</a></li>`).join("")}</ul></section>`;
  }).join("\n");
  return `<!DOCTYPE html>
<html data-locale="la" data-theme="dark" lang="la"><head><meta charset="utf-8"/><meta content="width=device-width, initial-scale=1" name="viewport"/><meta content="dark light" name="color-scheme"/><meta content="Index alphabeticus gemmarum Latine descriptarum." name="description"/><title>Index gemmarum · Gemcyclopedia</title><link href="../../assets/gem-mark.svg" rel="icon" type="image/svg+xml"/><link href="../../assets/site.css?v=3" rel="stylesheet"/><script defer="" src="../../assets/content-index.js?v=6"></script><script defer="" src="../../assets/site.js?v=6"></script></head>
<body class="content-page" data-current-page="__gems_browse__" data-site-base="../.."><header class="topbar"><button aria-expanded="false" aria-label="Aperi navigationem" class="mobile-nav-toggle" id="mobile-nav-toggle">☰</button><a class="brand" href="../../en/index.html"><strong data-i18n="brand">Gemcyclopedia</strong></a><div class="search-wrap"><label class="sr-only" data-i18n="searchLabel" for="site-search">Quaere in encyclopaedia</label><input autocomplete="off" id="site-search" placeholder="Quaere gemmas, vires, loca et fontes…" type="search"/><kbd>⌘ K</kbd><div class="search-results" id="search-results" role="listbox"></div></div><div class="top-actions"><button aria-label="Modum clarum elige" class="theme-toggle" id="theme-toggle" type="button">◐</button><label class="language-select"><span data-i18n="language">Lingua</span><select aria-label="Lingua" id="language-select"><option value="en">English · EN</option><option value="pl">Polski · PL</option></select></label></div></header><div class="page-shell"><aside class="left-rail" id="left-rail"><div class="rail-label" data-i18n="discover">INVESTIGA</div><nav class="primary-nav"><a class="home-link" data-i18n="home" href="../../en/index.html">Domus</a><a data-i18n="gems" href="index.html">Gemmae</a><a data-i18n="powers" href="../../Powers/Browse.html">Vires</a><a data-i18n="locations" href="../../Locations/Browse.html">Loca</a><a data-i18n="sources" href="../Texts/index.html">Fontes</a></nav></aside><main class="main-column" id="main-content"><div class="breadcrumbs"><a data-i18n="home" href="../../en/index.html">Domus</a><span>/</span><span>Index gemmarum</span></div><section class="index-intro"><p class="eyebrow">${rows.length} gemmae Latine</p><h1>Index gemmarum</h1><nav class="letter-nav">${nav}</nav></section>${groups}<footer class="site-footer"><span>Gemcyclopedia · 2026</span><a href="../../en/index.html">Gemcyclopedia</a></footer></main></div></body></html>`;
}

function readSiteData() {
  const text = fs.readFileSync(indexPath, "utf8");
  const match = text.match(/^window\.GEMCYCLOPEDIA_DATA\s*=\s*([\s\S]*);\s*$/);
  if (!match) throw new Error("Cannot parse assets/content-index.js");
  return JSON.parse(match[1]);
}

function writeSiteData(data) {
  fs.writeFileSync(indexPath, `window.GEMCYCLOPEDIA_DATA =${JSON.stringify(data)};\n`, "utf8");
}

function updateIndex(rows) {
  const data = readSiteData();
  const byId = new Map(data.pages.map((page) => [page.id, page]));
  data.pageLocales ||= {};
  for (const row of rows) {
    const file = row.file || `${row.id.slice("Gems/".length)}.html`;
    let page = byId.get(row.id);
    if (!page) {
      page = { id: row.id, href: `Gems/${file}`, title: row.englishTitle || row.title, category: "gem", description: row.summary, searchText: row.summary, wordCount: 0 };
      data.pages.push(page);
      byId.set(row.id, page);
    }
    const route = `la/Gems/${file}`;
    data.pageLocales[row.id] ||= { en: page.href || `Gems/${file}` };
    if (!data.pageLocales[row.id].pl && fs.existsSync(path.join(siteRoot, "pl", "Gems", file))) data.pageLocales[row.id].pl = `pl/Gems/${file}`;
    data.pageLocales[row.id].la = route;
    page.laTitle = row.title;
    page.laDescription = row.summary;
    page.laSearchText = [row.title, row.summary, ...row.overview.flat()].join(" ");
  }
  data.pageLocales.home = { ...(data.pageLocales.home || {}), en: "en/index.html", pl: "pl/index.html", la: "la/index.html" };
  data.pageLocales.__gems_browse__ = { ...(data.pageLocales.__gems_browse__ || {}), en: "Gems/index.html", pl: "pl/Gems/index.html", la: "la/Gems/index.html" };
  data.pageLocales.__powers_browse__ = { ...(data.pageLocales.__powers_browse__ || {}), en: "Powers/Browse.html", pl: "pl/Powers/Browse.html", la: "la/Powers/Browse.html" };
  data.pageLocales.__locations_browse__ = { ...(data.pageLocales.__locations_browse__ || {}), en: "Locations/Browse.html", pl: "pl/Locations/Browse.html", la: "la/Locations/Browse.html" };
  data.pageLocales.__texts_browse__ = { ...(data.pageLocales.__texts_browse__ || {}), en: "Texts/index.html", pl: "pl/Texts/index.html", la: "la/Texts/index.html" };
  writeSiteData(data);
}

function main() {
  const rows = loadData();
  fs.mkdirSync(outputDir, { recursive: true });
  for (const row of rows) {
    const filename = row.file || `${row.id.slice("Gems/".length)}.html`;
    fs.writeFileSync(path.join(outputDir, filename), renderPage(row), "utf8");
  }
  if (rows.length) {
    fs.writeFileSync(path.join(outputDir, "index.html"), renderIndex(rows), "utf8");
    updateIndex(rows);
  }
  console.log(`Built ${rows.length} Latin gem pages${rows.length ? " and their alphabetic index" : ""}.`);
}

main();
