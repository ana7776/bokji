import {
  downloadImage,
  fail,
  hasFlag,
  loadDotEnv,
  makeR2Key,
  makeSlug,
  makeUploadResult,
  optimizeToWebp,
  parseImageUrl,
  positionalArgs,
  readR2Config,
  removeTmpImage,
  uploadWebpToR2,
  writeImageArtifacts
} from "./lib/r2-images.js";

process.on("unhandledRejection", fail);
process.on("uncaughtException", fail);

await loadDotEnv();

const rawArgs = process.argv.slice(2);
const dryRun = hasFlag(rawArgs, "--dry-run");
const [imageUrl, slugArg] = positionalArgs(rawArgs);

if (!imageUrl || !slugArg) {
  console.error("Usage: npm run image:fetch -- <source-image-url> <post-title-or-slug> [--dry-run]");
  process.exit(1);
}

const sourceUrl = parseImageUrl(imageUrl);
const slug = makeSlug(slugArg);
const key = makeR2Key(slug);
const config = readR2Config({ optional: dryRun });

const source = await downloadImage(sourceUrl);
const optimized = await optimizeToWebp(source.buffer);
const upload = dryRun
  ? { dryRun: true, ...makeUploadResult(config, key) }
  : await uploadWebpToR2({
      config,
      key,
      body: optimized.buffer,
      sourceUrl: sourceUrl.href
    });

const result = {
  sourceUrl: sourceUrl.href,
  sourceContentType: source.contentType,
  sourceBytes: source.sourceBytes,
  optimizedBytes: optimized.bytes,
  width: optimized.width,
  height: optimized.height,
  quality: optimized.quality,
  fit: optimized.fit,
  ...upload
};

const artifacts = await writeImageArtifacts({ slug, webpBuffer: optimized.buffer, result });
if (!dryRun) {
  await removeTmpImage(artifacts.outputFile);
}

console.log(JSON.stringify(result, null, 2));
