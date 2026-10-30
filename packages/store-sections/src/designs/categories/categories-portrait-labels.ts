/**
 * Portrait collections (2026-10-30, after the Void Fashion store on
 * EasyOrders): a left-aligned "Collections" heading, then tall portrait
 * photos with square corners, each with the collection name in capitals and a
 * small underlined "Shop now" link under it. Four across on desktop, three on
 * tablets, and a swipe row on phones. No product count, for fashion stores.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { CATEGORY_LINK } from "./_shared";

export const categoriesPortraitLabels = defineDesign({
  id: "categories-portrait-labels",
  version: 1,
  category: "categories",
  subcategory: "collections",
  name: L("أقسام طولية بزر تسوّق", "Portrait collections"),
  description: L(
    "صور أقسام طولية بحواف حادة، وتحت كل صورة اسم القسم ورابط تسوّق الآن، وعلى الجوال تُسحب جانبيًا.",
    "Tall square-cornered category photos, each with its name and a Shop now link underneath; a swipe row on phones.",
  ),
  keywords: ["categories", "collections", "portrait", "fashion", "shop now", "rail", "أقسام", "مجموعات", "طولي", "أزياء"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories") }, [
      t.container(
        [
          t.stack(
            [
              t.heading(L("المجموعات", "Collections"), "h2", { role: "title", style: { fontSize: "display-sm", lineHeight: "tight" } }),
              t.categoryList(
                [
                  t.stack(
                    [
                      t.link(
                        CATEGORY_LINK,
                        [
                          t.image("", L("صورة القسم", "Category photo"), {
                            bind: "image",
                            role: "image",
                            style: { aspectRatio: "portrait", objectFit: "cover", width: "100%", background: "secondary" },
                          }),
                        ],
                        {
                          label: L("الصورة", "Photo"),
                          bind: "href",
                          style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, radius: 0, overflow: "hidden", background: "secondary" },
                        },
                      ),
                      t.stack(
                        [
                          t.text(L("اسم القسم", "Category"), { bind: "name", style: { fontWeight: "semibold", fontSize: "md", textAlign: "center" } }),
                          t.link(CATEGORY_LINK, [t.text(L("تسوّق الآن", "Shop now"), { style: { fontSize: "xs", fontWeight: "medium", textAlign: "center" } })], {
                            label: L("رابط التسوق", "Shop link"),
                            bind: "href",
                            style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, color: "foreground", underline: true, hover: { opacity: 70 } },
                          }),
                        ],
                        { label: L("التعليق", "Caption"), style: { gap: 4, alignItems: "center" } },
                      ),
                    ],
                    { label: L("قسم", "Category"), style: { gap: 12 }, mobile: { gap: 10 } },
                  ),
                ],
                {
                  label: L("الأقسام", "Categories"),
                  role: "items",
                  limit: 4,
                  mobileRail: true,
                  columns: { desktop: 4, tablet: 3, mobile: 2 },
                  style: { gap: 20 },
                  tablet: { gap: 16 },
                  mobile: { gap: 12 },
                },
              ),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 24 }, mobile: { gap: 16 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
