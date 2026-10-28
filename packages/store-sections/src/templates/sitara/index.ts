/**
 * Sitara (template 51, modest womenswear; Claude Design "Storefront
 * Templates"): warm blush paper, deep ink, a plum for actions and a peach
 * highlight, El Messiri headings over Tajawal text and soft 14px corners. A
 * modest-wear boutique: new season slides, category rings, most loved, gift
 * cards, ways to pay and customer quotes. Built from section library designs
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
    "مختارات بعناية منذ ٢٠١٨": L("قصات طويلة وأقمشة ناعمة", "Long cuts, soft fabrics"),
    "المتجر": L("المتجر", "Shop"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("عن ستارة", "About"),
    "تواصل معنا": L("تواصلي معانا", "Contact"),
  },
  links: { "/products": [undefined, BEST, undefined, undefined, BEST], "/blog": "/faq" },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("اعرفي الجديد قبل الكل", "Hear about new pieces first"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("إيميل واحد في الأسبوع فيه القطع الجديدة وأكواد للمشتركات.", "One email a week with new pieces and subscriber codes."),
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
      "صورة الحملة": L("فساتين سهرة وكاجوال على راك أسود", "Evening and day dresses on a black rail"),
      "مجموعة الخريف": L("الموسم الجديد", "New season"),
      "ألوان هادئة لأيام أطول": L("طويل وخفيف ومريح", "Long, light, easy"),
      "تسوّق المجموعة": L("تسوقي الفساتين", "Shop dresses"),
      "عروض الأسبوع": L("طقم واحد ولبسات كتير", "One set, many looks"),
      "هدايا مختارة": L("كروت هدية من ٥٠٠ ج.م", "Gift cards from EGP 500"),
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
      "مجموعات": L("شنط", "Bags"),
      "الموسم الجديد": L("كروت هدية", "Gift cards"),
    },
    links: {
      "/products": [SHOP, NEW, BEST, search("فستان"), search("طقم"), search("كارديجان"), search("طرحة"), search("شنطة"), "/contact"],
    },
  }),
  lib("products-feature", {
    text: { "اختيارنا ليك": L("الأكتر حباً", "Most loved"), "اختيار الأسبوع": L("الأكثر مبيعاً", "Best seller") },
    lists: [undefined, { source: "best-sellers" }],
  }),
  lib("pay-methods", {
    text: {
      "ادفع بالطريقة اللي تريحك": L("ادفعي بالطريقة اللي تريحك", "Pay the way that suits you"),
      "ادفع للمندوب بعد ما تفتح الطلب.": L("ادفعي للمندوب بعد ما تفتحي الطلب.", "Pay the courier after you open the order."),
      "لحد ٢٤ شهر من غير مقدم.": L("قسّطي على ٤ شهور من غير مقدم.", "Split it over 4 months, no down payment."),
      "حوّل من موبايلك في ثانية.": L("حوّلي من موبايلك في ثانية.", "Transfer from your phone in seconds."),
    },
  }),
  lib("testimonials-ruled", {
    text: {
      "آراء العملاء": L("الآراء", "Reviews"),
      "قالوا عننا": L("من عميلاتنا", "From our customers"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الفستان الماكسي طويل بجد ومش شفاف، والأكمام لحد الرسغ زي ما كنت عايزة.",
        "The maxi dress is truly long and not see-through, with sleeves to the wrist as I wanted.",
      ),
      "م": L("ر", "R"),
      "مريم أ.": L("رحمة ع.", "Rahma A."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("بدّلت مقاس الطقم ببلاش، وردّوا عليا في دقايق.", "Swapped the set’s size for free and they replied in minutes."),
      "ع": L("ه", "H"),
      "عمر ك.": L("هاجر م.", "Hagar M."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("بعت كارت هدية لأختي ووصلها في نفس اليوم.", "I sent my sister a gift card and she had it the same day."),
      "ن": L("ش", "S"),
      "نور ح.": L("شهد ك.", "Shahd K."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن ستارة", "About Sitara"), L("لبس محتشم بقصات طويلة وأقمشة ناعمة، صنع في القاهرة.", "Modest wear in long cuts and soft fabrics, made in Cairo.")),
  aboutStory(lib, {
    photo: PHOTOS.goldRail,
    alt: L("بلوزات وتريكو بألوان هادية على راك دهبي", "Soft-coloured blouses and knits on a gold rail"),
    eyebrow: L("من ٢٠١٨", "Since 2018"),
    title: L("طويل، ومريح، وشيك", "Long, easy and elegant"),
    text: L("بدأنا عشان نلاقي فساتين وأطقم طويلة بأكمام من غير ما نضطر نفصّل كل حاجة.", "We started to find long dresses and sets with sleeves without having everything made to order."),
    more: L("كل قطعة بتتجرب على ٣ أطوال قبل ما تنزل.", "Every piece is tried at three heights before it goes on sale."),
    button: L("تسوقي الجديد", "Shop new in"),
    href: NEW,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("قصات طويلة وأقمشة ناعمة، صنع في القاهرة.", "Long cuts, soft fabrics, made in Cairo."),
  categories: [
    ["dresses", "فساتين", "Dresses", PHOTOS.roseDresses],
    ["sets", "أطقم", "Sets", PHOTOS.neutralRack],
    ["layers", "طبقات وطرح", "Layers & scarves", PHOTOS.knitHangers],
    ["bags", "شنط", "Bags", PHOTOS.whiteBag],
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
    ["white-flap-bag", "bags", "شنطة بيضا بقفل", "White Flap Bag", PHOTOS.whiteBag, 1850, { rating: 4.8, sold90: 58 }],
    ["taupe-evening-bag", "bags", "شنطة سهرة بني فاتح", "Taupe Evening Bag", PHOTOS.taupeBag, 1490, { inStock: false, sold90: 20 }],
  ],
});

export const SITARA = libraryTemplate({
  key: SITARA_KEY,
  version: 2,
  changelog: "Sitara v2: product page",
  productPage: { surface: "shelf", thumbs: "bottom", band: "paper", extras: ["product-perks"], copy: { reviews: L("رأي صاحباتنا", "What our customers say"), related: L("تنسيقات تكمّلها", "Styles to go with it") } },
  name: L("سِتارة", "Sitara"),
  description: L(
    "لبس محتشم للستات: سلايدات الموسم، دواير الأقسام، الأكتر حباً، كروت هدية، طرق الدفع وآراء العميلات. أربع صفحات جاهزة.",
    "Modest womenswear: season slides, category rings, most loved, gift cards, ways to pay and reviews. Four ready pages.",
  ),
  category: "fashion",
  sortOrder: 510,
  palette: ["#faf7f4", "#efe7df", "#e9c9b3", "#6d3b47"],
  colors: {
    primary: "#6d3b47",
    secondary: "#efe7df",
    background: "#faf7f4",
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
      seo: { title: L("تواصلي معانا", "Contact us") },
      sections: contactPage(lib, {
        title: L("تواصلي معانا", "Contact us"),
        text: L("كل يوم من ١٢ الضهر لـ ١٠ بالليل. ولطلب كارت هدية ابعتيلنا هنا.", "Every day, 12 pm to 10 pm. To order a gift card, write to us here."),
        heading: L("عن مقاس أو طول أو كارت هدية", "About a size, a length or a gift card"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الأطوال والمقاسات والتقسيط.", "Lengths, sizes and installments."),
        question: L("الفساتين طولها قد إيه؟", "How long are the dresses?"),
        answer: L("الماكسي ١٤٥ سم من الكتف، ومكتوب الطول في صفحة كل منتج. ولو محتاجة تقصير بنعمله ببلاش.", "Maxi dresses are 145 cm from the shoulder; each product page lists the length. We shorten for free if needed."),
      }),
    },
  ],
  demo: DEMO,
});
