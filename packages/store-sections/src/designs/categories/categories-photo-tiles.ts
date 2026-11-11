/**
 * Photo tiles (Claude Design premium set, `categoryTiles`): the store's
 * categories as portrait photo tiles. Each tile is one clipped link, so its
 * photo zooms a little on hover.
 *
 * v2 (look-first pilot, 2026-11-11, docs/systems/plan.md §10 L7): the name
 * and the product count sit over the foot of the photo on a soft dark fade
 * (v1 put the name on a light pill), the heading is the quiet one the product
 * sections use, with "View all", and phones show a two-column grid in place
 * of the swipe row. Four across on desktop; a template that shows six sets
 * six columns. Node order, roles and field names are v1's; the fade, the
 * count and the link are new fields.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { CATEGORY_LINK, CATEGORY_SECTION, HEAD_TO_LIST, categoryHead } from "./_shared";

export const categoriesPhotoTiles = defineDesign({
  id: "categories-photo-tiles",
  version: 2,
  category: "categories",
  subcategory: "grid",
  name: L("صور الأقسام بالاسم عليها", "Photo tiles"),
  description: L(
    "صور طويلة لأقسام متجرك، واسم كل قسم وعدد منتجاته على أسفل الصورة.",
    "Tall photos of your categories, each name and product count over the foot of the photo.",
  ),
  keywords: ["categories", "tiles", "collections", "photo", "grid", "premium", "أقسام", "مربعات", "مجموعات", "صور"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories"), ...CATEGORY_SECTION }, [
      t.container(
        [
          t.stack(
            [
              categoryHead(t, { title: L("تسوّق حسب القسم", "Shop by category"), link: { href: CATEGORY_LINK }, spaced: false }),
              t.categoryList(
                [
                  t.link(
                    CATEGORY_LINK,
                    [
                      t.image("", L("صورة القسم", "Category photo"), {
                        bind: "image",
                        role: "image",
                        style: { aspectRatio: "portrait", objectFit: "cover", width: "100%", background: "secondary" },
                      }),
                      t.stack(
                        [
                          t.text(L("اسم القسم", "Category"), {
                            bind: "name",
                            style: { color: "white", fontWeight: "semibold", fontSize: "lg", lineHeight: "snug" },
                            mobile: { fontSize: "md" },
                          }),
                          t.row(
                            [
                              t.text(L("١٢", "12"), { bind: "productCount", style: { color: "white", fontSize: "xs", opacity: 85 } }),
                              t.text(L("منتج", "products"), { style: { color: "white", fontSize: "xs", opacity: 85 } }),
                            ],
                            { label: L("العدد", "Count"), style: { gap: 4, wrap: false } },
                          ),
                        ],
                        {
                          label: L("الاسم", "Name"),
                          style: { position: "absolute", insetBottom: "18px", insetStart: "18px", insetEnd: "18px", gap: 2, zIndex: 1 },
                          mobile: { insetBottom: "12px", insetStart: "12px", insetEnd: "12px" },
                        },
                      ),
                      // After the name in the tree (so field names stay v1's), under it on the tile.
                      t.box([], {
                        label: L("التظليل", "Shade"),
                        role: "shade",
                        style: { position: "absolute", insetTop: "40%", insetBottom: "0px", insetStart: "0px", insetEnd: "0px", gradient: "ink-fade" },
                      }),
                    ],
                    {
                      label: L("قسم", "Category"),
                      bind: "href",
                      style: { position: "relative", paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, radius: 12, overflow: "hidden", background: "secondary" },
                      mobile: { radius: 8 },
                    },
                  ),
                ],
                {
                  label: L("الأقسام", "Categories"),
                  role: "items",
                  limit: 4,
                  columns: { desktop: 4, tablet: 4, mobile: 2 },
                  style: { gap: 20 },
                  tablet: { gap: 16 },
                  mobile: { gap: 12 },
                },
              ),
            ],
            { label: L("المحتوى", "Content"), ...HEAD_TO_LIST },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
