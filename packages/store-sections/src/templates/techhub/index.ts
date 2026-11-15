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
    "ابحث عن منتج…": L("ابحث عن هاتف، حاسوب محمول، سماعة…", "Search phones, laptops, headphones…"),
    "العروض": L("هواتف", "Phones"),
    "هدايا": L("حواسيب محمولة", "Laptops"),
    "صور ومواصفات لكل منتج": L("صور ومواصفات لكل منتج", "Photos and specs for every product"),
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
      "عمّ تبحث اليوم؟": L("عمّ تبحث اليوم؟", "What are you shopping for today?"),
      "اكتب اسم المنتج": L("اسم المنتج أو العلامة التجارية أو الموديل", "Product, brand or model number"),
    },
  }),
  lib("categories-ruled", {
    text: { "الأقسام": L("الأقسام", "Departments"), "تسوق بالقسم": L("تسوّق حسب القسم", "Shop by category") },
  }),
  lib("products-tabbed", {
    text: {
      "منتجاتنا": L("الأكثر طلبًا هذا الأسبوع", "Top picks this week"),
      "وصل جديد": L("وصل حديثاً", "New arrivals"),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [NEW, BEST, RATED] },
  }),
  lib("products-rail", {
    as: "flagships",
    text: { "المفضلة لدى العملاء": L("مختارات", "Featured"), "الأكثر مبيعًا": L("أجهزة تستحق الترقية", "Flagships worth the upgrade") },
    links: { "/products": SHOP },
    lists: [{ source: "featured" }],
  }),
  lib("brands-tiles", {
    text: { "فولتا": "NOVA", "نورو": "ARC", "كيان": "KITE", "ساحل": "LUMEN" },
    links: { "/products": [undefined, search("Nova"), search("Arc"), search("Kite"), search("Lumen"), undefined, undefined, undefined, undefined] },
  }),
  lib("features-ruled", {
    text: {
      "الشحن": L("صور ومواصفات لكل جهاز", "Photos and specs for every device"),
      "تظهر تكلفة الشحن ومدته عند إتمام الطلب": L("المعالج والذاكرة والشاشة مكتوبة بوضوح.", "Processor, memory and screen clearly listed."),
      "الدفع عند الاستلام": L("تشكيلة لكل الاستخدامات", "A range for every use"),
      "أو بطرق الدفع المتاحة عند الطلب": L("هواتف وحواسيب وسماعات وملحقات.", "Phones, laptops, audio and accessories."),
      "الاستبدال والاسترجاع": L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
      "التفاصيل في صفحة السياسات": L("ابحث بالاسم أو العلامة التجارية أو الموديل.", "Search by name, brand or model."),
      "تواصل معنا": L("تواصل معنا لأي سؤال", "Contact us with any question"),
      "لأي سؤال عن طلب أو منتج": L("قبل الطلب أو بعده.", "Before or after you order."),
    },
  }),
];

const about: Design[] = [
  pageHeader(
    lib,
    "about-header",
    L("عن فولتا ستور", "About Volta Store"),
    L("هواتف وحواسيب وسماعات وأجهزة ذكية بمواصفات واضحة.", "Phones, laptops, audio and smart devices with clear specs."),
  ),
  aboutStory(lib, {
    photo: PHOTOS.store,
    alt: L("صالة عرض أجهزة إلكترونية", "An electronics showroom"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("الجهاز المناسب لاستخدامك", "The right device for your use"),
    text: L("نختار هواتف وحواسيب وسماعات وملحقات، ونعرض مواصفات كل جهاز بوضوح.", "We choose phones, laptops, audio and accessories, and show every device's specs clearly."),
    more: L("تواصل معنا لأي سؤال عن جهاز قبل الشراء.", "Contact us with any question about a device before you buy."),
    button: L("تسوّق الأجهزة", "Shop devices"),
    href: SHOP,
  }),
  lib("stats-classic", {
    text: {
      "+٢٥ ألف": L("+٦٠ ألف", "60K+"),
      "طلب تم توصيله": L("طلب تم توصيله", "Orders delivered"),
      "محافظة نوصل لها": L("محافظة", "Governorates"),
      "٤٫٨": L("٤٫٧", "4.7"),
      "١٤": L("٢٤ س", "24h"),
      "يومًا للاسترجاع": L("توصيل القاهرة", "Cairo delivery"),
    },
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("هواتف وحواسيب وسماعات وأجهزة ذكية.", "Phones, laptops, audio and smart devices."),
  categories: [
    ["audio", "سماعات وصوت", "Audio", PHOTOS.headphones],
    ["phones", "هواتف", "Phones", PHOTOS.phonePair],
    ["laptops", "حواسيب محمولة وأجهزة لوحية", "Laptops & tablets", PHOTOS.laptop],
    ["wearables", "ساعات ذكية", "Wearables", PHOTOS.watch],
    ["accessories", "لوحات مفاتيح وإكسسوارات", "Keyboards & accessories", PHOTOS.keyboard],
    ["smart-home", "المنزل الذكي", "Smart home", PHOTOS.speaker],
    ["earbuds", "سماعات لاسلكية", "Earbuds", PHOTOS.buds],
    ["tablets", "أجهزة لوحية", "Tablets", PHOTOS.tablet],
  ],
  products: [
    ["nova-anc-700", "audio", "سماعة Nova ANC 700 لاسلكية", "Nova ANC 700 Wireless Headphones", PHOTOS.headphones, 4299, { compareAtPrice: 4999, isFeatured: true, rating: 4.8, sold90: 312 }],
    ["nova-pulse-buds-pro", "earbuds", "سماعة Nova Pulse Buds Pro", "Nova Pulse Buds Pro", PHOTOS.budsBlack, 2450, { compareAtPrice: 2899, isFeatured: true, rating: 4.6, sold90: 241 }],
    ["nova-air-buds", "earbuds", "سماعة Nova Air Buds", "Nova Air Buds", PHOTOS.budsOpen, 1990, { sold90: 57 }],
    ["arc-x14-5g", "phones", "هاتف Arc X14 5G", "Arc X14 5G Smartphone", PHOTOS.phone, 18999, { isFeatured: true, rating: 4.7, sold90: 96 }],
    ["arc-x14-lite", "phones", "هاتف Arc X14 Lite", "Arc X14 Lite", PHOTOS.phoneSlim, 12499, { compareAtPrice: 13999, sold90: 174 }],
    ["kite-air-14", "laptops", "حاسوب محمول Kite Air 14", "Kite Air 14 Laptop", PHOTOS.laptop, 38500, { isFeatured: true, rating: 4.8, sold90: 63 }],
    ["kite-pro-16", "laptops", "حاسوب محمول Kite Pro 16", "Kite Pro 16 Laptop", PHOTOS.laptopDesk, 54900, { isFeatured: true, sold90: 21 }],
    ["kite-tab-11", "tablets", "جهاز لوحي Kite Tab 11", "Kite Tab 11", PHOTOS.tablet, 11200, { sold90: 34 }],
    ["lumen-watch-5", "wearables", "ساعة Lumen Watch 5", "Lumen Watch 5", PHOTOS.watch, 6750, { isFeatured: true, rating: 4.6, sold90: 148 }],
    ["lumen-watch-lite", "wearables", "ساعة Lumen Lite", "Lumen Watch Lite", PHOTOS.watchWhite, 2299, { compareAtPrice: 2799, sold90: 88 }],
    ["kite-mech-keyboard", "accessories", "لوحة مفاتيح Kite ميكانيكية", "Kite Mechanical Keyboard", PHOTOS.keyboardColour, 2650, { isFeatured: true, sold90: 46 }],
    ["kite-switch-kit", "accessories", "طقم مفاتيح تبديل Kite", "Kite Switch Kit", PHOTOS.keyboard, 850, { sold90: 119 }],
    ["lumen-mini-speaker", "smart-home", "سماعة Lumen Mini الذكية", "Lumen Mini Smart Speaker", PHOTOS.speaker, 1499, { compareAtPrice: 1799, isFeatured: true, sold90: 72 }],
    ["lumen-home-cam", "smart-home", "كاميرا Lumen المنزلية", "Lumen Home Camera", PHOTOS.homeCam, 1650, { inStock: false, sold90: 18 }],
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
  style: ["minimal"],
  sortOrder: 50,
  palette: ["#f6f7f9", "#ffd23f", "#1f5cff", "#14171c"],
  colors: {
    primary: "#1f5cff",
    secondary: "#eceff3",
    background: "#ffffff",
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
        text: L("نساعدك في اختيار الجهاز المناسب.", "We help you pick the right device."),
        heading: L("اسألنا قبل الشراء", "Ask us before you buy"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الأجهزة والمواصفات والطلبات.", "Devices, specs and orders."),
        question: L("كيف أختار الجهاز المناسب؟", "How do I pick the right device?"),
        answer: L(
          "قارن المواصفات في صفحة كل منتج، وتواصل معنا لأي سؤال.",
          "Compare the specs on each product page, and contact us with any question.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: { thumbs: "side", band: "shelf", extras: ["product-perks"], copy: { reviews: L("تقييمات المشترين", "Buyer reviews"), related: L("أجهزة وملحقات مشابهة", "Similar devices and accessories") } },
});
