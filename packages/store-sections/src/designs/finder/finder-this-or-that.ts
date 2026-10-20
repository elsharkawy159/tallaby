/**
 * This or that (Product finder E-j): two large photo cards side by side with
 * an "or" disc between them; each names a style with a one-line trait and
 * links to its category (the seller sets the link and photo). Splits
 * shoppers between two families early. Stays side by side on mobile.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L, cover } from "../_kit";
import { FLUSH } from "../_modular";
import { FINDER_LINK, centredTitle, versusDisc } from "./_shared";

function option(
  t: TreeBuilder,
  photo: number,
  name: DesignText,
  trait: DesignText,
): NodeTemplate {
  return t.link(
    FINDER_LINK,
    [
      t.stack(
        [
          t.photo(photo, name, {
            style: cover("portrait", 24),
            mobile: { radius: 16 },
          }),
          t.text(name, {
            role: "title",
            style: { fontSize: "2xl", fontWeight: "bold", textAlign: "center" },
            mobile: { fontSize: "md" },
          }),
          t.text(trait, {
            style: { fontSize: "sm", color: "muted", textAlign: "center" },
            mobile: { fontSize: "xs" },
          }),
        ],
        {
          label: L("المحتوى", "Content"),
          style: { gap: 8, alignItems: "center" },
        },
      ),
    ],
    {
      label: L("اختيار", "Option"),
      style: {
        ...FLUSH,
        width: "100%",
        maxWidth: "440px",
        color: "foreground",
        hover: { opacity: 90 },
      },
      mobile: { maxWidth: "150px" },
    },
  );
}

export const finderThisOrThat = defineDesign({
  id: "finder-this-or-that",
  version: 1,
  category: "finder",
  subcategory: "guided",
  name: L("ده ولا ده", "This or that"),
  description: L(
    "كارتين كبار جنب بعض وبينهم «ولا»، كل كارت بيودي على قسمه.",
    "Two big photo cards with an “or” between them, each leading to its category.",
  ),
  keywords: [
    "finder",
    "this or that",
    "choose",
    "categories",
    "ده ولا ده",
    "اختيار",
    "أقسام",
  ],
  tree: (t) =>
    t.section({ label: L("ده ولا ده", "This or that") }, [
      t.container(
        [
          t.stack(
            [
              centredTitle(t, L("تحب أنهي؟", "Which one are you?"), {
                marginBottom: 32,
              }),
              t.row(
                [
                  option(
                    t,
                    0,
                    L("جوه الودن", "In-ear"),
                    L("خفيفة وتتشال في الجيب", "Light, fits in a pocket"),
                  ),
                  versusDisc(t, L("ولا", "or")),
                  option(
                    t,
                    1,
                    L("فوق الودن", "Over-ear"),
                    L(
                      "صوت أعمق وراحة لساعات",
                      "Deeper sound, hours of comfort",
                    ),
                  ),
                ],
                {
                  label: L("الاختيارين", "Options"),
                  role: "items",
                  style: {
                    width: "100%",
                    gap: 24,
                    wrap: false,
                    justifyContent: "center",
                    alignItems: "center",
                  },
                  mobile: { gap: 8 },
                },
              ),
            ],
            {
              label: L("التوسيط", "Centre"),
              style: { alignItems: "center", gap: 0 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
