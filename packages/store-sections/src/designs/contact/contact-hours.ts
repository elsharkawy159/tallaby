/**
 * Hours table (Modular set): a ruled seven-day hours table on the end side
 * with one day highlighted, and the address, phone and WhatsApp as a plain
 * list on the start side. For a shop whose hours change through the week.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH, RULED, dotLabel } from "../_modular";
import { CHANNELS } from "./_shared";

const DAYS = [
  { day: L("السبت", "Saturday"), hours: L("١٠ ص – ١٠ م", "10am – 10pm") },
  { day: L("الأحد", "Sunday"), hours: L("١٠ ص – ١٠ م", "10am – 10pm") },
  { day: L("الاتنين", "Monday"), hours: L("١٠ ص – ١٠ م", "10am – 10pm") },
  { day: L("التلات", "Tuesday"), hours: L("١٠ ص – ١٠ م", "10am – 10pm") },
  { day: L("الأربع", "Wednesday"), hours: L("١٠ ص – ١٠ م", "10am – 10pm") },
  { day: L("الخميس", "Thursday"), hours: L("١٠ ص – ١١ م", "10am – 11pm") },
  { day: L("الجمعة", "Friday"), hours: L("٢ م – ١٠ م", "2pm – 10pm") },
];

export const contactHours = defineDesign({
  id: "contact-hours",
  version: 1,
  category: "contact",
  subcategory: "address",
  name: L("جدول المواعيد", "Hours table"),
  description: L("مواعيد الأسبوع في جدول، وجنبه العنوان والتليفون.", "Your weekly hours in a table beside the address and phone."),
  keywords: ["contact", "hours", "opening times", "address", "تواصل", "مواعيد", "عنوان"],
  tree: (t) =>
    t.section({ label: L("المواعيد", "Hours") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  dotLabel(t, L("زورنا", "Visit")),
                  t.heading(L("المواعيد والعنوان", "Hours and address"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", letterSpacing: "tight" },
                  }),
                  t.stack(
                    [CHANNELS[3]!, CHANNELS[1]!, CHANNELS[0]!].map((c) =>
                      t.link(
                        c.href,
                        [
                          t.row(
                            [
                              t.icon(c.icon, {
                                style: { fontSize: "lg", color: "primary" },
                              }),
                              t.text(c.value, {
                                style: { fontWeight: "medium" },
                              }),
                            ],
                            {
                              label: L("المحتوى", "Content"),
                              style: { gap: 12 },
                            },
                          ),
                        ],
                        {
                          label: c.label,
                          style: {
                            ...FLUSH,
                            paddingTop: 6,
                            paddingBottom: 6,
                            hover: { color: "primary" },
                          },
                        },
                      ),
                    ),
                    {
                      label: L("بيانات التواصل", "Contact details"),
                      style: { gap: 4 },
                    },
                  ),
                ],
                { label: L("العنوان", "Heading"), style: { gap: 16 } },
              ),
              t.stack(
                DAYS.map((d, i) => {
                  const today = i === 4;
                  return t.row(
                    [
                      t.row(
                        [
                          t.text(d.day, {
                            style: { fontWeight: today ? "bold" : "medium" },
                          }),
                          ...(today
                            ? [
                                t.badge(L("النهارده", "Today"), {
                                  style: {
                                    background: "accent",
                                    color: "foreground",
                                  },
                                }),
                              ]
                            : []),
                        ],
                        { label: L("اليوم", "Day"), style: { gap: 8 } },
                      ),
                      t.text(d.hours, {
                        style: {
                          fontWeight: today ? "bold" : "normal",
                          color: today ? "foreground" : "muted",
                        },
                      }),
                    ],
                    {
                      label: L("يوم", "Day row"),
                      style: {
                        justifyContent: "between",
                        gap: 12,
                        background: today ? "secondary" : "background",
                        paddingTop: 14,
                        paddingBottom: 14,
                        paddingStart: 20,
                        paddingEnd: 20,
                      },
                    },
                  );
                }),
                { label: L("الجدول", "Table"), role: "items", style: RULED },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 56, alignItems: "start" },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
