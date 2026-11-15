/**
 * Qahwa (template 69, coffee gear at home; Claude Design "Storefront
 * Templates"): warm latte paper, a dark roast brown for actions and a
 * caramel highlight, Lalezar headings over Tajawal text and 12px corners. A
 * home coffee corner: the big word, browse, gifts for coffee people, the
 * morning set and regulars' reviews. Built from
 * section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): beans in jars, moka
 * pots, a copper cezve, a gooseneck kettle, a dripper, cups and wooden
 * trays. No people, no hands, no logos or branded bags.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Qahwa Corner itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const QAHWA_KEY = "qahwa";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(QAHWA_KEY, getDesign(id)!, { corners: 12, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  whiteMugs: pexels(39024946, 900),
  sidamo: pexels(13427971, 1600),
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

/**
 * Qahwa Corner's own content: what the look is built with when no edition is
 * applied (the template `qahwa` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The big-word hero: `hero.title` is the one big word (the trade, one word); the hero shows the first featured product.
  hero: { title: L("قهوة", "COFFEE") },
  categories: { title: L("تصفح", "Browse") },
  // The panel beside the rail of products: a title and one line.
  products: {
    primary: {
      title: L("هدايا لعشاق القهوة", "Gifts for coffee people"),
      line: L("أكواب وبن وصوانٍ للتقديم.", "Mugs, beans and serving trays."),
    },
  },
  // Optional, with `custom.reviews-rating`, `custom.reviews-count` and `custom.reviews-city-1..3`: three buyer quotes with names and cities, and the rating summary. Without them the home page ends on the rail.
  reviews: {
    title: L("آراء العملاء", "Reviews"),
    items: [
      {
        quote: L("الكنكة النحاس ثقيلة ومطروقة يدويًا، والقهوة تخرج بوجه من أول مرة.", "The copper cezve is heavy and hand-hammered, and the coffee had foam from the first try."),
        name: L("ياسر ع.", "Yasser A."),
      },
      {
        quote: L("البن طازج ورائحته قوية.", "The beans are fresh with a strong aroma."),
        name: L("رنا م.", "Rana M."),
      },
      {
        quote: L("الغلاية مناسبة تمامًا لتحضير القهوة المقطّرة.", "The kettle pours perfectly for drip coffee."),
        name: L("شريف ن.", "Sherif N."),
      },
    ],
  },
  about: {
    line: L("أكواب وغلايات وصوانٍ لتحضير القهوة وتقديمها.", "Mugs, kettles and trays for making and serving coffee."),
    alt: L("إبريقا موكا من الستانلس على رف", "Two steel moka pots on a shelf"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("أدوات لتحضير القهوة", "Tools for making coffee"),
    text: L(
      "نختار أدوات القهوة بعناية: كنك نحاس، أباريق موكا، غلايات للقهوة المقطّرة وأكواب تحافظ على الحرارة.",
      "We pick coffee tools with care: copper cezves, moka pots, pour-over kettles and mugs that keep the heat.",
    ),
    more: L("ولكل أداة صور ومواصفات واضحة في صفحتها.", "Every tool has clear photos and specs on its page."),
    // Goes to the whole catalog.
    cta: L("تسوق الأدوات", "Shop the gear"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("لا تعرف هل تختار الموكا أم القهوة المقطّرة؟ تواصل معنا.", "Not sure between a moka pot and pour-over? Ask us."),
    heading: L("عن أداة أو طلب", "About a tool or an order"),
  },
  faq: {
    line: L("البن والأدوات والطلبات.", "Beans, gear and orders."),
    question: L("كيف أختار درجة طحن البن؟", "How do I choose the grind?"),
    answer: L("اختر الطحن الناعم للقهوة التركية، والمتوسط للموكا، والأخشن قليلًا للقهوة المقطّرة.", "Fine for Turkish coffee, medium for a moka pot and a little coarser for pour-over."),
  },
  custom: {
    // The header's links to the whole catalog and to the best sellers, two words each.
    "shop-all": L("كل الأدوات", "All gear"),
    "best-label": L("الأكثر طلباً", "Most ordered"),
    // With `reviews`: the average rating, the line under it and each quote's city.
    "reviews-rating": L("٤٫٩", "4.9"),
    "reviews-count": L("متوسط ٨٥٠ تقييم", "Average of 850 reviews"),
    "reviews-city-1": L("المعادي", "Maadi"),
    "reviews-city-2": L("الإسكندرية", "Alexandria"),
    "reviews-city-3": L("الشيخ زايد", "Sheikh Zayed"),
  },
  // The about page's photo (4:5).
  photos: { story: PHOTOS.mokaPair },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (Our story, Add to cart, Top rated) and the layout stay here.
 */
function look(c: LookContent, _journey: LookJourney): LookParts {
  const name = c.store.name;
  const x = c.custom;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);

  const header = lib("header-pill", {
    text: { "اسم متجرك": name, "المتجر": x["shop-all"]!, "العروض": x["best-label"]!, "المدونة": L("حكايتنا", "Our story") },
    links: { "/products": [SHOP, BEST], "/blog": "/about" },
  });

  const footer = lib("footer-wordmark", {
    text: {
      "اسم متجرك": name,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "العروض": L("الأعلى تقييماً", "Top rated"),
      "من نحن": L("حكايتنا", "Our story"),
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  // Absent in an edition without buyer quotes: the section is left out.
  const reviews: LookContent["reviews"] | undefined = c.reviews;
  const rating: LookContent["custom"][string] | undefined = x["reviews-rating"];
  const home: Design[] = [
    lib("hero-big-word", { text: { "جديد": c.hero.title, "اطلبها": L("أضف إلى السلة", "Add to cart") } }),
    lib("categories-chips", { text: { "عمّ تبحث؟": c.categories.title } }),
    lib("products-panel-rail", {
      text: {
        "هدايا تحت ١٠٠٠ جنيه": c.products.primary.title,
        "أفكار هدايا لكل مناسبة.": c.products.primary.line,
      },
      links: { "/products": SHOP },
    }),
    ...(reviews && rating
      ? [
          lib("testimonials-bento", {
            text: {
              "٤٫٨": rating,
              "متوسط ١٢٬٤٠٠ تقييم": x["reviews-count"]!,
              "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": reviews.items[0]!.quote,
              "م": initialOf(reviews.items[0]!.name),
              "مريم أ.": reviews.items[0]!.name,
              "القاهرة": x["reviews-city-1"]!,
              "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": reviews.items[1]!.quote,
              "ع": initialOf(reviews.items[1]!.name),
              "عمر ك.": reviews.items[1]!.name,
              "الإسكندرية": x["reviews-city-2"]!,
              "أسعار معقولة وجودة أفضل مما توقعت.": reviews.items[2]!.quote,
              "ن": initialOf(reviews.items[2]!.name),
              "نور ح.": reviews.items[2]!.name,
              "الجيزة": x["reviews-city-3"]!,
            },
          }),
        ]
      : []),
  ];

  const about: Design[] = [
    pageHeader(lib, "about-header", aboutName, c.about.line),
    aboutStory(lib, {
      photo: c.photos.story,
      alt: c.about.alt,
      eyebrow: c.about.eyebrow,
      title: c.about.title,
      text: c.about.text,
      more: c.about.more,
      button: c.about.cta,
      href: SHOP,
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      { slug: "about", name: L("حكايتنا", "Our story"), seo: { title: aboutName }, sections: about },
      {
        slug: "contact",
        name: L("تواصل", "Contact"),
        seo: { title: L("تواصل", "Contact") },
        sections: contactPage(lib, { title: c.contact.title, text: c.contact.line, heading: c.contact.heading }),
      },
      {
        slug: "faq",
        name: L("الأسئلة الشائعة", "FAQ"),
        seo: { title: L("الأسئلة الشائعة", "FAQ") },
        sections: faqPage(lib, { text: c.faq.line, question: c.faq.question, answer: c.faq.answer }),
      },
    ],
  };
}

const DEMO = demoStore({
  name: NAME,
  description: L("أكواب وغلايات وصوانٍ لتحضير القهوة وتقديمها.", "Mugs, kettles and trays for making and serving coffee."),
  categories: [
    ["mugs", "أكواب وفناجين", "Mugs & cups", PHOTOS.cupRoses],
    ["brewing", "أدوات التحضير", "Brewing", PHOTOS.mokaShelf],
    ["beans", "بن", "Beans", PHOTOS.beansJar],
    ["turkish", "تركي", "Turkish", PHOTOS.turkishBlend],
    ["cezves", "كنك", "Cezves", PHOTOS.cezve],
    ["moka", "موكا", "Moka pots", PHOTOS.moka],
    ["kettles", "غلايات", "Kettles", PHOTOS.gooseneck],
    ["trays", "صواني", "Trays", PHOTOS.woodTray],
  ],
  products: [
    ["white-mug-set", "mugs", "٤ أكواب بيضاء منقوشة", "Set of 4 Sculpted White Mugs", PHOTOS.whiteMugs, 680, { rating: 4.8, sold90: 150 }],
    ["ethiopia-sidamo", "beans", "إثيوبيا سيدامو ٢٥٠ جم", "Ethiopia Sidamo, 250 g", PHOTOS.sidamo, 420, { isFeatured: true, rating: 4.9, sold90: 120 }],
    ["olive-wood-tray", "trays", "صينية خشب بمقبضين", "Wooden Serving Tray", PHOTOS.woodTray, 690, { compareAtPrice: 820, sold90: 44 }],
    ["house-turkish-blend", "turkish", "خلطة تركية خاصة ٢٥٠ جم", "House Turkish Blend, 250 g", PHOTOS.turkishBlend, 360, { isFeatured: true, sold90: 200 }],
    ["copper-cezve", "cezves", "كنكة نحاس مطروق", "Hammered Copper Cezve", PHOTOS.cezve, 550, { isFeatured: true, rating: 4.9, sold90: 96 }],
    ["moka-pot", "moka", "موكا ستانلس ٦ فناجين", "Steel Moka Pot, 6 Cups", PHOTOS.moka, 950, { sold90: 70 }],
    ["gooseneck-kettle", "kettles", "غلاية بصنبور طويل وميزان حرارة", "Gooseneck Kettle with Thermometer", PHOTOS.gooseneck, 1350, { compareAtPrice: 1550, sold90: 38 }],
    ["ceramic-dripper", "brewing", "قمع تقطير سيراميك أسود", "Black Ceramic Dripper", PHOTOS.dripper, 480, { sold90: 52 }],
    ["gold-rim-cups", "mugs", "فناجين بحافة ذهبية ٦ قطع", "Gold-Rim Cups, Set of 6", PHOTOS.goldCups, 890, { sold90: 29 }],
    ["turkish-cup-tray-set", "mugs", "فنجانان تركيان وصينية", "Turkish Cup Pair & Tray", PHOTOS.trayPair, 620, { sold90: 61 }],
    ["brazil-dark-roast", "beans", "برازيل تحميص غامق ٢٥٠ جم", "Brazil Dark Roast, 250 g", PHOTOS.darkRoast, 390, { inStock: false, sold90: 84 }],
  ],
});

export const QAHWA = editionTemplate({
  key: QAHWA_KEY,
  version: 4,
  changelog: "Qahwa v3: wide hero photo, no coupon",
  productPage: { thumbs: "bottom", band: "brand", copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "You may also like") } },
  name: L("قهوة", "Qahwa"),
  description: L(
    "أدوات القهوة في البيت: الكلمة الكبيرة وهدايا لعشاق القهوة. أربع صفحات جاهزة.",
    "Coffee gear at home: the big word and gifts for coffee people. Four ready pages.",
  ),
  category: "kitchen",
  style: ["warm", "bold"],
  sortOrder: 690,
  palette: ["#f6f2ec", "#e9e0d4", "#e3a857", "#3b2a20"],
  colors: {
    primary: "#3b2a20",
    secondary: "#e9e0d4",
    background: "#ffffff",
    foreground: "#21160f",
    muted: "#66574a",
    border: "#dacfbf",
    accent: "#e3a857",
  },
  fonts: { heading: "Lalezar", body: "Tajawal" },
  radius: 12,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "hero.title",
    "categories.title",
    "products.primary.title",
    "products.primary.line",
    "about",
    "contact",
    "faq",
    "photos.story",
    "custom.shop-all",
    "custom.best-label",
  ],
  // Buyer quotes and a rating are demo claims: a pack writes real ones (rating, count and cities too) or leaves them out (the section is then not built).
  // The rail shows the design's own list, so `primary` is not read; no category rows.
  optional: ["reviews", "custom.reviews-rating", "custom.reviews-count", "custom.reviews-city-1", "custom.reviews-city-2", "custom.reviews-city-3"],
  journey: { primary: "featured", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
