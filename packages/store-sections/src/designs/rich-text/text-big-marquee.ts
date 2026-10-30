/**
 * Big scrolling words (2026-10-30, after the Void Fashion store on
 * EasyOrders): two short lines in very large type loop across the page on a
 * plain band with a small spark between them, between sections. Like
 * `promo-marquee` but in rich text, so templates (which carry no promotions)
 * can use it: the words are the brand's own lines, never prices or offers.
 * Built on the `marquee` element: still and wrapped with reduced motion or
 * Theme › Animations off, paused on hover.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";

const WORDS = [L("ستايلك، بطريقتك", "Your style, your way"), L("لوكك يبدأ من هنا", "Your look starts here")];

function word(t: TreeBuilder, text: DesignText): NodeTemplate[] {
  return [
    t.text(text, {
      label: L("عبارة", "Phrase"),
      style: { fontFamily: "heading", fontSize: "display-md", fontWeight: "bold", lineHeight: "snug" },
      mobile: { fontSize: "3xl" },
    }),
    t.icon("sparkles", { label: L("فاصل", "Separator"), style: { color: "foreground", fontSize: "2xl" } }),
  ];
}

export const textBigMarquee = defineDesign({
  id: "text-big-marquee",
  version: 1,
  category: "rich-text",
  subcategory: "callout",
  name: L("كلمات كبيرة متحركة", "Big scrolling words"),
  description: L(
    "سطران بخط كبير جدًا بيلفوا على عرض الصفحة بين الأقسام، لشعار المتجر.",
    "Two lines in very large type that loop across the page between sections, for the store's tagline.",
  ),
  keywords: ["marquee", "ticker", "scrolling text", "tagline", "big type", "نص متحرك", "شريط", "شعار"],
  tree: (t) =>
    t.section({ label: L("كلمات كبيرة", "Big words"), style: { paddingTop: 40, paddingBottom: 40 }, mobile: { paddingTop: 24, paddingBottom: 24 } }, [
      t.container(
        [
          t.marquee(
            WORDS.flatMap((text) => word(t, text)),
            { label: L("الشريط", "Marquee"), role: "items", speed: 36, style: { gap: 48, alignItems: "center" }, mobile: { gap: 28 } },
          ),
        ],
        { label: L("الحاوية", "Container"), role: "container", style: { overflow: "hidden" } },
      ),
    ]),
});
