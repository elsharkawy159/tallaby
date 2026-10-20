/**
 * Brand tiles (library L-c): a "shop by brand" grid of white tiles, 4 across;
 * each holds a logo and a short line and links to that brand's products.
 */
import { defineDesign } from "../builder";
import { L, PAPER_CARD, sectionHead } from "../_kit";
import { BRANDS, wordmark } from "./_shared";

export const brandsTiles = defineDesign({
  id: "brands-tiles",
  version: 1,
  category: "brands",
  subcategory: "brand-cards",
  name: L("تسوّق حسب الماركة", "Shop by brand"),
  description: L("شبكة بطاقات للماركات، كل بطاقة رابط لمنتجات الماركة.", "A grid of brand tiles, each linking to that brand's products."),
  keywords: ["brands", "shop by brand", "tiles", "ماركات", "تسوق حسب الماركة"],
  tree: (t) =>
    t.section({ label: L("الماركات", "Brands") }, [
      t.container(
        [
          sectionHead(t, { title: L("تسوّق حسب الماركة", "Shop by brand"), link: { href: "/products", text: L("كل الماركات", "All brands") } }),
          t.grid(
            BRANDS.map((_, i) =>
              t.link(
                "/products",
                [
                  t.stack([wordmark(t, i), t.text(L("وكيل معتمد", "Authorised dealer"), { style: { color: "muted", fontSize: "xs", textAlign: "center" } })], {
                    label: L("المحتوى", "Content"),
                    style: { gap: 8, alignItems: "center" },
                  }),
                ],
                {
                  label: L("ماركة", "Brand"),
                  style: {
                    ...PAPER_CARD,
                    paddingTop: 32,
                    paddingBottom: 28,
                    paddingStart: 16,
                    paddingEnd: 16,
                    hover: { borderColor: "primary", shadow: "md" },
                  },
                },
              ),
            ),
            { label: L("الماركات", "Brands"), role: "items", columns: { desktop: 4, mobile: 2 }, style: { gap: 16 }, mobile: { gap: 10 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
