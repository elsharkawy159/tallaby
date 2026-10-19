/**
 * The library as the Add panel lists it. Every preset starts a section design
 * (`designs/`), an element tree the seller can fully customize (CLAUDE.md
 * rule 17). New designs are added here as they are built.
 */
import type { SectionPreset } from "../types";

export const LIBRARY_PRESETS: readonly SectionPreset[] = [
  {
    id: "hero.split",
    sectionId: "custom-section",
    designId: "hero-split",
    category: "hero",
    subcategory: "split",
    name: { ar: "واجهة مقسومة", en: "Split hero" },
    description: { ar: "عنوان كبير وزران وشارات ثقة بجانب صورة.", en: "A big headline, two buttons and trust badges beside an image." },
    keywords: ["hero", "banner", "بانر", "واجهة"],
    capabilities: ["static"],
  },
  {
    id: "about.our-story",
    sectionId: "custom-section",
    designId: "about-story",
    category: "about",
    subcategory: "story",
    name: { ar: "قصتنا", en: "Our story" },
    description: { ar: "صورة مع رقم مميز بجانب قصتك وقيمك.", en: "An image with a highlight number beside your story and values." },
    keywords: ["about", "story", "قصتنا", "من نحن"],
    capabilities: ["static"],
  },
  {
    id: "statistics.cards",
    sectionId: "custom-section",
    designId: "stats-cards",
    category: "statistics",
    subcategory: "counters",
    name: { ar: "أرقامنا", en: "By the numbers" },
    description: { ar: "عنوان في المنتصف فوق صف من الأرقام.", en: "A centred heading over a row of figures." },
    keywords: ["stats", "numbers", "أرقام", "إحصائيات"],
    capabilities: ["static"],
  },
];
