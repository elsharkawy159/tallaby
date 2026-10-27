/**
 * Classic FAQs (library Q-a, Classic template FAQ page): a sticky group list
 * on the start side; on the end side group headings with accordion rows and a
 * soft "still have a question?" card with WhatsApp and contact buttons.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FAQ_GROUPS } from "./_faq";

export const faqClassic = defineDesign({
  id: "faq-classic",
  version: 1,
  category: "faq",
  subcategory: "grouped",
  name: L("أسئلة كلاسيك", "Classic FAQs"),
  description: L("قائمة مجموعات جانبية وأسئلة قابلة للفتح وبطاقة مساعدة.", "A side group list, grouped questions and a help card."),
  keywords: ["faq", "questions", "help", "classic", "أسئلة شائعة", "مساعدة", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("الأسئلة الشائعة", "FAQs") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                FAQ_GROUPS.map((g, i) =>
                  t.text(g.name, {
                    style: {
                      fontWeight: "semibold",
                      radius: 12,
                      paddingTop: 10,
                      paddingBottom: 10,
                      paddingStart: 14,
                      paddingEnd: 14,
                      ...(i === 0 && { background: "secondary", color: "primary" }),
                    },
                  }),
                ),
                {
                  label: L("المجموعات", "Groups"),
                  style: { gap: 4, position: "sticky", insetTop: "96px" },
                  mobile: { direction: "row", position: "relative", insetTop: "0px" },
                },
              ),
              t.stack(
                [
                  ...FAQ_GROUPS.map((g, i) =>
                    t.stack(
                      [
                        t.heading(g.name, "h3", { style: { fontSize: "2xl" } }),
                        t.accordion(
                          g.items.map((item, j) => ({ ...item, open: i === 0 && j === 0 })),
                          { label: L("الأسئلة", "Questions"), role: "items" },
                        ),
                      ],
                      {
                        label: L("مجموعة", "Group"),
                        style: { gap: 8 },
                      },
                    ),
                  ),
                  t.row(
                    [
                      t.stack(
                        [
                          t.heading(L("ما زال لديك سؤال؟", "Still have a question?"), "h4", { style: { fontSize: "lg" } }),
                          t.paragraph(L("راسلنا وسيرد عليك شخص حقيقي.", "Message us and a real person will reply.")),
                        ],
                        {
                          label: L("النص", "Copy"),
                          style: { gap: 4 },
                        },
                      ),
                      t.row([t.button(L("واتساب", "WhatsApp"), "https://wa.me/", "solid"), t.button(L("تواصل معنا", "Contact us"), "/contact", "outline")], {
                        label: L("الأزرار", "Buttons"),
                        style: { gap: 10 },
                      }),
                    ],
                    {
                      label: L("بطاقة المساعدة", "Help card"),
                      style: {
                        justifyContent: "between",
                        gap: 16,
                        background: "secondary",
                        radius: 20,
                        paddingTop: 24,
                        paddingBottom: 24,
                        paddingStart: 24,
                        paddingEnd: 24,
                      },
                    },
                  ),
                ],
                { label: L("الأسئلة", "Questions"), style: { gap: 40, colSpan: 3 }, mobile: { colSpan: 1, gap: 28 } },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 4, mobile: 1 }, style: { gap: 48, alignItems: "start" }, mobile: { gap: 20 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
