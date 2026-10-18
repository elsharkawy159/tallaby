import type { SectionPreset } from "../types";

export const PROMOTION_PRESETS: readonly SectionPreset[] = [
  {
    id: "promotions.full-width",
    sectionId: "cta-banner",
    category: "promotions",
    subcategory: "full-width",
    name: { ar: "شريط عرض", en: "Promotion band" },
    description: { ar: "شريط بلون متجرك بعنوان وزر.", en: "A band in your brand colour with a title and button." },
    keywords: ["cta", "offer", "عرض", "خصم"],
    capabilities: ["static"],
  },
];
