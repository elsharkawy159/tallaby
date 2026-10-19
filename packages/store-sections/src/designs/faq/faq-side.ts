/**
 * Side title (library Q-c): a tinted card with a large heading, a short line
 * and a WhatsApp button on the start side; the accordion on the end side.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FAQ_ITEMS } from "./_faq";

export const faqSide = defineDesign({
  id: "faq-side",
  version: 1,
  category: "faq",
  subcategory: "side-title",
  name: L("أسئلة مع واتساب", "FAQ with WhatsApp"),
  description: L("بطاقة بزر واتساب بجانب الأسئلة الشائعة.", "A WhatsApp card beside your frequently asked questions."),
  keywords: ["faq", "whatsapp", "questions", "أسئلة", "واتساب"],
  tree: (t) =>
    t.section({ label: L("عندك سؤال؟", "Got a question?") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.heading(L("عندك سؤال؟", "Got a question?"), "h2", { role: "title", style: { fontSize: "display-sm" } }),
                  t.paragraph(L("إن لم تجد إجابتك هنا، راسلنا على واتساب.", "If your answer is not here, message us on WhatsApp."), { role: "body" }),
                  t.button(L("راسلنا على واتساب", "Chat on WhatsApp"), "https://wa.me/", "solid", { role: "cta" }),
                ],
                {
                  label: L("بطاقة التواصل", "Contact card"),
                  style: {
                    gap: 14,
                    alignItems: "start",
                    background: "secondary",
                    radius: 24,
                    paddingTop: 32,
                    paddingBottom: 32,
                    paddingStart: 28,
                    paddingEnd: 28,
                    position: "sticky",
                    insetTop: "96px",
                  },
                  mobile: { position: "relative", insetTop: "0px" },
                },
              ),
              t.accordion(
                FAQ_ITEMS.map((item, i) => ({ ...item, open: i === 0 })),
                { label: L("الأسئلة", "Questions"), role: "items", style: { colSpan: 2 }, mobile: { colSpan: 1 } },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 3, mobile: 1 }, style: { gap: 48, alignItems: "start" }, mobile: { gap: 24 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
