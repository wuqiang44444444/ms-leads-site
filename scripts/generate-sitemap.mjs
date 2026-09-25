import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { siteConfig } from "../site.config.mjs";
import { pageUrl } from "../src/lib/urls.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = resolve(root, "public");

const routes = [
  { path: "", priority: "1.0" },
  { path: "azure-openai/", priority: "0.9" },
  { path: "m365/", priority: "0.8" },
  { path: "windows/", priority: "0.8" },
  { path: "copilot/", priority: "0.8" },
  { path: "github-copilot/", priority: "0.8" },
  { path: "azure/", priority: "0.8" },
  { path: "privacy/", priority: "0.3" },
];

const urls = routes
  .map(
    (route) => `  <url>
    <loc>${pageUrl(siteConfig, route.path)}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
  )
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${pageUrl(siteConfig, "sitemap.xml")}
`;

mkdirSync(publicDir, { recursive: true });
writeFileSync(resolve(publicDir, "sitemap.xml"), sitemap);
writeFileSync(resolve(publicDir, "robots.txt"), robots);
