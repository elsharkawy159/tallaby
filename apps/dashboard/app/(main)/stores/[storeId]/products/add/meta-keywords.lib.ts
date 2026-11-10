/** Search keywords per language (product_translations.meta_keywords). */
export const META_KEYWORDS_MAX = 15
export const META_KEYWORD_MAX_LENGTH = 40

/**
 * Trimmed and single-spaced, without blanks or case-insensitive repeats,
 * capped to the limits above. Runs on submit and again in the server action.
 */
export function cleanKeywords (keywords: readonly string[] | null | undefined): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of keywords ?? []) {
    if (typeof raw !== "string") continue
    const keyword = raw.trim().replace(/\s+/g, " ").slice(0, META_KEYWORD_MAX_LENGTH).trim()
    const key = keyword.toLowerCase()
    if (!keyword || seen.has(key)) continue
    seen.add(key)
    out.push(keyword)
    if (out.length === META_KEYWORDS_MAX) break
  }
  return out
}
