/**
 * Hearth (template 15, cookware and tableware; Claude Design "Storefront
 * Templates"): warm linen paper, a brick red for actions and a honey
 * highlight, Readex Pro throughout and 10px corners. A slow-weekend store:
 * a wide opening photo, how we choose, kitchen favourites, a welcome
 * coupon, why wood and stoneware, and the rating summary. Built from
 * section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): stoneware, boards,
 * utensils, jars and set tables. No people, hands or brand labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const HEARTH_KEY = "hearth";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(HEARTH_KEY, getDesign(id)!, { corners: 10, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  potteryShelf: pexels(11808240),
  utensils: pexels(7303783, 900),
  dinnerSet: pexels(3847451, 900),
  bowlsTop: pexels(3847434, 900),
  board: pexels(9725823, 900),
  utensilWall: pexels(39557101, 900),
  terracottaMugs: pexels(6611421, 900),
  jars: pexels(10560073, 900),
  tableSetting: pexels(5814107, 900),
  dishShelf: pexels(6611184, 900),
};

const NAME = L("هيرث آند كو", "Hearth & Co.");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("كود الترحيب HEARTH15 لخصم ١٥٪ على أول طلب", "Welcome code HEARTH15 for 15% off your first order"),
    "الكود: SAVE10": L("الكود: HEARTH15", "Code: HEARTH15"),
    "م": L("ه", "H"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("تواصل", "Contact"),
    "من نحن": L("عن هيرث", "About"),
  },
  links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/contact" },
});

const footer = lib("footer-ruled", {
  text: {
    "م": L("ه", "H"),
    "اسم متجرك": NAME,
    "منتجات أصلية بضمان، توصلك لحد البيت.": L("أدوات طبخ وتقديم لويك إند هادي.", "Cookware and tableware for slow weekends."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ هيرث آند كو. كل الحقوق محفوظة.", "© 2026 Hearth & Co. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن هيرث", "About Hearth"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("about-wide", {
    photo: [undefined, undefined, undefined, undefined, undefined, undefined, PHOTOS.potteryShelf],
    text: {
      "كل منتج بيتراجع قبل ما يوصلك": L("اطبخ على مهل وظبّط السفرة", "Cook slowly, set the table well"),
      "صورة المتجر": L("أطباق وبولات خزف على رف خشب", "Stoneware plates and bowls on a wooden shelf"),
      "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف، عشان تفتح العلبة وانت مطمن.": L(
        "خشب وحجري وزجاج بيحلوا مع الاستخدام. من ورش مصرية.",
        "Wood, stoneware and glass that get better with use. Made by Egyptian workshops.",
      ),
      "شوف إزاي بنشتغل": L("تسوق المطبخ", "Shop the kitchen"),
    },
    links: { "/about": SHOP },
  }),
  lib("features-checklist", {
    person: [undefined, undefined, undefined, undefined, undefined, PHOTOS.utensils],
    text: {
      "فريق يجهز الطلبات": L("أدوات خشب في حامل", "Wooden utensils in a holder"),
      "كيف نعمل": L("بنختار إزاي", "How we choose"),
      "كل طلب يُراجع مرتين": L("أدوات تعيش عشر سنين", "Tools that last ten years"),
      "قبل أن يخرج من المخزن نراجع المنتج والتغليف والفاتورة.": L(
        "بنستخدم كل قطعة في البيت شهر قبل ما تنزل المحل.",
        "We use every piece at home for a month before it goes on the shop.",
      ),
      "كل منتج يُفحص قبل الشحن": L("خامات طبيعية بس", "Natural materials only"),
      "تغليف محكم ومبطّن": L("تشطيب آمن للأكل", "Food-safe finishes"),
      "فاتورة وضمان داخل العلبة": L("تصليح أو استبدال لمدة سنتين", "Repair or replace for 2 years"),
      "رقم تتبع على واتساب": L("صنع في مصر", "Made in Egypt"),
      "اعرف أكثر": L("حكايتنا", "Our story"),
    },
  }),
  lib("products-feature", {
    text: { "اختيارنا ليك": L("المفضل في المطبخ", "Kitchen favourites"), "اختيار الأسبوع": L("اختيار الشهر", "Pick of the month") },
    lists: [undefined, { source: "best-sellers" }],
  }),
  lib("promo-coupon", {
    text: {
      "٢٠٪": L("١٥٪", "15%"),
      "خصم على أول طلب لك": L("خصم على أول طلب", "Off your first order"),
      "للطلبات فوق ٨٠٠ ج.م · حتى ٣٠ نوفمبر": L("للعملاء الجداد، على كل حاجة.", "For new customers, on everything."),
      "الكود: WELCOME20": L("الكود: HEARTH15", "Code: HEARTH15"),
    },
  }),
  lib("text-columns", {
    text: {
      "عن متجرنا": L("ليه خشب وحجري؟", "Why wood and stoneware?"),
      "بدأنا بهدف واحد: منتجات أصلية بسعر عادل، يختارها أشخاص يستخدمونها فعلًا.": L(
        "الألواح البلاستيك بتتخدش وبتشيل بكتيريا. خشب الزيتون بيقفل على الخدوش ومحتاج زيت مرة في الشهر.",
        "Plastic boards scratch and hold bacteria. Olive wood closes over small cuts and only needs oil once a month.",
      ),
      "اليوم نشحن لكل المحافظات ونجرّب كل منتج قبل أن يصل إليك.": L(
        "الحجري بيحتفظ بالحرارة ويطلع من الفرن للسفرة ومش بيتكسر زي البورسلين الرفيع.",
        "Stoneware holds heat, goes from oven to table and does not chip like thin porcelain.",
      ),
    },
  }),
  lib("testimonials-rating", {
    text: {
      "تقييم عملائنا": L("تقييم العملاء", "Customer rating"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "طقم العشاء تحفة واستحمل سنة استخدام يومي.",
        "The dinner set is beautiful and survived a year of daily use.",
      ),
      "م": L("س", "S"),
      "مريم أ.": L("سارة ن.", "Sara N."),
      "القاهرة": L("المعادي", "Maadi"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("الألواح وصلت متزيّتة وجاهزة.", "The boards arrived oiled and ready."),
      "ع": L("أ", "A"),
      "عمر ك.": L("أحمد ل.", "Ahmed L."),
      "الإسكندرية": L("القاهرة", "Cairo"),
      "كل التقييمات": L("الأكثر مبيعاً", "Shop best sellers"),
    },
    links: { "/products": BEST },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن هيرث", "About Hearth"), L("محل مطبخ في المعادي بيشتغل مع ست ورش مصرية.", "A kitchen shop in Maadi working with six Egyptian workshops.")),
  aboutStory(lib, {
    photo: PHOTOS.dishShelf,
    alt: L("أطباق وبولات على رف", "Bowls and plates on a shelf"),
    eyebrow: L("المعادي", "Maadi"),
    title: L("أدوات بتحلو مع الاستخدام", "Tools that get better with use"),
    text: L("بنختار الخشب والحجري والزجاج من ست ورش مصرية، وبنجرّب كل قطعة في البيت شهر.", "We choose wood, stoneware and glass from six Egyptian workshops and use every piece at home for a month."),
    more: L("وأي قطعة فيها عيب خلال سنتين بنصلّحها أو نبدّلها.", "Any piece with a fault within two years is repaired or replaced."),
    button: L("تسوق المطبخ", "Shop the kitchen"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أدوات طبخ وتقديم لويك إند هادي.", "Cookware and tableware for slow weekends."),
  categories: [
    ["prep", "ألواح وتحضير", "Boards & prep", PHOTOS.board],
    ["table", "أدوات السفرة", "Tableware", PHOTOS.dinnerSet],
    ["store", "تخزين", "Storage", PHOTOS.jars],
  ],
  products: [
    ["stoneware-dinner-set", "table", "طقم عشاء حجري", "Stoneware Dinner Set", PHOTOS.dinnerSet, 1650, { isFeatured: true, rating: 4.9, sold90: 74 }],
    ["olive-wood-board", "prep", "لوح خشب زيتون", "Olive Wood Board", PHOTOS.board, 720, { rating: 4.8, sold90: 160 }],
    ["slotted-utensil-set", "prep", "طقم أدوات خشب", "Wooden Utensil Set", PHOTOS.utensilWall, 320, { sold90: 88 }],
    ["terracotta-mugs", "table", "مجات فخار", "Terracotta Mugs", PHOTOS.terracottaMugs, 350, { compareAtPrice: 420, sold90: 120 }],
    ["stoneware-bowls", "table", "بولات حجري", "Stoneware Bowls", PHOTOS.bowlsTop, 890, { sold90: 66 }],
    ["glass-jar-set", "store", "طقم برطمانات", "Glass Jar Set", PHOTOS.jars, 650, { rating: 4.7, sold90: 300 }],
    ["linen-table-set", "table", "طقم سفرة كتان", "Linen Table Set", PHOTOS.tableSetting, 540, { isFeatured: true, sold90: 40 }],
    ["utensil-holder-set", "prep", "حامل وأدوات خشب", "Utensil Holder Set", PHOTOS.utensils, 460, { inStock: false, sold90: 28 }],
  ],
});

export const HEARTH = libraryTemplate({
  key: HEARTH_KEY,
  version: 1,
  name: L("هيرث", "Hearth"),
  description: L(
    "أدوات طبخ وتقديم: صورة عريضة، إزاي بنختار، كوبون ترحيب وتقييم العملاء. أربع صفحات جاهزة.",
    "Cookware and tableware: a wide opening photo, how we choose, a welcome coupon and ratings. Four ready pages.",
  ),
  category: "kitchen",
  sortOrder: 150,
  palette: ["#f6f1ea", "#ebe2d4", "#e8c27a", "#a3482a"],
  colors: {
    primary: "#a3482a",
    secondary: "#ebe2d4",
    background: "#f6f1ea",
    foreground: "#33261d",
    muted: "#6b5d51",
    border: "#e0d4c3",
    accent: "#e8c27a",
  },
  fonts: { heading: "Readex Pro", body: "Readex Pro" },
  radius: 10,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن هيرث", "About"), seo: { title: L("عن هيرث", "About Hearth") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("١٨ شارع ٩، المعادي، القاهرة.", "18 Road 9, Maadi, Cairo."),
        heading: L("اسألنا عن أي قطعة", "Ask us about any piece"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("العناية والتوصيل والضمان.", "Care, delivery and warranty."),
        question: L("إزاي أعتني بلوح الخشب؟", "How do I care for a wooden board?"),
        answer: L(
          "اغسله بإيدك ونشّفه على طول، وزيّته بمعلقة زيت آمن للأكل مرة في الشهر.",
          "Hand wash and dry it at once, then oil it with a spoon of food-safe oil once a month.",
        ),
      }),
    },
  ],
  demo: DEMO,
});
