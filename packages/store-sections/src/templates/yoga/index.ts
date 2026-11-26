/**
 * Sukoon (template 91, yoga and pilates; Claude Design "Storefront
 * Templates"): warm linen paper, a sage green for actions and a sand
 * highlight, Almarai throughout and soft 24px corners. A studio and shop in
 * Maadi: a split opening, studio favourites, book a class, class prices,
 * who teaches and reviews from the studio. Built from section library
 * designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): empty studios, rolled
 * mats, cork blocks, a strap, bolsters and blankets, pilates balls and
 * singing bowls. No people, no hands or feet, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const YOGA_KEY = "yoga";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(YOGA_KEY, getDesign(id)!, { corners: 24, ...patch });

const SHOP = "/products";
const BEST = "/products?sort=popularity";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  studio: pexels(37573625),
  studioBright: pexels(39236379),
  blueMat: pexels(16143599, 900),
  blackMats: pexels(4325462, 900),
  yellowMat: pexels(4028197, 900),
  lilacMat: pexels(4793328, 900),
  outdoorMat: pexels(7880203, 900),
  matRack: pexels(7318664, 900),
  corkBlocks: pexels(6752163, 900),
  strap: pexels(35225488, 900),
  bolsters: pexels(8437013, 900),
  blankets: pexels(38470685, 900),
  pilatesBalls: pexels(25596889, 900),
  bowls: pexels(10923829, 900),
};

const NAME = L("سكون ستوديو", "Sukoon Studio");

const header = lib("header-line", {
  text: {
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "المتجر": L("السجادات والأدوات", "Mats & props"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("عن سكون", "About Sukoon"),
  },
  links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("اشترك في النشرة", "Join the newsletter"),
    "منتجات جديدة وأخبار المتجر.": L("اشترك ليصلك جديد المتجر.", "Subscribe for new arrivals from the store."),
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن سكون", "About Sukoon"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ سكون ستوديو. كل الحقوق محفوظة.", "© 2026 Sukoon Studio. All rights reserved."),
  },
  links: { "/products": [undefined, "/products?sort=newest", BEST, "/products?sort=rating"] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.studio],
    text: {
      "مجموعة الموسم": L("أدوات اليوجا والبيلاتس", "Yoga and pilates gear"),
      "صوت أنقى، كل يوم": L("سجادات وأدوات يوجا", "Yoga mats and props"),
      "منتجات مختارة بمواصفات واضحة لكل يوم.": L(
        "سجادات وبلوكات فلين وأحزمة للتمرين.",
        "Mats, cork blocks and straps for your practice.",
      ),
      "تسوق الآن": L("تسوق السجادات", "Shop mats"),
      "العروض": L("تواصل معنا", "Contact us"),
      "صورة الحملة": L("استوديو يوجا خالٍ به سجادات مفرودة", "An empty yoga studio with mats laid out"),
    },
    links: { "/products": [search("مات"), "/contact"] },
  }),
  lib("categories-ruled", { text: { "الأقسام": L("المتجر", "The shop"), "تسوق بالقسم": L("تسوّق حسب القسم", "Shop by category") } }),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("الأكثر طلبًا", "Most popular"),
      "أحدث المنتجات في المتجر.": L("سجادات وأدوات للتمرين اليومي.", "Mats and props for everyday practice."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("team-grid", {
    text: {
      "الفريق": L("المدربون", "Teachers"),
      "الفريق وراء المتجر": L("فريق التدريب", "Our teachers"),
      "م": L("د", "D"),
      "منى عادل": L("داليا", "Dalia"),
      "المؤسسة": L("فينياسا", "Vinyasa"),
      "ك": L("م", "M"),
      "كريم سامي": L("مصطفى", "Mostafa"),
      "المشتريات": L("بيلاتس", "Pilates"),
      "ي": L("إ", "I"),
      "ياسمين فؤاد": L("إنجي", "Ingy"),
      "خدمة العملاء": L("يوجا للحوامل", "Prenatal"),
      "عمر حسن": L("عُلا", "Ola"),
      "التوصيل": L("يوجا هادئة وتأمل", "Restorative and meditation"),
    },
  }),
  // v4 (2026-11-25, owner): every home has products by category in a swipe row: the store's 1st category.
  lib("products-category-carousel", { lists: [{ offset: 0 }, { categoryIndex: 1, limit: 4 }] }),
  lib("service-booking", {
    form: "contact",
    text: {
      "احجز موعد الفني": L("احجز حصة", "Book a class"),
      "تركيب شاشة · حوالي ساعة": L("يوجا للمبتدئين · ٦٠ دقيقة", "Beginner yoga · 60 minutes"),
      "مواعيد الزيارات": L("مواعيد الحصص", "Class times"),
      "١٠ ص": L("٨ ص", "8 am"),
      "١٢ ظهرًا": L("١٠ ص", "10 am"),
      "٢ م": L("١٢ ظهرًا", "12 pm"),
      "٤ م": L("٥ م", "5 pm"),
      "٦ م": L("٦ م", "6 pm"),
      "٨ م": L("٨ م", "8 pm"),
      "من السبت إلى الخميس": L("يوميًا عدا الجمعة", "Every day except Friday"),
      "أو احجز على واتساب": L("أو احجز على واتساب", "Or book on WhatsApp"),
    },
  }),
  lib("testimonials-ruled", {
    text: {
      "آراء العملاء": L("الآراء", "Reviews"),
      "قالوا عنا": L("من عملائنا", "From our customers"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "السجادة ثابتة وسمكها مناسب للتمرين اليومي.",
        "The mat stays put and its thickness suits daily practice.",
      ),
      "مريم أ.": L("مي س.", "Mai S."),
      "القاهرة": L("المعادي", "Maadi"),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L(
        "سجادة الفلين لا تنزلق، وخامتها كما في الوصف.",
        "The cork mat does not slip, and the material is as described.",
      ),
      "عمر ك.": L("عمرو ف.", "Amr F."),
      "الإسكندرية": L("دجلة", "Degla"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("البلوكات خفيفة ومتينة، والسعر مناسب.", "The blocks are light and sturdy, and the price is fair."),
      "نور ح.": L("نهى ع.", "Noha A."),
      "الجيزة": L("زهراء المعادي", "Zahraa El Maadi"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن سكون", "About Sukoon"), L("سجادات وأدوات لليوجا والبيلاتس والتأمل.", "Mats and props for yoga, pilates and meditation.")),
  aboutStory(lib, {
    photo: PHOTOS.studioBright,
    alt: L("استوديو سكون في النهار", "The Sukoon studio by day"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("أدوات لكل تمرين", "Gear for every practice"),
    text: L(
      "نختار سجادات وبلوكات وأحزمة وأدوات استرخاء، ونعرض مقاس وخامة كل منتج بوضوح.",
      "We choose mats, blocks, straps and restore props, and show every product's size and material clearly.",
    ),
    more: L("تواصل معنا لأي سؤال عن منتج أو مقاس.", "Contact us with any question about a product or size."),
    button: L("تسوق السجادات", "Shop mats"),
    href: search("مات"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("سجادات وبلوكات وأدوات يوجا وبيلاتس.", "Mats, blocks and yoga and pilates props."),
  categories: [
    ["mats", "سجادات", "Mats", PHOTOS.blueMat],
    ["props", "بلوكات وأحزمة", "Blocks & straps", PHOTOS.corkBlocks],
    ["rest", "استرخاء", "Restore", PHOTOS.bolsters],
    ["travel", "للسفر", "Travel", PHOTOS.yellowMat],
    ["storage", "تخزين", "Storage", PHOTOS.matRack],
    ["blankets", "بطانيات", "Blankets", PHOTOS.blankets],
    ["pilates", "بيلاتس", "Pilates", PHOTOS.pilatesBalls],
    ["meditation", "تأمل", "Meditation", PHOTOS.bowls],
  ],
  products: [
    ["sage-yoga-mat", "mats", "سجادة يوجا ٦ مم", "Yoga Mat 6 mm", PHOTOS.blueMat, 890, { isFeatured: true, rating: 4.8, sold90: 142 }],
    ["thick-training-mat", "mats", "سجادة تمرين سميكة ١٠ مم", "Thick Training Mat 10 mm", PHOTOS.blackMats, 690, { sold90: 120 }],
    ["travel-mat", "travel", "سجادة خفيفة للسفر", "Light Travel Mat", PHOTOS.yellowMat, 750, { compareAtPrice: 890, sold90: 64 }],
    ["mat-and-bottle", "mats", "سجادة وزجاجة ماء", "Mat and Glass Bottle", PHOTOS.lilacMat, 990, { sold90: 48 }],
    ["garden-mat", "mats", "سجادة للحديقة", "Outdoor Mat", PHOTOS.outdoorMat, 640, { sold90: 30 }],
    ["cork-block-pair", "props", "زوج بلوكات فلين", "Cork Block Pair", PHOTOS.corkBlocks, 420, { isFeatured: true, rating: 4.9, sold90: 210 }],
    ["cotton-strap", "props", "حزام يوجا قطني", "Cotton Yoga Strap", PHOTOS.strap, 180, { sold90: 98 }],
    ["wall-mat-rack", "storage", "حامل سجادات جداري", "Wall Mat Rack", PHOTOS.matRack, 1150, { inStock: false, sold90: 12 }],
    ["round-bolster", "rest", "وسادة يوجا أسطوانية", "Yoga Bolster", PHOTOS.bolsters, 780, { sold90: 44 }],
    ["wool-blanket", "blankets", "بطانية يوجا", "Yoga Blanket", PHOTOS.blankets, 560, { compareAtPrice: 650, sold90: 36 }],
    ["pilates-ball", "pilates", "كرة بيلاتس صغيرة", "Small Pilates Ball", PHOTOS.pilatesBalls, 260, { sold90: 77 }],
    ["singing-bowl-set", "meditation", "طقم أوعية تأمل", "Singing Bowl Set", PHOTOS.bowls, 1450, { rating: 4.7, sold90: 18 }],
  ],
});

export const YOGA = libraryTemplate({
  key: YOGA_KEY,
  version: 5,
  changelog: "Yoga v4: products by category in a swipe row on the home",
  productPage: { surface: "shelf", thumbs: "side", button: "outline", gallery: "end", band: "paper", copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("أدوات أخرى لتمرينك", "More gear for your practice") } },
  name: L("سكون", "Sukoon"),
  description: L(
    "يوجا وبيلاتس: الأكثر طلبًا، المدربون وحجز الحصص. أربع صفحات جاهزة.",
    "Yoga and pilates: most popular, the teachers and class booking. Four ready pages.",
  ),
  category: "sports",
  style: ["minimal", "warm"],
  sortOrder: 910,
  palette: ["#f7f5f1", "#ebe6dd", "#e8d8c3", "#6b8f71"],
  colors: {
    primary: "#6b8f71",
    secondary: "#ebe6dd",
    background: "#ffffff",
    foreground: "#232622",
    muted: "#5d625b",
    border: "#ddd6ca",
    accent: "#e8d8c3",
  },
  fonts: { heading: "Almarai", body: "Almarai" },
  radius: 24,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن سكون", "About"), seo: { title: L("عن سكون ستوديو", "About Sukoon Studio") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("اسأل عن منتج أو مقاس، وسنرد عليك.", "Ask about a product or size, and we will reply."),
        heading: L("اسأل عن سجادة أو أداة", "Ask about a mat or a prop"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("السجادات والأدوات والطلبات.", "Mats, props and orders."),
        question: L("هل يمكن استبدال السجادة؟", "Can I swap my mat?"),
        answer: L("راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.", "See the exchange and return policy page."),
      }),
    },
  ],
  demo: DEMO,
});
