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
    }));
}
