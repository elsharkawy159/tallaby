/**
 * Tallaby Classic (Claude Design "Tallaby Classic Template", 2026-10-19): the
 * default template and every new store's starting site. A deep teal brand,
 * an amber accent, warm off-white paper, rounded white cards and pill
 * buttons, in Readex Pro (the storefront face, for Arabic and English). Every
 * section is an element tree (CLAUDE.md rule 17) and every colour is a
 * design-system token, so the seller can restyle all of it.
 *
 * Pages: home, About, Contact, FAQ, Privacy, Terms and the hidden product
 * page (the layout of every /products/[slug]). The catalog (/products), cart, checkout, sign-in, account, wishlist,
 * orders, shipping, returns and the blog are the store's system pages; the
 * header, footer and sections link to them.
 *
 * Same key as the earlier coded Classic (`tallaby-classic`, 0052/0062), so
 * stores whose `template_key` is the default already point at it. Tree
 * sections since version 3.
 *
 * v8 (look-first pilot, F-89, 2026-11-11; design change approved by the
 * owner for the pilot, CLAUDE.md rule 12). Same colours, fonts and corners.
 * The home page is eight section-library designs (`./home-library.ts`):
 *   1. `hero-carousel` v2: three full-width slides with generic copy
 *   2. `categories-photo-tiles` v2
 *   3. `products-grid` v3: best sellers (8), a hairline round each photo
 *   4. `about-two-tone`: the store's promise beside a photo (the page's one scroll effect)
 *   5. `products-rail` v2: new arrivals (4) on the tinted band
 *   6. `features-icon-cards` v2: delivery, cash on delivery, returns, WhatsApp
 *   7. `faq-side` v2
 *   8. `newsletter-big` v2 on the pale `secondary` colour, no discount copy
 * No typed figures (v7's statistics band is gone). The header stays Classic's
 * own (`tallaby-header`: search box, account, wishlist and cart; no library
 * header has all of them, and the renderer keeps its account icon on phones
 * by this id). The footer stays Classic's own (`tallaby-footer` v3: it has
 * the Policies column and no typed phone or address, which the library's
 * `footer-classic` lacks), restyled as a calm band in the brand colour. The
 * About, Contact, FAQ, Privacy, Terms and product pages keep Classic's own
 * designs. The home designs of v3 to v7 stay in `CLASSIC_DESIGNS` for the
 * stores that hold them.
 *
 * Product stage: square, `cover` (see `PRODUCT_STAGE`).
 *
 * Photos (Pexels, checked 2026-11-11; no people, no logos; products are
 * white-studio packshots, listed in `./demo.ts`). Hero slides: 5485173 (gift
 * boxes on beige, cut to its left side), 4498152 (an open cardboard box),
 * 5485119 (glitter gift boxes on white, cut to its left side). Story:
 * 12354555 (parcels on a shelf). FAQ: 4087271 (a white desk flat lay, cut to
 * its right side). Tried and dropped for the hero: 3735219 (handwritten
 * Cyrillic price tags) and 16289469 (a framed drawing of a face).
 */
import { SITE_CONFIG_VERSION, type SiteConfig, type SitePage } from "../../config/schema";
import { instantiateDesign, type Design } from "../../designs/builder";
import { PRODUCT_PAGE_NAME, productSitePage } from "../_product-page";
import type { TemplateDefinition } from "../types";
import { classicFooter, classicHeader } from "./chrome";
import { CLASSIC_DEMO } from "./demo";
import { CLASSIC_LEGACY_HOME, classicOffers } from "./home";
import { CLASSIC_HOME } from "./home-library";
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
import { CLASSIC_PRODUCT } from "./product";

export const CLASSIC_KEY = "tallaby-classic";

/**
 * One frame for every product photo in a product list: square, the photo
 * filling it. Classic is every store's first site, so the frame must suit any
 * seller's photos (packshots and lifestyle shots alike): `cover` never leaves
 * bands beside a photo whose background is not the frame's colour.
 */
const PRODUCT_STAGE = { ratio: "1:1", fit: "cover" } as const;

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
        background: "#ffffff",
        foreground: "#1b2629",
        muted: "#5b6a6f",
        border: "#e5e1db",
        accent: "#fdad28",
      },
      typography: { headingFont: "Readex Pro", bodyFont: "Readex Pro" },
      spacing: { borderRadius: 16, containerMaxWidth: 1440, productStage: PRODUCT_STAGE },
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
      productSitePage(CLASSIC_PRODUCT),
    ],
  };
}

/** Every Classic design: its pages' designs (the home page's are library designs with Classic's copy) and the earlier home designs. */
export const CLASSIC_DESIGNS: readonly Design[] = [
  classicHeader,
  ...CLASSIC_HOME,
  // The home page of v3 to v7: stores made from them still hold these.
  ...CLASSIC_LEGACY_HOME,
  classicOffers,
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
  ...CLASSIC_PRODUCT,
  classicFooter,
];

export const CLASSIC: TemplateDefinition = {
  key: CLASSIC_KEY,
  version: 8,
  isDefault: true,
  folder: "classic",
  name: { ar: "طلبي الكلاسيكي", en: "Tallaby Classic" },
  description: {
    ar: "القالب الافتراضي: بسيط وعصري، بألوان هادئة وكروت مدوّرة. ست صفحات جاهزة لأي نوع متجر.",
    en: "The default template: simple and modern, with calm colours and rounded cards. Six ready pages for any kind of store.",
  },
  category: "general",
  style: ["classic", "minimal"],
  sortOrder: 0,
  changelog: "Tallaby Classic v8: the home page from section-library designs (full-width banner carousel, photo category tiles, the premium product card, a two-tone story banner, FAQ split, one-row newsletter), no typed figures, and a calm footer band",
  palette: ["#f7f6f2", "#eef3f3", "#fdad28", "#145163"],
  config: classicConfig,
  pageNames: {
    home: { ar: "الرئيسية", en: "Home" },
    about: { ar: "من نحن", en: "About us" },
    contact: { ar: "تواصل معنا", en: "Contact us" },
    faq: { ar: "الأسئلة الشائعة", en: "FAQs" },
    privacy: { ar: "سياسة الخصوصية", en: "Privacy Policy" },
    terms: { ar: "الشروط والأحكام", en: "Terms & Conditions" },
    product: PRODUCT_PAGE_NAME,
  },
  demo: CLASSIC_DEMO,
  designs: CLASSIC_DESIGNS,
};
