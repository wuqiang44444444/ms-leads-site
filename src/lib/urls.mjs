/** 由 site.config.mjs 推导页面绝对地址与 Astro base。 */

export function normalizeBasePath(basePath) {
  let base = basePath || "/";
  if (!base.startsWith("/")) base = `/${base}`;
  if (!base.endsWith("/")) base = `${base}/`;
  return base;
}

export function sitePrefix(config) {
  const origin = String(config.siteOrigin || "").replace(/\/$/, "");
  return `${origin}${normalizeBasePath(config.basePath)}`;
}

export function pageUrl(config, path = "") {
  const relative = String(path || "").replace(/^\//, "");
  return `${sitePrefix(config)}${relative}`;
}

/** Astro 的 base 不能带末尾斜杠；站点根路径保持为 "/"。 */
export function astroBase(config) {
  const base = normalizeBasePath(config.basePath);
  if (base === "/") return "/";
  return base.slice(0, -1);
}
