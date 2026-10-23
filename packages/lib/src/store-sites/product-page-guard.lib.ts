import { PRODUCT_PAGE_SLUG } from "@workspace/store-sections";

/**
 * The product page keeps its slug (`product`) and stays out of the menu. A
 * page update may rename it and change its SEO, nothing else.
 */
export function updateTouchesLockedProductFields(input: { slug?: unknown; showInNav?: unknown }): boolean {
  const slugChanged = input.slug !== undefined && input.slug !== PRODUCT_PAGE_SLUG;
  const navChanged = input.showInNav !== undefined && input.showInNav !== false;
  return slugChanged || navChanged;
}
