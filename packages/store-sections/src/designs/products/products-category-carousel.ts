/**
 * Category carousel (2026-10-28): one row of the store's products from one
 * category, under that category's own name and its "View all" link. The
 * category is picked by its place in the store (`categoryIndex`, 1 = the
 * first), so a template's four rows show the first four categories of any
 * store that applies it. The heading is a one-category list at the same
 * place (`offset` = place − 1), so the name and link always match the
 * products. A carousel row (`rail`): four cards in view on desktop with
 * arrows, and on phones it swipes sideways.
 * Change the place on both lists to show another category. Cards show
 * square photos (furniture and packshots are rarely tall); the photo layer
 * is labelled so a template can set its ratio and frame.
 *
 * v2 (look-first pilot, 2026-11-11): the premium card and the calmer heading
 * (`_shared.ts`), the category name rising word by word (motion v2), and
 * the site's product stage.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { CATEGORY_LINK } from "../categories/_shared";
import { HEAD_GAP, HEAD_ROW, HEAD_TITLE, PRODUCTS_SECTION, premiumCard, viewAllLink } from "./_shared";

export const productsCategoryCarousel = defineDesign({
  id: "products-category-carousel",
  version: 2,
  category: "products",
  subcategory: "by-category",
  name: L("منتجات قسم", "Category carousel"),
  description: L(
    "صف منتجات من قسم واحد بعنوان القسم ورابط عرض الكل، وعلى الجوال يُسحب جانبيًا.",
    "One row of products from one category, under its name and View all; on phones it swipes sideways.",
  ),
  keywords: ["products", "category", "carousel", "rail", "collection", "swipe", "منتجات", "قسم", "شريط", "سحب"],
  tree: (t) => {
    const products = t.productList([premiumCard(t, { ratio: "square", wishlist: true })], {
      label: L("منتجات القسم", "Category products"),
      role: "items",
      source: "category",
      limit: 8,
      columns: { desktop: 4, tablet: 3, mobile: 2 },
      mobileRail: true,
      // The carousel sizes its cards for these gaps (`RAIL_CLASS`, elements/render.tsx).
      style: { gap: 24 },
      tablet: { gap: 16 },
      mobile: { gap: 12 },
    });
    return t.section({ label: L("منتجات قسم", "Category carousel"), ...PRODUCTS_SECTION }, [
      t.container(
        [
          t.stack(
            [
              t.categoryList(
                [
                  t.row(
                    [
                      t.heading(L("اسم القسم", "Category name"), "h2", { bind: "name", role: "title", ...HEAD_TITLE, motion: { reveal: "words" } }),
                      viewAllLink(t, CATEGORY_LINK, { bind: "href" }),
                    ],
                    { label: L("رأس القسم", "Section head"), motion: { reveal: "none" }, ...HEAD_ROW },
                  ),
                ],
                { label: L("القسم", "Category"), role: "intro", limit: 1, columns: { desktop: 1 } },
              ),
              { ...products, props: { ...products.props, categoryIndex: 1, rail: true } },
            ],
            { label: L("المحتوى", "Content"), style: { gap: HEAD_GAP.desktop }, mobile: { gap: HEAD_GAP.mobile } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]);
  },
});
