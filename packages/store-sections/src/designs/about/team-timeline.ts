/**
 * Our journey (library Y-b): years in very large figures above a hairline
 * with a dot, each with a short milestone under it; the latest year is in
 * brand colour with a sun dot. Shows how the store grew. Two per row on
 * mobile.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { BIG_NUMBER, modHead } from "../_modular";

const MILESTONES = [
  { year: L("٢٠١٩", "2019"), text: L("أول ١٠ طلبات على واتساب", "First 10 orders on WhatsApp") },
  { year: L("٢٠٢١", "2021"), text: L("أول مخزن في الجيزة", "First warehouse in Giza") },
  { year: L("٢٠٢٣", "2023"), text: L("التوصيل لكل المحافظات", "Delivery to every governorate") },
  { year: L("٢٠٢٦", "2026"), text: L("٥٠ ألف عميل وفرعين", "50,000 customers and two branches") },
];

export const teamTimeline = defineDesign({
  id: "team-timeline",
  version: 1,
  category: "about",
  subcategory: "story",
  name: L("رحلتنا", "Our journey"),
  description: L("سنين كبيرة على خط زمني، وتحت كل سنة اللي حصل فيها.", "Big years on a timeline, each with what happened that year."),
  keywords: ["about", "timeline", "journey", "history", "milestones", "من نحن", "رحلتنا", "تاريخ"],
  tree: (t) =>
    t.section({ label: L("رحلتنا", "Our journey") }, [
      t.container(
        [
          modHead(t, { label: L("رحلتنا", "Our journey"), title: L("من ٢٠١٩ لحد النهارده", "From 2019 to today") }),
          t.grid(
            MILESTONES.map((m, i) => {
              const now = i === MILESTONES.length - 1;
              return t.stack(
                [
                  t.text(m.year, {
                    role: "value",
                    style: { ...BIG_NUMBER, fontSize: "6xl", color: now ? "primary" : "muted", opacity: now ? 100 : 60 },
                    mobile: { fontSize: "5xl" },
                  }),
                  t.box(
                    [
                      t.box([], {
                        label: L("النقطة", "Dot"),
                        style: {
                          position: "absolute",
                          insetTop: "-5px",
                          insetStart: "0px",
                          width: "12px",
                          minHeight: 12,
                          radius: 999,
                          background: now ? "accent" : "foreground",
                        },
                      }),
                    ],
                    {
                      label: L("الخط", "Line"),
                      style: { position: "relative", background: "border", minHeight: 2 },
                    },
                  ),
                  t.paragraph(m.text, { style: { fontSize: "md" } }),
                ],
                { label: L("محطة", "Milestone"), style: { gap: 14 } },
              );
            }),
            {
              label: L("الخط الزمني", "Timeline"),
              role: "items",
              columns: { desktop: 4, mobile: 2 },
              style: { gap: 24 },
              mobile: { gap: 16 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
