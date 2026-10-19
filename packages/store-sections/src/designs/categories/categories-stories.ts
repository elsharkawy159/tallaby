/**
 * Story rings (library C-b): one row of circular photos with coloured rings,
 * like stories on a social app; names under each, the first marked "new".
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { CATEGORY_LINK, CATEGORY_NAMES } from "./_shared";

export const categoriesStories = defineDesign({
  id: "categories-stories",
  version: 1,
  category: "categories",
  subcategory: "circles",
  name: L("دوائر ستوري", "Story rings"),
  description: L("صف دوائر بحلقات ملونة مثل الستوري، والأول عليه علامة جديد.", "A row of ringed circles like stories, the first marked new."),
  keywords: ["categories", "stories", "circles", "ستوري", "دوائر", "أقسام"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories"), style: { paddingTop: 32, paddingBottom: 32 } }, [
      t.container(
        [
          t.row([t.heading(L("الأقسام", "Categories"), "h2", { role: "title", style: { fontSize: "xl" } }), t.textLink(L("الكل", "All"), CATEGORY_LINK)], {
            label: L("رأس القسم", "Section head"),
            style: { justifyContent: "between", marginBottom: 20 },
          }),
          t.grid(
            CATEGORY_NAMES.map((name, i) =>
              t.link(
                CATEGORY_LINK,
                [
                  t.box(
                    [
                      t.photo(i, name, { style: { aspectRatio: "square", objectFit: "cover", radius: 999, borderWidth: 3, borderColor: "background" } }),
                      ...(i === 0
                        ? [
                            t.badge(L("جديد", "New"), {
                              style: {
                                position: "absolute",
                                insetBottom: "-6px",
                                insetStart: "50%",
                                marginStart: -24,
                                background: "primary",
                                color: "primaryInk",
                              },
                            }),
                          ]
                        : []),
                    ],
                    {
                      label: L("الحلقة", "Ring"),
                      style: {
                        position: "relative",
                        radius: 999,
                        background: i === 0 ? "primary" : "accent",
                        paddingTop: 3,
                        paddingBottom: 3,
                        paddingStart: 3,
                        paddingEnd: 3,
                      },
                    },
                  ),
                  t.text(name, { style: { textAlign: "center", fontWeight: "medium", marginTop: 10, fontSize: "xs" } }),
                ],
                { label: L("قسم", "Category"), style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 } },
              ),
            ),
            { label: L("الأقسام", "Categories"), role: "items", columns: { desktop: 8, tablet: 6, mobile: 4 }, style: { gap: 20 }, mobile: { gap: 12 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
