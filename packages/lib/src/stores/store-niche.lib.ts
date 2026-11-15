/**
 * A store's niche (owner, 2026-11-15): what it sells most inside its
 * industry (Fashion › T-shirts), a `NICHES` id saved in
 * `stores.settings.niche` (no migration). The seller picks it at signup,
 * when creating a store or in Store settings › General; the AI builder saves
 * its own reading. It only orders the template galleries; until a store has
 * one, `matchNiche` guesses it from the store's category and name.
 *
 * A niche is only ever kept with its own industry: a niche of another
 * industry (or an unknown id) is dropped, never an error. Pure; no database
 * and no React here. `@workspace/store-sections/niches` is plain data, so
 * this file stays small enough for any caller.
 */
import { z } from "zod";
import { NICHE_INDUSTRY_NAMES, getNiche } from "@workspace/store-sections/niches";
import { matchNiche } from "@workspace/store-sections/niche-match";

/** A niche id's shape (the `NICHES` ids are lower-case slugs). */
export const STORE_NICHE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;

/** A known niche id. */
export const storeNicheIdSchema = z
  .string()
  .trim()
  .regex(STORE_NICHE_ID_PATTERN)
  .refine((id) => getNiche(id) !== null, "unknown_niche");

const norm = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

/**
 * The industry id a saved store category names (today's names first, then
 * earlier ones), like `findIndustry` in @workspace/store-editor, which this
 * package cannot import. Null for a free-text category.
 */
export function industryOfCategory(category: { en?: string | null; ar?: string | null }): string | null {
  const en = norm(category.en);
  const ar = norm(category.ar);
  const entries = Object.entries(NICHE_INDUSTRY_NAMES);
  const current = entries.find(([, names]) => (en !== "" && norm(names[0]) === en) || (ar !== "" && norm(names[1]) === ar));
  if (current) return current[0];
  const earlier = entries.find(([, names]) => names.slice(2).some((name) => norm(name) !== "" && (norm(name) === en || norm(name) === ar)));
  return earlier?.[0] ?? null;
}

/** The niche id when it is a known niche of this industry, else null (dropped). */
export function nicheForIndustry(nicheId: unknown, industryId: string | null | undefined): string | null {
  if (typeof nicheId !== "string" || !industryId) return null;
  const niche = getNiche(nicheId.trim());
  return niche && niche.industry === industryId ? niche.id : null;
}

/** The niche saved in `stores.settings`, when it is a known niche id; else null. */
export function parseStoreNiche(settings: unknown): string | null {
  if (!settings || typeof settings !== "object") return null;
  const value = (settings as Record<string, unknown>).niche;
  return typeof value === "string" ? (getNiche(value)?.id ?? null) : null;
}

export type StoreNicheSource = {
  settings: unknown;
  storeCategory: string | null;
  storeCategoryAr: string | null;
  name?: string | null;
};

/**
 * The niche the galleries sort by: the saved one when it belongs to the
 * store's industry, else today's guess (`matchNiche` of the category and
 * name), else null.
 */
export function effectiveStoreNiche(store: StoreNicheSource, industryId: string | null | undefined): string | null {
  const saved = nicheForIndustry(parseStoreNiche(store.settings), industryId);
  if (saved) return saved;
  return (
    matchNiche({
      category: { en: store.storeCategory, ar: store.storeCategoryAr },
      name: store.name ?? null,
      industryId: industryId ?? null,
    })?.nicheId ?? null
  );
}
