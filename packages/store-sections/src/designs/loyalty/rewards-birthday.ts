/**
 * Birthday gift (library A-g, reworked): a shelf card split in two, a big
 * calendar-page date block on the start side and the birthday offer with one
 * of the store's forms on the end side. The design promises points; the
 * store has no points, so the default text promises a gift the seller sends
 * by message, and the form (one with a name, phone and birthday field) only
 * collects the date into the seller's inbox. Nothing is sent automatically.
 * With no form picked the section shows nothing publicly. Mobile stacks.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const rewardsBirthday = defineDesign({
  id: "rewards-birthday",
  version: 1,
  category: "loyalty",
  subcategory: "occasions",
  name: L("هدية عيد ميلادك", "Birthday gift"),
  description: L(
    "تاريخ كبير بشكل نتيجة ونموذج يجمع أعياد ميلاد عملائك في صندوق الوارد؛ الهدية بتبعتها انت.",
    "A big calendar-page date and a form that collects customers' birthdays in your inbox; you send the gift.",
  ),
  keywords: [
    "birthday",
    "gift",
    "occasion",
    "form",
    "loyalty",
    "عيد ميلاد",
    "هدية",
    "مناسبة",
  ],
  tree: (t) =>
    t.section({ label: L("عيد الميلاد", "Birthday") }, [
      t.container(
        [
          t.row(
            [
              t.stack(
                [
                  t.box([], {
                    label: L("شريط النتيجة", "Calendar band"),
                    style: {
                      background: "primary",
                      minHeight: 14,
                      width: "100%",
                    },
                  }),
                  t.stack(
                    [
                      t.text(L("يوم", "Day"), {
                        style: { fontSize: "sm", color: "muted" },
                      }),
                      t.text(L("١٤", "14"), {
                        role: "value",
                        style: {
                          fontSize: "6xl",
                          fontWeight: "bold",
                          letterSpacing: "tight",
                          lineHeight: "tight",
                        },
                        mobile: { fontSize: "5xl" },
                      }),
                      t.text(L("مارس", "March"), {
                        style: { fontSize: "xl", fontWeight: "semibold" },
                      }),
                    ],
                    {
                      label: L("التاريخ", "Date"),
                      style: {
                        gap: 2,
                        alignItems: "center",
                        paddingTop: 20,
                        paddingBottom: 24,
                        paddingStart: 16,
                        paddingEnd: 16,
                      },
                      mobile: { paddingTop: 12, paddingBottom: 14 },
                    },
                  ),
                ],
                {
                  label: L("ورقة النتيجة", "Calendar page"),
                  style: {
                    width: "240px",
                    background: "background",
                    borderWidth: 1,
                    borderColor: "border",
                    radius: 24,
                    overflow: "hidden",
                    gap: 0,
                  },
                  mobile: { width: "100%" },
                },
              ),
              t.stack(
                [
                  t.heading(
                    L("عيد ميلادك عندنا هدية", "A gift on your birthday"),
                    "h2",
                    {
                      role: "title",
                      style: { fontSize: "display-sm", letterSpacing: "tight" },
                    },
                  ),
                  t.paragraph(
                    L(
                      "سيبلنا تاريخ ميلادك، وفي أسبوع عيد ميلادك هنبعتلك هدية مننا في رسالة.",
                      "Leave us your birthday and we'll message you a gift from us in your birthday week.",
                    ),
                    { role: "subtitle", style: { fontSize: "lg" } },
                  ),
                  t.box([t.storeForm()], {
                    label: L("النموذج", "Form box"),
                    style: {
                      width: "100%",
                      background: "background",
                      radius: 20,
                      marginTop: 4,
                      paddingTop: 20,
                      paddingBottom: 20,
                      paddingStart: 20,
                      paddingEnd: 20,
                    },
                    mobile: {
                      paddingTop: 16,
                      paddingBottom: 16,
                      paddingStart: 14,
                      paddingEnd: 14,
                    },
                  }),
                ],
                {
                  label: L("المحتوى", "Content"),
                  style: { gap: 12, width: "100%" },
                },
              ),
            ],
            {
              label: L("البطاقة", "Card"),
              style: {
                gap: 40,
                wrap: false,
                alignItems: "center",
                background: "secondary",
                radius: 24,
                paddingTop: 32,
                paddingBottom: 32,
                paddingStart: 32,
                paddingEnd: 32,
              },
              mobile: {
                direction: "column",
                alignItems: "stretch",
                gap: 22,
                paddingTop: 20,
                paddingBottom: 20,
                paddingStart: 20,
                paddingEnd: 20,
              },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
