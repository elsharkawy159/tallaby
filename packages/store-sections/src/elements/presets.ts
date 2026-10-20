/**
 * Ready-made element groups for the editor's "Layouts" list (P4B-07,
 * reference `layout-presets.ts`). Plain templates: `fromTemplate` gives each
 * insert fresh ids. Text is Arabic, the default store locale.
 */
import type { Localized } from "../core/types";
import type { NodeTemplate } from "./tree";

export type LayoutPreset = { id: string; label: Localized; keywords: string[]; nodes: NodeTemplate[] };

const heading = (text: string, level = "h2"): NodeTemplate => ({ type: "heading", props: { text, level } });
const paragraph = (text: string): NodeTemplate => ({ type: "paragraph", props: { text } });
const button = (label: string, variant = "solid"): NodeTemplate => ({ type: "button", props: { label, href: "/#products", variant } });
const image = (): NodeTemplate => ({ type: "image", props: { src: "", alt: "" }, style: { radius: 12, aspectRatio: "landscape", objectFit: "cover" } });
const stack = (children: NodeTemplate[], style: NodeTemplate["style"] = { gap: 16 }): NodeTemplate => ({ type: "vFlex", props: {}, style, children });
const container = (children: NodeTemplate[]): NodeTemplate => ({ type: "container", props: {}, children });
const grid = (columns: number, children: NodeTemplate[]): NodeTemplate => ({
  type: "grid",
  props: {},
  style: { columns, gap: 24 },
  breakpointStyles: { tablet: { columns: Math.min(columns, 2) }, mobile: { columns: 1 } },
  children,
});
const card = (children: NodeTemplate[]): NodeTemplate => ({
  type: "div",
  props: {},
  style: { paddingTop: 20, paddingBottom: 20, paddingStart: 20, paddingEnd: 20, radius: 12, background: "secondary" },
  children: [stack(children, { gap: 8 })],
});
const feature = (icon: string, title: string, text: string): NodeTemplate =>
  stack(
    [
      { type: "icon", props: { name: icon }, style: { color: "primary", fontSize: "3xl" } },
      heading(title, "h3"),
      paragraph(text),
    ],
    { gap: 8 },
  );
const stat = (value: string, label: string): NodeTemplate =>
  stack(
    [
      { type: "heading", props: { text: value, level: "h2" }, style: { color: "primary", textAlign: "center" } },
      { type: "text", props: { text: label }, style: { color: "muted", textAlign: "center" } },
    ],
    { gap: 4 },
  );

export const LAYOUT_PRESETS: readonly LayoutPreset[] = [
  {
    id: "centered-stack",
    label: { ar: "عمود في المنتصف", en: "Centered Stack" },
    keywords: ["center", "hero", "وسط"],
    nodes: [
      container([
        stack(
          [
            { type: "badge", props: { text: "جديد" } },
            heading("عنوان واضح يجذب الانتباه", "h1"),
            paragraph("جملة قصيرة تشرح ما يقدمه متجرك ولماذا يختارك العملاء."),
            button("تسوّق الآن"),
          ],
          { gap: 16, alignItems: "center", textAlign: "center" },
        ),
      ]),
    ],
  },
  {
    id: "two-column",
    label: { ar: "عمودان", en: "Two Column" },
    keywords: ["columns", "split", "عمودين"],
    nodes: [
      container([
        grid(2, [
          stack([heading("العمود الأول", "h3"), paragraph("اكتب هنا محتوى العمود الأول.")], { gap: 8 }),
          stack([heading("العمود الثاني", "h3"), paragraph("اكتب هنا محتوى العمود الثاني.")], { gap: 8 }),
        ]),
      ]),
    ],
  },
  {
    id: "media-text",
    label: { ar: "صورة ونص", en: "Media + Text" },
    keywords: ["image", "about", "صورة"],
    nodes: [
      container([
        grid(2, [
          image(),
          stack([heading("قصتنا"), paragraph("اكتب هنا عن متجرك: ما الذي تبيعه، ولماذا يختارك العملاء."), button("اعرف المزيد", "outline")], {
            gap: 16,
            justifyContent: "center",
          }),
        ]),
      ]),
    ],
  },
  {
    id: "card-grid-3",
    label: { ar: "شبكة بطاقات (3)", en: "Card Grid (3)" },
    keywords: ["cards", "grid", "بطاقات"],
    nodes: [
      container([
        grid(3, [
          card([image(), heading("بطاقة أولى", "h3"), paragraph("وصف قصير.")]),
          card([image(), heading("بطاقة ثانية", "h3"), paragraph("وصف قصير.")]),
          card([image(), heading("بطاقة ثالثة", "h3"), paragraph("وصف قصير.")]),
        ]),
      ]),
    ],
  },
  {
    id: "feature-row",
    label: { ar: "صف مميزات", en: "Feature Row" },
    keywords: ["features", "icons", "مميزات"],
    nodes: [
      container([
        grid(3, [
          feature("truck", "توصيل سريع", "يصلك طلبك أينما كنت."),
          feature("shield", "دفع آمن", "ادفع عند الاستلام أو أونلاين."),
          feature("gift", "هدايا مميزة", "تغليف أنيق لكل طلب."),
        ]),
      ]),
    ],
  },
  {
    id: "stat-row",
    label: { ar: "صف أرقام", en: "Stat Row" },
    keywords: ["numbers", "stats", "أرقام"],
    nodes: [container([grid(4, [stat("+10K", "عميل سعيد"), stat("4.9", "تقييم"), stat("27", "محافظة"), stat("24/7", "خدمة عملاء")])])],
  },
];
