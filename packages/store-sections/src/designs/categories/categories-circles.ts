/**
 * Collection circles (Claude Design premium set, `categoryCircles`): round
 * category photos inside a thin brand-coloured ring, like stories, with the
 * name under each. Six circles fill one full row on desktop (a fixed-column
 * grid can't centre a short last row, so the count matches the columns). The
 * source swipes on phones; our category swipe row has fixed wide cards
 * (`mobileRail`), so phones get two full rows of three circles instead.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { CATEGORY_LINK } from "./_shared";

export const categoriesCircles = defineDesign({
  id: "categories-circles",
  version: 1,
  category: "categories",
  subcategory: "circles",
  name: L("دوائر الأقسام", "Collection circles"),
  description: L(
    "صور دائرية لأقسام متجرك بحلقة رفيعة واسم كل قسم تحتها، زي الستوري.",
    "Round category photos in a thin ring with each name underneath, like stories.",
  ),
  keywords: ["categories", "circles", "stories", "round", "collections", "premium", "أقسام", "دوائر", "ستوري"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories") }, [
      t.container(
        [
          t.stack(
            [
              sectionHead(t, { title: L("بتدوّر على إيه؟", "What are you shopping for?"), align: "center" }),
              t.categoryList(
                [
                  t.link(
                    CATEGORY_LINK,
                    [
                      t.stack(
                        [
                          t.box(
                            [
                              t.image("", L("صورة القسم", "Category photo"), {
                                bind: "image",
                                role: "image",
                                style: { aspectRatio: "square", objectFit: "cover", width: "100%", radius: 999, background: "secondary", borderWidth: 2, borderColor: "background" },
                              }),
                            ],
                            {
                              label: L("الحلقة", "Ring"),
                              style: { radius: 999, borderWidth: 2, borderColor: "primary", paddingTop: 2, paddingBottom: 2, paddingStart: 2, paddingEnd: 2, width: "100%", maxWidth: "120px" },
                              mobile: { maxWidth: "96px" },
                            },
                          ),
                          t.text(L("اسم القسم", "Category"), {
                            bind: "name",
                            style: { fontWeight: "medium", fontSize: "sm", textAlign: "center", lineHeight: "snug" },
                            mobile: { fontSize: "xs" },
                          }),
                        ],
                        { label: L("المحتوى", "Content"), style: { gap: 10, alignItems: "center" }, mobile: { gap: 8 } },
                      ),
                    ],
                    {
                      label: L("قسم", "Category"),
                      bind: "href",
                      style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, hover: { opacity: 85 } },
                    },
                  ),
                ],
                {
                  label: L("الأقسام", "Categories"),
                  role: "items",
                  limit: 6,
                  columns: { desktop: 6, tablet: 6, mobile: 3 },
                  style: { gap: 32 },
                  tablet: { gap: 20 },
                  mobile: { gap: 16 },
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
