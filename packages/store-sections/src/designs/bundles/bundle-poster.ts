/**
 * Kit poster (O-c): two bento tiles. A brand tile with the kit name in large
 * type, a ticked list of what is inside (the products' own names), the typed
 * kit price and a button; beside it a shelf photo tile with the first product
 * large, the next two under it, and a round saving sticker. Mobile stacks the
 * photo tile under the brand tile.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND } from "../_kit";
import { BRAND_TILE, TILE_MOBILE, pillButton } from "../_modular";
import { productPhoto } from "../products/_shared";
import { BUNDLE_LINK, BUNDLE_PCT, BUNDLE_PRICE, BUNDLE_WAS, tickName } from "./_shared";

export const bundlePoster = defineDesign({
  id: "bundle-poster",
  version: 1,
  category: "bundles",
  subcategory: "fixed",
  name: L("بوستر الطقم", "Kit poster"),
  description: L("طقم واحد باسم كبير وقائمة باللي جواه، وجنبه صور المنتجات.", "One named kit in large type with what is inside, beside its product photos."),
  keywords: ["bundles", "kit", "poster", "launch", "باقة", "طقم", "بوستر"],
  tree: (t) =>
    t.section({ label: L("بوستر الطقم", "Kit poster") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.text(L("طقم المشاوير", "Commuter kit"), { role: "eyebrow", style: { fontSize: "sm", fontWeight: "semibold", ...ON_BRAND } }),
                  t.heading(L("كل اللي تحتاجه في الطريق", "Everything you need on the move"), "h2", {
                    role: "title",
                    style: { fontSize: "display-lg", letterSpacing: "tight", lineHeight: "tight", maxWidth: "14ch", ...ON_BRAND },
                  }),
                  t.productList([tickName(t, "accent", ON_BRAND)], {
                    label: L("اللي في الطقم", "What is inside"),
                    role: "items",
                    source: "newest",
                    limit: 3,
                    columns: { desktop: 1 },
                    style: { gap: 10, marginTop: 8, marginBottom: 8 },
                  }),
                  t.row(
                    [
                      t.text(BUNDLE_PRICE, { role: "value", style: { fontSize: "4xl", fontWeight: "bold", ...ON_BRAND }, mobile: { fontSize: "3xl" } }),
                      t.text(BUNDLE_WAS, { style: { fontSize: "sm", ...ON_BRAND, opacity: 80 } }),
                    ],
                    { label: L("السعر", "Price"), style: { gap: 12, alignItems: "end" } },
                  ),
                  pillButton(t, L("اشتري الطقم", "Get the kit"), BUNDLE_LINK, { icon: "shopping-bag", tone: "ink" }),
                ],
                {
                  label: L("بطاقة الطقم", "Kit tile"),
                  style: { ...BRAND_TILE, gap: 16, alignItems: "start", justifyContent: "between", paddingTop: 44, paddingBottom: 44, paddingStart: 44, paddingEnd: 44 },
                  mobile: { ...TILE_MOBILE, paddingTop: 26, paddingBottom: 26, paddingStart: 26, paddingEnd: 26 },
                },
              ),
              t.box(
                [
                  t.stack(
                    [
                      t.productList([productPhoto(t, { ratio: "landscape", radius: 16, chip: false })], {
                        label: L("الصورة الكبيرة", "Large photo"),
                        source: "newest",
                        limit: 1,
                        columns: { desktop: 1 },
                      }),
                      t.productList([productPhoto(t, { ratio: "landscape", radius: 16, chip: false })], {
                        label: L("الصور الصغيرة", "Small photos"),
                        source: "newest",
                        limit: 2,
                        offset: 1,
                        optional: true,
                        columns: { desktop: 2, mobile: 2 },
                        style: { gap: 12 },
                        mobile: { gap: 8 },
                      }),
                    ],
                    { label: L("الصور", "Photos"), style: { gap: 12 }, mobile: { gap: 8 } },
                  ),
                  t.box([t.text(BUNDLE_PCT, { style: { fontWeight: "bold", fontSize: "lg", textAlign: "center", lineHeight: "tight" } })], {
                    label: L("ملصق التوفير", "Saving sticker"),
                    style: {
                      position: "absolute",
                      insetTop: "28px",
                      insetEnd: "28px",
                      zIndex: 2,
                      background: "accent",
                      color: "foreground",
                      radius: 999,
                      width: "104px",
                      paddingTop: 38,
                      paddingBottom: 38,
                      paddingStart: 8,
                      paddingEnd: 8,
                    },
                    mobile: { width: "96px", paddingTop: 36, paddingBottom: 36, paddingStart: 4, paddingEnd: 4, insetTop: "20px", insetEnd: "20px" },
                  }),
                ],
                {
                  label: L("بطاقة الصور", "Photo tile"),
                  style: { position: "relative", background: "secondary", radius: 24, overflow: "hidden", paddingTop: 12, paddingBottom: 12, paddingStart: 12, paddingEnd: 12 },
                  mobile: { paddingTop: 8, paddingBottom: 8, paddingStart: 8, paddingEnd: 8 },
                },
              ),
            ],
            {
              label: L("المربعات", "Tiles"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 12, minHeight: 500, alignItems: "stretch" },
              mobile: { minHeight: 0 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
