/**
 * Arena (template 08, gaming gear in dark mode; Claude Design "Storefront
 * Templates"): near-black paper, violet actions and a lime highlight,
 * Changa throughout and 10px corners. A trust-led store: a full-bleed
 * hero, categories, players' picks, brand cards, shop-the-setup video,
 * numbers, help topics and an interests sign-up. Built from section library
 * designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): keyboards, mice,
 * headsets, controllers and gaming desks. No people and no visible brand
 * logos.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Level Up itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import type { Localized } from "../../core/types";
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";
import { templatePreview } from "../preview";

export const ARENA_KEY = "arena";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ARENA_KEY, getDesign(id)!, { corners: 10, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  rgbKeyboard: pexels(34877295, 900),
  switches: pexels(9020272, 900),
  keyboardShelf: pexels(31076950),
  mouseDesk: pexels(5861328, 900),
  mouseTop: pexels(5861324, 900),
  headset: pexels(9742608, 900),
  pcDesk: pexels(30469973),
  heroDesk: pexels(30469973, 1600),
  editDesk: pexels(8774458),
  neonController: pexels(7773745, 900),
  glowControllers: pexels(34592708, 900),
  arenaDesk: pexels(7862505),
  powerBank: pexels(3921704, 900),
  cable: pexels(3921713, 900),
};

const NAME = L("ليفل أب", "Level Up");

/**
 * Level Up's own content: what the look is built with when no edition is
 * applied (the template `arena` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header search placeholder: three things a buyer types.
  labels: { search: L("ابحث عن لوحة مفاتيح، ماوس، سماعة…", "Search keyboards, mice, headsets…") },
  // Copy over a full-bleed photo. The second button is always "Best sellers".
  hero: {
    alt: L("مكتب ألعاب بإضاءة برتقالية", "A gaming desk in orange light"),
    eyebrow: L("أدوات الألعاب", "Gaming gear"),
    title: L("العب بمستوى أعلى", "Play at a higher level"),
    line: L("لوحات مفاتيح وماوس وسماعات وأذرع تحكم لكل منصة.", "Keyboards, mice, headsets and controllers for every platform."),
    cta: L("تسوق الأدوات", "Shop the gear"),
  },
  categories: { title: L("اختر أدواتك", "Choose your gear") },
  // A brand-coloured panel beside a rail of what `journey.primary` shows: `eyebrow` names what the rail shows (two words), then the panel's title and line.
  products: {
    primary: {
      eyebrow: L("الأكثر مبيعاً", "Best sellers"),
      title: L("اختيارات اللاعبين", "Players’ picks"),
      line: L("الأدوات الأكثر طلبًا في المتجر.", "The most ordered gear in the store."),
    },
  },
  // The sign-up: a question whose answers are the four `custom.newsletter-interest-N` chips.
  newsletter: {
    title: L("ماذا تلعب؟", "What do you play?"),
    line: L("اختر اهتمامك لتصلك أخبار المنتجات الجديدة التي تناسبه.", "Pick your interest and get news of new gear for it."),
  },
  // The footer's sign-off, a few words in the trade's voice.
  footer: { line: L("نراك في المباراة القادمة", "See you next match") },
  about: {
    line: L("أدوات ألعاب الفيديو للكمبيوتر والكونسول.", "Gaming gear for PC and console."),
    alt: L("شاشة وسماعة ألعاب على مكتب", "A monitor and gaming headset on a desk"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("أدوات مختارة للاعبين", "Gear chosen for players"),
    text: L("لوحات مفاتيح وماوس وسماعات بمواصفات واضحة لكل منتج.", "Keyboards, mice and headsets with clear specs for every product."),
    more: L("تواصل معنا لأي سؤال عن المواصفات أو التوافق.", "Contact us with any question about specs or compatibility."),
    // Goes to the whole catalog.
    cta: L("تسوق كل الأدوات", "Shop all gear"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("سيتي ستارز، مدينة نصر، القاهرة.", "City Stars Mall, Nasr City, Cairo."),
    heading: L("اسأل فريقنا", "Ask our team"),
  },
  faq: {
    line: L("المواصفات والتوافق والطلب والشحن.", "Specs, compatibility, ordering and shipping."),
    question: L("كيف أعرف أن المنتج يناسب جهازي؟", "How do I know a product fits my setup?"),
    answer: L(
      "تجد المواصفات والتوافق في صفحة كل منتج، ويمكنك التواصل معنا لأي سؤال.",
      "Specs and compatibility are on every product page, and you can contact us with any question.",
    ),
  },
  custom: {
    // Optional, all four or none: brands the store really stocks, as wordmarks (one word; the same in both languages for a Latin name). Each card links to a catalog search for the English name. The cards' product counts (24, 18, 12, 9) are the look's, so leave the brands out when they would be wrong.
    "brands-1": L("NOVA", "NOVA"),
    "brands-2": L("Kinetic", "Kinetic"),
    "brands-3": L("HALO", "HALO"),
    "brands-4": L("Vector", "Vector"),
    // Optional, all six or none: three figures the store can stand behind, each a short value (at most 6 characters) over a two- or three-word label.
    "stats-1-value": L("سنتين", "2 yrs"),
    "stats-1-label": L("ضمان محلي", "Local warranty"),
    "stats-2-value": L("٢٤ س", "24 h"),
    "stats-2-label": L("توصيل القاهرة", "Cairo delivery"),
    "stats-3-value": L("١٢ ألف", "12K"),
    "stats-3-label": L("لاعب تعامل معنا", "Players served"),
    // The video block over a row of products: a small label, a title and the poster's alt text.
    "video-eyebrow": L("تسوّق التجهيزات", "Shop the setup"),
    "video-title": L("مكتب بث متكامل", "A full streaming desk"),
    "video-alt": L("فيديو: مكتب بث", "Video: a streaming desk"),
    // The sign-up's four interest chips, one word each: answers to `newsletter.title`.
    "newsletter-interest-1": L("كمبيوتر", "PC"),
    "newsletter-interest-2": L("كونسول", "Console"),
    "newsletter-interest-3": L("الهاتف", "Mobile"),
    "newsletter-interest-4": L("البث", "Streaming"),
  },
  photos: {
    // Full-bleed behind the hero copy (16:9), on a dark page.
    hero: { wide: PHOTOS.heroDesk },
    // The about page's photo (4:5).
    story: PHOTOS.arenaDesk,
    // The video block's poster (16:9): the products in use, no people.
    custom: { "video-poster": PHOTOS.editDesk },
  },
};

/** A brand's wordmark: one string when both languages read the same (as the look has always written them). */
const wordmark = (brand: Localized): string | Localized => (brand.ar === brand.en ? brand.en : brand);

/** A catalog search for a brand, by its English name with a capital first letter. */
const brandHref = (brand: Localized): string => search(brand.en.charAt(0).toUpperCase() + brand.en.slice(1).toLowerCase());

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (Best sellers on the hero, Top rated, the help question) and the layout
 * stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);
  const x = (key: string) => c.custom[key]!;
  const held = (keys: readonly string[]) => keys.every((key) => (c.custom[key] as Localized | undefined) !== undefined);

  // Left out when an edition does not hold them (see `optional`).
  const brands = held(["brands-1", "brands-2", "brands-3", "brands-4"]);
  const stats = held(["stats-1-value", "stats-1-label", "stats-2-value", "stats-2-label", "stats-3-value", "stats-3-label"]);

  const header = lib("header-chips", {
    text: { "م": initialOf(name), "اسم متجرك": name, "ابحث عن منتج…": c.labels.search },
  });

  const footer = lib("footer-signoff", {
    text: {
      "شكرًا لزيارتك": c.footer.line,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "العروض": L("الأعلى تقييماً", "Top rated"),
      "من نحن": aboutName,
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  /**
   * Home (v4, template-rules §2a): a full-bleed desk photo as the hero, the
   * categories, then players' picks, the brands they trust, the setup video,
   * the numbers behind the warranty, help topics and the interests sign-up.
   */
  const home: Design[] = [
    lib("hero-fullbleed", {
      photo: [c.photos.hero.wide],
      text: {
        "المجموعة الجديدة": c.hero.eyebrow,
        "صُنعت لتدوم معك": c.hero.title,
        "خامات مختارة وتفاصيل هادئة لكل يوم.": c.hero.line,
        "تسوّق الآن": c.hero.cta,
        "اكتشف الجديد": L("الأكثر مبيعاً", "Best sellers"),
        "صورة الواجهة": c.hero.alt,
      },
      links: { "/products?sort=newest": BEST },
    }),
    lib("categories-photo-tiles", {
      text: { "تسوّق حسب القسم": c.categories.title },
    }),
    lib("products-panel-rail", {
      text: {
        "هدايا": c.products.primary.eyebrow,
        "هدايا تحت ١٠٠٠ جنيه": c.products.primary.title,
        "أفكار هدايا لكل مناسبة.": c.products.primary.line,
      },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary }],
    }),
    ...(brands
      ? [
          lib("brands-cards", {
            text: {
              "فولتا": wordmark(x("brands-1")),
              "٤٢": L("٢٤", "24"),
              "نورو": wordmark(x("brands-2")),
              "كيان": wordmark(x("brands-3")),
              "٢٧": L("١٢", "12"),
              "ساحل": wordmark(x("brands-4")),
            },
            links: { "/products": [undefined, brandHref(x("brands-1")), brandHref(x("brands-2")), brandHref(x("brands-3")), brandHref(x("brands-4"))] },
          }),
        ]
      : []),
    ...(stats
      ? [
          lib("stats-band", {
            text: {
              "+٢٥ ألف": x("stats-1-value"),
              "طلب تم توصيله": x("stats-1-label"),
              "٢٧": x("stats-2-value"),
              "محافظة نوصل لها": x("stats-2-label"),
              "١٤": x("stats-3-value"),
              "يومًا للاسترجاع": x("stats-3-label"),
            },
          }),
        ]
      : []),
    lib("video-shop", {
      photo: [undefined, c.photos.custom["video-poster"]!],
      text: {
        "تسوق من الفيديو": x("video-eyebrow"),
        "كل ما في الفيديو": x("video-title"),
        "فيديو المنتجات": x("video-alt"),
      },
    }),
    lib("faq-topics", {
      text: { "عمّ تسأل؟": L("كيف يمكننا مساعدتك؟", "How can we help?") },
    }),
    lib("newsletter-interests", {
      text: {
        "ما الذي يهمك؟": c.newsletter.title,
        "سنرسل إليك ما يهمك فقط.": c.newsletter.line,
        "وصل حديثًا": x("newsletter-interest-1"),
        "العروض": x("newsletter-interest-2"),
        "هدايا": x("newsletter-interest-3"),
        "نصائح": x("newsletter-interest-4"),
      },
    }),
  ];

  const about: Design[] = [
    pageHeader(lib, "about-header", aboutName, c.about.line),
    aboutStory(lib, {
      photo: c.photos.story,
      alt: c.about.alt,
      eyebrow: c.about.eyebrow,
      title: c.about.title,
      text: c.about.text,
      more: c.about.more,
      button: c.about.cta,
      href: SHOP,
    }),
  ];

  const faq: Design[] = [
    pageHeader(lib, "faq-header", L("الأسئلة الشائعة", "FAQ"), c.faq.line),
    lib("faq-columns", {
      text: {
        "ما سياسة الاسترجاع؟": c.faq.question,
        "راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.": c.faq.answer,
      },
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      { slug: "about", name: L("من نحن", "About"), seo: { title: aboutName }, sections: about },
      {
        slug: "contact",
        name: L("تواصل", "Contact"),
        seo: { title: L("تواصل", "Contact") },
        sections: contactPage(lib, { title: c.contact.title, text: c.contact.line, heading: c.contact.heading }),
      },
      { slug: "faq", name: L("الأسئلة الشائعة", "FAQ"), seo: { title: L("الأسئلة الشائعة", "FAQ") }, sections: faq },
    ],
  };
}

const DEMO = demoStore({
  name: NAME,
  description: L("أدوات ألعاب الفيديو للاعبين.", "Gaming gear for players."),
  categories: [
    ["keyboards", "لوحات مفاتيح", "Keyboards", PHOTOS.rgbKeyboard],
    ["mice", "ماوسات", "Mice", PHOTOS.mouseTop],
    ["audio", "سماعات", "Headsets", PHOTOS.headset],
    ["setups", "تجهيزات كاملة", "Full setups", PHOTOS.pcDesk],
    ["power", "شواحن وبطاريات", "Power", PHOTOS.cable],
    ["controllers", "أذرع تحكم", "Controllers", PHOTOS.glowControllers],
    ["switches", "مفاتيح ميكانيكية", "Switches", PHOTOS.switches],
    ["cables", "كابلات", "Cables", PHOTOS.cable],
  ],
  products: [
    ["mechanical-rgb-keyboard", "keyboards", "لوحة مفاتيح ميكانيكية RGB", "Mechanical RGB Keyboard", PHOTOS.rgbKeyboard, 3450, { isFeatured: true, rating: 4.8, sold90: 212 }],
    ["switch-tester-kit", "switches", "طقم تجربة مفاتيح ميكانيكية", "Switch Tester Kit", PHOTOS.switches, 690, { sold90: 73 }],
    ["ultralight-wireless-mouse", "mice", "ماوس لاسلكي خفيف", "Ultralight Wireless Mouse", PHOTOS.mouseDesk, 1890, { isFeatured: true, rating: 4.7, sold90: 164 }],
    ["pro-gaming-headset", "audio", "سماعة ألعاب احترافية", "Pro Gaming Headset", PHOTOS.headset, 2650, { isFeatured: true, sold90: 98 }],
    ["streamer-desk-bundle", "setups", "باقة مكتب البث", "Streamer Desk Bundle", PHOTOS.editDesk, 9900, { compareAtPrice: 11400, isFeatured: true, sold90: 22 }],
    ["console-corner-kit", "setups", "باقة ركن الكونسول", "Console Corner Kit", PHOTOS.neonController, 4200, { sold90: 17 }],
    ["glow-controller", "controllers", "ذراع تحكم بإضاءة", "Glow Controller", PHOTOS.glowControllers, 1590, { compareAtPrice: 1790, sold90: 40 }],
    ["fast-power-bank", "power", "شاحن متنقل سريع", "Fast Power Bank", PHOTOS.powerBank, 890, { inStock: false, rating: 4.6, sold90: 140 }],
    ["braided-usb-c-cable", "cables", "كابل USB-C مضفّر", "Braided USB-C Cable", PHOTOS.cable, 190, { sold90: 210 }],
  ],
});

export const ARENA = editionTemplate({
  // Gallery card screenshots of the home with its niche pack (owner, 2026-11-12; apps/ecommerce/public/template-previews).
  preview: templatePreview(ARENA_KEY, "pc-gaming", { ar: 1836, en: 1835 }),
  key: ARENA_KEY,
  version: 5,
  changelog: "Arena v4: hero, categories, section order",
  name: L("أرينا", "Arena"),
  description: L(
    "أدوات جيمنج بالوضع الداكن: صورة كبيرة، اختيارات اللعيبة، ماركات وفيديو السيت أب. أربع صفحات جاهزة.",
    "Gaming gear in dark mode: a full-bleed hero, players' picks, brands and a shop-the-setup video. Four ready pages.",
  ),
  category: "electronics",
  style: ["bold"],
  sortOrder: 80,
  palette: ["#0f1117", "#1e2230", "#c6ff4d", "#7c5cff"],
  colors: {
    primary: "#7c5cff",
    secondary: "#1e2230",
    background: "#0f1117",
    foreground: "#eef0f6",
    muted: "#a1a7b8",
    border: "#2a2f3e",
    accent: "#c6ff4d",
  },
  fonts: { heading: "Changa", body: "Changa" },
  radius: 10,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "labels.search",
    "hero",
    "categories.title",
    "products.primary.eyebrow",
    "products.primary.title",
    "products.primary.line",
    "newsletter.title",
    "newsletter.line",
    "footer.line",
    "about",
    "contact",
    "faq",
    "custom.video-eyebrow",
    "custom.video-title",
    "custom.video-alt",
    "custom.newsletter-interest-1",
    "custom.newsletter-interest-2",
    "custom.newsletter-interest-3",
    "custom.newsletter-interest-4",
    "photos.hero.wide",
    "photos.story",
    "photos.custom.video-poster",
  ],
  // Brands and figures are demo claims: a pack fills a whole set truthfully or leaves it out, and that section is then not built.
  optional: [
    "custom.brands-1",
    "custom.brands-2",
    "custom.brands-3",
    "custom.brands-4",
    "custom.stats-1-value",
    "custom.stats-1-label",
    "custom.stats-2-value",
    "custom.stats-2-label",
    "custom.stats-3-value",
    "custom.stats-3-label",
  ],
  // The page is dark: an edition's `photos.dark` replaces its light photos.
  dark: true,
  // Best sellers in the panel rail; no category rows.
  journey: { primary: "best-sellers", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
  productPage: { thumbs: "bottom", surface: "shelf", band: "shelf", extras: ["product-perks"], copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "You may also like") } },
});
