/**
 * TechHub (template 05, modern electronics; Claude Design "Storefront
 * Templates"): cool grey paper, ink text, an electric blue for actions and a
 * yellow highlight, Cairo headings over IBM Plex Sans Arabic and 12px
 * corners. A search-led store: search-first header and hero, departments,
 * tabbed best sellers, a deal of the day and brands. Built from section
 * library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): devices on plain
 * backgrounds, no people and no visible brand logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const TECHHUB_KEY = "techhub";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(TECHHUB_KEY, getDesign(id)!, { corners: 12, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  headphones: pexels(7772548, 900),
  buds: pexels(3921817, 900),
  budsBlack: pexels(8858287, 900),
  budsOpen: pexels(3921830, 900),
  phone: pexels(11934173, 900),
  phonePair: pexels(215581, 900),
  phoneSlim: pexels(1334603, 900),
  laptop: pexels(4884116, 900),
  laptopDesk: pexels(5942722, 900),
  watch: pexels(13007642, 900),
  watchWhite: pexels(31406900, 900),
  keyboard: pexels(9020272, 900),
  keyboardColour: pexels(34877295, 900),
  speaker: pexels(20323501, 900),
  homeCam: pexels(33104382, 900),
  tablet: pexels(10535365, 900),
  store: pexels(11297769),
};

const NAME = L("فولتا ستور", "Volta Store");

const header = lib("header-search", {
  text: {
    "م": L("ف", "V"),
    "اسم متجرك": NAME,
    "ابحث عن منتج…": L("ابحث عن موبايل، لابتوب، سماعة…", "Search phones, laptops, headphones…"),
    "العروض": L("موبايلات", "Phones"),
    "هدايا": L("لابتوب", "Laptops"),
    "توصيل خلال ٤٨ ساعة": L("توصيل خلال ٢٤ ساعة في القاهرة والجيزة", "Delivery in 24 hours in Cairo and Giza"),
  },
  links: { "/products": [undefined, NEW, BEST, search("موبايل"), search("لابتوب"), SHOP] },
});

const footer = lib("footer-help", {
  text: {
    "م": L("ف", "V"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ فولتا ستور. كل الحقوق محفوظة.", "© 2026 Volta Store. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-search", {
    text: {
      "بتدور على إيه النهارده؟": L("بتدوّر على إيه النهارده؟", "What are you shopping for today?"),
      "اكتب اسم المنتج": L("اسم المنتج أو الماركة أو الموديل", "Product, brand or model number"),
    },
  }),
  lib("categories-ruled", {
    text: { "الأقسام": L("الأقسام", "Departments"), "تسوق بالقسم": L("تسوّق حسب القسم", "Shop by category") },
  }),
  lib("products-tabbed", {
    text: {
      "منتجاتنا": L("الأكثر طلباً الأسبوع ده", "Top picks this week"),
      "وصل جديد": L("وصل حديثاً", "New arrivals"),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [NEW, BEST, RATED] },
  }),
  lib("products-rail", {
    as: "flagships",
    text: { "بيحبوها": L("مختارات", "Featured"), "الأكثر مبيعًا": L("أجهزة تستاهل الترقية", "Flagships worth the upgrade") },
    links: { "/products": SHOP },
    lists: [{ source: "featured" }],
  }),
  lib("brands-tiles", {
    text: { "فولتا": "NOVA", "نورو": "ARC", "كيان": "KITE", "ساحل": "LUMEN" },
    links: { "/products": [undefined, search("Nova"), search("Arc"), search("Kite"), search("Lumen"), undefined, undefined, undefined, undefined] },
  }),
  lib("features-ruled", {
    text: {
      "توصيل سريع": L("أصلي بضمان محلي", "Original, with local warranty"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("لحد سنتين، وإحنا بنخلّص الضمان.", "Up to 2 years, claims handled by us."),
      "الدفع عند الاستلام": L("توصيل خلال ٢٤ ساعة", "Delivery in 24 hours"),
      "أو ادفع بالبطاقة والمحفظة": L("القاهرة والجيزة، ومن ٢ لـ ٥ أيام لباقي المحافظات.", "Cairo and Giza; 2–5 days elsewhere."),
      "استرجاع سهل": L("تقسيط متاح", "Installments available"),
      "١٤ يومًا لتغيّر رأيك": L("valU وكروت البنوك، تختار وقت الدفع.", "valU and bank cards, chosen at checkout."),
      "دعم على واتساب": L("استرجاع ١٤ يوم", "14-day returns"),
      "أشخاص حقيقيون طوال الأسبوع": L("للمنتجات المقفولة، واسترداد كامل.", "Sealed items, full refund."),
    },
  }),
];

const about: Design[] = [
  pageHeader(
    lib,
    "about-header",
    L("عن فولتا ستور", "About Volta Store"),
    L("محل إلكترونيات في مدينة نصر بيبيع أجهزة أصلية بضمان محلي من ٢٠١٩.", "An electronics shop in Nasr City selling original devices with local warranty since 2019."),
  ),
  aboutStory(lib, {
    photo: PHOTOS.store,
    alt: L("صالة عرض أجهزة إلكترونية", "An electronics showroom"),
    eyebrow: L("من ٢٠١٩", "Since 2019"),
    title: L("أجهزة أصلية، وضمان إحنا بنخلّصه", "Original devices, warranty we handle"),
    text: L("كل جهاز بييجي من الوكيل بفاتورة، وبنجرّبه قبل ما يخرج من المحل.", "Every device comes from the dealer with an invoice, and we test it before it leaves the shop."),
    more: L("ولو حصلت مشكلة، بنخلّص الضمان بالنيابة عنك.", "And if anything goes wrong, we handle the warranty for you."),
    button: L("تسوّق الأجهزة", "Shop devices"),
    href: SHOP,
  }),
  lib("stats-classic", {
    text: {
      "+٢٥ ألف": L("+٦٠ ألف", "60K+"),
      "طلب تم توصيله": L("طلب اتسلّم", "Orders delivered"),
      "محافظة نوصل لها": L("محافظة", "Governorates"),
      "٤٫٨": L("٤٫٧", "4.7"),
      "١٤": L("٢٤ س", "24h"),
      "يومًا للاسترجاع": L("توصيل القاهرة", "Cairo delivery"),
    },
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("إلكترونيات أصلية بضمان محلي وتوصيل سريع.", "Original electronics with local warranty, delivered fast."),
  categories: [
    ["audio", "سماعات وصوت", "Audio", PHOTOS.headphones],
    ["phones", "موبايلات", "Phones", PHOTOS.phonePair],
    ["laptops", "لابتوب وتابلت", "Laptops & tablets", PHOTOS.laptop],
    ["wearables", "ساعات ذكية", "Wearables", PHOTOS.watch],
    ["accessories", "كيبورد وإكسسوارات", "Keyboards & accessories", PHOTOS.keyboard],
    ["smart-home", "بيت ذكي", "Smart home", PHOTOS.speaker],
  ],
  products: [
    ["nova-anc-700", "audio", "سماعة Nova ANC 700 لاسلكية", "Nova ANC 700 Wireless Headphones", PHOTOS.headphones, 4299, { compareAtPrice: 4999, isFeatured: true, rating: 4.8, sold90: 312 }],
    ["nova-pulse-buds-pro", "audio", "سماعة Nova Pulse Buds Pro", "Nova Pulse Buds Pro", PHOTOS.budsBlack, 2450, { compareAtPrice: 2899, rating: 4.6, sold90: 241 }],
    ["nova-air-buds", "audio", "سماعة Nova Air Buds", "Nova Air Buds", PHOTOS.budsOpen, 1990, { sold90: 57 }],
    ["arc-x14-5g", "phones", "موبايل Arc X14 5G", "Arc X14 5G Smartphone", PHOTOS.phone, 18999, { isFeatured: true, rating: 4.7, sold90: 96 }],
    ["arc-x14-lite", "phones", "موبايل Arc X14 Lite", "Arc X14 Lite", PHOTOS.phoneSlim, 12499, { compareAtPrice: 13999, sold90: 174 }],
    ["kite-air-14", "laptops", "لابتوب Kite Air 14", "Kite Air 14 Laptop", PHOTOS.laptop, 38500, { isFeatured: true, rating: 4.8, sold90: 63 }],
    ["kite-pro-16", "laptops", "لابتوب Kite Pro 16", "Kite Pro 16 Laptop", PHOTOS.laptopDesk, 54900, { sold90: 21 }],
    ["kite-tab-11", "laptops", "تابلت Kite Tab 11", "Kite Tab 11", PHOTOS.tablet, 11200, { sold90: 34 }],
    ["lumen-watch-5", "wearables", "ساعة Lumen Watch 5", "Lumen Watch 5", PHOTOS.watch, 6750, { isFeatured: true, rating: 4.6, sold90: 148 }],
    ["lumen-watch-lite", "wearables", "ساعة Lumen Lite", "Lumen Watch Lite", PHOTOS.watchWhite, 2299, { compareAtPrice: 2799, sold90: 88 }],
    ["kite-mech-keyboard", "accessories", "كيبورد Kite ميكانيكال", "Kite Mechanical Keyboard", PHOTOS.keyboardColour, 2650, { sold90: 46 }],
    ["kite-switch-kit", "accessories", "طقم سويتشات Kite", "Kite Switch Kit", PHOTOS.keyboard, 850, { sold90: 119 }],
    ["lumen-mini-speaker", "smart-home", "سماعة Lumen Mini الذكية", "Lumen Mini Smart Speaker", PHOTOS.speaker, 1499, { compareAtPrice: 1799, sold90: 72 }],
    ["lumen-home-cam", "smart-home", "كاميرا Lumen للبيت", "Lumen Home Camera", PHOTOS.homeCam, 1650, { inStock: false, sold90: 18 }],
  ],
});

export const TECHHUB = libraryTemplate({
  key: TECHHUB_KEY,
  version: 3,
  changelog: "TechHub v3: product page",
  name: L("تك هب", "TechHub"),
  description: L(
    "إلكترونيات حديثة: بحث في الأول، أقسام، الأجهزة الرئيسية وماركات. أربع صفحات جاهزة.",
    "Modern electronics: search first, departments, flagship devices and brands. Four ready pages.",
  ),
  category: "electronics",
  sortOrder: 50,
  palette: ["#f6f7f9", "#ffd23f", "#1f5cff", "#14171c"],
  colors: {
    primary: "#1f5cff",
    secondary: "#eceff3",
    background: "#f6f7f9",
    foreground: "#14171c",
    muted: "#555d69",
    border: "#dde1e7",
    accent: "#ffd23f",
  },
  fonts: { heading: "Cairo", body: "IBM Plex Sans Arabic" },
  radius: 12,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("من نحن", "About"), seo: { title: L("عن فولتا ستور", "About Volta Store") }, sections: about },
    {
      slug: "contact",
      name: L("الدعم", "Support"),
      seo: { title: L("الدعم", "Support") },
      sections: contactPage(lib, {
        title: L("الدعم", "Support"),
        text: L("نساعدك تختار الجهاز الصح، ونخلّص الضمان معاك.", "We help you pick the right device and handle the warranty with you."),
        heading: L("اسألنا قبل ما تشتري", "Ask us before you buy"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الضمان والتوصيل والتقسيط والاسترجاع.", "Warranty, delivery, installments and returns."),
        question: L("إزاي الضمان بيشتغل؟", "How does the warranty work?"),
        answer: L(
          "كل جهاز بضمان الوكيل المحلي لحد سنتين. ابعتلنا رقم الطلب وإحنا بنخلّص الضمان بالنيابة عنك.",
          "Every device has the local dealer’s warranty, up to two years. Send us your order number and we handle the claim for you.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: { thumbs: "side", band: "shelf", extras: ["product-perks"], copy: { back: L("رجوع للمتجر", "Back to the store"), reviews: L("تقييمات المشترين", "Buyer reviews"), related: L("أجهزة وملحقات مشابهة", "Similar devices and accessories") } },
});
