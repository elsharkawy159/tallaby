/**
 * Collection circles (Claude Design premium set, `categoryCircles`): round
 * category photos, each inside a thin ring with the name under it. Six
 * circles fill one full row on desktop (a fixed-column grid can't centre a
 * short last row, so the count matches the columns).
 *
 * v2 (look-first pilot, 2026-11-11, docs/systems/plan.md §10 L7): larger
 * circles in a hairline ring that turns to the text colour on hover (v1 had a
 * heavy brand-coloured ring), quiet labels, the heading the product sections
 * use with "View all", and one swipe row on phones in place of two rows of
 * three. Node order, roles and field names are v1's; the link is a new field.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { CATEGORY_LINK, CATEGORY_SECTION, HEAD_TO_LIST, categoryHead } from "./_shared";

export const categoriesCircles = defineDesign({
  id: "categories-circles",
  version: 2,
  category: "categories",
  subcategory: "circles",
  name: L("دوائر الأقسام", "Collection circles"),
  description: L(
    "صور دائرية لأقسام متجرك بحلقة رفيعة واسم كل قسم تحتها، وصف يُسحب على الجوال.",
    "Round category photos in a thin ring with each name underneath; a swipe row on phones.",
  ),
  keywords: ["categories", "circles", "stories", "round", "collections", "premium", "أقسام", "دوائر", "ستوري"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories"), ...CATEGORY_SECTION }, [
      t.container(
        [
          t.stack(
            [
              categoryHead(t, { title: L("بتدوّر على إيه؟", "What are you shopping for?"), link: { href: CATEGORY_LINK }, spaced: false }),
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
                                style: { aspectRatio: "square", objectFit: "cover", width: "100%", radius: 999, background: "secondary" },
                              }),
                            ],
                            {
                              label: L("الحلقة", "Ring"),
                              style: {
                                radius: 999,
                                borderWidth: 1,
                                borderColor: "border",
                                paddingTop: 6,
                                paddingBottom: 6,
                                paddingStart: 6,
                                paddingEnd: 6,
                                width: "100%",
                                maxWidth: "168px",
                                hover: { borderColor: "foreground" },
                              },
                              mobile: { paddingTop: 4, paddingBottom: 4, paddingStart: 4, paddingEnd: 4 },
                            },
                          ),
                          t.text(L("اسم القسم", "Category"), {
                            bind: "name",
                            style: { fontWeight: "medium", fontSize: "sm", textAlign: "center", lineHeight: "snug" },
                          }),
                        ],
                        { label: L("المحتوى", "Content"), style: { gap: 14, alignItems: "center" }, mobile: { gap: 10 } },
                      ),
                    ],
                    {
                      label: L("قسم", "Category"),
                      bind: "href",
                      style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, color: "foreground" },
                    },
                  ),
                ],
                {
                  label: L("الأقسام", "Categories"),
                  role: "items",
                  limit: 6,
                  mobileRail: true,
                  columns: { desktop: 6, tablet: 6, mobile: 3 },
                  style: { gap: 28 },
                  tablet: { gap: 16 },
                  mobile: { gap: 14 },
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
