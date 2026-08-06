const state = {
  posts: [],
  category: "all",
  query: ""
};

const categoryMeta = {
  funny: { label: "웃음", tone: "yellow" },
  empathy: { label: "공감", tone: "pink" },
  life: { label: "생활", tone: "orange" },
  info: { label: "정보", tone: "green" }
};

const els = {
  postList: document.querySelector("#postList"),
  topCards: document.querySelector("#topCards"),
  searchInput: document.querySelector("#searchInput")
};

const dateFormat = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

async function boot() {
  try {
    const response = await fetch("/data/posts.json");
    const data = await response.json();
    state.posts = data.filter((post) => post.status === "published");
  } catch (error) {
    state.posts = [];
  }
  applyStateFromUrl();
  bindEvents();
  render();
}

function bindEvents() {
  document.querySelectorAll(".nav-tab").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (!button.dataset.filter) return;
      event.preventDefault();
      state.category = button.dataset.filter;
      setActive(".nav-tab", button);
      updateListUrl();
      render();
    });
  });

  els.searchInput?.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    updateListUrl();
    render();
  });
}

function setActive(selector, selected) {
  document.querySelectorAll(selector).forEach((button) => {
    button.classList.toggle("is-active", button === selected);
  });
}

function applyStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const query = params.get("q") || "";

  if (category === "all" || categoryMeta[category]) {
    state.category = category;
  }

  if (query) {
    state.query = query.trim().toLowerCase();
    if (els.searchInput) els.searchInput.value = query;
  }

  const selectedCategory = document.querySelector(`.nav-tab[data-filter="${state.category}"]`);
  if (selectedCategory) setActive(".nav-tab", selectedCategory);
}

function updateListUrl() {
  const url = new URL(window.location.href);

  if (state.category === "all") url.searchParams.delete("category");
  else url.searchParams.set("category", state.category);

  if (state.query) url.searchParams.set("q", state.query);
  else url.searchParams.delete("q");

  history.replaceState({}, "", url);
}

function filteredPosts() {
  let posts = [...state.posts];

  if (state.category !== "all") {
    posts = posts.filter((post) => post.category === state.category);
  }

  if (state.query) {
    posts = posts.filter((post) => {
      const haystack = `${post.title} ${post.summary} ${post.description} ${(post.tags || []).join(" ")}`.toLowerCase();
      return haystack.includes(state.query);
    });
  }

  posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  return posts;
}

function render() {
  const posts = filteredPosts();
  renderTopCards();
  renderPostList(posts);
}

function renderTopCards() {
  if (!els.topCards) return;
  const latest = [...state.posts]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 6);
  els.topCards.replaceChildren(...latest.map(createStoryCard));
}

function renderPostList(posts) {
  if (!els.postList) return;

  if (!posts.length) {
    const empty = document.createElement("li");
    empty.className = "empty-row";
    empty.textContent = "조건에 맞는 글이 없습니다.";
    els.postList.replaceChildren(empty);
    return;
  }

  els.postList.replaceChildren(...posts.map(createLatestRow));
}

function createStoryCard(post) {
  const meta = categoryMeta[post.category] || categoryMeta.life;
  const item = document.createElement("article");
  item.className = "story-card humor-story-card";
  item.innerHTML = `
    <a href="${post.path}">
      <span class="category-pill ${meta.tone}">${escapeHtml(meta.label)}</span>
      <img src="${post.image}" alt="${escapeHtml(post.title)}" loading="lazy">
      <strong>${escapeHtml(post.title)}</strong>
      <small>${formatDate(post.publishedAt)}</small>
    </a>
  `;
  return item;
}

function createLatestRow(post) {
  const meta = categoryMeta[post.category] || categoryMeta.life;
  const item = document.createElement("li");
  item.innerHTML = `
    <article class="latest-row">
      <span class="category-pill ${meta.tone}">${escapeHtml(meta.label)}</span>
      <div class="latest-copy">
        <strong><a href="${post.path}">${escapeHtml(post.title)}</a></strong>
        <small>${escapeHtml(post.description)}</small>
        <small><time datetime="${post.publishedAt}">${formatDate(post.publishedAt)}</time></small>
      </div>
      <a href="${post.path}" aria-label="${escapeHtml(post.title)} 글 보기">
        <img src="${post.image}" alt="${escapeHtml(post.title)} 대표 이미지" loading="lazy">
      </a>
    </article>
  `;
  return item;
}

function formatDate(value) {
  return dateFormat.format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

boot();
