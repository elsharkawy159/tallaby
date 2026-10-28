/**
 * Tasfya (template 53, fashion outlet; Claude Design "Storefront Templates"):
 * white paper, black ink, a loud red for actions and a yellow highlight,
 * Lalezar headings over Cairo text and 8px corners. An outlet (v3): the
 * shop window, the rails (categories), just dropped, shop by budget, selling
 * fast, open before you pay and shopper reviews. Built from section library
 * designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): clothes on shop rails
 * and wooden hangers, a store window with sale signs, dresses on a wall
 * hook, a clutch and a shoulder bag. No people, no hands, no mannequins and
 * no logos (the design's photos of models were all replaced).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const TASFYA_KEY = "tasfya";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(TASFYA_KEY, getDesign(id)!, { corners: 8, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  polkaDresses: pexels(1943846, 900),
  womenRail: pexels(12048380, 900),
  teeRail: pexels(5698851, 900),
  sweaterRails: pexels(3812433, 900),
  shimmerClutch: pexels(32498616, 900),
  rhinestoneBag: pexels(15432831, 900),
  jacketRail: pexels(18144397, 900),
  blouses: pexels(11435420, 900),
  knitTops: pexels(37420550, 900),
  tanks: pexels(3735633, 900),
  basicsRail: pexels(8743972, 900),
  saleWindow: pexels(33276443),
};

const NAME = L("تصفية أوتلت", "Tasfya Outlet");
const PHONE = L("٠١٠٠ ٢٢٣ ٣٤٤٠", "+20 100 223 3440");

const header = lib("header-search", {
  text: {
    "م": L("ت", "T"),
    "اسم متجرك": NAME,
    "ابحث عن منتج…": L("ابحث عن ماركة أو قطعة…", "Search brands and pieces…"),
    "وصل حديثًا": L("لسه نازل", "Just dropped"),
    "العروض": L("فساتين", "Dresses"),
    "هدايا": L("قمصان وجواكت", "Shirts & jackets"),
    "إكسسوارات": L("شنط", "Bags"),
    "توصيل خلال ٤٨ ساعة": L("قطع حقيقية من محلات حقيقية", "Real pieces from real shops"),
  },
  links: { "/products": [undefined, NEW, BEST, search("فستان"), search("جاكيت"), search("شنطة")] },
});

const footer = lib("footer-help", {
  text: {
    "٠١٠٠ ١٢٣ ٤٥٦٧": PHONE,
    "م": L("ت", "T"),
    "اسم متجرك": NAME,
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ تصفية أوتلت. كل الحقوق محفوظة.", "© 2026 Tasfya Outlet. All rights reserved."),
  },
  links: {
    "https://wa.me/201001234567": "https://wa.me/201002233440",
    "tel:+201001234567": "tel:+201002233440",
    "/products": [undefined, NEW, BEST, RATED],
  },
});

const home: Design[] = [
  lib("hero-fullbleed", {
    photo: [PHOTOS.saleWindow],
    text: {
      "المجموعة الجديدة": L("أوتلت", "Outlet"),
      "صُنعت لتدوم معك": L("قطع حقيقية من محلات حقيقية", "Real pieces from real shops"),
      "خامات مختارة وتفاصيل هادئة، وتوصيل سريع لحد باب البيت.": L("قطع جديدة كل خميس، وتبديل خلال ٧ أيام.", "New pieces every Thursday, and exchanges within 7 days."),
      "تسوّق الآن": L("تسوق الأوتلت", "Shop the outlet"),
      "صورة الواجهة": L("فترينة محل فيها رفوف لبس", "A shop window with clothing rails"),
    },
  }),
  lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": L("لفّ على الرفوف", "Browse the rails") } }),
  lib("products-tabbed", {
    text: {
      "المتجر": L("الأوتلت", "Outlet"),
      "منتجاتنا": L("لسه نازل", "Just dropped"),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [NEW, BEST, RATED] },
  }),
  lib("finder-price-bands", {
    text: {
      "أقل من ٦٠٠": L("أقل من ٥٠٠", "Under 500"),
      "٦٠٠ – ١٬٥٠٠": L("٥٠٠ – ١٬٠٠٠", "500 – 1,000"),
      "أكتر من ١٬٥٠٠": L("أكتر من ١٬٠٠٠", "Over 1,000"),
    },
  }),
  lib("products-carousel", {
    text: { "الأكثر مبيعاً": L("بيخلص بسرعة", "Selling fast") },
    links: { "/products": BEST },
  }),
  lib("pay-open-box", {
    text: {
      "جرّب المنتج قدام المندوب.": L("قيس القطعة وشوفها قدام المندوب.", "Check the piece and try it on in front of the courier."),
      "لو فيه أي مشكلة رجّعه للمندوب ومتدفعش حاجة.": L("لو المقاس مش مظبوط رجّعه للمندوب ومتدفعش حاجة.", "If the size is wrong, hand it back and pay nothing."),
    },
  }),
  lib("testimonials-classic", {
    text: {
      "آراء العملاء": L("اللي اشتروا قالوا", "Shoppers say"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الجاكيت وصل جديد بالتيكت بتاعه، ونفس اللي في الصورة بالظبط.",
        "The jacket arrived new with its tag, exactly like the photo.",
      ),
      "م": L("د", "D"),
      "مريم أ.": L("دينا ف.", "Dina F."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("قست الفستان قدام المندوب وطلع واسع، رجعته من غير ما أدفع.", "Tried the dress at the door, it was loose, and I sent it back without paying."),
      "ع": L("ه", "H"),
      "عمر ك.": L("هشام ط.", "Hesham T."),
      "الإسكندرية": L("الإسكندرية", "Alexandria"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("بلحق كل خميس قبل المقاسات ما تخلص.", "I check every Thursday before the sizes run out."),
      "ن": L("س", "S"),
      "نور ح.": L("سارة م.", "Sara M."),
      "الجيزة": L("الجيزة", "Giza"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن تصفية", "About Tasfya"), L("قطع الموسم اللي فات بأسعار أوتلت.", "Last season’s pieces at outlet prices.")),
  aboutStory(lib, {
    photo: PHOTOS.saleWindow,
    alt: L("فترينة محل فيها رفوف لبس", "A shop window with clothing rails"),
    eyebrow: L("من ٢٠١٩", "Since 2019"),
    title: L("الموسم اللي فات، بنص التمن", "Last season, at half the price"),
    text: L("بنشتري الكميات اللي فضلت عند المحلات آخر الموسم، ونبيعها بأسعار تصفية.", "We buy what shops have left at the end of each season and sell it at clearance prices."),
    more: L("كل قطعة بتتفحص، ولو فيها علامة صغيرة بنكتبها في الوصف.", "Every piece is checked, and any small mark is written in the description."),
    button: L("تسوق الأوتلت", "Shop the outlet"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("قطع الموسم اللي فات بأسعار أوتلت.", "Last season’s pieces at outlet prices."),
  categories: [
    ["women", "حريمي", "Women", PHOTOS.womenRail],
    ["men", "رجالي", "Men", PHOTOS.jacketRail],
    ["bags", "شنط", "Bags", PHOTOS.shimmerClutch],
    ["basics", "أساسيات", "Basics", PHOTOS.sweaterRails],
    ["tops", "توبات وبلوزات", "Tops & blouses", PHOTOS.blouses],
  ],
  products: [
    ["polka-midi-dress", "women", "فستان بولكا ميدي", "Polka Midi Dress", PHOTOS.polkaDresses, 990, { compareAtPrice: 2400, isFeatured: true, rating: 4.6, sold90: 140 }],
    ["corduroy-jacket", "men", "جاكيت قطيفة", "Corduroy Jacket", PHOTOS.jacketRail, 890, { compareAtPrice: 1990, sold90: 88 }],
    ["shimmer-clutch", "bags", "كلاتش لامع", "Shimmer Flap Clutch", PHOTOS.shimmerClutch, 790, { compareAtPrice: 1850, sold90: 52 }],
    ["heavy-tee", "basics", "تيشيرت تقيل", "Heavy Tee", PHOTOS.teeRail, 220, { compareAtPrice: 450, rating: 4.7, sold90: 300 }],
    ["printed-blouse", "tops", "بلوزة مطبوعة", "Printed Blouse", PHOTOS.blouses, 490, { compareAtPrice: 1100, sold90: 64 }],
    ["rib-knit-top", "tops", "توب تريكو مضلّع", "Rib Knit Top", PHOTOS.knitTops, 420, { compareAtPrice: 950, sold90: 24 }],
    ["striped-tank", "basics", "توب حمالات مقلّم", "Striped Tank Top", PHOTOS.tanks, 180, { compareAtPrice: 390, sold90: 70 }],
    ["rhinestone-shoulder-bag", "bags", "شنطة كتف بفصوص", "Rhinestone Shoulder Bag", PHOTOS.rhinestoneBag, 650, { compareAtPrice: 1450, inStock: false, sold90: 12 }],
    ["long-sleeve-basics", "basics", "تيشيرت كم طويل", "Long-Sleeve Tee", PHOTOS.basicsRail, 250, { compareAtPrice: 520, sold90: 46 }],
  ],
});

export const TASFYA = libraryTemplate({
  key: TASFYA_KEY,
  version: 3,
  changelog: "Tasfya v3: categories, best sellers, reviews, section order",
  productPage: { thumbs: "bottom", band: "brand", extras: ["product-perks"], copy: { reviews: L("اللي اشتروا قالوا", "Shoppers say"), related: L("لحّق العروض", "Grab more deals") } },
  name: L("تصفية", "Tasfya"),
  description: L(
    "أوتلت موضة: الرفوف، لسه نازل، تسوق بالميزانية، بيخلص بسرعة، افتح قبل ما تدفع وآراء المشترين. أربع صفحات جاهزة.",
    "Fashion outlet: the rails, just dropped, shop by budget, selling fast, open before you pay and shopper reviews. Four ready pages.",
  ),
  category: "fashion",
  sortOrder: 530,
  palette: ["#ffffff", "#f1f1ee", "#ffe15d", "#d7263d"],
  colors: {
    primary: "#d7263d",
    secondary: "#f1f1ee",
    background: "#ffffff",
    foreground: "#141414",
    muted: "#55554f",
    border: "#e2e2dd",
    accent: "#ffe15d",
  },
  fonts: { heading: "Lalezar", body: "Cairo" },
  radius: 8,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن تصفية", "About"), seo: { title: L("عن تصفية", "About Tasfya") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("كل يوم من ١٢ الضهر لـ ١١ بالليل، على واتساب أو الإيميل.", "Every day, 12 pm to 11 pm, on WhatsApp or by email."),
        heading: L("اسأل عن مقاس أو قطعة", "Ask about a size or a piece"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التبديل والتوصيل والمقاسات.", "Exchanges, delivery and sizes."),
        question: L("ينفع أبدّل قطعة من الأوتلت؟", "Can I exchange an outlet piece?"),
        answer: L("أيوه، خلال ٧ أيام لو بالتيكت بتاعها، ما عدا قطع العينة.", "Yes, within 7 days with its tags on, except sample pieces."),
      }),
    },
  ],
  demo: DEMO,
});
