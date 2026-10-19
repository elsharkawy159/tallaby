/**
 * Blog index. Titles and excerpts live in messages (`blog.posts.<id>`). Only
 * `pricing-products` has a full article so far; the other posts render their
 * excerpt until their articles are written.
 */

export const BLOG_CATEGORIES = ["all", "guides", "growth", "stories", "payments", "product"] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export type BlogPost = {
  id: string;
  category: Exclude<BlogCategory, "all">;
  image: string;
  /** ISO date. */
  date: string;
  minutes: number;
  hasArticle?: boolean;
};

/** Newest first; the first post is featured on the index. */
export const BLOG_POSTS: BlogPost[] = [
  { id: "pricing-products", category: "guides", image: "/banner3.jpg", date: "2026-10-12", minutes: 7, hasArticle: true },
  { id: "first-100-orders", category: "growth", image: "/banner5.jpg", date: "2026-10-05", minutes: 6 },
  { id: "phone-photos", category: "guides", image: "/banner2.jpg", date: "2026-09-28", minutes: 5 },
  { id: "dms-to-store", category: "stories", image: "/banner4.jpg", date: "2026-09-20", minutes: 4 },
  { id: "cod-vs-online", category: "payments", image: "/banner6.jpg", date: "2026-09-14", minutes: 5 },
  { id: "seo-basics", category: "growth", image: "/banner.jpg", date: "2026-09-06", minutes: 6 },
  { id: "discount-codes", category: "product", image: "/cosmetics.jpg", date: "2026-08-30", minutes: 2 },
];

export function findPost(id: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.id === id);
}
