import { siteConfig } from "@/config/site";
import rawItems from "@/data/items.json";

export interface CheckItem {
  id: string;
  category: string;
  categoryLabel: string;
  subCategory: string;
  subCategoryLabel: string;
  title: string;
  description: string;
  keywords: string[];
  summary: [string, string][];
  formula: string;
  relatedTags: string[];
  inputGuide?: [string, string][];
  deductionGuide?: [string, string][];
  checkNotes?: string[];
  useCases?: string[];
  calculationStandards?: [string, string][];
  faq?: [string, string][];
  sourceReferences?: { label: string; url: string; note: string }[];
}

export const checkItems = rawItems as CheckItem[];

export function itemPath(item: CheckItem) {
  return `/${siteConfig.dataRoot}/${item.category}/${item.subCategory}/${item.id}/`;
}

export function categoryPath(category: string) {
  return `/${siteConfig.dataRoot}/${category}/`;
}

export function subCategoryPath(category: string, subCategory: string) {
  return `/${siteConfig.dataRoot}/${category}/${subCategory}/`;
}

export function uniqueCategories() {
  const map = new Map<string, { category: string; label: string; count: number }>();
  for (const item of checkItems) {
    const current = map.get(item.category);
    map.set(item.category, {
      category: item.category,
      label: item.categoryLabel,
      count: (current?.count ?? 0) + 1,
    });
  }
  return [...map.values()];
}

export function relatedItems(item: CheckItem, limit = 4) {
  return checkItems
    .filter((candidate) => candidate.id !== item.id)
    .map((candidate) => ({
      item: candidate,
      score:
        (candidate.category === item.category ? 3 : 0) +
        (candidate.subCategory === item.subCategory ? 2 : 0) +
        candidate.relatedTags.filter((tag) => item.relatedTags.includes(tag)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item);
}

export function absoluteUrl(path: string) {
  return new URL(path, siteConfig.domain).toString();
}
