/**
 * Our pick (Product finder E-h): a brand tile crowned "Our pick" with one
 * product's photo, name and price and three numbered reasons; beside it two
 * smaller runner-up cards labelled "Best value" and "Premium". Each product
 * comes from its own one-product list (the second and third skip the ones
 * before), so every card keeps its own label; the reasons are text the seller
 * types for the product they pick. Runner-ups hide when the store has fewer
 * products.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L, PAPER_CARD, sectionHead } from "../_kit";
import { BRAND_TILE, TILE_MOBILE } from "../_modular";
import {
  PRODUCT_NAME,
  priceRow,
  productName,
  productPhoto,
  SHOP_LINK,
} from "../products/_shared";

const REASONS = [
  L("أحسن عزل ضوضاء في الفئة", "Best noise cancelling in its class"),
  L("بطارية ٣٠ ساعة", "30-hour battery"),
  L("ضمان سنتين", "2-year warranty"),
];

function runnerUp(
  t: TreeBuilder,
  label: DesignText,
  offset: number,
): NodeTemplate {
  return t.productList(
    [
      t.stack(
        [
          t.text(label, {
            style: { fontSize: "xs", fontWeight: "semibold", color: "primary" },
          }),
          productPhoto(t, { ratio: "landscape", radius: 14, chip: false }),
          productName(t, { fontSize: "sm" }),
          priceRow(t),
        ],
        {
          label: L("بطاقة", "Card"),
          style: {
            ...PAPER_CARD,
            gap: 10,
            paddingTop: 18,
            paddingBottom: 18,
            paddingStart: 18,
            paddingEnd: 18,
          },
          mobile: {
            paddingTop: 12,
            paddingBottom: 12,
            paddingStart: 12,
            paddingEnd: 12,
          },
        },
      ),
    ],
    {
      label,
      role: offset === 1 ? "runnerUpA" : "runnerUpB",
      source: "best-sellers",
      limit: 1,
      offset,
      optional: true,
      columns: { desktop: 1 },
    },
  );
}

export const finderPick = defineDesign({
  id: "finder-pick",
  version: 1,
  category: "finder",
  subcategory: "picks",
  name: L("اختيارنا", "Our pick"),
  description: L(
    "منتج واحد بنرشحه بأسبابه، وجنبه بديلين: الأوفر والأفخم.",
    "One recommended product with its reasons, beside a best-value and a premium alternative.",
  ),
  keywords: [
    "finder",
    "our pick",
    "recommended",
    "best value",
    "premium",
    "اختيارنا",
    "ترشيح",
    "الأوفر",
  ],
  tree: (t) =>
    t.section({ label: L("اختيارنا", "Our pick") }, [
      t.container(
        [
          sectionHead(t, {
            title: L("لو هتشتري واحدة بس", "If you buy just one"),
          }),
          t.grid(
            [
              t.productList(
                [
                  t.grid(
                    [
                      productPhoto(t, {
                        ratio: "square",
                        radius: 18,
                        chip: false,
                      }),
                      t.stack(
                        [
                          t.row(
                            [
                              t.icon("star", {
                                style: { fontSize: "sm", color: "foreground" },
                              }),
                              t.text(L("اختيارنا", "Our pick"), {
                                style: { fontSize: "xs", fontWeight: "bold" },
                              }),
                            ],
                            {
                              label: L("الشارة", "Badge"),
                              style: {
                                gap: 6,
                                wrap: false,
                                background: "accent",
                                radius: 999,
                                paddingTop: 4,
                                paddingBottom: 4,
                                paddingStart: 12,
                                paddingEnd: 12,
                              },
                            },
                          ),
                          t.link(
                            SHOP_LINK,
                            [
                              t.heading(PRODUCT_NAME, "h3", {
                                bind: "title",
                                style: {
                                  fontSize: "2xl",
                                  color: "primaryInk",
                                  lineHeight: "snug",
                                },
                              }),
                            ],
                            {
                              label: L("اسم المنتج", "Product name"),
                              bind: "href",
                              style: {
                                paddingTop: 0,
                                paddingBottom: 0,
                                paddingStart: 0,
                                paddingEnd: 0,
                                color: "primaryInk",
                              },
                            },
                          ),
                          t.text(L("٢٥٠ ج.م", "EGP 250"), {
                            bind: "price",
                            style: {
                              fontSize: "xl",
                              fontWeight: "bold",
                              color: "primaryInk",
                            },
                          }),
                          t.stack(
                            REASONS.map((r, i) =>
                              t.row(
                                [
                                  t.box(
                                    [
                                      t.text(
                                        L(
                                          String.fromCharCode(0x0661 + i),
                                          String(i + 1),
                                        ),
                                        {
                                          style: {
                                            fontWeight: "bold",
                                            fontSize: "sm",
                                            textAlign: "center",
                                            color: "foreground",
                                          },
                                        },
                                      ),
                                    ],
                                    {
                                      label: L("الرقم", "Number"),
                                      style: {
                                        background: "accent",
                                        radius: 999,
                                        width: "28px",
                                        paddingTop: 3,
                                        paddingBottom: 3,
                                      },
                                    },
                                  ),
                                  t.text(r, { style: { color: "primaryInk" } }),
                                ],
                                {
                                  label: L("سبب", "Reason"),
                                  style: {
                                    gap: 10,
                                    wrap: false,
                                    alignItems: "center",
                                  },
                                },
                              ),
                            ),
                            {
                              label: L("الأسباب", "Reasons"),
                              role: "items",
                              style: { gap: 10, marginTop: 8 },
                            },
                          ),
                          t.addToCart({ label: L("أضف للسلة", "Add to cart") }),
                        ],
                        {
                          label: L("التفاصيل", "Details"),
                          style: { gap: 12, alignItems: "start" },
                        },
                      ),
                    ],
                    {
                      label: L("الاختيار", "Pick"),
                      columns: { desktop: 2, mobile: 1 },
                      style: { ...BRAND_TILE, gap: 28, alignItems: "center" },
                      mobile: { ...TILE_MOBILE, gap: 18 },
                    },
                  ),
                ],
                {
                  label: L("اختيارنا", "Our pick"),
                  role: "lead",
                  source: "best-sellers",
                  limit: 1,
                  columns: { desktop: 1 },
                  style: { colSpan: 2 },
                  mobile: { colSpan: 1 },
                },
              ),
              t.grid(
                [
                  runnerUp(t, L("أوفر اختيار", "Best value"), 1),
                  runnerUp(t, L("الأفخم", "Premium"), 2),
                ],
                {
                  label: L("البدائل", "Runners-up"),
                  columns: { desktop: 1, mobile: 2 },
                  style: { gap: 12 },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 12, marginTop: 32 },
              mobile: { marginTop: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
