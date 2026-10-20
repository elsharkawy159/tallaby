/**
 * Bundle rail (O-h): bundle cards in a row, each a 2×2 shelf collage of the
 * products inside (its own product list, which the seller points at that
 * bundle's products), the bundle name, item count and typed price. The
 * design's sideways rail is drawn as a still row; mobile shows two per row.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH, modHead } from "../_modular";
import { BUNDLE_LINK } from "./_shared";

const KITS = [
  { name: L("طقم المشاوير", "Commuter kit"), count: L("٤ قطع", "4 items"), price: L("١٬٢٧٠ ج.م", "EGP 1,270") },
  { name: L("طقم الجيم", "Gym kit"), count: L("٣ قطع", "3 items"), price: L("٩٥٠ ج.م", "EGP 950") },
  { name: L("طقم البيت", "Home kit"), count: L("٤ قطع", "4 items"), price: L("١٬٨٠٠ ج.م", "EGP 1,800") },
  { name: L("طقم العربية", "Car kit"), count: L("٤ قطع", "4 items"), price: L("٧٤٠ ج.م", "EGP 740") },
];

export const bundleRail = defineDesign({
  id: "bundle-rail",
  version: 1,
  category: "bundles",
  subcategory: "several",
  name: L("شريط الأطقم", "Bundle rail"),
  description: L("كروت أطقم في صف، كل كارت فيه صور اللي جواه وسعره.", "Bundle cards in a row, each with a collage of what is inside and its price."),
  keywords: ["bundles", "kits", "rail", "collage", "باقات", "أطقم", "شريط"],
  tree: (t) =>
    t.section({ label: L("الأطقم", "Kits") }, [
      t.container(
        [
          modHead(t, {
            label: L("أطقم", "Kits"),
            title: L("أطقم جاهزة بسعر أقل", "Ready kits, lower price"),
            link: { text: L("كل الأطقم", "All kits"), href: BUNDLE_LINK },
          }),
          t.grid(
            KITS.map((kit, i) =>
              t.stack(
                [
                  t.productList(
                    [
                      t.image("", L("اسم المنتج", "Product name"), {
                        bind: "image",
                        style: { aspectRatio: "square", objectFit: "cover", width: "100%", radius: 10, background: "background" },
                      }),
                    ],
                    {
                      label: L("صور الطقم", "Kit photos"),
                      source: "newest",
                      limit: 4,
                      offset: i * 3,
                      optional: i > 0,
                      columns: { desktop: 2, mobile: 2 },
                      style: { gap: 6, background: "secondary", radius: 20, paddingTop: 6, paddingBottom: 6, paddingStart: 6, paddingEnd: 6, marginBottom: 6 },
                    },
                  ),
                  t.link(BUNDLE_LINK, [t.text(kit.name, { style: { fontWeight: "semibold", fontSize: "lg" }, mobile: { fontSize: "md" } })], {
                    label: L("اسم الطقم", "Kit name"),
                    style: { ...FLUSH, color: "foreground", hover: { color: "primary" } },
                  }),
                  t.text(kit.count, { style: { color: "muted", fontSize: "sm" } }),
                  t.text(kit.price, { role: "value", style: { fontWeight: "bold", color: "primary" } }),
                ],
                { label: L("طقم", "Kit"), style: { gap: 6 } },
              ),
            ),
            {
              label: L("الأطقم", "Kits"),
              role: "items",
              columns: { desktop: 4, mobile: 2 },
              style: { gap: 20 },
              mobile: { gap: 12 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
