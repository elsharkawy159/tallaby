/**
 * The section designs (tree-sections plan 1; the Claude Design section
 * library, 2026-10-19): one file per design under `designs/<library
 * category>/`, listed by each folder's `index.ts` with the Classic default
 * first. A library preset with a `designId` inserts one.
 */
import type { Design } from "./builder";
import { ABOUT_DESIGNS } from "./about";
import { BLOG_DESIGNS } from "./blog";
import { BRAND_DESIGNS } from "./brands";
import { BUNDLE_DESIGNS } from "./bundles";
import { CART_DESIGNS } from "./cart";
import { CATEGORY_DESIGNS } from "./categories";
import { CONTACT_DESIGNS } from "./contact";
import { FAQ_DESIGNS } from "./faq";
import { FEATURE_DESIGNS } from "./features";
import { FINDER_DESIGNS } from "./finder";
import { FOOTER_DESIGNS } from "./footers";
import { GALLERY_DESIGNS } from "./gallery";
import { HEADER_DESIGNS } from "./headers";
import { HERO_DESIGNS } from "./hero";
import { IMAGE_TEXT_DESIGNS } from "./image-text";
import { LOYALTY_DESIGNS } from "./loyalty";
import { NEWSLETTER_DESIGNS } from "./newsletter";
import { PAGE_HEADER_DESIGNS } from "./page-header";
import { PAYMENT_DESIGNS } from "./payment";
import { POPUP_DESIGNS } from "./popups";
import { PRODUCT_PAGE_DESIGNS } from "./product-page";
import { PRODUCT_DESIGNS } from "./products";
import { PROMOTION_DESIGNS } from "./promotions";
import { RICH_TEXT_DESIGNS } from "./rich-text";
import { SERVICE_DESIGNS } from "./services";
import { STATISTICS_DESIGNS } from "./statistics";
import { TESTIMONIAL_DESIGNS } from "./testimonials";
import { TRACKING_DESIGNS } from "./tracking";
import { VIDEO_DESIGNS } from "./video";

export {
  createTreeBuilder,
  defineDesign,
  instantiateDesign,
  instantiateTemplate,
  treeBuilder,
  type Design,
  type DesignText,
  type GridOptions,
  type NodeOptions,
  type TreeBuilder,
} from "./builder";
export { PHOTO_SLOT_RE, designSlotTree, photoSlot, resolvePhotoSlot, resolvePhotoSlots } from "./photo-slots";
export { STOCK_INDUSTRIES, type StockIndustry } from "./stock-photos";

/** In library category order (`LIBRARY_CATEGORY_IDS`). */
export const DESIGNS: readonly Design[] = [
  ...HEADER_DESIGNS,
  ...HERO_DESIGNS,
  ...CATEGORY_DESIGNS,
  ...PRODUCT_DESIGNS,
  ...BUNDLE_DESIGNS,
  ...FINDER_DESIGNS,
  ...PROMOTION_DESIGNS,
  ...FEATURE_DESIGNS,
  ...PAYMENT_DESIGNS,
  ...STATISTICS_DESIGNS,
  ...IMAGE_TEXT_DESIGNS,
  ...VIDEO_DESIGNS,
  ...GALLERY_DESIGNS,
  ...BRAND_DESIGNS,
  ...TESTIMONIAL_DESIGNS,
  ...FAQ_DESIGNS,
  ...BLOG_DESIGNS,
  ...NEWSLETTER_DESIGNS,
  ...POPUP_DESIGNS,
  ...LOYALTY_DESIGNS,
  ...SERVICE_DESIGNS,
  ...ABOUT_DESIGNS,
  ...CONTACT_DESIGNS,
  ...TRACKING_DESIGNS,
  ...RICH_TEXT_DESIGNS,
  ...PAGE_HEADER_DESIGNS,
  ...PRODUCT_PAGE_DESIGNS,
  ...CART_DESIGNS,
  ...FOOTER_DESIGNS,
];

const BY_ID = new Map(DESIGNS.map((design) => [design.id, design]));

export function getDesign(id: string): Design | undefined {
  return BY_ID.get(id);
}
