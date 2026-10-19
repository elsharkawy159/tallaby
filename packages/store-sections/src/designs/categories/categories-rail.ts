/**
 * Side-title rail (library C-c): a title column with an intro on the start
 * side, and tall numbered photo cards with a paper name plate beside it.
 */
import { defineDesign } from "../builder";
import { L, arrowLink } from "../_kit";
import { CATEGORY_LINK, CATEGORY_NAMES } from "./_shared";

const NUMBERS = [L("٠١", "01"), L("٠٢", "02"), L("٠٣", "03")];

export const categoriesRail = defineDesign({
  id: "categories-rail",
  version: 1,
  category: "categories",
  subcategory: "editorial",
  name: L("شريط بعنوان جانبي", "Side-title rail"),
  description: L("عنوان ونبذة في عمود جانبي، وبجانبه بطاقات طويلة مرقمة للأقسام.", "A side title column beside tall, numbered category cards."),
  keywords: ["categories", "editorial", "magazine", "أقسام", "مجلة"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.badge(L("اكتشف", "Discover"), { role: "eyebrow", style: { color: "primary" } }),
                  t.heading(L("عالم كامل في كل قسم", "A whole world in every aisle"), "h2", { role: "title", style: { fontSize: "display-sm" } }),
                  t.paragraph(L("اختر من أقسامنا؛ في كل قسم أفضل ما جربناه.", "Pick an aisle; each one holds the best we have tested."), { role: "body" }),
                  arrowLink(t, L("كل الأقسام", "All categories"), CATEGORY_LINK),
                ],
                { label: L("العنوان", "Heading"), style: { gap: 14, alignItems: "start", paddingTop: 16 } },
              ),
              ...CATEGORY_NAMES.slice(0, 3).map((name, i) =>
                t.link(
                  CATEGORY_LINK,
                  [
                    t.photo(i + 1, name, { style: { aspectRatio: "portrait", objectFit: "cover", radius: 24 } }),
                    t.text(NUMBERS[i]!, {
                      style: { position: "absolute", insetTop: "16px", insetStart: "16px", fontWeight: "extrabold", fontSize: "xl", color: "white" },
                    }),
                    t.stack(
                      [
                        t.text(name, { style: { fontWeight: "bold", fontSize: "md" } }),
                        t.text(L("تسوّق الآن", "Shop now"), { style: { color: "primary", fontSize: "xs" } }),
                      ],
                      {
                        label: L("لوحة الاسم", "Name plate"),
                        style: {
                          position: "absolute",
                          insetBottom: "14px",
                          insetStart: "14px",
                          insetEnd: "14px",
                          background: "background",
                          radius: 14,
                          gap: 2,
                          paddingTop: 12,
                          paddingBottom: 12,
                          paddingStart: 14,
                          paddingEnd: 14,
                        },
                      },
                    ),
                  ],
                  {
                    label: L("قسم", "Category"),
                    style: { position: "relative", paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, hover: { opacity: 92 } },
                  },
                ),
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 4, tablet: 2, mobile: 1 }, style: { gap: 20 }, mobile: { gap: 16 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
