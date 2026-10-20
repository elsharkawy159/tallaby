/**
 * One question (Product finder E-c, "Quick quiz"): a centred card with a
 * question in large type and four lettered answers in a 2×2 grid. The design
 * steps through several questions with a progress bar and back/next buttons,
 * which needs a script; this still version asks the one question that splits
 * the catalogue best, and each answer is a link the seller points at the
 * matching category or collection. No step counter, so nothing promises more
 * questions.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FINDER_LINK } from "./_shared";

const LETTERS = [L("أ", "A"), L("ب", "B"), L("ج", "C"), L("د", "D")];

const ANSWERS = [
  L("أقل من ٨ ساعات", "Under 8 hours"),
  L("يوم كامل", "A full day"),
  L("أكتر من يوم", "More than a day"),
  L("مش فارقة معايا", "I don't mind"),
];

export const finderQuiz = defineDesign({
  id: "finder-quiz",
  version: 1,
  category: "finder",
  subcategory: "guided",
  name: L("سؤال واحد", "One question"),
  description: L(
    "سؤال كبير وأربع إجابات، كل إجابة بتودي على المنتجات المناسبة.",
    "One big question with four answers, each leading to the products that fit.",
  ),
  keywords: [
    "finder",
    "quiz",
    "question",
    "help me choose",
    "سؤال",
    "اختبار",
    "ساعدني أختار",
  ],
  tree: (t) =>
    t.section({ label: L("سؤال", "Question") }, [
      t.container(
        [
          t.stack(
            [
              t.stack(
                [
                  t.stack(
                    [
                      t.text(L("سؤال سريع", "Quick question"), {
                        role: "eyebrow",
                        style: {
                          fontSize: "sm",
                          fontWeight: "semibold",
                          color: "muted",
                        },
                      }),
                      t.box([], {
                        label: L("خط", "Rule"),
                        style: {
                          background: "accent",
                          radius: 999,
                          minHeight: 6,
                          width: "64px",
                        },
                      }),
                    ],
                    { label: L("التسمية", "Label"), style: { gap: 10 } },
                  ),
                  t.heading(
                    L(
                      "البطارية لازم تكفي قد إيه؟",
                      "How long should the battery last?",
                    ),
                    "h2",
                    {
                      role: "title",
                      style: {
                        fontSize: "4xl",
                        letterSpacing: "tight",
                        lineHeight: "tight",
                      },
                      mobile: { fontSize: "2xl" },
                    },
                  ),
                  t.grid(
                    ANSWERS.map((answer, i) =>
                      t.link(
                        FINDER_LINK,
                        [
                          t.row(
                            [
                              t.box(
                                [
                                  t.text(LETTERS[i]!, {
                                    style: {
                                      fontWeight: "bold",
                                      fontSize: "sm",
                                      textAlign: "center",
                                    },
                                  }),
                                ],
                                {
                                  label: L("الحرف", "Letter"),
                                  style: {
                                    background: "background",
                                    radius: 10,
                                    width: "36px",
                                    paddingTop: 8,
                                    paddingBottom: 8,
                                  },
                                },
                              ),
                              t.text(answer, {
                                style: { fontWeight: "medium" },
                              }),
                            ],
                            {
                              label: L("المحتوى", "Content"),
                              style: {
                                gap: 14,
                                wrap: false,
                                alignItems: "center",
                              },
                            },
                          ),
                        ],
                        {
                          label: L("إجابة", "Answer"),
                          style: {
                            background: "secondary",
                            color: "foreground",
                            radius: 14,
                            borderWidth: 2,
                            borderColor: "secondary",
                            minHeight: 68,
                            paddingTop: 12,
                            paddingBottom: 12,
                            paddingStart: 16,
                            paddingEnd: 16,
                            hover: {
                              borderColor: "primary",
                              background: "background",
                            },
                          },
                        },
                      ),
                    ),
                    {
                      label: L("الإجابات", "Answers"),
                      role: "items",
                      columns: { desktop: 2, mobile: 1 },
                      style: { gap: 10 },
                    },
                  ),
                  t.text(
                    L(
                      "كل إجابة بتوديك على المنتجات المناسبة ليها.",
                      "Each answer takes you to the products that fit it.",
                    ),
                    {
                      style: { fontSize: "sm", color: "muted" },
                    },
                  ),
                ],
                {
                  label: L("البطاقة", "Card"),
                  style: {
                    width: "100%",
                    maxWidth: "760px",
                    gap: 28,
                    radius: 24,
                    borderWidth: 1,
                    borderColor: "border",
                    paddingTop: 44,
                    paddingBottom: 44,
                    paddingStart: 44,
                    paddingEnd: 44,
                  },
                  mobile: {
                    gap: 20,
                    paddingTop: 22,
                    paddingBottom: 22,
                    paddingStart: 22,
                    paddingEnd: 22,
                  },
                },
              ),
            ],
            { label: L("التوسيط", "Centre"), style: { alignItems: "center" } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
