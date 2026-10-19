/**
 * Panel with rail (Modular set): a brand-coloured panel on the start side
 * with a label, title, short text and button, followed by a row of product
 * cards. Frames a curated pick ("gifts under 1,000") with a message. On mobile
 * the panel sits above the cards.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY } from "../_kit";
import { BRAND_TILE, TILE_MOBILE, dotLabel, pillButton } from "../_modular";
import { SHOP_LINK, productCard } from "./_shared";

export const productsPanelRail = defineDesign({
  id: "products-panel-rail",
  version: 1,
  category: "products",
  subcategory: "shelf",
  name: L("لوحة وشريط", "Panel with rail"),
  description: L("لوحة بلون المتجر فيها رسالة، وبجانبها منتجات مختارة.", "A brand-coloured panel with a message beside a row of picked products."),
  keywords: ["products", "panel", "rail", "gifts", "curated", "منتجات", "هدايا", "مختارات"],
  tree: (t) =>
    t.section({ label: L("المنتجات", "Products") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  dotLabel(t, L("هدايا", "Gifts"), { onBrand: true }),
                  t.heading(L("هدايا تحت ١٠٠٠ جنيه", "Gifts under EGP 1,000"), "h2", {
                    role: "title",
                    style: {
                      fontSize: "3xl",
                      letterSpacing: "tight",
                      ...ON_BRAND,
                    },
                  }),
                  t.paragraph(L("اختيارات مضمونة لأي مناسبة.", "Safe picks for any occasion."), { role: "subtitle", style: ON_BRAND_BODY }),
                  t.spacer(8),
                  pillButton(t, L("عرض الكل", "View all"), SHOP_LINK, {
                    tone: "on-brand",
                  }),
                ],
                {
                  label: L("اللوحة", "Panel"),
                  style: {
                    ...BRAND_TILE,
                    gap: 14,
                    alignItems: "start",
                    paddingTop: 32,
                    paddingBottom: 32,
                    paddingStart: 32,
                    paddingEnd: 32,
                  },
                  mobile: TILE_MOBILE,
                },
              ),
              t.productList([productCard(t)], {
                label: L("المنتجات", "Products"),
                role: "items",
                source: "featured",
                limit: 3,
                columns: { desktop: 3, mobile: 2 },
                style: { gap: 20, colSpan: 3 },
                mobile: { gap: 12, colSpan: 1 },
              }),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 4, mobile: 1 },
              style: { gap: 24, alignItems: "stretch" },
              mobile: { gap: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
