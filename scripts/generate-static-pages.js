import { readFile, writeFile } from "node:fs/promises";

const siteUrl = (process.env.SITE_URL || "https://sosotime.com").replace(/\/$/, "");
const posts = JSON.parse(await readFile("public/data/posts.json", "utf8")).filter((post) => post.status === "published");
const updated = posts
  .map((post) => post.updatedAt || post.publishedAt)
  .sort()
  .at(-1)
  ?.slice(0, 10) || "2026-07-11";

await writeFile("public/author.html", renderAuthorPage(), "utf8");
await writeFile("public/404.html", renderNotFoundPage(), "utf8");
console.log("Generated author and 404 pages");

function renderAuthorPage() {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>저자 소개 - SOSO TIME</title>
    <meta name="description" content="SOSO TIME 운영자 김애나의 작성 원칙과 문의 방법을 안내합니다." />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <link rel="canonical" href="${siteUrl}/author" />
    <link rel="alternate" type="application/rss+xml" title="SOSO TIME RSS" href="/rss.xml" />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    ${siteHeader()}
    <main class="page-shell">
      <section class="board-main">
        <div class="board-toolbar">
          <div>
            <p class="eyebrow">AUTHOR</p>
            <h1>김애나</h1>
            <p>SOSO TIME의 글을 직접 기획하고 작성하는 운영자입니다.</p>
          </div>
        </div>
        <div class="dialog-card">
          <h2>어떤 글을 쓰나요?</h2>
          <p>일상에서 누구나 겪지만 그냥 지나치기 쉬운 민망함, 웃음, 공감의 장면을 짧은 상황극과 에세이 형식으로 기록합니다. 모든 글은 독자가 실제 생활에서 떠올릴 수 있는 장면을 중심으로 직접 작성합니다.</p>
          <h2>작성 기준</h2>
          <p>외부 글을 베끼지 않고, 제목과 본문이 같은 경험을 가리키도록 구성합니다. 정보형 글은 확인 가능한 범위에서 생활 팁을 정리하며, 수정이 필요한 내용은 문의를 통해 검토합니다.</p>
          <h2>문의</h2>
          <p>글에 대한 의견, 정정 요청, 제휴가 아닌 일반 문의는 <a href="/contact">문의하기</a> 페이지로 보내 주세요. 최종 업데이트: ${updated}</p>
        </div>
      </section>
    </main>
    ${siteFooter()}
  </body>
</html>
`;
}

function renderNotFoundPage() {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>페이지를 찾을 수 없습니다 - SOSO TIME</title>
    <meta name="robots" content="noindex,follow" />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    ${siteHeader()}
    <main class="page-shell">
      <section class="board-main">
        <div class="dialog-card">
          <p class="eyebrow">404</p>
          <h1>페이지를 찾을 수 없습니다</h1>
          <p>주소가 바뀌었거나 삭제된 페이지입니다. 최신 글 목록이나 카테고리 페이지에서 원하는 글을 다시 찾아보세요.</p>
          <p><a class="hero-action" href="/">홈으로 가기</a></p>
        </div>
      </section>
    </main>
    ${siteFooter()}
  </body>
</html>
`;
}

function siteHeader() {
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
          <a class="nav-tab" href="/category/funny/">웃음</a>
          <a class="nav-tab" href="/category/empathy/">공감</a>
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
