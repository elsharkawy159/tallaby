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
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

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

const header = lib("header-search", {
  text: {
    "م": L("ك", "K"),
    "اسم متجرك": NAME,
    "ابحث عن منتج…": L("ابحث عن USB-C، ٦٥ وات، شاحن عربية…", "Search USB-C, 65W, car charger…"),
    "العروض": L("شواحن", "Chargers"),
    "هدايا": L("باور بانك", "Power banks"),
    "إكسسوارات": L("كابلات", "Cables"),
    "توصيل خلال ٤٨ ساعة": L("توصيل في نفس اليوم في القاهرة", "Same-day delivery in Cairo"),
  },
  links: { "/products": [undefined, NEW, BEST, search("شاحن"), search("باور بانك"), search("كابل")] },
});

const footer = lib("footer-help", {
  text: {
    "م": L("ك", "K"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ كابل ستور. كل الحقوق محفوظة.", "© 2026 Kabl Store. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-search", {
    text: {
      "بتدور على إيه النهارده؟": L("عايز تشحن إيه؟", "What do you need to charge?"),
      "اكتب اسم المنتج": L("موديل الموبايل أو الوات أو نوع الكابل", "Phone model, watts or cable type"),
    },
  }),
  lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": L("تسوق بالنوع", "Shop by type") } }),
  lib("products-rows", {
    text: { "إكسسوارات بسعر حلو": L("الأكثر مبيعاً", "Best sellers") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 6 }],
  }),
  lib("service-support", {
    text: {
      "محتاج مساعدة؟": L("مش متأكد أنهي يناسب؟", "Not sure which one fits?"),
      "بنرد في أقل من ساعة": L("ابعت موديل موبايلك ونقولك", "Send your phone model and we tell you"),
      "زور فرع": L("زور المحل", "Visit the shop"),
      "٣ فروع في القاهرة": L("وسط البلد، القاهرة", "Downtown Cairo"),
      "من غير معاد": L("جرّب الشاحن قبل ما تشتري", "Try a charger before you buy"),
    },
  }),
  lib("finder-use", {
    text: {
      "هتستخدمها في إيه؟": L("بتشحن فين أكتر؟", "Where do you charge most?"),
      "اختار استخدامك ونوديك على المنتجات المناسبة ليه.": L("اختار المكان ونوريك الشاحن اللي يناسبه.", "Pick the place and we show you the charger that fits."),
      "المشاوير": L("في البيت", "At home"),
      "الرياضة": L("في الشارع", "On the go"),
      "المكالمات": L("في العربية", "In the car"),
      "الشغل من البيت": L("على المكتب", "At the desk"),
      "الأكثر طلبًا دلوقتي": L("وصل حديثاً", "Just in"),
    },
    links: { "/products": [search("شاحن"), search("باور بانك"), search("عربية"), search("كابل")] },
    lists: [{ source: "newest" }],
  }),
  lib("testimonials-classic", {
    text: {
      "آراء العملاء": L("قالوا عن كابل", "What buyers say"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الشاحن ٦٥ وات بيشحن اللابتوب والموبايل مع بعض ومش بيسخن.",
        "The 65 W charger runs my laptop and phone together and stays cool.",
      ),
      "م": L("ي", "Y"),
      "مريم أ.": L("ياسمين ع.", "Yasmin A."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("بعتلهم موديل الموبايل وقالولي الكابل الصح في دقايق.", "I sent my phone model and they told me the right cable in minutes."),
      "ع": L("ح", "H"),
      "عمر ك.": L("حسام ر.", "Hossam R."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("الباور بانك خفيف ويكفي يومين سفر.", "The power bank is light and lasts two travel days."),
      "ن": L("د", "D"),
      "نور ح.": L("دينا م.", "Dina M."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن كابل ستور", "About Kabl Store"), L("شواحن وكابلات بتعيش أكتر من شهر.", "Chargers and cables that last more than a month.")),
  aboutStory(lib, {
    photo: PHOTOS.flatLay,
    alt: L("شاحن أبيض وكابل USB-C على رخام", "A white charger and a USB-C cable on marble"),
    eyebrow: L("وسط البلد", "Downtown"),
    title: L("تعبنا من الكابل اللي بيبوظ في شهر", "Tired of cables that die in a month"),
    text: L("بدأنا بنجرّب الشواحن بنفسنا ونقيس الوات الحقيقي، وبنبيع بس اللي بيعدّي الاختبار.", "We started testing chargers ourselves and measuring the real watts, and we only sell what passes."),
    more: L("وكل منتج عليه استبدال لمدة سنة لو بطّل يشحن.", "And every product has a 1-year replacement if it stops charging."),
    button: L("تسوق الشواحن", "Shop chargers"),
    href: search("شاحن"),
  }),
];

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

export const KABL = libraryTemplate({
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
  sortOrder: 550,
  palette: ["#f6f7f9", "#e7ebf0", "#fde68a", "#2563eb"],
  colors: {
    primary: "#2563eb",
    secondary: "#e7ebf0",
    background: "#f6f7f9",
    foreground: "#0f172a",
    muted: "#4b5563",
    border: "#d7dde5",
    accent: "#fde68a",
  },
  fonts: { heading: "IBM Plex Sans Arabic", body: "IBM Plex Sans Arabic" },
  radius: 12,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن كابل ستور", "About"), seo: { title: L("عن كابل ستور", "About Kabl Store") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("ابعتلنا موديل موبايلك ونقولك الشاحن المناسب.", "Send us your phone model and we tell you the right charger."),
        heading: L("اسأل عن شاحن أو كابل", "Ask about a charger or cable"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الوات والتوافق والاستبدال.", "Watts, compatibility and replacement."),
        question: L("لو الكابل بطّل يشحن أعمل إيه؟", "What if a cable stops charging?"),
        answer: L("ابعتلنا رقم الطلب خلال سنة ونبدّله لك ببلاش.", "Send us your order number within a year and we replace it for free."),
      }),
    },
  ],
  demo: DEMO,
});
