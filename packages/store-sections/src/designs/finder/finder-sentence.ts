/**
 * Ready-made searches (Product finder E-g, "Sentence builder"): big sentences
 * like "I want [earbuds] for [workouts] under [EGP 1,000]" with the key words
 * set as highlighted pills. In the design the pills are dropdowns and a button
 * counts the matches, which needs a script; here each whole sentence is a link
 * the seller points at the matching collection, in a ruled list, so the
 * shopper picks the sentence that sounds like them.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";
import { FLUSH, dotLabel } from "../_modular";
import { FINDER_LINK } from "./_shared";

const SENTENCES = [
  [
    L("عايز", "I want"),
    L("سماعة", "earbuds"),
    L("عشان", "for"),
    L("الجيم", "workouts"),
    L("بأقل من", "under"),
    L("١٠٠٠ ج.م", "EGP 1,000"),
  ],
  [
    L("عايز", "I want"),
    L("ساعة ذكية", "a smartwatch"),
    L("عشان", "for"),
    L("الجري", "running"),
    L("بأقل من", "under"),
    L("٢٠٠٠ ج.م", "EGP 2,000"),
  ],
  [
    L("عايز", "I want"),
    L("شاحن", "a charger"),
    L("عشان", "for"),
    L("السفر", "travel"),
    L("بأقل من", "under"),
    L("٥٠٠ ج.م", "EGP 500"),
  ],
];

const WORD = {
  fontSize: "3xl",
  fontWeight: "semibold",
  lineHeight: "snug",
} as const;

function pill(t: TreeBuilder, text: DesignText): NodeTemplate {
  return t.box(
    [
      t.text(text, {
        style: { ...WORD, color: "primary" },
        mobile: { fontSize: "lg" },
      }),
    ],
    {
      label: L("الكلمة", "Keyword"),
      style: {
        background: "secondary",
        radius: 999,
        paddingTop: 2,
        paddingBottom: 4,
        paddingStart: 16,
        paddingEnd: 16,
      },
      mobile: { paddingStart: 10, paddingEnd: 10 },
    },
  );
}

export const finderSentence = defineDesign({
  id: "finder-sentence",
  version: 1,
  category: "finder",
  subcategory: "guided",
  name: L("جمل جاهزة", "Ready-made searches"),
  description: L(
    "جمل كبيرة زي «عايز سماعة عشان الجيم»، كل جملة بتودي على منتجاتها.",
    "Big sentences like “I want earbuds for workouts”, each leading to its products.",
  ),
  keywords: [
    "finder",
    "sentence",
    "search",
    "help me choose",
    "ساعدني أختار",
    "جملة",
    "بحث",
  ],
  tree: (t) =>
    t.section({ label: L("جمل جاهزة", "Ready-made searches") }, [
      t.container(
        [
          t.stack(
            [
              dotLabel(t, L("ساعدني أختار", "Help me choose")),
              t.heading(L("قول إنت عايز إيه", "Say what you are after"), "h2", {
                role: "title",
                style: { fontSize: "display-sm", letterSpacing: "tight" },
              }),
            ],
            {
              label: L("العنوان", "Heading"),
              role: "intro",
              style: { gap: 10, marginBottom: 24 },
            },
          ),
          t.stack(
            SENTENCES.map((words) =>
              t.link(
                FINDER_LINK,
                [
                  t.row(
                    [
                      ...words.map((w, i) =>
                        i % 2
                          ? pill(t, w)
                          : t.text(w, {
                              style: WORD,
                              mobile: { fontSize: "lg" },
                            }),
                      ),
                      t.icon("arrow", {
                        style: { fontSize: "2xl", color: "primary" },
                        mobile: { fontSize: "lg" },
                      }),
                    ],
                    {
                      label: L("الجملة", "Sentence"),
                      style: { gap: 10, alignItems: "center" },
                      mobile: { gap: 6 },
                    },
                  ),
                ],
                {
                  label: L("بحث جاهز", "Search"),
                  style: {
                    ...FLUSH,
                    background: "background",
                    color: "foreground",
                    paddingTop: 22,
                    paddingBottom: 22,
                    hover: { background: "secondary" },
                  },
                  mobile: { paddingTop: 16, paddingBottom: 16 },
                },
              ),
            ),
            {
              label: L("الجمل", "Sentences"),
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
