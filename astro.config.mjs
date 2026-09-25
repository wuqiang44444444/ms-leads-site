import { defineConfig } from "astro/config";
import { siteConfig } from "./site.config.mjs";
import { astroBase } from "./src/lib/urls.mjs";

export default defineConfig({
  site: siteConfig.siteOrigin,
  base: astroBase(siteConfig),
  trailingSlash: "always",
  build: {
    format: "directory",
  },
});
