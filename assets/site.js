(() => {
  const root = document.body.dataset.siteBase || ".";
  const currentPage = document.body.dataset.currentPage || "home";
  const data = window.GEMCYCLOPEDIA_DATA || { pages: [], links: {}, ui: {} };
  const locale = document.documentElement.dataset.locale || data.locale || "en";
  const words = data.ui?.[locale] || data.ui?.en || {};
  const sourceEntries = data.pages || [];
  const entries = sourceEntries.map((page) => locale === "pl" ? ({
    ...page,
    title: page.plTitle || page.title,
    description: page.plDescription || page.description,
    searchText: page.plSearchText || page.searchText,
  }) : page);
  const sourcePageById = new Map(sourceEntries.map((page) => [page.id, page]));
  const pageById = new Map(entries.map((page) => [page.id, page]));
  const siteBase = root.replace(/\/$/, "");
  const pageUrl = (href, targetLocale = locale) => {
    let route = String(href || "");
    if (targetLocale === "pl" && !route.startsWith("pl/")) route = "pl/" + route;
    if (targetLocale !== "pl" && route.startsWith("pl/")) route = route.slice(3);
    const encoded = route.split("/").map((part) => encodeURIComponent(part)).join("/");
    return (siteBase + "/" + encoded).replace(/^\.\//, siteBase === "." ? "./" : "../");
  };
  const assetUrl = (href) => {
    const encoded = href.split("/").map((part) => encodeURIComponent(part)).join("/");
    return (siteBase + "/" + encoded).replace(/^\.\//, siteBase === "." ? "./" : "../");
  };

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (words[key]) node.textContent = words[key];
  });

  const search = document.querySelector("#site-search");
  if (search && words.search) search.placeholder = words.search;
  const results = document.querySelector("#search-results");
  let activeResult = -1;
  const normalize = (value) => (value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/\s+/g, " ").trim();
  const searchable = entries.map((page) => ({ ...page, normalizedTitle: normalize(page.title), normalizedText: normalize(page.searchText) }));
  const aliases = Object.fromEntries(Object.entries(data.aliases || {}).map(([name, pageId]) => [normalize(name), pageId]));

  const closeResults = () => {
    if (!results) return;
    results.classList.remove("open");
    results.innerHTML = "";
    activeResult = -1;
  };

  const runSearch = (query) => {
    if (!results || !query.trim()) {
      closeResults();
      return [];
    }
    const q = normalize(query.trim());
    const exactAlias = aliases[q];
    const found = searchable.map((page) => {
      const title = page.normalizedTitle;
      const full = page.normalizedText;
      let score = 0;
      let matchKind = "";
      if (title === q) { score = 1000; matchKind = words.exactTitle || "Exact title"; }
      else if (page.id === exactAlias) { score = 900; matchKind = words.exactAlias || "Exact alternative name"; }
      else if (title.startsWith(q)) score = 70;
      else if (title.includes(q)) score = 45;
      else if (full.includes(q)) score = 20;
      return { page, score, matchKind };
    }).filter((row) => row.score > 0).sort((a, b) => b.score - a.score || a.page.title.localeCompare(b.page.title)).slice(0, 9);

    if (!found.length) {
      results.innerHTML = `<div class="search-empty">${escapeHtml(words.noResults || "No matching pages")}</div>`;
    } else {
      results.innerHTML = found.map(({ page, matchKind }, index) => {
        const excerpt = page.description ? `<p>${escapeHtml(page.description.slice(0, 145))}</p>` : "";
        const matchBadge = matchKind ? `<span class="match-badge">${escapeHtml(matchKind)}</span>` : "";
        return `<a class="search-result${matchKind ? " exact-match" : ""}" role="option" data-result="${index}" href="${pageUrl(page.href)}"><strong>${escapeHtml(page.title)}</strong>${matchBadge}<small>${escapeHtml(categoryName(page.category))}</small>${excerpt}</a>`;
      }).join("");
    }
    results.classList.add("open");
    activeResult = -1;
    return found;
  };

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const categoryName = (category) => (locale === "pl" ? ({ gem: "Klejnot", power: "Moc", location: "Miejsce", source: "Tekst źródłowy" }) : ({ gem: "Gem", power: "Power", location: "Location", source: "Source text" }))[category] || (locale === "pl" ? "Artykuł" : "Article");

  if (search) {
    search.addEventListener("input", () => runSearch(search.value));
    search.addEventListener("keydown", (event) => {
      const rows = results?.querySelectorAll(".search-result") || [];
      if (event.key === "ArrowDown" && rows.length) {
        event.preventDefault();
        activeResult = Math.min(activeResult + 1, rows.length - 1);
        rows.forEach((row, index) => row.classList.toggle("active", index === activeResult));
      } else if (event.key === "ArrowUp" && rows.length) {
        event.preventDefault();
        activeResult = Math.max(activeResult - 1, 0);
        rows.forEach((row, index) => row.classList.toggle("active", index === activeResult));
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (activeResult >= 0 && rows[activeResult]) window.location.href = rows[activeResult].href;
        else if (rows[0]) window.location.href = rows[0].href;
      } else if (event.key === "Escape") closeResults();
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".search-wrap")) closeResults();
    });
    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        search.focus();
      }
      if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        search.focus();
      }
    });
  }

  const random = (category) => {
    let pool = entries;
    if (category) pool = entries.filter((page) => page.category === category);
    if (!pool.length) return;
    const index = Math.floor(Math.random() * pool.length);
    window.location.href = pageUrl(pool[index].href);
  };
  ["random-article"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", (event) => {
      event.preventDefault();
      random(null);
    });
  });
  ["random-gem"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", (event) => {
      event.preventDefault();
      random("gem");
    });
  });

  const featuredTitle = document.getElementById("featured-gem-title");
  const featuredDescription = document.getElementById("featured-gem-description");
  const featuredImage = document.getElementById("featured-gem-image");
  const featuredImageLink = document.getElementById("featured-gem-image-link");
  if (featuredTitle && featuredDescription) {
    const gems = entries.filter((page) => page.category === "gem" && page.featureImage);
    if (gems.length) {
      const gem = gems[Math.floor(Math.random() * gems.length)];
      featuredTitle.textContent = gem.title;
      featuredTitle.href = pageUrl(gem.href);
      featuredDescription.textContent = gem.description || "";
      if (featuredImageLink) featuredImageLink.href = pageUrl(gem.href);
      if (featuredImage && gem.featureImage) {
        featuredImage.src = assetUrl(gem.featureImage);
        featuredImage.alt = gem.title;
      } else if (featuredImage) {
        featuredImage.hidden = true;
      }
    }
  }

  const commonGrid = document.getElementById("common-gem-grid");
  const loadMoreGems = document.getElementById("load-more-gems");
  if (commonGrid && loadMoreGems) {
    const commonGems = entries
      .filter((page) => page.category === "gem")
      .sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0) || a.title.localeCompare(b.title));
    const batchSize = 12;
    let shown = 0;
    const addNextBatch = () => {
      const batch = commonGems.slice(shown, shown + batchSize);
      const cards = batch.map((gem) => {
        const image = gem.featureImage
          ? '<img src="' + assetUrl(gem.featureImage) + '" alt="' + escapeHtml(gem.title) + '" loading="lazy">'
          : '<span class="common-gem-no-image">' + escapeHtml(words.imageUnavailable || "Image unavailable") + '</span>';
        const description = gem.description ? gem.description.slice(0, 165) : "";
        return '<a class="common-gem-card" href="' + pageUrl(gem.href) + '"><span class="common-gem-image">' + image + '</span><strong>' + escapeHtml(gem.title) + '</strong><span class="common-gem-snippet">' + escapeHtml(description) + '</span></a>';
      }).join("");
      commonGrid.insertAdjacentHTML("beforeend", cards);
      shown += batch.length;
      loadMoreGems.hidden = shown >= commonGems.length;
    };
    loadMoreGems.addEventListener("click", addNextBatch);
    addNextBatch();
  }

  const themeToggle = document.getElementById("theme-toggle");
  const setTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    const next = theme === "dark" ? "light" : "dark";
    if (themeToggle) {
      themeToggle.textContent = theme === "dark" ? "◐" : "◑";
      themeToggle.setAttribute("aria-label", theme === "dark" ? (words.switchToLight || "Switch to light mode") : (words.switchToDark || "Switch to dark mode"));
      themeToggle.title = theme === "dark" ? (words.switchToLight || "Switch to light mode") : (words.switchToDark || "Switch to dark mode");
    }
  };
  try {
    const savedTheme = localStorage.getItem("gemcyclopedia-theme");
    if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
  } catch (_) { /* file:// storage may be restricted; keep the dark default */ }
  themeToggle?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    setTheme(next);
    try { localStorage.setItem("gemcyclopedia-theme", next); } catch (_) { /* optional persistence */ }
  });

  const langSelect = document.getElementById("language-select");
  if (langSelect) langSelect.value = locale;
  langSelect?.addEventListener("change", () => {
    const next = langSelect.value;
    if (next === locale) return;

    const localeMap = data.pageLocales?.[currentPage] || {};
    let target = localeMap[next];
    if (!target && currentPage === "home") target = `${next}/index.html`;
    if (!target) return;

    // Resolve routes from the site root so this works in repository subpaths,
    // nested article folders, and local file previews. Full navigation reloads
    // the page shell and all localized article content together.
    if (next === "pl" && !target.startsWith("pl/")) target = `pl/${target}`;
    if (next !== "pl" && target.startsWith("pl/")) target = target.slice(3);
    const encodedRoute = target.split("/").map((part) => encodeURIComponent(part)).join("/");
    const rootPath = root ? `${root.replace(/\/+$/, "")}/` : "./";
    const siteRoot = new URL(rootPath, window.location.href);
    const destination = new URL(encodedRoute, siteRoot);
    window.location.assign(destination.href);
  });

  const articlePage = pageById.get(currentPage);
  const articleContent = document.querySelector(".article-content");
  if (articlePage && articleContent && ["gem", "power"].includes(articlePage.category)) {
    const notices = [];
    const makeNotice = (kind, heading, message) => {
      const notice = document.createElement("aside");
      notice.className = `article-notice article-notice--${kind}`;
      notice.setAttribute("role", "note");
      const title = document.createElement("h2");
      title.textContent = heading;
      const body = document.createElement("p");
      body.textContent = message;
      notice.append(title, body);
      return notice;
    };

    if (articlePage.category === "gem") {
      const visibleText = articleContent.textContent.trim();
      const wordCount = Number.isFinite(articlePage.wordCount)
        ? articlePage.wordCount
        : (visibleText.match(/\S+/g) || []).length;
      if (wordCount < 100 || !articlePage.featureImage) {
        notices.push(makeNotice(
          "stub",
          words.stubTitle || "This article is a stub",
          words.stubBody || "There is little available information regarding this stone.",
        ));
      }
    }

    const originalArticlePage = sourcePageById.get(currentPage) || articlePage;
    const articleText = originalArticlePage.title + " " + originalArticlePage.description + " " + originalArticlePage.searchText;
    const predictionPattern = /\b(?:divinat\w*|foretell\w*|foretold|prophec\w*|prophes\w*|oracul\w*|necroman\w*|hydroman\w*|astrolog\w*|geomanc\w*|chiromanc\w*|oneiromanc\w*|scry\w*|fortune[\s-]?tell\w*|foreknowledge|presag\w*|forecast\w*|prognosticat\w*|augur\w*)\b|\b(?:predict|foresee|foretell|forecast|presage|augur)\w*/i;
    const entities = "(?:spirits?|demons?|devils?|ghosts?|shades?|phantasms?|phantoms?|daemons?|the\\s+dead)";
    const actions = "(?:summon\\w*|conjur\\w*|evok\\w*|invok\\w*|call\\s+(?:up|forth)|calls?\\s+(?:spirits?|demons?|ghosts?|phantasms?|phantoms?)|rais\\w*|control\\w*|commands|commanded|commanding|compel\\w*|enslav\\w*|bind\\w*|contact\\w*|communicat\\w*|speak(?:s|ing)?\\s+(?:with|to)|consult\\w*|asks|asked|asking|interrogat\\w*|obtain\\w*\\s+answers?|answer\\w*|obey\\w*)";
    const occultPracticePattern = new RegExp(
      `(?:\\b${actions}\\b[^.!?]{0,100}\\b${entities}\\b|\\b${entities}\\b[^.!?]{0,100}\\b${actions}\\b|\\banswers?\\b[^.!?]{0,60}\\bfrom\\s+${entities}\\b|(?:summon\\w*.{0,80}(?:monster|creature)|(?:monster|creature).{0,80}summon\\w*).{0,80}(?:spell|magic|witchcraft|enchant\\w*))`,
      "i",
    );
    const spiritualPowerPattern = /\b(?:power|dominion|control)\s+over\s+(?:the\s+)?(?:spirits?|demons?)\b/i;
    const magicalUsePattern = /\b(?:useful|used|employed|serves?)\b[^.!?]{0,60}\b(?:magic|magical) arts\b|\b(?:magic|magical) arts\b[^.!?]{0,60}\b(?:useful|used|employed|serves?)\b|\bmagical engravings?\b|\bmagical images?\b/i;
    const possessionRitualPattern = /\bfor possession\b[\s\S]{0,500}\b(?:demon|spirit)\w*/i;
    const demonExpulsionPattern = /\b(?:cast(?:s|ing)? out|driv\w* away|expel\w*|banish\w*|repel\w*|chase\w* away)\b[^.!?]{0,100}\b(?:spirits?|demons?|devils?|ghosts?|shades?|phantoms?|daemons?|the dead)\b|\b(?:spirits?|demons?|devils?|ghosts?|shades?|phantoms?|daemons?|the dead)\b[^.!?]{0,100}\b(?:cast(?:s|ing)? out|driv\w* away|expel\w*|banish\w*|repel\w*|chase\w* away)\b/i;
    const summonedCreaturePattern = /(?:summon\w*.{0,80}\b(?:monster|creature)\b|\b(?:monster|creature)\b.{0,80}\bsummon\w*).{0,80}\b(?:spell|magic|witchcraft|enchant\w*)\b/i;
    const articleTitleKey = normalize(articlePage.title).replace(/[^a-z0-9]+/g, " ").trim();
    const flaggedPowerPages = new Set([
      "divination dreams and hidden things",
      "spirits magic and enchantment",
    ]);
    const warnForContent = articlePage.category === "gem"
      && (predictionPattern.test(articleText) || occultPracticePattern.test(articleText) || spiritualPowerPattern.test(articleText) || magicalUsePattern.test(articleText) || possessionRitualPattern.test(articleText) || demonExpulsionPattern.test(articleText) || summonedCreaturePattern.test(articleText));
    if (warnForContent || (articlePage.category === "power" && flaggedPowerPages.has(articleTitleKey))) {
      notices.push(makeNotice(
        "warning",
        words.warningTitle || "Warning! The page contents may contradict the Catholic Faith!",
        words.warningBody || "Read responsibly!",
      ));
    }

    if (notices.length) {
      const noticeGroup = document.createElement("div");
      noticeGroup.className = "article-notices";
      noticeGroup.setAttribute("aria-label", "Article notices");
      notices.forEach((notice) => noticeGroup.append(notice));
      articleContent.parentNode.insertBefore(noticeGroup, articleContent);
    }
  }
  const navToggle = document.getElementById("mobile-nav-toggle");
  const nav = document.getElementById("left-rail");
  navToggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  }));

})();
