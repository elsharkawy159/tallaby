import { routing } from "@/i18n/routing";
import type { TemplateCategory } from "./templates.data";

/**
 * The template gallery lists the active templates of the `templates` table
 * with a valid current version (owner, 2026-10-19). A card shows the
 * template's thumbnail, or a live render of its home page when it has none
 * (/template-preview, components/marketing/templates/template-live-thumb).
 */

/** A page of a template version, with its name in both languages when the code template has one. */
export type CatalogPage = { slug: string; isHome: boolean; name: string; names?: { ar?: string; en?: string } };

export type CatalogTemplate = {
  key: string;
  name: unknown;
  description: unknown;
  category: string;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  isDefault: boolean;
  isPremium: boolean;
  price: string | null;
  sortOrder: number;
  /** Colour swatches (code templates only). */
  palette: readonly string[];
  pages: CatalogPage[];
};

export type GalleryPage = { slug: string; isHome: boolean; name: string };

export type GalleryEntry = {
  /** Route id: the template key. */
  id: string;
  category: Exclude<TemplateCategory, "all">;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  /** Price in EGP for premium templates, null when free. */
  price: number | null;
  palette: string[];
  /** Home page first. */
  pages: GalleryPage[];
  /** The code catalog's order: a higher number is a newer template. */
  sortOrder: number;
};

/** Template categories (store industry ids) → gallery filter codes; anything else is "ge". */
const CATEGORY_CODES: Record<string, Exclude<TemplateCategory, "all">> = {
  general: "ge",
  electronics: "el",
  fashion: "fa",
  "shoes-bags": "fa",
  beauty: "be",
  home: "ho",
  kitchen: "ho",
  food: "fo",
  sweets: "fo",
  jewelry: "jw",
  kids: "ki",
  sports: "sp",
  auto: "au",
  accessories: "ac",
  "mobile-accessories": "ac",
};

export function categoryCode(category: string): Exclude<TemplateCategory, "all"> {
  return CATEGORY_CODES[category] ?? "ge";
}

/** `{ ar, en }` JSON → the locale's text, falling back to the other language. */
export function localized(value: unknown, locale: string): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (!value || typeof value !== "object") return null;
  const map = value as Record<string, unknown>;
  const pick = (l: string) => (typeof map[l] === "string" ? (map[l] as string).trim() : "");
  return pick(locale) || pick(locale === "ar" ? "en" : "ar") || null;
}

/** Only https URLs reach an href or an image. */
function safeUrl(url: string | null | undefined): string | null {
  const value = url?.trim();
  return value && /^https:\/\//i.test(value) ? value : null;
}

function priceOf(row: CatalogTemplate): number | null {
  if (!row.isPremium || row.price == null) return null;
  const n = Number(row.price);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** The preview frame of a template page (app/[locale]/(template-preview)/template-preview). */
export function templateFrameSrc(locale: string, key: string, slug?: string, thumb = false): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const path = `${prefix}/template-preview/${encodeURIComponent(key)}${slug ? `/${encodeURIComponent(slug)}` : ""}`;
  return thumb ? `${path}?thumb=1` : path;
}

export function buildGallery(rows: readonly CatalogTemplate[], locale: string): GalleryEntry[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => Number(b.row.isDefault) - Number(a.row.isDefault) || a.row.sortOrder - b.row.sortOrder || a.index - b.index)
    .map(({ row }) => ({
      id: row.key,
      category: categoryCode(row.category),
      name: localized(row.name, locale) ?? row.key,
      description: localized(row.description, locale),
      thumbnailUrl: safeUrl(row.thumbnailUrl),
      previewUrl: safeUrl(row.previewUrl),
      price: priceOf(row),
      palette: [...row.palette],
      pages: [...row.pages]
        .sort((a, b) => Number(b.isHome) - Number(a.isHome))
        .map((page) => ({ slug: page.slug, isHome: page.isHome, name: localized(page.names, locale) ?? page.name })),
      sortOrder: row.sortOrder,
    }));
}

/** A card's picture: the template key and thumbnail, small enough to hand to a client component. */
export type CoverPick = { id: string; thumbnailUrl: string | null };

export type CategoryCard = { category: Exclude<TemplateCategory, "all">; count: number; covers: CoverPick[] };

/**
 * The templates a card may be shown by (one is picked at random per visit):
 * all but the newest (highest sort order), since the newest ones of a niche
 * look alike (owner, 2026-10-29). A lone template is kept.
 */
function coverPool(entries: readonly GalleryEntry[]): CoverPick[] {
  const newest = entries.reduce<GalleryEntry | undefined>((best, e) => (!best || e.sortOrder > best.sortOrder ? e : best), undefined);
  const pool = entries.length > 1 ? entries.filter((e) => e !== newest) : entries;
  return pool.map((e) => ({ id: e.id, thumbnailUrl: e.thumbnailUrl }));
}

/**
 * The home page's category cards: one per `featured` code that has templates,
 * plus a "more" card for every other template. `more` is null when nothing is left.
 */
export function categoryShowcase(
  entries: readonly GalleryEntry[],
  featured: readonly Exclude<TemplateCategory, "all">[],
): { cards: CategoryCard[]; more: { count: number; covers: CoverPick[] } | null } {
  const cards = featured.flatMap((category) => {
    const matching = entries.filter((e) => e.category === category);
    return matching.length ? [{ category, count: matching.length, covers: coverPool(matching) }] : [];
  });
  const rest = entries.filter((e) => !featured.includes(e.category));
  return { cards, more: rest.length ? { count: rest.length, covers: coverPool(rest) } : null };
}
