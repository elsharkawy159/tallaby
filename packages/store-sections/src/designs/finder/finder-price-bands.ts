/**
 * Price bands (Product finder E-f): three tall bento tiles, one per price
 * band, the band in big type and an arrow disc at the foot; the middle tile
 * is brand-coloured. The design counts the products in each band and stacks
 * their photos, which a tree cannot filter by price, so the tiles show the
 * band only. Each tile is a link: the cheapest band opens the shop sorted
 * from the lowest price, the dearest from the highest, and the seller can
 * point any tile at a collection instead.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import {
  BIG_NUMBER,
  BRAND_TILE,
  TILE,
  TILE_MOBILE,
  arrowText,
  iconDisc,
} from "../_modular";
import { CHEAPEST_FIRST, DEAREST_FIRST, FINDER_LINK } from "./_shared";

const BANDS = [
  { band: L("أقل من ٦٠٠", "Under 600"), href: CHEAPEST_FIRST },
  { band: L("٦٠٠ – ١٬٥٠٠", "600 – 1,500"), href: FINDER_LINK },
  { band: L("أكتر من ١٬٥٠٠", "Over 1,500"), href: DEAREST_FIRST },
];

export const finderPriceBands = defineDesign({
  id: "finder-price-bands",
  version: 1,
  category: "finder",
  subcategory: "budget",
  name: L("شرائح الأسعار", "Price bands"),
  description: L(
    "ثلاث مربعات كبيرة، كل واحد شريحة سعر بتودي على منتجاتها.",
    "Three big tiles, one per price band, each leading to its products.",
  ),
  keywords: [
    "finder",
    "price",
    "budget",
    "bands",
    "bento",
    "أسعار",
    "ميزانية",
    "شرائح",
  ],
  tree: (t) =>
    t.section({ label: L("شرائح الأسعار", "Price bands") }, [
      t.container(
        [
          sectionHead(t, {
            eyebrow: L("حسب السعر", "By price"),
            title: L("تسوق حسب ميزانيتك", "Shop by budget"),
          }),
          t.grid(
            BANDS.map((b, i) => {
              const on = i === 1;
              const ink = on ? "primaryInk" : "foreground";
              return t.link(
                b.href,
                [
                  t.stack(
                    [
                      t.stack(
                        [
                          t.text(L("ج.م", "EGP"), {
                            style: {
                              fontSize: "sm",
                              fontWeight: "semibold",
                              color: ink,
                            },
                          }),
                          t.text(b.band, {
                            role: "value",
                            style: {
                              ...BIG_NUMBER,
                              fontSize: "5xl",
                              color: ink,
                            },
                            mobile: { fontSize: "4xl" },
                          }),
                          arrowText(
                            t,
                            L("تسوق الشريحة دي", "Shop this band"),
                            ink,
                          ),
                        ],
                        { label: L("المحتوى", "Content"), style: { gap: 8 } },
                      ),
                      t.row(
                        [
                          iconDisc(t, "arrow", {
                            width: "48px",
                            paddingTop: 13,
                            paddingBottom: 11,
                          }),
                        ],
                        {
                          label: L("السهم", "Arrow"),
                          style: { justifyContent: "end" },
                        },
                      ),
                    ],
                    {
                      label: L("التخطيط", "Layout"),
                      style: {
                        gap: 24,
                        justifyContent: "between",
                        minHeight: 256,
                      },
                      mobile: { minHeight: 146 },
                    },
                  ),
                ],
                {
                  label: L("شريحة", "Band"),
                  style: {
                    ...(on ? BRAND_TILE : TILE),
                    ...(!on && { color: "foreground" }),
                    paddingTop: 32,
                    paddingBottom: 32,
                    paddingStart: 32,
                    paddingEnd: 32,
                    hover: { opacity: 90 },
                  },
                  mobile: TILE_MOBILE,
                },
              );
            }),
            {
              label: L("الشرائح", "Bands"),
              role: "items",
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
