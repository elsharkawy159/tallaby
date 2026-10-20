/**
 * Branch list (library K-c): city chips over a grid of branch cards; each
 * card shows the area, city, hours, phone, an open label and a directions link.
 */
import { defineDesign } from "../builder";
import { L, PAPER_CARD, arrowLink, sectionHead } from "../_kit";

const BRANCHES = [
  { name: L("الدقي", "Dokki"), city: L("الجيزة", "Giza"), open: true },
  { name: L("مدينة نصر", "Nasr City"), city: L("القاهرة", "Cairo"), open: true },
  { name: L("سموحة", "Smouha"), city: L("الإسكندرية", "Alexandria"), open: false },
  { name: L("المعادي", "Maadi"), city: L("القاهرة", "Cairo"), open: true },
];

const CITIES = [L("الكل", "All"), L("القاهرة", "Cairo"), L("الجيزة", "Giza"), L("الإسكندرية", "Alexandria")];

export const contactBranches = defineDesign({
  id: "contact-branches",
  version: 1,
  category: "contact",
  subcategory: "address",
  name: L("فروعنا", "Our branches"),
  description: L("بطاقات الفروع بالمدينة والمواعيد والهاتف ورابط الاتجاهات.", "Branch cards with city, hours, phone and a directions link."),
  keywords: ["branches", "stores", "locations", "فروع", "عناوين"],
  tree: (t) =>
    t.section({ label: L("فروعنا", "Our branches") }, [
      t.container(
        [
          sectionHead(t, { title: L("فروعنا", "Our branches") }),
          t.row(
            CITIES.map((c, i) =>
              t.badge(c, {
                style: {
                  fontSize: "sm",
                  paddingTop: 8,
                  paddingBottom: 8,
                  paddingStart: 16,
                  paddingEnd: 16,
                  ...(i === 0 && { background: "primary", color: "primaryInk" }),
                },
              }),
            ),
            { label: L("المدن", "Cities"), style: { gap: 8, marginTop: 16, marginBottom: 24 } },
          ),
          t.grid(
            BRANCHES.map((b) =>
              t.stack(
                [
                  t.row(
                    [
                      t.heading(b.name, "h3", { style: { fontSize: "lg" } }),
                      t.badge(b.open ? L("مفتوح", "Open") : L("مغلق", "Closed"), {
                        style: b.open ? { background: "secondary", color: "primary" } : { color: "muted" },
                      }),
                    ],
                    {
                      label: L("الرأس", "Head"),
                      style: { justifyContent: "between", gap: 8 },
                    },
                  ),
                  t.text(b.city, { style: { color: "muted" } }),
                  t.row([t.icon("clock", { style: { color: "primary" } }), t.text(L("١٠ ص – ١٠ م", "10am – 10pm"))], {
                    label: L("المواعيد", "Hours"),
                    style: { gap: 8 },
                  }),
                  t.row([t.icon("phone", { style: { color: "primary" } }), t.text(L("٠١٠٠ ١٢٣ ٤٥٦٧", "+20 100 123 4567"))], {
                    label: L("الهاتف", "Phone"),
                    style: { gap: 8 },
                  }),
                  arrowLink(t, L("الاتجاهات", "Directions"), "https://maps.google.com/", { style: { marginTop: 6 } }),
                ],
                { label: L("فرع", "Branch"), style: { ...PAPER_CARD, gap: 10, paddingTop: 22, paddingBottom: 22, paddingStart: 22, paddingEnd: 22 } },
              ),
            ),
            { label: L("الفروع", "Branches"), role: "items", columns: { desktop: 4, tablet: 2, mobile: 1 }, style: { gap: 16 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
