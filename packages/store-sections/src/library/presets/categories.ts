import type { SectionPreset } from "../types";

export const CATEGORY_PRESETS: readonly SectionPreset[] = [
  {
    id: "categories.circles",
    sectionId: "category-grid",
    category: "categories",
    subcategory: "circles",
    name: { ar: "أقسام دائرية", en: "Category circles" },
    description: { ar: "صور الأقسام في دوائر مع أسمائها.", en: "Category images in circles with their names." },
    keywords: ["round", "دائري"],
    capabilities: ["dynamic"],
    dataNeeds: ["categories"],
    props: { style: "circles" },
  },
  {
    id: "categories.grid",
    sectionId: "category-grid",
    category: "categories",
    subcategory: "grid",
    name: { ar: "شبكة أقسام", en: "Category grid" },
    description: { ar: "بطاقة كبيرة لكل قسم واسمه فوق الصورة.", en: "A large card per category, its name over the image." },
    keywords: ["cards", "بطاقات"],
    capabilities: ["dynamic"],
    dataNeeds: ["categories"],
    props: { style: "cards" },
  },
];
