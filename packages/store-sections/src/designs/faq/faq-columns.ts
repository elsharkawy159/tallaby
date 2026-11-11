/**
 * Two columns (Modular set): a centred title, then the questions split into
 * two columns inside one hairline-ruled box, each an expand/collapse row. For
 * six to twelve short questions on one screen. One column on mobile.
 *
 * v2 (look-first pilot L7, 2026-11-11): the calm title of the product
 * sections (smaller, rising word by word), a 16px corner and more air in the
 * cells. Same nodes, copy and field names as v1.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { RULED, RULED_CELL } from "../_modular";
import { HEAD_TITLE, PRODUCTS_SECTION } from "../products/_shared";
import { FAQ_ITEMS } from "./_faq";

export const faqColumns = defineDesign({
  id: "faq-columns",
  version: 2,
  category: "faq",
  subcategory: "simple",
  name: L("عمودين", "Two columns"),
  description: L("الأسئلة في عمودين داخل صندوق بخطوط رفيعة.", "Questions in two columns inside one ruled box."),
  keywords: ["faq", "questions", "two columns", "minimal", "أسئلة", "عمودين"],
  tree: (t) =>
    t.section({ label: L("الأسئلة الشائعة", "FAQ"), ...PRODUCTS_SECTION }, [
      t.container(
        [
          t.heading(L("أسئلة شائعة", "Frequently asked"), "h2", {
            role: "title",
            style: { ...HEAD_TITLE.style, textAlign: "center", marginBottom: 32 },
            mobile: { ...HEAD_TITLE.mobile, marginBottom: 20 },
            motion: { reveal: "words" },
          }),
          t.grid(
            [FAQ_ITEMS.slice(0, 3), FAQ_ITEMS.slice(3)].map((items, i) =>
              t.stack([t.accordion(i === 0 ? items.map((q, k) => ({ ...q, open: k === 0 })) : items, { label: L("الأسئلة", "Questions"), role: "items" })], {
                label: L("عمود", "Column"),
                style: {
                  ...RULED_CELL,
                  paddingTop: 16,
                  paddingBottom: 16,
                  paddingStart: 32,
                  paddingEnd: 32,
                },
                mobile: { paddingTop: 8, paddingBottom: 8, paddingStart: 16, paddingEnd: 16 },
              }),
            ),
            {
              label: L("الأعمدة", "Columns"),
              columns: { desktop: 2, mobile: 1 },
              style: { ...RULED, radius: 16 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
