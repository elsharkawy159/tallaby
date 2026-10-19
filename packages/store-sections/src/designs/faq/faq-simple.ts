/**
 * Simple list (library Q-b): a centred heading over a single narrow column of
 * questions separated by thin rules. For 3 to 6 short questions.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { FAQ_ITEMS } from "./_faq";

export const faqSimple = defineDesign({
  id: "faq-simple",
  version: 1,
  category: "faq",
  subcategory: "simple",
  name: L("أسئلة بسيطة", "Simple FAQ"),
  description: L("عنوان في المنتصف فوق عمود ضيق من الأسئلة.", "A centred heading over a narrow column of questions."),
  keywords: ["faq", "questions", "accordion", "أسئلة", "شائعة"],
  tree: (t) =>
    t.section({ label: L("أسئلة سريعة", "Quick questions") }, [
      t.container(
        [
          t.stack(
            [
              sectionHead(t, { title: L("أسئلة سريعة", "Quick questions"), align: "center" }),
              t.accordion(
                FAQ_ITEMS.slice(0, 5).map((item, i) => ({ ...item, open: i === 0 })),
                { label: L("الأسئلة", "Questions"), role: "items", style: { width: "100%" } },
              ),
            ],
            { label: L("العمود", "Column"), style: { gap: 24, alignItems: "center" } },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { maxWidth: "768px" } },
      ),
    ]),
});
