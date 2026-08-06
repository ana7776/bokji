import { rm, mkdir, readFile, writeFile } from "node:fs/promises";

const siteUrl = process.env.SITE_URL || "https://sosotime.com";
const posts = JSON.parse(await readFile("public/data/posts.json", "utf8")).filter((post) => post.status === "published");
const categoryLabels = {
  funny: "웃음",
  empathy: "공감",
  life: "생활",
  info: "정보"
};
const categoryEntries = Object.entries(categoryLabels)
  .map(([category, label]) => ({ category, label, count: posts.filter((post) => post.category === category).length }))
  .filter((entry) => entry.count > 0);
const adsenseClient = process.env.ADSENSE_CLIENT || "ca-pub-5804969457082424";
const authorName = "김안나";

await rm("public/posts", { recursive: true, force: true });

for (const post of posts) {
  const dir = `public${post.path}`;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}index.html`, renderPost(post), "utf8");
}

console.log(`Generated ${posts.length} static post pages`);

function renderPost(post) {
  const canonical = `${siteUrl}${post.path}`;
  const categoryLabel = categoryLabels[post.category];
  const pageTitle = `${post.title} - 소소타임`;
  const imageUrl = absoluteUrl(post.image);
  const wordCount = post.body.reduce(
    (total, section) => total + section.paragraphs.reduce((sum, paragraph) => sum + paragraph.length, 0),
    0
  );
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        image: imageUrl,
        inLanguage: "ko-KR",
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        articleSection: categoryLabel,
        wordCount,
        author: {
          "@type": "Person",
          name: authorName,
          url: `${siteUrl}/about`
        },
        publisher: {
          "@type": "Organization",
          name: "소소타임",
          url: siteUrl
        },
        mainEntityOfPage: canonical
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "홈",
            item: `${siteUrl}/`
          },
          {
            "@type": "ListItem",
            position: 2,
            name: categoryLabel,
            item: `${siteUrl}/?category=${post.category}`
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: canonical
          }
        ]
      }
    ]
  };

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(post.description)}" />
    <meta name="author" content="${escapeHtml(authorName)}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <link rel="canonical" href="${canonical}" />
    <link rel="stylesheet" href="/styles.css" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="소소타임" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(post.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="article:published_time" content="${post.publishedAt}" />
    <meta property="article:modified_time" content="${post.updatedAt || post.publishedAt}" />
    <meta property="article:author" content="${escapeHtml(authorName)}" />
    <meta property="article:section" content="${escapeHtml(categoryLabel)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(post.description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}" crossorigin="anonymous"></script>
    <script type="application/ld+json">${safeJson(jsonLd)}</script>
  </head>
  <body>
    ${siteHeader()}
    <main class="page-shell article-shell">
      <article class="article-page">
        <nav class="breadcrumb" aria-label="현재 위치">
          <a href="/">홈</a>
          <span>›</span>
          <a href="/?category=${post.category}">${escapeHtml(categoryLabel)}</a>
        </nav>
        <header class="article-header">
          <p class="eyebrow">${escapeHtml(categoryLabel)}</p>
          <h1>${escapeHtml(post.title)}</h1>
          <p class="article-description">${escapeHtml(post.summary)}</p>
          <dl class="article-meta">
            <div><dt>글</dt><dd>${escapeHtml(authorName)}</dd></div>
            <div><dt>발행</dt><dd><time datetime="${post.publishedAt}">${formatDate(post.publishedAt)}</time></dd></div>
            <div><dt>분류</dt><dd>${escapeHtml(categoryLabel)}</dd></div>
          </dl>
        </header>

        <figure class="article-figure">
          <img src="${post.image}" alt="${escapeHtml(post.title)} 대표 이미지" loading="eager" />
        </figure>

        ${post.body.map(renderSection).join("\n")}

        <section class="article-tags" aria-label="태그">
          ${post.tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}
        </section>

        <section class="author-note" aria-label="글쓴이">
          <p><strong>${escapeHtml(authorName)}</strong> · 직접 쓴 공감 상황극과 유머 썰을 올립니다. 글에 대한 의견이나 수정 요청은 <a href="/contact">문의하기</a>로 보내 주세요.</p>
        </section>

        <section class="related-posts" aria-labelledby="related-title">
          <h2 id="related-title">같이 읽으면 좋은 글</h2>
          <div>
            ${relatedPosts(post).map(renderRelatedPost).join("\n            ")}
          </div>
        </section>
      </article>
    </main>
    ${siteFooter()}
  </body>
</html>
`;
}

function renderSection(section) {
  return `<section class="article-section">
          <h2>${escapeHtml(section.heading)}</h2>
          ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n          ")}
        </section>`;
}

function relatedPosts(post) {
  const sameCategory = posts.filter((item) => item.id !== post.id && item.category === post.category);
  const fallback = posts.filter((item) => item.id !== post.id && item.category !== post.category);
  return [...sameCategory, ...fallback].slice(0, 3);
}

function renderRelatedPost(post) {
  return `<a href="${post.path}">
              <img src="${post.image}" alt="${escapeHtml(post.title)} 대표 이미지" loading="lazy" />
              <span>
                <strong>${escapeHtml(post.title)}</strong>
                <small>${escapeHtml(categoryLabels[post.category])} · ${formatDate(post.publishedAt)}</small>
              </span>
            </a>`;
}

function siteHeader() {
  return `<header class="site-header">
      <div class="header-inner">
        <a class="brand" href="/" aria-label="소소타임 홈">
          <span class="brand-mark">소소</span>
          <span>
            <strong>소소타임</strong>
            <small>공감 상황극과 유머 썰</small>
          </span>
        </a>
        <nav class="top-nav" aria-label="주요 분류">
          ${categoryEntries.map(({ category, label }) => `<a class="nav-tab" href="/?category=${category}">${label}</a>`).join("\n          ")}
        </nav>
      </div>
    </header>`;
}

function siteFooter() {
  return `<footer class="site-footer">
      <a href="/about">사이트 소개</a>
      <a href="/policy/editorial">작성 원칙</a>
      <a href="/report">수정·삭제 요청</a>
      <a href="/policy/privacy">개인정보처리방침</a>
      <a href="/contact">문의하기</a>
      <a href="/policy/terms">이용약관</a>
    </footer>`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function absoluteUrl(value) {
  if (/^https?:\/\//.test(value)) return value;
  return `${siteUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
