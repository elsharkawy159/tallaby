import type { SectionPreset } from "../types";

export const HEADER_PRESETS: readonly SectionPreset[] = [
  {
    id: "headers.minimal",
    sectionId: "store-header",
    category: "headers",
    subcategory: "minimal",
    name: { ar: "رأس بسيط", en: "Minimal header" },
    description: { ar: "الشعار والاسم والصفحات والسلة في سطر واحد.", en: "Logo, name, pages and cart on one line." },
    keywords: ["logo", "menu", "nav", "شعار", "قائمة"],
    capabilities: ["dynamic"],
    dataNeeds: ["navigation"],
    props: { announcement: "" },
  },
  {
    id: "headers.announcement",
    sectionId: "store-header",
    category: "headers",
    subcategory: "announcement",
    name: { ar: "رأس مع شريط إعلان", en: "Header with announcement" },
    description: { ar: "شريط رسالة قصيرة فوق القائمة.", en: "A short message bar above the menu." },
    keywords: ["announcement", "bar", "إعلان", "شريط"],
    capabilities: ["dynamic"],
    dataNeeds: ["navigation"],
    props: { announcement: "اكتب هنا رسالة قصيرة لعملائك" },
  },
];
