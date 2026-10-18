/**
 * Section contract (PLAN.md P4-02). The subset of the Valorcy reference
 * `SectionDefinition` that the ported editor panels read (`defaultProps`,
 * `propDefinitions`, `itemCollections`, `version`, `migrateProps`,
 * `Component`), without the AI/planner metadata, plus AR/EN labels.
 *
 * Section components are presentational: no hooks, no data fetching, no
 * imports from either app. Everything app-specific (links, images, prices,
 * the cart, catalog data) arrives through `RenderContext`, so the same
 * component renders on the storefront (server) and in the editor (client).
 */
import type { ComponentType, ReactNode } from "react";
import type { z } from "zod";
import type { SectionInstance, SiteLocale } from "../config/schema";

export type Localized = { ar: string; en: string };

export type PropFieldType =
  | "text"
  | "textarea"
  | "url"
  | "image"
  | "number"
  | "select"
  | "switch"
  | "color"
  /** One product of this store (P4-07 picker). */
  | "product"
  /** Several products of this store, ordered. */
  | "products"
  /** One category of this store's catalog. */
  | "category"
  /** One form of this store (`store_forms`, P4-10 picker). */
  | "form";

export interface PropDefinition {
  key: string;
  label: Localized;
  type: PropFieldType;
  placeholder?: Localized;
  options?: { value: string; label: Localized }[];
  min?: number;
  max?: number;
  maxLength?: number;
  /** Text fields shown per locale (stored in `translations[locale]` for non-default locales). */
  translatable?: boolean;
  group?: "content" | "layout" | "appearance";
}

export interface ItemCollectionDefinition {
  key: string;
  label: Localized;
  minItems?: number;
  maxItems?: number;
  newItemTemplate: () => Record<string, unknown>;
  itemPropDefinitions: PropDefinition[];
}

export const SECTION_CATEGORIES = [
  "header",
  "hero",
  "commerce",
  "content",
  "social-proof",
  "blog",
  "media",
  "contact",
  "footer",
] as const;
export type SectionCategory = (typeof SECTION_CATEGORIES)[number];

/** What a commerce section needs from the catalog; resolved by the host app (P4-07, P5-02). */
export type CatalogQuery =
  | {
      kind: "products";
      source: "all" | "newest" | "featured" | "category" | "selected";
      categoryId?: string | null;
      productIds?: string[];
      limit: number;
    }
  | { kind: "categories"; limit: number };

/**
 * Published CMS items a content section needs (blog posts are the system
 * collection `blog`), resolved by the host from the store of the request
 * (P4-16, P4-11). Never drafts or scheduled items.
 */
export type ContentQuery = {
  /** Collection slug of this store ("blog" for the blog). */
  collection: string;
  limit: number;
  /** One item by slug (CMS item section). */
  slug?: string | null;
};

export type ContentItemSummary = {
  id: string;
  title: string;
  href: string;
  excerpt?: string | null;
  image?: string | null;
  /** ISO date. */
  publishedAt?: string | null;
  tags?: string[];
  authorName?: string | null;
  readingMinutes?: number | null;
};

export type ProductSummary = {
  id: string;
  title: string;
  href: string;
  image: string | null;
  price: number | null;
  compareAtPrice?: number | null;
  rating?: number | null;
  inStock?: boolean;
};

export type CategorySummary = {
  id: string;
  key: string;
  name: string;
  href: string;
  image: string | null;
  productCount?: number;
};

export type StoreProfile = {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  /** Public home URL of this store. */
  url: string;
  contact?: { phone?: string | null; email?: string | null; whatsapp?: string | null; address?: string | null };
  social?: { platform: string; url: string }[];
  /** Which policy pages exist (links are built by the host). */
  policies?: { key: "return" | "shipping" | "privacy" | "terms"; href: string }[];
};

export type NavPage = { name: string; href: string; isHome: boolean };

/** A field of a store form, as the storefront draws it (`@workspace/lib/store-forms` validates the full model). */
export type PublicFormField = {
  key: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox";
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  width: "full" | "half";
};

/** A form resolved by the host for its own store (P4-10). Empty labels/messages fall back to section copy. */
export type PublicStoreForm = {
  id: string;
  fields: PublicFormField[];
  submitLabel: string;
  successMessage: string;
};

export type LinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
};

export interface RenderContext {
  /** `edit` in the dashboard canvas, `public` on the storefront. */
  mode: "edit" | "public";
  locale: SiteLocale;
  dir: "rtl" | "ltr";
  store: StoreProfile;
  pages: NavPage[];
  /** Products per section instance id, and the store's categories. */
  catalog: { products: Record<string, ProductSummary[]>; categories: CategorySummary[] };
  /** Published blog/CMS items per section instance id (from `contentQuery`). */
  content?: { items: Record<string, ContentItemSummary[]> };
  /** Formats an ISO date for the page locale (defaults to the date part). */
  formatDate?: (iso: string) => string;
  Link: ComponentType<LinkProps>;
  /** Resolves a stored image (storage path or URL) to a URL. */
  imageUrl: (src: string | null | undefined) => string | null;
  formatPrice: (amount: number) => string;
  /** Host-provided interactive pieces (the storefront cart, or editor placeholders). */
  renderCartButton?: () => ReactNode;
  renderAddToCart?: (product: ProductSummary) => ReactNode;
  /** Forms of this store by id, resolved server-side by the host (P4-10). Foreign ids are never present. */
  forms?: Record<string, PublicStoreForm>;
  /** The interactive storefront form; without it (editor canvas) a static preview is drawn. */
  renderForm?: (form: PublicStoreForm, instanceId: string) => ReactNode;
  /** Renders a Tallaby Classic part with the host's own components (P4-03). */
  renderClassic?: (part: "classic-header" | "classic-hero" | "classic-categories" | "classic-catalog" | "classic-footer", props: Record<string, unknown>) => ReactNode;
}

export type SectionRenderProps<P> = {
  instance: SectionInstance;
  props: P;
  ctx: RenderContext;
};

export interface SectionDefinition<P extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  version: number;
  category: SectionCategory;
  displayName: Localized;
  description: Localized;
  /** Validates (and fills defaults for) stored props before rendering. */
  propsSchema: z.ZodType<P>;
  defaultProps: P;
  propDefinitions: PropDefinition[];
  itemCollections?: ItemCollectionDefinition[];
  migrateProps?: (oldProps: Record<string, unknown>, fromVersion: number) => Record<string, unknown>;
  /** Catalog data this instance needs, given its (validated) props. */
  catalogQuery?: (props: P) => CatalogQuery | null;
  /** The `store_forms` id this instance shows, given its (validated) props (P4-10). */
  formRef?: (props: P) => string | null;
  /** Published blog/CMS items this instance needs, given its (validated) props. */
  contentQuery?: (props: P) => ContentQuery | null;
  /** Only usable as the site header or footer, not inside a page. */
  chrome?: "header" | "footer";
  Component: ComponentType<SectionRenderProps<P>>;
}

// Definitions are stored heterogeneously; the renderer validates props first.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySectionDefinition = SectionDefinition<any>;
