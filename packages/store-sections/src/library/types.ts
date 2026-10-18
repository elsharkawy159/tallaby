import type { DataNeed, Localized } from "../core/types";

/** The 15 groups of the section library (Add panel), in display order. */
export const LIBRARY_CATEGORY_IDS = [
  "headers",
  "hero",
  "categories",
  "products",
  "product-cards",
  "brands",
  "promotions",
  "features",
  "testimonials",
  "about",
  "statistics",
  "content",
  "forms",
  "contact",
  "footers",
] as const;
export type LibraryCategoryId = (typeof LIBRARY_CATEGORY_IDS)[number];

export type LibrarySubcategory = { id: string; name: Localized };

export type LibraryCategory = {
  id: LibraryCategoryId;
  name: Localized;
  description: Localized;
  /** Icon name the editor maps to its own icon set. */
  icon: string;
  subcategories: readonly LibrarySubcategory[];
};

/**
 * `static`: seller content only. `dynamic`: draws store data (products,
 * reviews…). `interactive`: has behaviour on the storefront (carousel,
 * countdown, form, accordion).
 */
export type PresetCapability = "static" | "dynamic" | "interactive";

/**
 * A starting layout in the library: a registered section plus the props and
 * style it starts with. Presets are not a second renderer: inserting one
 * creates an ordinary instance of `sectionId`, editable like any other.
 */
export type SectionPreset = {
  /** Stable id, `<category>.<name>`. */
  id: string;
  sectionId: string;
  category: LibraryCategoryId;
  subcategory: string;
  name: Localized;
  description: Localized;
  /** Extra search words (both languages). */
  keywords?: readonly string[];
  capabilities: readonly PresetCapability[];
  /** Store data the preset draws; the library shows it and empty states use it. */
  dataNeeds?: readonly DataNeed[];
  /** Overlaid on the section's `defaultProps`. Must be valid for its schema (tested). */
  props?: Record<string, unknown>;
  /** Initial `instance.style` (e.g. `{ shell: { scheme: "muted" } }`). */
  style?: Record<string, unknown>;
  /**
   * `card` presets are product-card designs: they set `cardVariant` on the
   * selected product section instead of inserting a new one (when one is selected).
   */
  kind?: "section" | "card";
};
