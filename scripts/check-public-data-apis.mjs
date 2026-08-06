import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(".env");
const outputDir = resolve(".api-samples");

const targets = [
  ["central-list", "PUBLIC_DATA_CENTRAL_WELFARE_LIST_URL", "PUBLIC_DATA_CENTRAL_WELFARE_KEY"],
  ["central-detail", "PUBLIC_DATA_CENTRAL_WELFARE_DETAIL_URL", "PUBLIC_DATA_CENTRAL_WELFARE_KEY"],
  ["local-list", "PUBLIC_DATA_LOCAL_WELFARE_LIST_URL", "PUBLIC_DATA_LOCAL_WELFARE_KEY"],
  ["local-detail", "PUBLIC_DATA_LOCAL_WELFARE_DETAIL_URL", "PUBLIC_DATA_LOCAL_WELFARE_KEY"],
  ["facility-list", "PUBLIC_DATA_FACILITY_LIST_URL", "PUBLIC_DATA_FACILITY_KEY"],
  ["facility-detail", "PUBLIC_DATA_FACILITY_DETAIL_URL", "PUBLIC_DATA_FACILITY_KEY"],
  ["population", "PUBLIC_DATA_POPULATION_URL", "PUBLIC_DATA_POPULATION_KEY"],
];

const defaultParams = {
  "central-list": { callTp: "L", srchKeyCode: "001" },
  "central-detail": { callTp: "D", servId: "WLF00000026" },
  "local-detail": { servId: "WLF00002035" },
  "facility-detail": { fcltCd: "A0001" },
  population: {
    admmCd: "0000000000",
    srchFrYm: previousMonth(),
    srchToYm: previousMonth(),
    lv: "1",
    regSeCd: "1",
    type: "XML",
  },
};

function previousMonth() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseEnv(source) {
  const env = {};
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = value;
  }
  return env;
}

function buildUrl(rawUrl, key, keyParam, extraParams = {}) {
  const url = new URL(rawUrl);
  url.searchParams.set(keyParam, key);
  if (!url.searchParams.has("pageNo")) url.searchParams.set("pageNo", "1");
  if (!url.searchParams.has("numOfRows")) url.searchParams.set("numOfRows", "5");
  for (const [name, value] of Object.entries(extraParams)) {
    if (!url.searchParams.has(name)) url.searchParams.set(name, value);
  }
  return url;
}

function charsetFromResponse(response, fallback = "utf-8") {
  const contentType = response.headers.get("content-type") || "";
  return contentType.match(/charset=([^;\s]+)/i)?.[1] || fallback;
}

async function responseText(response) {
  const buffer = await response.arrayBuffer();
  const charset = charsetFromResponse(response);
  try {
    return new TextDecoder(charset).decode(buffer);
  } catch {
    return new TextDecoder("utf-8").decode(buffer);
  }
}

function looksJson(contentType, body) {
  return contentType.includes("json") || body.trim().startsWith("{") || body.trim().startsWith("[");
}

async function main() {
  if (!existsSync(envPath)) {
    console.error(".env 파일이 없습니다. .env.example을 복사해 공공데이터포털 인증키와 요청주소를 넣어주세요.");
    process.exit(1);
  }

  const env = parseEnv(await readFile(envPath, "utf8"));
  const defaultServiceKey = env.PUBLIC_DATA_SERVICE_KEY;
  const keyParam = env.PUBLIC_DATA_SERVICE_KEY_PARAM || "serviceKey";

  if (!defaultServiceKey) {
    console.error("PUBLIC_DATA_SERVICE_KEY 값이 비어 있습니다.");
    process.exit(1);
  }

  await rm(outputDir, { force: true, recursive: true });
  await mkdir(outputDir, { recursive: true });

  let checked = 0;
  for (const [name, envKey, keyEnv] of targets) {
    const rawUrl = env[envKey];
    if (!rawUrl) {
      console.log(`SKIP ${name}: ${envKey} 미설정`);
      continue;
    }

    const serviceKey = env[keyEnv] || defaultServiceKey;
    const url = buildUrl(rawUrl, serviceKey, keyParam, defaultParams[name]);
    const response = await fetch(url);
    const body = await responseText(response);
    const contentType = response.headers.get("content-type") || "";
    const extension = looksJson(contentType, body) ? "json" : "xml";
    const outputPath = resolve(outputDir, `${name}.${extension}`);

    await writeFile(outputPath, body, "utf8");
    checked += 1;
    console.log(`${response.ok ? "OK" : "FAIL"} ${response.status} ${name} -> ${outputPath}`);
  }

  if (checked === 0) {
    console.log("확인할 API URL이 없습니다. 공공데이터포털 상세 화면의 요청주소를 .env에 넣어주세요.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
