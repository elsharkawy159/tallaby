import { BadgeCheck, Gift, Headphones, Leaf, ShieldCheck, Sparkles, Star, Truck, type LucideIcon } from "lucide-react";
import { z } from "zod";
import { resolveSlotLayout, type SlotDefinition } from "../core/slots";
import type { SectionDefinition } from "../core/types";
import {
  ButtonLink,
  PartSlot,
  SectionHeading,
  SectionImage,
  SectionShell,
  align,
  cn,
  imageSrc,
  itemOf,
  optionalUrl,
  partOf,
  text,
  type PartAttr,
} from "./_primitives";

// ---------------------------------------------------------------------------
// hero-banner
// ---------------------------------------------------------------------------

const heroSchema = z.object({
  title: text(120),
  subtitle: text(300),
  image: imageSrc,
  ctaLabel: text(40),
  ctaHref: optionalUrl,
  align: align,
  height: z.enum(["md", "lg"]).catch("md"),
});
type HeroProps = z.infer<typeof heroSchema>;

export const heroBanner: SectionDefinition<HeroProps> = {
  id: "hero-banner",
  version: 1,
  category: "hero",
  displayName: { ar: "بانر رئيسي", en: "Hero banner" },
  description: { ar: "صورة عريضة مع عنوان وزر.", en: "A wide image with a title and a button." },
  propsSchema: heroSchema,
  defaultProps: {
    title: "تسوّق أحدث المنتجات",
    subtitle: "منتجات مختارة بعناية وتوصيل لكل محافظات مصر.",
    image: "",
    ctaLabel: "تسوّق الآن",
    ctaHref: "/#products",
    align: "start",
    height: "md",
  },
  propDefinitions: [
    { key: "title", label: { ar: "العنوان", en: "Title" }, type: "text", maxLength: 120, translatable: true },
    { key: "subtitle", label: { ar: "النص", en: "Text" }, type: "textarea", maxLength: 300, translatable: true },
    { key: "image", label: { ar: "الصورة", en: "Image" }, type: "image" },
    { key: "ctaLabel", label: { ar: "نص الزر", en: "Button text" }, type: "text", maxLength: 40, translatable: true },
    { key: "ctaHref", label: { ar: "رابط الزر", en: "Button link" }, type: "url" },
    {
      key: "align",
      label: { ar: "المحاذاة", en: "Alignment" },
      type: "select",
      group: "layout",
      options: [
        { value: "start", label: { ar: "البداية", en: "Start" } },
        { value: "center", label: { ar: "الوسط", en: "Center" } },
      ],
    },
    {
      key: "height",
      label: { ar: "الارتفاع", en: "Height" },
      type: "select",
      group: "layout",
      options: [
        { value: "md", label: { ar: "متوسط", en: "Medium" } },
        { value: "lg", label: { ar: "كبير", en: "Large" } },
      ],
    },
  ],
  Component: ({ instance, props, ctx }) => {
    const part = partOf(instance.id);
    return (
    <section className="relative isolate overflow-hidden bg-(--sf-ink) text-white">
      <SectionImage ctx={ctx} src={props.image} alt="" eager part={part("image")} className="absolute inset-0 -z-10 size-full opacity-60" />
      <div
        className={cn(
          "mx-auto flex w-full max-w-(--sf-max-width,1200px) flex-col justify-center gap-4 px-4 md:px-8",
          props.height === "lg" ? "min-h-[520px] py-20" : "min-h-[360px] py-14",
          props.align === "center" && "items-center text-center",
        )}
      >
        {props.title && <h1 {...part("title")} className="max-w-3xl text-balance text-3xl font-extrabold leading-tight md:text-5xl">{props.title}</h1>}
        {props.subtitle && <p {...part("subtitle")} className="max-w-2xl text-pretty text-white/85 md:text-lg">{props.subtitle}</p>}
        <div>
          <ButtonLink ctx={ctx} href={props.ctaHref} label={props.ctaLabel} variant="light" part={part("ctaLabel")} />
        </div>
      </div>
    </section>
    );
  },
};

// ---------------------------------------------------------------------------
// image-with-text
// ---------------------------------------------------------------------------

const imageTextSchema = z.object({
  title: text(120),
  body: text(1200),
  image: imageSrc,
  imageSide: z.enum(["start", "end"]).catch("start"),
  ctaLabel: text(40),
  ctaHref: optionalUrl,
});
type ImageTextProps = z.infer<typeof imageTextSchema>;

/** Two columns; every part may sit in either one. */
const IMAGE_TEXT_SLOTS = [
  { key: "media", label: { ar: "عمود الصورة", en: "Image column" }, parts: ["image"], accepts: ["title", "body", "ctaLabel"] },
  { key: "text", label: { ar: "عمود النص", en: "Text column" }, parts: ["title", "body", "ctaLabel"], accepts: ["image"] },
] as const satisfies readonly SlotDefinition[];

export const imageWithText: SectionDefinition<ImageTextProps> = {
  id: "image-with-text",
  version: 1,
  category: "content",
  displayName: { ar: "صورة مع نص", en: "Image with text" },
  description: { ar: "صورة بجانب فقرة وزر.", en: "An image beside a paragraph and a button." },
  propsSchema: imageTextSchema,
  defaultProps: {
    title: "قصتنا",
    body: "اكتب هنا عن متجرك: ما الذي تبيعه، ولماذا يختارك العملاء.",
    image: "",
    imageSide: "start",
    ctaLabel: "",
    ctaHref: "",
  },
  propDefinitions: [
    { key: "title", label: { ar: "العنوان", en: "Title" }, type: "text", maxLength: 120, translatable: true },
    { key: "body", label: { ar: "النص", en: "Text" }, type: "textarea", maxLength: 1200, translatable: true },
    { key: "image", label: { ar: "الصورة", en: "Image" }, type: "image" },
    {
      key: "imageSide",
      label: { ar: "مكان الصورة", en: "Image side" },
      type: "select",
      group: "layout",
      options: [
        { value: "start", label: { ar: "البداية", en: "Start" } },
        { value: "end", label: { ar: "النهاية", en: "End" } },
      ],
    },
    { key: "ctaLabel", label: { ar: "نص الزر", en: "Button text" }, type: "text", maxLength: 40, translatable: true },
    { key: "ctaHref", label: { ar: "رابط الزر", en: "Button link" }, type: "url" },
  ],
  slots: IMAGE_TEXT_SLOTS,
  Component: ({ instance, props, ctx }) => {
    const part = partOf(instance.id);
    const layout = resolveSlotLayout(instance, IMAGE_TEXT_SLOTS);
    const renderPart = (key: string) => {
      switch (key) {
        case "image":
          return (
            <SectionImage ctx={ctx} src={props.image} alt={props.title} part={part("image")} className="block aspect-[4/3] w-full rounded-(--sf-radius,12px)" />
          );
        case "title":
          return props.title && <h2 {...part("title")} className="text-balance text-2xl font-bold md:text-3xl">{props.title}</h2>;
        case "body":
          return props.body && <Paragraphs text={props.body} part={part("body")} />;
        case "ctaLabel":
          return <ButtonLink ctx={ctx} href={props.ctaHref} label={props.ctaLabel} part={part("ctaLabel")} />;
        default:
          return null;
      }
    };
    // With every part in one column the storefront shows one full-width column; the editor keeps both as drop areas.
    const twoColumns = ctx.mode === "edit" || (layout.media!.length > 0 && layout.text!.length > 0);
    return (
    <SectionShell>
      <div className={cn("grid items-center gap-8", twoColumns && "md:grid-cols-2")}>
        <PartSlot
          instanceId={instance.id}
          slot="media"
          parts={layout.media!}
          ctx={ctx}
          render={renderPart}
          className={cn("space-y-4", props.imageSide === "end" && "md:order-2")}
        />
        <PartSlot instanceId={instance.id} slot="text" parts={layout.text!} ctx={ctx} render={renderPart} className="space-y-4" />
      </div>
    </SectionShell>
    );
  },
};

/** Plain text with blank-line paragraphs. Seller text is never parsed as HTML. */
function Paragraphs({ text: value, part }: { text: string; part?: PartAttr }) {
  return (
    <div {...part} className="space-y-3 text-pretty leading-relaxed text-(--sf-muted)">
      {value
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// rich-text
// ---------------------------------------------------------------------------

const richTextSchema = z.object({ title: text(120), body: text(5000), align });
type RichTextProps = z.infer<typeof richTextSchema>;

const RICH_TEXT_SLOTS = [
  { key: "content", label: { ar: "المحتوى", en: "Content" }, parts: ["title", "body"] },
] as const satisfies readonly SlotDefinition[];

export const richText: SectionDefinition<RichTextProps> = {
  id: "rich-text",
  version: 1,
  category: "content",
  displayName: { ar: "نص", en: "Text" },
  description: { ar: "عنوان وفقرات.", en: "A heading and paragraphs." },
  propsSchema: richTextSchema,
  defaultProps: { title: "عن المتجر", body: "اكتب هنا ما تريد أن يعرفه العملاء.", align: "start" },
  propDefinitions: [
    { key: "title", label: { ar: "العنوان", en: "Title" }, type: "text", maxLength: 120, translatable: true },
    { key: "body", label: { ar: "النص", en: "Text" }, type: "textarea", maxLength: 5000, translatable: true },
    {
      key: "align",
      label: { ar: "المحاذاة", en: "Alignment" },
      type: "select",
      group: "layout",
      options: [
        { value: "start", label: { ar: "البداية", en: "Start" } },
        { value: "center", label: { ar: "الوسط", en: "Center" } },
      ],
    },
  ],
  slots: RICH_TEXT_SLOTS,
  Component: ({ instance, props, ctx }) => {
    const part = partOf(instance.id);
    const layout = resolveSlotLayout(instance, RICH_TEXT_SLOTS);
    return (
    <SectionShell>
      <PartSlot
        instanceId={instance.id}
        slot="content"
        parts={layout.content!}
        ctx={ctx}
        className={cn("max-w-3xl space-y-4", props.align === "center" && "mx-auto text-center")}
        render={(key) =>
          key === "title"
            ? props.title && <h2 {...part("title")} className="text-balance text-2xl font-bold md:text-3xl">{props.title}</h2>
            : key === "body"
              ? props.body && <Paragraphs text={props.body} part={part("body")} />
              : null
        }
      />
    </SectionShell>
    );
  },
};

// ---------------------------------------------------------------------------
// features (icon highlights)
// ---------------------------------------------------------------------------

export const FEATURE_ICONS = {
  truck: Truck,
  shield: ShieldCheck,
  support: Headphones,
  gift: Gift,
  quality: BadgeCheck,
  star: Star,
  sparkles: Sparkles,
  natural: Leaf,
} as const satisfies Record<string, LucideIcon>;
type FeatureIcon = keyof typeof FEATURE_ICONS;
const iconKeys = Object.keys(FEATURE_ICONS) as [FeatureIcon, ...FeatureIcon[]];

const featuresSchema = z.object({
  title: text(120),
  items: z
    .array(z.object({ icon: z.enum(iconKeys).catch("star"), title: text(80), text: text(240) }))
    .max(8)
    .catch([]),
});
type FeaturesProps = z.infer<typeof featuresSchema>;

export const features: SectionDefinition<FeaturesProps> = {
  id: "features",
  version: 1,
  category: "content",
  displayName: { ar: "مميزات", en: "Highlights" },
  description: { ar: "أيقونات مع جمل قصيرة، مثل التوصيل والضمان.", en: "Icons with short lines, like delivery and warranty." },
  propsSchema: featuresSchema,
  defaultProps: {
    title: "",
    items: [
      { icon: "truck", title: "توصيل لكل المحافظات", text: "يصلك طلبك أينما كنت في مصر." },
      { icon: "shield", title: "دفع آمن", text: "ادفع عند الاستلام أو أونلاين." },
      { icon: "support", title: "خدمة عملاء", text: "نرد على أسئلتك بسرعة." },
    ],
  },
  propDefinitions: [{ key: "title", label: { ar: "العنوان", en: "Title" }, type: "text", maxLength: 120, translatable: true }],
  itemCollections: [
    {
      key: "items",
      label: { ar: "العناصر", en: "Items" },
      maxItems: 8,
      newItemTemplate: () => ({ icon: "star", title: "ميزة جديدة", text: "" }),
      itemPropDefinitions: [
        {
          key: "icon",
          label: { ar: "الأيقونة", en: "Icon" },
          type: "select",
          options: iconKeys.map((key) => ({ value: key, label: { ar: key, en: key } })),
        },
        { key: "title", label: { ar: "العنوان", en: "Title" }, type: "text", maxLength: 80, translatable: true },
        { key: "text", label: { ar: "النص", en: "Text" }, type: "textarea", maxLength: 240, translatable: true },
      ],
    },
  ],
  Component: ({ instance, props }) => {
    const part = partOf(instance.id);
    const item = itemOf(instance.id);
    return (
    <SectionShell tone="shelf">
      <SectionHeading title={props.title} align="center" parts={{ title: part("title") }} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {props.items.map((entry, i) => {
          const Icon = FEATURE_ICONS[entry.icon] ?? Star;
          return (
            <li key={i} {...item("items", i)} className="flex gap-3 rounded-(--sf-radius,12px) bg-(--sf-paper) p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--sf-brand) text-(--sf-brand-ink,#fff)">
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p {...part(`items.${i}.title`)} className="font-semibold">{entry.title}</p>
                {entry.text && <p {...part(`items.${i}.text`)} className="text-sm text-(--sf-muted)">{entry.text}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </SectionShell>
    );
  },
};

// ---------------------------------------------------------------------------
// cta-banner
// ---------------------------------------------------------------------------

const ctaSchema = z.object({ title: text(120), text: text(300), ctaLabel: text(40), ctaHref: optionalUrl });
type CtaProps = z.infer<typeof ctaSchema>;

const CTA_SLOTS = [
  { key: "content", label: { ar: "المحتوى", en: "Content" }, parts: ["title", "text", "ctaLabel"] },
] as const satisfies readonly SlotDefinition[];

export const ctaBanner: SectionDefinition<CtaProps> = {
  id: "cta-banner",
  version: 1,
  category: "content",
  displayName: { ar: "دعوة لاتخاذ إجراء", en: "Call to action" },
  description: { ar: "شريط ملوّن بعنوان وزر.", en: "A colored band with a title and a button." },
  propsSchema: ctaSchema,
  defaultProps: { title: "خصم خاص لفترة محدودة", text: "", ctaLabel: "تسوّق الآن", ctaHref: "/#products" },
  propDefinitions: [
    { key: "title", label: { ar: "العنوان", en: "Title" }, type: "text", maxLength: 120, translatable: true },
    { key: "text", label: { ar: "النص", en: "Text" }, type: "textarea", maxLength: 300, translatable: true },
    { key: "ctaLabel", label: { ar: "نص الزر", en: "Button text" }, type: "text", maxLength: 40, translatable: true },
    { key: "ctaHref", label: { ar: "رابط الزر", en: "Button link" }, type: "url" },
  ],
  slots: CTA_SLOTS,
  Component: ({ instance, props, ctx }) => {
    const part = partOf(instance.id);
    const layout = resolveSlotLayout(instance, CTA_SLOTS);
    const renderPart = (key: string) => {
      switch (key) {
        case "title":
          return props.title && <h2 {...part("title")} className="text-balance text-2xl font-bold md:text-3xl">{props.title}</h2>;
        case "text":
          return props.text && <p {...part("text")} className="max-w-2xl text-pretty opacity-90">{props.text}</p>;
        case "ctaLabel":
          return <ButtonLink ctx={ctx} href={props.ctaHref} label={props.ctaLabel} variant="light" part={part("ctaLabel")} />;
        default:
          return null;
      }
    };
    return (
    <SectionShell tone="brand">
      <PartSlot
        instanceId={instance.id}
        slot="content"
        parts={layout.content!}
        ctx={ctx}
        render={renderPart}
        className="flex flex-col items-center gap-4 text-center"
      />
    </SectionShell>
    );
  },
};

// ---------------------------------------------------------------------------
// spacer
// ---------------------------------------------------------------------------

const spacerSchema = z.object({ size: z.enum(["sm", "md", "lg"]).catch("md"), divider: z.boolean().catch(false) });
type SpacerProps = z.infer<typeof spacerSchema>;

export const spacer: SectionDefinition<SpacerProps> = {
  id: "spacer",
  insertable: false,
  version: 1,
  category: "content",
  displayName: { ar: "مسافة", en: "Spacer" },
  description: { ar: "مسافة فارغة أو خط فاصل.", en: "Empty space or a divider line." },
  propsSchema: spacerSchema,
  defaultProps: { size: "md", divider: false },
  propDefinitions: [
    {
      key: "size",
      label: { ar: "الحجم", en: "Size" },
      type: "select",
      options: [
        { value: "sm", label: { ar: "صغير", en: "Small" } },
        { value: "md", label: { ar: "متوسط", en: "Medium" } },
        { value: "lg", label: { ar: "كبير", en: "Large" } },
      ],
    },
    { key: "divider", label: { ar: "خط فاصل", en: "Divider line" }, type: "switch" },
  ],
  Component: ({ props }) => (
    <div aria-hidden className={cn("mx-auto w-full max-w-(--sf-max-width,1200px) px-4 md:px-8", props.size === "sm" ? "py-4" : props.size === "lg" ? "py-16" : "py-8")}>
      {props.divider && <hr className="border-(--sf-line)" />}
    </div>
  ),
};
