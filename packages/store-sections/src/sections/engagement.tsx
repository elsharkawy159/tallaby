import { ChevronDown, Mail, MapPin, MessageCircle, Phone, Quote } from "lucide-react";
import { z } from "zod";
import { sectionText } from "../core/copy";
import { whatsappHref } from "../core/links";
import type { SectionDefinition } from "../core/types";
import { SectionHeading, SectionImage, SectionShell, SmartLink, cn, imageSrc, itemOf, optionalUrl, partOf, text } from "./_primitives";

// ---------------------------------------------------------------------------
// testimonials
// ---------------------------------------------------------------------------

const testimonialsSchema = z.object({
  title: text(120),
  items: z.array(z.object({ quote: text(400), name: text(60), detail: text(60) })).max(12).catch([]),
});
type TestimonialsProps = z.infer<typeof testimonialsSchema>;

export const testimonials: SectionDefinition<TestimonialsProps> = {
  id: "testimonials",
  version: 1,
  category: "social-proof",
  displayName: { ar: "آراء العملاء", en: "Testimonials" },
  description: { ar: "اقتباسات من عملائك.", en: "Quotes from your customers." },
  propsSchema: testimonialsSchema,
  defaultProps: {
    title: "ماذا يقول عملاؤنا",
    items: [
      { quote: "منتجات ممتازة والتوصيل كان سريعًا.", name: "سارة", detail: "القاهرة" },
      { quote: "تعامل محترم وجودة عالية، أنصح به.", name: "محمد", detail: "الإسكندرية" },
    ],
  },
  propDefinitions: [{ key: "title", label: { ar: "العنوان", en: "Title" }, type: "text", maxLength: 120, translatable: true }],
  itemCollections: [
    {
      key: "items",
      label: { ar: "الآراء", en: "Quotes" },
      maxItems: 12,
      newItemTemplate: () => ({ quote: "", name: "", detail: "" }),
      itemPropDefinitions: [
        { key: "quote", label: { ar: "الرأي", en: "Quote" }, type: "textarea", maxLength: 400, translatable: true },
        { key: "name", label: { ar: "الاسم", en: "Name" }, type: "text", maxLength: 60, translatable: true },
        { key: "detail", label: { ar: "تفاصيل (مثل المدينة)", en: "Detail (e.g. city)" }, type: "text", maxLength: 60, translatable: true },
      ],
    },
  ],
  Component: ({ instance, props }) => {
    const part = partOf(instance.id);
    return (
    <SectionShell>
      <SectionHeading title={props.title} align="center" parts={{ title: part("title") }} />
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {props.items.map((item, i) => (
          <li key={i}>
            <figure className="flex h-full flex-col gap-3 rounded-(--sf-radius,12px) border border-(--sf-line) bg-(--sf-paper) p-5">
              <Quote className="size-5 text-(--sf-sun)" aria-hidden />
              <blockquote {...part(`items.${i}.quote`)} className="flex-1 text-pretty leading-relaxed">{item.quote}</blockquote>
              {(item.name || item.detail) && (
                <figcaption className="text-sm">
                  <span {...part(`items.${i}.name`)} className="font-semibold">{item.name}</span>
                  {item.detail && <span className="text-(--sf-muted)"> · {item.detail}</span>}
                </figcaption>
              )}
            </figure>
          </li>
        ))}
      </ul>
    </SectionShell>
    );
  },
};

// ---------------------------------------------------------------------------
// faq (native <details>, no script)
// ---------------------------------------------------------------------------

const faqSchema = z.object({
  title: text(120),
  items: z.array(z.object({ question: text(200), answer: text(1000) })).max(20).catch([]),
});
type FaqProps = z.infer<typeof faqSchema>;

export const faq: SectionDefinition<FaqProps> = {
  id: "faq",
  version: 1,
  category: "content",
  displayName: { ar: "أسئلة شائعة", en: "FAQ" },
  description: { ar: "أسئلة وأجوبة قابلة للطي.", en: "Questions with collapsible answers." },
  propsSchema: faqSchema,
  defaultProps: {
    title: "أسئلة شائعة",
    items: [
      { question: "كم يستغرق التوصيل؟", answer: "من يومين إلى خمسة أيام عمل حسب المحافظة." },
      { question: "هل يمكنني الدفع عند الاستلام؟", answer: "نعم، الدفع عند الاستلام متاح." },
    ],
  },
  propDefinitions: [{ key: "title", label: { ar: "العنوان", en: "Title" }, type: "text", maxLength: 120, translatable: true }],
  itemCollections: [
    {
      key: "items",
      label: { ar: "الأسئلة", en: "Questions" },
      maxItems: 20,
      newItemTemplate: () => ({ question: "", answer: "" }),
      itemPropDefinitions: [
        { key: "question", label: { ar: "السؤال", en: "Question" }, type: "text", maxLength: 200, translatable: true },
        { key: "answer", label: { ar: "الإجابة", en: "Answer" }, type: "textarea", maxLength: 1000, translatable: true },
      ],
    },
  ],
  Component: ({ instance, props }) => {
    const part = partOf(instance.id);
    return (
    <SectionShell>
      <div className="mx-auto max-w-3xl">
        <SectionHeading title={props.title} align="center" parts={{ title: part("title") }} />
        <div className="divide-y divide-(--sf-line) rounded-(--sf-radius,12px) border border-(--sf-line)">
          {props.items.map((item, i) => (
            <details key={i} {...itemOf(instance.id)("items", i)} className="group px-4 py-3">
              <summary {...part(`items.${i}.question`)} className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">
                {item.question}
                <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p {...part(`items.${i}.answer`)} className="mt-2 whitespace-pre-line text-pretty text-sm leading-relaxed text-(--sf-muted)">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </SectionShell>
    );
  },
};

// ---------------------------------------------------------------------------
// logo-cloud
// ---------------------------------------------------------------------------

const logosSchema = z.object({
  title: text(120),
  logos: z.array(z.object({ src: imageSrc, alt: text(80), href: optionalUrl })).max(24).catch([]),
});
type LogosProps = z.infer<typeof logosSchema>;

export const logoCloud: SectionDefinition<LogosProps> = {
  id: "logo-cloud",
  version: 1,
  category: "social-proof",
  displayName: { ar: "شعارات", en: "Logos" },
  description: { ar: "شعارات العلامات أو الشركاء.", en: "Brand or partner logos." },
  propsSchema: logosSchema,
  defaultProps: { title: "علامات نتعامل معها", logos: [] },
  propDefinitions: [{ key: "title", label: { ar: "العنوان", en: "Title" }, type: "text", maxLength: 120, translatable: true }],
  itemCollections: [
    {
      key: "logos",
      label: { ar: "الشعارات", en: "Logos" },
      maxItems: 24,
      newItemTemplate: () => ({ src: "", alt: "", href: "" }),
      itemPropDefinitions: [
        { key: "src", label: { ar: "الشعار", en: "Logo" }, type: "image" },
        { key: "alt", label: { ar: "الاسم", en: "Name" }, type: "text", maxLength: 80, translatable: true },
        { key: "href", label: { ar: "الرابط", en: "Link" }, type: "url" },
      ],
    },
  ],
  Component: ({ instance, props, ctx }) => (
    <SectionShell>
      <SectionHeading title={props.title} align="center" parts={{ title: partOf(instance.id)("title") }} />
      <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
        {props.logos.map((logo, i) => {
          const image = <SectionImage ctx={ctx} src={logo.src} alt={logo.alt} part={partOf(instance.id)(`logos.${i}.src`)} className="h-10 w-auto object-contain opacity-80" />;
          return <li key={i}>{logo.href ? <SmartLink ctx={ctx} href={logo.href}>{image}</SmartLink> : image}</li>;
        })}
      </ul>
    </SectionShell>
  ),
};

// ---------------------------------------------------------------------------
// image-gallery
// ---------------------------------------------------------------------------

const gallerySchema = z.object({
  title: text(120),
  columns: z.enum(["2", "3", "4"]).catch("3"),
  images: z.array(z.object({ src: imageSrc, alt: text(120), caption: text(120) })).max(24).catch([]),
});
type GalleryProps = z.infer<typeof gallerySchema>;

export const imageGallery: SectionDefinition<GalleryProps> = {
  id: "image-gallery",
  version: 1,
  category: "media",
  displayName: { ar: "معرض صور", en: "Image gallery" },
  description: { ar: "شبكة من الصور.", en: "A grid of images." },
  propsSchema: gallerySchema,
  defaultProps: { title: "", columns: "3", images: [] },
  propDefinitions: [
    { key: "title", label: { ar: "العنوان", en: "Title" }, type: "text", maxLength: 120, translatable: true },
    {
      key: "columns",
      label: { ar: "عدد الأعمدة", en: "Columns" },
      type: "select",
      group: "layout",
      options: [
        { value: "2", label: { ar: "2", en: "2" } },
        { value: "3", label: { ar: "3", en: "3" } },
        { value: "4", label: { ar: "4", en: "4" } },
      ],
    },
  ],
  itemCollections: [
    {
      key: "images",
      label: { ar: "الصور", en: "Images" },
      maxItems: 24,
      newItemTemplate: () => ({ src: "", alt: "", caption: "" }),
      itemPropDefinitions: [
        { key: "src", label: { ar: "الصورة", en: "Image" }, type: "image" },
        { key: "alt", label: { ar: "وصف الصورة", en: "Alt text" }, type: "text", maxLength: 120, translatable: true },
        { key: "caption", label: { ar: "تعليق", en: "Caption" }, type: "text", maxLength: 120, translatable: true },
      ],
    },
  ],
  Component: ({ instance, props, ctx }) => {
    const part = partOf(instance.id);
    return (
    <SectionShell>
      <SectionHeading title={props.title} parts={{ title: part("title") }} />
      <ul className={cn("grid grid-cols-2 gap-3", props.columns === "3" && "md:grid-cols-3", props.columns === "4" && "md:grid-cols-4")}>
        {props.images.map((image, i) => (
          <li key={i}>
            <figure className="space-y-1.5">
              <SectionImage ctx={ctx} src={image.src} alt={image.alt} part={part(`images.${i}.src`)} className="aspect-square w-full rounded-(--sf-radius,12px)" />
              {image.caption && <figcaption {...part(`images.${i}.caption`)} className="text-sm text-(--sf-muted)">{image.caption}</figcaption>}
            </figure>
          </li>
        ))}
      </ul>
    </SectionShell>
    );
  },
};

// ---------------------------------------------------------------------------
// contact-info (details come from the store profile, never typed twice)
// ---------------------------------------------------------------------------

const contactSchema = z.object({
  title: text(120),
  text: text(400),
  showPhone: z.boolean().catch(true),
  showEmail: z.boolean().catch(true),
  showWhatsapp: z.boolean().catch(true),
  showAddress: z.boolean().catch(true),
});
type ContactProps = z.infer<typeof contactSchema>;

export const contactInfo: SectionDefinition<ContactProps> = {
  id: "contact-info",
  insertable: false,
  version: 1,
  category: "contact",
  displayName: { ar: "معلومات التواصل", en: "Contact details" },
  description: { ar: "الهاتف والبريد وواتساب من إعدادات المتجر.", en: "Phone, email and WhatsApp from the store settings." },
  propsSchema: contactSchema,
  defaultProps: { title: "تواصل معنا", text: "", showPhone: true, showEmail: true, showWhatsapp: true, showAddress: true },
  propDefinitions: [
    { key: "title", label: { ar: "العنوان", en: "Title" }, type: "text", maxLength: 120, translatable: true },
    { key: "text", label: { ar: "النص", en: "Text" }, type: "textarea", maxLength: 400, translatable: true },
    { key: "showPhone", label: { ar: "إظهار الهاتف", en: "Show phone" }, type: "switch" },
    { key: "showEmail", label: { ar: "إظهار البريد", en: "Show email" }, type: "switch" },
    { key: "showWhatsapp", label: { ar: "إظهار واتساب", en: "Show WhatsApp" }, type: "switch" },
    { key: "showAddress", label: { ar: "إظهار العنوان", en: "Show address" }, type: "switch" },
  ],
  Component: ({ props, ctx }) => {
    const contact = ctx.store.contact ?? {};
    const whatsapp = whatsappHref(contact.whatsapp ?? contact.phone);
    const rows = [
      props.showPhone && contact.phone && { icon: Phone, label: sectionText("phone", ctx.locale), value: contact.phone, href: `tel:${contact.phone}` },
      props.showWhatsapp && whatsapp && { icon: MessageCircle, label: sectionText("whatsapp", ctx.locale), value: contact.whatsapp ?? contact.phone ?? "", href: whatsapp },
      props.showEmail && contact.email && { icon: Mail, label: sectionText("email", ctx.locale), value: contact.email, href: `mailto:${contact.email}` },
      props.showAddress && contact.address && { icon: MapPin, label: sectionText("address", ctx.locale), value: contact.address, href: "" },
    ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href: string }[];
    return (
      <SectionShell tone="shelf">
        <SectionHeading title={props.title} subtitle={props.text} align="center" />
        <ul className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center gap-3 rounded-(--sf-radius,12px) bg-(--sf-paper) p-4">
              <row.icon className="size-5 shrink-0 text-(--sf-brand)" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs text-(--sf-muted)">{row.label}</p>
                {row.href ? (
                  <SmartLink ctx={ctx} href={row.href} className="font-medium [overflow-wrap:anywhere]">
                    <span dir="ltr">{row.value}</span>
                  </SmartLink>
                ) : (
                  <p className="font-medium">{row.value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </SectionShell>
    );
  },
};
