import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://bokjicheck.co.kr",
  output: "static",
  integrations: [sitemap()],
});
