import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

await loadDotEnv(".env");

const env = process.env;

const config = {
  accountId: env.CLOUDFLARE_ACCOUNT_ID,
  accessKeyId: env.R2_ACCESS_KEY_ID,
  secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  bucket: env.R2_BUCKET,
  publicBaseUrl: env.R2_PUBLIC_BASE_URL?.replace(/\/$/, ""),
  sourceFile: env.IMAGE_SOURCE_FILE || "src/data/image-sources.json",
  manifestFile: env.IMAGE_MANIFEST_FILE || "public/image-manifest.json",
  prefix: (env.IMAGE_R2_PREFIX || "site-images").replace(/^\/|\/$/g, ""),
  quality: Number(env.IMAGE_WEBP_QUALITY || 80),
  maxWidth: Number(env.IMAGE_MAX_WIDTH || 1600),
  maxDownloadBytes: Number(env.IMAGE_MAX_DOWNLOAD_BYTES || 25 * 1024 * 1024),
  timeoutMs: Number(env.IMAGE_FETCH_TIMEOUT_MS || 20000),
  userAgent: env.IMAGE_USER_AGENT || "BokjiCheckImagePipeline/1.0 (+https://bokjicheck.co.kr)",
};

const required = [
  ["CLOUDFLARE_ACCOUNT_ID", config.accountId],
  ["R2_ACCESS_KEY_ID", config.accessKeyId],
  ["R2_SECRET_ACCESS_KEY", config.secretAccessKey],
  ["R2_BUCKET", config.bucket],
  ["R2_PUBLIC_BASE_URL", config.publicBaseUrl],
];

async function loadDotEnv(filePath) {
  try {
    const body = await fs.readFile(filePath, "utf8");
    for (const line of body.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

for (const [name, value] of required) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
});

async function readJson(filePath) {
  const body = await fs.readFile(filePath, "utf8");
  return JSON.parse(body);
}

function requestOptions(accept) {
  return {
    signal: AbortSignal.timeout(config.timeoutMs),
    headers: {
      "user-agent": config.userAgent,
      accept,
    },
  };
}

function assertHttpUrl(value, label) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`${label} must use http or https: ${value}`);
  }
  return url.toString();
}

async function fetchBuffer(url) {
  const safeUrl = assertHttpUrl(url, "Image URL");
  const response = await fetch(
    safeUrl,
    requestOptions("image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"),
  );

  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} ${response.statusText}: ${url}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > config.maxDownloadBytes) {
    throw new Error(`Image exceeds ${config.maxDownloadBytes} bytes: ${safeUrl}`);
  }

  const chunks = [];
  let receivedBytes = 0;
  for await (const chunk of response.body) {
    receivedBytes += chunk.byteLength;
    if (receivedBytes > config.maxDownloadBytes) {
      await response.body.cancel();
      throw new Error(`Image exceeds ${config.maxDownloadBytes} bytes: ${safeUrl}`);
    }
    chunks.push(Buffer.from(chunk));
  }

  return {
    buffer: Buffer.concat(chunks),
    contentType,
  };
}

async function fetchText(url) {
  const safeUrl = assertHttpUrl(url, "Page URL");
  const response = await fetch(safeUrl, requestOptions("text/html,application/xhtml+xml"));

  if (!response.ok) {
    throw new Error(`Page fetch failed ${response.status} ${response.statusText}: ${url}`);
  }

  return response.text();
}

function attributeValue(tag, name) {
  const pattern = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
  return tag.match(pattern)?.[1];
}

function addCandidate(found, candidate) {
  if (!candidate.imageUrl || candidate.imageUrl.startsWith("data:")) return;
  if (found.some((item) => item.imageUrl === candidate.imageUrl)) return;
  found.push(candidate);
}

function parseSrcset(srcset, pageUrl) {
  return srcset
    .split(",")
    .map((entry) => entry.trim().split(/\s+/)[0])
    .filter(Boolean)
    .map((src) => new URL(src, pageUrl).toString());
}

function discoverImages(html, pageUrl) {
  const found = [];

  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const property = attributeValue(tag, "property") || attributeValue(tag, "name");
    const content = attributeValue(tag, "content");
    if (!content) continue;
    if (["og:image", "og:image:url", "twitter:image", "twitter:image:src"].includes(String(property).toLowerCase())) {
      addCandidate(found, {
        imageUrl: new URL(content, pageUrl).toString(),
        source: String(property).toLowerCase(),
      });
    }
  }

  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    const rel = attributeValue(tag, "rel");
    const href = attributeValue(tag, "href");
    if (href && rel && String(rel).toLowerCase().includes("image_src")) {
      addCandidate(found, {
        imageUrl: new URL(href, pageUrl).toString(),
        source: "link:image_src",
      });
    }
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    const alt = attributeValue(tag, "alt") || "";
    const srcset = attributeValue(tag, "srcset") || attributeValue(tag, "data-srcset");

    if (srcset) {
      for (const imageUrl of parseSrcset(srcset, pageUrl)) {
        addCandidate(found, { imageUrl, alt, source: "img:srcset" });
      }
    }

    const src =
      attributeValue(tag, "src") ||
      attributeValue(tag, "data-src") ||
      attributeValue(tag, "data-original") ||
      attributeValue(tag, "data-lazy-src");
    if (!src) continue;

    addCandidate(found, {
      imageUrl: new URL(src, pageUrl).toString(),
      alt,
      source: "img",
    });
  }

  return found;
}

function safeSlug(value) {
  return String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function toWebp(inputBuffer) {
  const image = sharp(inputBuffer, { animated: false }).rotate();
  const metadata = await image.metadata();
  const width = metadata.width && metadata.width > config.maxWidth ? config.maxWidth : metadata.width;
  const output = image.resize({ width, withoutEnlargement: true }).webp({ quality: config.quality });
  const buffer = await output.toBuffer();
  const convertedMetadata = await sharp(buffer).metadata();

  return {
    buffer,
    width: convertedMetadata.width,
    height: convertedMetadata.height,
  };
}

function objectKey(entry, imageUrl, webpBuffer) {
  const hash = crypto.createHash("sha256").update(imageUrl).update(webpBuffer).digest("hex").slice(0, 16);
  const slug = safeSlug(entry.id || entry.alt || new URL(imageUrl).hostname || "image");
  return `${config.prefix}/${slug}-${hash}.webp`;
}

async function uploadWebp(key, buffer) {
  await s3.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: buffer,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return `${config.publicBaseUrl}/${key}`;
}

async function resolveImageEntries(source) {
  if (Array.isArray(source.imageUrls)) {
    return source.imageUrls.map((imageUrl, index) => ({
      ...source,
      id: source.imageUrls.length > 1 ? `${source.id || "image"}-${index + 1}` : source.id,
      imageUrl,
      discoveredFrom: "direct-list",
    }));
  }

  if (source.imageUrl) {
    return [{ ...source, imageUrl: source.imageUrl, discoveredFrom: "direct" }];
  }

  if (!source.pageUrl) {
    throw new Error(`Source must include imageUrl or pageUrl: ${JSON.stringify(source)}`);
  }

  const html = await fetchText(source.pageUrl);
  const candidates = discoverImages(html, source.pageUrl);
  if (candidates.length === 0) {
    throw new Error(`No image candidates found in page: ${source.pageUrl}`);
  }

  const selected = source.pick === "all" ? candidates : candidates.slice(0, source.limit || 1);

  return selected.map((candidate, index) => ({
    ...source,
    id: selected.length > 1 ? `${source.id || "image"}-${index + 1}` : source.id,
    imageUrl: candidate.imageUrl,
    alt: source.alt || candidate.alt || "",
    discoveredFrom: candidate.source,
  }));
}

async function main() {
  const sources = await readJson(config.sourceFile);
  if (!Array.isArray(sources)) {
    throw new Error(`${config.sourceFile} must contain a JSON array.`);
  }

  const manifest = [];
  let failureCount = 0;

  for (const source of sources) {
    const entries = await resolveImageEntries(source);

    for (const entry of entries) {
      try {
        const { buffer: originalBuffer, contentType } = await fetchBuffer(entry.imageUrl);
        const webp = await toWebp(originalBuffer);
        const key = objectKey(entry, entry.imageUrl, webp.buffer);
        const publicUrl = await uploadWebp(key, webp.buffer);

        manifest.push({
          id: entry.id,
          url: publicUrl,
          publicUrl,
          key,
          alt: entry.alt || "",
          width: webp.width,
          height: webp.height,
          originalBytes: originalBuffer.byteLength,
          webpBytes: webp.buffer.byteLength,
          compressionRatio: Number((webp.buffer.byteLength / originalBuffer.byteLength).toFixed(4)),
          sourcePageUrl: entry.pageUrl || null,
          sourceImageUrl: entry.imageUrl,
          sourceContentType: contentType,
          tags: entry.tags || [],
          updatedAt: new Date().toISOString(),
        });

        console.log(`uploaded ${entry.imageUrl}`);
        console.log(`  key: ${key}`);
        console.log(`  url: ${publicUrl}`);
      } catch (error) {
        failureCount += 1;
        console.error(`failed ${entry.imageUrl}: ${error.message}`);
      }
    }
  }

  await fs.mkdir(path.dirname(config.manifestFile), { recursive: true });
  await fs.writeFile(config.manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`manifest written: ${config.manifestFile}`);
  console.log(`completed: ${manifest.length} uploaded, ${failureCount} failed`);

  if (failureCount > 0) {
    throw new Error(`${failureCount} image(s) failed; see errors above.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
