import { mkdir, rm, readFile, writeFile } from "node:fs/promises";

const siteUrl = (process.env.SITE_URL || "https://sosotime.com").replace(/\/$/, "");
const posts = JSON.parse(await readFile("public/data/posts.json", "utf8"))
  .filter((post) => post.status === "published")
  .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

const categoryMeta = {
  funny: { label: "웃음", description: "일상에서 웃음이 먼저 터지는 상황극을 모았습니다." },
  empathy: { label: "공감", description: "누구나 한 번쯤 겪어 봤을 법한 민망하고 다정한 순간을 모았습니다." },
  life: { label: "생활", description: "생활 속 선택과 습관을 가볍게 정리한 글입니다." },
  info: { label: "정보", description: "직접 확인하고 정리한 실전 정보형 글입니다." }
};

await rm("public/category", { recursive: true, force: true });
await rm("public/tags", { recursive: true, force: true });

const categories = Object.entries(categoryMeta)
  .map(([slug, meta]) => ({ slug, ...meta, posts: posts.filter((post) => post.category === slug) }))
  .filter((category) => category.posts.length > 0);

for (const category of categories) {
  const dir = `public/category/${category.slug}`;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/index.html`, renderListing({
    title: `${category.label} 글 모음`,
    description: category.description,
    canonicalPath: `/category/${category.slug}/`,
    eyebrow: "CATEGORY",
    heading: `${category.label} 글 모음`,
    posts: category.posts
  }), "utf8");
}

const tagCounts = new Map();
for (const post of posts) {
  for (const tag of post.tags || []) {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  }
}

const tagEntries = [...tagCounts.entries()]
  .filter(([, count]) => count >= 2)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"));

for (const [tag] of tagEntries) {
  const tagSlug = slugifyTag(tag);
  const tagPosts = posts.filter((post) => (post.tags || []).includes(tag));
  const dir = `public/tags/${tagSlug}`;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/index.html`, renderListing({
    title: `#${tag} 글 모음`,
    description: `${tag} 태그가 붙은 글을 최신순으로 모았습니다.`,
    canonicalPath: `/tags/${tagSlug}/`,
    eyebrow: "TAG",
    heading: `#${tag}`,
    posts: tagPosts
  }), "utf8");
}

console.log(`Generated ${categories.length} category pages and ${tagEntries.length} tag pages`);

function renderListing({ title, description, canonicalPath, eyebrow, heading, posts }) {
  const canonical = `${siteUrl}${canonicalPath}`;
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} - SOSO TIME</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" type="application/rss+xml" title="SOSO TIME RSS" href="/rss.xml" />
    <link rel="stylesheet" href="/styles.css" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="SOSO TIME" />
    <meta property="og:title" content="${escapeHtml(title)} - SOSO TIME" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
  </head>
  <body>
    ${siteHeader()}
    <main class="page-shell">
      <section class="board-main">
        <div class="board-toolbar">
          <div>
            <p class="eyebrow">${escapeHtml(eyebrow)}</p>
            <h1>${escapeHtml(heading)}</h1>
            <p>${escapeHtml(description)}</p>
          </div>
        </div>
        <ol class="collection-list humor-latest-list">
          ${posts.map(renderPostItem).join("\n          ")}
        </ol>
      </section>
    </main>
    ${siteFooter()}
  </body>
</html>
`;
}

function renderPostItem(post) {
  return `<li>
            <article class="latest-row">
              <span class="category-pill ${post.category === "funny" ? "yellow" : "pink"}">${escapeHtml(categoryMeta[post.category]?.label || "글")}</span>
              <div class="latest-copy">
                <strong><a href="${post.path}">${escapeHtml(post.title)}</a></strong>
                <small>${escapeHtml(post.description)}</small>
                <small><time datetime="${post.publishedAt}">${formatDate(post.publishedAt)}</time></small>
              </div>
              <a href="${post.path}" aria-label="${escapeHtml(post.title)} 글 보기">
                <img src="${post.image}" alt="${escapeHtml(post.title)} 대표 이미지" loading="lazy" />
              </a>
            </article>
          </li>`;
}

function siteHeader() {
  const nav = Object.entries(categoryMeta)
    .filter(([category]) => posts.some((post) => post.category === category))
    .map(([category, meta]) => `<a class="nav-tab" href="/category/${category}/">${escapeHtml(meta.label)}</a>`)
    .join("\n          ");
  return `<header class="site-header">
      <div class="header-inner">
        <a class="brand" href="/" aria-label="SOSO TIME 홈">
          <span class="brand-mark">소소</span>
          <span>
            <strong>SOSO TIME</strong>
            <small>공감 상황극과 짧은 유머</small>
          </span>
        </a>
        <nav class="top-nav" aria-label="주요 분류">
          ${nav}
        </nav>
      </div>
    </header>`;
}

function siteFooter() {
  return `<footer class="site-footer">
      <a href="/about">사이트 소개</a>
      <a href="/author">저자</a>
      <a href="/policy/editorial">작성 원칙</a>
      <a href="/rss.xml">RSS</a>
      <a href="/contact">문의하기</a>
    </footer>`;
}

function slugifyTag(tag) {
  const ascii = tag.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "");
  return encodeURIComponent(ascii || tag);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
