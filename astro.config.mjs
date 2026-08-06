import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://bokjicheck.co.kr",
  output: "static",
  integrations: [
    sitemap({
      changefreq: "weekly",
      lastmod: new Date(),
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname === "/") return { ...item, priority: 1.0, changefreq: "daily" };
        if (url.pathname === "/check/" || url.pathname === "/info/") return { ...item, priority: 0.9 };
        if (url.pathname.startsWith("/check/") || url.pathname.startsWith("/info/")) {
          return { ...item, priority: 0.8 };
        }
        return { ...item, priority: 0.6 };
      },
    }),
  ],
});
