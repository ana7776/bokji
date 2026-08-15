import { defineCollection, z } from "astro:content";

const info = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().min(50).max(140),
    publishedAt: z.string(),
    updatedAt: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
    featured: z.boolean().default(false),
    // 대표 글은 역할이 겹치지 않도록 입문 / 실전 / 문제 해결 하나씩만 지정합니다.
    featuredRole: z.enum(["입문", "실전", "문제 해결"]).optional(),
    featuredNote: z.string().optional(),
  }),
});

export const collections = { info };
