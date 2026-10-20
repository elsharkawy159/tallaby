/**
 * Two columns (Modular set): a centred title, then the questions split into
 * two columns inside one hairline-ruled box, each an expand/collapse row. For
 * six to twelve short questions on one screen. One column on mobile.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { RULED, RULED_CELL } from "../_modular";
import { FAQ_ITEMS } from "./_faq";

export const faqColumns = defineDesign({
  id: "faq-columns",
  version: 1,
  category: "faq",
  subcategory: "simple",
  name: L("عمودين", "Two columns"),
  description: L("الأسئلة في عمودين داخل صندوق بخطوط رفيعة.", "Questions in two columns inside one ruled box."),
  keywords: ["faq", "questions", "two columns", "minimal", "أسئلة", "عمودين"],
  tree: (t) =>
    t.section({ label: L("الأسئلة الشائعة", "FAQ") }, [
      t.container(
        [
          t.heading(L("أسئلة شائعة", "Frequently asked"), "h2", {
            role: "title",
            style: {
              fontSize: "display-sm",
              letterSpacing: "tight",
              textAlign: "center",
              marginBottom: 32,
            },
            mobile: { marginBottom: 20 },
          }),
          t.grid(
            [FAQ_ITEMS.slice(0, 3), FAQ_ITEMS.slice(3)].map((items, i) =>
              t.stack([t.accordion(i === 0 ? items.map((q, k) => ({ ...q, open: k === 0 })) : items, { label: L("الأسئلة", "Questions"), role: "items" })], {
                label: L("عمود", "Column"),
                style: {
                  ...RULED_CELL,
                  paddingTop: 12,
                  paddingBottom: 12,
                  paddingStart: 24,
                  paddingEnd: 24,
                },
                mobile: { paddingStart: 16, paddingEnd: 16 },
              }),
            ),
            {
              label: L("الأعمدة", "Columns"),
              columns: { desktop: 2, mobile: 1 },
              style: RULED,
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
