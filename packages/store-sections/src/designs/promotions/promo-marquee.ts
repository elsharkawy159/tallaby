/**
 * Scrolling text (Claude Design premium set, `marquee`; 2026-10-27): large
 * words loop across the screen with a small spark between them, for store
 * promises or collection names between sections. Built on the `marquee`
 * element: it stops and wraps into a still row with reduced motion or Theme ›
 * Animations off, and pauses on hover. Store promises only, no prices.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";

const WORDS = [
  L("توصيل لكل المحافظات", "Delivery to every governorate"),
  L("قطع جديدة كل خميس", "New drop every Thursday"),
  L("استبدال خلال ١٤ يوم", "Exchange within 14 days"),
  L("الدفع عند الاستلام", "Cash on delivery"),
];

function word(t: TreeBuilder, text: DesignText): NodeTemplate[] {
  return [
    t.text(text, {
      label: L("عبارة", "Phrase"),
      style: { fontFamily: "heading", fontSize: "display-sm", fontWeight: "bold", lineHeight: "snug" },
      mobile: { fontSize: "3xl" },
    }),
    t.icon("sparkles", { label: L("فاصل", "Separator"), style: { color: "primary", fontSize: "2xl" } }),
  ];
}

export const promoMarquee = defineDesign({
  id: "promo-marquee",
  version: 1,
  category: "promotions",
  subcategory: "full-width",
  name: L("نص متحرك", "Scrolling text"),
  description: L(
    "عبارات كبيرة بتلف على عرض الشاشة، لوعود المتجر أو أسماء المجموعات بين الأقسام.",
    "Large words that loop across the screen, for store promises or collection names between sections.",
  ),
  keywords: ["marquee", "ticker", "scrolling text", "promises", "strip", "نص متحرك", "شريط", "وعود"],
  tree: (t) =>
    t.section(
      {
        label: L("نص متحرك", "Scrolling text"),
        style: { paddingTop: 32, paddingBottom: 32, background: "secondary" },
        mobile: { paddingTop: 22, paddingBottom: 22 },
      },
      [
        t.marquee(
          WORDS.flatMap((text) => word(t, text)),
          { label: L("الشريط", "Marquee"), role: "items", speed: 36, style: { gap: 40, alignItems: "center" }, mobile: { gap: 24 } },
        ),
      ],
    ),
});
