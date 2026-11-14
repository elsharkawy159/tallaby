/**
 * Shapes shared by the editor, its adapters and the host apps' server code.
 * The package is the single source: the dashboard files that used to define
 * these (editor.dto.ts, editor.data.ts, media.dto.ts, forms.dto.ts,
 * explore.server.ts, stock-photos.lib.ts) re-export them.
 */
import type { MediaAltText } from "@workspace/lib/media";
import type { SellerCouponRow } from "@workspace/lib/store-sites/catalog-data";
import type { RatingStats } from "@workspace/lib/store-sites/catalog-data.lib";
import type { ContentItemSummary, PublicStoreForm } from "@workspace/store-sections/render";

export type { MediaAltText };

/**
 * One published revision (`StoreRevisionRow` in @workspace/lib/store-sites/server),
 * by shape: the package never imports server modules, and the host adapters
 * pass the lib rows, so a drift fails their typecheck.
 */
export type StoreRevisionRow = { id: string; revisionNumber: number; createdAt: string; publishedBy: string | null; isLive: boolean };

/** Error keys live under `storeEditor.errors`. */
export type EditorErrorKey =
  | "notFound"
  | "readOnly"
  | "publishBlocked"
  | "invalidContent"
  | "versionConflict"
  | "invalidSlug"
  | "reservedSlug"
  | "slugTaken"
  | "tooManyPages"
  | "homePage"
  | "productPageLocked"
  | "notPublished"
  | "invalidSite"
  | "invalidInput"
  | "rateLimited"
  | "previewUnavailable"
  | "nothingToPublish"
  /** Publishing needs a template chosen first (Website › Templates; owner 2026-10-27). */
  | "templateNotChosen"
  /** The host cancelled the publish (e.g. its confirmation dialog); no message is shown. */
  | "cancelled"
  /** AI steps (Fill missing translations): out of AI credits, over today's limit, AI not set up, the AI call failed. */
  | "aiNoCredits"
  | "aiDailyLimit"
  | "aiUnavailable"
  | "aiFailed"
  | "generic";

export type EditorResult<T> = { success: true; data: T } | { success: false; error: EditorErrorKey };

/**
 * More › Fill missing translations, the free template step.
 * `untranslated`: distinct texts still missing the other language that AI
 * could translate; `ai`: null when the host offers no AI step, else the
 * seller's AI credits (null when credits don't apply) and what a run costs.
 */
export type FillTranslationsSummary = {
  filled: number;
  repaired: number;
  missing: number;
  pages: number;
  untranslated?: number;
  ai?: { credits: number | null; cost: number } | null;
};

/**
 * The AI step: `translated` values written into the drafts (each text counts
 * once wherever it is used), `left` texts not translated this run (over the
 * caps, or an answer that failed the checks), `stoppedBy` why a run stopped
 * early, `creditsRemaining` after the run (null when credits don't apply).
 */
export type AiTranslateSummary = {
  translated: number;
  applied: number;
  left: number;
  stoppedBy?: "aiDailyLimit" | "aiNoCredits";
  creditsRemaining: number | null;
};

/** lib error codes → message keys. */
export const EDITOR_ERRORS: Record<string, EditorErrorKey> = {
  not_found: "notFound",
  store_read_only: "readOnly",
  publish_blocked: "publishBlocked",
  invalid_content: "invalidContent",
  version_conflict: "versionConflict",
  invalid_slug: "invalidSlug",
  reserved_slug: "reservedSlug",
  slug_taken: "slugTaken",
  too_many_pages: "tooManyPages",
  home_page: "homePage",
  product_page_locked: "productPageLocked",
  not_published: "notPublished",
  invalid_site: "invalidSite",
  invalid_input: "invalidInput",
  template_not_chosen: "templateNotChosen",
};

/** Forms tab row: a store form with its counts. */
export type EditorFormSummary = { id: string; fieldCount: number; submissionCount: number; newCount: number };

/** A form of the store for the contact-form picker and its canvas preview. */
export type EditorForm = { id: string; name: string; active: boolean; form: PublicStoreForm };

export type EditorProduct = {
  id: string;
  title: { ar: string; en: string };
  slug: string;
  image: string | null;
  price: number | null;
  compareAtPrice: number | null;
  isFeatured: boolean;
  /** Its store category key (`storeCategoryGroups`): the seller category id, else the Tallaby root's key. */
  categoryId: string;
  /** Its Tallaby category (`products.category_id`), which related lists match on; optional for older snapshots. */
  relatedCategoryId?: string;
  inStock: boolean;
  createdAt: string;
  rating: number | null;
  sold90: number;
  sold14: number;
  /** Product form › Visibility flags (badges on the card); optional for older snapshots. */
  trending?: boolean;
  seasonal?: boolean;
};

export type EditorBrand = { id: string; name: { ar: string; en: string }; logo: string | null };

export type EditorReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  authorName: string | null;
  verified: boolean;
  productId: string;
  productTitle: { ar: string; en: string };
  createdAt: string | null;
};

export type EditorRatingStats = RatingStats;

export type EditorCoupon = SellerCouponRow;

/**
 * Store data beyond products and categories. A source that failed to load is
 * `null` and listed in `failed`, so sections show an error with Retry
 * instead of "add records" (a failed query is not an empty store).
 */
export type EditorStoreData = {
  brands: EditorBrand[] | null;
  reviews: EditorReview[] | null;
  reviewStats: EditorRatingStats | null;
  coupons: EditorCoupon[] | null;
  failed: ("sales" | "brands" | "reviews" | "coupons" | "posts")[];
};

export type EditorCategory = {
  id: string;
  name: { ar: string; en: string };
  image: string | null;
  productCount: number;
  /** Its main category's id when it is a sub-category (F-95); optional for older snapshots. */
  parentId?: string | null;
  /** How many sub-categories it has (F-95); optional for older snapshots. */
  childCount?: number;
};

/** Everything the canvas draws from the store (initial load and refresh). */
export type EditorCatalogSnapshot = {
  products: EditorProduct[];
  categories: EditorCategory[];
  forms: EditorForm[];
  /** Published blog posts; null when they failed to load. */
  posts: ContentItemSummary[] | null;
  /**
   * The store logo now (path or URL; null = none), so a logo set in another
   * tab shows when the seller comes back. Left out by hosts that don't report
   * it: the editor then keeps the logo it opened with.
   */
  logoUrl?: string | null;
} & EditorStoreData;

// Media library (dashboard components/media/media.dto.ts re-exports these)
export type MediaAssetView = {
  id: string;
  /** null = shared by all of the seller's stores. */
  storeId: string | null;
  folderId: string | null;
  storagePath: string;
  url: string;
  filename: string;
  mimeType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  altText: MediaAltText;
  createdAt: string;
  usage: number;
};

export type MediaFolderView = { id: string; name: string; parentId: string | null; storeId: string | null };
export type MediaLibraryView = { folders: MediaFolderView[]; assets: MediaAssetView[] };

export type MediaErrorKey =
  | "notFound"
  | "readOnly"
  | "invalidInput"
  | "invalidPath"
  | "objectMissing"
  | "tooLarge"
  | "invalidType"
  | "invalidFolder"
  | "tooMany"
  | "rateLimited"
  | "deleteFailed"
  | "generic";

export type MediaResult<T> = { success: true; data: T } | { success: false; error: MediaErrorKey };

// Forms (forms.dto.ts)
export type FormsErrorKey = "invalidInput" | "readOnly" | "notFound" | "limitReached" | "rateLimited" | "generic";
export type FormsActionResult<T = undefined> = { success: true; data: T } | { success: false; error: FormsErrorKey };

// Explore (explore.server.ts, stock-photos.lib.ts)
export type ExploreErrorKey = "notFound" | "readOnly" | "unavailable" | "rateLimited" | "invalidInput" | "tooLarge" | "tooMany" | "generic";
export type ExploreResult<T> = { success: true; data: T } | { success: false; error: ExploreErrorKey };

export type StockPhoto = {
  id: string;
  thumbUrl: string;
  previewUrl: string;
  width: number;
  height: number;
  alt: string;
  avgColor: string | null;
  photographer: string;
  pageUrl: string;
};

export type StockPhotoPage = { photos: StockPhoto[]; hasMore: boolean };
