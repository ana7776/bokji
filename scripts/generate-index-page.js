import { readFile, writeFile } from "node:fs/promises";

const siteUrl = process.env.SITE_URL || "https://sosotime.com";
const posts = JSON.parse(await readFile("public/data/posts.json", "utf8")).filter((post) => post.status === "published");
const adsenseClient = process.env.ADSENSE_CLIENT || "ca-pub-5804969457082424";

const categoryMeta = {
  funny: {
    label: "웃음",
    icon: "웃",
    tone: "yellow",
    description: "웃음이 났던 일상의 장면과 작은 소동들",
  },
  empathy: {
    label: "공감",
    icon: "공",
    tone: "pink",
    description: "출퇴근길, 사무실, 대화 속 누구나 아는 순간",
  },
  life: {
    label: "생활",
    icon: "생",
    tone: "orange",
    description: "직접 해 보고 정리한 생활 습관과 소비 이야기",
  },
  info: {
    label: "정보",
    icon: "정",
    tone: "green",
    description: "경험에서 정리한 실전 팁과 체크 포인트",
  },
};

const sortedLatest = [...posts].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
const featured = posts.filter((post) => post.featured);
const heroPost = featured[0] || sortedLatest[0];
const editorPicks = (featured.length ? featured : sortedLatest).slice(0, 3);
const topStories = sortedLatest.slice(0, 6);
const categorySummaries = Object.entries(categoryMeta)
  .map(([category, meta]) => ({
    category,
    ...meta,
    count: posts.filter((post) => post.category === category).length,
    posts: posts
      .filter((post) => post.category === category)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 4),
  }))
  .filter((entry) => entry.count > 0);

const pageTitle = "소소타임 - 공감 상황극과 짧은 유머 썰";
const pageDescription =
  "소소타임은 누구나 한 번쯤 겪어 본 일상의 순간을 공감 상황극과 짧은 유머 썰로 풀어내는 오리지널 유머 사이트입니다.";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "소소타임",
  url: siteUrl,
  inLanguage: "ko-KR",
  description: pageDescription,
  publisher: { "@type": "Organization", name: "소소타임", url: siteUrl },
};

const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(pageDescription)}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <meta name="naver-site-verification" content="39233df2c0bc4eae9016d16a8866f9f7131b6b60" />
    <link rel="canonical" href="${siteUrl}/" />
    <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
    <link rel="stylesheet" href="/styles.css" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="소소타임" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(pageDescription)}" />
    <meta property="og:url" content="${siteUrl}/" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(pageDescription)}" />
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}" crossorigin="anonymous"></script>
    <script type="application/ld+json">${safeJson(jsonLd)}</script>
  </head>
  <body class="humor-home-body">
    <header class="humor-header">
      <div class="humor-header-top">
        <a class="humor-logo" href="/" aria-label="소소타임 홈">
          <strong>SOSO TIME</strong>
          <small>공감 상황극과 유머 썰</small>
        </a>
        <form class="humor-search" action="/" role="search">
          <label class="visually-hidden" for="searchInput">검색어 입력</label>
          <input id="searchInput" name="q" type="search" placeholder="글 제목이나 주제를 검색해 보세요" />
        </form>
        <nav class="humor-actions" aria-label="바로가기">
          <a href="/about">소개</a>
          <a href="/policy/editorial">작성 원칙</a>
        </nav>
      </div>
      <nav class="humor-nav" aria-label="카테고리">
        <div class="humor-nav-inner">
          <a class="nav-tab is-active" href="/" data-filter="all">전체</a>
          ${categorySummaries.map(renderNavTab).join("\n          ")}
        </div>
      </nav>
    </header>

    <main class="humor-shell">
      <div class="humor-layout">
        <div class="humor-main">
          <section class="home-hero-card humor-hero" aria-labelledby="home-title">
            <img class="home-hero-image" src="/assets/site/hero-community.webp" alt="휴대폰을 보며 웃는 소소타임 캐릭터" loading="eager" />
            <div class="home-hero-copy">
              <p class="eyebrow">오리지널 유머</p>
              <h1 id="home-title">웃기고 공감되는<br /><span>일상의 그 순간</span></h1>
              <p>누구나 한 번쯤 겪어 본 상황을 공감 상황극과 짧은 유머 썰로 풀어냅니다. 모두 직접 쓴 오리지널 글입니다.</p>
              <a class="hero-action" href="${heroPost.path}">최근 이야기 읽어보기</a>
            </div>
          </section>

          <section class="humor-card-section" aria-labelledby="top-title">
            <div class="section-heading section-title-row">
              <h2 id="top-title">최근 올라온 글</h2>
            </div>
            <div id="topCards" class="story-card-grid humor-story-grid">
              ${topStories.map(renderStoryCard).join("\n              ")}
            </div>
          </section>

          <section class="category-popular" aria-labelledby="category-title">
            <div class="section-heading section-title-row">
              <h2 id="category-title">카테고리별 모아보기</h2>
            </div>
            <div class="category-board humor-category-board">
              ${categorySummaries.map(renderCategoryColumn).join("\n              ")}
            </div>
          </section>

          <section class="humor-latest-section" aria-labelledby="latest-title">
            <div class="section-heading section-title-row latest-tabs">
              <h2 id="latest-title">전체 글</h2>
            </div>
            <ol id="postList" class="collection-list humor-latest-list">
              ${sortedLatest.map(renderLatestItem).join("\n              ")}
            </ol>
          </section>
        </div>

        <aside class="humor-sidebar" aria-label="사이드 콘텐츠">
          <section class="sidebar-card" aria-labelledby="editor-title">
            <div class="section-title-row">
              <h2 id="editor-title">에디터가 아끼는 글</h2>
            </div>
            ${renderEditorMain(editorPicks[0])}
            <div class="editor-list">
              ${editorPicks.slice(1).map(renderEditorItem).join("\n              ")}
            </div>
          </section>

          <section class="sidebar-card" aria-labelledby="tag-title">
            <div class="section-title-row">
              <h2 id="tag-title">자주 다루는 주제</h2>
            </div>
            <div class="tag-cloud">
              ${renderTagCloud()}
            </div>
          </section>

          <section class="rule-card humor-rule-card" aria-labelledby="rule-title">
            <h2 id="rule-title">소소타임의 글쓰기</h2>
            <p>모든 글은 운영자가 직접 쓴 오리지널 유머입니다. 다른 사이트의 글이나 이미지를 가져오지 않습니다.</p>
            <a href="/policy/editorial">자세히 보기</a>
          </section>
        </aside>
      </div>
    </main>

    <footer class="board-footer humor-footer">
      <a href="/about">사이트 소개</a>
      <a href="/policy/editorial">작성 원칙</a>
      <a href="/report">수정·삭제 요청</a>
      <a href="/contact">문의하기</a>
      <a href="/policy/privacy">개인정보처리방침</a>
      <a href="/policy/terms">이용약관</a>
    </footer>

    <script type="module" src="/app.js"></script>
  </body>
</html>
`;

await writeFile("public/index.html", html, "utf8");
console.log(`Generated blog index page with ${posts.length} posts`);

function renderNavTab(entry) {
  return `<a class="nav-tab" href="/?category=${entry.category}" data-filter="${entry.category}">${escapeHtml(entry.label)}</a>`;
}

function renderStoryCard(post) {
  const meta = getCategory(post);
  return `<article class="story-card humor-story-card">
                <a href="${post.path}">
                  <span class="category-pill ${meta.tone}">${escapeHtml(meta.label)}</span>
                  <img src="${post.image}" alt="${escapeHtml(post.title)}" loading="lazy" />
                  <strong>${escapeHtml(post.title)}</strong>
                  <small>${formatDate(post.publishedAt)}</small>
                </a>
              </article>`;
}

function renderCategoryColumn(entry) {
  return `<article class="category-column ${entry.tone}">
                <div class="category-column-head">
                  <h3><span>${escapeHtml(entry.icon)}</span>${escapeHtml(entry.label)}</h3>
                  <a href="/?category=${entry.category}" class="nav-tab" data-filter="${entry.category}">더보기</a>
                </div>
                <p>${escapeHtml(entry.description)}</p>
                <ol>
                  ${entry.posts.map((post, index) => renderCategoryPost(post, index)).join("\n                  ")}
                </ol>
              </article>`;
}

function renderCategoryPost(post, index) {
  return `<li><a href="${post.path}"><span>${index + 1}</span><strong>${escapeHtml(post.title)}</strong></a></li>`;
}

function renderLatestItem(post) {
  const meta = getCategory(post);
  return `<li>
                <article class="latest-row">
                  <span class="category-pill ${meta.tone}">${escapeHtml(meta.label)}</span>
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

function renderEditorMain(post) {
  if (!post) return "";
  return `<a class="editor-main-pick" href="${post.path}">
              <img src="${post.image}" alt="${escapeHtml(post.title)} 대표 이미지" loading="lazy" />
              <span>PICK</span>
              <strong>${escapeHtml(post.title)}</strong>
              <small>${escapeHtml(getCategory(post).label)} · ${formatDate(post.publishedAt)}</small>
            </a>`;
}

function renderEditorItem(post) {
  return `<a href="${post.path}">
                <img src="${post.image}" alt="${escapeHtml(post.title)} 대표 이미지" loading="lazy" />
                <div>
                  <em>PICK</em>
                  <strong>${escapeHtml(post.title)}</strong>
                  <small>${escapeHtml(getCategory(post).label)} · ${formatDate(post.publishedAt)}</small>
                </div>
              </a>`;
}

function renderTagCloud() {
  const tags = [...new Set(posts.flatMap((post) => post.tags || []))]
    .filter(Boolean)
    .slice(0, 12);
  return tags.map((tag) => `<a href="/?q=${encodeURIComponent(tag)}">#${escapeHtml(tag)}</a>`).join("\n              ");
}

function getCategory(post) {
  return categoryMeta[post.category] || categoryMeta.life;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
