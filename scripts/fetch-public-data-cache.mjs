import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(".env");
const outputPath = resolve("src/data/public-services.json");

function parseEnv(source) {
  const env = {};
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    env[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

function previousMonth() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .trim();
}

function getTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function getBlocks(xml, tag) {
  return [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "gi"))].map((match) => match[1]);
}

function totalCount(xml) {
  return Number(getTag(xml, "totalCount") || 0);
}

function buildUrl(rawUrl, key, keyParam, extra = {}) {
  const url = new URL(rawUrl);
  url.searchParams.set(keyParam, key);
  for (const [name, value] of Object.entries(extra)) {
    if (value !== undefined && value !== "") url.searchParams.set(name, String(value));
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

async function fetchText(rawUrl, key, keyParam, extra) {
  const response = await fetch(buildUrl(rawUrl, key, keyParam, extra));
  const body = await responseText(response);
  if (!response.ok) throw new Error(`HTTP ${response.status} ${rawUrl}`);
  return body;
}

async function fetchPaged(rawUrl, key, keyParam, extra = {}, rows = 500, maxPages = 20) {
  const first = await fetchText(rawUrl, key, keyParam, { ...extra, pageNo: 1, numOfRows: rows });
  const pages = [first];
  const total = totalCount(first);
  const pageCount = Math.min(maxPages, Math.max(1, Math.ceil(total / rows)));

  for (let pageNo = 2; pageNo <= pageCount; pageNo += 1) {
    pages.push(await fetchText(rawUrl, key, keyParam, { ...extra, pageNo, numOfRows: rows }));
  }

  return pages.join("\n");
}

function mapCentral(block) {
  return {
    source: "central",
    id: getTag(block, "servId"),
    title: getTag(block, "servNm"),
    summary: getTag(block, "servDgst"),
    provider: getTag(block, "jurMnofNm"),
    department: getTag(block, "jurOrgNm"),
    region: "",
    city: "",
    themes: getTag(block, "intrsThemaArray"),
    life: getTag(block, "lifeArray"),
    target: getTag(block, "trgterIndvdlArray"),
    supportCycle: getTag(block, "sprtCycNm"),
    delivery: getTag(block, "srvPvsnNm"),
    applyMethod: "",
    contact: getTag(block, "rprsCtadr"),
    lastModified: getTag(block, "svcfrstRegTs"),
    url: getTag(block, "servDtlLink"),
  };
}

function mapLocal(block) {
  return {
    source: "local",
    id: getTag(block, "servId"),
    title: getTag(block, "servNm"),
    summary: getTag(block, "servDgst"),
    provider: getTag(block, "ctpvNm"),
    department: getTag(block, "bizChrDeptNm"),
    region: getTag(block, "ctpvNm"),
    city: getTag(block, "sggNm"),
    themes: getTag(block, "intrsThemaNmArray"),
    life: getTag(block, "lifeNmArray"),
    target: "",
    supportCycle: getTag(block, "sprtCycNm"),
    delivery: getTag(block, "srvPvsnNm"),
    applyMethod: getTag(block, "aplyMtdNm"),
    contact: "",
    lastModified: getTag(block, "lastModYmd"),
    url: getTag(block, "servDtlLink"),
  };
}

function mapFacility(block) {
  return {
    id: getTag(block, "fcltCd") || getTag(block, "srvInstId"),
    name: getTag(block, "fcltNm"),
    kind: getTag(block, "fcltKindNm"),
    region: getTag(block, "jrsdSggNm"),
    code: getTag(block, "jrsdSggCd"),
  };
}

function mapPopulation(block) {
  return {
    month: getTag(block, "statsYm"),
    code: getTag(block, "admmCd"),
    region: getTag(block, "ctpvNm"),
    city: getTag(block, "sggNm"),
    total: Number(getTag(block, "totNmprCnt") || 0),
    male: Number(getTag(block, "maleNmprCnt") || 0),
    female: Number(getTag(block, "femlNmprCnt") || 0),
  };
}

function compactServices(services) {
  const seen = new Set();
  return services
    .filter((service) => service.id && service.title)
    .filter((service) => {
      const key = `${service.source}:${service.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function requiredEnv(env, key) {
  const value = env[key];
  if (!value) throw new Error(`${key} 값이 비어 있습니다.`);
  return value;
}

async function main() {
  if (!existsSync(envPath)) {
    console.error(".env 파일이 없습니다. 공공데이터포털 인증키와 요청주소를 먼저 설정하세요.");
    process.exit(1);
  }

  const env = parseEnv(await readFile(envPath, "utf8"));
  const keyParam = env.PUBLIC_DATA_SERVICE_KEY_PARAM || "serviceKey";
  const centralKey = env.PUBLIC_DATA_CENTRAL_WELFARE_KEY || env.PUBLIC_DATA_SERVICE_KEY;
  const localKey = env.PUBLIC_DATA_LOCAL_WELFARE_KEY || env.PUBLIC_DATA_SERVICE_KEY;
  const facilityKey = env.PUBLIC_DATA_FACILITY_KEY || env.PUBLIC_DATA_SERVICE_KEY;
  const populationKey = env.PUBLIC_DATA_POPULATION_KEY || env.PUBLIC_DATA_SERVICE_KEY;

  const [centralXml, localXml, facilityXml, populationXml] = await Promise.all([
    fetchPaged(requiredEnv(env, "PUBLIC_DATA_CENTRAL_WELFARE_LIST_URL"), centralKey, keyParam, { callTp: "L", srchKeyCode: "001" }, 500, 3),
    fetchPaged(requiredEnv(env, "PUBLIC_DATA_LOCAL_WELFARE_LIST_URL"), localKey, keyParam, {}, 500, 12),
    fetchPaged(requiredEnv(env, "PUBLIC_DATA_FACILITY_LIST_URL"), facilityKey, keyParam, {}, 100, 2),
    fetchText(requiredEnv(env, "PUBLIC_DATA_POPULATION_URL"), populationKey, keyParam, {
      admmCd: "0000000000",
      srchFrYm: previousMonth(),
      srchToYm: previousMonth(),
      lv: "1",
      regSeCd: "1",
      type: "XML",
      pageNo: 1,
      numOfRows: 100,
    }),
  ]);

  const payload = {
    generatedAt: new Date().toISOString(),
    centralServices: compactServices(getBlocks(centralXml, "servList").map(mapCentral)),
    localServices: compactServices(getBlocks(localXml, "servList").map(mapLocal)),
    facilities: getBlocks(facilityXml, "item").map(mapFacility).filter((facility) => facility.id && facility.name),
    populationByRegion: getBlocks(populationXml, "item").map(mapPopulation).filter((row) => row.code && row.region),
  };

  await mkdir(resolve("src/data"), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `Saved ${payload.centralServices.length} central, ${payload.localServices.length} local, ${payload.facilities.length} facilities, ${payload.populationByRegion.length} population rows.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
