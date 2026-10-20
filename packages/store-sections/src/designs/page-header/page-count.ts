/**
 * Big count (Modular set): the product count set huge in a sun circle on the
 * end side, and the breadcrumb, title, line and a "new this week" chip on the
 * start side. Makes a collection feel full and alive.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { BIG_NUMBER } from "../_modular";
import { crumbs } from "./_crumbs";

export const pageCount = defineDesign({
  id: "page-count",
  version: 1,
  category: "page-header",
  subcategory: "promo",
  name: L("رقم كبير", "Big count"),
  description: L("عدد المنتجات ضخم في دائرة ملوّنة بجانب العنوان.", "The product count huge in a bright circle beside the title."),
  keywords: ["page header", "collection", "count", "playful", "عنوان", "عدد", "قسم"],
  tree: (t) =>
    t.section({ label: L("عنوان الصفحة", "Page header") }, [
      t.container(
        [
          t.row(
            [
              t.stack(
                [
                  crumbs(t, [], L("سماعات", "Audio")),
                  t.heading(L("سماعات", "Audio"), "h1", {
                    role: "title",
                    style: { fontSize: "display-md", letterSpacing: "tight" },
                  }),
                  t.paragraph(L("منتجات أصلية بضمان محلي.", "Genuine products with local warranty."), { role: "subtitle" }),
                  t.badge(L("٦ جديد الأسبوع ده", "6 new this week"), {
                    style: {
                      background: "secondary",
                      color: "primary",
                      fontWeight: "semibold",
                    },
                  }),
                ],
                {
                  label: L("النص", "Copy"),
                  style: { gap: 12, alignItems: "start" },
                },
              ),
              t.stack(
                [
                  t.text(L("٢٤", "24"), {
                    role: "count",
                    style: {
                      ...BIG_NUMBER,
                      fontSize: "display-lg",
                      textAlign: "center",
                      color: "foreground",
                    },
                  }),
                  t.text(L("منتج", "products"), {
                    style: {
                      fontWeight: "semibold",
                      textAlign: "center",
                      color: "foreground",
                    },
                  }),
                ],
                {
                  label: L("الدائرة", "Circle"),
                  style: {
                    background: "accent",
                    radius: 999,
                    width: "200px",
                    minHeight: 200,
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 0,
                  },
                  mobile: { width: "120px", minHeight: 120 },
                },
              ),
            ],
            {
              label: L("المحتوى", "Content"),
              style: {
                justifyContent: "between",
                alignItems: "center",
                gap: 32,
                wrap: false,
              },
              mobile: { gap: 16 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
