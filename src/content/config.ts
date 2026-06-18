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
  }),
});

export const collections = { info };
