import type { StoreTemplate, TemplateCategory } from "./templates.data";

/**
 * The template gallery joins the hand-made previews (templates.data.ts) with
 * the installable templates in the `templates` table (owner, 2026-10-19). A
 * preview whose `dbKey` is active is "available"; the other previews are
 * "soon". Active templates without a preview get a card from their own
 * thumbnail, name and description.
 */

export type CatalogTemplate = {
  key: string;
  name: unknown;
  description: unknown;
  category: string;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  isPremium: boolean;
  price: string | null;
  sortOrder: number;
};

export type GalleryEntry = {
  /** Route id: the preview id, or the template key when there is no preview. */
  id: string;
  category: Exclude<TemplateCategory, "all">;
  status: "available" | "soon";
  preview: StoreTemplate | null;
  /** Localized name and description from the database (null: use the preview's copy in messages). */
  name: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  /** Price in EGP for premium templates, null when free. */
  price: number | null;
};

const CATEGORY_CODES: Record<string, Exclude<TemplateCategory, "all">> = {
  general: "ge",
  electronics: "el",
  fashion: "fa",
  beauty: "be",
  home: "ho",
  accessories: "ac",
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

type Ranked = { entry: GalleryEntry; order: number };

export function buildGallery(previews: readonly StoreTemplate[], rows: readonly CatalogTemplate[], locale: string): GalleryEntry[] {
  const byKey = new Map(rows.map((row) => [row.key, row]));
  const previewKeys = new Set(previews.map((p) => p.dbKey).filter(Boolean));
  const previewIds = new Set<string>(previews.map((p) => p.id));

  const fromPreviews = previews.map((preview): Ranked => {
    const row = preview.dbKey ? byKey.get(preview.dbKey) : undefined;
    return {
      order: row?.sortOrder ?? Number.MAX_SAFE_INTEGER,
      entry: {
        id: preview.id,
        category: preview.category,
        status: row ? "available" : "soon",
        preview,
        name: null,
        description: null,
        thumbnailUrl: safeUrl(row?.thumbnailUrl),
        previewUrl: safeUrl(row?.previewUrl),
        price: row ? priceOf(row) : null,
      },
    };
  });

  const fromDb = rows
    .filter((row) => !previewKeys.has(row.key) && !previewIds.has(row.key) && safeUrl(row.thumbnailUrl))
    .map(
      (row): Ranked => ({
        order: row.sortOrder,
        entry: {
          id: row.key,
          category: categoryCode(row.category),
          status: "available",
          preview: null,
          name: localized(row.name, locale) ?? row.key,
          description: localized(row.description, locale),
          thumbnailUrl: safeUrl(row.thumbnailUrl),
          previewUrl: safeUrl(row.previewUrl),
          price: priceOf(row),
        },
      }),
    );

  const rank = (e: GalleryEntry) => (e.status === "available" ? 0 : 1);
  return [...fromPreviews, ...fromDb]
    .map((ranked, index) => ({ ...ranked, index }))
    .sort((a, b) => rank(a.entry) - rank(b.entry) || a.order - b.order || a.index - b.index)
    .map((ranked) => ranked.entry);
}
