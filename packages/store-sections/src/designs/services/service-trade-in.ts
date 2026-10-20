/**
 * Trade-in (Services W-b): a shelf tile with the question and the four
 * condition levels with the share of the credit each one gets, beside a brand
 * tile with the top credit in very large figures, how it is used and a button.
 * The design's device picker computes an estimate, which needs a script and a
 * price list; here the seller types the levels and the "up to" figure, and the
 * button opens their WhatsApp to book the check.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import {
  BIG_NUMBER,
  BRAND_TILE,
  TILE,
  TILE_MOBILE,
  dotLabel,
  pillButton,
} from "../_modular";
import { WHATSAPP_LINK } from "./_shared";

const CONDITIONS = [
  { label: L("زي الجديد", "Like new"), share: L("لحد ١٠٠٪", "Up to 100%") },
  { label: L("كويس", "Good"), share: L("لحد ٨٠٪", "Up to 80%") },
  { label: L("عليه خدوش", "Scratched"), share: L("لحد ٦٠٪", "Up to 60%") },
  {
    label: L("الشاشة مكسورة", "Cracked screen"),
    share: L("لحد ٣٥٪", "Up to 35%"),
  },
];

export const serviceTradeIn = defineDesign({
  id: "service-trade-in",
  version: 1,
  category: "services",
  subcategory: "requests",
  name: L("استبدل القديم", "Trade-in"),
  description: L(
    "حالة الجهاز ونسبة الرصيد لكل حالة، وجنبها أعلى رصيد وزرار للحجز.",
    "Device conditions with the credit share for each, beside the top credit and a booking button.",
  ),
  keywords: [
    "services",
    "trade-in",
    "exchange",
    "credit",
    "استبدال",
    "جهاز قديم",
    "رصيد",
  ],
  tree: (t) =>
    t.section({ label: L("استبدل القديم", "Trade-in") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  dotLabel(t, L("استبدل القديم", "Trade-in")),
                  t.heading(
                    L(
                      "جهازك القديم يساوي كام؟",
                      "What is your old device worth?",
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
                  t.heading(
                    L(
                      "الرصيد على حسب حالته",
                      "Credit depends on its condition",
                    ),
                    "h3",
                    { style: { fontSize: "md", marginTop: 8 } },
                  ),
                  t.grid(
                    CONDITIONS.map((c) =>
                      t.stack(
                        [
                          t.text(c.label, {
                            style: {
                              fontWeight: "semibold",
                              fontSize: "sm",
                              textAlign: "center",
                            },
                          }),
                          t.text(c.share, {
                            style: {
                              fontSize: "xs",
                              color: "muted",
                              textAlign: "center",
                            },
                          }),
                        ],
                        {
                          label: L("حالة", "Condition"),
                          style: {
                            background: "background",
                            borderWidth: 1,
                            borderColor: "border",
                            radius: 14,
                            gap: 4,
                            justifyContent: "center",
                            minHeight: 64,
                            paddingTop: 10,
                            paddingBottom: 10,
                            paddingStart: 8,
                            paddingEnd: 8,
                          },
                        },
                      ),
                    ),
                    {
                      label: L("الحالات", "Conditions"),
                      role: "items",
                      columns: { desktop: 4, mobile: 2 },
                      style: { gap: 8 },
                    },
                  ),
                ],
                {
                  label: L("الحالة", "Condition tile"),
                  style: {
                    ...TILE,
                    gap: 16,
                    paddingTop: 36,
                    paddingBottom: 36,
                    paddingStart: 36,
                    paddingEnd: 36,
                  },
                  mobile: TILE_MOBILE,
                },
              ),
              t.stack(
                [
                  t.text(L("رصيد لحد", "Credit up to"), {
                    style: { color: "primaryInk" },
                  }),
                  t.text(L("٩٬٤٠٠ ج.م", "EGP 9,400"), {
                    role: "value",
                    style: {
                      ...BIG_NUMBER,
                      fontSize: "6xl",
                      color: "primaryInk",
                      marginBottom: 8,
                    },
                    mobile: { fontSize: "5xl" },
                  }),
                  t.paragraph(
                    L(
                      "لموبايل iPhone 12 بحالة زي الجديد. بيتخصم من طلبك الجاي، والسعر النهائي بعد فحص الجهاز في الفرع.",
                      "For an iPhone 12 in like-new condition. Taken off your next order; the final value is set after an in-store check.",
                    ),
                    {
                      style: {
                        color: "primaryInk",
                        opacity: 85,
                        maxWidth: "36ch",
                        marginBottom: 12,
                      },
                    },
                  ),
                  pillButton(
                    t,
                    L("احجز الاستبدال", "Book a trade-in"),
                    WHATSAPP_LINK,
                    { tone: "ink", icon: "chat" },
                  ),
                ],
                {
                  label: L("الرصيد", "Credit tile"),
                  style: {
                    ...BRAND_TILE,
                    gap: 12,
                    justifyContent: "end",
                    alignItems: "start",
                    paddingTop: 40,
                    paddingBottom: 40,
                    paddingStart: 40,
                    paddingEnd: 40,
                  },
                  mobile: TILE_MOBILE,
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 12 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
