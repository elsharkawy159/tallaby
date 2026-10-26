/**
 * By the numbers (library Y-i): a brand band with a short label and three
 * huge figures side by side, each with a one-line caption, split by thin
 * vertical rules. The figures are typed by the seller. On mobile the figures
 * stack as rows with horizontal rules.
 */
import type { NodeTemplate } from "../../elements/tree";
import type { TreeBuilder } from "../builder";
import { aboutDesign } from "./_rules";
import { L, ON_BRAND, ON_BRAND_BODY } from "../_kit";
import { BIG_NUMBER } from "../_modular";

const FIGURES = [
  { value: L("٥٠ ألف", "50K"), caption: L("عميل رجعلنا تاني", "returning customers") },
  { value: L("٢٧", "27"), caption: L("محافظة بنوصلها", "governorates served") },
  { value: L("٤٫٨", "4.8"), caption: L("متوسط التقييم", "average rating") },
];

const rule = (t: TreeBuilder): NodeTemplate =>
  t.box([], {
    label: L("الفاصل", "Rule"),
    style: { background: "primaryInk", opacity: 25, width: "1px" },
    mobile: { width: "100%", minHeight: 1 },
  });

export const teamNumbers = aboutDesign({
  id: "team-numbers",
  version: 2,
  category: "about",
  subcategory: "values",
  name: L("بالأرقام", "By the numbers"),
  description: L("شريط بلون المتجر فيه تلات أرقام كبيرة عن المتجر.", "A brand band with three big figures about the store."),
  keywords: ["about", "numbers", "stats", "figures", "من نحن", "أرقام", "إحصائيات"],
  tree: (t) =>
    t.section({ label: L("بالأرقام", "By the numbers"), style: { background: "primary" } }, [
      t.container(
        [
          t.text(L("٧ سنين في أرقام", "Seven years in numbers"), {
            role: "eyebrow",
            style: { ...ON_BRAND_BODY, fontSize: "sm", fontWeight: "semibold", marginBottom: 24 },
          }),
          t.row(
            FIGURES.flatMap((f, i) => [
              ...(i ? [rule(t)] : []),
              t.stack(
                [
                  t.text(f.value, { role: "value", style: { ...BIG_NUMBER, ...ON_BRAND, fontSize: "6xl" }, mobile: { fontSize: "5xl" } }),
                  t.text(f.caption, { style: { ...ON_BRAND_BODY, fontSize: "lg" }, mobile: { fontSize: "md" } }),
                ],
                {
                  label: L("رقم", "Figure"),
                  style: { gap: 8, width: "30%", paddingStart: i ? 32 : 0, paddingEnd: 16 },
                  mobile: { width: "100%", paddingStart: 0, paddingEnd: 0, paddingTop: 16, paddingBottom: 16 },
                },
              ),
            ]),
            {
              label: L("الأرقام", "Figures"),
              role: "items",
              style: { gap: 0, wrap: false, alignItems: "stretch" },
              mobile: { direction: "column" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
