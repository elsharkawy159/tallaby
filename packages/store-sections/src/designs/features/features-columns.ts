/**
 * Plain columns (2026-10-29, after the WoodMart "Accessories" demo): a
 * centred head (brand line, title, muted line) over three open columns, each
 * a brand coloured icon, a title and two muted lines, all centred, with no
 * cards. Phones stack the columns.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { centeredHead } from "../_centered";

const COLUMNS = [
  { icon: "truck", title: L("توصيل سريع", "Fast delivery"), text: L("من يوم لـ ٤ أيام لكل المحافظات، وتتبّع طلبك خطوة بخطوة.", "One to four days to every governorate, with tracking at every step.") },
  { icon: "shield", title: L("جودة مضمونة", "Best quality"), text: L("كل منتج بيتراجع قبل ما يتغلف، ومعاه ضمان.", "Every product is checked before it is packed, and comes with a warranty.") },
  { icon: "rotate", title: L("استرجاع سهل", "Easy returns"), text: L("١٤ يوم تغيّر فيهم رأيك من غير أسئلة كتير.", "Fourteen days to change your mind, no fuss.") },
] as const;

export const featuresColumns = defineDesign({
  id: "features-columns",
  version: 1,
  category: "features",
  subcategory: "icon-grid",
  name: L("أعمدة بسيطة", "Plain columns"),
  description: L("عنوان في النص وتحته ٣ أعمدة مفتوحة: أيقونة وعنوان وسطرين.", "A centred heading over three open columns: an icon, a title and two lines."),
  keywords: ["features", "benefits", "columns", "icons", "why us", "مميزات", "أعمدة", "ليه احنا"],
  tree: (t) =>
    t.section({ label: L("المميزات", "Features") }, [
      t.container(
        [
          t.stack(
            [
              centeredHead(t, {
                eyebrow: L("ليه تشتري مننا", "Why shop with us"),
                title: L("بنوفّر لك منتجات بجودة عالية", "We provide high quality goods"),
                subtitle: L("التفاصيل اللي بتفرق في كل طلب.", "The details that make a difference in every order."),
              }),
              t.grid(
                COLUMNS.map((c) =>
                  t.stack(
                    [
                      t.icon(c.icon, { style: { color: "primary", fontSize: "3xl" } }),
                      t.text(c.title, { style: { fontWeight: "semibold", fontSize: "lg", textAlign: "center" } }),
                      t.paragraph(c.text, { style: { color: "muted", textAlign: "center", maxWidth: "320px" } }),
                    ],
                    { label: L("ميزة", "Feature"), style: { gap: 10, alignItems: "center" } },
                  ),
                ),
                { label: L("الأعمدة", "Columns"), role: "items", columns: { desktop: 3, mobile: 1 }, style: { gap: 40 }, mobile: { gap: 28 } },
              ),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 40 }, mobile: { gap: 28 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
