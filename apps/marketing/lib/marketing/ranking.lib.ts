import type { LucideIcon } from "lucide-react";

/**
 * A "best X" list article (components/marketing/blog-ranking). Not routed yet:
 * it needs real content first. Every field that isn't filled is left out of
 * the page, so a platform with no sourced price or rating shows neither.
 */
export type RankingItem = {
  id: string;
  name: string;
  /** Tallaby's own wordmark instead of the name. */
  logo?: string;
  pick?: boolean;
  bestFor?: string;
  price?: string;
  /** 0 to 5, only from a real, stated scoring. */
  rating?: number;
  description?: string;
  pros?: string[];
  cons?: string[];
  /** A comparison page, when one is public. */
  compareHref?: string;
};

export type RankingArticle = {
  slug: string;
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  readMinutes: number;
  /** Real image in public/ or an allowed host; no cover means no cover block. */
  cover?: string;
  intro: string;
  method: string;
  criteria: { icon: LucideIcon; title: string; body: string }[];
  listTitle: string;
  /** The call to action appears after this many items. */
  ctaAfter: number;
  items: RankingItem[];
  chooseLead: string;
  checklist: { title: string; body: string }[];
  faq: { q: string; a: string }[];
  related?: { href: string; title: string; category: string; image: string }[];
};

/** What the on-page contents list links to, in order. */
export function rankingToc(article: Pick<RankingArticle, "listTitle" | "items">, labels: { summary: string; method: string; choose: string; faq: string }) {
  return [
    { id: "summary", title: labels.summary },
    { id: "method", title: labels.method },
    { id: "list", title: article.listTitle },
    ...article.items.map((item, i) => ({ id: item.id, title: item.name, rank: i + 1 })),
    { id: "choose", title: labels.choose },
    { id: "faq", title: labels.faq },
  ];
}

/** ItemList data for search engines, from the same order as the page. */
export function rankingItemList(article: Pick<RankingArticle, "title" | "items">, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: article.title,
    itemListElement: article.items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, url: `${url}#${item.id}` })),
  };
}
