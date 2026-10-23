/**
 * The product page in the editor (template product page spec §5.5). Pure;
 * the Pages panel and the Add panel use it, tests cover it.
 */
import { isProductPage } from "@workspace/store-sections";
import { ELEMENT_GROUPS, PALETTE_TYPES, getElementDefinition, type ElementGroup, type ElementType, type SectionPreset } from "@workspace/store-sections/render";
import type { EditorPage } from "../state/editor.store";

const PRODUCT_PAGE_CATEGORY = "product-page";

/** Pages panel order: Home, then the product page, then every other page in its own order. */
export function pagesPanelOrder<T extends Pick<EditorPage, "isHome" | "kind">>(pages: readonly T[]): T[] {
  const rank = (page: T) => (page.isHome ? 0 : isProductPage(page) ? 1 : 2);
  return pages.map((page, index) => ({ page, index })).sort((a, b) => rank(a.page) - rank(b.page) || a.index - b.index).map(({ page }) => page);
}

/**
 * Product elements and the product page library category only make sense on
 * the product page (they draw the page's product): the Add panel offers them there only.
 */
export function offersProductParts(page: Pick<EditorPage, "kind"> | undefined): boolean {
  return Boolean(page && isProductPage(page));
}

/** The element types the Add panel and quick insert offer (no product elements off the product page). */
export function offeredPaletteTypes(productParts: boolean): readonly ElementType[] {
  return productParts ? PALETTE_TYPES : PALETTE_TYPES.filter((type) => getElementDefinition(type)?.group !== "product");
}

/** The element groups the Add panel lists. */
export function offeredElementGroups(productParts: boolean): readonly ElementGroup[] {
  return productParts ? ELEMENT_GROUPS : ELEMENT_GROUPS.filter((group) => group !== "product");
}

/** The library sections Add › Sections lists (no product page category off the product page). */
export function offeredPresets<T extends Pick<SectionPreset, "category">>(presets: readonly T[], productParts: boolean): readonly T[] {
  return productParts ? presets : presets.filter((preset) => preset.category !== PRODUCT_PAGE_CATEGORY);
}
