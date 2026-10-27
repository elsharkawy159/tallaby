/**
 * Countdown banner (Claude Design premium set, `countdownBanner`;
 * 2026-10-27): a rounded photo panel inside the page width with a dark fade,
 * and over it an eyebrow, the offer's title, one line, a big four-part
 * countdown and one button. The countdown is empty until the seller sets the
 * real end date, and publicly it hides itself once the date has passed.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const FILL = { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px" } as const;

export const promoCountdown = defineDesign({
  id: "promo-countdown",
  version: 1,
  category: "promotions",
  subcategory: "countdown",
  name: L("بانر بعد تنازلي", "Countdown banner"),
  description: L(
    "لوحة بصورة وعليها عنوان العرض وعداد كبير وزر واحد، لعرض له وقت نهاية حقيقي.",
    "A photo panel with the offer's title, a big countdown and one button, for an offer with a real end time.",
  ),
  keywords: ["countdown", "timer", "sale", "offer", "deadline", "banner", "عد تنازلي", "عداد", "عرض", "تخفيضات"],
  tree: (t) =>
    t.section({ label: L("بانر العداد", "Countdown banner") }, [
      t.container(
        [
          t.box(
            [
              t.photo(3, L("صورة العرض", "Offer photo"), {
                role: "image",
                style: { aspectRatio: "banner", objectFit: "cover", width: "100%" },
                tablet: { aspectRatio: "wide" },
                mobile: { aspectRatio: "portrait" },
              }),
              t.box([], { label: L("التعتيم", "Dim"), style: { ...FILL, background: "black", opacity: 20 } }),
              t.box([], { label: L("التظليل", "Shade"), style: { ...FILL, gradient: "ink-fade" } }),
              t.stack(
                [
                  t.text(L("لفترة محدودة", "Limited time"), { role: "eyebrow", style: { color: "white", fontWeight: "semibold", opacity: 90 } }),
                  t.heading(L("عرض الويك إند على الفساتين", "The weekend offer on dresses"), "h2", {
                    role: "title",
                    style: { color: "white", fontSize: "display-md", fontWeight: "bold", lineHeight: "tight", textAlign: "center" },
                  }),
                  t.paragraph(L("لفترة محدودة، على قطع مختارة.", "For a limited time, on chosen pieces."), {
                    role: "subtitle",
                    style: { color: "white", opacity: 90, textAlign: "center", maxWidth: "480px" },
                  }),
                  t.countdown({ label: L("العداد", "Countdown"), style: { color: "white", alignItems: "center", justifyContent: "center", paddingTop: 4 } }),
                  t.button(L("تسوّق العرض", "Shop the offer"), "/products", "light", { role: "cta", style: { marginTop: 4 } }),
                ],
                {
                  label: L("النص", "Copy"),
                  style: { ...FILL, gap: 14, alignItems: "center", justifyContent: "end", paddingTop: 48, paddingBottom: 48, paddingStart: 24, paddingEnd: 24 },
                  mobile: { gap: 12, paddingBottom: 28, paddingStart: 16, paddingEnd: 16 },
                },
              ),
            ],
            { label: L("اللوحة", "Panel"), style: { position: "relative", background: "black", overflow: "hidden", radius: 24 }, mobile: { radius: 18 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
