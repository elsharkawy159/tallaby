/**
 * Layali (template 54, evening wear; Claude Design "Storefront Templates"):
 * pale rose paper, near-black ink, a deep wine for actions and a champagne
 * highlight, Amiri headings over Noto Sans Arabic text and sharp 2px
 * corners. An evening boutique: dressed for the night, build the look, this
 * week's rail, installments, a styling booking and one spotlight review.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): gowns and slip dresses
 * on hangers, a rail of sequin dresses, stud earrings and a pearl set, and
 * beaded and satin clutches. No people, no hands, no mannequins and no logos
 * (the design's photos of models were all replaced).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const LAYALI_KEY = "layali";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(LAYALI_KEY, getDesign(id)!, { corners: 2, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  satinGown: pexels(11813835),
  satinGownCard: pexels(11813835, 900),
  chainDress: pexels(4716575, 900),
  slipDress: pexels(18984479, 900),
  tulleDress: pexels(6833654, 900),
  gownRail: pexels(30922972, 900),
  haloStuds: pexels(5370644, 900),
  haloStudsBlue: pexels(5370642, 900),
  floralStuds: pexels(10976654, 900),
  gemStuds: pexels(5370641, 900),
  pearlSet: pexels(11365012, 900),
  swirlClutch: pexels(28387111, 900),
  ivoryClutch: pexels(1358840, 900),
  goldClutch: pexels(4627902, 900),
  leopardWall: pexels(30927606),
};

const NAME = L("ليالي بوتيك", "Layali Boutique");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("احجزي جلسة ستايلنج ببلاش · قسّطي لحد ١٢ شهر", "Book a free styling session · Pay in up to 12 months"),
    "الكود: SAVE10": L("الكود: LAYALI10", "Code: LAYALI10"),
    "م": L("ل", "L"),
    "اسم متجرك": NAME,
    "المتجر": L("الجديد", "New in"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("احجزي ستايلنج", "Book styling"),
    "من نحن": L("البوتيك", "Boutique"),
  },
  links: { "/products": [NEW, BEST, undefined, NEW, BEST], "/blog": "/contact" },
});

const footer = lib("footer-links", {
  text: {
    "م": L("ل", "L"),
    "اسم متجرك": NAME,
    "من نحن": L("البوتيك", "The boutique"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ ليالي بوتيك. كل الحقوق محفوظة.", "© 2026 Layali Boutique. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.satinGown],
    text: {
      "كوليكشن الموسم": L("سهرة ٢٠٢٦", "Evening 2026"),
      "صوت أنقى، كل يوم": L("جاهزة للسهرة", "Dressed for the night"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "فساتين وأطقم ومجوهرات متختارة مع بعض، عشان اللوك يبقى جاهز.",
        "Dresses, sets and jewellery chosen together, so the look is ready when you are.",
      ),
      "تسوق الآن": L("تسوقي الفساتين", "Shop dresses"),
      "العروض": L("احجزي ستايلنج", "Book styling"),
      "صورة الحملة": L("فستان ساتان أبيض على شماعة تحت أبليك", "A white satin gown on a hanger under a wall lamp"),
    },
    links: { "/products": [search("فستان"), "/contact"] },
  }),
  lib("gallery-captioned", {
    photo: [PHOTOS.chainDress, PHOTOS.haloStuds, PHOTOS.swirlClutch, PHOTOS.tulleDress, PHOTOS.gownRail, PHOTOS.pearlSet],
    text: {
      "لوك بوك": L("اللوك", "The look"),
      "كل يوم بشكل": L("كمّلي اللوك", "Build the look"),
      "إطلالة الشغل": L("الفستان", "The dress"),
      "٣ منتجات": L("٣ قطع", "3 pieces"),
      "المشوار": L("المجوهرات", "The jewellery"),
      "٤ منتجات": L("٤ قطع", "4 pieces"),
      "الويكند": L("الشنطة", "The bag"),
      "٢ منتج": L("قطعتين", "2 pieces"),
      "السفر": L("الترتر", "Sequins"),
      "٥ منتجات": L("٥ قطع", "5 pieces"),
      "الجيم": L("فساتين السهرة", "Gowns"),
      "السهرة": L("اللولي", "Pearls"),
    },
    links: { "/products": [search("فستان"), search("حلق"), search("كلاتش"), search("ترتر"), search("فستان سهرة"), search("لولي")] },
  }),
  lib("products-rail", {
    text: { "بيحبوها": L("وصل جديد", "New in"), "الأكثر مبيعًا": L("الأسبوع ده", "This week") },
    links: { "/products": NEW },
    lists: [{ source: "newest", limit: 6 }],
  }),
  lib("pay-installments", {
    text: {
      "قسّطها": L("قسّطيها", "Split it"),
      "١٢": L("٩", "9"),
      "٢٤": L("١٢", "12"),
      "قسّطها لحد": L("قسّطيها لحد", "Split it over up to"),
      "٢٤ شهر": L("١٢ شهر", "12 months"),
      "من غير فوايد ولا مقدم مع شركات التقسيط.": L("من غير مقدم مع شركات التقسيط، على أي فستان أو طقم.", "No down payment with our installment partners, on any dress or set."),
    },
    lists: [{ source: "featured" }],
  }),
  lib("service-booking", {
    text: {
      "احجز معاد الفني": L("احجزي جلسة ستايلنج", "Book a styling session"),
      "تركيب شاشة · حوالي ساعة": L("ستايلنج في بوتيك الزمالك · ٤٥ دقيقة", "Styling at our Zamalek boutique · 45 minutes"),
      "مواعيد الزيارات": L("المواعيد المتاحة", "Available times"),
      "١٠ ص": L("١٢ الضهر", "12 pm"),
      "١٢ الضهر": L("٢ م", "2 pm"),
      "٢ م": L("٤ م", "4 pm"),
      "٤ م": L("٦ م", "6 pm"),
      "٦ م": L("٨ م", "8 pm"),
      "٨ م": L("١٠ م", "10 pm"),
      "أو احجز على واتساب": L("أو احجزي برسالة", "Or book by message"),
    },
    links: { "https://wa.me/201001234567": "/contact" },
  }),
  lib("testimonials-spotlight", {
    text: {
      "«من أفضل تجارب الشراء أونلاين. الطلب وصل بسرعة، والتغليف أنيق، والمنتج أفضل من الصور.»": L(
        "«جلسة الستايلنج وفّرت عليا لف أسبوع. خرجت بالفستان والحلق والشنطة، واللوك كان كامل في الفرح.»",
        "“The styling session saved me a week of shopping. I left with the dress, earrings and bag, and the look was complete at the wedding.”",
      ),
      "م": L("ن", "N"),
      "مريم أ.": L("نيرة ح.", "Nayra H."),
      "القاهرة": L("الزمالك", "Zamalek"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("البوتيك", "The boutique"), L("ليالي بوتيك في الزمالك: فساتين وأطقم سهرة بستايلنج بميعاد.", "Layali Boutique in Zamalek: evening dresses and sets, styled by appointment.")),
  aboutStory(lib, {
    photo: PHOTOS.leopardWall,
    alt: L("فساتين سهرة بألوان مختلفة على راك قدام حيطة نمر", "Evening gowns in many colours on a rail against a leopard wall"),
    eyebrow: L("الزمالك", "Zamalek"),
    title: L("اللوك كله، في مكان واحد", "The whole look, in one place"),
    text: L("بنختار الفستان والمجوهرات والشنطة مع بعض، عشان متلفيش على عشر محلات قبل أي مناسبة.", "We choose the dress, jewellery and bag together, so you never visit ten shops before an occasion."),
    more: L("واحجزي جلسة ستايلنج ببلاش قبل أي سهرة.", "And book a free styling session before any evening out."),
    button: L("احجزي ستايلنج", "Book styling"),
    href: "/contact",
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("فساتين وأطقم سهرة، بستايلنج بميعاد.", "Evening dresses and sets, styled by appointment."),
  categories: [
    ["dresses", "فساتين", "Dresses", PHOTOS.slipDress],
    ["jewellery", "مجوهرات", "Jewellery", PHOTOS.haloStudsBlue],
    ["bags", "شنط", "Bags", PHOTOS.ivoryClutch],
  ],
  products: [
    ["gold-chain-dress", "dresses", "فستان سلاسل دهبي", "Gold Chain Dress", PHOTOS.chainDress, 4200, { isFeatured: true, rating: 4.9, sold90: 58 }],
    ["ivory-satin-gown", "dresses", "فستان ساتان أوف وايت", "Ivory Satin Gown", PHOTOS.satinGownCard, 4900, { rating: 4.9, sold90: 31 }],
    ["black-slip-dress", "dresses", "فستان حمالات أسود لامع", "Black Shimmer Slip Dress", PHOTOS.slipDress, 3200, { sold90: 44 }],
    ["pink-tulle-dress", "dresses", "فستان تول وردي بترتر", "Pink Tulle Sequin Dress", PHOTOS.tulleDress, 3600, { compareAtPrice: 4200, sold90: 22 }],
    ["halo-studs", "jewellery", "حلق هالو لامع", "Halo Crystal Studs", PHOTOS.haloStuds, 890, { rating: 4.8, sold90: 61 }],
    ["floral-crystal-studs", "jewellery", "حلق ورد كريستال", "Floral Crystal Studs", PHOTOS.floralStuds, 1290, { sold90: 27 }],
    ["pearl-evening-set", "jewellery", "طقم لولي سهرة", "Pearl Evening Set", PHOTOS.pearlSet, 2900, { sold90: 22 }],
    ["gem-stud-trio", "jewellery", "٣ حلقان بأحجار", "Gem Stud Trio", PHOTOS.gemStuds, 990, { compareAtPrice: 1190, sold90: 35 }],
    ["swirl-beaded-clutch", "bags", "كلاتش مطرّز", "Swirl Beaded Clutch", PHOTOS.swirlClutch, 1490, { compareAtPrice: 1750, sold90: 19 }],
    ["ivory-satin-clutch", "bags", "كلاتش ساتان أوف وايت", "Ivory Satin Clutch", PHOTOS.ivoryClutch, 1290, { sold90: 24 }],
    ["crystal-gold-clutch", "bags", "كلاتش دهبي بالكريستال", "Crystal Gold Clutch", PHOTOS.goldClutch, 1850, { inStock: false, sold90: 9 }],
  ],
});

export const LAYALI = libraryTemplate({
  key: LAYALI_KEY,
  version: 2,
  changelog: "Layali v2: product page",
  productPage: { surface: "flat", thumbs: "side", gallery: "end", button: "outline", band: "brand", extras: ["product-perks"], copy: { back: L("رجوع لتشكيلة السهرة", "Back to the evening rail"), reviews: L("رأي ضيفات الليلة", "Words from the evening"), related: L("كمّلي اللوك", "Complete the look") } },
  name: L("ليالي", "Layali"),
  description: L(
    "لبس سهرة: جاهزة للسهرة، كمّلي اللوك، جديد الأسبوع، التقسيط، حجز ستايلنج ورأي مميز. أربع صفحات جاهزة.",
    "Evening wear: dressed for the night, build the look, this week's rail, installments, styling bookings and a spotlight review. Four ready pages.",
  ),
  category: "fashion",
  sortOrder: 540,
  palette: ["#f8f5f2", "#ece4dd", "#e6c39a", "#5b1a33"],
  colors: {
    primary: "#5b1a33",
    secondary: "#ece4dd",
    background: "#f8f5f2",
    foreground: "#1c1418",
    muted: "#625660",
    border: "#ded3c9",
    accent: "#e6c39a",
  },
  fonts: { heading: "Amiri", body: "Noto Sans Arabic" },
  radius: 2,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("البوتيك", "Boutique"), seo: { title: L("البوتيك", "The boutique") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصلي معانا", "Contact us") },
      sections: contactPage(lib, {
        title: L("تواصلي معانا", "Contact us"),
        text: L("١٤ شارع البرازيل، الزمالك. الجلسات من السبت للخميس.", "14 Brazil St, Zamalek. Sessions Saturday to Thursday."),
        heading: L("احجزي جلسة ستايلنج أو اسألي عن فستان", "Book a styling session or ask about a dress"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الستايلنج والتقسيط والمقاسات.", "Styling, installments and sizes."),
        question: L("جلسة الستايلنج بفلوس؟", "Is the styling session paid?"),
        answer: L("لأ، ببلاش. بتاخد ٤٥ دقيقة في البوتيك، ومش لازم تشتري حاجة.", "No, it is free. It takes 45 minutes at the boutique, with no need to buy anything."),
      }),
    },
  ],
  demo: DEMO,
});
