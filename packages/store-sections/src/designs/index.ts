/**
 * The section designs (tree-sections plan 1; the Claude Design section
 * library, 2026-10-19): one file per design under `designs/<library
 * category>/`, listed by each folder's `index.ts` with the Classic default
 * first. A library preset with a `designId` inserts one.
 */
import type { Design } from "./builder";
import { BLOG_DESIGNS } from "./blog";
import { BRAND_DESIGNS } from "./brands";
import { CATEGORY_DESIGNS } from "./categories";
import { CONTACT_DESIGNS } from "./contact";
import { FEATURE_DESIGNS } from "./features";
import { FAQ_DESIGNS } from "./faq";
import { FOOTER_DESIGNS } from "./footers";
import { GALLERY_DESIGNS } from "./gallery";
import { HEADER_DESIGNS } from "./headers";
import { HERO_DESIGNS } from "./hero";
import { IMAGE_TEXT_DESIGNS } from "./image-text";
import { NEWSLETTER_DESIGNS } from "./newsletter";
import { PAGE_HEADER_DESIGNS } from "./page-header";
import { PRODUCT_DESIGNS } from "./products";
import { PROMOTION_DESIGNS } from "./promotions";
import { RICH_TEXT_DESIGNS } from "./rich-text";
import { STATISTICS_DESIGNS } from "./statistics";
import { TESTIMONIAL_DESIGNS } from "./testimonials";
import { VIDEO_DESIGNS } from "./video";

export {
  createTreeBuilder,
  defineDesign,
  instantiateDesign,
  treeBuilder,
  type Design,
  type DesignText,
  type GridOptions,
  type NodeOptions,
  type TreeBuilder,
} from "./builder";
export { STOCK_INDUSTRIES, type StockIndustry } from "./stock-photos";

/** In library category order (`LIBRARY_CATEGORY_IDS`). */
export const DESIGNS: readonly Design[] = [
  ...HEADER_DESIGNS,
  ...HERO_DESIGNS,
  ...CATEGORY_DESIGNS,
  ...PRODUCT_DESIGNS,
  ...PROMOTION_DESIGNS,
  ...FEATURE_DESIGNS,
  ...STATISTICS_DESIGNS,
  ...IMAGE_TEXT_DESIGNS,
  ...VIDEO_DESIGNS,
  ...GALLERY_DESIGNS,
  ...BRAND_DESIGNS,
  ...TESTIMONIAL_DESIGNS,
  ...FAQ_DESIGNS,
  ...BLOG_DESIGNS,
  ...NEWSLETTER_DESIGNS,
  ...CONTACT_DESIGNS,
  ...RICH_TEXT_DESIGNS,
  ...PAGE_HEADER_DESIGNS,
  ...FOOTER_DESIGNS,
];

const BY_ID = new Map(DESIGNS.map((design) => [design.id, design]));

export function getDesign(id: string): Design | undefined {
  return BY_ID.get(id);
}
