/**
 * The fixed element set for custom sections (docs/website-builder.md §4.4,
 * P4B-01/02): a Tallaby subset of the reference `element-definitions.ts`.
 * Only these node types render; every other `ALLOWED_NODE_TYPES` entry is
 * accepted by the schema (old data) and draws nothing.
 */
import type { ComponentNode } from "../config/schema";
import type { Localized, PropDefinition } from "../core/types";
import type { StyleBreakpoint, StyleValues } from "./style";

export const ELEMENT_GROUPS = ["layout", "text", "basic"] as const;
export type ElementGroup = (typeof ELEMENT_GROUPS)[number];

export const ELEMENT_ICON_NAMES = [
  "star", "heart", "check", "truck", "shield", "gift", "phone", "mail", "map-pin", "clock",
  "sparkles", "leaf", "tag", "shopping-bag", "credit-card", "arrow",
] as const;
export type ElementIconName = (typeof ELEMENT_ICON_NAMES)[number];

export type ElementType =
  | "container" | "vFlex" | "hFlex" | "grid" | "div"
  | "heading" | "paragraph" | "text" | "blockQuote"
  | "button" | "image" | "divider" | "spacer" | "icon" | "badge" | "list" | "listItem" | "linkBlock" | "textLink";

export interface ElementDefinition {
  type: ElementType;
  group: ElementGroup;
  label: Localized;
  /** Extra words the palette search matches (both languages). */
  keywords: string[];
  /** Holds other elements. */
  container: boolean;
  /** When set, only these types may be direct children. */
  childTypes?: ElementType[];
  /** The text prop edited in place on the canvas (translatable). */
  textProp?: string;
  defaultProps: Record<string, unknown>;
  defaultStyle?: StyleValues;
  defaultBreakpointStyles?: Partial<Record<StyleBreakpoint, StyleValues>>;
  defaultChildren?: () => Omit<ComponentNode, "id">[];
  /** Content-tab fields (same contract as section props). */
  fields: PropDefinition[];
}

const textField = (key: string, label: Localized, max: number, type: "text" | "textarea" = "text"): PropDefinition => ({
  key,
  label,
  type,
  maxLength: max,
  translatable: true,
});
const L = (ar: string, en: string): Localized => ({ ar, en });

const linkField: PropDefinition = { key: "href", label: L("الرابط", "Link"), type: "url" };

/** Elements that open a link; they never nest inside each other (no `<a>` in `<a>`). */
export const LINK_TYPES: readonly ElementType[] = ["button", "linkBlock", "textLink"];

export const ELEMENT_DEFINITIONS: readonly ElementDefinition[] = [
  // Layout
  {
    type: "container",
    group: "layout",
    label: L("حاوية", "Container"),
    keywords: ["section", "wrapper", "قسم", "غلاف"],
    container: true,
    defaultProps: {},
    defaultStyle: { paddingTop: 16, paddingBottom: 16 },
    fields: [],
  },
  {
    type: "vFlex",
    group: "layout",
    label: L("عمود", "V Flex"),
    keywords: ["stack", "column", "vertical", "عمودي"],
    container: true,
    defaultProps: {},
    defaultStyle: { gap: 16 },
    fields: [],
  },
  {
    type: "hFlex",
    group: "layout",
    label: L("صف", "H Flex"),
    keywords: ["row", "horizontal", "أفقي"],
    container: true,
    defaultProps: {},
    defaultStyle: { gap: 16, alignItems: "center" },
    fields: [],
  },
  {
    type: "grid",
    group: "layout",
    label: L("شبكة", "Grid"),
    keywords: ["columns", "أعمدة"],
    container: true,
    defaultProps: {},
    defaultStyle: { columns: 3, gap: 16 },
    defaultBreakpointStyles: { tablet: { columns: 2 }, mobile: { columns: 1 } },
    fields: [],
  },
  {
    type: "div",
    group: "layout",
    label: L("صندوق", "Box"),
    keywords: ["div", "card", "بطاقة"],
    container: true,
    defaultProps: {},
    defaultStyle: { paddingTop: 16, paddingBottom: 16, paddingStart: 16, paddingEnd: 16, radius: 12, background: "secondary" },
    fields: [],
  },
  // Text
  {
    type: "heading",
    group: "text",
    label: L("عنوان", "Heading"),
    keywords: ["title", "h1", "h2", "عنوان"],
    container: false,
    textProp: "text",
    defaultProps: { text: "عنوان جديد", level: "h2" },
    fields: [
      textField("text", L("النص", "Text"), 200),
      {
        key: "level",
        label: L("المستوى", "Level"),
        type: "select",
        options: (["h1", "h2", "h3", "h4"] as const).map((v) => ({ value: v, label: L(v.toUpperCase(), v.toUpperCase()) })),
      },
    ],
  },
  {
    type: "paragraph",
    group: "text",
    label: L("فقرة", "Paragraph"),
    keywords: ["body", "description", "نص", "وصف"],
    container: false,
    textProp: "text",
    defaultProps: { text: "اكتب هنا نصًا يشرح فكرتك للعملاء." },
    fields: [textField("text", L("النص", "Text"), 2000, "textarea")],
  },
  {
    type: "text",
    group: "text",
    label: L("نص قصير", "Text"),
    keywords: ["label", "caption", "تسمية"],
    container: false,
    textProp: "text",
    defaultProps: { text: "نص قصير" },
    fields: [textField("text", L("النص", "Text"), 300)],
  },
  {
    type: "blockQuote",
    group: "text",
    label: L("اقتباس", "Quote"),
    keywords: ["blockquote", "testimonial", "رأي"],
    container: false,
    textProp: "text",
    defaultProps: { text: "اقتباس ملهم من عميل سعيد." },
    fields: [textField("text", L("النص", "Text"), 600, "textarea")],
  },
  // Basic
  {
    type: "button",
    group: "basic",
    label: L("زر", "Button"),
    keywords: ["cta", "link", "رابط"],
    container: false,
    textProp: "label",
    defaultProps: { label: "تسوّق الآن", href: "/#products", variant: "solid" },
    fields: [
      textField("label", L("نص الزر", "Label"), 60),
      linkField,
      {
        key: "variant",
        label: L("الشكل", "Style"),
        type: "select",
        options: [
          { value: "solid", label: L("ممتلئ", "Solid") },
          { value: "outline", label: L("محدد", "Outline") },
          { value: "light", label: L("فاتح", "Light") },
        ],
      },
    ],
  },
  {
    type: "image",
    group: "basic",
    label: L("صورة", "Image"),
    keywords: ["photo", "picture", "صورة"],
    container: false,
    defaultProps: { src: "", alt: "" },
    defaultStyle: { radius: 12, aspectRatio: "landscape", objectFit: "cover" },
    fields: [
      { key: "src", label: L("الصورة", "Image"), type: "image" },
      textField("alt", L("وصف الصورة", "Alt text"), 160),
    ],
  },
  {
    type: "divider",
    group: "basic",
    label: L("فاصل", "Divider"),
    keywords: ["hr", "line", "خط"],
    container: false,
    defaultProps: {},
    defaultStyle: { marginTop: 8, marginBottom: 8 },
    fields: [],
  },
  {
    type: "spacer",
    group: "basic",
    label: L("مسافة", "Spacer"),
    keywords: ["gap", "space", "فراغ"],
    container: false,
    defaultProps: {},
    defaultStyle: { minHeight: 32 },
    fields: [],
  },
  {
    type: "icon",
    group: "basic",
    label: L("أيقونة", "Icon"),
    keywords: ["symbol", "رمز"],
    container: false,
    defaultProps: { name: "star" },
    defaultStyle: { color: "primary", fontSize: "2xl" },
    fields: [
      {
        key: "name",
        label: L("الأيقونة", "Icon"),
        type: "select",
        options: ELEMENT_ICON_NAMES.map((v) => ({ value: v, label: L(v, v) })),
      },
    ],
  },
  {
    type: "badge",
    group: "basic",
    label: L("شارة", "Badge"),
    keywords: ["tag", "label", "pill", "وسم"],
    container: false,
    textProp: "text",
    defaultProps: { text: "جديد" },
    fields: [textField("text", L("النص", "Text"), 40)],
  },
  {
    type: "list",
    group: "basic",
    label: L("قائمة", "List"),
    keywords: ["bullets", "ul", "نقاط"],
    container: true,
    childTypes: ["listItem"],
    defaultProps: { ordered: false },
    defaultChildren: () => [
      { type: "listItem", props: { text: "العنصر الأول" }, children: [] },
      { type: "listItem", props: { text: "العنصر الثاني" }, children: [] },
    ],
    fields: [{ key: "ordered", label: L("مرقّمة", "Numbered"), type: "switch" }],
  },
  {
    type: "listItem",
    group: "basic",
    label: L("عنصر قائمة", "List item"),
    keywords: ["li", "bullet"],
    container: false,
    textProp: "text",
    defaultProps: { text: "عنصر" },
    fields: [textField("text", L("النص", "Text"), 300)],
  },
  {
    type: "linkBlock",
    group: "basic",
    label: L("رابط صندوق", "Link block"),
    keywords: ["card link", "clickable", "بطاقة رابط"],
    container: true,
    defaultProps: { href: "/" },
    defaultStyle: { paddingTop: 12, paddingBottom: 12, paddingStart: 12, paddingEnd: 12 },
    fields: [linkField],
  },
  {
    type: "textLink",
    group: "basic",
    label: L("رابط نصي", "Text link"),
    keywords: ["anchor", "a", "رابط"],
    container: false,
    textProp: "text",
    defaultProps: { text: "اعرف المزيد", href: "/" },
    fields: [textField("text", L("النص", "Text"), 120), linkField],
  },
];

const BY_TYPE = new Map(ELEMENT_DEFINITIONS.map((d) => [d.type, d]));

export function getElementDefinition(type: string): ElementDefinition | undefined {
  return BY_TYPE.get(type as ElementType);
}

/** Types shown in the palette (list items come with their list). */
export const PALETTE_TYPES: readonly ElementType[] = ELEMENT_DEFINITIONS.filter((d) => d.type !== "listItem").map((d) => d.type);

/** Limits per custom section (validated on save and publish, checked in the editor). */
export const MAX_NODES_PER_SECTION = 300;
export const MAX_ELEMENT_DEPTH = 8;
