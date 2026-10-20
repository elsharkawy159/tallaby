import type { DataNeed, Localized } from "../core/types";
import type { NodeTemplate } from "../elements/tree";

/**
 * The 20 groups of the section library (Add panel), in display order: the
 * categories of the Claude Design section library (2026-10-19).
 */
export const LIBRARY_CATEGORY_IDS = [
  "headers",
  "hero",
  "categories",
  "products",
  "promotions",
  "features",
  "statistics",
  "image-text",
  "video",
  "gallery",
  "brands",
  "testimonials",
  "faq",
  "blog",
  "newsletter",
  "contact",
  "rich-text",
  "page-header",
  "product-page",
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
  /**
   * A section design (`designs/`): inserting the preset builds that design's
   * element tree. Design presets use `sectionId: "custom-section"`.
   */
  designId?: string;
  /**
   * A stored element tree in slot form (`library_sections.tree`, Task 10):
   * inserting the preset builds this tree, its photo slots resolved for the
   * store's industry. Takes precedence over `designId`.
   */
  tree?: NodeTemplate;
  /** `library_sections.key` (the design id): names the tree in an instance's `source`. */
  designKey?: string;
  /** `library_sections.version` of `tree` (1 when unset). */
  version?: number;
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
