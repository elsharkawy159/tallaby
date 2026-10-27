/**
 * Gift finder (library A-c, reworked): on the start side a large brand-colour
 * "gift" card with a sun circle, on the end side the title, one line, four
 * occasion chips that link into the shop and a button. The design sells a
 * gift card with amount chips and recipient fields; the store has no gift
 * cards, so this keeps the look as a gift promo that leads to products (the
 * seller points each chip at a category). Mobile puts the card on top.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { chip, dotLabel, pillButton } from "../_modular";

const OCCASIONS = [
  L("هدايا لها", "For her"),
  L("هدايا له", "For him"),
  L("للأطفال", "For kids"),
  L("عيد ميلاد", "Birthdays"),
];

export const rewardsGift = defineDesign({
  id: "rewards-gift",
  version: 1,
  category: "loyalty",
  subcategory: "gifts",
  name: L("دوّر على هدية", "Gift finder"),
  description: L(
    "كارت هدية كبير بلون البراند جنب مناسبات بتودّي لمنتجاتك.",
    "A big brand-colour gift card beside occasion links into your shop.",
  ),
  keywords: ["gift", "gifts", "occasion", "present", "هدية", "هدايا", "مناسبة"],
  tree: (t) =>
    t.section({ label: L("الهدايا", "Gifts") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.box([], {
                    label: L("الدائرة", "Circle"),
                    style: {
                      position: "absolute",
                      insetTop: "-30%",
                      insetEnd: "-14%",
                      width: "55%",
                      aspectRatio: "square",
                      radius: 999,
                      background: "accent",
                    },
                  }),
                  t.row(
                    [
                      t.icon("gift", {
                        style: { fontSize: "2xl", color: "primaryInk" },
                      }),
                      t.text(L("هدية من عندنا", "A gift from us"), {
                        style: { fontWeight: "semibold", color: "primaryInk" },
                      }),
                    ],
                    {
                      label: L("العلامة", "Mark"),
                      style: {
                        gap: 10,
                        wrap: false,
                        alignItems: "center",
                        position: "relative",
                        zIndex: 1,
                      },
                    },
                  ),
                  t.stack(
                    [
                      t.text(L("لكل مناسبة", "For every occasion"), {
                        style: {
                          fontSize: "md",
                          color: "primaryInk",
                          opacity: 85,
                        },
                      }),
                      t.text(L("هدية تفرّح", "A gift they'll love"), {
                        role: "value",
                        style: {
                          fontSize: "5xl",
                          fontWeight: "bold",
                          letterSpacing: "tight",
                          lineHeight: "tight",
                          color: "primaryInk",
                        },
                        mobile: { fontSize: "4xl" },
                      }),
                    ],
                    {
                      label: L("النص", "Copy"),
                      style: { gap: 4, position: "relative", zIndex: 1 },
                    },
                  ),
                ],
                {
                  label: L("الكارت", "Card"),
                  style: {
                    position: "relative",
                    overflow: "hidden",
                    justifyContent: "between",
                    gap: 24,
                    minHeight: 320,
                    background: "primary",
                    color: "primaryInk",
                    radius: 28,
                    shadow: "md",
                    paddingTop: 32,
                    paddingBottom: 36,
                    paddingStart: 36,
                    paddingEnd: 36,
                  },
                  mobile: {
                    minHeight: 220,
                    paddingTop: 22,
                    paddingBottom: 24,
                    paddingStart: 24,
                    paddingEnd: 24,
                  },
                },
              ),
              t.stack(
                [
                  dotLabel(t, L("الهدايا", "Gifts")),
                  t.heading(
                    L(
                      "دوّر على هدية لحد بتحبه",
                      "Find a gift for someone you love",
                    ),
                    "h2",
                    {
                      role: "title",
                      style: { fontSize: "display-sm", letterSpacing: "tight" },
                    },
                  ),
                  t.paragraph(
                    L(
                      "اختار المناسبة وشوف أفكار تناسب كل ميزانية.",
                      "Pick the occasion and browse ideas for every budget.",
                    ),
                    { role: "subtitle" },
                  ),
                  t.grid(
                    OCCASIONS.map((o) => chip(t, o, "/products")),
                    {
                      label: L("المناسبات", "Occasions"),
                      role: "items",
                      columns: { desktop: 2, mobile: 2 },
                      style: { gap: 8 },
                    },
                  ),
                  pillButton(t, L("تسوّق الهدايا", "Shop gifts"), "/products", {
                    icon: "gift",
                    style: { marginTop: 6 },
                    mobile: { width: "100%" },
                  }),
                ],
                {
                  label: L("المحتوى", "Content"),
                  style: { gap: 16, alignItems: "start" },
                  mobile: { alignItems: "stretch" },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 64, alignItems: "center" },
              tablet: { gap: 40 },
              mobile: { gap: 28 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
