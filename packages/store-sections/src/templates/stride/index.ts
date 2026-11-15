/**
 * Stride (template 33, running and recovery; Claude Design "Storefront
 * Templates"): cool mint paper, a deep petrol for actions and a lime
 * highlight, Alexandria throughout and round 20px corners. A runners' shop:
 * an offer ticker, ticket slides, aisles, the shelf, what comes with every
 * order, twin offers and WhatsApp reviews. Built from section library
 * designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): trainers and a bottle
 * on grass, mats, bands, ropes, a watch and earbuds. No people and no
 * brand marks.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const STRIDE_KEY = "stride";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(STRIDE_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  trainers: pexels(7880188),
  trainersSmall: pexels(7880188, 900),
  colourMats: pexels(40074772, 900),
  rolledMats: pexels(4325439, 900),
  buds: pexels(8858287, 900),
  watch: pexels(13007642, 900),
  rope: pexels(8032842, 900),
  ropes: pexels(6339719, 900),
  ropesWide: pexels(6339721),
  matDumbbells: pexels(5412251, 900),
  bands: pexels(16695681, 900),
  powerBank: pexels(3921704, 900),
};

const NAME = L("خطوة", "Khatwa");

const header = lib("header-announcement", {
  text: {
    "تشكيلة الموسم الجديد وصلت": L("أحذية وأدوات للجري والتمرين", "Running and training gear"),
    "الدفع عند الاستلام": L("تفاصيل ومقاسات واضحة لكل منتج", "Clear details and sizes for every product"),
    "م": L("خ", "K"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
  },
  links: { "/products": [SHOP, BEST, SHOP, SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("جديد أدوات الجري", "New running gear"),
    "منتجات جديدة وأخبار المتجر.": L("منتجات جديدة وأخبار المتجر.", "New products and store news."),
    "م": L("خ", "K"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ خطوة. كل الحقوق محفوظة.", "© 2026 Khatwa. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-ticket", {
    photo: [PHOTOS.trainers, PHOTOS.colourMats, PHOTOS.buds],
    text: {
      "صورة الحملة": L("حذاء جري وزجاجة ماء على العشب", "Running shoes and a bottle on grass"),
      "مجموعة الخريف": L("موسم الجري", "Running season"),
      "ألوان هادئة لأيام أطول": L("أحذية وأدوات الجري", "Running shoes and gear"),
      "تسوّق المجموعة": L("تسوق الجري", "Shop running"),
      "مختارات الأسبوع": L("سجادات واستشفاء", "Recovery & mats"),
      "هدايا مختارة": L("سماعات وساعات", "Audio & watches"),
    },
    links: { "/products": [search("جري"), search("مات"), search("سماعة")] },
  }),
  lib("categories-bento", {
    photo: [PHOTOS.trainersSmall, PHOTOS.colourMats, PHOTOS.watch, PHOTOS.buds, PHOTOS.rope],
    text: {
      "أقسامنا": L("تسوق حسب التمرين", "Shop by session"),
      "الأكثر مبيعًا": L("الجري", "Running"),
      "الأكثر طلبًا": L("الأكثر طلباً", "Most wanted"),
      "العروض": L("يوجا واستشفاء", "Yoga & recovery"),
      "هدايا": L("ساعات", "Watches"),
      "إكسسوارات": L("سماعات", "Audio"),
      "أساسيات": L("أساسيات", "Essentials"),
    },
    links: { "/products": [SHOP, search("جري"), search("مات"), search("ساعة"), search("سماعة"), search("حبل")] },
  }),
  lib("products-shelf", {
    text: { "تسوّق حسب اختيارك": L("الرف", "The shelf"), "وصل جديد": L("جديد", "New"), "عليه خصم": L("الأعلى تقييماً", "Top rated") },
    links: { "/products": [NEW, BEST, RATED, SHOP] },
  }),
  lib("about-list", {
    photo: [undefined, undefined, undefined, undefined, undefined, PHOTOS.ropes],
    text: {
      "صورة المتجر": L("حبال ودمبل على أرضية صالة التمارين", "Ropes and dumbbells on a gym floor"),
      "مع كل منتج": L("مع كل منتج", "With every product"),
      "تفاصيل واضحة لكل منتج": L("مواصفات واضحة لكل حذاء وأداة", "Clear specs for every shoe and tool"),
      "صور ومواصفات لكل منتج": L("جدول مقاسات لكل حذاء", "A size chart for every shoe"),
      "تفاصيل ومقاسات واضحة": L("تشكيلة للجري والتمرين", "A range for running and training"),
      "تواصل معنا لأي سؤال": L("تواصل معنا لأي سؤال", "Contact us with any question"),
      "اعرف أكثر": L("اعرف أكثر", "Learn more"),
    },
  }),
  lib("testimonials-chat", {
    text: {
      "رسائل تسعدنا": L("رسائل من العدّائين", "Notes from runners"),
      "مريم أ.": L("نادين ف.", "Nadine F."),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "حذاء الجري خفيف ومريح في المسافات الطويلة.",
        "Light and comfortable over long distances.",
      ),
      "هذا يسعدنا جدًا، شكرًا لك!": L("يسعدنا ذلك، شكرًا لك!", "So glad to hear it, thank you!"),
      "عمر ك.": L("يوسف ط.", "Youssef T."),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L("جدول المقاسات دقيق، والمقاس كان مناسبًا.", "The size chart is accurate, and the size was right."),
      "يوسف م.": L("هبة س.", "Heba S."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("السجادة ثقيلة وثابتة، والزجاجة تحافظ على برودة الماء.", "The mat is heavy and stays put, and the bottle keeps water cold."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن خطوة", "About Khatwa"), L("أحذية وأدوات للجري والتمرين والاستشفاء.", "Shoes and gear for running, training and recovery.")),
  aboutStory(lib, {
    photo: PHOTOS.ropesWide,
    alt: L("حبال تمرين ودمبل", "Training ropes and dumbbells"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("أدوات لكل تمرين", "Gear for every session"),
    text: L("نختار أحذية الجري وأدوات التمرين والاستشفاء، ونعرض مقاسات ومواصفات كل منتج بوضوح.", "We choose running shoes and training and recovery gear, and show every product's sizes and specs clearly."),
    more: L("تواصل معنا لأي سؤال عن مقاس أو منتج.", "Contact us with any question about a size or a product."),
    button: L("تسوق الجري", "Shop running"),
    href: search("جري"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أدوات جري وريكفري لكل خطوة.", "Running and recovery gear for every step."),
  categories: [
    ["running", "الجري", "Running", PHOTOS.trainersSmall],
    ["recovery", "يوجا واستشفاء", "Yoga & recovery", PHOTOS.colourMats],
    ["tech", "ساعات وسماعات", "Watches & audio", PHOTOS.watch],
  ],
  products: [
    ["daily-trainer", "running", "حذاء جري يومي", "Daily Run Trainer", PHOTOS.trainersSmall, 2350, { isFeatured: true, rating: 4.8, sold90: 260 }],
    ["run-kit-bottle", "running", "زجاجة جري معزولة", "Insulated Run Bottle", PHOTOS.rope, 390, { sold90: 140 }],
    ["speed-rope", "running", "حبل قفز سريع", "Speed Jump Rope", PHOTOS.ropes, 280, { compareAtPrice: 340, sold90: 96 }],
    ["colour-yoga-mat", "recovery", "سجادة يوجا ملوّنة", "Colour Yoga Mat", PHOTOS.colourMats, 650, { rating: 4.7, sold90: 188 }],
    ["thick-recovery-mat", "recovery", "سجادة تمارين سميكة", "Thick Recovery Mat", PHOTOS.rolledMats, 790, { sold90: 70 }],
    ["band-trio", "recovery", "طقم ٣ حبال مقاومة", "Resistance Band Trio", PHOTOS.bands, 450, { isFeatured: true, sold90: 152 }],
    ["mat-and-weights", "recovery", "سجادة ودمبل خفيف", "Mat & Light Weights", PHOTOS.matDumbbells, 1150, { compareAtPrice: 1350, sold90: 48 }],
    ["gps-run-watch", "tech", "ساعة جري GPS", "GPS Run Watch", PHOTOS.watch, 3450, { rating: 4.6, sold90: 64 }],
    ["sport-buds", "tech", "سماعة رياضية لاسلكية", "Wireless Sport Buds", PHOTOS.buds, 1290, { sold90: 110 }],
    ["pocket-power-bank", "tech", "شاحن متنقل صغير", "Pocket Power Bank", PHOTOS.powerBank, 690, { inStock: false, sold90: 35 }],
  ],
});

export const STRIDE = libraryTemplate({
  key: STRIDE_KEY,
  version: 3,
  changelog: "Stride v3: product page",
  name: L("سترايد", "Stride"),
  description: L(
    "جري واستشفاء: شرائح تذاكر، أقسام بنتو ورسائل العملاء. أربع صفحات جاهزة.",
    "Running and recovery: ticket slides, bento aisles and customer messages. Four ready pages.",
  ),
  category: "sports",
  style: ["bold"],
  sortOrder: 330,
  palette: ["#f6f8f6", "#e3ece8", "#c8f26b", "#14303b"],
  colors: {
    primary: "#14303b",
    secondary: "#e3ece8",
    background: "#ffffff",
    foreground: "#14303b",
    muted: "#4f656d",
    border: "#d6e1dc",
    accent: "#c8f26b",
  },
  fonts: { heading: "Alexandria", body: "Alexandria" },
  radius: 20,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن خطوة", "About"), seo: { title: L("عن خطوة", "About Khatwa") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("اسأل عن مقاس أو منتج، وسنرد عليك.", "Ask about a size or a product, and we will reply."),
        heading: L("اسأل عن مقاس أو منتج", "Ask about a size or a product"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والاستبدال والتوصيل.", "Sizes, swaps and delivery."),
        question: L("ماذا لو لم يكن المقاس مناسبًا؟", "What if the size is wrong?"),
        answer: L("راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.", "See the exchange and return policy page."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "card", thumbs: "bottom", band: "brand", extras: ["product-shipping"], copy: { reviews: L("آراء العدّائين", "Runners' reviews"), related: L("منتجات لتمرينك القادم", "Gear for your next run") } },
});
