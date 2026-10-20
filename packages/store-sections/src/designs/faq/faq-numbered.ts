/**
 * Numbered (Modular set): four important questions, each with a large number
 * beside it and hairline rules between; each opens to its answer. For a few
 * key questions on a landing page.
 */
import { defineDesign } from "../builder";
import { L, N } from "../_kit";
import { BIG_NUMBER, modHead } from "../_modular";
import { FAQ_ITEMS } from "./_faq";

export const faqNumbered = defineDesign({
  id: "faq-numbered",
  version: 1,
  category: "faq",
  subcategory: "side-title",
  name: L("مرقمة", "Numbered"),
  description: L("أهم الأسئلة بأرقام كبيرة وخطوط رفيعة بينها.", "Your key questions with big numbers and hairlines between them."),
  keywords: ["faq", "numbered", "editorial", "landing", "أسئلة", "مرقمة"],
  tree: (t) =>
    t.section({ label: L("الأسئلة الشائعة", "FAQ") }, [
      t.container(
        [
          modHead(t, {
            label: L("قبل ما تطلب", "Before you order"),
            title: L("أسئلة مهمة", "Good to know"),
          }),
          t.stack(
            FAQ_ITEMS.slice(0, 4).map((q, i) =>
              t.row(
                [
                  t.text(N(`0${i + 1}`), {
                    style: {
                      ...BIG_NUMBER,
                      fontSize: "3xl",
                      color: "muted",
                      width: "64px",
                      paddingTop: 10,
                    },
                    mobile: { fontSize: "xl", width: "36px" },
                  }),
                  t.stack(
                    [
                      t.accordion([{ ...q, open: i === 0 }], {
                        label: L("السؤال", "Question"),
                      }),
                    ],
                    {
                      label: L("المحتوى", "Content"),
                      style: { width: "100%" },
                    },
                  ),
                ],
                {
                  label: L("سؤال", "Question row"),
                  style: {
                    background: "background",
                    gap: 16,
                    wrap: false,
                    alignItems: "start",
                    paddingTop: 12,
                    paddingBottom: 12,
                  },
                },
              ),
            ),
            {
              label: L("الأسئلة", "Questions"),
              role: "items",
              style: {
                gap: 1,
                background: "border",
                paddingTop: 1,
                paddingBottom: 1,
              },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
