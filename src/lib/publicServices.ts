import rawPublicServices from "@/data/public-services.json";
import type { CheckItem } from "@/lib/items";

export interface PublicWelfareService {
  source: "central" | "local";
  id: string;
  title: string;
  summary: string;
  provider: string;
  department: string;
  region: string;
  city: string;
  themes: string;
  life: string;
  target: string;
  supportCycle: string;
  delivery: string;
  applyMethod: string;
  contact: string;
  lastModified: string;
  url: string;
}

interface PublicServicesPayload {
  generatedAt: string;
  centralServices: PublicWelfareService[];
  localServices: PublicWelfareService[];
  facilities: unknown[];
  populationByRegion: unknown[];
}

export const publicServices = rawPublicServices as PublicServicesPayload;

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function serviceText(service: PublicWelfareService) {
  return normalize(
    [
      service.title,
      service.summary,
      service.provider,
      service.department,
      service.region,
      service.city,
      service.themes,
      service.life,
      service.target,
      service.delivery,
      service.applyMethod,
    ].join(" "),
  );
}

function keywordsForItem(item: CheckItem) {
  const keywords = [
    ...item.relatedTags,
    ...item.keywords,
    item.title,
    item.subCategoryLabel,
    item.categoryLabel,
  ];

  if (item.category === "welfare") keywords.push("복지", "지원", "급여", "저소득");
  if (item.id.includes("pension")) keywords.push("노인", "기초연금", "노후");
  if (item.id.includes("housing") || item.subCategory.includes("housing")) keywords.push("주거", "임차", "월세");
  if (item.id.includes("livelihood")) keywords.push("기초생활", "생계", "의료", "주거급여", "교육급여");

  return [...new Set(keywords.map((keyword) => keyword.trim()).filter((keyword) => keyword.length >= 2))];
}

function scoreService(service: PublicWelfareService, item: CheckItem) {
  const haystack = serviceText(service);
  let score = 0;

  for (const keyword of keywordsForItem(item)) {
    const token = normalize(keyword);
    if (!token) continue;
    if (normalize(service.title).includes(token)) score += 8;
    if (haystack.includes(token)) score += 3;
  }

  if (service.source === "central") score += 1;
  if (item.category === "welfare" && /복지|급여|지원|저소득|노인|아동|주거|의료/.test(service.summary)) score += 3;
  if (item.id.includes("pension") && /기초연금/.test(service.title)) score += 50;
  if (item.id.includes("pension") && /노인|기초연금|노후/.test(serviceText(service))) score += 8;
  if (item.id === "median-income-threshold" && /주거급여|교육급여|긴급복지|기초생활|저소득층 복지할인/.test(service.title)) score += 28;
  if (item.id === "median-income-threshold" && /육아|보조기기|임신|출산|퇴직급여|대지급금/.test(service.title)) score -= 12;
  if (item.id.includes("livelihood") && /주거급여|교육급여|기초생활|긴급복지 생계|저소득층/.test(service.title)) score += 18;
  if (item.id.includes("livelihood") && /기초생활|생계|의료급여|주거급여|저소득/.test(serviceText(service))) score += 8;

  return score;
}

function pickRelated(services: PublicWelfareService[], item: CheckItem, limit: number) {
  return services
    .map((service) => ({ service, score: scoreService(service, item) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ service }) => service);
}

export function relatedPublicServices(item: CheckItem, limit = 6) {
  const centralLimit = Math.ceil(limit / 2);
  const localLimit = limit - centralLimit;
  return [
    ...pickRelated(publicServices.centralServices, item, centralLimit),
    ...pickRelated(publicServices.localServices, item, localLimit),
  ].slice(0, limit);
}
