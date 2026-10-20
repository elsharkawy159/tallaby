/**
 * Atelier (template 01, premium fashion; Claude Design "Storefront
 * Templates"): ivory paper, black ink, warm beige shelves and a restrained
 * gold, Amiri display type over Noto Kufi Arabic, square corners and
 * hairlines. Every section is an element tree (CLAUDE.md rule 17), so the
 * seller can select, restyle and move every part after using it.
 *
 * Pages: home, The house (about), Contact and FAQ. Products, product pages,
 * the catalog (/products), cart, checkout, sign-in, wishlist and orders are
 * the store's system pages; the header, footer and sections link to them.
 */
import { SITE_CONFIG_VERSION, type SiteConfig, type SitePage } from "../../config/schema";
import { instantiateDesign, type Design } from "../../designs/builder";
import type { TemplateDefinition } from "../types";
import { atelierFooter, atelierHeader } from "./chrome";
import { ATELIER_DEMO } from "./demo";
import { ATELIER_HOME } from "./home";
import {
  atelierAboutHeader,
  atelierAboutStats,
  atelierAboutStory,
  atelierAboutValues,
  atelierContact,
  atelierContactHeader,
  atelierFaq,
  atelierFaqHeader,
} from "./pages";

export const ATELIER_KEY = "atelier";

/** A design as a template section: its id doubles as the instance id, so a re-apply keeps matching sections. */
const section = (design: Design) => instantiateDesign(design, { id: design.id, defaultLocale: "ar" });

const page = (slug: string, name: string, designs: readonly Design[], seo: SitePage["seo"] = {}, isHome = false): SitePage => ({
  slug,
  isHome,
  name,
  showInNav: true,
  seo,
  content: { sections: designs.map(section) },
});

export function atelierConfig(): SiteConfig {
  return {
    schemaVersion: SITE_CONFIG_VERSION,
    designSystem: {
      colors: {
        primary: "#1a1714",
        secondary: "#ece4d6",
        background: "#f6f1e9",
        foreground: "#1a1714",
        muted: "#6b6157",
        border: "#d9cfbf",
        accent: "#b8925a",
      },
      typography: { headingFont: "Amiri", bodyFont: "Noto Kufi Arabic" },
      spacing: { borderRadius: 0, containerMaxWidth: 1280 },
    },
    header: section(atelierHeader),
    footer: section(atelierFooter),
    settings: { defaultLocale: "ar", locales: ["ar", "en"] },
    pages: [
      page("home", "الرئيسية", ATELIER_HOME, {}, true),
      page("about", "عن الدار", [atelierAboutHeader, atelierAboutStory, atelierAboutStats, atelierAboutValues], {
        title: "عن الدار",
        description: "دار أزياء صغيرة تصنع ملابس هادئة من خامات طبيعية.",
      }),
      page("contact", "تواصل", [atelierContactHeader, atelierContact], {
        title: "تواصل معنا",
        description: "عن مقاس أو طلب أو قطعة تبحث عنها، نرد خلال يوم عمل.",
      }),
      page("faq", "الأسئلة الشائعة", [atelierFaqHeader, atelierFaq], {
        title: "الأسئلة الشائعة",
        description: "المقاسات والتوصيل والاستبدال والعناية بالقطع.",
      }),
    ],
  };
}

/** Every Atelier design (the template's own; not in the section library). */
export const ATELIER_DESIGNS: readonly Design[] = [
  atelierHeader,
  ...ATELIER_HOME,
  atelierAboutHeader,
  atelierAboutStory,
  atelierAboutStats,
  atelierAboutValues,
  atelierContactHeader,
  atelierContact,
  atelierFaqHeader,
  atelierFaq,
  atelierFooter,
];

export const ATELIER: TemplateDefinition = {
  key: ATELIER_KEY,
  version: 2,
  name: { ar: "أتيليه", en: "Atelier" },
  description: {
    ar: "موضة راقية: خط كلاسيكي كبير وألوان عاجية هادئة وزوايا حادة. أربع صفحات جاهزة.",
    en: "Premium fashion: large serif type, quiet ivory tones and square corners. Four ready pages.",
  },
  category: "fashion",
  sortOrder: 10,
  changelog: "Atelier v2: no header padding-y on mobile",
  palette: ["#f6f1e9", "#ece4d6", "#b8925a", "#1a1714"],
  config: atelierConfig,
  pageNames: {
    home: { ar: "الرئيسية", en: "Home" },
    about: { ar: "عن الدار", en: "The house" },
    contact: { ar: "تواصل", en: "Contact" },
    faq: { ar: "الأسئلة الشائعة", en: "FAQ" },
  },
  demo: ATELIER_DEMO,
  designs: ATELIER_DESIGNS,
};
