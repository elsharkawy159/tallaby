/**
 * SEO keywords (Website › SEO, 2026-11-09): the store's and each page's
 * `<meta name="keywords">`. Shared by the page SEO schema here and the store
 * SEO schema in @workspace/lib/stores. Only zod: no React, no database.
 */
import { z } from "zod";

/** At most this many keywords per store or page. */
export const SEO_KEYWORDS_MAX = 15;
/** Each keyword at most this many characters. */
export const SEO_KEYWORD_MAX_LENGTH = 50;

/** Commas (Latin and Arabic) and semicolons separate keywords typed or pasted together. */
const SEPARATORS = /[,،;؛\n]/;

/**
 * Keywords as saved: split on commas, trimmed, inner spaces collapsed, empty
 * ones dropped and duplicates (any letter case) removed, first one kept.
 */
export function normalizeSeoKeywords(input: readonly unknown[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of input) {
    if (typeof item !== "string") continue;
    for (const part of item.split(SEPARATORS)) {
      const keyword = part.replace(/\s+/g, " ").trim();
      const key = keyword.toLocaleLowerCase();
      if (!keyword || seen.has(key)) continue;
      seen.add(key);
      out.push(keyword);
    }
  }
  return out;
}

/**
 * The keywords a seller saves. Refuses more than SEO_KEYWORDS_MAX keywords or
 * one longer than SEO_KEYWORD_MAX_LENGTH (after cleaning), so nothing is cut
 * silently.
 */
export const seoKeywordsSchema = z
  .array(z.string().max(500))
  .max(100)
  .transform(normalizeSeoKeywords)
  .pipe(z.array(z.string().max(SEO_KEYWORD_MAX_LENGTH)).max(SEO_KEYWORDS_MAX));

/**
 * Stored keywords read for rendering: anything unusable is dropped (a
 * non-array, a non-string, one too long) and the list is capped, never thrown.
 */
export function readSeoKeywords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return normalizeSeoKeywords(raw)
    .filter((keyword) => keyword.length <= SEO_KEYWORD_MAX_LENGTH)
    .slice(0, SEO_KEYWORDS_MAX);
}
