import type { SectionPreset } from "../types";

export const HERO_PRESETS: readonly SectionPreset[] = [
  {
    id: "hero.full-width",
    sectionId: "hero-banner",
    category: "hero",
    subcategory: "full-width",
    name: { ar: "صورة بعرض الصفحة", en: "Full-width image" },
    description: { ar: "صورة عريضة وعنوان وزر في البداية.", en: "A wide image with a title and button at the start." },
    keywords: ["banner", "بانر", "صورة"],
    capabilities: ["static"],
  },
  {
    id: "hero.centered",
    sectionId: "hero-banner",
    category: "hero",
    subcategory: "centered",
    name: { ar: "عنوان في المنتصف", en: "Centered title" },
    description: { ar: "واجهة طويلة بعنوان وزر في المنتصف.", en: "A tall hero with the title and button centred." },
    keywords: ["center", "منتصف"],
    capabilities: ["static"],
    props: { align: "center", height: "lg" },
  },
];
