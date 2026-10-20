/**
 * Head to head (Product finder E-d): two products face each other across a
 * round "vs" disc, each with its photo, name, price and cart button; under
 * them a centred spec ladder, the label in the middle and the better value
 * marked with a sun dot. The two products come from product lists (the
 * seller picks them); the spec rows are text the seller types for those two
 * products. The design's price row is left out: each side already shows its
 * real price.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";
import { productName, productPhoto, priceRow } from "../products/_shared";
import { centredTitle, versusDisc } from "./_shared";

const SPECS = [
  {
    label: L("البطارية", "Battery"),
    a: L("٣٠ ساعة", "30 h"),
    b: L("٢٤ ساعة", "24 h"),
    win: "a",
  },
  {
    label: L("عزل الضوضاء", "Noise cancelling"),
    a: L("أيوه", "Yes"),
    b: L("لأ", "No"),
    win: "a",
  },
  {
    label: L("الوزن", "Weight"),
    a: L("٥٫٢ جم", "5.2 g"),
    b: L("٤٫٨ جم", "4.8 g"),
    win: "b",
  },
  {
    label: L("مقاومة المية", "Water resistance"),
    a: L("IPX٤", "IPX4"),
    b: L("IPX٥", "IPX5"),
    win: "b",
  },
] as const;

function side(t: TreeBuilder, offset: number): NodeTemplate {
  return t.productList(
    [
      t.stack(
        [
          productPhoto(t, { ratio: "square", radius: 20, chip: false }),
          productName(t, { fontSize: "lg", textAlign: "center" }),
          priceRow(t, { justifyContent: "center" }),
          t.addToCart({ label: L("اشتري ده", "Buy this one") }),
        ],
        {
          label: L("المنتج", "Product"),
          style: { gap: 10, alignItems: "center", textAlign: "center" },
        },
      ),
    ],
    {
      label: offset
        ? L("المنتج التاني", "Second product")
        : L("المنتج الأول", "First product"),
      role: offset ? "productB" : "productA",
      source: "best-sellers",
      limit: 1,
      offset,
      columns: { desktop: 1 },
      style: { width: "100%", maxWidth: "300px" },
      mobile: { width: "40%" },
    },
  );
}

function value(t: TreeBuilder, text: DesignText, win: boolean): NodeTemplate {
  return t.row(
    [
      ...(win
        ? [
            t.box([], {
              label: L("النقطة", "Dot"),
              style: {
                background: "accent",
                radius: 999,
                width: "10px",
                minHeight: 10,
              },
            }),
          ]
        : []),
      t.text(text, {
        style: { fontWeight: win ? "bold" : "medium" },
        mobile: { fontSize: "sm" },
      }),
    ],
    {
      label: L("القيمة", "Value"),
      style: {
        gap: 8,
        wrap: false,
        justifyContent: "center",
        alignItems: "center",
      },
    },
  );
}

export const finderVersus = defineDesign({
  id: "finder-versus",
  version: 1,
  category: "finder",
  subcategory: "compare",
  name: L("وش لوش", "Head to head"),
  description: L(
    "منتجين قصاد بعض وتحتهم مقارنة المواصفات سطر بسطر.",
    "Two products face to face, with a spec-by-spec ladder under them.",
  ),
  keywords: [
    "finder",
    "compare",
    "versus",
    "vs",
    "head to head",
    "مقارنة",
    "وش لوش",
    "مواصفات",
  ],
  tree: (t) =>
    t.section({ label: L("وش لوش", "Head to head") }, [
      t.container(
        [
          t.stack(
            [
              centredTitle(t, L("تختار مين؟", "Which one?"), {
                marginBottom: 32,
              }),
              t.row([side(t, 0), versusDisc(t, L("ضد", "vs")), side(t, 1)], {
                label: L("المواجهة", "Face-off"),
                style: {
                  width: "100%",
                  maxWidth: "860px",
                  gap: 32,
                  wrap: false,
                  justifyContent: "center",
                  alignItems: "center",
                },
                mobile: { gap: 10 },
              }),
              t.stack(
                SPECS.map((s) =>
                  t.grid(
                    [
                      value(t, s.a, s.win === "a"),
                      t.text(s.label, {
                        style: {
                          fontSize: "sm",
                          fontWeight: "semibold",
                          color: "muted",
                          textAlign: "center",
                        },
                        mobile: { fontSize: "xs" },
                      }),
                      value(t, s.b, s.win === "b"),
                    ],
                    {
                      label: L("سطر", "Row"),
                      columns: { desktop: 3 },
                      style: {
                        gap: 8,
                        alignItems: "center",
                        background: "background",
                        minHeight: 56,
                        paddingTop: 12,
                        paddingBottom: 12,
                      },
                    },
                  ),
                ),
                {
                  label: L("المواصفات", "Specs"),
                  role: "items",
                  style: {
                    width: "100%",
                    maxWidth: "860px",
                    gap: 1,
                    background: "border",
                    paddingTop: 1,
                    paddingBottom: 1,
                    marginTop: 32,
                  },
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
