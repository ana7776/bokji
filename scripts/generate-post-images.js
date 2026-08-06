import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const postsFile = "public/data/posts.json";
const outputDir = "public/assets/posts";
const posts = JSON.parse(await readFile(postsFile, "utf8"));

const categoryStyles = {
  funny: { label: "웃음", bg: "#f8efe7", ink: "#34251d", accent: "#c4492d" },
  empathy: { label: "공감", bg: "#eaf5f1", ink: "#1f332e", accent: "#1f6f5b" },
  life: { label: "생활", bg: "#f6f3e8", ink: "#302b1f", accent: "#8a6f2a" },
  info: { label: "정보", bg: "#edf5fb", ink: "#1f2e37", accent: "#2d6f8f" }
};

await mkdir(outputDir, { recursive: true });

let changed = false;
for (const post of posts) {
  const style = categoryStyles[post.category] || categoryStyles.info;
  const imagePath = `/assets/posts/${post.slug}.webp`;
  const svg = renderSvg(post, style);
  await sharp(Buffer.from(svg)).webp({ quality: 86 }).toFile(`public${imagePath}`);

  if (post.image !== imagePath) {
    post.image = imagePath;
    changed = true;
  }
}

if (changed) {
  await writeFile(postsFile, `${JSON.stringify(posts, null, 2)}\n`, "utf8");
}

console.log(`Generated ${posts.length} local post images`);

function renderSvg(post, style) {
  const titleLines = wrapText(post.title, 18, 3);
  const tags = post.tags.slice(0, 3).map((tag) => `#${tag}`).join("   ");
  const titleSvg = titleLines
    .map((line, index) => `<text x="86" y="${278 + index * 78}" class="title">${escapeXml(line)}</text>`)
    .join("");

  return `<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <style>
    .brand { font: 700 34px Arial, 'Malgun Gothic', sans-serif; fill: ${style.accent}; letter-spacing: 0; }
    .label { font: 800 28px Arial, 'Malgun Gothic', sans-serif; fill: #ffffff; letter-spacing: 0; }
    .title { font: 800 58px Arial, 'Malgun Gothic', sans-serif; fill: ${style.ink}; letter-spacing: 0; }
    .tags { font: 600 27px Arial, 'Malgun Gothic', sans-serif; fill: #52616d; letter-spacing: 0; }
    .caption { font: 600 25px Arial, 'Malgun Gothic', sans-serif; fill: #52616d; letter-spacing: 0; }
  </style>
  <rect width="1200" height="675" fill="${style.bg}" />
  <rect x="46" y="46" width="1108" height="583" rx="28" fill="#ffffff" opacity="0.72" />
  <rect x="86" y="92" width="146" height="56" rx="12" fill="${style.accent}" />
  <text x="159" y="130" text-anchor="middle" class="label">${escapeXml(style.label)}</text>
  <text x="260" y="131" class="brand">소소타임</text>
  ${titleSvg}
  <text x="86" y="548" class="tags">${escapeXml(tags)}</text>
  <text x="86" y="595" class="caption">공감 상황극과 짧은 유머 썰</text>
  <rect x="1036" y="496" width="74" height="74" rx="16" fill="${style.accent}" opacity="0.95" />
  <text x="1073" y="543" text-anchor="middle" class="label">${String(post.id).padStart(2, "0")}</text>
</svg>`;
}

function wrapText(value, limit, maxLines) {
  const words = value.split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (Array.from(next).length > limit && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  if (lines.length > maxLines) lines.length = maxLines;
  return lines;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
