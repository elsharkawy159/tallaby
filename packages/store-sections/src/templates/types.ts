/** Code-defined storefront templates (Claude Design "Storefront Templates", 2026-10-19). No React here. */
import type { SiteConfig } from "../config/schema";
import type { Localized } from "../core/types";
import type { Design } from "../designs/builder";
import type { ProductPageSpec } from "./_product-page";
import type { TemplateStyle } from "./traits";

/**
 * A preview catalog: what the templates gallery shows instead of the
 * seller's products (same shape as the editor's catalog). Preview only.
 */
export type TemplateDemo = {
  store: { name: Localized; description: Localized };
  categories: { id: string; name: { ar: string; en: string }; image: string | null; productCount: number }[];
  products: {
    id: string;
    title: { ar: string; en: string };
    slug: string;
    image: string | null;
    price: number | null;
    compareAtPrice: number | null;
    isFeatured: boolean;
    categoryId: string;
    inStock: boolean;
    createdAt: string;
    rating: number | null;
    sold90: number;
    sold14: number;
    /** The product page preview's description (default: a generic line). Preview only. */
    description?: Localized;
    /** The product page preview's options, one chip each (sizes 36…45). Preview only. */
    variants?: readonly Localized[];
  }[];
};

export type TemplateDefinition = {
  /** `templates.key`. */
  key: string;
  /** `template_versions.version` the seed migration writes. */
  version: number;
  /** The default template (`templates.is_default`): what a new store starts from. At most one. */
  isDefault?: boolean;
  /** Its folder under `templates/` when not named after the key. */
  folder?: string;
  name: Localized;
  description: Localized;
  /** `templates.category` (a store industry id). */
  category: string;
  /**
   * Its look, main one first (1–2; AI store builder v2 §5): what the
   * builder's suggestions match a seller's style words against, and keep
   * apart (no two suggestions share a main style). Tone and home needs are
   * computed (`./traits.ts`), never written by hand.
   */
  style: readonly TemplateStyle[];
  sortOrder: number;
  /** What the version changes, for `template_versions.changelog`. */
  changelog: string;
  /** Colour swatches for the gallery card. */
  palette: readonly string[];
  config: () => SiteConfig;
  /** Page names in both languages by slug (the config holds only the Arabic one). */
  pageNames: Readonly<Record<string, Localized>>;
  demo: TemplateDemo;
  /** The template's own section designs (not in the section library). */
  designs: readonly Design[];
  /** The resolved product page spec (library-built templates only): defaults filled in, `surface` always set. */
  productPageSpec?: Readonly<ProductPageSpec>;
  /** The niche id of the edition it was built with (`applyEdition`, `./editions`); unset for a template's own content. */
  edition?: string;
};
