/**
 * The fixed element set for custom sections (docs/website-builder.md §4.4,
 * P4B-01/02): a Tallaby subset of the reference `element-definitions.ts`.
 * Only these node types render; every other `ALLOWED_NODE_TYPES` entry is
 * accepted by the schema (old data) and draws nothing.
 */
import { PRODUCT_SORTS, PRODUCT_SOURCES, type Localized, type PropDefinition } from "../core/types";
import type { StyleBreakpoint, StyleValues } from "./style";
import type { NodeTemplate } from "./tree";

export const ELEMENT_GROUPS = ["layout", "text", "basic", "data"] as const;
export type ElementGroup = (typeof ELEMENT_GROUPS)[number];

export const ELEMENT_ICON_NAMES = [
  "star",
  "heart",
  "check",
  "truck",
  "shield",
  "gift",
  "phone",
  "mail",
  "map-pin",
  "clock",
  "sparkles",
  "leaf",
  "tag",
  "shopping-bag",
  "credit-card",
  "arrow",
  "search",
  "user",
  "menu",
  "plus",
  "quote",
  "chat",
  "instagram",
  "facebook",
  "youtube",
  "play",
  "rotate",
  "package",
  "image",
  "copy",
  "globe",
  "award",
  "zap",
  "users",
  "store",
  "percent",
  "calendar",
  "headphones",
  "send",
] as const;
export type ElementIconName = (typeof ELEMENT_ICON_NAMES)[number];

export const PATTERN_VARIANTS = ["grid", "dots", "glow"] as const;
export type PatternVariant = (typeof PATTERN_VARIANTS)[number];

export type ElementType =
  | "section"
  | "card"
  | "pattern"
  | "accordion"
  | "accordionItem"
  | "container"
  | "vFlex"
  | "hFlex"
  | "grid"
  | "div"
  | "heading"
  | "paragraph"
  | "text"
  | "blockQuote"
  | "button"
  | "image"
  | "divider"
  | "spacer"
  | "icon"
  | "badge"
  | "list"
  | "listItem"
  | "linkBlock"
  | "textLink"
  | "productList"
  | "categoryList"
  | "postList"
  | "storeForm"
  | "addToCart";

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
  defaultChildren?: () => NodeTemplate[];
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

/** Elements that open a link or act on click; they never nest inside each other (no `<a>` in `<a>`). */
export const LINK_TYPES: readonly ElementType[] = ["button", "linkBlock", "textLink", "addToCart"];

const SOURCE_LABELS: Record<(typeof PRODUCT_SOURCES)[number], Localized> = {
  all: L("كل المنتجات", "All products"),
  newest: L("الأحدث", "Newest"),
  featured: L("المميزة", "Featured"),
  category: L("من قسم", "From a category"),
  selected: L("أختارها بنفسي", "Picked by hand"),
  "best-sellers": L("الأكثر مبيعًا", "Best sellers"),
  trending: L("الرائجة الآن", "Trending"),
  discounted: L("عليها خصم", "On sale"),
};
const SORT_LABELS: Record<(typeof PRODUCT_SORTS)[number], Localized> = {
  default: L("ترتيب المصدر", "Source order"),
  newest: L("الأحدث أولًا", "Newest first"),
  "price-asc": L("السعر: الأقل أولًا", "Price: low to high"),
  "price-desc": L("السعر: الأعلى أولًا", "Price: high to low"),
  rating: L("الأعلى تقييمًا", "Top rated"),
};

/** A template node showing one record field (`bind`); its own text is the editor placeholder. */
const bound = (type: ElementType, bind: string, text: string, en: string, style?: StyleValues): NodeTemplate => ({
  type,
  props: { bind, text, translations: { en: { text: en } } },
  children: [],
  ...(style && { style }),
});
const named = (ar: string, en: string) => ({ label: ar, translations: { en: { label: en } } });

/** The default item template of a product list: photo, name, prices and the cart button. */
function productCardTemplate(): NodeTemplate {
  return {
    type: "vFlex",
    props: named("بطاقة المنتج", "Product card"),
    style: { gap: 10 },
    children: [
      {
        type: "linkBlock",
        props: { bind: "href", href: "/products", ...named("صورة المنتج", "Product photo") },
        style: { radius: 16, overflow: "hidden", background: "secondary" },
        children: [{ type: "image", props: { bind: "image", src: "", alt: "" }, style: { aspectRatio: "square", objectFit: "cover" }, children: [] }],
      },
      bound("text", "title", "اسم المنتج", "Product name", { fontWeight: "semibold" }),
      {
        type: "hFlex",
        props: named("السعر", "Price"),
        style: { gap: 8, alignItems: "center" },
        children: [
          bound("text", "price", "٢٥٠ ج.م", "EGP 250", { fontWeight: "bold", color: "primary" }),
          bound("text", "compareAtPrice", "٣٠٠ ج.م", "EGP 300", { color: "muted" }),
        ],
      },
      { type: "addToCart", props: {}, children: [] },
    ],
  };
}

/** The default item template of a category list: a round photo and the name. */
function categoryCardTemplate(): NodeTemplate {
  return {
    type: "linkBlock",
    props: { bind: "href", href: "/products", ...named("القسم", "Category") },
    children: [
      {
        type: "vFlex",
        props: named("المحتوى", "Content"),
        style: { gap: 10, alignItems: "center" },
        children: [
          { type: "image", props: { bind: "image", src: "", alt: "" }, style: { aspectRatio: "square", objectFit: "cover", radius: 999 }, children: [] },
          bound("text", "name", "اسم القسم", "Category name", { fontWeight: "semibold", textAlign: "center" }),
        ],
      },
    ],
  };
}

/** The default item template of a post list: cover, date, title and excerpt. */
function postCardTemplate(): NodeTemplate {
  return {
    type: "vFlex",
    props: named("بطاقة المقال", "Post card"),
    style: { gap: 10 },
    children: [
      {
        type: "linkBlock",
        props: { bind: "href", href: "/blog", ...named("غلاف المقال", "Post cover") },
        style: { radius: 16, overflow: "hidden", background: "secondary" },
        children: [{ type: "image", props: { bind: "image", src: "", alt: "" }, style: { aspectRatio: "wide", objectFit: "cover" }, children: [] }],
      },
      bound("text", "date", "١ أكتوبر", "1 Oct", { color: "muted", fontSize: "xs" }),
      bound("heading", "title", "عنوان المقال", "Post title"),
      bound("paragraph", "excerpt", "سطر قصير من المقال.", "A short line from the post."),
    ],
  };
}

export const ELEMENT_DEFINITIONS: readonly ElementDefinition[] = [
  // Tree section root: the section itself (background, padding), one per tree.
  {
    type: "section",
    group: "layout",
    label: L("القسم", "Section"),
    keywords: ["section", "قسم"],
    container: true,
    defaultProps: {},
    defaultStyle: { paddingTop: 64, paddingBottom: 64 },
    defaultBreakpointStyles: { mobile: { paddingTop: 40, paddingBottom: 40 } },
    fields: [],
  },
  // Layout
  {
    type: "card",
    group: "layout",
    label: L("بطاقة", "Card"),
    keywords: ["card", "box", "بطاقة"],
    container: true,
    defaultProps: {},
    defaultStyle: {
      paddingTop: 24,
      paddingBottom: 24,
      paddingStart: 24,
      paddingEnd: 24,
      radius: 16,
      borderWidth: 1,
      borderColor: "border",
      background: "background",
    },
    fields: [],
  },
  {
    type: "pattern",
    group: "layout",
    label: L("زخرفة", "Pattern"),
    keywords: ["background", "decoration", "grid", "dots", "خلفية", "زخرفة"],
    container: false,
    defaultProps: { variant: "grid" },
    fields: [
      {
        key: "variant",
        label: L("الشكل", "Style"),
        type: "select",
        options: [
          { value: "grid", label: L("شبكة", "Grid") },
          { value: "dots", label: L("نقاط", "Dots") },
          { value: "glow", label: L("توهج", "Glow") },
        ],
      },
    ],
  },
  {
    type: "accordion",
    group: "layout",
    label: L("أسئلة قابلة للفتح", "Accordion"),
    keywords: ["faq", "accordion", "collapse", "أسئلة"],
    container: true,
    childTypes: ["accordionItem"],
    defaultProps: {},
    defaultStyle: { gap: 8 },
    defaultChildren: () => [
      { type: "accordionItem", props: { title: "سؤال شائع؟", open: true }, children: [{ type: "paragraph", props: { text: "الإجابة هنا." }, children: [] }] },
      { type: "accordionItem", props: { title: "سؤال آخر؟" }, children: [{ type: "paragraph", props: { text: "الإجابة هنا." }, children: [] }] },
    ],
    fields: [],
  },
  {
    type: "accordionItem",
    group: "layout",
    label: L("سؤال", "Accordion item"),
    keywords: ["question", "سؤال"],
    container: true,
    textProp: "title",
    defaultProps: { title: "سؤال جديد؟" },
    fields: [textField("title", L("السؤال", "Question"), 200), { key: "open", label: L("مفتوح في البداية", "Open at first"), type: "switch" }],
  },
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
    fields: [{ key: "src", label: L("الصورة", "Image"), type: "image" }, textField("alt", L("وصف الصورة", "Alt text"), 160)],
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
  // Store data (tree-sections spec §5.3): a list repeats its children once per record.
  {
    type: "productList",
    group: "data",
    label: L("قائمة منتجات", "Product list"),
    keywords: ["products", "catalog", "grid", "منتجات", "كتالوج"],
    container: true,
    defaultProps: { source: "newest", limit: 8 },
    defaultStyle: { columns: 4, gap: 16 },
    defaultBreakpointStyles: { tablet: { columns: 3 }, mobile: { columns: 2 } },
    defaultChildren: () => [productCardTemplate()],
    fields: [
      {
        key: "source",
        label: L("المنتجات المعروضة", "Products shown"),
        type: "select",
        group: "data",
        options: PRODUCT_SOURCES.filter((s) => s !== "all").map((value) => ({ value, label: SOURCE_LABELS[value] })),
      },
      { key: "categoryId", label: L("القسم", "Category"), type: "category", group: "data", showWhen: { key: "source", equals: ["category"] } },
      { key: "productIds", label: L("المنتجات", "Products"), type: "products", group: "data", showWhen: { key: "source", equals: ["selected"] } },
      {
        key: "sort",
        label: L("الترتيب", "Order"),
        type: "select",
        group: "data",
        options: PRODUCT_SORTS.map((value) => ({ value, label: SORT_LABELS[value] })),
      },
      { key: "limit", label: L("أقصى عدد", "Maximum"), type: "number", group: "data", min: 1, max: 24 },
    ],
  },
  {
    type: "categoryList",
    group: "data",
    label: L("قائمة أقسام", "Category list"),
    keywords: ["categories", "collections", "أقسام", "تصنيفات"],
    container: true,
    defaultProps: { limit: 8 },
    defaultStyle: { columns: 4, gap: 16 },
    defaultBreakpointStyles: { mobile: { columns: 2 } },
    defaultChildren: () => [categoryCardTemplate()],
    fields: [
      { key: "categoryIds", label: L("أقسام مختارة (فارغة = كل الأقسام)", "Chosen categories (empty = all)"), type: "categories", group: "data" },
      { key: "limit", label: L("أقصى عدد", "Maximum"), type: "number", group: "data", min: 1, max: 24 },
    ],
  },
  {
    type: "postList",
    group: "data",
    label: L("قائمة مقالات", "Post list"),
    keywords: ["blog", "posts", "articles", "مدونة", "مقالات"],
    container: true,
    defaultProps: { limit: 3 },
    defaultStyle: { columns: 3, gap: 24 },
    defaultBreakpointStyles: { tablet: { columns: 2 }, mobile: { columns: 1 } },
    defaultChildren: () => [postCardTemplate()],
    fields: [
      { key: "limit", label: L("أقصى عدد", "Maximum"), type: "number", group: "data", min: 1, max: 24 },
      { key: "offset", label: L("تخطَّ أول", "Skip the first"), type: "number", group: "data", min: 0, max: 10 },
    ],
  },
  {
    type: "storeForm",
    group: "data",
    label: L("نموذج", "Form"),
    keywords: ["form", "newsletter", "subscribe", "contact", "نموذج", "اشتراك"],
    container: false,
    defaultProps: {},
    fields: [{ key: "formId", label: L("النموذج", "Form"), type: "form", group: "data" }],
  },
  {
    type: "addToCart",
    group: "data",
    label: L("زر أضف للسلة", "Add to cart"),
    keywords: ["cart", "buy", "سلة", "شراء"],
    container: false,
    defaultProps: {},
    fields: [],
  },
];

const BY_TYPE = new Map(ELEMENT_DEFINITIONS.map((d) => [d.type, d]));

export function getElementDefinition(type: string): ElementDefinition | undefined {
  return BY_TYPE.get(type as ElementType);
}

/**
 * List items come with their list; a section is only a tree's root. Accordion
 * items stay in the palette so an emptied accordion can be refilled.
 */
const NOT_IN_PALETTE: readonly ElementType[] = ["listItem", "section"];

/** Types shown in the palette. */
export const PALETTE_TYPES: readonly ElementType[] = ELEMENT_DEFINITIONS.filter((d) => !NOT_IN_PALETTE.includes(d.type)).map((d) => d.type);

/** Limits per custom section (validated on save and publish, checked in the editor). */
export const MAX_NODES_PER_SECTION = 400;
export const MAX_ELEMENT_DEPTH = 12;
