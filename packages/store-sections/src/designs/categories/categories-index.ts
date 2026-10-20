/**
 * Index list (library C-e): a typographic index of category names set large
 * in a ruled list with numbers and arrows, beside a tall preview photo. On
 * mobile the preview hides and each row stays a full-width link.
 */
import { defineDesign } from "../builder";
import { L, arDigits } from "../_kit";
import { CATEGORY_LINK, CATEGORY_NAMES } from "./_shared";

export const categoriesIndex = defineDesign({
  id: "categories-index",
  version: 1,
  category: "categories",
  subcategory: "editorial",
  name: L("فهرس نصي", "Index list"),
  description: L("أسماء الأقسام بخط كبير في قائمة مرقمة بجانب صورة.", "Category names set large in a numbered list beside a photo."),
  keywords: ["categories", "index", "list", "premium", "فهرس", "قائمة"],
  tree: (t) =>
    t.section({ label: L("الفهرس", "Index") }, [
      t.container(
        [
          t.stack(
            [
              t.badge(L("الفهرس", "Index"), { role: "eyebrow", style: { color: "primary" } }),
              t.heading(L("كل الأقسام", "Every aisle"), "h2", { role: "title", style: { fontSize: "display-sm" } }),
            ],
            { label: L("العنوان", "Heading"), style: { gap: 10, marginBottom: 32 } },
          ),
          t.grid(
            [
              t.stack(
                CATEGORY_NAMES.slice(0, 6).flatMap((name, i) => [
                  ...(i ? [t.divider({ style: { marginTop: 0, marginBottom: 0 } })] : []),
                  t.link(
                    CATEGORY_LINK,
                    [
                      t.row(
                        [
                          t.text(L(arDigits(`0${i + 1}`), `0${i + 1}`), { style: { color: "muted", fontWeight: "semibold", width: "40px" } }),
                          t.heading(name, "h3", { style: { fontSize: "3xl", fontWeight: "bold" }, mobile: { fontSize: "2xl" } }),
                          t.icon("arrow", { style: { fontSize: "xl", color: "primary", marginStart: 0 } }),
                        ],
                        { label: L("السطر", "Row"), style: { gap: 16, justifyContent: "between", wrap: false } },
                      ),
                    ],
                    {
                      label: L("قسم", "Category"),
                      style: { paddingTop: 18, paddingBottom: 18, paddingStart: 0, paddingEnd: 0, hover: { color: "primary" } },
                    },
                  ),
                ]),
                { label: L("القائمة", "List"), role: "items", style: { gap: 0 } },
              ),
              t.photo(0, L("صورة القسم", "Category photo"), {
                role: "image",
                style: { aspectRatio: "portrait", objectFit: "cover", radius: 28 },
                mobile: { hidden: true },
              }),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 2, mobile: 1 }, style: { gap: 64, alignItems: "center" } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
