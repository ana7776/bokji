import { readFile, writeFile } from "node:fs/promises";

const siteUrl = (process.env.SITE_URL || "https://sosotime.com").replace(/\/$/, "");
const posts = JSON.parse(await readFile("public/data/posts.json", "utf8")).filter((post) => post.status === "published");
const latestPostDate = posts
  .map((post) => post.updatedAt || post.publishedAt)
  .sort()
  .at(-1) || new Date().toISOString();

const staticPaths = [
  { path: "/", priority: "1.0", changefreq: "daily", lastmod: latestPostDate },
  { path: "/about", priority: "0.5", changefreq: "monthly", lastmod: latestPostDate },
  { path: "/author", priority: "0.5", changefreq: "monthly", lastmod: latestPostDate },
  { path: "/contact", priority: "0.4", changefreq: "monthly", lastmod: latestPostDate },
  { path: "/report", priority: "0.4", changefreq: "monthly", lastmod: latestPostDate },
  { path: "/policy/editorial", priority: "0.4", changefreq: "monthly", lastmod: latestPostDate },
  { path: "/policy/privacy", priority: "0.3", changefreq: "yearly", lastmod: latestPostDate },
  { path: "/policy/terms", priority: "0.3", changefreq: "yearly", lastmod: latestPostDate }
];

const categoryPaths = ["funny", "empathy", "life", "info"]
  .filter((category) => posts.some((post) => post.category === category))
  .map((category) => ({
    path: `/category/${category}/`,
    priority: "0.7",
    changefreq: "daily",
    lastmod: latestFor(posts.filter((post) => post.category === category))
  }));

const tagCounts = new Map();
for (const post of posts) {
  for (const tag of post.tags || []) {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  }
}

const tagPaths = [...tagCounts.entries()]
  .filter(([, count]) => count >= 2)
  .map(([tag]) => {
    const taggedPosts = posts.filter((post) => (post.tags || []).includes(tag));
    return {
      path: `/tags/${slugifyTag(tag)}/`,
      priority: "0.6",
      changefreq: "weekly",
      lastmod: latestFor(taggedPosts)
    };
  });

const urls = [
  ...staticPaths,
  ...categoryPaths,
  ...tagPaths,
  ...posts.map((post) => ({
    path: post.path,
    priority: "0.8",
    changefreq: "weekly",
    lastmod: post.updatedAt || post.publishedAt
  }))
].map((entry) => ({
  loc: `${siteUrl}${entry.path}`,
  priority: entry.priority,
  changefreq: entry.changefreq,
  lastmod: entry.lastmod
}));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(renderUrl).join("\n")}
</urlset>
`;

const robots = `User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Mediapartners-Google
Allow: /

User-agent: AdsBot-Google
Allow: /

User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

await writeFile("public/sitemap.xml", sitemap, "utf8");
await writeFile("public/robots.txt", robots, "utf8");
console.log(`Generated sitemap and robots.txt for ${urls.length} URLs`);

function latestFor(items) {
  return items.map((post) => post.updatedAt || post.publishedAt).sort().at(-1) || latestPostDate;
}

function renderUrl(url) {
  const lastmod = `\n    <lastmod>${new Date(url.lastmod).toISOString().slice(0, 10)}</lastmod>`;
  return `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>${lastmod}
  </url>`;
}

function slugifyTag(tag) {
  const ascii = tag.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "");
  return encodeURIComponent(ascii || tag);
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
