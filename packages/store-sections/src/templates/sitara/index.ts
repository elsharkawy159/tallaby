/**
 * Sitara (template 51, modest womenswear; Claude Design "Storefront
 * Templates"): warm blush paper, deep ink, a plum for actions and a peach
 * highlight, El Messiri headings over Tajawal text and soft 14px corners. A
 * modest-wear boutique: new season slides, category rings, most loved, gift
 * cards, ways to pay, customer quotes and the layers and scarves as a
 * carousel (the store's 3rd category). Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): dresses, blouses, coats
 * and knits on rails and hangers, folded scarves, two handbags and gift
 * boxes. No people, no hands, no mannequins and no logos (the design's
 * photos of models were all replaced).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const SITARA_KEY = "sitara";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SITARA_KEY, getDesign(id)!, { corners: 14, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  dressRail: pexels(19733576),
  blouseRail: pexels(9594684),
  giftBag: pexels(7670677),
  boutique: pexels(8386646, 900),
  woodenRack: pexels(1148957, 900),
  roseDresses: pexels(30460549, 900),
  neutralRack: pexels(5706270, 900),
  knitHangers: pexels(5706277, 900),
  scarvesLadder: pexels(11770736, 900),
  scarfStack: pexels(5475167, 900),
  whiteBag: pexels(3808229, 900),
  taupeBag: pexels(35324419, 900),
  giftBoxes: pexels(5872362, 900),
  redDress: pexels(19895956, 900),
  creamCoat: pexels(4641825, 900),
  goldRail: pexels(8387812),
};

const NAME = L("ستارة", "Sitara");

const header = lib("header-centered", {
  text: {
    "اسم متجرك": NAME,
    "مختارات بعناية": L("قصات طويلة وأقمشة ناعمة", "Long cuts, soft fabrics"),
    "المتجر": L("المتجر", "Shop"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("عن ستارة", "About"),
    "تواصل معنا": L("تواصلي معنا", "Contact"),
  },
  links: { "/products": [undefined, BEST, undefined, undefined, BEST], "/blog": "/faq" },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("اعرفي الجديد أولًا", "Hear about new pieces first"),
    "منتجات جديدة وأخبار المتجر.": L("القطع الجديدة وأخبار المتجر في بريدك الإلكتروني.", "New pieces and store news in your inbox."),
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ ستارة. كل الحقوق محفوظة.", "© 2026 Sitara. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن ستارة", "About Sitara"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-ticket", {
    photo: [PHOTOS.dressRail, PHOTOS.blouseRail, PHOTOS.giftBag],
    text: {
      "صورة الحملة": L("فساتين سهرة ويومية على حامل أسود", "Evening and day dresses on a black rail"),
      "مجموعة الخريف": L("الموسم الجديد", "New season"),
      "ألوان هادئة لأيام أطول": L("فساتين وأطقم بقصات طويلة", "Long-cut dresses and sets"),
      "تسوّق المجموعة": L("تسوقي الفساتين", "Shop dresses"),
      "مختارات الأسبوع": L("أطقم تُنسّق بأكثر من طريقة", "Sets to style many ways"),
      "هدايا مختارة": L("اسألي عن مقاس أو طول", "Ask about a size or length"),
    },
    links: { "/products": [search("فستان"), search("طقم"), "/contact"] },
  }),
  lib("categories-stories", {
    photo: [
      PHOTOS.boutique,
      PHOTOS.woodenRack,
      PHOTOS.roseDresses,
      PHOTOS.neutralRack,
      PHOTOS.knitHangers,
      PHOTOS.scarvesLadder,
      PHOTOS.whiteBag,
      PHOTOS.giftBoxes,
    ],
    text: {
      "الأقسام": L("تسوقي بالقسم", "Shop by category"),
      "الكل": L("الكل", "All"),
      "وصل حديثًا": L("وصل حديثاً", "New in"),
      "الأكثر مبيعًا": L("الأكثر مبيعاً", "Best sellers"),
      "العروض": L("فساتين", "Dresses"),
      "هدايا": L("أطقم", "Sets"),
      "إكسسوارات": L("طبقات", "Layers"),
      "أساسيات": L("طرح وشيلان", "Scarves"),
      "مجموعات": L("حقائب", "Bags"),
      "الموسم الجديد": L("تواصلي معنا", "Contact us"),
    },
    links: {
      "/products": [SHOP, NEW, BEST, search("فستان"), search("طقم"), search("كارديجان"), search("طرحة"), search("شنطة"), "/contact"],
    },
  }),
  lib("products-feature", {
    text: { "اختيارنا لك": L("الأكثر طلبًا", "Most loved"), "اختيار الأسبوع": L("الأكثر مبيعاً", "Best seller") },
    lists: [undefined, { source: "best-sellers" }],
  }),
  lib("pay-methods", {
    text: {
      "ادفع بالطريقة التي تناسبك": L("ادفعي بالطريقة التي تناسبك", "Pay the way that suits you"),
      "ادفع للمندوب بعد فتح الطلب.": L("ادفعي للمندوب بعد فتح الطلب.", "Pay the courier after you open the order."),
      "حتى ٢٤ شهرًا بدون مقدّم.": L("قسّطي على ٤ أشهر بدون مقدّم.", "Split it over 4 months, no down payment."),
      "حوّل من هاتفك في ثوانٍ.": L("حوّلي من هاتفك في ثوانٍ.", "Transfer from your phone in seconds."),
    },
  }),
  // v3: the newest pieces as tall cards on a tinted band after the payment methods (the pick above shows the best sellers).
  lib("products-rail", {
    as: "new-in",
    text: { "المفضلة لدى العملاء": L("جديد", "New"), "الأكثر مبيعًا": L("وصل حديثًا", "New in") },
    links: { "/products": NEW },
    lists: [{ source: "newest", limit: 8 }],
  }),
  lib("testimonials-ruled", {
    text: {
      "آراء العملاء": L("الآراء", "Reviews"),
      "قالوا عنا": L("من عميلاتنا", "From our customers"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الفستان الماكسي طويل فعلًا وقماشه غير شفاف، والأكمام طويلة كما أردت.",
        "The maxi dress is truly long and not see-through, with long sleeves as I wanted.",
      ),
      "م": L("ر", "R"),
      "مريم أ.": L("رحمة ع.", "Rahma A."),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L("جدول المقاسات واضح، واخترت مقاس الطقم المناسب بسهولة.", "The size chart is clear, and I picked the right size for the set easily."),
      "ع": L("ه", "H"),
      "عمر ك.": L("هاجر م.", "Hagar M."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("الخامة أفضل مما توقعت، والألوان كما في الصور.", "The fabric is better than I expected, and the colours match the photos."),
      "ن": L("ش", "S"),
      "نور ح.": L("شهد ك.", "Shahd K."),
    },
  }),
  // The store's 3rd category (layers and scarves, in the demo) as a carousel.
  lib("products-category-carousel", { lists: [{ offset: 2 }, { categoryIndex: 3, limit: 4 }] }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن ستارة", "About Sitara"), L("ملابس محتشمة بقصات طويلة وأقمشة ناعمة.", "Modest wear in long cuts and soft fabrics.")),
  aboutStory(lib, {
    photo: PHOTOS.goldRail,
    alt: L("بلوزات وتريكو بألوان هادئة على حامل ذهبي", "Soft-coloured blouses and knits on a gold rail"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("قصات طويلة وتصميم أنيق", "Long cuts, elegant design"),
    text: L("نختار فساتين وأطقمًا طويلة بأكمام، ونكتب الطول والمقاس في صفحة كل قطعة.", "We choose long dresses and sets with sleeves, and list the length and size on every piece's page."),
    more: L("تواصلي معنا لأي سؤال عن مقاس أو طول.", "Contact us with any question about a size or length."),
    button: L("تسوقي الجديد", "Shop new in"),
    href: NEW,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("قصات طويلة وأقمشة ناعمة.", "Long cuts, soft fabrics."),
  categories: [
    ["dresses", "فساتين", "Dresses", PHOTOS.roseDresses],
    ["sets", "أطقم", "Sets", PHOTOS.neutralRack],
    ["layers", "طبقات وطرح", "Layers & scarves", PHOTOS.knitHangers],
    ["bags", "حقائب", "Bags", PHOTOS.whiteBag],
  ],
  products: [
    ["rose-pleated-maxi", "dresses", "فستان ماكسي بليسيه وردي", "Rose Pleated Maxi Dress", PHOTOS.roseDresses, 2400, { isFeatured: true, rating: 4.9, sold90: 140 }],
    ["red-chiffon-dress", "dresses", "فستان شيفون أحمر", "Red Chiffon Dress", PHOTOS.redDress, 2100, { sold90: 46 }],
    ["sage-satin-set", "sets", "طقم ساتان زيتي", "Sage Satin Set", PHOTOS.blouseRail, 3200, { rating: 4.8, sold90: 76 }],
    ["earth-tone-set", "sets", "طقم قميص وبنطلون واسع", "Shirt & Wide Trouser Set", PHOTOS.neutralRack, 2800, { sold90: 38 }],
    ["cream-wool-coat", "layers", "بالطو صوف كريمي", "Cream Wool Coat", PHOTOS.creamCoat, 2600, { compareAtPrice: 2950, sold90: 41 }],
    ["ribbed-cardigan", "layers", "كارديجان تريكو مضلّع", "Ribbed Knit Cardigan", PHOTOS.knitHangers, 1150, { sold90: 33 }],
    ["soft-pashmina", "layers", "شال باشمينا", "Soft Pashmina Scarf", PHOTOS.scarvesLadder, 450, { rating: 4.7, sold90: 90 }],
    ["wool-scarf-trio", "layers", "٣ طرح صوف", "Wool Scarf Trio", PHOTOS.scarfStack, 690, { compareAtPrice: 850, sold90: 52 }],
    ["white-flap-bag", "bags", "حقيبة بيضاء بقفل", "White Flap Bag", PHOTOS.whiteBag, 1850, { rating: 4.8, sold90: 58 }],
    ["taupe-evening-bag", "bags", "حقيبة سهرة بني فاتح", "Taupe Evening Bag", PHOTOS.taupeBag, 1490, { inStock: false, sold90: 20 }],
  ],
});

export const SITARA = libraryTemplate({
  key: SITARA_KEY,
  // v3 (2026-11-16, owner): every home has at least one real products grid.
  // v4 (2026-11-25, owner): every home has products by category and a carousel.
  version: 4,
  changelog: "Sitara v4: a layers carousel (the store's 3rd category) on the home",
  productPage: { surface: "shelf", thumbs: "bottom", band: "paper", extras: ["product-perks"], copy: { reviews: L("آراء عميلاتنا", "What our customers say"), related: L("تنسيقات تكمّلها", "Styles to go with it") } },
  name: L("سِتارة", "Sitara"),
  description: L(
    "ملابس محتشمة للنساء: شرائح الموسم، دوائر الأقسام، الأكثر طلبًا، طرق الدفع وآراء العميلات. أربع صفحات جاهزة.",
    "Modest womenswear: season slides, category rings, most loved, ways to pay and reviews. Four ready pages.",
  ),
  category: "fashion",
  style: ["classic", "warm"],
  sortOrder: 510,
  palette: ["#faf7f4", "#efe7df", "#e9c9b3", "#6d3b47"],
  colors: {
    primary: "#6d3b47",
    secondary: "#efe7df",
    background: "#ffffff",
    foreground: "#2b2320",
    muted: "#6b5f58",
    border: "#e2d7cc",
    accent: "#e9c9b3",
  },
  fonts: { heading: "El Messiri", body: "Tajawal" },
  radius: 14,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن ستارة", "About"), seo: { title: L("عن ستارة", "About Sitara") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصلي معنا", "Contact us") },
      sections: contactPage(lib, {
        title: L("تواصلي معنا", "Contact us"),
        text: L("اسألي عن مقاس أو طول، وسنرد عليك.", "Ask about a size or length, and we will reply."),
        heading: L("عن مقاس أو طول", "About a size or a length"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الأطوال والمقاسات والخامات.", "Lengths, sizes and fabrics."),
        question: L("ما طول الفساتين؟", "How long are the dresses?"),
        answer: L("يظهر طول كل فستان في صفحة المنتج.", "Each dress's length is shown on its product page."),
      }),
    },
  ],
  demo: DEMO,
});
