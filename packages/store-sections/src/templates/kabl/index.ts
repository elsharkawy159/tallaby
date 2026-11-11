/**
 * Kabl (template 55, charging and cables; Claude Design "Storefront
 * Templates"): cool grey paper, navy ink, an electric blue for actions and a
 * soft yellow highlight, IBM Plex Sans Arabic throughout and 12px corners.
 * A search-led accessories shop: "what do you need to charge?", shop by
 * type, best sellers in compact rows, help choosing, where you charge most
 * (newest) and buyer reviews. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): wall chargers, power
 * banks, cables on marble and wood, a vent mount and a phone on a dashboard
 * mount. No people, no hands, no logos.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Kabl Store itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const KABL_KEY = "kabl";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(KABL_KEY, getDesign(id)!, { corners: 12, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  dualCharger: pexels(4865059, 900),
  whiteCharger: pexels(35921904, 900),
  usbCharger: pexels(36012993, 900),
  slimBank: pexels(3921696, 900),
  solarBank: pexels(518530, 900),
  miniSticks: pexels(38649063, 900),
  ventMount: pexels(13536013, 900),
  dashMount: pexels(10731974, 900),
  cableC: pexels(3921711, 900),
  cableOrange: pexels(4219863, 900),
  cableWhite: pexels(914915, 900),
  flatLay: pexels(3921710),
};

const NAME = L("كابل ستور", "Kabl Store");

/**
 * Kabl Store's own content: what the look is built with when no edition is
 * applied (the template `kabl` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header's delivery chip: one short line.
  announcement: [L("توصيل في نفس اليوم في القاهرة", "Same-day delivery in Cairo")],
  // The header search placeholder: three things a buyer types.
  labels: { search: L("ابحث عن USB-C، ٦٥ وات، شاحن عربية…", "Search USB-C, 65W, car charger…") },
  // The header's three trade links, one or two words each. The about page's button goes to the first one.
  nav: [
    { label: L("شواحن", "Chargers"), href: search("شاحن") },
    { label: L("باور بانك", "Power banks"), href: search("باور بانك") },
    { label: L("كابلات", "Cables"), href: search("كابل") },
  ],
  // A search hero: `title` is the question over the search box, `line` its placeholder.
  hero: {
    title: L("عايز تشحن إيه؟", "What do you need to charge?"),
    line: L("موديل الموبايل أو الوات أو نوع الكابل", "Phone model, watts or cable type"),
  },
  categories: { title: L("تسوق بالنوع", "Shop by type") },
  // Six compact rows of what `journey.primary` shows: the title must say the same.
  products: { primary: { title: L("الأكثر مبيعاً", "Best sellers") } },
  // Three contact cards (WhatsApp, phone, visit). `line` is the WhatsApp card's promise; `points.0` is where the shop is and `points.1` why to come, both on the "Visit the shop" card.
  help: {
    title: L("مش متأكد أنهي يناسب؟", "Not sure which one fits?"),
    line: L("ابعت موديل موبايلك ونقولك", "Send your phone model and we tell you"),
    points: [L("وسط البلد، القاهرة", "Downtown Cairo"), L("جرّب الشاحن قبل ما تشتري", "Try a charger before you buy")],
  },
  // Four tiles of two or three words, each to a catalog route, over a row of the newest products.
  finder: {
    title: L("بتشحن فين أكتر؟", "Where do you charge most?"),
    line: L("اختار المكان ونوريك الشاحن اللي يناسبه.", "Pick the place and we show you the charger that fits."),
    options: [
      { label: L("في البيت", "At home"), href: search("شاحن") },
      { label: L("في الشارع", "On the go"), href: search("باور بانك") },
      { label: L("في العربية", "In the car"), href: search("عربية") },
      { label: L("على المكتب", "At the desk"), href: search("كابل") },
    ],
  },
  // Optional: three buyer quotes with their names (the avatar letter is the name's first letter). Without them the home page ends on the finder.
  reviews: {
    title: L("قالوا عن كابل", "What buyers say"),
    items: [
      {
        quote: L("الشاحن ٦٥ وات بيشحن اللابتوب والموبايل مع بعض ومش بيسخن.", "The 65 W charger runs my laptop and phone together and stays cool."),
        name: L("ياسمين ع.", "Yasmin A."),
      },
      {
        quote: L("بعتلهم موديل الموبايل وقالولي الكابل الصح في دقايق.", "I sent my phone model and they told me the right cable in minutes."),
        name: L("حسام ر.", "Hossam R."),
      },
      {
        quote: L("الباور بانك خفيف ويكفي يومين سفر.", "The power bank is light and lasts two travel days."),
        name: L("دينا م.", "Dina M."),
      },
    ],
  },
  about: {
    line: L("شواحن وكابلات بتعيش أكتر من شهر.", "Chargers and cables that last more than a month."),
    alt: L("شاحن أبيض وكابل USB-C على رخام", "A white charger and a USB-C cable on marble"),
    eyebrow: L("وسط البلد", "Downtown"),
    title: L("تعبنا من الكابل اللي بيبوظ في شهر", "Tired of cables that die in a month"),
    text: L("بدأنا بنجرّب الشواحن بنفسنا ونقيس الوات الحقيقي، وبنبيع بس اللي بيعدّي الاختبار.", "We started testing chargers ourselves and measuring the real watts, and we only sell what passes."),
    more: L("وكل منتج عليه استبدال لمدة سنة لو بطّل يشحن.", "And every product has a 1-year replacement if it stops charging."),
    // Goes to the first header link (`nav.0`), so it names that category.
    cta: L("تسوق الشواحن", "Shop chargers"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("ابعتلنا موديل موبايلك ونقولك الشاحن المناسب.", "Send us your phone model and we tell you the right charger."),
    heading: L("اسأل عن شاحن أو كابل", "Ask about a charger or cable"),
  },
  faq: {
    line: L("الوات والتوافق والاستبدال.", "Watts, compatibility and replacement."),
    question: L("لو الكابل بطّل يشحن أعمل إيه؟", "What if a cable stops charging?"),
    answer: L("ابعتلنا رقم الطلب خلال سنة ونبدّله لك ببلاش.", "Send us your order number within a year and we replace it for free."),
  },
  // The look's only photo block is the about page's (4:5).
  photos: { story: PHOTOS.flatLay },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (Top rated, Visit the shop, Just in) and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const initial = initialOf(name);
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);

  const header = lib("header-search", {
    text: {
      "م": initial,
      "اسم متجرك": name,
      "ابحث عن منتج…": c.labels.search,
      "العروض": c.nav[0]!.label,
      "هدايا": c.nav[1]!.label,
      "إكسسوارات": c.nav[2]!.label,
      "توصيل خلال ٤٨ ساعة": c.announcement[0]!,
    },
    links: { "/products": [undefined, NEW, BEST, c.nav[0]!.href, c.nav[1]!.href, c.nav[2]!.href] },
  });

  const footer = lib("footer-help", {
    text: {
      "م": initial,
      "اسم متجرك": name,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  // Absent in an edition without buyer quotes: the section is left out.
  const reviews: LookContent["reviews"] | undefined = c.reviews;
  const home: Design[] = [
    lib("hero-search", {
      text: {
        "بتدور على إيه النهارده؟": c.hero.title,
        "اكتب اسم المنتج": c.hero.line,
      },
    }),
    lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": c.categories.title } }),
    lib("products-rows", {
      text: { "إكسسوارات بسعر حلو": c.products.primary.title },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary, limit: 6 }],
    }),
    lib("service-support", {
      text: {
        "محتاج مساعدة؟": c.help.title,
        "بنرد في أقل من ساعة": c.help.line,
        "زور فرع": L("زور المحل", "Visit the shop"),
        "٣ فروع في القاهرة": c.help.points[0]!,
        "من غير معاد": c.help.points[1]!,
      },
    }),
    lib("finder-use", {
      text: {
        "هتستخدمها في إيه؟": c.finder.title,
        "اختار استخدامك ونوديك على المنتجات المناسبة ليه.": c.finder.line,
        "المشاوير": c.finder.options[0]!.label,
        "الرياضة": c.finder.options[1]!.label,
        "المكالمات": c.finder.options[2]!.label,
        "الشغل من البيت": c.finder.options[3]!.label,
        "الأكثر طلبًا دلوقتي": L("وصل حديثاً", "Just in"),
      },
      links: { "/products": [c.finder.options[0]!.href, c.finder.options[1]!.href, c.finder.options[2]!.href, c.finder.options[3]!.href] },
      lists: [{ source: "newest" }],
    }),
    ...(reviews
      ? [
          lib("testimonials-classic", {
            text: {
              "آراء العملاء": reviews.title,
              "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": reviews.items[0]!.quote,
              "م": initialOf(reviews.items[0]!.name),
              "مريم أ.": reviews.items[0]!.name,
              "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": reviews.items[1]!.quote,
              "ع": initialOf(reviews.items[1]!.name),
              "عمر ك.": reviews.items[1]!.name,
              "أسعار معقولة وجودة أفضل مما توقعت.": reviews.items[2]!.quote,
              "ن": initialOf(reviews.items[2]!.name),
              "نور ح.": reviews.items[2]!.name,
            },
          }),
        ]
      : []),
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
      href: c.nav[0]!.href,
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      { slug: "about", name: L(aboutName.ar, "About"), seo: { title: aboutName }, sections: about },
      {
        slug: "contact",
        name: L("تواصل", "Contact"),
        seo: { title: L("تواصل", "Contact") },
        sections: contactPage(lib, { title: c.contact.title, text: c.contact.line, heading: c.contact.heading }),
      },
      {
        slug: "faq",
        name: L("الأسئلة الشائعة", "FAQ"),
        seo: { title: L("الأسئلة الشائعة", "FAQ") },
        sections: faqPage(lib, { text: c.faq.line, question: c.faq.question, answer: c.faq.answer }),
      },
    ],
  };
}

const DEMO = demoStore({
  name: NAME,
  description: L("شواحن وكابلات بتعيش أكتر من شهر.", "Chargers and cables that last more than a month."),
  categories: [
    ["chargers", "شواحن", "Chargers", PHOTOS.dualCharger],
    ["power", "باور بانك", "Power banks", PHOTOS.slimBank],
    ["car", "للعربية", "For the car", PHOTOS.dashMount],
    ["cables", "كابلات", "Cables", PHOTOS.cableOrange],
    ["kits", "باكدجات", "Bundles", PHOTOS.flatLay],
  ],
  products: [
    ["dual-usb-c-charger-35w", "chargers", "شاحن USB-C مزدوج ٣٥ وات", "Dual USB-C Charger 35W", PHOTOS.dualCharger, 390, { isFeatured: true, rating: 4.8, sold90: 410 }],
    ["slim-20k-power-bank", "power", "باور بانك سليم 20K", "Slim 20K Power Bank", PHOTOS.slimBank, 1080, { sold90: 220 }],
    ["solar-power-bank", "power", "باور بانك بالطاقة الشمسية", "Solar Power Bank", PHOTOS.solarBank, 1290, { rating: 4.6, sold90: 64 }],
    ["car-mount-360", "car", "حامل عربية ٣٦٠°", "360° Car Mount", PHOTOS.dashMount, 420, { sold90: 301 }],
    ["mini-power-stick", "power", "باور ستيك ميني", "Mini Power Stick", PHOTOS.miniSticks, 480, { compareAtPrice: 560, sold90: 61 }],
    ["fast-charger-20w", "chargers", "شاحن سريع ٢٠ وات", "20W Fast Charger", PHOTOS.whiteCharger, 290, { sold90: 180 }],
    ["usb-a-charger", "chargers", "شاحن USB-A مع كابل", "USB-A Charger with Cable", PHOTOS.usbCharger, 220, { compareAtPrice: 260, sold90: 95 }],
    ["magnetic-vent-mount", "car", "حامل مغناطيس للتكييف", "Magnetic Vent Mount", PHOTOS.ventMount, 350, { sold90: 140 }],
    ["braided-usb-c-cable", "cables", "كابل USB-C مضفّر", "Braided USB-C Cable", PHOTOS.cableC, 260, { isFeatured: true, rating: 4.9, sold90: 260 }],
    ["usb-cable-2m", "cables", "كابل USB برتقالي ٢ متر", "2 m Orange USB Cable", PHOTOS.cableOrange, 180, { sold90: 120 }],
    ["usb-cable-1m", "cables", "كابل USB أبيض ١ متر", "1 m White USB Cable", PHOTOS.cableWhite, 120, { inStock: false, sold90: 70 }],
    ["charger-cable-bundle", "kits", "باكدج شاحن وكابل", "Charger & Cable Bundle", PHOTOS.flatLay, 490, { compareAtPrice: 580, sold90: 86 }],
  ],
});

export const KABL = editionTemplate({
  key: KABL_KEY,
  version: 3,
  changelog: "Kabl v3: category data tiles, section order, reviews to close",
  productPage: { thumbs: "side", band: "shelf", extras: ["product-perks"], copy: { reviews: L("رأي اللي شحنوا بيه", "From people who charge with it"), related: L("يشتغل معاه", "Works with") } },
  name: L("كابل", "Kabl"),
  description: L(
    "شواحن وكابلات: بحث بالموديل أو الوات، الأكثر مبيعاً واختيار حسب المكان. أربع صفحات جاهزة.",
    "Chargers and cables: search by model or watts, best sellers and pick by place. Four ready pages.",
  ),
  category: "mobile-accessories",
  style: ["minimal"],
  sortOrder: 550,
  palette: ["#f6f7f9", "#e7ebf0", "#fde68a", "#2563eb"],
  colors: {
    primary: "#2563eb",
    secondary: "#e7ebf0",
    background: "#ffffff",
    foreground: "#0f172a",
    muted: "#4b5563",
    border: "#d7dde5",
    accent: "#fde68a",
  },
  fonts: { heading: "IBM Plex Sans Arabic", body: "IBM Plex Sans Arabic" },
  radius: 12,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "announcement.0",
    "labels.search",
    "nav.0",
    "nav.1",
    "nav.2",
    "hero.title",
    "hero.line",
    "categories.title",
    "products.primary.title",
    "help.title",
    "help.line",
    "help.points.0",
    "help.points.1",
    "finder.title",
    "finder.line",
    "finder.options.0",
    "finder.options.1",
    "finder.options.2",
    "finder.options.3",
    "about",
    "contact",
    "faq",
    "photos.story",
  ],
  // Buyer quotes are demo claims: a pack writes real ones or leaves the group out (the section is then not built).
  optional: ["reviews"],
  // Six best sellers in compact rows; no category rows.
  journey: { primary: "best-sellers", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
