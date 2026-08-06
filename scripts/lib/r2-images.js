import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

export const defaultUserAgent = "sosotime-image-pipeline/1.0 (+https://sosotime.com)";
export const tmpImageDir = join(process.cwd(), ".tmp", "images");

const supportedRasterTypes = new Set([
  "image/avif",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
]);

export async function loadDotEnv(filePath = ".env") {
  try {
    const text = await readFile(filePath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const eq = line.indexOf("=");
      if (eq === -1) continue;

      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (!key || process.env[key] !== undefined) continue;

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

export function readR2Config({ optional = false } = {}) {
  const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_BASE_URL"];
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length && !optional) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    accountId: process.env.R2_ACCOUNT_ID || "dry-run-account",
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "dry-run-key",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "dry-run-secret",
    bucket: process.env.R2_BUCKET || "sosotime-images",
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL || "https://images.sosotime.com"
  };
}

export function parseImageUrl(value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Only http and https image URLs are supported.");
    }
    return url;
  } catch (error) {
    throw new Error(`Invalid image URL: ${error.message}`);
  }
}

export async function downloadImage(url, { maxBytes = readMaxBytes(), userAgent = defaultUserAgent } = {}) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.8"
    },
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status} ${response.statusText}`);
  }

  const contentType = normalizeContentType(response.headers.get("content-type") || "");
  if (!supportedRasterTypes.has(contentType)) {
    throw new Error(`Source URL did not return a supported raster image type: ${contentType || "unknown"}`);
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > maxBytes) {
    throw new Error(`Source image is too large: ${contentLength} bytes, max ${maxBytes} bytes`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > maxBytes) {
    throw new Error(`Downloaded image is too large: ${buffer.byteLength} bytes, max ${maxBytes} bytes`);
  }

  return { buffer, contentType, sourceBytes: buffer.byteLength };
}

export async function readLocalImage(inputFile) {
  const filePath = resolve(inputFile);
  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) {
    throw new Error("Input path is not a file.");
  }

  const extension = extname(filePath).toLowerCase();
  const allowed = new Set([".avif", ".gif", ".heic", ".heif", ".jpg", ".jpeg", ".png", ".webp"]);
  if (!allowed.has(extension)) {
    throw new Error(`Unsupported local image extension: ${extension || "none"}`);
  }

  return {
    buffer: await readFile(filePath),
    filePath,
    sourceName: basename(filePath),
    sourceBytes: fileStat.size
  };
}

export async function optimizeToWebp(inputBuffer, options = {}) {
  const width = Number(options.width || process.env.IMAGE_WIDTH || 1200);
  const height = Number(options.height || process.env.IMAGE_HEIGHT || 675);
  const quality = Number(options.quality || process.env.IMAGE_WEBP_QUALITY || 80);
  const fit = options.fit || process.env.IMAGE_RESIZE_FIT || "cover";

  const { data, info } = await sharp(inputBuffer, { animated: false })
    .rotate()
    .resize({ width, height, fit, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    bytes: data.byteLength,
    width: info.width,
    height: info.height,
    format: info.format,
    quality,
    fit
  };
}

export async function uploadWebpToR2({ config, key, body, sourceUrl }) {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });

  const metadata = sourceUrl ? { "source-url": sourceUrl } : undefined;
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
      Metadata: metadata
    })
  );

  return makeUploadResult(config, key);
}

export function makeUploadResult(config, key) {
  return {
    bucket: config.bucket,
    key,
    publicUrl: makePublicUrl(config.publicBaseUrl, key)
  };
}

export function makeR2Key(slug, date = new Date()) {
  const yyyy = String(date.getUTCFullYear());
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `curated/${yyyy}/${mm}/${slug}.webp`;
}

export function makeSlug(value) {
  const source = String(value).normalize("NFC").trim();
  const slug = source
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^0-9a-z\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  if (slug) {
    return slug;
  }

  if (!source) {
    throw new Error("Post title or slug must contain at least one valid character.");
  }

  const hash = createHash("sha1").update(source).digest("hex").slice(0, 12);
  return `image-${hash}`;
}

export async function writeImageArtifacts({ slug, webpBuffer, result }) {
  await mkdir(tmpImageDir, { recursive: true });

  const outputFile = join(tmpImageDir, `${slug}.webp`);
  const resultFile = join(tmpImageDir, `${slug}.json`);

  await writeFile(outputFile, webpBuffer);
  await writeFile(resultFile, `${JSON.stringify({ ...result, localWebp: outputFile }, null, 2)}\n`, "utf8");

  return { outputFile, resultFile };
}

export async function removeTmpImage(outputFile) {
  if (process.env.KEEP_IMAGE_TMP !== "1") {
    await rm(outputFile, { force: true });
  }
}

export function hasFlag(args, flag) {
  return args.includes(flag);
}

export function positionalArgs(args) {
  return args.filter((arg) => !arg.startsWith("--"));
}

export function fail(error) {
  console.error(error?.message || error);
  process.exit(1);
}

function normalizeContentType(contentType) {
  return contentType.split(";")[0].trim().toLowerCase();
}

function readMaxBytes() {
  return Number(process.env.IMAGE_MAX_BYTES || 12 * 1024 * 1024);
}

function makePublicUrl(baseUrl, key) {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(encodeURI(key), base).toString();
}
