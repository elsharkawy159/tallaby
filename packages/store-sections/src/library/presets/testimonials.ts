import type { SectionPreset } from "../types";

/** Quotes the seller writes; never presented as verified reviews. */
export const WRITTEN_QUOTES = [
  { quote: "اكتب هنا رأي أحد عملائك كما قاله.", name: "اسم العميل", detail: "المدينة" },
  { quote: "أضف رأيًا آخر أو احذف هذا العنصر.", name: "اسم العميل", detail: "المدينة" },
];

export const TESTIMONIAL_PRESETS: readonly SectionPreset[] = [
  {
    id: "testimonials.quote-cards",
    sectionId: "testimonials",
    category: "testimonials",
    subcategory: "quote",
    name: { ar: "آراء تكتبها بنفسك", en: "Quotes you write" },
    description: { ar: "بطاقات اقتباس تكتب نصها بنفسك.", en: "Quote cards with text you write yourself." },
    keywords: ["quotes", "testimonial", "آراء"],
    capabilities: ["static"],
    props: { items: WRITTEN_QUOTES },
  },
];
