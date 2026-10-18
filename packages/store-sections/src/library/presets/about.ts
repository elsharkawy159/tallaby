import type { SectionPreset } from "../types";

export const ABOUT_PRESETS: readonly SectionPreset[] = [
  {
    id: "about.story",
    sectionId: "image-with-text",
    category: "about",
    subcategory: "story",
    name: { ar: "قصة المتجر", en: "Brand story" },
    description: { ar: "صورة بجانب قصتك وزر اختياري.", en: "An image beside your story and an optional button." },
    keywords: ["about", "story", "قصتنا", "من نحن"],
    capabilities: ["static"],
  },
];
