(() => {
  const root = document.body.dataset.siteBase || ".";
  const currentPage = document.body.dataset.currentPage || "home";
  const data = window.GEMCYCLOPEDIA_DATA || { pages: [], links: {}, ui: {} };
  const locale = document.documentElement.dataset.locale || "en";
  const words = data.ui?.[locale] || data.ui?.en || {};
  const entries = data.pages || [];
  const pageById = new Map(entries.map((page) => [page.id, page]));
  const pageUrl = (href) => `${root.replace(/\/$/, "")}/${href}`.replace(/^\.\//, root === "." ? "./" : "../");
  const assetUrl = (href) => pageUrl(href.split("/").map((part) => encodeURIComponent(part)).join("/"));

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (words[key]) node.textContent = words[key];
  });

  const search = document.querySelector("#site-search");
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
      if (title === q) { score = 1000; matchKind = "Exact title"; }
      else if (page.id === exactAlias) { score = 900; matchKind = "Exact alternative name"; }
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
  const categoryName = (category) => ({ gem: "Gem", power: "Power", location: "Location", source: "Source text" })[category] || "Article";

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
          : '<span class="common-gem-no-image">Image unavailable</span>';
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
      themeToggle.setAttribute("aria-label", "Switch to " + next + " mode");
      themeToggle.title = "Switch to " + next + " mode";
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
  langSelect?.addEventListener("change", () => {
    const next = langSelect.value;
    const localeMap = data.pageLocales?.[currentPage] || {};
    const target = localeMap[next];
    if (target) window.location.href = pageUrl(target);
  });

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

  const canvas = document.getElementById("knowledge-graph");
  if (canvas) initGraph(canvas, data, pageUrl);

  function initGraph(canvasElement, siteData, urlFor) {
    const ctx = canvasElement.getContext("2d");
    const filter = document.getElementById("graph-filter");
    const status = document.getElementById("graph-status");
    const tooltip = document.getElementById("graph-tooltip");
    let nodes = [];
    let edges = [];
    let positions = [];
    let scale = 1;
    let width = 0;
    let height = 0;

    const color = () => "#b8b8b8";
    const rebuild = () => {
      const kind = filter?.value || "all";
      const all = (siteData.pages || []).filter((page) => kind === "all" || page.category === kind);
      const degree = new Map(all.map((page) => [page.id, 0]));
      for (const [from, tos] of Object.entries(siteData.links || {})) {
        if (degree.has(from)) degree.set(from, degree.get(from) + tos.filter((to) => degree.has(to)).length);
        for (const to of tos) if (degree.has(to)) degree.set(to, degree.get(to) + 1);
      }
      nodes = all.sort((a, b) => (degree.get(b.id) || 0) - (degree.get(a.id) || 0)).slice(0, kind === "all" ? 105 : 90);
      const chosen = new Set(nodes.map((node) => node.id));
      edges = [];
      for (const [from, tos] of Object.entries(siteData.links || {})) {
        if (!chosen.has(from)) continue;
        for (const to of tos) if (chosen.has(to) && from < to) edges.push([from, to]);
      }
      positions = nodes.map((node, i) => {
        const group = ["gem", "power", "location", "source"].indexOf(node.category);
        const local = nodes.slice(0, i).filter((x) => x.category === node.category).length;
        const count = Math.max(1, nodes.filter((x) => x.category === node.category).length);
        const angle = (local / count) * Math.PI * 2 + group * .31;
        const radius = Math.min(width, height) * (.19 + group * .045);
        return { id: node.id, x: width / 2 + Math.cos(angle) * radius, y: height / 2 + Math.sin(angle) * radius, node };
      });
      if (status) status.textContent = `${nodes.length} pages · ${edges.length} connections shown`;
      draw();
    };
    const resize = () => {
      const rect = canvasElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvasElement.width = Math.floor(width * dpr);
      canvasElement.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild();
    };
    const draw = () => {
      if (!ctx || !width || !height) return;
      ctx.clearRect(0, 0, width, height);
      const byId = new Map(positions.map((p) => [p.id, p]));
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(190, 190, 190, .25)";
      for (const [a, b] of edges) {
        const p1 = byId.get(a), p2 = byId.get(b);
        if (!p1 || !p2) continue;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
      for (const p of positions) {
        const radius = p.node.category === "gem" ? 4.2 : 3.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color(p.node.category); ctx.fill();
        if (p.node.category !== "gem" || p.x < width * .18) {
          ctx.font = "11px system-ui, sans-serif"; ctx.fillStyle = "rgba(230,230,230,.85)";
          ctx.fillText(p.node.title.slice(0, 28), p.x + 8, p.y - 7);
        }
      }
    };
    const locate = (event) => {
      const rect = canvasElement.getBoundingClientRect();
      const x = event.clientX - rect.left, y = event.clientY - rect.top;
      return positions.find((p) => Math.hypot(p.x - x, p.y - y) < 12);
    };
    canvasElement.addEventListener("mousemove", (event) => {
      const hit = locate(event);
      if (hit) {
        canvasElement.style.cursor = "pointer";
        tooltip.hidden = false;
        tooltip.style.left = `${Math.min(event.clientX + 13, window.innerWidth - 270)}px`;
        tooltip.style.top = `${Math.min(event.clientY + 13, window.innerHeight - 100)}px`;
        tooltip.innerHTML = `<strong>${escapeHtml(hit.node.title)}</strong><br><span>${escapeHtml(categoryName(hit.node.category))}</span>`;
      } else {
        canvasElement.style.cursor = "grab";
        tooltip.hidden = true;
      }
    });
    canvasElement.addEventListener("mouseleave", () => { if (tooltip) tooltip.hidden = true; });
    canvasElement.addEventListener("click", (event) => {
      const hit = locate(event);
      if (hit) window.location.href = urlFor(hit.node.href);
    });
    filter?.addEventListener("change", rebuild);
    window.addEventListener("resize", resize);
    resize();
  }
})();
