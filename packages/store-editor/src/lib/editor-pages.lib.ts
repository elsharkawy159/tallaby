/**
 * The product page in the editor (template product page spec §5.5). Pure;
 * the Pages panel and the Add panel use it, tests cover it.
 */
import { BUILT_IN_PAGE_SLUGS, isProductPage, type BuiltInPageSlug } from "@workspace/store-sections";
import { ELEMENT_GROUPS, PALETTE_TYPES, getElementDefinition, type ElementGroup, type ElementType, type SectionPreset } from "@workspace/store-sections/render";
import type { EditorPage } from "../state/editor.store";

const PRODUCT_PAGE_CATEGORY = "product-page";

/** Pages panel order: Home, then the product page, then every other page in its own order. */
export function pagesPanelOrder<T extends Pick<EditorPage, "isHome" | "kind">>(pages: readonly T[]): T[] {
  const rank = (page: T) => (page.isHome ? 0 : isProductPage(page) ? 1 : 2);
  return pages.map((page, index) => ({ page, index })).sort((a, b) => rank(a.page) - rank(b.page) || a.index - b.index).map(({ page }) => page);
}

/**
 * The built-in storefront pages (F-46) the store hasn't made yet, in
 * `BUILT_IN_PAGE_SLUGS` order: the Pages panel offers to customize them.
 */
export function missingBuiltInPages(pages: readonly Pick<EditorPage, "isHome" | "slug">[]): BuiltInPageSlug[] {
  const taken = new Set(pages.filter((page) => !page.isHome).map((page) => page.slug));
  return BUILT_IN_PAGE_SLUGS.filter((slug) => !taken.has(slug));
}

/**
 * The name a built-in page gets when the seller customizes it, in both
 * languages (it is saved on the page, so it can't come from the UI locale's
 * messages alone). The panel shows the same name in its list.
 */
export const BUILT_IN_PAGE_NAMES: Readonly<Record<BuiltInPageSlug, { ar: string; en: string }>> = {
  shipping: { ar: "الشحن والتوصيل", en: "Shipping & delivery" },
  returns: { ar: "الاسترجاع والاستبدال", en: "Returns & exchanges" },
  privacy: { ar: "سياسة الخصوصية", en: "Privacy policy" },
  terms: { ar: "الشروط والأحكام", en: "Terms & conditions" },
  contact: { ar: "تواصل معنا", en: "Contact us" },
  about: { ar: "من نحن", en: "About us" },
  faq: { ar: "الأسئلة الشائعة", en: "FAQ" },
};

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
