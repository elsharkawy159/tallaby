/**
 * By the numbers (Valorcy "Footprint"): a centred heading over a row of figure
 * cards on a faint grid. Every piece, the grid and the cards included, is a node.
 */
import { defineDesign } from "../builder";

const L = (ar: string, en: string) => ({ ar, en });

const STATS = [
  { value: "٢٠٢٠", valueEn: "2020", label: L("سنة البداية", "Founded"), sub: L("من القاهرة", "In Cairo") },
  { value: "+١٢ ألف", valueEn: "12k+", label: L("طلب تم توصيله", "Orders delivered"), sub: L("لكل المحافظات", "To every governorate") },
  { value: "٤٫٩", valueEn: "4.9", label: L("متوسط التقييم", "Average rating"), sub: L("من آراء العملاء", "From customer reviews") },
  { value: "٢٤ ساعة", valueEn: "24h", label: L("للرد على الرسائل", "To answer messages"), sub: L("طوال الأسبوع", "Seven days a week") },
];

export const statsCards = defineDesign({
  id: "stats-cards",
  version: 1,
  category: "statistics",
  subcategory: "counters",
  name: L("أرقامنا", "By the numbers"),
  description: L("عنوان في المنتصف فوق صف من الأرقام مع وصف لكل رقم.", "A centred heading over a row of figures, each with a caption."),
  keywords: ["stats", "numbers", "أرقام", "إحصائيات"],
  tree: (t) =>
    t.section({ label: L("أرقامنا", "By the numbers"), style: { background: "secondary" } }, [
      t.pattern("grid", { label: L("خلفية شبكية", "Grid background"), style: { opacity: 60 } }),
      t.container(
        [
          t.stack(
            [
              t.badge(L("بالأرقام", "By the numbers"), { role: "eyebrow", style: { background: "background", color: "primary" } }),
              t.heading(L("ثقة بنيناها طلبًا بعد طلب", "Trust built one order at a time"), "h2", {
                role: "title",
                style: { fontSize: "display-sm", textAlign: "center" },
              }),
              t.paragraph(
                L(
                  "بدأنا متجرًا صغيرًا، واليوم يثق بنا آلاف العملاء في كل محافظات مصر.",
                  "We started as a small shop. Today thousands of customers across Egypt trust us.",
                ),
                { role: "subtitle", style: { textAlign: "center", maxWidth: "640px", fontSize: "lg" } },
              ),
            ],
            { label: L("العنوان", "Heading"), role: "intro", style: { alignItems: "center", gap: 12 } },
          ),
          t.grid(
            STATS.map((stat) =>
              t.card(
                [
                  t.heading(L(stat.value, stat.valueEn), "h3", { style: { fontSize: "display-md", fontWeight: "semibold", lineHeight: "tight" } }),
                  t.text(stat.label, { style: { fontWeight: "semibold", fontSize: "md", marginTop: 12 } }),
                  t.text(stat.sub, { style: { color: "muted", marginTop: 4 } }),
                ],
                { label: L("رقم", "Stat"), style: { textAlign: "center", paddingTop: 32, paddingBottom: 32 } },
              ),
            ),
            {
              label: L("الأرقام", "Stats"),
              role: "items",
              columns: { desktop: 4, tablet: 2, mobile: 2 },
              style: { gap: 16, marginTop: 48 },
              mobile: { gap: 12, marginTop: 32 },
            },
          ),
        ],
        { label: L("المحتوى", "Content") },
      ),
    ]),
});
