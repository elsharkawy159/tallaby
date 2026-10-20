/**
 * Minimal local copies of the dashboard's editor result types (Task 1).
 * Task 2 moves the originals here and removes the dashboard copies:
 * - EditorErrorKey, EditorResult, EditorFormSummary: dashboard editor/server/editor.dto.ts
 * - EditorForm, EditorCatalogSnapshot and the product/brand/review/coupon types: dashboard editor/server/editor.data.ts
 * - Media*: dashboard components/media/media.dto.ts
 * - Template*: dashboard website/templates/templates.dto.ts
 * - Forms*: dashboard website/forms/forms.dto.ts
 * - Explore*, StockPhoto*: dashboard explore.server.ts and lib/stock-photos/stock-photos.lib.ts
 * - StoreRevisionRow: packages/lib/src/store-sites/server.ts
 */
import type { ContentItemSummary, PublicStoreForm } from "@workspace/store-sections/render";
import type { DesignSystem, PageContent, SectionInstance, TemplateDemo } from "@workspace/store-sections";

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
  | "generic";

export type EditorResult<T> = { success: true; data: T } | { success: false; error: EditorErrorKey };

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

/** Copy of RatingStats (packages/lib catalog-data.lib.ts). */
export type EditorRatingStats = { average: number; count: number; distribution: Record<"1" | "2" | "3" | "4" | "5", number> };

/** Copy of SellerCouponRow (packages/lib catalog-data.server.ts). */
export type EditorCoupon = {
  id: string;
  code: string;
  name: string;
  discountType: "percentage" | "fixed" | "free-shipping" | "other";
  discountValue: number;
  endsAt: string;
  live: boolean;
};

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

export type StoreRevisionRow = {
  id: string;
  revisionNumber: number;
  createdAt: string;
  publishedBy: string | null;
  isLive: boolean;
};

// Media library (media.dto.ts)
export type MediaAltText = { ar?: string; en?: string };

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

// Templates (templates.dto.ts)
export type TemplatePreviewView = {
  designSystem: DesignSystem;
  header: SectionInstance | null;
  footer: SectionInstance | null;
  pages: { slug: string; isHome: boolean; name: string; sections: SectionInstance[]; content: PageContent }[];
  demo: TemplateDemo | null;
};

export type TemplateErrorKey =
  | "notFound"
  | "readOnly"
  | "templateNotFound"
  | "premiumTemplate"
  | "invalidTemplate"
  | "tooManyPages"
  | "nothingToUndo"
  | "rateLimited"
  | "generic";

export type TemplateActionResult<T> = { success: true; data: T } | { success: false; error: TemplateErrorKey };

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
