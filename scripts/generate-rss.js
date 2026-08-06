import { readFile, writeFile } from "node:fs/promises";

const siteUrl = (process.env.SITE_URL || "https://sosotime.com").replace(/\/$/, "");
const posts = JSON.parse(await readFile("public/data/posts.json", "utf8"))
  .filter((post) => post.status === "published")
  .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>SOSO TIME</title>
    <link>${siteUrl}/</link>
    <description>공감 상황극과 짧은 유머를 모은 일상 블로그</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
${posts.map(renderItem).join("\n")}
  </channel>
</rss>
`;

await writeFile("public/rss.xml", rss, "utf8");
console.log(`Generated RSS feed with ${posts.length} posts`);

function renderItem(post) {
  return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}${post.path}</link>
      <guid isPermaLink="true">${siteUrl}${post.path}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
    </item>`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
