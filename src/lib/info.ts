import type { CollectionEntry } from "astro:content";

export type InfoPost = CollectionEntry<"info">;

export function postPath(post: InfoPost) {
  return `/info/${post.slug}/`;
}

export function relatedPostsForTags(posts: InfoPost[], tags: string[], limit = 4) {
  return posts
    .map((post) => ({
      post,
      score: post.data.tags.filter((tag) => tags.includes(tag)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post);
}
