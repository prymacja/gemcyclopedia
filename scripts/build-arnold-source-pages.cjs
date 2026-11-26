#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const siteRoot = path.resolve(__dirname, "..");
const vaultTexts = process.env.GEMCYCLOPEDIA_VAULT_TEXTS || "D:/Obsidian/Gemcyclopedia/Texts";
const pageId = "Texts/Arnoldus Saxo - De gemmarum virtutibus";
const file = "Arnoldus Saxo - De gemmarum virtutibus.html";

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function extract(markdown) {
  let body = markdown.replace(/^\uFEFF/, "");
  const meta = {};
  if (body.startsWith("---\n")) {
    const end = body.indexOf("\n---", 4);
    if (end >= 0) {
      for (const line of body.slice(4, end).split(/\r?\n/)) {
        const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (match) meta[match[1]] = match[2].replace(/^(?:["'])(.*)(?:["'])$/, "$1");
      }
      body = body.slice(end + 4).replace(/^\r?\n/, "");
    }
  }
  return { meta, body };
}

function inline(source) {
  const links = [];
  let text = String(source).replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_, label, href) => {
    const token = `\uE000${links.length}\uE001`;
    links.push(`<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`);
    return token;
  });
  text = escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
  return text.replace(/\uE000(\d+)\uE001/g, (_, index) => links[Number(index)]);
}

function markdownToHtml(markdown) {
  const out = [];
  let paragraph = [];
  const flush = () => {
    if (paragraph.length) out.push(`<p>${inline(paragraph.join(" ").trim())}</p>`);
    paragraph = [];
  };
  for (const line of markdown.replace(/\r/g, "").split("\n")) {
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (!line.trim()) { flush(); continue; }
    if (heading) {
      flush();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
    } else {
      paragraph.push(line.trim());
    }
  }
  flush();
  return out.join("\n");
}

function pageHtml({ locale, title, description, content }) {
  const polish = locale === "pl";
  const base = polish ? "../.." : "..";
  const dataLocale = polish ? "pl" : "en";
  const langLabel = polish ? "Język" : "Language";
  const homeLabel = polish ? "Strona główna" : "Home";
  const gemsLabel = polish ? "Klejnoty" : "Gems";
  const powersLabel = polish ? "Moce" : "Powers";
  const locationsLabel = polish ? "Miejsca" : "Locations";
  const sourcesLabel = polish ? "Źródła" : "Sources";
  const discover = polish ? "ODKRYWAJ" : "DISCOVER";
  const searchLabel = polish ? "Szukaj w encyklopedii" : "Search the encyclopedia";
  const placeholder = polish ? "Szukaj klejnotów, mocy, miejsc i źródeł…" : "Search gems, powers, places, and sources…";
  const sourceIndex = polish ? "Biblioteka źródłowa" : "Source library";
  const homeLink = polish ? "../index.html" : "../en/index.html";
  const footerName = polish ? "Gemcyklopedia" : "Gemcyclopedia";
  const contact = "pajakiyt@gmail.com";
  return `<!DOCTYPE html>
<html data-locale="${dataLocale}" data-theme="dark" lang="${dataLocale}">
<head>
<meta charset="utf-8"/><meta content="width=device-width, initial-scale=1" name="viewport"/><meta content="dark light" name="color-scheme"/>
<meta content="${escapeHtml(description)}" name="description"/><title>${escapeHtml(title)} · Gemcyclopedia</title>
<link href="${base}/assets/gem-mark.svg" rel="icon" type="image/svg+xml"/><link href="${base}/assets/site.css?v=3" rel="stylesheet"/>
<script defer="" src="${base}/assets/content-index.js?v=6"></script><script defer="" src="${base}/assets/site.js?v=6"></script>
</head><body class="content-page" data-current-page="${escapeHtml(pageId)}" data-site-base="${base}">
<header class="topbar"><button aria-expanded="false" aria-label="${polish ? "Otwórz nawigację" : "Open navigation"}" class="mobile-nav-toggle" id="mobile-nav-toggle">☰</button>
<a class="brand" href="${homeLink}"><strong data-i18n="brand">${footerName}</strong></a>
<div class="search-wrap"><label class="sr-only" data-i18n="searchLabel" for="site-search">${searchLabel}</label><input autocomplete="off" id="site-search" placeholder="${placeholder}" type="search"/><kbd>⌘ K</kbd><div class="search-results" id="search-results" role="listbox"></div></div>
<div class="top-actions"><button aria-label="${polish ? "Przełącz jasny i ciemny wygląd" : "Switch light and dark appearance"}" class="theme-toggle" id="theme-toggle" title="${polish ? "Przełącz jasny i ciemny wygląd" : "Switch light and dark appearance"}" type="button">◐</button><label class="language-select"><span data-i18n="language">${langLabel}</span><select aria-label="${langLabel}" id="language-select"><option${polish ? "" : " selected=\"True\""} value="en">English · EN</option><option${polish ? " selected=\"True\"" : ""} value="pl">Polski · PL</option></select></label></div></header>
<div class="page-shell with-toc"><aside class="left-rail" id="left-rail"><div class="rail-label">${discover}</div>
<nav class="primary-nav"><a class="home-link" data-i18n="home" href="${homeLink}">${homeLabel}</a><a data-i18n="gems" href="../Gems/index.html">${gemsLabel}</a><a data-i18n="powers" href="../Powers/Browse.html">${powersLabel}</a><a data-i18n="locations" href="../Locations/Browse.html">${locationsLabel}</a><a data-i18n="sources" href="index.html">${sourcesLabel}</a></nav>
<div class="rail-divider"></div><button class="rail-action" data-i18n="randomArticle" id="random-article">${polish ? "Otwórz losowy artykuł" : "Open random article"}</button><button class="rail-action" data-i18n="randomGem" id="random-gem">${polish ? "Otwórz losowy klejnot" : "Open random gem"}</button></aside>
<main class="main-column" id="main-content"><div class="breadcrumbs"><a data-i18n="home" href="${homeLink}">${homeLabel}</a><span>/</span><a href="index.html">${sourceIndex}</a><span>/</span><span>${escapeHtml(title)}</span></div>
<div class="article-toolbar"><span class="page-type">${polish ? "Tekst źródłowy" : "Source text"}</span></div><article class="article-content" data-page-title="${escapeHtml(title)}"><div class="article-text">${content}</div></article>
<footer class="site-footer"><span>${polish ? "Utworzono: Adrian Skoczkowski 2026, Kontakt pod adresem:" : "Created by Adrian Skoczkowski 2026, contact:"} <a href="mailto:${contact}">${contact}</a></span><a href="${homeLink}">${footerName}</a></footer></main>
<aside class="right-rail"><div class="rail-card"><h2 data-i18n="contents">${polish ? "Na tej stronie" : "On this page"}</h2><nav class="toc"></nav></div></aside></div></body></html>`;
}

function card(title, href, summary, locale) {
  const type = locale === "pl" ? "Pełny tekst" : "Full text";
  return `<a class="index-card" href="${href}"><span class="index-card-title">${escapeHtml(title)}</span><span class="index-card-summary">${escapeHtml(summary)}</span><small>${type}</small></a>`;
}

function updateIndex(locale, title, summary) {
  const relative = locale === "pl" ? path.join("pl", "Texts", "index.html") : path.join("Texts", "index.html");
  let html = fs.readFileSync(path.join(siteRoot, relative), "utf8");
  html = html.replace(/<section class="alpha-group" id="letter-a">[\s\S]*?<\/section>/g, "");
  html = html.replace(/<div class="letter-nav">([\s\S]*?)<\/div>/, (_, nav) => {
    const links = [...nav.matchAll(/<a href="#letter-([^\"]+)">([^<]+)<\/a>/g)].map((match) => ({ id: match[1], label: match[2] }));
    if (!links.some((link) => link.id === "a")) links.push({ id: "a", label: "A" });
    links.sort((a, b) => a.label.localeCompare(b.label, locale));
    return `<div class="letter-nav">${links.map((link) => `<a href="#letter-${link.id}">${link.label}</a>`).join("")}</div>`;
  });
  const aSection = `<section class="alpha-group" id="letter-a"><h2>A</h2><div class="index-grid">${card(title, encodeURI(file), summary, locale)}</div></section>`;
  html = html.replace("</section><section class=\"alpha-group\" id=\"letter-b\">", `</section>${aSection}<section class="alpha-group" id="letter-b">`);
  html = html.replace(/<p class="eyebrow">\d+ (?:entries|wpisów)<\/p>/, `<p class="eyebrow">12 ${locale === "pl" ? "wpisów" : "entries"}</p>`);
  fs.writeFileSync(path.join(siteRoot, relative), html, "utf8");
}

function updateContentIndex(pages, routes) {
  const indexPath = path.join(siteRoot, "assets", "content-index.js");
  const source = fs.readFileSync(indexPath, "utf8");
  const equal = source.indexOf("=");
  const data = JSON.parse(source.slice(equal + 1).trim().replace(/;$/, ""));
  data.pages = data.pages.filter((page) => page.id !== pageId);
  data.pages.push(...pages);
  data.pageLocales ||= {};
  data.pageLocales[pageId] = { ...(data.pageLocales[pageId] || {}), ...routes };
  fs.writeFileSync(indexPath, `window.GEMCYCLOPEDIA_DATA =${JSON.stringify(data)};`, "utf8");
}

function main() {
  const configurations = [
    { locale: "en", source: "Arnold of Saxony - On the Virtues of Gems.md", title: "Arnold of Saxony — On the Virtues of Gems", href: `Texts/${file}` },
    { locale: "pl", source: "Arnold z Saksonii - O mocach kamieni szlachetnych.md", title: "Arnold z Saksonii — O mocach kamieni szlachetnych", href: `pl/Texts/${file}` },
  ];
  const pages = [];
  const routes = {};
  for (const config of configurations) {
    const raw = fs.readFileSync(path.join(vaultTexts, config.source), "utf8");
    const { meta, body } = extract(raw);
    const content = markdownToHtml(body);
    const plain = body.replace(/^#+\s+/gm, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`]/g, "").replace(/\s+/g, " ").trim();
    const description = plain.slice(0, 290);
    const outDir = config.locale === "pl" ? path.join(siteRoot, "pl", "Texts") : path.join(siteRoot, "Texts");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, file), pageHtml({ locale: config.locale, title: config.title, description, content }), "utf8");
    const indexSummary = plain.slice(plain.indexOf(". ") + 2, plain.indexOf(". ") + 2 + 240);
    updateIndex(config.locale, config.title, indexSummary || plain.slice(0, 240));
    if (config.locale === "en") pages.push({ id: pageId, href: config.href, title: config.title, category: "source", description, searchText: plain });
    routes[config.locale] = config.href;
  }
  updateContentIndex(pages, routes);
  process.stdout.write("Built Arnoldus Saxo English and Polish source pages, indexes, and language routes.\n");
}

main();
