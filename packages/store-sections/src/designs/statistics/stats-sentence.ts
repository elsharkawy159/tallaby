/**
 * Number sentence (Modular set): one large centred sentence where each number
 * sits in a sun highlight, inline with the words. Tells the store's story in a
 * single line. Each piece is its own text node, so the seller edits the words
 * and the numbers separately.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const WORDS: { text: ReturnType<typeof L>; mark?: boolean }[] = [
  { text: L("وصّلنا", "We delivered") },
  { text: L("٢٥ ألف", "25,000"), mark: true },
  { text: L("طلب لـ", "orders to") },
  { text: L("٢٧", "27"), mark: true },
  { text: L("محافظة، وعملاءنا مدّيين متوسط", "governorates, rated") },
  { text: L("٤٫٨", "4.8"), mark: true },
  { text: L("من ٥.", "out of 5.") },
];

export const statsSentence = defineDesign({
  id: "stats-sentence",
  version: 1,
  category: "statistics",
  subcategory: "stats-content",
  name: L("جملة بأرقام", "Number sentence"),
  description: L("جملة كبيرة واحدة والأرقام فيها متلوّنة.", "One large sentence with its numbers highlighted."),
  keywords: ["stats", "sentence", "story", "editorial", "أرقام", "جملة"],
  tree: (t) =>
    t.section({ label: L("الأرقام", "Stats") }, [
      t.container(
        [
          t.stack(
            [
              t.row(
                WORDS.map((w) =>
                  t.text(w.text, {
                    style: {
                      fontSize: "display-sm",
                      fontWeight: "bold",
                      letterSpacing: "tight",
                      lineHeight: "snug",
                      ...(w.mark && {
                        background: "accent",
                        color: "foreground",
                        radius: 14,
                        paddingStart: 12,
                        paddingEnd: 12,
                      }),
                    },
                  }),
                ),
                {
                  label: L("الجملة", "Sentence"),
                  role: "title",
                  style: {
                    justifyContent: "center",
                    gap: 12,
                    maxWidth: "900px",
                  },
                  mobile: { gap: 8 },
                },
              ),
            ],
            {
              label: L("المحاذاة", "Alignment"),
              style: { alignItems: "center" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
