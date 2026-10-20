import type { Design } from "../builder";
import { productPerks } from "./product-perks";
import { productShipping } from "./product-shipping";

/**
 * Product page sections that read nothing from the product (the gallery, buy
 * box, specs, reviews and variant tiles need a product-page data node first).
 */
export const PRODUCT_PAGE_DESIGNS: readonly Design[] = [productPerks, productShipping];
