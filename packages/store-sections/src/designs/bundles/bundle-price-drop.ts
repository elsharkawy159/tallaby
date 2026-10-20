/**
 * Price drop band (O-i): a full-width ink band telling the bundle in two
 * very large typed figures (the separate price, an arrow, and the bundle
 * price in sun), with the products' own names underneath as small chips and a
 * button. A loud strip between product rows. Mobile stacks the figures.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { pillButton } from "../_modular";
import { BUNDLE_LINK, BUNDLE_PRICE } from "./_shared";

export const bundlePriceDrop = defineDesign({
  id: "bundle-price-drop",
  version: 1,
  category: "bundles",
  subcategory: "fixed",
  name: L("فرق السعر", "Price drop band"),
  description: L("شريط داكن بسعر القطع لوحدها وسعر الطقم بأرقام كبيرة.", "A dark band with the separate price and the bundle price in huge figures."),
  keywords: ["bundles", "price drop", "band", "campaign", "باقة", "فرق السعر", "عرض"],
  tree: (t) =>
    t.section({ label: L("فرق السعر", "Price drop"), style: { background: "foreground", color: "background" } }, [
      t.container(
        [
          t.text(L("٣ قطع مع بعض", "3 pieces together"), { role: "eyebrow", style: { fontSize: "sm", fontWeight: "semibold", color: "background" } }),
          t.row(
            [
              t.text(L("١٬٤٩٠ ج.م", "EGP 1,490"), {
                role: "was",
                style: { fontSize: "6xl", fontWeight: "bold", letterSpacing: "tight", color: "background", opacity: 70 },
                mobile: { fontSize: "4xl" },
              }),
              t.icon("arrow", { style: { fontSize: "5xl", color: "accent" }, mobile: { hidden: true } }),
              t.text(BUNDLE_PRICE, {
                role: "value",
                style: { fontSize: "6xl", fontWeight: "extrabold", letterSpacing: "tight", color: "accent" },
                mobile: { fontSize: "5xl" },
              }),
            ],
            {
              label: L("الأرقام", "Figures"),
              style: { gap: 28, wrap: false, alignItems: "center", marginTop: 8, marginBottom: 28 },
              mobile: { direction: "column", alignItems: "start", gap: 4 },
            },
          ),
          t.divider({ style: { marginTop: 0, marginBottom: 24, opacity: 25 } }),
          t.row(
            [
              t.productList(
                [
                  t.text(L("اسم المنتج", "Product name"), {
                    bind: "title",
                    style: { fontSize: "md", color: "background", borderWidth: 1, borderColor: "muted", radius: 999, paddingTop: 6, paddingBottom: 6, paddingStart: 14, paddingEnd: 14 },
                  }),
                ],
                {
                  label: L("القطع", "Pieces"),
                  role: "items",
                  source: "newest",
                  limit: 3,
                  columns: { desktop: 3, mobile: 1 },
                  style: { gap: 8 },
                },
              ),
              pillButton(t, L("اشتري الطقم", "Get the kit"), BUNDLE_LINK, { mobile: { width: "100%" } }),
            ],
            { label: L("التذييل", "Footer"), style: { justifyContent: "between", gap: 24 }, mobile: { gap: 16, direction: "column", alignItems: "stretch" } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
