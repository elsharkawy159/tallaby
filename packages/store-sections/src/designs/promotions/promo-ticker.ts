/**
 * Offer ticker (library M-b): a slim full-width band with a coupon pill at
 * the start and short offers separated by stars. The band never scrolls the
 * page; on mobile the offers wrap.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const MESSAGES = [
  L("توصيل مجاني فوق ١٥٠٠ ج.م", "Free delivery over EGP 1,500"),
  L("خصم ١٥٪ على المجموعات", "15% off bundles"),
  L("استرجاع خلال ١٤ يومًا", "14-day returns"),
  L("الدفع عند الاستلام", "Cash on delivery"),
];

export const promoTicker = defineDesign({
  id: "promo-ticker",
  version: 1,
  category: "promotions",
  subcategory: "full-width",
  name: L("شريط عروض", "Offer ticker"),
  description: L("شريط رفيع بكود خصم وعروض قصيرة بينها نجوم.", "A slim band with a coupon code and short offers between stars."),
  keywords: ["ticker", "announcement", "coupon", "marquee", "شريط", "كوبون", "إعلان"],
  tree: (t) =>
    t.section({ label: L("شريط العروض", "Offer ticker"), style: { background: "accent", color: "foreground", paddingTop: 14, paddingBottom: 14 } }, [
      t.container(
        [
          t.row(
            [
              t.row(
                [t.icon("copy", { style: { fontSize: "sm" } }), t.text(L("الكود: SAVE10", "Code: SAVE10"), { role: "coupon", style: { fontWeight: "bold" } })],
                {
                  label: L("الكوبون", "Coupon"),
                  style: {
                    gap: 6,
                    background: "foreground",
                    color: "background",
                    radius: 999,
                    paddingTop: 8,
                    paddingBottom: 8,
                    paddingStart: 16,
                    paddingEnd: 16,
                    wrap: false,
                  },
                },
              ),
              t.row(
                MESSAGES.flatMap((message, i) => [
                  ...(i ? [t.icon("star", { style: { fontSize: "sm", opacity: 60 } })] : []),
                  t.text(message, { style: { fontWeight: "semibold" } }),
                ]),
                { label: L("العروض", "Offers"), role: "items", style: { gap: 16 }, mobile: { gap: 10 } },
              ),
            ],
            { label: L("الشريط", "Band"), style: { gap: 24, justifyContent: "center" }, mobile: { gap: 12 } },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 } },
      ),
    ]),
});
