const TD_DEFAULT_LANGUAGE = "en";
const TD_LANGUAGE_PATTERN = /^(en|es|fr|pt|de|it|ru|zh|ja|ar|hi)$/;

function loadShellI18n() {
  const node = document.getElementById("scisiteforge-shell-i18n");
  if (!node?.textContent) return {};
  try {
    return JSON.parse(node.textContent);
  } catch (_error) {
    return {};
  }
}

const TD_SHELL_I18N = loadShellI18n();

function shellText(lang, key, fallback = "") {
  const bundle = TD_SHELL_I18N[lang] || {};
  const english = TD_SHELL_I18N.en || {};
  return bundle[key] || english[key] || fallback || key;
}

function pathLanguage() {
  const first = (window.location.pathname || "/").split("/").filter(Boolean)[0] || "";
  return TD_LANGUAGE_PATTERN.test(first) ? first : "";
}

function localizedPathFor(lang) {
  const currentPath = window.location.pathname || "/";
  const parts = currentPath.split("/").filter(Boolean);
  if (parts.length && TD_LANGUAGE_PATTERN.test(parts[0])) {
    if (lang === TD_DEFAULT_LANGUAGE) {
      parts.shift();
    } else {
      parts[0] = lang;
    }
  } else if (lang !== TD_DEFAULT_LANGUAGE) {
    parts.unshift(lang);
  }
  const nextPath = "/" + parts.join("/");
  return nextPath.endsWith("/") ? nextPath : nextPath + (currentPath.endsWith("/") ? "/" : "");
}

function applyShellTranslations(lang) {
  document.querySelectorAll("[data-i18n-nav]").forEach((node) => {
    const raw = node.getAttribute("data-i18n-nav");
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      node.textContent = payload[lang] || payload.en || node.textContent || "";
    } catch (_error) {
      // Ignore malformed labels.
    }
  });
  const select = document.getElementById("lang-switch");
  if (select) {
    select.setAttribute("aria-label", shellText(lang, "language_selector_label", "Language"));
  }
}

function ensureTranslationBanner() {
  let banner = document.querySelector(".translation-fallback-banner");
  if (banner) return banner;
  const header = document.querySelector(".site-header");
  if (!header) return null;
  banner = document.createElement("div");
  banner.className = "translation-fallback-banner";
  header.insertAdjacentElement("afterend", banner);
  return banner;
}

function updateTranslationBanner(lang, covered) {
  const banner = ensureTranslationBanner();
  if (!banner) return;
  if (!lang || lang === TD_DEFAULT_LANGUAGE || covered) {
    banner.hidden = true;
    banner.textContent = "";
    return;
  }
  banner.hidden = false;
  banner.innerHTML =
    `<strong>${shellText(lang, "translation_fallback_title", "Translation unavailable:")}</strong> ` +
    `${shellText(lang, "translation_fallback_body", "this page is queued for translation, but the English source page is shown for now.")} ` +
    `${shellText(lang, "still_viewing_default", "You are viewing the English source page.")} ` +
    `<a href="${localizedPathFor(lang).startsWith(`/${lang}/`) ? `/${lang}/translation-status/` : "/translation-status/"}">${shellText(lang, "translation_fallback_link", "Open translation queue")}</a>.`;
}

document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.classList.add("js-ready");
  const select = document.getElementById("lang-switch");
  const lang = pathLanguage() || document.documentElement.dataset.requestedLang || TD_DEFAULT_LANGUAGE;
  if (!select) {
    applyShellTranslations(lang);
    return;
  }
  if ([...select.options].some((option) => option.value === lang)) {
    select.value = lang;
  }
  const selected = select.selectedOptions?.[0];
  applyShellTranslations(select.value);
  updateTranslationBanner(select.value, selected?.getAttribute("data-coverage") === "true");
  select.addEventListener("change", (event) => {
    window.location.href = localizedPathFor(event.target.value);
  });
});
