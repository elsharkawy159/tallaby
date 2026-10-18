import type { SectionPreset } from "../types";

export const FOOTER_PRESETS: readonly SectionPreset[] = [
  {
    id: "footers.multi-column",
    sectionId: "store-footer",
    category: "footers",
    subcategory: "multi-column",
    name: { ar: "تذييل بأعمدة", en: "Multi-column footer" },
    description: { ar: "نبذة والسياسات والتواصل والروابط الاجتماعية.", en: "About, policies, contact and social links." },
    keywords: ["footer", "تذييل"],
    capabilities: ["dynamic"],
    dataNeeds: ["storeInfo"],
  },
];
