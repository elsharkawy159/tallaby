/**
 * The fixed element set for custom sections (docs/website-builder.md §4.4,
 * P4B-01/02): a Tallaby subset of the reference `element-definitions.ts`.
 * Only these node types render; every other `ALLOWED_NODE_TYPES` entry is
 * accepted by the schema (old data) and draws nothing.
 */
import { PRODUCT_SORTS, PRODUCT_SOURCES, type Localized, type PropDefinition } from "../core/types";
import { MARQUEE_SPEED, REVEAL_CHOICES, REVEAL_V2_VARIANTS, type RevealChoice } from "./motion";
import type { StyleBreakpoint, StyleValues } from "./style";
import type { NodeTemplate } from "./tree";
import { VIDEO_CAPABILITIES, parseVideoUrl } from "./video";
import { IMAGE_SCROLL_EFFECTS } from "./scroll-progress.lib";
import { BEFORE_AFTER } from "./before-after.lib";

export const ELEMENT_GROUPS = ["layout", "text", "basic", "data", "product"] as const;
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
  "wrench",
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
  | "video"
  | "videoPlaylist"
  | "videoItem"
  | "carousel"
  | "slide"
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
  | "addToCart"
  | "wishlistButton"
  | "languageSwitcher"
  | "storeLogo"
  | "themeToggle"
  | "accountLink"
  | "appInstall"
  | "mobileMenu"
  | "productBreadcrumbs"
  | "productGallery"
  | "productPrice"
  | "productStock"
  | "productStockBadge"
  | "productRating"
  | "productVariants"
  | "productBuyBox"
  | "productDetails"
  | "productContent"
  | "productSeller"
  | "productReviews"
  | "productCrossSell"
  | "marquee"
  | "countdown"
  | "beforeAfter"
  | "hotspot";

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
  /** Hides fields that don't apply to these props beyond `showWhen`/`hideWhen` (a video site's unsupported options). */
  hideField?: (key: string, props: Record<string, unknown>) => boolean;
  /**
   * Props the platform writes and keeps, never shown in the inspector (the
   * section's motion v2 marker, `props.motion`, written by `defineDesign`).
   */
  systemProps?: readonly string[];
}

const textField = (key: string, label: Localized, max: number, type: "text" | "textarea" = "text"): PropDefinition => ({
  key,
  label,
  type,
  maxLength: max,
  translatable: true,
});
const L = (ar: string, en: string): Localized => ({ ar, en });

/** Motion v2 (advanced): a photo drifts (parallax) or grows (zoom) as the page scrolls, inside its own frame (`scroll-plan.ts`). */
const SCROLL_EFFECT_LABELS: Record<(typeof IMAGE_SCROLL_EFFECTS)[number], Localized> = {
  none: L("بدون", "None"),
  parallax: L("حركة عمق مع التمرير", "Parallax"),
  zoom: L("تكبير مع التمرير", "Zoom on scroll"),
};
const scrollEffectField: PropDefinition = {
  key: "scrollEffect",
  label: L("الحركة مع التمرير", "Scroll effect"),
  type: "select",
  group: "advanced",
  options: IMAGE_SCROLL_EFFECTS.map((value) => ({ value, label: SCROLL_EFFECT_LABELS[value] })),
};
/** Motion v2 (advanced): a stat (`role: "value"`, statistics designs) counts up to its number once it scrolls into view. */
const countUpField: PropDefinition = {
  key: "countUp",
  label: L("عدّ الرقم عند الظهور", "Count up when shown"),
  type: "switch",
  group: "advanced",
  showWhen: { key: "role", equals: ["value"] },
};

const linkField: PropDefinition = { key: "href", label: L("الرابط", "Link"), type: "url" };

const videoUrlField: PropDefinition = {
  key: "url",
  label: L("رابط الفيديو", "Video link"),
  type: "video",
  placeholder: L("https://…", "https://…"),
  hint: L("يوتيوب، فيميو، تيك توك، إنستجرام، فيسبوك أو ملف فيديو (mp4).", "YouTube, Vimeo, TikTok, Instagram, Facebook or a video file (mp4)."),
};

const playbackFields: PropDefinition[] = [
  {
    key: "autoplay",
    label: L("تشغيل تلقائي", "Autoplay"),
    type: "switch",
    group: "advanced",
    hint: L("يبدأ صامتًا، فالمتصفحات لا تشغّل الصوت تلقائيًا.", "Starts muted: browsers never autoplay sound."),
  },
  { key: "muted", label: L("كتم الصوت", "Muted"), type: "switch", group: "advanced", hideWhen: { key: "autoplay", equals: [true] } },
  { key: "loop", label: L("تكرار", "Loop"), type: "switch", group: "advanced" },
  { key: "controls", label: L("أزرار التحكم", "Player controls"), type: "switch", group: "advanced" },
  { key: "start", label: L("يبدأ من (ثانية)", "Start at (seconds)"), type: "number", group: "advanced", min: 0, max: 86400 },
  { key: "end", label: L("ينتهي عند (ثانية)", "End at (seconds)"), type: "number", group: "advanced", min: 0, max: 86400 },
];

/** A video's options its site can't do (Instagram has none, TikTok can't start later…). */
function hideUnsupported(key: string, props: Record<string, unknown>): boolean {
  const source = parseVideoUrl(props.url);
  if (!source) return false;
  const can = VIDEO_CAPABILITIES[source.provider] as Record<string, boolean>;
  return key in can && !can[key];
}

/**
 * The single video's fields for these props: the thumbnail image only with a
 * custom thumbnail or as a background; a background video has no thumbnail
 * choice or playback options (it always plays muted on a loop).
 */
function hideVideoField(key: string, props: Record<string, unknown>): boolean {
  const background = props.background === true;
  if (key === "poster") return !background && props.thumbnail !== "custom";
  if (background && (key === "thumbnail" || playbackFields.some((f) => f.key === key))) return true;
  return hideUnsupported(key, props);
}

/** Elements that open a link or act on click (a playlist's rows are links); they never nest inside each other (no `<a>` in `<a>`). */
export const LINK_TYPES: readonly ElementType[] = [
  "button",
  "linkBlock",
  "textLink",
  "addToCart",
  "wishlistButton",
  "videoPlaylist",
  // Product parts with links or interactive content of their own (zoom, #reviews, swatches,
  // cart buttons, collapsible rows, links in the product's content, review tabs, breadcrumb links).
  "productBreadcrumbs",
  "productGallery",
  "productRating",
  "productVariants",
  "productBuyBox",
  "productDetails",
  "productContent",
  "productReviews",
  "productCrossSell",
  // A slider handle, and a dot whose popover holds a product link and the cart button.
  "beforeAfter",
  "hotspot",
];

const SOURCE_LABELS: Record<(typeof PRODUCT_SOURCES)[number], Localized> = {
  all: L("كل المنتجات", "All products"),
  newest: L("الأحدث", "Newest"),
  featured: L("المميزة", "Featured"),
  category: L("من قسم", "From a category"),
  selected: L("أختارها بنفسي", "Picked by hand"),
  "best-sellers": L("الأكثر مبيعًا", "Best sellers"),
  trending: L("الرائجة الآن", "Trending"),
  discounted: L("عليها خصم", "On sale"),
  related: L("منتجات مشابهة", "Related products"),
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

const DEFINITIONS: readonly ElementDefinition[] = [
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
    // Motion v2 marker (`elements/motion.ts` MOTION_V2_PROP): 2 on sections inserted from the library or a template.
    systemProps: ["motion"],
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
    fields: [textField("text", L("النص", "Text"), 300), countUpField],
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
    fields: [{ key: "src", label: L("الصورة", "Image"), type: "image" }, textField("alt", L("وصف الصورة", "Alt text"), 160), scrollEffectField],
  },
  {
    type: "video",
    group: "basic",
    label: L("فيديو", "Video"),
    keywords: ["video", "youtube", "shorts", "tiktok", "instagram", "reels", "facebook", "vimeo", "mp4", "player", "فيديو", "يوتيوب", "تيك توك", "ريلز"],
    container: false,
    defaultProps: { url: "", thumbnail: "auto", controls: true },
    defaultStyle: { radius: 16, aspectRatio: "wide" },
    fields: [
      videoUrlField,
      {
        key: "thumbnail",
        label: L("صورة الغلاف", "Thumbnail"),
        type: "select",
        options: [
          { value: "auto", label: L("تلقائي", "Automatic") },
          { value: "custom", label: L("صورتي", "My image") },
          { value: "none", label: L("بدون", "None") },
        ],
        hint: L("مع الغلاف يتحمّل الفيديو عند الضغط فقط، فتبقى الصفحة سريعة.", "With a thumbnail the video loads only on click, so the page stays fast."),
        hideWhen: { key: "autoplay", equals: [true] },
      },
      { key: "poster", label: L("صورة الغلاف", "Thumbnail image"), type: "image" },
      textField("title", L("عنوان الفيديو (لقارئات الشاشة)", "Video title (for screen readers)"), 120),
      {
        key: "background",
        label: L("فيديو خلفية", "Background video"),
        type: "switch",
        group: "advanced",
        hint: L(
          "لملف فيديو (mp4): يملأ مكانه ويشتغل صامتًا ومتكررًا بدون أزرار، وتظهر صورة الغلاف أولًا.",
          "For a video file (mp4): fills its frame, plays muted on a loop without controls, and the thumbnail image shows first.",
        ),
      },
      ...playbackFields,
    ],
    hideField: hideVideoField,
  },
  {
    type: "videoPlaylist",
    group: "basic",
    label: L("قائمة فيديوهات", "Video playlist"),
    keywords: ["playlist", "videos", "guide", "series", "قائمة", "فيديوهات", "شروحات"],
    container: true,
    childTypes: ["videoItem"],
    defaultProps: { listPosition: "end", controls: true },
    defaultStyle: { gap: 24 },
    defaultChildren: () => [1, 2, 3].map((n) => ({ type: "videoItem", props: { url: "", title: `فيديو ${n}`, translations: { en: { title: `Video ${n}` } } }, children: [] })),
    fields: [
      {
        key: "listPosition",
        label: L("مكان القائمة", "List position"),
        type: "select",
        options: [
          { value: "end", label: L("بجانب المشغل", "Beside") },
          { value: "start", label: L("قبل المشغل", "Before") },
          { value: "below", label: L("تحت المشغل", "Below") },
        ],
        hint: L("على الموبايل تكون القائمة تحت المشغل دائمًا.", "On phones the list is always below the player."),
      },
      { key: "controls", label: L("أزرار التحكم", "Player controls"), type: "switch", group: "advanced" },
    ],
  },
  {
    type: "videoItem",
    group: "basic",
    label: L("فيديو في القائمة", "Playlist video"),
    keywords: ["video", "فيديو"],
    container: false,
    defaultProps: { url: "", title: "فيديو جديد" },
    fields: [
      videoUrlField,
      textField("title", L("العنوان", "Title"), 120),
      textField("duration", L("المدة", "Length"), 12),
      {
        key: "poster",
        label: L("الصورة المصغّرة", "Thumbnail image"),
        type: "image",
        hint: L("فيديوهات يوتيوب تأخذ صورتها تلقائيًا.", "YouTube videos get their own still automatically."),
      },
    ],
  },
  // Banner carousel (Claude Design "Banner carousel" hero, 2026-10-23): one slide in view at a time,
  // swiped on phones; with JS (CarouselRuntime on the host) it autoplays, pausing on hover, focus,
  // the pause button, a hidden tab or off-screen, and starts paused with reduced motion.
  {
    type: "carousel",
    group: "layout",
    label: L("شرائح متحركة", "Carousel"),
    keywords: ["carousel", "slider", "slides", "banner", "سلايدر", "شرائح", "بانر"],
    container: true,
    childTypes: ["slide"],
    defaultProps: { autoplay: true, interval: 5 },
    defaultChildren: () =>
      [1, 2].map((n) => ({
        type: "slide",
        props: {},
        style: { minHeight: 360, justifyContent: "center", gap: 12, paddingTop: 40, paddingBottom: 40, paddingStart: 40, paddingEnd: 40, background: "secondary" },
        children: [{ type: "heading", props: { text: `الشريحة ${n}`, level: "h2", translations: { en: { text: `Slide ${n}` } } }, children: [] }],
      })),
    fields: [
      { key: "autoplay", label: L("تشغيل تلقائي", "Autoplay"), type: "switch" },
      {
        key: "interval",
        label: L("مدة كل شريحة (ثانية)", "Seconds per slide"),
        type: "number",
        min: 3,
        max: 15,
        showWhen: { key: "autoplay", equals: [true] },
      },
      {
        key: "controls",
        label: L("مكان الأزرار", "Controls"),
        type: "select",
        options: [
          { value: "bar", label: L("شريط تحت", "Bar at the bottom") },
          { value: "sides", label: L("أسهم على الجنبين", "Arrows at the sides") },
        ],
      },
    ],
  },
  {
    type: "slide",
    group: "layout",
    label: L("شريحة", "Slide"),
    keywords: ["slide", "شريحة"],
    container: true,
    defaultProps: {},
    defaultStyle: { minHeight: 360, gap: 12 },
    fields: [],
  },
  // Scrolling marquee (Claude Design premium set, 2026-10-27; docs/section-rules.md §6.3): its items loop
  // sideways with fixed CSS, pause on hover, and wrap into a still row with reduced motion or Animations off.
  {
    type: "marquee",
    group: "layout",
    label: L("شريط متحرك", "Marquee"),
    keywords: ["marquee", "ticker", "scrolling text", "loop", "شريط متحرك", "نص متحرك"],
    container: true,
    // Light items only: the row is drawn twice, so no players, forms or data lists.
    childTypes: ["text", "heading", "badge", "icon", "image", "linkBlock", "textLink", "hFlex", "vFlex", "div"],
    defaultProps: { speed: 30 },
    defaultStyle: { gap: 40, alignItems: "center" },
    defaultChildren: () =>
      [
        ["توصيل لكل المحافظات", "Delivery to every governorate"],
        ["الدفع عند الاستلام", "Cash on delivery"],
        ["استبدال خلال ١٤ يوم", "Exchange within 14 days"],
      ].map(([ar, en]) => ({ type: "text", props: { text: ar, translations: { en: { text: en } } }, children: [] })),
    fields: [
      {
        key: "speed",
        label: L("مدة الدورة (ثانية)", "Seconds per loop"),
        type: "number",
        min: MARQUEE_SPEED.min,
        max: MARQUEE_SPEED.max,
        hint: L("رقم أكبر = حركة أبطأ.", "A bigger number moves slower."),
      },
    ],
  },
  // Live countdown to a date the seller sets (Claude Design premium set, 2026-10-27). Drawn with the time
  // left at render; the host's motion runtime ticks it. Publicly it hides once the date has passed or when unset.
  {
    type: "countdown",
    group: "basic",
    label: L("عداد تنازلي", "Countdown"),
    keywords: ["countdown", "timer", "deadline", "sale ends", "عداد", "عد تنازلي", "مؤقت"],
    container: false,
    textProp: "caption",
    defaultProps: { endsAt: "", caption: "" },
    fields: [
      textField("caption", L("نص فوق العداد", "Caption"), 80),
      {
        key: "endsAt",
        label: L("ينتهي في", "Ends at"),
        type: "datetime",
        hint: L("يختفي العداد من المتجر بعد هذا الوقت أو لو فاضي.", "The countdown hides on the store after this time, or while it is empty."),
      },
    ],
  },
  // Before and after (look-first pilot L5, 2026-11-11; docs/systems/plan.md §10.1): two boxes in one frame,
  // the first (Before) over the second (After), cut at a handle the visitor drags. Each box holds its photo
  // and, if wanted, a label, so both stay ordinary elements. Without script the frame is split at `start`.
  {
    type: "beforeAfter",
    group: "basic",
    label: L("قبل وبعد", "Before and after"),
    keywords: ["before", "after", "compare", "comparison", "slider", "result", "قبل", "بعد", "مقارنة", "نتيجة"],
    container: true,
    childTypes: ["div"],
    defaultProps: { start: BEFORE_AFTER.fallback },
    defaultStyle: { radius: 16, overflow: "hidden" },
    defaultChildren: () =>
      (
        [
          ["قبل", "Before", "insetStart"],
          ["بعد", "After", "insetEnd"],
        ] as const
      ).map(([ar, en, side]) => ({
        type: "div",
        props: named(ar, en),
        style: { position: "relative", overflow: "hidden", background: "secondary" },
        children: [
          { type: "image", props: { src: "", alt: ar, translations: { en: { alt: en } } }, style: { aspectRatio: "landscape", objectFit: "cover", width: "100%", radius: 0 }, children: [] },
          {
            type: "badge",
            props: { text: ar, translations: { en: { text: en } } },
            style: { position: "absolute", insetTop: "12px", [side]: "12px", background: "foreground", color: "background", radius: 999 },
            children: [],
          },
        ],
      })),
    fields: [
      {
        key: "start",
        label: L("مكان الفاصل في البداية (٪)", "Handle start position (%)"),
        type: "number",
        min: BEFORE_AFTER.min,
        max: BEFORE_AFTER.max,
        hint: L(
          "٥٠ = النص. رقم أكبر يُظهر أكثر من صورة «قبل». الصندوق الأول هو «قبل» والثاني «بعد».",
          "50 = the middle. A bigger number shows more of the Before photo. The first box is Before, the second is After.",
        ),
      },
    ],
  },
  // A dot on a photo (look-first pilot L5, 2026-11-11; docs/systems/plan.md §10.1): it sits inside a Box that
  // holds the photo, placed by percent, and opens a popover with a store product or the seller's own note.
  {
    type: "hotspot",
    group: "basic",
    label: L("نقطة على صورة", "Photo dot"),
    keywords: ["hotspot", "dot", "pin", "shop the look", "lookbook", "tooltip", "anatomy", "نقطة", "علامة", "تسوق اللوك", "تفاصيل"],
    container: false,
    defaultProps: {
      kind: "text",
      x: 50,
      y: 50,
      title: "ميزة في المنتج",
      body: "اكتب هنا سطرًا يشرح هذا الجزء.",
      translations: { en: { title: "A product feature", body: "Write a line that explains this part." } },
    },
    fields: [
      {
        key: "kind",
        label: L("ماذا تعرض النقطة", "What the dot shows"),
        type: "select",
        options: [
          { value: "product", label: L("منتج من المتجر", "A store product") },
          { value: "text", label: L("نص من عندي", "My own text") },
        ],
      },
      { key: "productId", label: L("المنتج", "Product"), type: "product", group: "data", showWhen: { key: "kind", equals: ["product"] } },
      {
        key: "productIndex",
        label: L("أو: ترتيب المنتج في متجرك", "Or: the product by its place in your store"),
        type: "number",
        group: "data",
        min: 1,
        max: 8,
        showWhen: { key: "kind", equals: ["product"] },
        hint: L("بدون منتج مختار: ١ = أحدث منتج في متجرك، ٢ = اللي قبله، وهكذا.", "With no product picked: 1 = your newest product, 2 = the one before it, and so on."),
      },
      { ...textField("title", L("العنوان", "Title"), 80), showWhen: { key: "kind", equals: ["text"] } },
      { ...textField("body", L("النص", "Text"), 400, "textarea"), showWhen: { key: "kind", equals: ["text"] } },
      {
        key: "x",
        label: L("المكان من يسار الصورة (٪)", "Position from the photo's left (%)"),
        type: "number",
        min: 0,
        max: 100,
        hint: L("٠ = أقصى اليسار، ١٠٠ = أقصى اليمين. الصورة لا تنعكس في العربية، فالنقطة تبقى على نفس الجزء.", "0 = the left edge, 100 = the right edge. A photo is not mirrored in Arabic, so the dot stays on the same part."),
      },
      { key: "y", label: L("المكان من أعلى الصورة (٪)", "Position from the photo's top (%)"), type: "number", min: 0, max: 100 },
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
      {
        key: "categoryIndex",
        label: L("أو: ترتيب القسم في متجرك", "Or: the category by its place in your store"),
        type: "number",
        group: "data",
        min: 1,
        max: 8,
        showWhen: { key: "source", equals: ["category"] },
        hint: L("بدون قسم مختار: ١ = أول قسم في متجرك، ٢ = التاني، وهكذا.", "With no category picked: 1 = your store's first category, 2 = the second, and so on."),
      },
      { key: "productIds", label: L("المنتجات", "Products"), type: "products", group: "data", showWhen: { key: "source", equals: ["selected"] } },
      {
        key: "sort",
        label: L("الترتيب", "Order"),
        type: "select",
        group: "data",
        options: PRODUCT_SORTS.map((value) => ({ value, label: SORT_LABELS[value] })),
      },
      { key: "limit", label: L("أقصى عدد", "Maximum"), type: "number", group: "data", min: 1, max: 24 },
      { key: "paginate", label: L("تقسيم على صفحات", "Split into pages"), type: "switch", group: "data" },
      {
        key: "hoverSecondImage",
        label: L("الصورة التانية عند المرور", "Show second photo on hover"),
        type: "switch",
        defaultOn: true,
        group: "layout",
        hint: L("عند المرور على البطاقة تتلاشى الصورة الأولى وتظهر الصورة التانية للمنتج.", "Hovering a card fades the first photo out to show the product's second photo."),
      },
      { key: "mobileRail", label: L("صف يُسحب على الجوال", "Swipe row on phones"), type: "switch", group: "layout", hint: L("على الجوال تصطف البطاقات في صف واحد يُسحب جانبيًا، ويظهر طرف البطاقة التالية.", "On phones the cards sit in one row that swipes sideways, with the next card peeking in.") },
      {
        key: "rail",
        label: L("شريط متحرك على كل الشاشات", "Carousel row on every screen"),
        type: "switch",
        group: "layout",
        hint: L("صف واحد بأسهم: ٤ بطاقات على الكمبيوتر و٣ على التابلت، ويُسحب على الجوال.", "One row with arrows: 4 cards on desktop, 3 on tablets, and it swipes on phones."),
      },
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
      { key: "mobileRail", label: L("صف يُسحب على الجوال", "Swipe row on phones"), type: "switch", group: "layout", hint: L("على الجوال تصطف البطاقات في صف واحد يُسحب جانبيًا، ويظهر طرف البطاقة التالية.", "On phones the cards sit in one row that swipes sideways, with the next card peeking in.") },
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
  {
    type: "wishlistButton",
    group: "data",
    label: L("زر المفضلة", "Wishlist button"),
    keywords: ["wishlist", "favourite", "favorite", "heart", "مفضلة", "قلب"],
    container: false,
    defaultProps: {},
    fields: [],
  },
  {
    type: "languageSwitcher",
    group: "data",
    label: L("تبديل اللغة", "Language switcher"),
    keywords: ["language", "translation", "locale", "لغة", "ترجمة"],
    container: false,
    defaultProps: {},
    fields: [],
  },
  // Header/footer options (config/header.ts `drawChrome`): drawn where the chrome renders, never placed by hand.
  {
    type: "storeLogo",
    group: "data",
    label: L("شعار المتجر", "Store logo"),
    keywords: ["logo", "brand", "شعار"],
    container: false,
    defaultProps: { size: "md" },
    fields: [],
  },
  {
    type: "themeToggle",
    group: "data",
    label: L("الوضع الفاتح والداكن", "Theme toggle"),
    keywords: ["theme", "dark", "light", "mode", "داكن", "فاتح", "وضع"],
    container: false,
    defaultProps: {},
    fields: [],
  },
  {
    type: "accountLink",
    group: "data",
    label: L("تسجيل الدخول", "Sign in"),
    keywords: ["login", "sign in", "account", "دخول", "حساب"],
    container: false,
    defaultProps: {},
    fields: [],
  },
  // The store app's "Download application" button (ROADMAP.md F-36), drawn in every footer the store allows it in.
  {
    type: "appInstall",
    group: "data",
    label: L("تحميل التطبيق", "Download application"),
    keywords: ["app", "pwa", "install", "download", "تطبيق", "تحميل"],
    container: false,
    defaultProps: {},
    fields: [],
  },
  // The header's burger menu on phones (config/header.ts `drawChrome`): its children are copies of the menu links.
  {
    type: "mobileMenu",
    group: "data",
    label: L("قائمة الموبايل", "Mobile menu"),
    keywords: ["menu", "burger", "mobile", "قائمة", "موبايل"],
    container: true,
    defaultProps: {},
    fields: [],
  },
  // Product page (template product page spec §5.3): parts of the page's product. The storefront
  // swaps the interactive ones for the host's components; the editor draws still renderings.
  {
    type: "productBreadcrumbs",
    group: "product",
    label: L("مسار الصفحة", "Breadcrumbs"),
    keywords: ["breadcrumbs", "breadcrumb", "path", "back", "category", "مسار", "رجوع", "قسم"],
    container: false,
    defaultProps: { showCategory: true },
    fields: [
      { key: "showCategory", label: L("قسم المنتج", "Product category"), type: "switch" },
      { ...textField("homeLabel", L("نص الرئيسية", "Home label"), 40), placeholder: L("الرئيسية", "Home") },
    ],
  },
  {
    type: "productGallery",
    group: "product",
    label: L("صور المنتج", "Product gallery"),
    keywords: ["gallery", "images", "photos", "media", "صور", "معرض"],
    container: false,
    defaultProps: { thumbs: "side", zoom: true },
    fields: [
      {
        key: "thumbs",
        label: L("الصور المصغّرة", "Thumbnails"),
        type: "select",
        options: [
          { value: "side", label: L("بجانب الصورة", "Beside") },
          { value: "bottom", label: L("تحت الصورة", "Below") },
          { value: "none", label: L("بدون", "None") },
        ],
        hint: L("على الموبايل تكون الصور المصغّرة تحت الصورة.", "On phones the thumbnails sit below the image."),
      },
      { key: "zoom", label: L("تكبير عند المرور", "Zoom on hover"), type: "switch" },
    ],
  },
  {
    type: "productPrice",
    group: "product",
    label: L("سعر المنتج", "Product price"),
    keywords: ["price", "discount", "sale", "سعر", "خصم"],
    container: false,
    defaultProps: { showDiscount: true, showCountdown: true },
    fields: [
      { key: "showDiscount", label: L("نسبة الخصم", "Discount badge"), type: "switch" },
      { key: "showCountdown", label: L("العدّ التنازلي للعرض", "Offer countdown"), type: "switch" },
    ],
  },
  {
    type: "productStock",
    group: "product",
    label: L("حالة المخزون", "Stock status"),
    keywords: ["stock", "inventory", "availability", "مخزون", "متوفر"],
    container: false,
    defaultProps: {},
    fields: [],
  },
  // The seller's low-stock alert as its own element (ROADMAP.md F-34d), to move and style. It shows
  // only when the product's "Show a low-stock alert" box is ticked and its real stock is at or below
  // the threshold; while the page has one, the stock element no longer shows the alert itself.
  {
    type: "productStockBadge",
    group: "product",
    label: L("تنبيه قرب نفاد الكمية", "Low-stock badge"),
    keywords: ["stock", "low stock", "badge", "urgency", "left", "scarcity", "مخزون", "قرب يخلص", "فاضل", "باقي", "تنبيه", "شارة"],
    container: false,
    defaultProps: {},
    fields: [],
  },
  {
    type: "productRating",
    group: "product",
    label: L("تقييم المنتج", "Product rating"),
    keywords: ["rating", "stars", "reviews", "تقييم", "نجوم"],
    container: false,
    defaultProps: { showCount: true, showCategory: true },
    fields: [
      { key: "showCount", label: L("عدد التقييمات", "Review count"), type: "switch" },
      {
        key: "showCategory",
        label: L("قسم المنتج", "Product category"),
        type: "switch",
        hint: L("شارة القسم بتظهر حتى لو المنتج لسه مالوش تقييمات.", "The category badge shows even before the product has reviews."),
      },
    ],
  },
  {
    type: "productVariants",
    group: "product",
    label: L("اختيارات المنتج", "Variant picker"),
    keywords: ["variants", "options", "color", "size", "اختيارات", "لون", "مقاس"],
    container: false,
    defaultProps: {},
    fields: [],
  },
  {
    type: "productBuyBox",
    group: "product",
    label: L("الكمية وأزرار الشراء", "Buy buttons"),
    keywords: ["buy", "cart", "quantity", "checkout", "شراء", "سلة", "كمية"],
    container: false,
    defaultProps: { buyNow: true, stickyMobile: true, variant: "solid", perks: true },
    fields: [
      { ...textField("addLabel", L("نص زر السلة", "Add to cart label"), 60), placeholder: L("أضف للسلة", "Add to cart") },
      {
        key: "variant",
        label: L("شكل الزر", "Button style"),
        type: "select",
        options: [
          { value: "solid", label: L("ممتلئ", "Solid") },
          { value: "outline", label: L("محدد", "Outline") },
        ],
      },
      { key: "buyNow", label: L("زر «اشترِ الآن»", "“Buy now” button"), type: "switch" },
      {
        ...textField("buyLabel", L("نص زر الشراء", "Buy now label"), 60),
        placeholder: L("اشترِ الآن", "Buy now"),
        showWhen: { key: "buyNow", equals: [true] },
      },
      {
        key: "stickyMobile",
        label: L("شريط ثابت على الموبايل", "Sticky bar on phones"),
        type: "switch",
        hint: L("يبقى زر الشراء ظاهرًا أسفل الشاشة أثناء التمرير.", "Keeps the buy button at the bottom of the screen while scrolling."),
      },
      {
        key: "perks",
        label: L("مميزات الشراء", "Perks box"),
        type: "switch",
        hint: L("صندوق تحت زر الشراء: توصيل سريع، الدفع عند الاستلام، جودة عالية.", "A box under the buy buttons: fast delivery, pay on delivery, high quality."),
      },
    ],
  },
  {
    type: "productDetails",
    group: "product",
    label: L("تفاصيل المنتج", "Product details"),
    keywords: ["description", "details", "features", "accordion", "وصف", "تفاصيل", "مميزات"],
    container: false,
    defaultProps: { showDescription: true, showBullets: true, showDelivery: true },
    fields: [
      { key: "showDescription", label: L("الوصف", "Description"), type: "switch" },
      { key: "showBullets", label: L("المميزات", "Key features"), type: "switch" },
      { key: "showDelivery", label: L("التوصيل والاسترجاع", "Delivery & returns"), type: "switch" },
      {
        ...textField("deliveryText", L("نص التوصيل والاسترجاع", "Delivery & returns text"), 600, "textarea"),
        placeholder: L(
          "هنأكد معاك الطلب بمكالمة أو رسالة قبل الشحن. مصاريف التوصيل بتظهر بالظبط في صفحة الدفع…",
          "We confirm your order by call or message before it ships. The exact delivery fee shows at checkout…",
        ),
        hint: L("سيبه فاضي عشان يظهر النص العام.", "Leave it empty to show the general note."),
        showWhen: { key: "showDelivery", equals: [true] },
      },
    ],
  },
  {
    type: "productContent",
    group: "product",
    label: L("محتوى المنتج", "Product content"),
    keywords: ["content", "rich text", "article", "محتوى"],
    container: false,
    defaultProps: {},
    fields: [],
  },
  {
    type: "productSeller",
    group: "product",
    label: L("البائع", "Seller"),
    keywords: ["seller", "store", "vendor", "بائع", "متجر"],
    container: false,
    defaultProps: {},
    fields: [],
  },
  {
    type: "productReviews",
    group: "product",
    label: L("آراء العملاء", "Reviews"),
    keywords: ["reviews", "questions", "ratings", "آراء", "تقييمات", "أسئلة"],
    container: false,
    defaultProps: {},
    fields: [],
  },
  // The seller's cross-sell offers as their own element (ROADMAP.md F-32d). While the page has one,
  // the buy box no longer shows them under itself; a product with no offers draws nothing.
  {
    type: "productCrossSell",
    group: "product",
    label: L("عروض مع المنتج", "Offers with the product"),
    keywords: ["cross-sell", "offers", "upsell", "bought together", "bundle", "عروض", "بيتشتري مع", "اشتري معاه", "خصم"],
    container: false,
    defaultProps: {},
    fields: [],
  },
];

const REVEAL_LABELS: Record<RevealChoice, Localized> = {
  auto: L("تلقائي", "Auto"),
  "fade-up": L("صعود مع ظهور", "Fade up"),
  fade: L("ظهور", "Fade"),
  "zoom-in": L("تقريب", "Zoom in"),
  "slide-start": L("انزلاق من البداية", "Slide from start"),
  "slide-end": L("انزلاق من النهاية", "Slide from end"),
  words: L("كلمة بكلمة", "Word by word"),
  "wipe-start": L("كشف من البداية", "Wipe from start"),
  "wipe-end": L("كشف من النهاية", "Wipe from end"),
  "wipe-up": L("كشف من الأسفل", "Wipe up"),
  none: L("بدون", "None"),
};

/** Motion v2 reveals each kind of element may pick: wipes for photos, words for headings and short text. */
const V2_REVEALS: Partial<Record<ElementType, readonly RevealChoice[]>> = {
  image: ["wipe-start", "wipe-end", "wipe-up"],
  heading: ["words"],
  paragraph: ["words"],
  text: ["words"],
};

/** An element's Reveal override (docs/section-rules.md §6.6, advanced); Auto lets the renderer pick. */
const revealField = (type: ElementType): PropDefinition => {
  const extra = V2_REVEALS[type] ?? [];
  return {
    key: "reveal",
    label: L("الظهور عند التمرير", "Reveal on scroll"),
    type: "select",
    group: "advanced",
    options: REVEAL_CHOICES.filter((value) => !(REVEAL_V2_VARIANTS as readonly string[]).includes(value) || extra.includes(value)).map((value) => ({
      value,
      label: REVEAL_LABELS[value],
    })),
  };
};

/** Elements a seller may give their own reveal (content, not chrome or interactive parts). */
const REVEALABLE: ReadonlySet<ElementType> = new Set<ElementType>([
  "heading",
  "paragraph",
  "text",
  "blockQuote",
  "badge",
  "button",
  "image",
  "video",
  "linkBlock",
  "card",
  "div",
  "vFlex",
  "hFlex",
  "list",
  "accordion",
]);

export const ELEMENT_DEFINITIONS: readonly ElementDefinition[] = DEFINITIONS.map((d) => (REVEALABLE.has(d.type) ? { ...d, fields: [...d.fields, revealField(d.type)] } : d));

const BY_TYPE = new Map(ELEMENT_DEFINITIONS.map((d) => [d.type, d]));

export function getElementDefinition(type: string): ElementDefinition | undefined {
  return BY_TYPE.get(type as ElementType);
}

/**
 * List and playlist items come with their list; a section is only a tree's root. Accordion
 * items stay in the palette so an emptied accordion can be refilled. The language switcher
 * is added to the header for translated stores (`withLanguageSwitcher`), never by hand, and so
 * are the store logo, theme toggle and sign-in (the header/footer options, `drawChrome`).
 */
const NOT_IN_PALETTE: readonly ElementType[] = ["listItem", "videoItem", "section", "languageSwitcher", "storeLogo", "themeToggle", "accountLink", "appInstall", "mobileMenu"];

/** Types shown in the palette. */
export const PALETTE_TYPES: readonly ElementType[] = ELEMENT_DEFINITIONS.filter((d) => !NOT_IN_PALETTE.includes(d.type)).map((d) => d.type);

/** Limits per custom section (validated on save and publish, checked in the editor). */
export const MAX_NODES_PER_SECTION = 400;
export const MAX_ELEMENT_DEPTH = 12;
