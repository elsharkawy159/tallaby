/**
 * Tallaby Classic (Claude Design "Tallaby Classic Template", 2026-10-19): the
 * default template and every new store's starting site. A deep teal brand,
 * an amber accent, warm off-white paper, rounded white cards and pill
 * buttons, in Readex Pro (the storefront face, for Arabic and English). Every
 * section is an element tree (CLAUDE.md rule 17) and every colour is a
 * design-system token, so the seller can restyle all of it.
 *
 * Pages: home, About, Contact, FAQ, Privacy and Terms. The catalog
 * (/products), product pages, cart, checkout, sign-in, account, wishlist,
 * orders, shipping, returns and the blog are the store's system pages; the
 * header, footer and sections link to them.
 *
 * Same key as the earlier coded Classic (`tallaby-classic`, 0052/0062), so
 * stores whose `template_key` is the default already point at it; this is
 * its version 3.
 */
import { SITE_CONFIG_VERSION, type SiteConfig, type SitePage } from "../../config/schema";
import { instantiateDesign, type Design } from "../../designs/builder";
import type { TemplateDefinition } from "../types";
import { classicFooter, classicHeader } from "./chrome";
import { CLASSIC_DEMO } from "./demo";
import { CLASSIC_HOME } from "./home";
import {
  classicAboutHeader,
  classicAboutStats,
  classicAboutStory,
  classicAboutValues,
  classicAboutVisit,
  classicContact,
  classicContactHeader,
  classicFaq,
  classicFaqHeader,
  classicPrivacy,
  classicPrivacyHeader,
  classicTerms,
  classicTermsHeader,
} from "./pages";

export const CLASSIC_KEY = "tallaby-classic";

/** A design as a template section: its id doubles as the instance id, so a re-apply keeps matching sections. */
const section = (design: Design) => instantiateDesign(design, { id: design.id, defaultLocale: "ar" });

const page = (slug: string, name: string, designs: readonly Design[], seo: SitePage["seo"] = {}, o: { isHome?: boolean; showInNav?: boolean } = {}): SitePage => ({
  slug,
  isHome: o.isHome ?? false,
  name,
  showInNav: o.showInNav ?? true,
  seo,
  content: { sections: designs.map(section) },
});

export function classicConfig(): SiteConfig {
  return {
    schemaVersion: SITE_CONFIG_VERSION,
    designSystem: {
      colors: {
        primary: "#145163",
        secondary: "#eef3f3",
        background: "#f7f6f2",
        foreground: "#1b2629",
        muted: "#5b6a6f",
        border: "#e5e1db",
        accent: "#fdad28",
      },
      typography: { headingFont: "Readex Pro", bodyFont: "Readex Pro" },
      spacing: { borderRadius: 16, containerMaxWidth: 1240 },
    },
    header: section(classicHeader),
    footer: section(classicFooter),
    settings: { defaultLocale: "ar", locales: ["ar", "en"] },
    pages: [
      page("home", "الرئيسية", CLASSIC_HOME, {}, { isHome: true }),
      page("about", "من نحن", [classicAboutHeader, classicAboutStory, classicAboutStats, classicAboutValues, classicAboutVisit], {
        title: "من نحن",
        description: "فريق صغير بيختار منتجات إحنا نفسنا نشتريها.",
      }),
      page("contact", "تواصل معنا", [classicContactHeader, classicContact], {
        title: "تواصل معنا",
        description: "بنرد على واتساب خلال ساعة في مواعيد العمل.",
      }),
      page("faq", "الأسئلة الشائعة", [classicFaqHeader, classicFaq], {
        title: "الأسئلة الشائعة",
        description: "إجابات سريعة عن الطلبات والتوصيل والاسترجاع والدفع.",
      }),
      page("privacy", "سياسة الخصوصية", [classicPrivacyHeader, classicPrivacy], { title: "سياسة الخصوصية" }, { showInNav: false }),
      page("terms", "الشروط والأحكام", [classicTermsHeader, classicTerms], { title: "الشروط والأحكام" }, { showInNav: false }),
    ],
  };
}

/** Every Classic design (the template's own; not in the section library). */
export const CLASSIC_DESIGNS: readonly Design[] = [
  classicHeader,
  ...CLASSIC_HOME,
  classicAboutHeader,
  classicAboutStory,
  classicAboutStats,
  classicAboutValues,
  classicAboutVisit,
  classicContactHeader,
  classicContact,
  classicFaqHeader,
  classicFaq,
  classicPrivacyHeader,
  classicPrivacy,
  classicTermsHeader,
  classicTerms,
  classicFooter,
];

export const CLASSIC: TemplateDefinition = {
  key: CLASSIC_KEY,
  version: 4,
  isDefault: true,
  folder: "classic",
  name: { ar: "طلبي الكلاسيكي", en: "Tallaby Classic" },
  description: {
    ar: "القالب الافتراضي: بسيط وعصري، بألوان هادئة وكروت مدوّرة. ست صفحات جاهزة لأي نوع متجر.",
    en: "The default template: simple and modern, with calm colours and rounded cards. Six ready pages for any kind of store.",
  },
  category: "general",
  sortOrder: 0,
  changelog: "Tallaby Classic v4: no header padding-y on mobile",
  palette: ["#f7f6f2", "#eef3f3", "#fdad28", "#145163"],
  config: classicConfig,
  pageNames: {
    home: { ar: "الرئيسية", en: "Home" },
    about: { ar: "من نحن", en: "About us" },
    contact: { ar: "تواصل معنا", en: "Contact us" },
    faq: { ar: "الأسئلة الشائعة", en: "FAQs" },
    privacy: { ar: "سياسة الخصوصية", en: "Privacy Policy" },
    terms: { ar: "الشروط والأحكام", en: "Terms & Conditions" },
  },
  demo: CLASSIC_DEMO,
  designs: CLASSIC_DESIGNS,
};
