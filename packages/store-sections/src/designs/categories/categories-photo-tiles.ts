/**
 * Photo tiles with pills (Claude Design premium set, `categoryTiles`): the
 * store's categories as portrait photo tiles, each name on a light pill near
 * the foot of its photo. A centred heading above; a swipe row on phones with
 * the next tile peeking in, five across on desktop. Each tile is one clipped
 * link, so its photo zooms a little on hover.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { CATEGORY_LINK } from "./_shared";

export const categoriesPhotoTiles = defineDesign({
  id: "categories-photo-tiles",
  version: 1,
  category: "categories",
  subcategory: "grid",
  name: L("صور بأسماء على كبسولة", "Photo tiles with pills"),
  description: L(
    "صور طويلة لأقسام متجرك، واسم كل قسم على كبسولة فاتحة فوق الصورة.",
    "Tall photos of your categories, each name on a light pill over the photo.",
  ),
  keywords: ["categories", "tiles", "collections", "pill", "premium", "rail", "أقسام", "مربعات", "مجموعات"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories") }, [
      t.container(
        [
          t.stack(
            [
              sectionHead(t, { title: L("تسوّق حسب القسم", "Shop by category"), align: "center" }),
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
                      t.row(
                        [
                          t.text(L("اسم القسم", "Category"), {
                            bind: "name",
                            style: {
                              background: "background",
                              color: "foreground",
                              fontWeight: "semibold",
                              fontSize: "sm",
                              textAlign: "center",
                              radius: 999,
                              shadow: "sm",
                              paddingTop: 8,
                              paddingBottom: 8,
                              paddingStart: 16,
                              paddingEnd: 16,
                            },
                          }),
                        ],
                        {
                          label: L("الاسم", "Name"),
                          style: { position: "absolute", insetBottom: "14px", insetStart: "10px", insetEnd: "10px", justifyContent: "center", wrap: false },
                          mobile: { insetBottom: "10px" },
                        },
                      ),
                    ],
                    {
                      label: L("قسم", "Category"),
                      bind: "href",
                      style: { position: "relative", paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, radius: 16, overflow: "hidden", background: "secondary" },
                      mobile: { radius: 12 },
                    },
                  ),
                ],
                {
                  label: L("الأقسام", "Categories"),
                  role: "items",
                  limit: 5,
                  mobileRail: true,
                  columns: { desktop: 5, tablet: 3, mobile: 2 },
                  style: { gap: 24 },
                  tablet: { gap: 20 },
                  mobile: { gap: 12 },
                },
              ),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 36 }, mobile: { gap: 20 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
