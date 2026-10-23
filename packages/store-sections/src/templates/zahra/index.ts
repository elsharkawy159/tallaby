/**
 * Zahra (template 81, everyday gold-plated jewellery; Claude Design
 * "Storefront Templates"): warm ivory paper, an amber gold for actions and a
 * honey highlight, Tajawal throughout and round 20px corners. A light,
 * everyday shop: a waterproof bento hero, shop-by-type rings, a segmented
 * shelf, gifts by budget, give 10% get 10% and a wall of reviews. Built from
 * section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): rings, hoops, bangles,
 * necklaces and sets on dishes, trays, boxes, books and pedestals. No
 * hands, ears, necks or wrists, no people and no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const ZAHRA_KEY = "zahra";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ZAHRA_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  dish: pexels(16664386),
  stackRings: pexels(30541169, 900),
  hoops: pexels(20943477, 900),
  bangles: pexels(38827895, 900),
  promiseRing: pexels(27597577, 900),
  ginkgoSet: pexels(29503018, 900),
  leafSet: pexels(29502436, 900),
  huggies: pexels(12168883, 900),
  coinNecklace: pexels(4889719, 900),
  hoopNecklace: pexels(19783942, 900),
  ringTray: pexels(9590858, 900),
  lilacHoops: pexels(12452943, 900),
  boxHoops: pexels(7882737, 900),
  giftBox: pexels(34399026, 900),
  pedestal: pexels(25283502, 900),
  twoBangles: pexels(32874211, 900),
  plate: pexels(8105129),
};

const NAME = L("زهرة جولز", "Zahra Jewels");

const header = lib("header-pill", {
  text: { "اسم متجرك": NAME, "المتجر": L("وصل جديد", "New in"), "العروض": L("الأكثر مبيعاً", "Best sellers"), "المدونة": L("عننا", "About") },
  links: { "/products": [NEW, BEST], "/blog": "/about" },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("اشتركي في النشرة", "Join the newsletter"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("قطع جديدة وعروض، مرة في الأسبوع.", "New pieces and offers, once a week."),
    "م": L("ز", "Z"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ زهرة جولز. كل الحقوق محفوظة.", "© 2026 Zahra Jewels. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-bento", {
    photo: [PHOTOS.dish],
    text: {
      "وصل جديد": L("ضد المية", "Waterproof"),
      "صوت أنقى، كل يوم": L("دهب عمرك ما تقلعيه", "Gold you never take off"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "طلاء ١٨ قيراط على ستيل. استحمي وعومي ونامي بيه.",
        "18K plating over steel. Shower, swim, sleep in it.",
      ),
      "تسوق الآن": L("تسوقي المجوهرات", "Shop jewellery"),
      "صورة الحملة": L("خاتم وسلسلة دهبي في طبق خزف", "A gold ring and necklace on a ceramic dish"),
      "من ١٢ ألف تقييم": L("من أكتر من ٦٠٠ تقييم", "from 600+ reviews"),
    },
  }),
  lib("categories-stories", {
    photo: [
      PHOTOS.ringTray,
      PHOTOS.lilacHoops,
      PHOTOS.twoBangles,
      PHOTOS.leafSet,
      PHOTOS.hoopNecklace,
      PHOTOS.boxHoops,
      PHOTOS.giftBox,
      PHOTOS.pedestal,
    ],
    text: {
      "الأقسام": L("تسوقي بالنوع", "Shop by type"),
      "وصل حديثًا": L("خواتم", "Rings"),
      "الأكثر مبيعًا": L("حلقان", "Earrings"),
      "العروض": L("غوايش", "Bracelets"),
      "هدايا": L("أطقم", "Sets"),
      "إكسسوارات": L("سلاسل", "Necklaces"),
      "أساسيات": L("هوب", "Hoops"),
      "مجموعات": L("هدايا", "Gifts"),
      "الموسم الجديد": L("أساور", "Bangles"),
    },
    links: {
      "/products": [
        SHOP,
        search("خاتم"),
        search("حلق"),
        search("غويشة"),
        search("طقم"),
        search("سلسلة"),
        search("هوب"),
        search("هدية"),
        search("أسورة"),
      ],
    },
  }),
  lib("products-shelf", {
    text: { "تسوّق حسب مزاجك": L("اختاري", "Pick"), "عليه خصم": L("الأعلى تقييماً", "Top rated") },
    links: { "/products": [NEW, BEST, RATED, SHOP] },
  }),
  lib("finder-price-bands", {
    text: {
      "تسوق حسب ميزانيتك": L("هدايا حسب الميزانية", "Gifts by budget"),
      "أقل من ٦٠٠": L("أقل من ٤٠٠", "Under 400"),
      "٦٠٠ – ١٬٥٠٠": L("٤٠٠ – ٧٠٠", "400 – 700"),
      "أكتر من ١٬٥٠٠": L("أكتر من ٧٠٠", "Over 700"),
      "تسوق الشريحة دي": L("تسوقي الهدايا دي", "Shop these gifts"),
    },
  }),
  lib("popup-reward", {
    name: L("ادّي وخدي", "Refer a friend"),
    text: {
      "جرّب حظك": L("ادّي ١٠٪ وخدي ١٠٪", "Give 10%, get 10%"),
      "المرة دي كسبت، وده كودك.": L("صاحبتك توفر على أول طلب، وانتي على اللي بعده.", "Your friend saves on her first order, you save on your next."),
      "كسبت": L("لصاحبتك", "For your friend"),
      "شحن مجاني": L("خصم ١٠٪", "10% off"),
      "الكود: FREESHIP": L("الكود: WELCOME10", "Code: WELCOME10"),
      "استخدمه دلوقتي": L("تسوقي معاها", "Shop together"),
    },
    links: { "/products": NEW },
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("بيتلبس كل يوم", "Worn every day"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "بعوم بالخواتم من شهرين ولسه بتلمع زي أول يوم.",
        "I’ve swum in the rings for two months and they still shine like day one.",
      ),
      "م": L("م", "M"),
      "مريم أ.": L("مي أ.", "Mai A."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("الحلق خفيف جداً ومش بيعمل حساسية خالص.", "The hoops are very light and cause no irritation at all."),
      "ي": L("ه", "H"),
      "يوسف م.": L("هنا م.", "Hana M."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("بدّلت مقاس الخاتم في يومين من غير أي تعب.", "I swapped my ring size in two days, no hassle."),
      "ع": L("ر", "R"),
      "عمر ك.": L("رنا ك.", "Rana K."),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("وصل أسيوط في ٣ أيام وفي علبة هدية حلوة.", "It reached Assiut in three days, in a lovely gift box."),
      "س": L("ن", "N"),
      "سلمى ر.": L("ندى ر.", "Nada R."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("طقم السهرة شكله غالي أكتر من سعره بكتير.", "The evening set looks far more expensive than it is."),
      "ن": L("ج", "J"),
      "نور ح.": L("جميلة ح.", "Jamila H."),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("ساعدوني أختار هدية لماما على الواتساب.", "They helped me pick a gift for my mum on WhatsApp."),
      "ك": L("ل", "L"),
      "كريم ع.": L("لمياء ع.", "Lamia A."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن زهرة", "About Zahra"), L("دهب مطلي يومي من ورشة صغيرة في المعادي.", "Everyday gold-plated jewellery from a small Maadi studio.")),
  aboutStory(lib, {
    photo: PHOTOS.plate,
    alt: L("مجوهرات دهبي في طبق على قماش ساتان", "Gold jewellery on a plate over satin"),
    eyebrow: L("المعادي", "Maadi"),
    title: L("دهب تلبسيه وانتي بتعيشي", "Gold you live in"),
    text: L("كنا عايزين قطع حلوة ما تتقلعش في الدش ولا البحر، فعملناها: طلاء ١٨ قيراط على ستيل.", "We wanted pretty pieces you never take off for the shower or the sea, so we made them: 18K plating over steel."),
    more: L("وكل طلب بيوصل في علبة هدية ببلاش.", "And every order arrives in a free gift box."),
    button: L("تسوقي المجوهرات", "Shop jewellery"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("قطع مطلية دهب تقدري تستحمي بيها.", "Gold-plated pieces you can wear in the shower."),
  categories: [
    ["rings", "خواتم", "Rings", PHOTOS.ringTray],
    ["earrings", "حلقان", "Earrings", PHOTOS.hoops],
    ["bracelets", "غوايش", "Bracelets", PHOTOS.bangles],
    ["sets", "أطقم", "Sets", PHOTOS.ginkgoSet],
  ],
  products: [
    ["stacking-ring-set", "rings", "طقم خواتم ستاك", "Stacking Ring Set", PHOTOS.stackRings, 578, { isFeatured: true, rating: 4.8, sold90: 160 }],
    ["hoop-earrings", "earrings", "حلق هوب", "Hoop Earrings", PHOTOS.hoops, 347, { sold90: 120 }],
    ["twist-bangle-trio", "bracelets", "تلات غوايش مبرومة", "Twist Bangle Trio", PHOTOS.bangles, 507, { sold90: 88 }],
    ["huggie-earrings", "earrings", "حلق صغير لازق", "Huggie Earrings", PHOTOS.huggies, 299, { sold90: 74 }],
    ["evening-set", "sets", "طقم سهرة", "Evening Set", PHOTOS.ginkgoSet, 1015, { compareAtPrice: 1190, isFeatured: true, sold90: 31 }],
    ["promise-ring", "rings", "خاتم وعد", "Promise Ring", PHOTOS.promiseRing, 420, { compareAtPrice: 490, sold90: 52 }],
    ["leaf-set", "sets", "طقم ورق الشجر", "Leaf Set", PHOTOS.leafSet, 890, { rating: 4.9, sold90: 40 }],
    ["coin-necklace", "sets", "سلسلة بعملة", "Coin Necklace", PHOTOS.coinNecklace, 450, { sold90: 66 }],
    ["fine-chain-necklace", "sets", "سلسلة رفيعة", "Fine Chain Necklace", PHOTOS.hoopNecklace, 390, { inStock: false, sold90: 58 }],
  ],
});

export const ZAHRA = libraryTemplate({
  key: ZAHRA_KEY,
  version: 2,
  changelog: "Zahra v2: product page",
  productPage: { surface: "shelf", thumbs: "bottom", band: "brand", extras: ["product-perks"], copy: { back: L("رجوع للإكسسوارات", "Back to the jewellery"), reviews: L("حائط التقييمات", "The review wall"), related: L("اكمّليها بقطعة", "Pair it with a piece") } },
  name: L("زهرة", "Zahra"),
  description: L(
    "مجوهرات مطلية دهب يومية: هيرو بنتو، أقسام دائرية، هدايا حسب الميزانية، ادّي وخدي وآراء العميلات. أربع صفحات جاهزة.",
    "Everyday gold-plated jewellery: a bento hero, story rings, gifts by budget, refer a friend and reviews. Four ready pages.",
  ),
  category: "jewelry",
  sortOrder: 810,
  palette: ["#fffaf3", "#f8ecd9", "#fbd38d", "#b7791f"],
  colors: {
    primary: "#b7791f",
    secondary: "#f8ecd9",
    background: "#fffaf3",
    foreground: "#2a1d12",
    muted: "#6b5a49",
    border: "#efdcc0",
    accent: "#fbd38d",
  },
  fonts: { heading: "Tajawal", body: "Tajawal" },
  radius: 20,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عننا", "About"), seo: { title: L("عن زهرة", "About Zahra") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصلي معانا", "Contact us"),
        text: L("zahra@zahrajewels.eg، وبنرد كل يوم.", "zahra@zahrajewels.eg, and we reply every day."),
        heading: L("عن مقاس أو هدية", "About a size or a gift"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الطلاء والمقاسات والتوصيل.", "Plating, sizes and delivery."),
        question: L("الطلاء بيروح مع المية؟", "Does the plating wear off in water?"),
        answer: L("لأ. طلاء ١٨ قيراط على ستيل ضد المية، وتقدري تستحمي وتعومي بيه.", "No. The 18K plating over steel is waterproof: shower and swim in it."),
      }),
    },
  ],
  demo: DEMO,
});
