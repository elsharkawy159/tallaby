/**
 * FAQ split (library Q-c): the title, a short line and one button on the
 * start side, the questions on the end side.
 *
 * v2 (look-first pilot L7, 2026-11-11): the tinted card is gone. The copy is
 * plain with the calm heading of the product sections, a photo stands
 * between the copy and the questions (hidden on tablets, where two columns
 * fit), and the button leads to the FAQ page instead of an empty WhatsApp
 * link. On phones: copy, photo, questions. Same field names as v1 for the
 * title, body, button and questions.
 */
import { defineDesign } from "../builder";
import { EYEBROW } from "../_editorial";
import { L } from "../_kit";
import { HEAD_TITLE, PRODUCTS_SECTION } from "../products/_shared";
import { FAQ_ITEMS } from "./_faq";

export const faqSide = defineDesign({
  id: "faq-side",
  version: 2,
  category: "faq",
  subcategory: "side-title",
  name: L("أسئلة بصورة جانبية", "FAQ split"),
  description: L(
    "عنوان وسطر وزر في ناحية، وصورة في النص، والأسئلة في الناحية التانية.",
    "A title, a line and a button on one side, a photo in the middle and the questions on the other side.",
  ),
  keywords: ["faq", "questions", "split", "photo", "أسئلة", "صورة"],
  tree: (t) =>
    t.section({ label: L("عندك سؤال؟", "Got a question?"), ...PRODUCTS_SECTION }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.text(L("الأسئلة الشائعة", "FAQ"), { role: "eyebrow", style: EYEBROW }),
                  t.heading(L("عندك سؤال؟", "Got a question?"), "h2", { role: "title", ...HEAD_TITLE, motion: { reveal: "words" } }),
                  t.paragraph(
                    L(
                      "جمعنالك أكتر الأسئلة اللي بتتسأل عن الطلب والتوصيل والاسترجاع. ولو سؤالك مش هنا، كلمنا.",
                      "The questions we hear most about orders, delivery and returns. If yours is not here, talk to us.",
                    ),
                    { role: "body", style: { fontSize: "md", lineHeight: "relaxed", maxWidth: "360px" }, mobile: { fontSize: "sm" } },
                  ),
                  t.button(L("كل الأسئلة", "All questions"), "/faq", "solid", { role: "cta", style: { marginTop: 8 } }),
                ],
                {
                  label: L("بطاقة التواصل", "Contact card"),
                  style: { gap: 12, alignItems: "start", justifyContent: "center" },
                  motion: { reveal: "none" },
                },
              ),
              t.box(
                [
                  t.photo(3, L("صورة القسم", "Section photo"), {
                    role: "image",
                    style: { aspectRatio: "portrait", objectFit: "cover", width: "100%", radius: 0 },
                    mobile: { aspectRatio: "landscape" },
                    motion: { reveal: "wipe-up" },
                  }),
                ],
                {
                  label: L("إطار الصورة", "Photo frame"),
                  role: "frame",
                  style: { overflow: "hidden", radius: 16, background: "secondary" },
                  tablet: { hidden: true },
                  motion: { reveal: "none" },
                },
              ),
              t.accordion(
                FAQ_ITEMS.slice(0, 5).map((item, i) => ({ ...item, open: i === 0 })),
                { label: L("الأسئلة", "Questions"), role: "items" },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 3, tablet: 2, mobile: 1 },
              style: { gap: 56, alignItems: "center" },
              tablet: { gap: 32 },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
