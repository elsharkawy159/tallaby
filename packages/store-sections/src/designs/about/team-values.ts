/**
 * Values (library Y-d): a small heading over a heavy rule, then ruled rows
 * like a manifesto: a small number, one bold word, and the sentence that
 * explains it. On mobile the sentence goes under the word.
 */
import { aboutDesign } from "./_rules";
import { L } from "../_kit";
import { BIG_NUMBER } from "../_modular";

const VALUES = [
  {
    word: L("أصلي", "Genuine"),
    text: L("كل منتج من الوكيل أو المستورد الرسمي، ومعاه ضمان.", "Every product comes from the official agent or importer, with warranty."),
  },
  {
    word: L("واضح", "Clear"),
    text: L("السعر اللي تشوفه هو اللي تدفعه، من غير مصاريف مخفية.", "The price you see is the price you pay, no hidden fees."),
  },
  {
    word: L("قريب", "Close"),
    text: L("بنرد على واتساب في أقل من ساعة، حتى يوم الجمعة.", "We answer WhatsApp within an hour, even on Fridays."),
  },
];

const NUMBERS = [L("٠١", "01"), L("٠٢", "02"), L("٠٣", "03"), L("٠٤", "04"), L("٠٥", "05")];

export const teamValues = aboutDesign({
  id: "team-values",
  version: 2,
  category: "about",
  subcategory: "values",
  name: L("قيمنا", "Values"),
  description: L("قيم المتجر في صفوف: كلمة كبيرة وجملة تشرحها.", "Your store's values in rows: one big word and a sentence that explains it."),
  keywords: ["about", "values", "manifesto", "principles", "من نحن", "قيمنا", "مبادئ"],
  tree: (t) =>
    t.section({ label: L("قيمنا", "Values") }, [
      t.container(
        [
          t.heading(L("بنشتغل إزاي", "How we work"), "h2", {
            role: "title",
            style: { fontSize: "md", fontWeight: "semibold", color: "muted", marginBottom: 12 },
          }),
          t.box([], { label: L("الخط العلوي", "Top rule"), style: { background: "foreground", minHeight: 2 } }),
          t.stack(
            VALUES.map((v, i) =>
              t.row(
                [
                  t.text(NUMBERS[i]!, {
                    style: { fontFamily: "heading", fontWeight: "semibold", color: "muted", width: "60px" },
                    mobile: { width: "36px" },
                  }),
                  t.text(v.word, {
                    role: "title",
                    style: { ...BIG_NUMBER, fontFamily: "heading", fontSize: "6xl", width: "36%" },
                    mobile: { fontSize: "4xl", width: "auto" },
                  }),
                  t.paragraph(v.text, {
                    role: "body",
                    style: { fontSize: "lg", maxWidth: "48ch" },
                    mobile: { fontSize: "md", width: "100%", marginStart: 48 },
                  }),
                ],
                {
                  label: L("قيمة", "Value"),
                  style: { background: "background", gap: 24, wrap: false, alignItems: "center", paddingTop: 28, paddingBottom: 28 },
                  mobile: { wrap: true, gap: 8, paddingTop: 20, paddingBottom: 20 },
                },
              ),
            ),
            {
              label: L("القيم", "Values"),
              role: "items",
              style: { gap: 1, background: "border", paddingBottom: 1 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
