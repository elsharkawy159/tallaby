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
import type { SlotDefinition } from "./slots";

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
  | "form"
  /** Several categories of this store's catalog, ordered. */
  | "categories"
  /** One coupon of this seller (campaign banners). */
  | "coupon"
  /** A date and time (ISO), e.g. a campaign end. */
  | "datetime"
  /** A visual picker of layouts or card designs; options carry a `diagram` key. */
  | "layout"
  /** A video link (YouTube, Vimeo, TikTok, Instagram, Facebook, a video file); the editor checks it. */
  | "video";

/** Small editor diagrams for `layout` options (drawn by the editor). */
export type LayoutDiagram = string;

export interface PropDefinition {
  key: string;
  label: Localized;
  type: PropFieldType;
  placeholder?: Localized;
  /** One line under the field explaining it. */
  hint?: Localized;
  options?: { value: string; label: Localized; diagram?: LayoutDiagram }[];
  min?: number;
  max?: number;
  maxLength?: number;
  /** Text fields shown per locale (stored in `translations[locale]` for non-default locales). */
  translatable?: boolean;
  /**
   * `data` fields (source, filters, picks, sort, limit) sit apart from the
   * design fields in the inspector, so changing one never resets the other.
   */
  group?: "content" | "layout" | "appearance" | "data" | "advanced";
  /** Show the field only while another prop has one of these values (e.g. `categoryId` when `source` is `category`). */
  showWhen?: { key: string; equals: readonly (string | boolean)[] };
  /** Hide the field while another prop has one of these values (e.g. thumbnail options while autoplay is on). */
  hideWhen?: { key: string; equals: readonly (string | boolean)[] };
}

/** Whether a field applies to these props (its `showWhen` holds and its `hideWhen` does not). */
export function isFieldShown(prop: PropDefinition, values: Record<string, unknown>): boolean {
  if (prop.showWhen && !prop.showWhen.equals.includes(values[prop.showWhen.key] as string | boolean)) return false;
  return !(prop.hideWhen && prop.hideWhen.equals.includes(values[prop.hideWhen.key] as string | boolean));
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
  /** Built from elements (P4B-02). */
  "custom",
] as const;
export type SectionCategory = (typeof SECTION_CATEGORIES)[number];

/**
 * Products a section can show. `best-sellers` and `trending` rank by units
 * sold in this store's orders (90 and 14 days); `discounted` keeps products
 * whose list price is above the selling price. Never random.
 */
export const PRODUCT_SOURCES = ["all", "newest", "featured", "category", "selected", "best-sellers", "trending", "discounted", "related"] as const;
export type ProductSource = (typeof PRODUCT_SOURCES)[number];
export const PRODUCT_SORTS = ["default", "newest", "price-asc", "price-desc", "rating"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

/** What a commerce section needs from the catalog; resolved by the host app (P4-07, P5-02). Hosts ignore kinds they don't know. */
export type CatalogQuery =
  | {
      kind: "products";
      source: ProductSource;
      categoryId?: string | null;
      productIds?: string[];
      /** `related`: the product page's current product; it is never in the result, its category's products come first. */
      relatedTo?: { productId: string; categoryId: string | null };
      /** Order after the source has picked; `default` keeps the source's own order. */
      sort?: ProductSort;
      /** Per page when `paginate` is set. */
      limit: number;
      /** Split into pages: the host resolves page `page` (1-based) and reports `catalog.productPages`. */
      paginate?: boolean;
      page?: number;
    }
  | { kind: "categories"; limit: number }
  /** The seller's brand list (`seller_product_brands`, 0068). */
  | { kind: "brands"; limit: number }
  /** Approved customer reviews of this store's products, newest first. */
  | { kind: "reviews"; limit: number; minRating?: number }
  /** One coupon of this seller, for a campaign banner. Inactive or expired gives nothing. */
  | { kind: "coupon"; couponId: string };

/** Store data a section can depend on; drives the editor-only empty states. */
export const DATA_NEEDS = ["products", "categories", "brands", "reviews", "promotions", "articles", "storeInfo", "navigation", "forms"] as const;
export type DataNeed = (typeof DATA_NEEDS)[number];

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

export type ProductVariantDetail = {
  id: string;
  label: string;
  color?: string | null;
  image?: string | null;
  price: number | null;
  compareAtPrice?: number | null;
  quantity: number;
};

/** Everything the product page draws for one product (`ctx.product`). */
export type ProductDetail = ProductSummary & {
  slug: string;
  /** The short description as plain text. */
  description: string | null;
  /**
   * The short description as HTML, sanitised by the host (server) like
   * `contentHtml`; the details element prints it as is. Missing or null: show `description`.
   */
  descriptionHtml?: string | null;
  /**
   * HTML already sanitised by the host (server) when the ProductDetail is
   * built; never seller- or client-supplied raw HTML. `productContent` prints it as is.
   */
  contentHtml: string | null;
  bulletPoints: string[];
  images: string[];
  discountPercent: number | null;
  discountEndsAt: string | null;
  quantity: number;
  directCheckout: boolean;
  /** The seller ticked "show live views" (0111): the storefront draws `renderLiveViews` above the buy box. */
  liveViews?: boolean;
  variants: ProductVariantDetail[];
  reviewCount: number;
  brand: string | null;
  category: { id: string; name: string } | null;
  seller: { name: string; rating: number | null; ratingCount: number; freeDelivery: boolean };
};

/** A host's interactive copy of a product element: the product plus the node's props. */
export type ProductElementHook = (product: ProductDetail, props: Record<string, unknown>) => ReactNode;

export type CategorySummary = {
  id: string;
  key: string;
  name: string;
  href: string;
  image: string | null;
  productCount?: number;
};

export type BrandSummary = { id: string; name: string; logo: string | null; href: string | null };

/** A real, approved customer review. `verified` only when the review row says so. */
export type ReviewSummary = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  authorName: string | null;
  verified: boolean;
  productTitle: string | null;
  productHref: string | null;
  /** ISO date. */
  createdAt: string | null;
};

/** Aggregate of this store's approved reviews. */
export type ReviewStats = { average: number; count: number; distribution: Record<"1" | "2" | "3" | "4" | "5", number> };

/** An active coupon of this seller. */
export type CouponSummary = {
  id: string;
  code: string;
  /** The seller's coupon name, used for kinds a section cannot describe ("buy x get y"). */
  name: string;
  discountType: "percentage" | "fixed" | "free-shipping" | "other";
  discountValue: number;
  /** ISO date; null when the coupon has no end. */
  endsAt: string | null;
};

/** A checkout method key (`cash_on_delivery`, `instapay`…); `label` only for keys the package has no name for. */
export type PaymentMethodSummary = { key: string; label?: string };

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
  /** Payment methods this store's checkout offers (footer `role: "payments"` rows); omitted, those rows stay as authored. */
  paymentMethods?: PaymentMethodSummary[];
};

/**
 * Editor-only data state (never set on the storefront). Lets dynamic
 * sections tell "no records" from "still loading" and "request failed", and
 * lets the host draw the empty-state action (a link to its own management
 * page, or an editor command), so no dashboard route lives in this package.
 */
export type EditorDataContext = {
  /** `error`: the whole store-data request failed. */
  state: "ready" | "refreshing" | "error";
  /** Sources that failed while the rest loaded; their empty sections show the error, not "add records". */
  failed?: readonly DataNeed[];
  /** The primary action of an empty state; `label` is the package's own copy. */
  renderAction: (need: DataNeed, label: string) => ReactNode;
  /** Retries loading store data after an error. */
  renderRetry: (label: string) => ReactNode;
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
  /** Editable-part marker (P4B-01); hosts forward it to the rendered element. */
  "data-part"?: string;
};

/** `<img>` source attributes from the host's image optimizer. */
export type OptimizedImage = { src: string; srcSet?: string; sizes?: string };

/** Typical `sizes` for storefront images, so the browser picks a fitting width. */
export const IMAGE_SIZES = {
  /** Full-width media: section backgrounds. */
  full: "100vw",
  /** Content images and video posters, capped by the page width. */
  content: "(min-width: 1280px) 1280px, 100vw",
  /** Product cards in a grid (2 columns on phones, up to 4 on desktop). */
  card: "(min-width: 1024px) 25vw, 50vw",
} as const;

/** `src`/`srcSet`/`sizes` for a resolved image URL: optimized when the host can, else the URL as is. */
export function imageSource(ctx: Pick<RenderContext, "optimizeImage">, url: string, sizes: string): OptimizedImage {
  return ctx.optimizeImage?.(url, sizes) ?? { src: url };
}

export interface RenderContext {
  /** `edit` in the dashboard canvas, `public` on the storefront. */
  mode: "edit" | "public";
  /** The product a product page shows; seeds the `product` scope of its element trees. */
  product?: ProductDetail;
  /** Store industry; picks the photos for library photo slots (`designs/photo-slots.ts`). Editor only. */
  industry?: string;
  locale: SiteLocale;
  dir: "rtl" | "ltr";
  store: StoreProfile;
  pages: NavPage[];
  /**
   * Products per section instance id, and the store's categories. The other
   * lists are optional so older hosts keep compiling; a missing list means
   * "not resolved", which sections treat like an empty one.
   */
  catalog: {
    products: Record<string, ProductSummary[]>;
    categories: CategorySummary[];
    brands?: BrandSummary[];
    /** Reviews per section instance id. */
    reviews?: Record<string, ReviewSummary[]>;
    reviewStats?: ReviewStats | null;
    /** Coupons by coupon id. */
    coupons?: Record<string, CouponSummary>;
    /** The current page of each paginated product list, by list node id. */
    productPages?: Record<string, { page: number; totalPages: number }>;
    /**
     * Editor only: how many records the store has per need, so an empty
     * section can tell "no products at all" from "none match this filter".
     */
    counts?: Partial<Record<DataNeed, number>>;
  };
  /** Editor only: data state and empty-state actions. */
  editorData?: EditorDataContext;
  /** Published blog/CMS items per section instance id (from `contentQuery`). */
  content?: { items: Record<string, ContentItemSummary[]> };
  /** Formats an ISO date for the page locale (defaults to the date part). */
  formatDate?: (iso: string) => string;
  Link: ComponentType<LinkProps>;
  /** Resolves a stored image (storage path or URL) to a URL. */
  imageUrl: (src: string | null | undefined) => string | null;
  /**
   * Host image optimizer (the storefront's next/image `getImageProps`): a
   * resized `src` plus `srcSet`/`sizes` for a resolved URL, or the URL as is
   * when the host can't optimize it. Without it, images keep their URL.
   */
  optimizeImage?: (url: string, sizes: string) => OptimizedImage;
  formatPrice: (amount: number) => string;
  /** The link to another page of the current page's paginated product lists (`?page=N`). Without it, no page links. */
  productPageHref?: (page: number) => string;
  /** Host-provided interactive pieces (the storefront cart, or editor placeholders). */
  renderCartButton?: () => ReactNode;
  /** The live cart count drawn on a header's cart link (`/cart`); nothing while the cart is empty. */
  renderCartBadge?: () => ReactNode;
  /**
   * A working product search in place of a header search link (a `/products`
   * link holding a search icon): a search box when the link shows
   * `placeholder` text, else a search button. `icon` is the link's own icon,
   * already drawn; `iconFirst` keeps the authored order of icon and text.
   */
  renderSearch?: (search: { placeholder?: string; icon: ReactNode; iconFirst: boolean }) => ReactNode;
  renderAddToCart?: (product: ProductSummary) => ReactNode;
  /**
   * Interactive product page parts (storefront only). Each gets the page's
   * product and the node's props; without one, the element's still rendering
   * is drawn (`elements/product-elements.tsx`).
   */
  renderProductGallery?: ProductElementHook;
  renderProductPrice?: ProductElementHook;
  renderProductStock?: ProductElementHook;
  renderProductVariants?: ProductElementHook;
  renderProductBuyBox?: ProductElementHook;
  renderProductReviews?: ProductElementHook;
  /** The live "N people viewing now" line, drawn above the buy box when the product has `liveViews` (storefront only). */
  renderLiveViews?: (product: ProductDetail) => ReactNode;
  /** Wishlist toggle, when the host supports it on this store. */
  renderWishlistButton?: (product: ProductSummary) => ReactNode;
  /** The header's switch to the store's other language (`languageSwitcher` node). */
  renderLanguageSwitcher?: () => ReactNode;
  /** Customer account link or menu, when the host supports it (`accountLink` node: sign-in for guests). */
  renderAccountButton?: () => ReactNode;
  /**
   * The header's burger menu on phones (`mobileMenu` node): a button that
   * opens a sheet holding `links` (the menu, already drawn). Without it, a
   * still burger is drawn in the editor and a plain dropdown publicly.
   */
  renderMobileMenu?: (menu: { links: ReactNode; title: string }) => ReactNode;
  /** The site's light/dark switch (`themeToggle` node); see `siteDarkCss`. */
  renderThemeToggle?: () => ReactNode;
  /** Editor only: the uploader a `storeLogo` node shows while the store has no logo (`drawChrome` `logoPlaceholder`). */
  renderLogoUploader?: (size: "md" | "lg") => ReactNode;
  /** A live countdown to `endsAt` (ISO). Without it, sections print the end date. */
  renderCountdown?: (endsAt: string, instanceId: string) => ReactNode;
  /** Forms of this store by id, resolved server-side by the host (P4-10). Foreign ids are never present. */
  forms?: Record<string, PublicStoreForm>;
  /** The interactive storefront form; without it (editor canvas) a static preview is drawn. */
  renderForm?: (form: PublicStoreForm, instanceId: string) => ReactNode;
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
  /**
   * Containers of editable parts the seller can reorder and move parts
   * between (P4B-16, `core/slots.ts`). Stored in `instance.slots`.
   */
  slots?: readonly SlotDefinition[];
  migrateProps?: (oldProps: Record<string, unknown>, fromVersion: number) => Record<string, unknown>;
  /** Catalog data this instance needs, given its (validated) props. */
  catalogQuery?: (props: P) => CatalogQuery | null;
  /** The `store_forms` id this instance shows, given its (validated) props (P4-10). */
  formRef?: (props: P) => string | null;
  /** Published blog/CMS items this instance needs, given its (validated) props. */
  contentQuery?: (props: P) => ContentQuery | null;
  /**
   * `false` hides the section from the editor Add panel; existing pages keep
   * rendering it (P4B: one section per category).
   */
  insertable?: false;
  /** Only usable as the site header or footer, not inside a page. */
  chrome?: "header" | "footer";
  Component: ComponentType<SectionRenderProps<P>>;
}

// Definitions are stored heterogeneously; the renderer validates props first.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySectionDefinition = SectionDefinition<any>;
