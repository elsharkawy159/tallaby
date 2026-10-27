/**
 * Category cards (Modular set). v3 (2026-10-27, owner: more premium cards):
 * a centred heading over the store's categories as quiet cards, each a
 * photo flush to the card's top edge (it zooms a little on hover, clipped by
 * the card), the name and a muted product count on a calm surface. Phones
 * swipe them sideways with the next card peeking in. The node tree is v1's
 * (same nodes, order and field names); only the look changed.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH } from "../_modular";
import { CATEGORY_LINK } from "./_shared";

export const categoriesChips = defineDesign({
  id: "categories-chips",
  version: 3,
  category: "categories",
  subcategory: "circles",
  name: L("سحابة أقسام", "Chip cloud"),
  description: L("أقسام متجرك ككروت بصورة عريضة واسم وعدد المنتجات.", "Your categories as cards with a wide photo, name and product count."),
  keywords: ["categories", "chips", "cards", "premium", "أقسام", "شرائح", "كروت"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories") }, [
      t.container(
        [
          t.stack(
            [
              t.heading(L("إيه اللي في بالك؟", "What are you after?"), "h2", {
                role: "title",
                style: {
                  fontSize: "display-sm",
                  fontWeight: "semibold",
                  letterSpacing: "tight",
                  lineHeight: "tight",
                  textAlign: "center",
                  maxWidth: "20ch",
                },
              }),
              t.categoryList(
                [
                  t.link(
                    CATEGORY_LINK,
                    [
                      t.row(
                        [
                          t.image("", L("صورة القسم", "Category photo"), {
                            bind: "image",
                            style: {
                              aspectRatio: "landscape",
                              objectFit: "cover",
                              width: "100%",
                              background: "secondary",
                              hover: { scale: 104 },
                            },
                            mobile: { aspectRatio: "square" },
                          }),
                          t.text(L("اسم القسم", "Category"), {
                            bind: "name",
                            style: {
                              fontWeight: "semibold",
                              fontSize: "lg",
                              lineHeight: "snug",
                              paddingTop: 16,
                              paddingStart: 18,
                              paddingEnd: 18,
                            },
                            mobile: { fontSize: "md", paddingTop: 12, paddingStart: 14, paddingEnd: 14 },
                          }),
                          t.text(L("١٢", "12"), {
                            bind: "productCount",
                            style: { color: "muted", fontSize: "sm", paddingTop: 2, paddingBottom: 18, paddingStart: 18, paddingEnd: 18 },
                            mobile: { fontSize: "xs", paddingBottom: 14, paddingStart: 14, paddingEnd: 14 },
                          }),
                        ],
                        {
                          label: L("المحتوى", "Content"),
                          style: { direction: "column", alignItems: "stretch", gap: 0, wrap: false },
                        },
                      ),
                    ],
                    {
                      label: L("شريحة القسم", "Category chip"),
                      bind: "href",
                      style: {
                        ...FLUSH,
                        overflow: "hidden",
                        background: "surface",
                        radius: 20,
                        borderWidth: 1,
                        borderColor: "border",
                        hover: { shadow: "md", borderColor: "primary" },
                      },
                      mobile: { radius: 16 },
                    },
                  ),
                ],
                {
                  label: L("الأقسام", "Categories"),
                  role: "items",
                  limit: 8,
                  mobileRail: true,
                  columns: { desktop: 4, tablet: 3, mobile: 2 },
                  style: { gap: 24, width: "100%" },
                  tablet: { gap: 16 },
                  mobile: { gap: 12 },
                },
              ),
            ],
            {
              label: L("السحابة", "Cloud"),
              style: { gap: 40, alignItems: "center" },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
