const fs = require("node:fs");
const path = require("node:path");

const siteRoot = path.resolve(__dirname, "..");
const indexPath = path.join(siteRoot, "assets", "content-index.js");

const latinUi = {
  brand: "Gemcyclopedia",
  search: "Quaere gemmas, vires, loca et fontes…",
  searchLabel: "Quaere in encyclopaedia",
  gems: "Gemmae",
  powers: "Vires",
  locations: "Loca",
  sources: "Fontes",
  randomArticle: "Articulum fortuitum aperi",
  randomGem: "Gemmam fortuitam aperi",
  browse: "Encyclopaediam inspice",
  contents: "In hac pagina",
  backlinks: "Huc referunt",
  moreLinks: "paginae plures",
  noResults: "Nulla pagina congruens inventa est.",
  language: "Lingua",
  futureLanguages: "Editio Latina.",
  darkMode: "Speciem muta",
  home: "Domus",
  allPages: "Omnes paginae",
  excerpt: "Excerptum",
  fullText: "Textus integer",
  sourceCollection: "Collectio fontium",
  localEdition: "Gemcyclopedia · 2026",
  unresolved: "Relatio nondum soluta",
  unresolvedText: "Haec vox ad encyclopaediam refert, sed articulus proprius nondum adest.",
  notFound: "Nullus articulus congruens inventus est.",
  exactTitle: "Titulus idem",
  exactAlias: "Nomen aliud idem",
  imageUnavailable: "Imago non praesto",
  switchToLight: "Speciem claram elige",
  switchToDark: "Speciem obscuram elige",
  stubTitle: "Articulus nondum perfectus",
  stubBody: "De hoc lapide pauca traduntur. Si plura nosti, ad dominum paginae scribe.",
  warningTitle: "Monitum!",
  warningBody: "Hic articulus divinationem, necromantiam, spirituum evocationem vel alias artes illicitas memorat. Haec ne temptaveris. Prudenter lege.",
  discover: "INSPICE",
  collectionCounts: "Numeri collectionis",
  featuredGem: "Gemma selecta",
  commonGems: "Gemmae frequentes",
  loadMore: "Plura ostende",
  sourcePages: "Textus fontium",
};

const powerTitles = {
  "Powers/Animals, Crops, and Livestock": "Animalia, Segetes et Pecora",
  "Powers/Attraction and Material Transformations": "Attractio et Mutationes Rerum",
  "Powers/Divination, Dreams, and Hidden Things": "Divinatio, Somnia et Res Occultae",
  "Powers/Exorcism": "Exorcismus",
  "Powers/Fertility and Childbirth": "Fertilitas et Partus",
  "Powers/Fire, Heat, and Light": "Ignis, Calor et Lux",
  "Powers/Healing": "Sanatio",
  "Powers/Invisibility and Concealment": "Invisibilitas et Occultatio",
  "Powers/Love, Desire, and Self-Control": "Amor, Cupiditas et Temperantia",
  "Powers/Magic": "Magia",
  "Powers/Necromancy": "Necromantia",
  "Powers/Protection and Warding": "Tutela et Defensio",
  "Powers/Victory, Conflict, and Authority": "Victoria, Certamen et Auctoritas",
  "Powers/Virtue, Favor, and Prosperity": "Virtus, Favor et Prosperitas",
  "Powers/Weather and Waters": "Tempestates et Aquae",
};

const placeTitles = {
  "Locations/Africa": "Africa",
  "Locations/Arabia": "Arabia",
  "Locations/Armenia": "Armenia",
  "Locations/Asia": "Asia",
  "Locations/Assyria": "Assyria",
  "Locations/Babylonia": "Babylonia",
  "Locations/Bactria": "Bactria",
  "Locations/Britain": "Britannia",
  "Locations/Ceylon": "Taprobane",
  "Locations/Cyprus": "Cyprus",
  "Locations/Egypt": "Aegyptus",
  "Locations/Ethiopia": "Aethiopia",
  "Locations/Europe": "Europa",
  "Locations/France": "Gallia",
  "Locations/Germany": "Germania",
  "Locations/Greece": "Graecia",
  "Locations/India": "India",
  "Locations/Ireland": "Hibernia",
  "Locations/Italy": "Italia",
  "Locations/Judea": "Iudaea",
  "Locations/Libya": "Libya",
  "Locations/Macedonia": "Macedonia",
  "Locations/Mesopotamia": "Mesopotamia",
  "Locations/Numidia": "Numidia",
  "Locations/Parthia": "Parthia",
  "Locations/Persia": "Persia",
  "Locations/Scythia": "Scythia",
  "Locations/Spain": "Hispania",
  "Locations/Syria": "Syria",
  "Locations/Thrace": "Thracia",
  "Locations/Turkey": "Anatolia",
};

const powerDescriptions = {
  "Powers/Animals, Crops, and Livestock": "Vires gemmarum in animalia, segetes et pecora hic recensentur.",
  "Powers/Attraction and Material Transformations": "De attractione et mutationibus corporum a gemmis effectis.",
  "Powers/Divination, Dreams, and Hidden Things": "De divinatione, somniis atque rebus occultis.",
  "Powers/Exorcism": "De gemmis quae spiritus aut daemones pellere dicuntur.",
  "Powers/Fertility and Childbirth": "De fertilitate, conceptione et partu.",
  "Powers/Fire, Heat, and Light": "De igni, calore, lumine atque gemmarum ardore.",
  "Powers/Healing": "Remedia corporalia secundum morbos disponuntur; eadem gemma pluribus locis apparere potest.",
  "Powers/Invisibility and Concealment": "De invisibilitate atque occultatione.",
  "Powers/Love, Desire, and Self-Control": "De amore, cupiditate et affectibus coercendis.",
  "Powers/Magic": "De artibus magicis, ritibus, figuris sculptis et aliis effectibus occultis.",
  "Powers/Necromancy": "De spiritibus evocandis, interrogandis atque imperio subiciendis.",
  "Powers/Protection and Warding": "De tutela adversus pericula, venena et mala.",
  "Powers/Victory, Conflict, and Authority": "De victoria, certamine et auctoritate.",
  "Powers/Virtue, Favor, and Prosperity": "De virtute, favore et prosperitate.",
  "Powers/Weather and Waters": "De tempestatibus, pluviis et aquis.",
};

const html = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function readData() {
  const raw = fs.readFileSync(indexPath, "utf8");
  const match = raw.match(/^window\.GEMCYCLOPEDIA_DATA\s*=\s*([\s\S]*);\s*$/);
  if (!match) throw new Error("Cannot parse assets/content-index.js");
  return JSON.parse(match[1]);
}

function writeData(data) {
  fs.writeFileSync(indexPath, `window.GEMCYCLOPEDIA_DATA =${JSON.stringify(data)};\n`, "utf8");
}

function renderShell({ title, count, description, pageId, cards }) {
  const collator = new Intl.Collator("la");
  const sorted = [...cards].sort((a, b) => collator.compare(a.title, b.title));
  const letters = [...new Set(sorted.map((card) => Array.from(card.title)[0].toLocaleUpperCase("la")))];
  const nav = letters.map((letter) => `<a href="#letter-${letter.toLowerCase()}">${html(letter)}</a>`).join(" ");
  const groups = letters.map((letter) => {
    const entries = sorted.filter((card) => Array.from(card.title)[0].toLocaleUpperCase("la") === letter);
    const links = entries.map((card) => `<a class="index-card" href="../../${html(card.href)}"><span class="index-card-title">${html(card.title)}</span><span class="index-card-summary">${html(card.summary)}</span></a>`).join("");
    return `<section class="alpha-group" id="letter-${letter.toLowerCase()}"><h2>${html(letter)}</h2><div class="index-grid">${links}</div></section>`;
  }).join("\n");
  return `<!doctype html>
<html data-locale="la" data-theme="dark" lang="la"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark light">
<meta name="description" content="${html(description)}"><title>${html(title)} · Gemcyclopedia</title>
<link rel="icon" type="image/svg+xml" href="../../assets/gem-mark.svg"><link rel="stylesheet" href="../../assets/site.css?v=6">
<script defer src="../../assets/content-index.js?v=6"></script><script defer src="../../assets/site.js?v=6"></script></head>
<body class="content-page" data-current-page="${html(pageId)}" data-site-base="../.."><header class="topbar">
<button aria-expanded="false" aria-label="Aperi navigationem" class="mobile-nav-toggle" id="mobile-nav-toggle">☰</button><a class="brand" href="../../la/index.html"><strong data-i18n="brand">Gemcyclopedia</strong></a>
<div class="search-wrap"><label class="sr-only" data-i18n="searchLabel" for="site-search">Quaere in encyclopaedia</label><input autocomplete="off" id="site-search" placeholder="Quaere gemmas, vires, loca et fontes…" type="search"><kbd>⌘ K</kbd><div class="search-results" id="search-results" role="listbox"></div></div>
<div class="top-actions"><button aria-label="Speciem claram elige" class="theme-toggle" id="theme-toggle" title="Speciem claram elige" type="button">◐</button><label class="language-select"><span data-i18n="language">Lingua</span><select aria-label="Lingua" id="language-select"><option value="en">English · EN</option><option value="pl">Polski · PL</option></select></label></div></header>
<div class="page-shell"><aside class="left-rail" id="left-rail"><div class="rail-label" data-i18n="discover">INSPICE</div><nav class="primary-nav"><a class="home-link" data-i18n="home" href="../../la/index.html">Domus</a><a data-i18n="gems" href="../Gems/index.html">Gemmae</a><a data-i18n="powers" href="../Powers/Browse.html">Vires</a><a data-i18n="locations" href="../Locations/Browse.html">Loca</a><a data-i18n="sources" href="../Texts/index.html">Fontes</a></nav>
<div class="rail-divider"></div><button class="rail-action" data-i18n="randomArticle" id="random-article">Articulum fortuitum aperi</button><button class="rail-action" data-i18n="randomGem" id="random-gem">Gemmam fortuitam aperi</button></aside>
<main class="main-column" id="main-content"><div class="breadcrumbs"><a data-i18n="home" href="../../la/index.html">Domus</a><span>/</span><span>${html(title)}</span></div>
<div class="article-toolbar"><span class="page-type">Index</span></div><section class="index-intro"><p class="eyebrow">${count} paginae</p><h1>${html(title)}</h1><p>${html(description)}</p><div class="letter-nav">${nav}</div></section>
${groups}<footer class="site-footer"><span>Gemcyclopedia · 2026</span><a href="../../la/index.html">Gemcyclopedia</a></footer></main></div></body></html>`;
}

function buildPages(data) {
  const powerCards = data.pages.filter((page) => page.category === "power" && powerTitles[page.id]).map((page) => ({
    href: page.href,
    title: powerTitles[page.id],
    summary: powerDescriptions[page.id] || "Vires gemmis attributae hic breviter recensentur.",
  }));
  const locationCards = data.pages.filter((page) => page.category === "location" && placeTitles[page.id]).map((page) => ({
    href: page.href,
    title: placeTitles[page.id],
    summary: "Hic locus in fontibus antiquis memoratur; gemmae ibi inventae in articulo recensentur.",
  }));
  fs.mkdirSync(path.join(siteRoot, "la", "Powers"), { recursive: true });
  fs.mkdirSync(path.join(siteRoot, "la", "Locations"), { recursive: true });
  fs.writeFileSync(path.join(siteRoot, "la", "Powers", "Browse.html"), renderShell({
    title: "Index virium", count: powerCards.length,
    description: "Index Latine conscriptus virium gemmis attributarum; articuli singuli Anglice vel Polonice leguntur.",
    pageId: "__powers_browse__", cards: powerCards,
  }), "utf8");
  fs.writeFileSync(path.join(siteRoot, "la", "Locations", "Browse.html"), renderShell({
    title: "Index locorum", count: locationCards.length,
    description: "Index Latine conscriptus locorum in fontibus de gemmis memoratorum; articuli singuli Anglice vel Polonice leguntur.",
    pageId: "__locations_browse__", cards: locationCards,
  }), "utf8");
}

function buildHome() {
  return `<!doctype html>
<html data-locale="la" data-theme="dark" lang="la"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark light">
<meta name="description" content="Gemcyclopedia."><title>Gemcyclopedia · Domus</title>
<link rel="icon" type="image/svg+xml" href="../assets/gem-mark.svg"><link rel="stylesheet" href="../assets/site.css?v=6">
<script defer src="../assets/content-index.js?v=6"></script><script defer src="../assets/site.js?v=6"></script></head>
<body class="home-page" data-current-page="home" data-site-base=".."><header class="topbar">
<button aria-expanded="false" aria-label="Aperi navigationem" class="mobile-nav-toggle" id="mobile-nav-toggle">☰</button><a class="brand" href="index.html"><strong data-i18n="brand">Gemcyclopedia</strong></a>
<div class="search-wrap"><label class="sr-only" data-i18n="searchLabel" for="site-search">Quaere in encyclopaedia</label><input autocomplete="off" id="site-search" placeholder="Quaere gemmas, vires, loca et fontes…" type="search"><kbd>⌘ K</kbd><div class="search-results" id="search-results" role="listbox"></div></div>
<div class="top-actions"><button aria-label="Speciem claram elige" class="theme-toggle" id="theme-toggle" title="Speciem claram elige" type="button">◐</button><label class="language-select"><span data-i18n="language">Lingua</span><select aria-label="Lingua" id="language-select"><option value="en">English · EN</option><option value="pl">Polski · PL</option></select></label></div></header>
<div class="page-shell"><aside class="left-rail" id="left-rail"><div class="rail-label" data-i18n="discover">INSPICE</div><nav class="primary-nav"><a class="home-link" data-i18n="home" href="index.html">Domus</a><a data-i18n="gems" href="../Gems/index.html">Gemmae</a><a data-i18n="powers" href="../Powers/Browse.html">Vires</a><a data-i18n="locations" href="../Locations/Browse.html">Loca</a><a data-i18n="sources" href="../Texts/index.html">Fontes</a></nav>
<div class="rail-divider"></div><button class="rail-action" data-i18n="randomArticle" id="random-article">Articulum fortuitum aperi</button><button class="rail-action" data-i18n="randomGem" id="random-gem">Gemmam fortuitam aperi</button></aside>
<main class="main-column" id="main-content"><div class="breadcrumbs"><a data-i18n="home" href="index.html">Domus</a><span>/</span><span>Domus</span></div>
<section class="home-header"><h1>Gemcyclopedia</h1></section>
<section aria-label="Numeri collectionis" class="stats-row"><div><strong>318</strong><span>Gemmae</span></div><div><strong>15</strong><span>Vires</span></div><div><strong>31</strong><span>Loca</span></div><div><strong>21</strong><span>Textus fontium</span></div></section>
<section class="featured-gem"><p class="section-label">Gemma selecta</p><div class="featured-gem-content"><div><h2><a href="../la/Gems/index.html" id="featured-gem-title">Gemma legitur…</a></h2><p class="featured-description" id="featured-gem-description"></p></div><a aria-label="Gemma selecta aperi" class="featured-image-link" href="../la/Gems/index.html" id="featured-gem-image-link"><img alt="" id="featured-gem-image" loading="lazy"></a></div></section>
<section class="common-gems-section"><h2>Gemmae frequentes</h2><div class="common-gem-grid" id="common-gem-grid"></div><button class="button load-more-button" id="load-more-gems" type="button">Plura ostende</button></section>
<footer class="site-footer"><span>Gemcyclopedia · 2026</span><a href="index.html">Gemcyclopedia</a></footer></main></div></body></html>`;
}

function bumpHtmlAssetVersions() {
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === ".git") continue;
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(filePath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
        const before = fs.readFileSync(filePath, "utf8");
        const after = before
          .replace(/(assets\/site\.js\?v=)\d+/g, (_match, prefix) => prefix + "6")
          .replace(/(assets\/content-index\.js\?v=)\d+/g, (_match, prefix) => prefix + "6");
        if (after !== before) fs.writeFileSync(filePath, after, "utf8");
      }
    }
  };
  visit(siteRoot);
}

function main() {
  const data = readData();
  data.ui ||= {};
  data.ui.la = latinUi;
  data.pageLocales ||= {};
  Object.assign(data.pageLocales, {
    home: { ...(data.pageLocales.home || {}), en: "en/index.html", pl: "pl/index.html", la: "la/index.html" },
    __gems_browse__: { ...(data.pageLocales.__gems_browse__ || {}), en: "Gems/index.html", pl: "pl/Gems/index.html", la: "la/Gems/index.html" },
    __powers_browse__: { ...(data.pageLocales.__powers_browse__ || {}), en: "Powers/Browse.html", pl: "pl/Powers/Browse.html", la: "la/Powers/Browse.html" },
    __locations_browse__: { ...(data.pageLocales.__locations_browse__ || {}), en: "Locations/Browse.html", pl: "pl/Locations/Browse.html", la: "la/Locations/Browse.html" },
    __texts_browse__: { ...(data.pageLocales.__texts_browse__ || {}), en: "Texts/index.html", pl: "pl/Texts/index.html", la: "la/Texts/index.html" },
  });
  buildPages(data);
  fs.mkdirSync(path.join(siteRoot, "la"), { recursive: true });
  fs.writeFileSync(path.join(siteRoot, "la", "index.html"), buildHome(), "utf8");
  writeData(data);
  bumpHtmlAssetVersions();
  process.stdout.write(`Built Latin home and browse indexes for ${Object.keys(powerTitles).length} power topics and ${Object.keys(placeTitles).length} locations.\n`);
}

main();
