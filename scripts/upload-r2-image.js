import {
  fail,
  hasFlag,
  loadDotEnv,
  makeR2Key,
  makeSlug,
  makeUploadResult,
  optimizeToWebp,
  positionalArgs,
  readLocalImage,
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
const [inputFile, slugArg] = positionalArgs(rawArgs);

if (!inputFile || !slugArg) {
  console.error("Usage: npm run image:upload -- <local-image-file> <post-title-or-slug> [--dry-run]");
  process.exit(1);
}

const source = await readLocalImage(inputFile);
const slug = makeSlug(slugArg);
const key = makeR2Key(slug);
const config = readR2Config({ optional: dryRun });
const optimized = await optimizeToWebp(source.buffer);

const upload = dryRun
  ? { dryRun: true, ...makeUploadResult(config, key) }
  : await uploadWebpToR2({
      config,
      key,
      body: optimized.buffer
    });

const result = {
  sourceFile: source.filePath,
  sourceName: source.sourceName,
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
