/**
 * Answer cards (library Q-d): no accordion. A 2-column grid of white cards,
 * each with an accent icon, the question in bold and the answer always shown.
 */
import type { ElementIconName } from "../../elements/registry";
import { defineDesign } from "../builder";
import { L, iconTile, sectionHead } from "../_kit";
import { FAQ_ITEMS } from "./_faq";

const ICONS: ElementIconName[] = ["package", "truck", "credit-card", "rotate"];

export const faqCards = defineDesign({
  id: "faq-cards",
  version: 1,
  category: "faq",
  subcategory: "cards",
  name: L("بطاقات أسئلة", "Answer cards"),
  description: L("أهم الأسئلة في بطاقات بإجابات ظاهرة دائمًا.", "Your must-read questions in cards with the answers always visible."),
  keywords: ["faq", "questions", "answers", "before you order", "أسئلة", "قبل الطلب"],
  tree: (t) =>
    t.section({ label: L("قبل أن تطلب", "Before you order") }, [
      t.container(
        [
          sectionHead(t, { title: L("قبل أن تطلب", "Before you order"), link: { href: "/faq", text: L("كل الأسئلة", "All questions") } }),
          t.grid(
            [FAQ_ITEMS[0]!, FAQ_ITEMS[2]!, FAQ_ITEMS[4]!, FAQ_ITEMS[5]!].map((item, i) =>
              t.card(
                [
                  t.row(
                    [
                      iconTile(t, ICONS[i]!, { background: "accent", color: "foreground" }),
                      t.stack([t.heading(item.title, "h3", { style: { fontSize: "lg" } }), t.paragraph(item.body)], {
                        label: L("النص", "Copy"),
                        style: { gap: 6 },
                      }),
                    ],
                    { label: L("المحتوى", "Content"), style: { gap: 16, alignItems: "start", wrap: false } },
                  ),
                ],
                { label: L("سؤال", "Question"), style: { radius: 20 } },
              ),
            ),
            { label: L("الأسئلة", "Questions"), role: "items", columns: { desktop: 2, mobile: 1 }, style: { gap: 16 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
