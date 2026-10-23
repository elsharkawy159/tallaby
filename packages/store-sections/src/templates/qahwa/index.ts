/**
 * Qahwa (template 69, coffee gear at home; Claude Design "Storefront
 * Templates"): warm latte paper, a dark roast brown for actions and a
 * caramel highlight, Lalezar headings over Tajawal text and 12px corners. A
 * home coffee corner: the big word, browse, gifts for coffee people, the
 * morning set, a first-order coupon and regulars' reviews. Built from
 * section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): beans in jars, moka
 * pots, a copper cezve, a gooseneck kettle, a dripper, cups and wooden
 * trays. No people, no hands, no logos or branded bags.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const QAHWA_KEY = "qahwa";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(QAHWA_KEY, getDesign(id)!, { corners: 12, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  whiteMugs: pexels(39024946, 900),
  sidamo: pexels(13427971, 900),
  woodTray: pexels(11212231, 900),
  turkishBlend: pexels(8056641, 900),
  cezve: pexels(20122594, 900),
  moka: pexels(4641439, 900),
  gooseneck: pexels(12100693, 900),
  dripper: pexels(34386686, 900),
  goldCups: pexels(35416825, 900),
  darkRoast: pexels(30349811, 900),
  trayPair: pexels(34231533, 900),
  cupRoses: pexels(32907498, 900),
  beansJar: pexels(7507353, 900),
  mokaShelf: pexels(10880512, 900),
  mokaPair: pexels(14537160),
};

const NAME = L("ركن القهوة", "Qahwa Corner");

const header = lib("header-pill", {
  text: { "اسم متجرك": NAME, "المتجر": L("كل الأدوات", "All gear"), "العروض": L("الأكثر طلباً", "Most ordered"), "المدونة": L("حكايتنا", "Our story") },
  links: { "/products": [SHOP, BEST], "/blog": "/about" },
});

const footer = lib("footer-wordmark", {
  text: {
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ ركن القهوة. كل الحقوق محفوظة.", "© 2026 Qahwa Corner. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("حكايتنا", "Our story"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-big-word", { text: { "جديد": L("قهوة", "COFFEE"), "اطلبها": L("ضيفها للسلة", "Add to cart") } }),
  lib("categories-chips", { text: { "إيه اللي في بالك؟": L("تصفح", "Browse") } }),
  lib("products-panel-rail", {
    text: {
      "هدايا تحت ١٠٠٠ جنيه": L("هدايا لعشاق القهوة", "Gifts for coffee people"),
      "اختيارات مضمونة لأي مناسبة.": L("كوبايات وبن وصواني تحت ٩٠٠ ج.م.", "Mugs, beans and trays under EGP 900."),
    },
    links: { "/products": SHOP },
  }),
  lib("bundle-plus", {
    text: {
      "باقة": L("طقم الصبح", "Morning set"),
      "اشتريهم مع بعض ووفّر": L("كوبايات وبن وصينية", "Mugs, beans and a tray"),
      "سعر الباقة": L("سعر الطقم", "Set price"),
      "١٬٢٧٠ ج.م": L("١٬٦٠٠ ج.م", "EGP 1,600"),
      "بدل ١٬٤٩٠ ج.م": L("بدل ١٬٧٩٠ ج.م", "Instead of EGP 1,790"),
      "وفّر ٢٢٠ ج.م": L("وفّر ١٩٠ ج.م", "Save EGP 190"),
      "اطلب الباقة": L("اطلب الطقم", "Get the set"),
    },
    links: { "/products": NEW },
  }),
  lib("cart-coupon", { text: { "صالح ٤٨ ساعة": L("أول طلب بس", "First order only") } }),
  lib("testimonials-bento", {
    text: {
      "٤٫٨": L("٤٫٩", "4.9"),
      "متوسط ١٢٬٤٠٠ تقييم": L("متوسط ٨٥٠ تقييم", "Average of 850 reviews"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الكنكة النحاس تقيلة ومطروقة باليد، والقهوة بقت بوش من أول مرة.",
        "The copper cezve is heavy and hand-hammered, and the coffee had foam from the first try.",
      ),
      "م": L("ي", "Y"),
      "مريم أ.": L("ياسر ع.", "Yasser A."),
      "القاهرة": L("المعادي", "Maadi"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "البن متحمص الأسبوع ده فعلاً، وعينة القهوة اللي جت مع الطلب حلوة جداً.",
        "The beans really were roasted that week, and the free sample was lovely.",
      ),
      "ع": L("ر", "R"),
      "عمر ك.": L("رنا م.", "Rana M."),
      "الإسكندرية": L("الإسكندرية", "Alexandria"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("الكاتل مظبوط للدريب، والتقسيط سهّل عليّا.", "The kettle pours perfectly for drip, and the instalments helped."),
      "ن": L("ش", "S"),
      "نور ح.": L("شريف ن.", "Sherif N."),
      "الجيزة": L("الشيخ زايد", "Sheikh Zayed"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن ركن القهوة", "About Qahwa Corner"), L("كوبايات وكتل وألواح لفنجان الصبح.", "Mugs, kettles and boards for your morning cup.")),
  aboutStory(lib, {
    photo: PHOTOS.mokaPair,
    alt: L("كنكتين موكا ستانلس على رف", "Two steel moka pots on a shelf"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("فنجان الصبح يستاهل", "Your morning cup deserves it"),
    text: L(
      "بنجمع أدوات قهوة بنستخدمها في البيت: كنك نحاس، موكا، كتل للدريب وكوبايات بتحافظ على السخونية.",
      "We gather the coffee tools we use at home: copper cezves, moka pots, pour-over kettles and mugs that keep the heat.",
    ),
    more: L("ومع كل طلب عينة بن ببلاش، والتقسيط متاح على ٦ شهور.", "Every order comes with a free coffee sample, and you can pay over six months."),
    button: L("تسوق الأدوات", "Shop the gear"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("كوبايات وكتل وألواح لفنجان الصبح.", "Mugs, kettles and boards for your morning cup."),
  categories: [
    ["mugs", "كوبايات وفناجين", "Mugs & cups", PHOTOS.cupRoses],
    ["brewing", "أدوات التحضير", "Brewing", PHOTOS.mokaShelf],
    ["beans", "بن", "Beans", PHOTOS.beansJar],
  ],
  products: [
    ["white-mug-set", "mugs", "٤ مجات بيضا مشغولة", "Set of 4 Sculpted White Mugs", PHOTOS.whiteMugs, 680, { rating: 4.8, sold90: 150 }],
    ["ethiopia-sidamo", "beans", "إثيوبيا سيدامو ٢٥٠ جم", "Ethiopia Sidamo, 250 g", PHOTOS.sidamo, 420, { isFeatured: true, rating: 4.9, sold90: 120 }],
    ["olive-wood-tray", "mugs", "صينية خشب بإيدين", "Wooden Serving Tray", PHOTOS.woodTray, 690, { compareAtPrice: 820, sold90: 44 }],
    ["house-turkish-blend", "beans", "خلطة البيت التركي ٢٥٠ جم", "House Turkish Blend, 250 g", PHOTOS.turkishBlend, 360, { isFeatured: true, sold90: 200 }],
    ["copper-cezve", "brewing", "كنكة نحاس مطروق", "Hammered Copper Cezve", PHOTOS.cezve, 550, { isFeatured: true, rating: 4.9, sold90: 96 }],
    ["moka-pot", "brewing", "موكا ستانلس ٦ فناجين", "Steel Moka Pot, 6 Cups", PHOTOS.moka, 950, { sold90: 70 }],
    ["gooseneck-kettle", "brewing", "كاتل رقبة طويلة بترمومتر", "Gooseneck Kettle with Thermometer", PHOTOS.gooseneck, 1350, { compareAtPrice: 1550, sold90: 38 }],
    ["ceramic-dripper", "brewing", "دريبر سيراميك أسود", "Black Ceramic Dripper", PHOTOS.dripper, 480, { sold90: 52 }],
    ["gold-rim-cups", "mugs", "فناجين بحافة دهب ٦ قطع", "Gold-Rim Cups, Set of 6", PHOTOS.goldCups, 890, { sold90: 29 }],
    ["turkish-cup-tray-set", "mugs", "فنجانين تركي وصينية", "Turkish Cup Pair & Tray", PHOTOS.trayPair, 620, { sold90: 61 }],
    ["brazil-dark-roast", "beans", "برازيل تحميص غامق ٢٥٠ جم", "Brazil Dark Roast, 250 g", PHOTOS.darkRoast, 390, { inStock: false, sold90: 84 }],
  ],
});

export const QAHWA = libraryTemplate({
  key: QAHWA_KEY,
  version: 2,
  changelog: "Qahwa v2: product page",
  productPage: { thumbs: "bottom", band: "brand", copy: { back: L("رجوع للقهوة", "Back to the coffee"), reviews: L("رأي أهل القهوة", "From regulars"), related: L("جنب فنجانك", "Beside your cup") } },
  name: L("قهوة", "Qahwa"),
  description: L(
    "أدوات القهوة في البيت: الكلمة الكبيرة، هدايا لعشاق القهوة، طقم الصبح وكوبون أول طلب. أربع صفحات جاهزة.",
    "Coffee gear at home: the big word, gifts for coffee people, the morning set and a first-order coupon. Four ready pages.",
  ),
  category: "kitchen",
  sortOrder: 690,
  palette: ["#f6f2ec", "#e9e0d4", "#e3a857", "#3b2a20"],
  colors: {
    primary: "#3b2a20",
    secondary: "#e9e0d4",
    background: "#f6f2ec",
    foreground: "#21160f",
    muted: "#66574a",
    border: "#dacfbf",
    accent: "#e3a857",
  },
  fonts: { heading: "Lalezar", body: "Tajawal" },
  radius: 12,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("حكايتنا", "Our story"), seo: { title: L("عن ركن القهوة", "About Qahwa Corner") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("محتار تختار موكا ولا دريب؟ ابعتلنا.", "Not sure between a moka pot and pour-over? Ask us."),
        heading: L("عن أداة أو طلب", "About a tool or an order"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("البن والأدوات والتقسيط.", "Beans, gear and instalments."),
        question: L("البن بيتطحن قبل الشحن؟", "Do you grind the beans before shipping?"),
        answer: L("لو عايز، اكتب في الملاحظات: تركي، موكا أو دريب، وبنطحنه يوم الشحن.", "If you like: write Turkish, moka or drip in the notes and we grind on the day it ships."),
      }),
    },
  ],
  demo: DEMO,
});
