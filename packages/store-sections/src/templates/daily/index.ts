/**
 * Daily (template 14, kitchen and everyday essentials; Claude Design
 * "Storefront Templates"): warm cream paper, a fresh green for actions and
 * an apricot highlight, Baloo Bhaijaan 2 throughout and friendly 16px
 * corners. A practical, offer-led store: the shipping goal, three
 * campaigns, category tiles, a tabbed shelf, the week's offers, promises,
 * reviews and answers. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): jars, spices,
 * utensils, bowls and kitchen shelves. No people, hands or brand labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const DAILY_KEY = "daily";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(DAILY_KEY, getDesign(id)!, { corners: 16, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  jarShelf: pexels(6654122),
  utensilWall: pexels(39557101),
  dishShelf: pexels(6611184),
  greenShelf: pexels(10560073, 900),
  spices: pexels(458796, 900),
  utensilPot: pexels(30798748, 900),
  bowls: pexels(3847438, 900),
  basketJars: pexels(10568352, 900),
  spoons: pexels(7303783, 900),
  spiceRack: pexels(4112617, 900),
  clipJars: pexels(4044070, 900),
  pantry: pexels(7262983, 900),
  bowlsTop: pexels(3847434, 900),
  mugs: pexels(28509629, 900),
  pastel: pexels(6996077, 900),
};

const NAME = L("مطبخنا", "Matbakhna");

const header = lib("header-ruled", {
  text: { "م": L("م", "M"), "اسم متجرك": NAME, "المتجر": L("كل المنتجات", "Shop all"), "العروض": L("الأكثر مبيعاً", "Best sellers") },
  links: { "/products": [SHOP, BEST, undefined, undefined] },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("عروض الأسبوع على إيميلك", "Weekly deals in your inbox"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("إيميل كل سبت فيه عروض الأسبوع ووصفة.", "One email every Saturday with the week’s offers and a recipe."),
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ مطبخنا. كل الحقوق محفوظة.", "© 2026 Matbakhna. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("promo-shipping", {
    text: {
      "اطلب بـ ١٥٠٠ ج.م أو أكتر والتوصيل عليك ببلاش": L("اطلب بـ ٨٠٠ ج.م أو أكتر والتوصيل ببلاش", "Order EGP 800 or more and delivery is free"),
    },
    links: { "/products": BEST },
  }),
  lib("hero-ticket", {
    photo: [PHOTOS.jarShelf, PHOTOS.utensilWall, PHOTOS.dishShelf],
    text: {
      "صورة الحملة": L("برطمانات زجاج على رف مطبخ خشب", "Glass jars on a wooden kitchen shelf"),
      "مجموعة الخريف": L("الأسبوع ده", "This week"),
      "ألوان هادئة لأيام أطول": L("مخزن منظم من ٤٢٠ ج.م", "A tidy pantry from EGP 420"),
      "تسوّق المجموعة": L("تسوق التخزين", "Shop storage"),
      "عروض الأسبوع": L("أدوات خشب جديدة", "New wooden utensils"),
      "هدايا مختارة": L("أطقم تقديم للويك إند", "Serving sets for the weekend"),
    },
    links: { "/products": [SHOP, NEW, BEST] },
  }),
  lib("categories-tiles", {
    photo: [PHOTOS.greenShelf, PHOTOS.spices, PHOTOS.utensilPot, PHOTOS.bowls],
    text: {
      "تسوّق حسب القسم": L("تسوق بالقسم", "Shop by category"),
      "اختر القسم الذي يناسبك من كل ما نقدمه.": L("كل اللي مطبخك محتاجه، مترتب.", "Everything your kitchen needs, sorted."),
      "وصل حديثًا": L("برطمانات تخزين", "Storage jars"),
      "الأكثر مبيعًا": L("بهارات وأرفف", "Spices & racks"),
      "العروض": L("أدوات التحضير", "Prep tools"),
      "هدايا": L("أطباق وتقديم", "Bowls & serving"),
    },
  }),
  lib("products-tabbed", {
    text: { "وصل جديد": L("جديد", "New"), "العروض": L("الأعلى تقييماً", "Top rated") },
    links: { "/products": [NEW, BEST, RATED] },
  }),
  lib("promo-bento", {
    photo: [PHOTOS.basketJars, PHOTOS.spoons, PHOTOS.spiceRack],
    text: {
      "عروض الموسم": L("عروض الأسبوع", "Offers of the week"),
      "٤٠٪": L("٢٠٪", "20%"),
      "تشكيلة الموسم": L("التخزين", "Storage"),
      "٢٥٪": L("١٥٪", "15%"),
      "الأكثر مبيعًا": L("الأدوات", "Utensils"),
      "٣٠٪": L("١٠٪", "10%"),
      "أساسيات": L("البهارات", "Spices"),
    },
    links: { "/products": BEST },
  }),
  lib("features-icon-cards", {
    text: {
      "لماذا تشتري منا": L("ليه تطلب مننا", "Why order from us"),
      "تسوّق وأنت مطمئن": L("سهل وآمن وفي ميعاده", "Simple, safe, on time"),
      "توصيل سريع": L("من ٢ لـ ٤ أيام", "2 to 4 days"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("توصيل لكل المحافظات.", "Delivered to every governorate."),
      "الدفع عند الاستلام": L("ادفع عند الاستلام", "Pay at the door"),
      "أو ادفع بالبطاقة والمحفظة": L("كاش أو كارت لما يوصلك.", "Cash or card when it arrives."),
      "استرجاع سهل": L("استرجاع ١٤ يوم", "14-day returns"),
      "١٤ يومًا لتغيّر رأيك": L("غيّر رأيك ببلاش.", "Change your mind for free."),
      "دعم على واتساب": L("تغليف آمن", "Packed safely"),
      "أشخاص حقيقيون طوال الأسبوع": L("الزجاج بيتشحن في علبتين.", "Glass travels in double boxes."),
    },
  }),
  lib("testimonials-bento", {
    text: {
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "البرطمانات محكمة فعلاً. مطبخي أخيراً شكله منظم والأغطية ما اتشرختش في الغسالة.",
        "The jars really are airtight. My kitchen finally looks organised and the lids did not crack in the dishwasher.",
      ),
      "م": L("ه", "H"),
      "مريم أ.": L("هالة م.", "Hala M."),
      "القاهرة": L("الجيزة", "Giza"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("طلبت الخميس ووصل السبت ودفعت كاش على الباب.", "Ordered on Thursday, arrived Saturday, paid cash at the door."),
      "ع": L("ع", "A"),
      "عمر ك.": L("عمرو ت.", "Amr T."),
      "الإسكندرية": L("القاهرة", "Cairo"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("الألواح حلوة. الصغير أصغر من ما توقعت.", "Lovely boards. The smallest one is smaller than I expected."),
      "ن": L("ر", "R"),
      "نور ح.": L("رانيا ك.", "Rania K."),
      "الجيزة": L("طنطا", "Tanta"),
    },
  }),
  lib("faq-cards", { text: { "قبل أن تطلب": L("قبل ما تطلب", "Before you order") } }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن مطبخنا", "About Matbakhna"), L("محل عائلي في المهندسين بيبيع أدوات المطبخ اللي بنستخدمها في البيت.", "A family shop in Mohandessin selling the kitchen tools we use at home.")),
  lib("about-classic", {
    person: [undefined, undefined, PHOTOS.pantry],
    text: {
      "صورة المتجر": L("رفوف مخزن عليها برطمانات", "Pantry shelves lined with jars"),
      "حكايتنا": L("المهندسين", "Mohandessin"),
      "بدأنا بسؤال واحد: هل سيدوم؟": L("أدوات بنستخدمها في بيتنا", "Tools we use in our own kitchen"),
      "فتحنا متجرنا بعد أن تعبنا من منتجات لا تعيش. كل ما نبيعه نجربه نحن أولًا.": L(
        "كل برطمان ولوح وطبق في المحل اتجرب في مطبخنا الأول.",
        "Every jar, board and bowl in the shop was tried in our own kitchen first.",
      ),
      "اليوم نشحن لكل المحافظات ونرد على كل رسالة بأنفسنا.": L("والدفع عند الاستلام في كل مكان.", "And cash on delivery everywhere."),
      "تعرّف علينا": L("تسوق الأكثر مبيعاً", "Shop best sellers"),
    },
    links: { "/about": BEST },
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أدوات حلوة لطبخ كل يوم.", "Good tools for everyday cooking."),
  categories: [
    ["storage", "برطمانات تخزين", "Storage jars", PHOTOS.greenShelf],
    ["spices", "بهارات وأرفف", "Spices & racks", PHOTOS.spices],
    ["prep", "أدوات التحضير", "Prep tools", PHOTOS.utensilPot],
    ["serve", "أطباق وتقديم", "Bowls & serving", PHOTOS.bowls],
  ],
  products: [
    ["clip-jar-set", "storage", "طقم برطمانات بمشبك", "Clip-Top Jar Set", PHOTOS.clipJars, 650, { compareAtPrice: 780, isFeatured: true, rating: 4.8, sold90: 412 }],
    ["pantry-basket-set", "storage", "طقم برطمانات وسلة", "Pantry Jars & Basket", PHOTOS.basketJars, 420, { rating: 4.7, sold90: 188 }],
    ["labelled-pantry-jars", "storage", "برطمانات مخزن بليبلات", "Labelled Pantry Jars", PHOTOS.pantry, 890, { sold90: 46 }],
    ["spice-jar-rack", "spices", "رف برطمانات بهارات", "Spice Jar Rack", PHOTOS.spiceRack, 540, { rating: 4.7, sold90: 230 }],
    ["glass-spice-jars", "spices", "برطمانات بهارات زجاج", "Glass Spice Jars", PHOTOS.spices, 380, { sold90: 120 }],
    ["wooden-utensil-pot", "prep", "طقم أدوات خشب", "Wooden Utensil Set", PHOTOS.utensilPot, 320, { compareAtPrice: 390, sold90: 98 }],
    ["slotted-spoon-set", "prep", "طقم معالق خشب", "Slotted Spoon Set", PHOTOS.utensilWall, 450, { isFeatured: true, sold90: 150 }],
    ["stoneware-bowl-set", "serve", "طقم أطباق حجري", "Stoneware Bowl Set", PHOTOS.bowlsTop, 980, { sold90: 64 }],
    ["earthy-mug-pair", "serve", "زوج مج فخار", "Earthy Mug Pair", PHOTOS.mugs, 350, { rating: 4.8, sold90: 120 }],
    ["pastel-tableware", "serve", "طقم سفرة باستيل", "Pastel Tableware Set", PHOTOS.pastel, 1150, { inStock: false, sold90: 22 }],
  ],
});

export const DAILY = libraryTemplate({
  key: DAILY_KEY,
  version: 1,
  name: L("ديلي", "Daily"),
  description: L(
    "أدوات المطبخ والبيت: هدف التوصيل المجاني، عروض الأسبوع وأقسام واضحة. أربع صفحات جاهزة.",
    "Kitchen and everyday essentials: a free-delivery goal, weekly offers and clear categories. Four ready pages.",
  ),
  category: "kitchen",
  sortOrder: 140,
  palette: ["#fffaf0", "#ffe2b8", "#2f9e5b", "#1f2a22"],
  colors: {
    primary: "#2f9e5b",
    secondary: "#ffe2b8",
    background: "#fffaf0",
    foreground: "#1f2a22",
    muted: "#56605a",
    border: "#eedfc6",
    accent: "#ffd28a",
  },
  fonts: { heading: "Baloo Bhaijaan 2", body: "Baloo Bhaijaan 2" },
  radius: 16,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عننا", "About"), seo: { title: L("عن مطبخنا", "About Matbakhna") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("١٨ شارع جامعة الدول، المهندسين، الجيزة.", "18 Gameat El Dowal St, Mohandessin, Giza."),
        heading: L("عن طلب أو منتج", "About an order or a product"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والدفع والاسترجاع.", "Delivery, payment and returns."),
        question: L("الزجاج بيوصل سليم؟", "Does glass arrive safely?"),
        answer: L(
          "الزجاج بيتشحن في علبتين ومحمي بالكرتون. ولو حاجة اتكسرت ابعتلنا صورة ونبدّلها.",
          "Glass ships in double boxes with card padding. If anything breaks, send us a photo and we replace it.",
        ),
      }),
    },
  ],
  demo: DEMO,
});
