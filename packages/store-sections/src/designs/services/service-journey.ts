/**
 * Repair journey (Services W-g): four steps on one line, each a numbered disc
 * on a rule with a heading, one line and a duration chip; a sun pill with the
 * average turnaround closes the line. Mobile stacks the steps (the rule hides).
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { numberDisc } from "./_shared";

const STEPS = [
  {
    title: L("استلام", "Drop-off"),
    text: L("في الفرع أو مع المندوب", "In store or by courier"),
    time: L("١٠ دقايق", "10 min"),
  },
  {
    title: L("فحص", "Diagnosis"),
    text: L("بنبعتلك السعر قبل أي تصليح", "We send the price before any work"),
    time: L("ساعتين", "2 h"),
  },
  {
    title: L("تصليح", "Repair"),
    text: L("قطع أصلية وضمان ٣ شهور", "Genuine parts, 3-month warranty"),
    time: L("٤ ساعات", "4 h"),
  },
  {
    title: L("تسليم", "Return"),
    text: L("نكلمك يوم ما يخلص", "We call you the day it is ready"),
    time: L("نفس اليوم", "Same day"),
  },
];

export const serviceJourney = defineDesign({
  id: "service-journey",
  version: 1,
  category: "services",
  subcategory: "process",
  name: L("الصيانة بتمشي إزاي", "Repair journey"),
  description: L(
    "خطوات الصيانة على خط واحد بمدة كل خطوة، والمدة الكلية في الآخر.",
    "The repair steps on one line with each step's time, and the total at the end.",
  ),
  keywords: [
    "services",
    "repair",
    "steps",
    "process",
    "timeline",
    "صيانة",
    "خطوات",
    "مدة",
  ],
  tree: (t) =>
    t.section({ label: L("رحلة الصيانة", "Repair journey") }, [
      t.container(
        [
          sectionHead(t, {
            eyebrow: L("الصيانة", "Repair"),
            title: L("جهازك هيرجع إمتى؟", "When do you get it back?"),
          }),
          t.grid(
            STEPS.map((s, i) =>
              t.stack(
                [
                  t.row(
                    [
                      numberDisc(t, i + 1),
                      t.box([], {
                        label: L("الخط", "Rule"),
                        style: {
                          background: "border",
                          minHeight: 2,
                          width: "70%",
                        },
                        mobile: { hidden: true },
                      }),
                    ],
                    {
                      label: L("الرقم", "Marker"),
                      style: { gap: 10, wrap: false, alignItems: "center", width: "100%" },
                    },
                  ),
                  t.heading(s.title, "h3", {
                    style: { fontSize: "xl", marginTop: 6 },
                  }),
                  t.paragraph(s.text, { style: { fontSize: "sm" } }),
                  t.row(
                    [
                      t.icon("clock", {
                        style: { fontSize: "sm", color: "primary" },
                      }),
                      t.text(s.time, {
                        style: { fontSize: "xs", fontWeight: "semibold" },
                      }),
                    ],
                    {
                      label: L("المدة", "Duration"),
                      style: {
                        gap: 6,
                        wrap: false,
                        background: "secondary",
                        radius: 999,
                        paddingTop: 4,
                        paddingBottom: 4,
                        paddingStart: 12,
                        paddingEnd: 12,
                      },
                    },
                  ),
                ],
                {
                  label: L("خطوة", "Step"),
                  style: { gap: 8, alignItems: "start" },
                },
              ),
            ),
            {
              label: L("الخطوات", "Steps"),
              role: "items",
              columns: { desktop: 4, mobile: 1 },
              style: { gap: 20, marginTop: 32 },
              mobile: { gap: 24, marginTop: 24 },
            },
          ),
          t.row(
            [
              t.row(
                [
                  t.text(
                    L("في المتوسط بيرجعلك خلال", "On average back within"),
                    { style: { fontSize: "sm" } },
                  ),
                  t.text(L("٢٤ ساعة", "24 hours"), {
                    role: "value",
                    style: { fontWeight: "bold" },
                  }),
                ],
                {
                  label: L("المدة الكلية", "Total time"),
                  style: {
                    gap: 6,
                    background: "accent",
                    color: "foreground",
                    radius: 999,
                    paddingTop: 10,
                    paddingBottom: 10,
                    paddingStart: 20,
                    paddingEnd: 20,
                  },
                },
              ),
            ],
            { label: L("الخاتمة", "Total"), style: { marginTop: 32 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
