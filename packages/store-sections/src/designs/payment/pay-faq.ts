/**
 * Payment questions (U-k): a narrow accordion of payment and delivery
 * questions with the first one open (native disclosure, no script), closed by
 * a chat link for anything else. For the checkout help page or under the
 * payment methods.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH } from "../_modular";
import { payTitle } from "./_shared";

const QUESTIONS = [
  {
    title: L("ينفع أدفع كاش؟", "Can I pay cash?"),
    body: L("أيوه، كاش للمندوب بعد ما تفتح الطلب وتتأكد منه.", "Yes, cash to the courier after you open and check the order."),
  },
  {
    title: L("التقسيط محتاج مقدم؟", "Do installments need a down payment?"),
    body: L("لأ، مع فاليو وسيمبل من غير مقدم لحد ٢٤ شهر.", "No, valU and Sympl need no down payment up to 24 months."),
  },
  {
    title: L("إمتى الفلوس ترجع لو رجّعت المنتج؟", "When is my refund paid?"),
    body: L("خلال ٣–٧ أيام عمل حسب طريقة الدفع.", "Within 3–7 working days depending on how you paid."),
  },
  { title: L("في مصاريف على الدفع بالكارت؟", "Is there a card fee?"), body: L("لأ، مفيش أي مصاريف إضافية.", "No, there are no extra fees.") },
];

export const payFaq = defineDesign({
  id: "pay-faq",
  version: 1,
  category: "payment",
  subcategory: "methods",
  name: L("أسئلة الدفع", "Payment questions"),
  description: L("أسئلة وأجوبة قصيرة عن الدفع والاسترجاع.", "Short questions and answers about paying and refunds."),
  keywords: ["payment", "faq", "questions", "refund", "الدفع", "أسئلة", "استرجاع"],
  tree: (t) =>
    t.section({ label: L("أسئلة الدفع", "Payment questions") }, [
      t.container(
        [
          t.stack(
            [
              payTitle(t, L("أسئلة عن الدفع", "Payment questions")),
              t.accordion(
                QUESTIONS.map((q, i) => ({ ...q, open: i === 0 })),
                { label: L("الأسئلة", "Questions"), role: "items" },
              ),
              t.link(
                "/contact",
                [
                  t.row(
                    [
                      t.icon("chat", { style: { fontSize: "lg", color: "primary" } }),
                      t.text(L("عندك سؤال تاني؟ كلمنا", "Another question? Message us"), { style: { fontWeight: "semibold" } }),
                    ],
                    { label: L("نص الرابط", "Link text"), style: { gap: 8, wrap: false } },
                  ),
                ],
                { label: L("رابط", "Link"), role: "link", style: { ...FLUSH, color: "foreground", hover: { color: "primary" } } },
              ),
            ],
            { label: L("الأسئلة", "Questions"), style: { gap: 20, maxWidth: "720px", marginStart: 0 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
