/**
 * Karat (template 26, everyday accessories; Claude Design "Storefront
 * Templates"): blush paper, a deep plum for actions and a mustard gold
 * highlight, Lalezar display type over Tajawal and round 18px corners. A
 * playful accessories shop: a poster with a sticker, story rings, a
 * segmented shelf, the week's deal, photo reviews and an Instagram bento.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): earrings, bracelets,
 * rings, jewellery boxes, a watch and bags. No hands, ears, necks, busts
 * or brand marks.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Zeina Accessories itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays 3.
 */
import type { Localized } from "../../core/types";
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, handle, pexels } from "../library-template";

export const KARAT_KEY = "karat";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(KARAT_KEY, getDesign(id)!, { corners: 18, ...patch });

/** A text that reads the same in both languages (a social handle) is patched as one string. */
const oneString = (text: Localized): Localized | string => (text.ar === text.en ? text.en : text);

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  jewelBox: pexels(14882422),
  hoops: pexels(12194350, 900),
  studs: pexels(12194361, 900),
  chain: pexels(12124617, 900),
  braided: pexels(12124662, 900),
  ringBox: pexels(6167403, 900),
  colourRings: pexels(29967978, 900),
  necklaceRack: pexels(7679654, 900),
  tray: pexels(4155254, 900),
  ringDishes: pexels(32442408, 900),
  vintageTray: pexels(7679447, 900),
  dish: pexels(4735888, 900),
  watch: pexels(13007642, 900),
  tote: pexels(36364964, 900),
  buckleBag: pexels(8502482, 900),
};

const NAME = L("زينة أكسسوار", "Zeina Accessories");

/** The eight story rings of `categories-stories`. */
const STORIES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/**
 * Zeina's own content: what the look is built with when no edition is applied
 * (the template `karat` has always meant). The store name and description and
 * the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  hero: {
    eyebrow: L("مجموعة اللمعة", "The shine edit"),
    alt: L("علبة مجوهرات مفتوحة فيها سلاسل", "An open jewellery box with chains"),
    title: L("لمعة كل يوم", "Everyday shine"),
    line: L("إكسسوارات دهبي وساعات وشنط، كلها أقل من ٢٬٠٠٠ ج.م.", "Gold-tone jewellery, watches and bags, all under EGP 2,000."),
    // The button goes to the newest products.
    cta: L("تسوقي الجديد", "Shop new in"),
  },
  categories: { title: L("تسوقي بالقسم", "Shop by category") },
  // The shelf's title, over its tabs (new, best sellers, top rated).
  products: { primary: { title: L("اختاري مزاجك", "Pick your mood") } },
  // Four photo reviews. Each card shows the first letter of the name, and a square photo of what was bought (`photos.custom.reviews-N`).
  reviews: {
    title: L("من عميلاتنا", "From our customers"),
    items: [
      { quote: L("الهوب لسه بيلمع بعد ٣ شهور لبس كل يوم.", "The hoops still shine after three months of daily wear."), name: L("جنى ك.", "Jana K.") },
      { quote: L("بوكس هدية مثالي، أختي حبت الغويشة.", "A perfect gift box; my sister loved the bracelet."), name: L("فرح ع.", "Farah A.") },
      { quote: L("الساعة حلوة، الأبلكيشن خد وقت عشان يتظبط.", "The watch is pretty; the app took a while to set up."), name: L("ليلى ر.", "Laila R.") },
      { quote: L("الشنطة جلدها حلو والمقاس عملي جداً.", "The bag’s leather is lovely and the size is very practical."), name: L("سلمى ط.", "Salma T.") },
    ],
  },
  about: {
    line: L("إكسسوارات بأسعار حلوة بتختارها أختين في مدينة نصر.", "Affordable accessories picked by two sisters in Nasr City."),
    alt: L("خواتم في أطباق خزف ملوّنة", "Rings in colourful ceramic dishes"),
    eyebrow: L("سيتي ستارز", "City Stars"),
    title: L("لمعة كل يوم بسعر حلو", "Everyday shine at a fair price"),
    text: L("بنختار كل قطعة بنفسنا: ستانلس مطلي دهب ضد المية ومضاد للحساسية.", "We pick every piece ourselves: water-resistant, hypoallergenic gold-plated steel."),
    more: L("وكل طلب بيوصل في علبة هدية.", "And every order arrives in a gift box."),
    // The button goes to the newest products.
    cta: L("تسوقي الجديد", "Shop new in"),
  },
  contact: {
    title: L("تواصلي معانا", "Contact us"),
    line: L("سيتي ستارز، كشك ٢٢، مدينة نصر.", "City Stars, Kiosk 22, Nasr City."),
    heading: L("عن هدية أو طلب", "About a gift or an order"),
  },
  faq: {
    line: L("الخامات والتوصيل والهدايا.", "Materials, delivery and gifts."),
    question: L("الإكسسوارات بتسوّد؟", "Does the jewellery tarnish?"),
    answer: L("لأ. كلها ستانلس مطلي دهب ضد المية ومضاد للحساسية.", "No. Everything is water-resistant, hypoallergenic gold-plated steel."),
  },
  custom: {
    // The store's short name, as it reads inside a sentence: "About Zeina", "A photo from Zeina's Instagram".
    "store-short": L("زينة", "Zeina"),
    // The hero's small line beside its eyebrow (a season, a date, "this week").
    "hero-note": L("الأسبوع ده بس", "This week only"),
    // The hero's round sticker, three short lines: a word, one big figure (at most 4 characters), a word.
    "hero-sticker-1": L("اشتري", "Buy"),
    "hero-sticker-2": L("٢+١", "2+1"),
    "hero-sticker-3": L("حلقان", "earrings"),
    // The eight story rings: a product type each, one or two words. They all open the categories page.
    "stories-1": L("هوب", "Hoops"),
    "stories-2": L("حلق صغير", "Studs"),
    "stories-3": L("أساور", "Bracelets"),
    "stories-4": L("خواتم", "Rings"),
    "stories-5": L("ستاكات", "Stacks"),
    "stories-6": L("سلاسل", "Necklaces"),
    "stories-7": L("ساعات", "Watches"),
    "stories-8": L("شنط", "Bags"),
    // The Instagram bento's brand tile: the store's handle, then one short line under it.
    "lookbook-handle": L(handle("@zeina.shop"), handle("@zeina.shop")),
    "lookbook-line": L("٦٤ ألف متابع", "64K followers"),
  },
  photos: {
    // The poster's photo, 16:9, with the copy over a dark fade.
    hero: { wide: PHOTOS.jewelBox },
    // The about page's photo (the look has no story block on its home page).
    story: PHOTOS.ringDishes,
    custom: {
      // The story rings, square, shown as small circles: one product type each, in the order of `stories-1..8`. Optional: a ring without a photo shows a category tile.
      "stories-1": PHOTOS.hoops,
      "stories-2": PHOTOS.studs,
      "stories-3": PHOTOS.chain,
      "stories-4": PHOTOS.ringBox,
      "stories-5": PHOTOS.colourRings,
      "stories-6": PHOTOS.necklaceRack,
      "stories-7": PHOTOS.watch,
      "stories-8": PHOTOS.tote,
      // The four review cards, square: the product each buyer writes about, in the order of `reviews.items`.
      "reviews-1": PHOTOS.hoops,
      "reviews-2": PHOTOS.braided,
      "reviews-3": PHOTOS.watch,
      "reviews-4": PHOTOS.tote,
      // The Instagram bento, square: one large photo, then four small ones (styled shots, not packshots).
      "lookbook-1": PHOTOS.vintageTray,
      "lookbook-2": PHOTOS.tray,
      "lookbook-3": PHOTOS.ringBox,
      "lookbook-4": PHOTOS.ringDishes,
      "lookbook-5": PHOTOS.dish,
    },
  },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (New, Best sellers, Top rated, About, Verified buyer, the reviewers'
 * cities) and the layout stay here.
 */
function look(c: LookContent, _journey: LookJourney): LookParts {
  const name = c.store.name;
  const short = c.custom["store-short"]!;
  const aboutName = L(`عن ${short.ar}`, `About ${short.en}`);
  const tiles = c.photos.tiles;
  const review = c.reviews.items;

  const header = lib("header-pill", {
    text: { "اسم متجرك": name, "المتجر": L("الجديد", "New"), "العروض": L("الأكثر مبيعاً", "Best sellers"), "المدونة": L("عننا", "About") },
    links: { "/products": [NEW, BEST], "/blog": "/about" },
  });

  const footer = lib("footer-wordmark", {
    text: {
      "اسم متجرك": name,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  const home: Design[] = [
    lib("hero-poster", {
      photo: [undefined, undefined, c.photos.hero.wide],
      text: {
        "مجموعة الموسم": c.hero.eyebrow,
        "من ١ إلى ٣٠ نوفمبر": c.custom["hero-note"]!,
        "صورة الحملة": c.hero.alt,
        "خصم": c.custom["hero-sticker-1"]!,
        "٣٠٪": c.custom["hero-sticker-2"]!,
        "لفترة محدودة": c.custom["hero-sticker-3"]!,
        "الموسم الجديد وصل": c.hero.title,
        "قطع خفيفة بخامات طبيعية، مقاسات كاملة وتبديل مجاني خلال ١٤ يومًا.": c.hero.line,
        "اكتشف المجموعة": c.hero.cta,
      },
      links: { "/products": NEW },
    }),
    lib("categories-stories", {
      photo: STORIES.map((n, i) => c.photos.custom?.[`stories-${n}`] ?? tiles[i % tiles.length]!),
      text: {
        "الأقسام": c.categories.title,
        "وصل حديثًا": c.custom["stories-1"]!,
        "الأكثر مبيعًا": c.custom["stories-2"]!,
        "العروض": c.custom["stories-3"]!,
        "هدايا": c.custom["stories-4"]!,
        "إكسسوارات": c.custom["stories-5"]!,
        "أساسيات": c.custom["stories-6"]!,
        "مجموعات": c.custom["stories-7"]!,
        "الموسم الجديد": c.custom["stories-8"]!,
      },
    }),
    lib("products-shelf", {
      text: { "تسوّق حسب مزاجك": c.products.primary.title, "عليه خصم": L("الأعلى تقييماً", "Top rated") },
      links: { "/products": [NEW, BEST, RATED, SHOP] },
    }),
    lib("testimonials-photos", {
      photo: [undefined, undefined, c.photos.custom["reviews-1"]!, c.photos.custom["reviews-2"]!, c.photos.custom["reviews-3"]!, c.photos.custom["reviews-4"]!],
      text: {
        "من عملائنا": c.reviews.title,
        "صورة العميل": L("المنتج اللي اشترته", "The product she bought"),
        "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": review[0]!.quote,
        "م": initialOf(review[0]!.name),
        "مريم أ.": review[0]!.name,
        "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": review[1]!.quote,
        "ع": initialOf(review[1]!.name),
        "عمر ك.": review[1]!.name,
        "الإسكندرية": L("الجيزة", "Giza"),
        "أسعار معقولة وجودة أفضل مما توقعت.": review[2]!.quote,
        "ن": initialOf(review[2]!.name),
        "نور ح.": review[2]!.name,
        "الجيزة": L("المنصورة", "Mansoura"),
        "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": review[3]!.quote,
        "ي": initialOf(review[3]!.name),
        "يوسف م.": review[3]!.name,
        "المنصورة": L("القاهرة", "Cairo"),
        "اشترى من المتجر": L("اشترت من المتجر", "Verified buyer"),
      },
    }),
    lib("gallery-bento", {
      photo: [
        c.photos.custom["lookbook-1"]!,
        c.photos.custom["lookbook-2"]!,
        c.photos.custom["lookbook-3"]!,
        c.photos.custom["lookbook-4"]!,
        c.photos.custom["lookbook-5"]!,
      ],
      text: {
        "صورة إنستجرام": L(`صورة من إنستجرام ${short.ar}`, `A photo from ${short.en}’s Instagram`),
        "@اسم_متجرك": oneString(c.custom["lookbook-handle"]!),
        "صور جديدة كل أسبوع": c.custom["lookbook-line"]!,
      },
    }),
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
      href: NEW,
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      { slug: "about", name: L("عننا", "About"), seo: { title: aboutName }, sections: about },
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
  description: L("لمعة كل يوم بأقل من ٢٬٠٠٠ ج.م.", "Everyday shine under EGP 2,000."),
  categories: [
    ["earrings", "حلقان", "Earrings", PHOTOS.hoops],
    ["bracelets", "أساور", "Bracelets", PHOTOS.chain],
    ["rings", "خواتم", "Rings", PHOTOS.colourRings],
    ["watches", "ساعات", "Watches", PHOTOS.watch],
    ["bags", "شنط", "Bags", PHOTOS.tote],
  ],
  products: [
    ["gold-tone-hoops", "earrings", "حلق هوب دهبي", "Gold-tone Hoops", PHOTOS.hoops, 390, { isFeatured: true, rating: 4.8, sold90: 410 }],
    ["mini-studs", "earrings", "حلق صغير دهبي", "Mini Studs", PHOTOS.studs, 290, { sold90: 120 }],
    ["chain-bracelet", "bracelets", "غويشة سلسلة", "Chain Bracelet", PHOTOS.chain, 450, { rating: 4.7, sold90: 260 }],
    ["braided-bracelet", "bracelets", "غويشة مضفّرة", "Braided Bracelet", PHOTOS.braided, 490, { sold90: 80 }],
    ["colour-stack-rings", "rings", "ستاك خواتم ألوان", "Colour Stack Rings", PHOTOS.colourRings, 520, { sold90: 98 }],
    ["ring-box-set", "rings", "طقم خواتم بالعلبة", "Ring Set with Box", PHOTOS.ringBox, 690, { sold90: 44 }],
    ["layered-necklaces", "rings", "سلاسل طبقات", "Layered Necklaces", PHOTOS.necklaceRack, 560, { sold90: 70 }],
    ["everyday-smartwatch", "watches", "ساعة ذكية يومية", "Everyday Smartwatch", PHOTOS.watch, 1450, { compareAtPrice: 1690, isFeatured: true, sold90: 132 }],
    ["tan-tote", "bags", "شنطة توت جملي", "Tan Tote", PHOTOS.tote, 1850, { sold90: 44 }],
    ["buckle-shoulder-bag", "bags", "شنطة كتف بأبزيم", "Buckle Shoulder Bag", PHOTOS.buckleBag, 1600, { compareAtPrice: 1900, inStock: false, sold90: 37 }],
  ],
});

export const KARAT = editionTemplate({
  key: KARAT_KEY,
  version: 3,
  changelog: "Karat v3: product page",
  name: L("قيراط", "Karat"),
  description: L(
    "إكسسوارات يومية: بوستر، أقسام دائرية وصور العميلات. أربع صفحات جاهزة.",
    "Everyday accessories: a poster, story rings and customer photos. Four ready pages.",
  ),
  category: "jewelry",
  style: ["bold", "playful"],
  sortOrder: 260,
  palette: ["#fff8f2", "#f7e6da", "#e2b450", "#2a1e2c"],
  colors: {
    primary: "#2a1e2c",
    secondary: "#f7e6da",
    background: "#ffffff",
    foreground: "#2a1e2c",
    muted: "#6a5a6b",
    border: "#efdccd",
    accent: "#e2b450",
  },
  fonts: { heading: "Lalezar", body: "Tajawal" },
  radius: 18,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "hero",
    "custom.hero-note",
    "custom.hero-sticker-1",
    "custom.hero-sticker-2",
    "custom.hero-sticker-3",
    "categories.title",
    ...STORIES.map((n) => `custom.stories-${n}` as const),
    "products.primary.title",
    "reviews.title",
    "reviews.items.0",
    "reviews.items.1",
    "reviews.items.2",
    "reviews.items.3",
    "photos.custom.reviews-1",
    "photos.custom.reviews-2",
    "photos.custom.reviews-3",
    "photos.custom.reviews-4",
    "custom.store-short",
    "custom.lookbook-handle",
    "custom.lookbook-line",
    "photos.custom.lookbook-1",
    "photos.custom.lookbook-2",
    "photos.custom.lookbook-3",
    "photos.custom.lookbook-4",
    "photos.custom.lookbook-5",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "photos.story",
  ],
  // A ring without its own photo shows a category tile.
  optional: STORIES.map((n) => `photos.custom.stories-${n}` as const),
  // The shelf has its own tabs (new, best sellers, top rated), so `primary` is not read; the look has no category rows.
  journey: { primary: "newest", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
  productPage: { surface: "card", thumbs: "bottom", band: "brand", copy: { reviews: L("بنات قالوا إيه", "What you said"), related: L("كمل الإطلالة", "Finish the look") } },
});
