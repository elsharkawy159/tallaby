/**
 * Saa (template 58, smartwatches; Claude Design "Storefront Templates"):
 * warm off-white paper, near-black ink, a rose red for actions and a lemon
 * highlight, Tajawal throughout and 20px corners. A watch shop: a week on
 * one charge, browse, most worn, why buy from us, installments and messages
 * from WhatsApp. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): smartwatches resting on
 * desks and plain backgrounds, a set of straps, earbuds in their case and a
 * power bank. No wrists, no hands, no people, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const SAA_KEY = "saa";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SAA_KEY, getDesign(id)!, { corners: 20, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  ultra: pexels(11700618, 900),
  watchX: pexels(30707908, 900),
  active: pexels(18662969, 900),
  pinkWatch: pexels(31406910, 900),
  sportWatch: pexels(7947642, 900),
  deskWatch: pexels(7947630),
  straps: pexels(32768001, 900),
  leatherWatch: pexels(16247533),
  airBuds: pexels(17810093, 900),
  miniBuds: pexels(16240420, 900),
  powerBank: pexels(3921705, 900),
};

const NAME = L("ساعة سمارت", "Saa Smart");

const header = lib("header-pill", {
  text: {
    "اسم متجرك": NAME,
    "المتجر": L("الساعات", "Watches"),
    "العروض": L("الأساور", "Straps"),
    "المدونة": L("الأسئلة", "FAQ"),
  },
  links: { "/products": [search("ساعة"), search("أسورة")], "/blog": "/faq" },
});

const footer = lib("footer-signup", {
  text: {
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "اشترك في النشرة": L("اعرف الموديلات الجديدة أولًا", "Hear about new models first"),
    "منتجات جديدة وأخبار المتجر.": L("ساعات وأساور جديدة وأخبار المتجر.", "New watches, straps and store news."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ ساعة سمارت. كل الحقوق محفوظة.", "© 2026 Saa Smart. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-bento", {
    photo: [PHOTOS.deskWatch],
    text: {
      "وصل جديد": L("وصل حديثًا", "New arrivals"),
      "صوت أنقى، كل يوم": L("ساعات ذكية وأساور", "Smartwatches and straps"),
      "منتجات مختارة بمواصفات واضحة لكل يوم.": L("ساعات ذكية وأساور وسماعات بمواصفات واضحة لكل موديل.", "Smartwatches, straps and earbuds with clear specs for every model."),
      "تسوق الآن": L("تسوق الساعات", "Shop watches"),
      "صورة الحملة": L("ساعة ذكية سوداء على مكتب خشبي", "A black smartwatch on a wooden desk"),
      "٤٫٨": L("اتصال Bluetooth", "Bluetooth"),
      "تقييم العملاء": L("اتصال بالهاتف", "Connects to your phone"),
    },
    links: { "/products": search("ساعة") },
  }),
  lib("categories-chips", { text: { "عمّ تبحث؟": L("تصفح", "Browse") } }),
  lib("products-feature", {
    text: { "اختيارنا لك": L("الأكثر طلبًا", "Most popular"), "اختيار الأسبوع": L("الأكثر مبيعاً", "Best seller") },
    lists: [undefined, { source: "best-sellers" }],
  }),
  lib("features-compare", {
    text: {
      "نحن أم غيرنا؟": L("لماذا تتسوق من ساعة سمارت؟", "Why shop at Saa?"),
      "متجرنا": NAME,
      "صور ومواصفات لكل منتج": L("صور ومواصفات لكل موديل", "Photos and specs for every model"),
      "تفاصيل واضحة": L("مقاسات أساور واضحة", "Clear strap sizes"),
      "مقاسات وتفاصيل دقيقة": L("تشكيلة لكل الاستخدامات", "A range for every use"),
      "تواصل سهل لأي سؤال": L("تواصل معنا لأي سؤال", "Contact us with any question"),
    },
  }),
  // v3: a products grid of the newest after the comparison (the pick above shows the best sellers).
  lib("products-grid", {
    text: { "وصل حديثًا": L("وصل حديثًا", "New in") },
    links: { "/products": NEW },
    lists: [{ source: "newest", limit: 8 }],
  }),
  lib("pay-installments", {
    text: {
      "قسّطها": L("قسّط ساعتك", "Pay for your watch in installments"),
      "بدون فوائد ولا مقدّم مع شركات التقسيط.": L("تظهر خطط التقسيط المتاحة عند إتمام الطلب.", "Available installment plans are shown at checkout."),
    },
    lists: [{ source: "featured" }],
  }),
  // v4 (2026-11-25, owner): every home has products by category in a swipe row: the store's 1st category.
  // 2 across: the demo's category holds 2 (one full row, the row rule); a store's own category fills the swipe.
  lib("products-category-carousel", { lists: [{ offset: 0 }, { categoryIndex: 1, limit: 2 }], nodes: { "منتجات القسم": { style: { columns: 2 }, tablet: { columns: 2 } } } }),
  lib("testimonials-chat", {
    text: {
      "من الواتساب": L("من واتساب", "From WhatsApp"),
      "رسائل تسعدنا": L("رسائل من عملائنا", "Messages from our customers"),
      "مريم أ.": L("نادين ف.", "Nadine F."),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الساعة كما في الصور تمامًا، ولون السوار جميل جدًا.",
        "The watch is just like the photos, and the strap colour is lovely.",
      ),
      "هذا يسعدنا جدًا، شكرًا لك!": L("هذا يسعدنا جدًا، شكرًا لك!", "So happy to hear that, thank you!"),
      "عمر ك.": L("طارق ب.", "Tarek B."),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L("الشاشة واضحة والسوار مريح في الاستخدام اليومي.", "The screen is clear and the strap is comfortable for daily use."),
      "يوسف م.": L("دينا ع.", "Dina A."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("المواصفات كانت مكتوبة بوضوح، والساعة كما وصفت تمامًا.", "The specs were clearly listed, and the watch is exactly as described."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن ساعة سمارت", "About Saa Smart"), L("ساعات ذكية وأساور وسماعات وإكسسوارات.", "Smartwatches, straps, earbuds and accessories.")),
  aboutStory(lib, {
    photo: PHOTOS.leatherWatch,
    alt: L("ساعة ذكية بسوار جلد على حاسوب محمول", "A smartwatch with a leather strap on a laptop"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("ساعات ذكية لكل استخدام", "Smartwatches for every use"),
    text: L("نختار ساعات ذكية وأساور وسماعات، ونعرض مواصفات كل موديل بوضوح.", "We choose smartwatches, straps and earbuds, and show every model's specs clearly."),
    more: L("تواصل معنا لأي سؤال عن موديل أو مقاس سوار.", "Contact us with any question about a model or strap size."),
    button: L("تسوق الساعات", "Shop watches"),
    href: search("ساعة"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ساعات ذكية وأساور وسماعات وإكسسوارات.", "Smartwatches, straps, earbuds and accessories."),
  categories: [
    ["watches", "ساعات", "Watches", PHOTOS.ultra],
    ["straps", "أساور", "Straps", PHOTOS.straps],
    ["audio", "سماعات", "Audio", PHOTOS.airBuds],
    ["power", "شحن", "Charging", PHOTOS.powerBank],
    ["sport", "ساعات رياضة", "Sport watches", PHOTOS.sportWatch],
    ["women", "للنساء", "For women", PHOTOS.pinkWatch],
    ["classic", "تصميم كلاسيكي", "Classic design", PHOTOS.leatherWatch],
    ["work", "للعمل والمكتب", "Work & office", PHOTOS.deskWatch],
  ],
  products: [
    ["ultra-3-smartwatch", "watches", "ساعة Ultra 3", "Ultra 3 Smartwatch", PHOTOS.ultra, 1450, { isFeatured: true, rating: 4.7, sold90: 180 }],
    ["watch-x-series", "watches", "ساعة X Series", "Watch X Series", PHOTOS.watchX, 1080, { rating: 4.6, sold90: 96 }],
    ["active-fit-watch", "sport", "ساعة Active Fit", "Active Fit Watch", PHOTOS.active, 890, { compareAtPrice: 990, sold90: 120 }],
    ["watch-se-rose", "women", "ساعة SE وردية", "Watch SE Rose", PHOTOS.pinkWatch, 1250, { sold90: 70 }],
    ["sport-watch-2", "sport", "ساعة Sport 2", "Sport Watch 2", PHOTOS.sportWatch, 990, { sold90: 64 }],
    ["strap-set", "straps", "طقم أساور جلد وستانلس ستيل", "Leather and Steel Strap Set", PHOTOS.straps, 450, { compareAtPrice: 520, sold90: 140 }],
    ["air-buds-4", "audio", "سماعة Air Buds 4", "Air Buds 4", PHOTOS.airBuds, 1390, { sold90: 44 }],
    ["mini-buds", "audio", "سماعة Mini Buds", "Mini Buds", PHOTOS.miniBuds, 790, { inStock: false, sold90: 30 }],
    ["slim-20k-power-bank", "power", "شاحن متنقل Slim 20K", "Slim 20K Power Bank", PHOTOS.powerBank, 1080, { compareAtPrice: 1250, sold90: 60 }],
    ["leather-strap-smartwatch", "classic", "ساعة ذكية بسوار جلد", "Smartwatch with Leather Strap", PHOTOS.leatherWatch, 1650, { sold90: 38 }],
    ["office-smartwatch", "work", "ساعة ذكية للمكتب", "Office Smartwatch", PHOTOS.deskWatch, 1190, { sold90: 46 }],
  ],
});

export const SAA = libraryTemplate({
  key: SAA_KEY,
  // v3 (2026-11-16, owner): every home has at least one real products grid.
  version: 4,
  changelog: "Saa v4: products by category in a swipe row on the home",
  productPage: { surface: "shelf", thumbs: "bottom", band: "paper", extras: ["product-perks"], copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("سيور وإكسسوارات", "Straps and extras") } },
  name: L("ساعة", "Saa"),
  description: L(
    "ساعات ذكية: افتتاحية بالمواصفات، الأكثر طلبًا، لماذا تتسوق منا، التقسيط وآراء العملاء. أربع صفحات جاهزة.",
    "Smartwatches: a specs-led opening, most popular, why shop with us, installments and customer reviews. Four ready pages.",
  ),
  category: "electronics",
  style: ["bold"],
  sortOrder: 580,
  palette: ["#f7f7f5", "#ebebe6", "#fde047", "#e11d48"],
  colors: {
    primary: "#e11d48",
    secondary: "#ebebe6",
    background: "#ffffff",
    foreground: "#18181b",
    muted: "#55555c",
    border: "#dcdcd5",
    accent: "#fde047",
  },
  fonts: { heading: "Tajawal", body: "Tajawal" },
  radius: 20,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن ساعة سمارت", "About"), seo: { title: L("عن ساعة سمارت", "About Saa Smart") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("اسأل عن موديل أو مقاس أسورة.", "Ask about a model or a strap size."),
        heading: L("اسأل عن ساعة", "Ask about a watch"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الموديلات والتقسيط والأساور.", "Models, installments and straps."),
        question: L("هل تعمل الساعة مع أي هاتف؟", "Does the watch work with any phone?"),
        answer: L("تظهر الأنظمة المتوافقة مع كل موديل في صفحة المنتج.", "Each model's compatible systems are shown on its product page."),
      }),
    },
  ],
  demo: DEMO,
});
