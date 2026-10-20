import { RESERVED_PAGE_SLUGS } from "@workspace/store-sections";
import type { WebsitePageRow, WebsitePageSeo } from "../website.types";

/**
 * Pure helpers for Website › Pages (PLAN.md P4-17). The server actions
 * (editor.server.ts → @workspace/lib/store-sites/server) enforce the same
 * rules; these only give instant feedback in the form.
 */

/** Same format as the server: lowercase letters, numbers and dashes, 1–64 chars. */
const PAGE_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export type SlugProblem = "invalidSlug" | "reservedSlug" | "slugTaken";

/** A URL-safe slug from a page name (Latin letters and digits only; Arabic names give ""). */
export function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
}

export function checkSlug(slug: string, pages: Pick<WebsitePageRow, "id" | "slug">[], selfId?: string): SlugProblem | null {
  if (!PAGE_SLUG_RE.test(slug)) return "invalidSlug";
  if ((RESERVED_PAGE_SLUGS as readonly string[]).includes(slug)) return "reservedSlug";
  if (pages.some((page) => page.slug === slug && page.id !== selfId)) return "slugTaken";
  return null;
}

/** Drops empty fields so the server's SEO schema (URL check etc.) only sees real values. */
export function cleanSeo(seo: { title: string; description: string; ogImage: string; noindex: boolean }): WebsitePageSeo {
  const out: WebsitePageSeo = {};
  if (seo.title.trim()) out.title = seo.title.trim();
  if (seo.description.trim()) out.description = seo.description.trim();
  if (seo.ogImage.trim()) out.ogImage = seo.ogImage.trim();
  if (seo.noindex) out.noindex = true;
  return out;
}

/** `ids` with the item at `index` moved one step up (-1) or down (+1). */
export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

export function pageName(name: { ar?: string; en?: string }, locale: string): string {
  return (locale === "en" ? name.en || name.ar : name.ar || name.en) || "";
}
