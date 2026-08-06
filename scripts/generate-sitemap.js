import { readFile, writeFile } from "node:fs/promises";

const siteUrl = (process.env.SITE_URL || "https://sosotime.com").replace(/\/$/, "");
const posts = JSON.parse(await readFile("public/data/posts.json", "utf8")).filter((post) => post.status === "published");
const staticPaths = ["/", "/about", "/contact", "/report", "/policy/editorial", "/policy/privacy", "/policy/terms"];

const urls = [
  ...staticPaths.map((path) => ({
    loc: `${siteUrl}${path}`,
    priority: path === "/" ? "1.0" : "0.5",
    changefreq: path === "/" ? "daily" : "monthly"
  })),
  ...posts.map((post) => ({
    loc: `${siteUrl}${post.path}`,
    priority: "0.8",
    changefreq: "weekly",
    lastmod: post.updatedAt || post.publishedAt
  }))
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(renderUrl).join("\n")}
</urlset>
`;

const robots = `User-agent: Googlebot
Allow: /
Disallow: /*?

User-agent: Googlebot-Image
Allow: /

User-agent: Mediapartners-Google
Allow: /

User-agent: AdsBot-Google
Allow: /

User-agent: *
Allow: /
Disallow: /*?

Sitemap: ${siteUrl}/sitemap.xml
`;

await writeFile("public/sitemap.xml", sitemap, "utf8");
await writeFile("public/robots.txt", robots, "utf8");
console.log(`Generated sitemap and robots.txt for ${urls.length} URLs`);

function renderUrl(url) {
  const lastmod = url.lastmod ? `\n    <lastmod>${new Date(url.lastmod).toISOString().slice(0, 10)}</lastmod>` : "";
  return `  <url>
    <loc>${escapeXml(encodeURI(url.loc))}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>${lastmod}
  </url>`;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
