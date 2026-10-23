import type { Design } from "../builder";
import { productContent } from "./product-content";
import { productMain } from "./product-main";
import { productPerks } from "./product-perks";
import { productRelated } from "./product-related";
import { productReviews } from "./product-reviews";
import { productShipping } from "./product-shipping";

/**
 * Product page sections, in page order: the gallery and buy box, the
 * product's content, its reviews and related products (these read the page's
 * product), then the store-wide perks and shipping rows.
 */
export const PRODUCT_PAGE_DESIGNS: readonly Design[] = [productMain, productContent, productReviews, productRelated, productPerks, productShipping];
