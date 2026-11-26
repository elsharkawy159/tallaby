/**
 * Shasha (template 102, electronics megastore; Claude Design "Storefront
 * Templates"): cool grey-white paper, slate ink, a strong blue for actions
 * and a yellow highlight, Cairo throughout and 10px corners. Original
 * electronics with local warranty: banners for audio, watches and TV, the
 * best sellers, more warranty cover, open before you pay, the audio as a
 * carousel (the store's 1st category), delivery days and order tracking. Built from section library designs (`fromLibrary`).
 *
 * The design's "Protection plans" lists a free 6-month plan beside the paid
 * ones; the library section has three paid plans with shared perk lines, so
 * the free 6 months moved into the badge and the plans are 1, 2 and 3 years.
 *
 * Photos: Pexels, each checked by eye (2026-10-23): over-ear headphones,
 * a smartwatch on charts, a living-room TV, earbuds in their cases, a
 * router, a smart speaker and power banks on marble. No people, no hands,
 * no logos (the design's product renders are local files, not Pexels, so
 * every photo is new).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const SHASHA_KEY = "shasha";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SHASHA_KEY, getDesign(id)!, { corners: 10, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  headphonesBanner: pexels(5269735),
  watchBanner: pexels(7947641),
  tvBanner: pexels(6980724),
  pulseBuds: pexels(8858287, 900),
  airBuds: pexels(11390378, 900),
  watch: pexels(7947641, 900),
  headphones: pexels(5269735, 900),
  tvRoom: pexels(6980724, 900),
  router: pexels(28348054, 900),
  speaker: pexels(1279107, 900),
  powerBank: pexels(3921704, 900),
  chargers: pexels(3921718),
};

const NAME = L("شاشة", "Shasha");

const header = lib("header-line", {
  text: {
    "م": L("ش", "S"),
    "اسم متجرك": NAME,
    "المتجر": L("كل الأجهزة", "All devices"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("عن شاشة", "About"),
    "تواصل معنا": L("تواصل", "Contact"),
  },
  links: { "/products": [undefined, BEST, undefined, undefined, BEST], "/blog": "/faq" },
});

const footer = lib("footer-help", {
  text: {
    "م": L("ش", "S"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ شاشة. كل الحقوق محفوظة.", "© 2026 Shasha. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED], "/contact": "/profile/orders" },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.headphonesBanner, PHOTOS.watchBanner, PHOTOS.tvBanner],
    text: {
      "وصل حديثًا": L("وصل جديد", "New in"),
      "الموسم الجديد وصل": L("سماعات ومكبرات صوت", "Earbuds and speakers"),
      "قطع مختارة بعناية لكل يوم.": L("سماعات لاسلكية ومكبرات صوت بمواصفات واضحة.", "Wireless earbuds and speakers with clear specs."),
      "تسوّق الجديد": L("تسوق السماعات", "Shop audio"),
      "صورة الحملة الأولى": L("سماعة رأس على طاولة خشبية", "Over-ear headphones on a wooden table"),
      "الأكثر مبيعًا": L("ساعات ذكية", "Smartwatches"),
      "المفضّلة عند عملائنا": L("ساعات ذكية للاستخدام اليومي", "Smartwatches for every day"),
      "القطع الأكثر طلبًا في المتجر.": L("عدّاد خطوات وإشعارات ومكالمات في ساعة واحدة.", "Step counts, notifications and calls in one watch."),
      "تصفّح الأكثر مبيعًا": L("تسوق الساعات", "Shop watches"),
      "صورة الحملة الثانية": L("ساعة ذكية على ورق رسوم بيانية", "A smartwatch on printed charts"),
      "مختارات الأسبوع": L("التلفزيون والبيت", "TV & home"),
      "قطع مختارة لهذا الأسبوع": L("شاشات وأجهزة بث", "TVs and streaming boxes"),
      "تشكيلة مختارة من أحدث القطع في المتجر.": L("شاشات بمقاسات مختلفة وأجهزة بث 4K.", "TVs in several sizes and 4K streaming boxes."),
      "تسوّق المختارات": L("تسوق التلفزيون والبيت", "Shop TV & home"),
      "صورة الحملة الثالثة": L("شاشة على جدار غرفة معيشة بها كنبة رمادية", "A TV on a living-room wall with a grey sofa"),
    },
    links: { "/products": [search("سماعة"), search("ساعة"), search("شاشة")] },
  }),
  lib("categories-ruled", { text: { "تسوق بالقسم": L("اختر جهازك", "Pick your device") } }),
  lib("products-list", {
    text: {
      "الكتالوج": L("الأكثر طلبًا", "Top picks"),
      "كل الإكسسوارات": L("الأكثر مبيعاً", "Best sellers"),
      "كل ما تحتاجه في مكان واحد.": L("سماعات وساعات وشاشات وشواحن بمواصفات واضحة.", "Earbuds, watches, TVs and chargers with clear specs."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 6 }],
  }),
  lib("service-plans", {
    text: {
      "الضمان": L("خطط ضمان إضافية للأجهزة", "Extra warranty plans for devices"),
      "احمِ جهازك لمدة أطول": L("مدّد الضمان", "Extend the cover"),
      "١٩٩ ج.م": L("٢٤٩ ج.م", "EGP 249"),
      "٣٤٩ ج.م": L("٣٩٩ ج.م", "EGP 399"),
      "٤٧٩ ج.م": L("٥٤٩ ج.م", "EGP 549"),
      "إصلاح الأعطال": L("إصلاح أو استبدال", "Repair or replace"),
      "زيارة فني منزلية": L("استلام الجهاز من عنوانك", "Pick-up from your address"),
      "جهاز بديل وقت الصيانة": L("حادث واحد", "One accident"),
      "كسر الشاشة مرة واحدة": L("حادثان وجهاز بديل أثناء الإصلاح", "Two accidents and a loan device during repair"),
    },
  }),
  // v4 (2026-11-16, owner): every home has at least one real products grid.
  lib("products-tabs-grid", {
    as: "new-in",
    text: { "وصل حديثاً": L("وصل حديثًا", "New in") },
    links: { "/products": NEW },
    lists: [{ source: "newest", limit: 8 }],
  }),
  lib("pay-open-box", {
    text: {
      "جرّب المنتج أمام المندوب.": L("شغّل الجهاز وتأكد منه أمام المندوب.", "Switch the device on and check it in front of the courier."),
    },
  }),
  // The store's 1st category (audio, in the demo) as a carousel.
  lib("products-category-carousel", { lists: [undefined, { limit: 4 }] }),
  lib("track-ask"),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن شاشة", "About Shasha"), L("سماعات وساعات ذكية وشاشات وشواحن.", "Earbuds, smartwatches, TVs and chargers.")),
  aboutStory(lib, {
    photo: PHOTOS.chargers,
    alt: L("شاحن متنقل وشاحن وكابلات على رخام", "A power bank, a charger and cables on marble"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("الجهاز المناسب لاستخدامك", "The right device for your use"),
    text: L("نختار سماعات وساعات وشاشات وشواحن، ونعرض مواصفات كل جهاز بوضوح.", "We choose earbuds, watches, TVs and chargers, and show every device's specs clearly."),
    more: L("تواصل معنا لأي سؤال عن جهاز أو مواصفاته.", "Contact us with any question about a device or its specs."),
    button: L("تسوق الأكثر مبيعاً", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("سماعات وساعات ذكية وشاشات وشواحن.", "Earbuds, smartwatches, TVs and chargers."),
  categories: [
    ["audio", "سماعات", "Audio", PHOTOS.pulseBuds],
    ["watches", "ساعات", "Watches", PHOTOS.watch],
    ["tv", "التلفزيون والبيت", "TV & home", PHOTOS.tvRoom],
    ["power", "الطاقة", "Power", PHOTOS.powerBank],
    ["headphones", "سماعات رأس", "Headphones", PHOTOS.headphones],
    ["speakers", "مكبرات صوت", "Speakers", PHOTOS.speaker],
    ["networking", "راوترات", "Routers", PHOTOS.router],
    ["chargers", "شواحن وكابلات", "Chargers & cables", PHOTOS.chargers],
  ],
  products: [
    ["pulse-buds-pro", "audio", "سماعة Pulse Buds Pro", "Pulse Buds Pro", PHOTOS.pulseBuds, 1090, { compareAtPrice: 1730, isFeatured: true, rating: 4.6, sold90: 140 }],
    ["sport-smartwatch", "watches", "ساعة ذكية سبورت", "Sport Smartwatch", PHOTOS.watch, 890, { compareAtPrice: 1450, sold90: 88 }],
    ["tv-box-4k", "tv", "جهاز بث 4K", "4K TV Box", PHOTOS.tvRoom, 690, { compareAtPrice: 1250, sold90: 41 }],
    ["magnetic-power-bank-10k", "power", "شاحن متنقل مغناطيسي 10K", "Magnetic Power Bank 10K", PHOTOS.powerBank, 1090, { compareAtPrice: 1835, sold90: 22 }],
    ["studio-headphones", "headphones", "سماعة رأس استوديو", "Studio Headphones", PHOTOS.headphones, 590, { compareAtPrice: 990, sold90: 30 }],
    ["air-buds-4", "audio", "سماعة Air Buds 4", "Air Buds 4", PHOTOS.airBuds, 790, { rating: 4.7, sold90: 64 }],
    ["wifi-router", "networking", "راوتر Wi-Fi", "Wi-Fi Router", PHOTOS.router, 1290, { sold90: 36 }],
    ["mini-smart-speaker", "speakers", "مكبر صوت ذكي صغير", "Mini Smart Speaker", PHOTOS.speaker, 990, { inStock: false, sold90: 18 }],
    ["charger-and-cable-kit", "chargers", "شاحن سريع وكابلات", "Fast Charger & Cable Kit", PHOTOS.chargers, 450, { compareAtPrice: 690, sold90: 120 }],
    // Two more for audio, so its carousel fills a row of four (v5).
    ["wireless-over-ear", "audio", "سماعة رأس لاسلكية", "Wireless Over-Ear Headphones", PHOTOS.headphones, 1290, { sold90: 16 }],
    ["home-speaker", "audio", "مكبر صوت منزلي", "Home Speaker", PHOTOS.speaker, 1190, { sold90: 14 }],
  ],
});

export const SHASHA = libraryTemplate({
  key: SHASHA_KEY,
  version: 6,
  changelog: "Shasha v5: an audio carousel (the store's 1st category) on the home",
  productPage: { thumbs: "side", band: "shelf", extras: ["product-perks"], copy: { reviews: L("آراء المستخدمين", "Customer reviews"), related: L("أجهزة تكمّل جهازك", "Pairs well with this") } },
  name: L("شاشة", "Shasha"),
  description: L(
    "متجر إلكترونيات: لافتات متحركة، الأكثر مبيعًا، الضمان، افتح قبل الدفع وتتبع طلبك. أربع صفحات جاهزة.",
    "Electronics megastore: a banner carousel, best sellers, warranty, open before you pay and order tracking. Four ready pages.",
  ),
  category: "electronics",
  style: ["classic"],
  sortOrder: 1020,
  palette: ["#f5f7fa", "#e8ecf2", "#facc15", "#1d4ed8"],
  colors: {
    primary: "#1d4ed8",
    secondary: "#e8ecf2",
    background: "#ffffff",
    foreground: "#0f172a",
    muted: "#5b6576",
    border: "#d8dee8",
    accent: "#facc15",
  },
  fonts: { heading: "Cairo", body: "Cairo" },
  radius: 10,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن شاشة", "About"), seo: { title: L("عن شاشة", "About Shasha") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("راسلنا على shasha@shasha.eg.", "Write to shasha@shasha.eg."),
        heading: L("اسأل عن جهاز أو مواصفاته", "Ask about a device or its specs"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الأجهزة والمواصفات والطلبات.", "Devices, specs and orders."),
        question: L("كيف أعرف مواصفات الجهاز؟", "How do I check a device's specs?"),
        answer: L("تظهر مواصفات كل جهاز وتوافقه في صفحة المنتج.", "Each device's specs and compatibility are shown on its product page."),
      }),
    },
  ],
  demo: DEMO,
});
