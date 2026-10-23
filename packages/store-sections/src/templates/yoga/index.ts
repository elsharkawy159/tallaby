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
    "المتجر": L("المات والأدوات", "Mats & props"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("الستوديو", "The studio"),
  },
  links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("جدول الأسبوع في إيميلك", "This week’s timetable by email"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("مواعيد الكلاسات الجديدة وعروض المات، كل أحد.", "New class times and mat offers, every Sunday."),
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن الستوديو", "About the studio"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ سكون ستوديو. كل الحقوق محفوظة.", "© 2026 Sukoon Studio. All rights reserved."),
  },
  links: { "/products": [undefined, "/products?sort=newest", BEST, "/products?sort=rating"] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.studio],
    text: {
      "كوليكشن الموسم": L("ستوديو ومحل", "Studio and shop"),
      "صوت أنقى، كل يوم": L("افرش المات وخد نفس", "Roll out, breathe in"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "مات وبلوكات فلين وأحزمة بنستخدمها في ستوديو المعادي، وكلاس تجريبي ببلاش مع أي مات.",
        "Mats, cork blocks and straps we use in our Maadi studio, with a free trial class with every mat.",
      ),
      "تسوق الآن": L("تسوق المات", "Shop mats"),
      "العروض": L("احجز كلاس", "Book a class"),
      "صورة الحملة": L("ستوديو يوجا فاضي فيه مات مفرودة", "An empty yoga studio with mats laid out"),
    },
    links: { "/products": [search("مات"), "/contact"] },
  }),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("المفضل في الستوديو", "Studio favourites"),
      "أحدث المنتجات اللي نزلت المتجر.": L("اللي بنستخدمه كل يوم في الكلاسات.", "What we use in class every day."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("service-booking", {
    form: "contact",
    text: {
      "احجز معاد الفني": L("احجز كلاس", "Book a class"),
      "تركيب شاشة · حوالي ساعة": L("يوجا مبتدئين، المعادي · ٦٠ دقيقة", "Beginner yoga, Maadi · 60 minutes"),
      "مواعيد الزيارات": L("مواعيد الكلاسات", "Class times"),
      "١٠ ص": L("٨ ص", "8 am"),
      "١٢ الضهر": L("١٠ ص", "10 am"),
      "٢ م": L("١٢ الضهر", "12 pm"),
      "٤ م": L("٥ م", "5 pm"),
      "٦ م": L("٦ م", "6 pm"),
      "٨ م": L("٨ م", "8 pm"),
      "من السبت للخميس": L("كل يوم ما عدا الجمعة", "Every day except Friday"),
      "أو احجز على واتساب": L("أو احجز على واتساب", "Or book on WhatsApp"),
    },
  }),
  lib("service-price-menu", {
    text: {
      "أسعار الخدمات": L("أسعار الكلاسات", "Class prices"),
      "الأسعار شاملة قطع الغيار الأصلية والضمان.": L("المات والبلوكات موجودة في الستوديو، هات مية بس.", "Mats and blocks are in the studio; just bring water."),
      "الموبايل": L("كلاس واحد", "Drop-in"),
      "تغيير بطارية": L("يوجا", "Yoga"),
      "٦٥٠ ج.م": L("٢٥٠ ج.م", "EGP 250"),
      "تغيير شاشة": L("بيلاتس مات", "Pilates mat"),
      "٢٤٠٠ ج.م": L("٢٨٠ ج.م", "EGP 280"),
      "سوكت الشحن": L("يوجا للحوامل", "Prenatal yoga"),
      "٤٥٠ ج.م": L("٣٠٠ ج.م", "EGP 300"),
      "الشاشات والبيت": L("باكدجات", "Packs"),
      "تركيب حائط": L("٥ كلاسات", "5 classes"),
      "٣٥٠ ج.م": L("١١٠٠ ج.م", "EGP 1,100"),
      "ضبط رسيفر": L("١٠ كلاسات", "10 classes"),
      "١٥٠ ج.م": L("٢٠٠٠ ج.م", "EGP 2,000"),
      "السماعات": L("خاص", "Private"),
      "تغيير وسايد": L("كلاس خاص في الستوديو", "Private class at the studio"),
      "١٢٠ ج.م": L("٧٠٠ ج.م", "EGP 700"),
      "تنظيف وفحص": L("كلاس خاص في البيت", "Private class at home"),
      "٨٠ ج.م": L("٩٥٠ ج.م", "EGP 950"),
    },
  }),
  lib("team-grid", {
    text: {
      "الفريق": L("المدربين", "Teachers"),
      "الناس اللي ورا المحل": L("مين بيدرّب", "Who teaches"),
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
      "التوصيل": L("يوجا هادية وتأمل", "Restorative and meditation"),
    },
  }),
  lib("testimonials-ruled", {
    text: {
      "آراء العملاء": L("الآراء", "Reviews"),
      "قالوا عننا": L("من الستوديو", "From the studio"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "أول مرة أعمل يوجا، وداليا خلتني مرتاحة من أول كلاس.",
        "My first time doing yoga, and Dalia made me comfortable from the first class.",
      ),
      "مريم أ.": L("مي س.", "Mai S."),
      "القاهرة": L("المعادي", "Maadi"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "المات الفلين مش بيزحلق حتى مع العرق، وخدت معاه كلاس تجريبي ببلاش.",
        "The cork mat does not slip even when I sweat, and it came with a free trial class.",
      ),
      "عمر ك.": L("عمرو ف.", "Amr F."),
      "الإسكندرية": L("دجلة", "Degla"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("باكدج العشر كلاسات وفّرت عليا كتير.", "The 10-class pack saved me a lot."),
      "نور ح.": L("نهى ع.", "Noha A."),
      "الجيزة": L("زهراء المعادي", "Zahraa El Maadi"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن سكون", "About Sukoon"), L("ستوديو يوجا وبيلاتس ومحل صغير في المعادي.", "A yoga and pilates studio with a small shop in Maadi.")),
  aboutStory(lib, {
    photo: PHOTOS.studioBright,
    alt: L("ستوديو سكون بالنهار", "The Sukoon studio by day"),
    eyebrow: L("المعادي", "Maadi"),
    title: L("ستوديو الأول، ومحل بعدين", "A studio first, a shop second"),
    text: L(
      "فتحنا الستوديو عشان نلاقي مكان هادي نتمرن فيه، وبعدين بدأنا نبيع المات والبلوكات اللي بنستخدمها.",
      "We opened the studio to have a quiet place to practise, then started selling the mats and blocks we use.",
    ),
    more: L("كل منتج في المحل اتجرّب في كلاساتنا الأول.", "Every product in the shop is tried in our classes first."),
    button: L("تسوق المات", "Shop mats"),
    href: search("مات"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("مات وبلوكات وكلاسات لأسبوع أهدى.", "Mats, blocks and classes for a calmer week."),
  categories: [
    ["mats", "مات", "Mats", PHOTOS.blueMat],
    ["props", "بلوكات وأحزمة", "Blocks & straps", PHOTOS.corkBlocks],
    ["rest", "استرخاء", "Restore", PHOTOS.bolsters],
  ],
  products: [
    ["sage-yoga-mat", "mats", "مات يوجا ٦ مم", "Yoga Mat 6 mm", PHOTOS.blueMat, 890, { isFeatured: true, rating: 4.8, sold90: 142 }],
    ["thick-training-mat", "mats", "مات تمرين سميك ١٠ مم", "Thick Training Mat 10 mm", PHOTOS.blackMats, 690, { sold90: 120 }],
    ["travel-mat", "mats", "مات خفيف للسفر", "Light Travel Mat", PHOTOS.yellowMat, 750, { compareAtPrice: 890, sold90: 64 }],
    ["mat-and-bottle", "mats", "مات وزجاجة مية", "Mat and Glass Bottle", PHOTOS.lilacMat, 990, { sold90: 48 }],
    ["garden-mat", "mats", "مات للجنينة", "Outdoor Mat", PHOTOS.outdoorMat, 640, { sold90: 30 }],
    ["cork-block-pair", "props", "جوز بلوك فلين", "Cork Block Pair", PHOTOS.corkBlocks, 420, { isFeatured: true, rating: 4.9, sold90: 210 }],
    ["cotton-strap", "props", "حزام يوجا قطن", "Cotton Yoga Strap", PHOTOS.strap, 180, { sold90: 98 }],
    ["wall-mat-rack", "props", "حامل مات للحيطة", "Wall Mat Rack", PHOTOS.matRack, 1150, { inStock: false, sold90: 12 }],
    ["round-bolster", "rest", "بولستر يوجا", "Yoga Bolster", PHOTOS.bolsters, 780, { sold90: 44 }],
    ["wool-blanket", "rest", "بطانية يوجا", "Yoga Blanket", PHOTOS.blankets, 560, { compareAtPrice: 650, sold90: 36 }],
    ["pilates-ball", "rest", "كورة بيلاتس صغيرة", "Small Pilates Ball", PHOTOS.pilatesBalls, 260, { sold90: 77 }],
    ["singing-bowl-set", "rest", "طقم أوعية تأمل", "Singing Bowl Set", PHOTOS.bowls, 1450, { rating: 4.7, sold90: 18 }],
  ],
});

export const YOGA = libraryTemplate({
  key: YOGA_KEY,
  version: 2,
  changelog: "Sukoon v2: product page",
  productPage: { surface: "shelf", thumbs: "side", button: "outline", gallery: "end", band: "paper", copy: { back: L("رجوع للاستوديو", "Back to the studio"), reviews: L("رأي رواد الاستوديو", "From the studio"), related: L("كمّل تمرينك بأدوات تانية", "More gear for your practice") } },
  name: L("سكون", "Sukoon"),
  description: L(
    "يوجا وبيلاتس: المفضل في الستوديو، احجز كلاس، أسعار الكلاسات والمدربين. أربع صفحات جاهزة.",
    "Yoga and pilates: studio favourites, book a class, class prices and the teachers. Four ready pages.",
  ),
  category: "sports",
  sortOrder: 910,
  palette: ["#f7f5f1", "#ebe6dd", "#e8d8c3", "#6b8f71"],
  colors: {
    primary: "#6b8f71",
    secondary: "#ebe6dd",
    background: "#f7f5f1",
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
        text: L("شارع ٩، المعادي. كل يوم ما عدا الجمعة.", "Road 9, Maadi. Every day except Friday."),
        heading: L("اسأل عن كلاس أو مات", "Ask about a class or a mat"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الكلاسات والمات والتوصيل.", "Classes, mats and delivery."),
        question: L("ينفع أبدّل المات؟", "Can I swap my mat?"),
        answer: L("أيوه، خلال ١٤ يوم لو المات جديد في تغليفه.", "Yes, within 14 days if the mat is new in its wrapping."),
      }),
    },
  ],
  demo: DEMO,
});
