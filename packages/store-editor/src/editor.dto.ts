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
  | "notPublished"
  | "invalidSite"
  | "invalidInput"
  | "rateLimited"
  | "previewUnavailable"
  | "nothingToPublish"
  | "generic";

export type EditorResult<T> = { success: true; data: T } | { success: false; error: EditorErrorKey };

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
  not_published: "notPublished",
  invalid_site: "invalidSite",
  invalid_input: "invalidInput",
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
  categoryId: string;
  inStock: boolean;
  createdAt: string;
  rating: number | null;
  sold90: number;
  sold14: number;
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

export type EditorCategory = { id: string; name: { ar: string; en: string }; image: string | null; productCount: number };

/** Everything the canvas draws from the store (initial load and refresh). */
export type EditorCatalogSnapshot = {
  products: EditorProduct[];
  categories: EditorCategory[];
  forms: EditorForm[];
  /** Published blog posts; null when they failed to load. */
  posts: ContentItemSummary[] | null;
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
