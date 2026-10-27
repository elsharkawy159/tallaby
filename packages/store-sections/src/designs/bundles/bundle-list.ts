/**
 * Bundle list (O-e): a ruled list where each row is a bundle: overlapping
 * round photos of the products inside (each row its own product list, which
 * the seller points at that bundle's products), the bundle name and item
 * count, the typed price and saving, and a round arrow link. For a "Kits"
 * page. Mobile puts the photos on top and the price under the name.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH, modHead } from "../_modular";
import { BUNDLE_LINK } from "./_shared";

const KITS = [
  { name: L("طقم المشاوير", "Commuter kit"), price: L("١٬٢٧٠ ج.م", "EGP 1,270"), was: L("بدل ١٬٤٩٠ ج.م", "Instead of EGP 1,490") },
  { name: L("طقم الجيم", "Gym kit"), price: L("٩٥٠ ج.م", "EGP 950"), was: L("بدل ١٬١٢٠ ج.م", "Instead of EGP 1,120") },
  { name: L("طقم البيت", "Home kit"), price: L("١٬٨٠٠ ج.م", "EGP 1,800"), was: L("بدل ٢٬١٢٠ ج.م", "Instead of EGP 2,120") },
  { name: L("طقم العربية", "Car kit"), price: L("٧٤٠ ج.م", "EGP 740"), was: L("بدل ٨٧٠ ج.م", "Instead of EGP 870") },
];

export const bundleList = defineDesign({
  id: "bundle-list",
  version: 1,
  category: "bundles",
  subcategory: "several",
  name: L("جدول الأطقم", "Bundle list"),
  description: L("كل الأطقم في قائمة: صور اللي جواها والاسم والسعر.", "Every bundle in a ruled list: what is inside, the name and the price."),
  keywords: ["bundles", "kits", "list", "باقات", "أطقم", "قائمة"],
  tree: (t) =>
    t.section({ label: L("كل الأطقم", "All kits") }, [
      t.container(
        [
          modHead(t, { title: L("كل الأطقم", "All kits") }),
          t.stack(
            KITS.map((kit, i) =>
              t.stack(
                [
                  t.row(
                    [
                      t.row(
                        [
                          t.productList(
                            [
                              t.image("", L("اسم المنتج", "Product name"), {
                                bind: "image",
                                style: {
                                  width: "64px",
                                  aspectRatio: "square",
                                  radius: 999,
                                  objectFit: "cover",
                                  background: "secondary",
                                  borderWidth: 3,
                                  borderColor: "background",
                                },
                                mobile: { width: "48px" },
                              }),
                            ],
                            {
                              label: L("صور الطقم", "Kit photos"),
                              source: "newest",
                              limit: 3,
                              offset: i * 3,
                              optional: i > 0,
                              columns: { desktop: 3, mobile: 3 },
                              style: { gap: 0, maxWidth: "150px" },
                              mobile: { maxWidth: "110px" },
                            },
                          ),
                          t.stack(
                            [
                              t.heading(kit.name, "h3", { style: { fontSize: "2xl" }, mobile: { fontSize: "lg" } }),
                              t.text(L("٣ قطع", "3 items"), { style: { color: "muted", fontSize: "sm" } }),
                            ],
                            { label: L("الاسم", "Name"), style: { gap: 2 } },
                          ),
                        ],
                        { label: L("الطقم", "Kit"), style: { gap: 28, wrap: false }, mobile: { wrap: true, gap: 10 } },
                      ),
                      t.row(
                        [
                          t.stack(
                            [
                              t.text(kit.price, { role: "value", style: { fontWeight: "semibold", fontSize: "xl", textAlign: "end" }, mobile: { textAlign: "start", fontSize: "lg" } }),
                              t.text(kit.was, { style: { color: "muted", fontSize: "sm", textAlign: "end" }, mobile: { textAlign: "start" } }),
                            ],
                            { label: L("السعر", "Price"), style: { gap: 2 } },
                          ),
                          t.link(BUNDLE_LINK, [t.icon("arrow", { style: { fontSize: "lg" } })], {
                            label: L("افتح الطقم", "Open the kit"),
                            role: "link",
                            style: {
                              ...FLUSH,
                              width: "52px",
                              paddingTop: 13,
                              paddingBottom: 11,
                              textAlign: "center",
                              radius: 999,
                              borderWidth: 1,
                              borderColor: "border",
                              color: "foreground",
                              hover: { background: "primary", color: "primaryInk" },
                            },
                            mobile: { width: "48px", paddingTop: 11, paddingBottom: 9 },
                          }),
                        ],
                        { label: L("الشراء", "Buy"), style: { gap: 28, wrap: false }, mobile: { gap: 16, justifyContent: "between", width: "100%" } },
                      ),
                    ],
                    { label: L("الصف", "Row"), style: { justifyContent: "between", gap: 16, wrap: false }, mobile: { wrap: true, gap: 10 } },
                  ),
                  t.divider({ style: { marginTop: 16, marginBottom: 0 } }),
                ],
                { label: L("طقم", "Kit row"), style: { gap: 0, paddingTop: 16 } },
              ),
            ),
            { label: L("القائمة", "List"), role: "items", style: { gap: 0 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
