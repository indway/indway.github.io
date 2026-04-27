/* ═══════════════════════════════════════
   DATA
═══════════════════════════════════════ */
const DATA = window.INDWAY_DATA;
const RATES = DATA.rates;
const I18N = DATA.i18n;

let lang = "id";
const t = (k) => (I18N[lang] || I18N.id || {})[k] || k;

/* ═══════════════════════════════════════
   MODAL
═══════════════════════════════════════ */
const modalEl = document.getElementById("modal");
const modalClose = document.getElementById("modalClose");

function openModal(item) {
  const STATUS = {
    active: "modal_status_active",
    wip: "modal_status_wip",
    archived: "modal_status_archived",
  };
  // media
  const mediaEl = document.getElementById("modalMedia");
  mediaEl.innerHTML = "";
  if (item.media?.src) {
    mediaEl.innerHTML =
      item.media.type === "video"
        ? `<video src="${item.media.src}" autoplay loop muted playsinline></video>`
        : `<img src="${item.media.src}" alt="${item.name}" loading="lazy">`;
    mediaEl.hidden = false;
  } else {
    mediaEl.hidden = true;
  }
  // meta
  document.getElementById("modalCategory").textContent =
    item.category || "";
  const statusEl = document.getElementById("modalStatus");
  statusEl.textContent = t(STATUS[item.status]) || item.status || "";
  statusEl.dataset.s = item.status || "";
  // text
  document.getElementById("modalName").textContent = item.name;
  document.getElementById("modalDesc").textContent =
    item.desc?.[lang] || item.desc?.id || "";
  document.getElementById("modalDetail").textContent =
    item.detail?.[lang] || item.detail?.id || "";
  // tags
  document.getElementById("modalTags").innerHTML = (item.tags || [])
    .map((tag) => `<span class="modal-tag">${tag}</span>`)
    .join("");
  // cta
  const ctaEl = document.getElementById("modalCta");
  if (item.url) {
    ctaEl.href = item.url;
    ctaEl.textContent = t("modal_visit");
    ctaEl.hidden = false;
  } else {
    ctaEl.hidden = true;
  }
  // sub-links
  const subsEl = document.getElementById("modalSubs");
  subsEl.innerHTML = "";
  if (item.subs?.length) {
    item.subs.forEach((s) => {
      const a = document.createElement("a");
      a.className = "sub-link";
      a.href = s.url;
      a.target = "_blank";
      a.innerHTML = `<span class="sub-link-name">${s.name}</span><span class="sub-link-desc">${s.desc?.[lang] || s.desc?.id || ""}</span>`;
      subsEl.appendChild(a);
    });
    subsEl.hidden = false;
  } else {
    subsEl.hidden = true;
  }
  modalEl.classList.add("open");
  document.body.style.overflow = "hidden";
  document.getElementById("modalScrollBody").scrollTop = 0;
}

function closeModal() {
  modalEl.classList.remove("open");
  document.body.style.overflow = "";
}

modalClose.addEventListener("click", closeModal);
modalEl.addEventListener("click", (e) => {
  if (e.target === modalEl) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

/* ═══════════════════════════════════════
   SHOWCASE
═══════════════════════════════════════ */
let activeSlot = null,
  showcaseTimer = null;

function buildShowcaseSlots() {
  const panel = document.getElementById("showcase-panel");
  panel
    .querySelectorAll(".showcase-slot:not(.default)")
    .forEach((s) => s.remove());
  DATA.products.forEach((p, i) => {
    const slot = document.createElement("div");
    slot.className = "showcase-slot";
    slot.id = `slot-${i}`;
    if (p.media?.type === "video") {
      slot.innerHTML = `<video src="${p.media.src}" autoplay loop muted playsinline></video>`;
    } else if (p.media?.src) {
      slot.innerHTML = `<img src="${p.media.src}" alt="${p.name}" loading="lazy">`;
    }
    panel.appendChild(slot);
  });
}

function showSlot(i) {
  const def = document.getElementById("showcase-default");
  const slot = document.getElementById(`slot-${i}`);
  if (!slot) return;
  def.classList.remove("default");
  def.style.opacity = "0";
  if (activeSlot && activeSlot !== slot)
    activeSlot.classList.remove("active");
  slot.classList.add("active");
  activeSlot = slot;
}

function hideSlot() {
  if (activeSlot) {
    activeSlot.classList.remove("active");
    activeSlot = null;
  }
  const def = document.getElementById("showcase-default");
  def.style.opacity = "1";
}

/* ═══════════════════════════════════════
   BUILD
═══════════════════════════════════════ */
function buildProductList() {
  const ul = document.getElementById("list-produk");
  if (!ul) return;
  ul.innerHTML = "";
  DATA.products.forEach((p, i) => {
    const li = document.createElement("li");
    const pn = document.createElement("span");
    pn.className = "pname";
    pn.textContent = p.name;
    const pd = document.createElement("span");
    pd.className = "pdesc";
    pd.innerHTML = p.desc[lang] || p.desc.id;
    li.appendChild(pn);
    li.appendChild(pd);
    li.addEventListener("mouseenter", () => {
      clearTimeout(showcaseTimer);
      showSlot(i);
    });
    li.addEventListener("mouseleave", () => {
      showcaseTimer = setTimeout(hideSlot, 300);
    });
    li.addEventListener("click", () => openModal(p));
    ul.appendChild(li);
  });
  buildShowcaseSlots();
  observe(ul, "li");
}

function buildItem(item) {
  const li = document.createElement("li");
  const pn = document.createElement("span");
  pn.className = "pname";
  pn.textContent = item.name;
  const pd = document.createElement("span");
  pd.className = "pdesc";
  pd.innerHTML = item.desc[lang] || item.desc.id;
  li.appendChild(pn);
  li.appendChild(pd);
  li.addEventListener("click", () => openModal(item));
  return li;
}

function buildList(id, items) {
  const ul = document.getElementById(id);
  if (!ul) return;
  ul.innerHTML = "";
  items.forEach((item) => ul.appendChild(buildItem(item)));
  observe(ul, "li");
}

function buildCards() {
  const g = document.getElementById("web-cards");
  if (!g) return;
  g.innerHTML = "";
  DATA.websites.forEach((site) => {
    const el = document.createElement("div");
    el.className = "card";
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    let subsHTML = "";
    if (site.subs?.length) {
      subsHTML = `<div class="card-subs">${site.subs
        .map(
          (s) =>
            `<a class="sub-link" href="${s.url}" target="_blank" onclick="event.stopPropagation()">
          <span class="sub-link-name">${s.name}</span>
          <span class="sub-link-desc">${s.desc[lang] || s.desc.id}</span>
        </a>`,
        )
        .join("")}</div>`;
    }
    el.innerHTML = `<div class="card-name">${site.name}</div><div class="card-desc">${site.desc[lang] || site.desc.id}</div>${subsHTML}`;
    el.addEventListener("click", () => openModal(site));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") openModal(site);
    });
    g.appendChild(el);
  });
  observe(g, ".card", "#desktop-links");
}

function buildSocials() {
  const w = document.getElementById("socials");
  if (!w) return;
  w.innerHTML = "";
  DATA.socials.forEach((s) => {
    const a = document.createElement("a");
    a.className = "social-pill";
    a.href = s.url;
    a.textContent = s.label;
    if (!s.url.startsWith("mailto")) a.target = "_blank";
    w.appendChild(a);
  });
  observe(w, ".social-pill", "#footer-note");
}

function buildProfile() {
  const bioEl = document.getElementById("hero-bio");
  if (bioEl) {
    bioEl.textContent = DATA.profile.bio[lang] || DATA.profile.bio.id;
  }

  const expEl = document.getElementById("expertise-list");
  if (expEl) {
    expEl.innerHTML = "";
    DATA.profile.services.forEach((s, i) => {
      const span = document.createElement("span");
      span.className = "expertise-item";
      span.textContent = s.label;
      expEl.appendChild(span);
      setTimeout(() => span.classList.add("in"), i * 100 + 400);
    });
  }

  const badgeEl = document.getElementById("hire-badge");
  if (badgeEl && DATA.profile.availability) {
    badgeEl.textContent = DATA.profile.availability;
    badgeEl.style.display = "inline-flex";
  }
}

function buildAll() {
  buildProfile();
  buildProductList();
  buildList("list-side", DATA.side);
  buildList("list-themes", DATA.themes);
  buildList("list-cyber", DATA.cyber);
  buildCards();
  buildSocials();
  buildRate();
}

function applyI18n() {
  document.documentElement.lang = lang;
  document
    .querySelectorAll("[data-i18n]")
    .forEach((el) => (el.textContent = t(el.dataset.i18n)));
}

/* ═══════════════════════════════════════
   OBSERVE
═══════════════════════════════════════ */
function observe(parent, childSel, extraSel = null) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const kids = [...e.target.querySelectorAll(childSel)];
        kids.forEach((el, i) =>
          setTimeout(() => el.classList.add("in"), i * 65),
        );
        if (extraSel)
          setTimeout(
            () => document.querySelector(extraSel)?.classList.add("in"),
            kids.length * 65 + 120,
          );
        io.disconnect();
      });
    },
    { threshold: 0.04 },
  );
  io.observe(parent);
}

/* ═══════════════════════════════════════
   TOPBAR SCROLL
═══════════════════════════════════════ */
const heroSec = document.getElementById("hero-section");
const logoEl = document.getElementById("topbar-logo");
const topbarEl = document.getElementById("topbar");
new IntersectionObserver(
  ([e]) => {
    logoEl.classList.toggle("show", !e.isIntersecting);
    topbarEl.classList.toggle("scrolled", !e.isIntersecting);
  },
  { threshold: 0.1 },
).observe(heroSec);

/* ═══════════════════════════════════════
   AUTO THEME
═══════════════════════════════════════ */
let themeManualOverride = false;

function getAutoTheme() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

function applyTheme(mode, isAuto) {
  const isDark = mode === "dark";
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "dark" : "",
  );
  const btn = document.getElementById("themeBtn");
  btn.textContent = isDark ? "\uD83C\uDF19" : "\u2600";
  btn.title = isAuto
    ? `auto \u00B7 ${isDark ? "night" : "day"} mode`
    : isDark
      ? "night mode"
      : "day mode";
  document
    .getElementById("theme-meta")
    .setAttribute("content", isDark ? "#0c0c0c" : "#ffffff");
}

applyTheme(getAutoTheme(), true);
setInterval(() => {
  if (!themeManualOverride) applyTheme(getAutoTheme(), true);
}, 60000);
document
  .getElementById("themeBtn")
  .addEventListener("click", function () {
    themeManualOverride = true;
    applyTheme(
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark",
      false,
    );
  });

/* ═══════════════════════════════════════
   AUTO LANG
═══════════════════════════════════════ */
const TZ_LANG_MAP = [
  {
    match:
      /^Asia\/(Jakarta|Makassar|Jayapura|Pontianak|Balikpapan|Banjarmasin|Kupang|Ambon|Ternate|Sorong)$/i,
    lang: "id",
  },
  { match: /WIB|WITA|WIT|Indonesia/i, lang: "id" },
  {
    match: /^Asia\/(Kuala_Lumpur|Kuching|Brunei|Singapore)$/i,
    lang: "ms",
  },
  {
    match:
      /^Asia\/(Riyadh|Dubai|Kuwait|Bahrain|Qatar|Muscat|Aden|Baghdad|Beirut|Amman|Damascus|Jerusalem|Gaza)$/i,
    lang: "ar",
  },
  {
    match:
      /^Africa\/(Cairo|Tripoli|Khartoum|Algiers|Casablanca|Tunis|Ceuta)$/i,
    lang: "ar",
  },
];
const LOCALE_LANG_MAP = {
  id: "id",
  in: "id",
  ms: "ms",
  zsm: "ms",
  ar: "ar",
  arb: "ar",
  en: "en",
};

function detectLang() {
  const navLang = (navigator.language || "")
    .toLowerCase()
    .replace("-", "_");
  const prefix = navLang.split("_")[0];
  if (LOCALE_LANG_MAP[navLang]) return LOCALE_LANG_MAP[navLang];
  if (LOCALE_LANG_MAP[prefix]) return LOCALE_LANG_MAP[prefix];
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    for (const r of TZ_LANG_MAP) if (r.match.test(tz)) return r.lang;
  } catch (_) {}
  return "id";
}

function setLang(newLang, isAuto) {
  lang = newLang;
  document
    .querySelectorAll(".lang-opt")
    .forEach((b) =>
      b.classList.toggle("active", b.dataset.lang === lang),
    );
  const labels = { id: "ID", en: "EN", ms: "MY", ar: "AR" };
  document.getElementById("langLabel").textContent =
    labels[lang] || lang.toUpperCase();
  if (isAuto) document.documentElement.dataset.langAuto = lang;
  applyI18n();
  buildAll();
}

/* lang picker UI */
const langPicker = document.getElementById("langPicker");
const langCurrent = document.getElementById("langCurrent");
langCurrent.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = langPicker.classList.toggle("open");
  langCurrent.setAttribute("aria-expanded", open);
});
document.querySelectorAll(".lang-opt").forEach((btn) => {
  btn.addEventListener("click", () => {
    setLang(btn.dataset.lang, false);
    langPicker.classList.remove("open");
    langCurrent.setAttribute("aria-expanded", "false");
  });
});
document.addEventListener("click", () => {
  langPicker.classList.remove("open");
  langCurrent.setAttribute("aria-expanded", "false");
});

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
setLang(detectLang(), true);
