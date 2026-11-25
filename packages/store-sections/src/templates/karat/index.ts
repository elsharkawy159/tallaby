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
import { templatePreview } from "../preview";

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
    eyebrow: L("المجموعة الجديدة", "New collection"),
    alt: L("علبة مجوهرات مفتوحة بداخلها سلاسل", "An open jewellery box with chains"),
    title: L("إكسسوارات لكل يوم", "Accessories for every day"),
    line: L("إكسسوارات بلون ذهبي وساعات وحقائب.", "Gold-tone jewellery, watches and bags."),
    // The button goes to the newest products.
    cta: L("تسوّق الجديد", "Shop new in"),
  },
  categories: { title: L("تسوّق حسب القسم", "Shop by category") },
  // The shelf's title, over its tabs (new, best sellers, top rated).
  products: { primary: { title: L("اختر ما يناسبك", "Find your pick") } },
  // Optional, with `photos.custom.reviews-1..4` (all four, or leave `reviews` out). A pack may also set `custom.reviews-photo-alt`
  // (the review photo's alt, default "The product photo") and `custom.reviews-verified` (the line under each name, default
  // "اشترى من المتجر / Verified buyer"). Four photo reviews. Each card shows the first letter of the name, and a square photo of what was bought (`photos.custom.reviews-N`).
  reviews: {
    title: L("آراء العملاء", "From our customers"),
    items: [
      { quote: L("حلق الهوب خفيف وتصميمه أنيق.", "The hoops are light and elegant."), name: L("جنى ك.", "Jana K.") },
      { quote: L("الإسورة أنيقة وتصميمها بسيط.", "The bracelet is elegant and simple."), name: L("فرح ع.", "Farah A.") },
      { quote: L("الساعة أنيقة وإعدادها سهل.", "The watch looks good and is easy to set up."), name: L("ليلى ر.", "Laila R.") },
      { quote: L("جلد الحقيبة جميل ومقاسها عملي.", "The bag’s leather is lovely and the size is practical."), name: L("سلمى ط.", "Salma T.") },
    ],
  },
  about: {
    line: L("إكسسوارات وساعات وحقائب مختارة بعناية.", "Accessories, watches and bags chosen with care."),
    alt: L("خواتم في أطباق خزف ملوّنة", "Rings in colourful ceramic dishes"),
    eyebrow: L("من نحن", "About us"),
    title: L("إكسسوارات يومية بتصميم بسيط", "Everyday accessories, simply designed"),
    text: L("نختار كل قطعة بعناية، مع وصف واضح للخامة في صفحة كل منتج.", "We choose every piece with care, with a clear material description on every product page."),
    more: L("تشكيلة من الحلقان والأساور والخواتم والساعات.", "Earrings, bracelets, rings and watches in one place."),
    // The button goes to the newest products.
    cta: L("تسوّق الجديد", "Shop new in"),
  },
  contact: {
    title: L("تواصل معنا", "Contact us"),
    line: L("سيتي ستارز، كشك ٢٢، مدينة نصر.", "City Stars, Kiosk 22, Nasr City."),
    heading: L("لأي سؤال عن منتج أو طلب", "About a product or an order"),
  },
  faq: {
    line: L("الخامات والعناية والطلبات.", "Materials, care and orders."),
    question: L("هل يتغير لون الإكسسوارات؟", "Does the jewellery tarnish?"),
    answer: L("يختلف ذلك حسب الخامة، وستجد نوعها وطريقة العناية بها في صفحة كل منتج.", "It depends on the material; each product page lists the material and its care."),
  },
  custom: {
    // The store's short name, as it reads inside a sentence: "About Zeina", "A photo from Zeina's Instagram".
    "store-short": L("زينة", "Zeina"),
    // The hero's small line beside its eyebrow (a season, a date, "this week").
    "hero-note": L("وصل حديثًا", "New in"),
    // The hero's round sticker, three short lines: a word, one big figure (at most 4 characters), a word.
    "hero-sticker-1": L("مجموعة", "The"),
    "hero-sticker-2": L("٢٠٢٦", "2026"),
    "hero-sticker-3": L("الجديدة", "collection"),
    // The eight story rings: a product type each, one or two words. They all open the categories page.
    "stories-1": L("هوب", "Hoops"),
    "stories-2": L("حلق صغير", "Studs"),
    "stories-3": L("أساور", "Bracelets"),
    "stories-4": L("خواتم", "Rings"),
    "stories-5": L("طبقات", "Stacks"),
    "stories-6": L("سلاسل", "Necklaces"),
    "stories-7": L("ساعات", "Watches"),
    "stories-8": L("حقائب", "Bags"),
    // The Instagram bento's brand tile: the store's handle, then one short line under it.
    "lookbook-handle": L(handle("@zeina.shop"), handle("@zeina.shop")),
    "lookbook-line": L("تابع أحدث صورنا", "Follow our latest photos"),
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
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const short = c.custom["store-short"]!;
  const aboutName = L(`عن ${short.ar}`, `About ${short.en}`);
  const tiles = c.photos.tiles;
  // Optional, together: the four photo reviews and their four photos. Without any of them the section is not built (the shelf is then followed by the Instagram bento).
  const reviews: LookContent["reviews"] | undefined = c.reviews;
  const reviewPhotos = [1, 2, 3, 4].map((n) => c.photos.custom?.[`reviews-${n}`] as string | undefined);
  const withReviews = reviews !== undefined && reviewPhotos.every(Boolean);

  const header = lib("header-pill", {
    text: { "اسم متجرك": name, "المتجر": L("الجديد", "New"), "العروض": L("الأكثر مبيعاً", "Best sellers"), "المدونة": L("من نحن", "About") },
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
        "وصل حديثًا": c.custom["hero-note"]!,
        "صورة الحملة": c.hero.alt,
        "مجموعة": c.custom["hero-sticker-1"]!,
        "٢٠٢٦": c.custom["hero-sticker-2"]!,
        "الجديدة": c.custom["hero-sticker-3"]!,
        "الموسم الجديد وصل": c.hero.title,
        "قطع خفيفة بخامات طبيعية ومقاسات كاملة.": c.hero.line,
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
      text: { "تسوّق حسب اختيارك": c.products.primary.title, "عليه خصم": L("الأعلى تقييماً", "Top rated") },
      links: { "/products": [NEW, BEST, RATED, SHOP] },
    }),
    ...(withReviews
      ? [
          lib("testimonials-photos", {
            photo: [undefined, undefined, ...reviewPhotos],
            text: {
              "من عملائنا": reviews.title,
              "صورة العميل": c.custom["reviews-photo-alt"] ?? L("صورة المنتج", "The product photo"),
              "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": reviews.items[0]!.quote,
              "م": initialOf(reviews.items[0]!.name),
              "مريم أ.": reviews.items[0]!.name,
              "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": reviews.items[1]!.quote,
              "ع": initialOf(reviews.items[1]!.name),
              "عمر ك.": reviews.items[1]!.name,
              "الإسكندرية": L("الجيزة", "Giza"),
              "أسعار معقولة وجودة أفضل مما توقعت.": reviews.items[2]!.quote,
              "ن": initialOf(reviews.items[2]!.name),
              "نور ح.": reviews.items[2]!.name,
              "الجيزة": L("المنصورة", "Mansoura"),
              "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": reviews.items[3]!.quote,
              "ي": initialOf(reviews.items[3]!.name),
              "يوسف م.": reviews.items[3]!.name,
              "المنصورة": L("القاهرة", "Cairo"),
              "اشترى من المتجر": c.custom["reviews-verified"] ?? L("اشترى من المتجر", "Verified buyer"),
            },
          }),
        ]
      : []),
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
        "تابع أحدث صورنا": c.custom["lookbook-line"]!,
      },
    }),
    // v5 (2026-11-25, owner): the store's 1st category as a carousel (`journey.rows`), after the lookbook's photos.
    lib("products-category-carousel", {
      lists: [{ offset: journey.rows[0]! - 1 }, { categoryIndex: journey.rows[0]!, limit: 4 }],
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
      { slug: "about", name: L("من نحن", "About"), seo: { title: aboutName }, sections: about },
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
  description: L("إكسسوارات وساعات وحقائب لكل يوم.", "Accessories, watches and bags for every day."),
  categories: [
    // v5: rings first, so the category carousel (the 1st category) shows a full row.
    ["rings", "خواتم", "Rings", PHOTOS.colourRings],
    ["earrings", "حلقان", "Earrings", PHOTOS.hoops],
    ["bracelets", "أساور", "Bracelets", PHOTOS.chain],
    ["watches", "ساعات", "Watches", PHOTOS.watch],
    ["bags", "حقائب", "Bags", PHOTOS.tote],
  ],
  products: [
    ["gold-tone-hoops", "earrings", "حلق هوب ذهبي اللون", "Gold-tone Hoops", PHOTOS.hoops, 390, { isFeatured: true, rating: 4.8, sold90: 410 }],
    ["mini-studs", "earrings", "حلق صغير ذهبي اللون", "Mini Studs", PHOTOS.studs, 290, { sold90: 120 }],
    ["chain-bracelet", "bracelets", "إسورة سلسلة", "Chain Bracelet", PHOTOS.chain, 450, { rating: 4.7, sold90: 260 }],
    ["braided-bracelet", "bracelets", "إسورة مضفّرة", "Braided Bracelet", PHOTOS.braided, 490, { sold90: 80 }],
    ["colour-stack-rings", "rings", "مجموعة خواتم ملوّنة", "Colour Stack Rings", PHOTOS.colourRings, 520, { sold90: 98 }],
    ["ring-box-set", "rings", "طقم خواتم بالعلبة", "Ring Set with Box", PHOTOS.ringBox, 690, { sold90: 44 }],
    ["vintage-ring-set", "rings", "طقم خواتم بطابع كلاسيكي", "Vintage-style Ring Set", PHOTOS.vintageTray, 620, { sold90: 52 }],
    ["layered-necklaces", "rings", "سلاسل طبقات", "Layered Necklaces", PHOTOS.necklaceRack, 560, { sold90: 70 }],
    ["everyday-smartwatch", "watches", "ساعة ذكية يومية", "Everyday Smartwatch", PHOTOS.watch, 1450, { compareAtPrice: 1690, isFeatured: true, sold90: 132 }],
    ["tan-tote", "bags", "حقيبة توت بلون جملي", "Tan Tote", PHOTOS.tote, 1850, { sold90: 44 }],
    ["buckle-shoulder-bag", "bags", "حقيبة كتف بأبزيم", "Buckle Shoulder Bag", PHOTOS.buckleBag, 1600, { compareAtPrice: 1900, inStock: false, sold90: 37 }],
  ],
});

export const KARAT = editionTemplate({
  // Gallery card screenshots of the home with its niche pack (owner, 2026-11-12; apps/ecommerce/public/template-previews).
  preview: templatePreview(KARAT_KEY, "glasses", { ar: 1682, en: 1694 }),
  key: KARAT_KEY,
  // v5 (2026-11-25, owner): products by category as a carousel after the lookbook.
  version: 5,
  changelog: "Karat v5: products by category as a carousel on the home",
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
  // A ring without its own photo shows a category tile. The photo reviews are built only with `reviews` (four items) and all four
  // `photos.custom.reviews-N`; their two fixed lines (`custom.reviews-photo-alt`, `custom.reviews-verified`) default to Zeina's wording.
  optional: [
    ...STORIES.map((n) => `photos.custom.stories-${n}` as const),
    "reviews",
    "photos.custom.reviews-1",
    "photos.custom.reviews-2",
    "photos.custom.reviews-3",
    "photos.custom.reviews-4",
    "custom.reviews-photo-alt",
    "custom.reviews-verified",
  ],
  // The shelf has its own tabs (new, best sellers, top rated), so `primary` is not read; the category carousel shows the store's 1st category.
  journey: { primary: "newest", rows: [1] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
  productPage: { surface: "card", thumbs: "bottom", band: "brand", copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "You may also like") } },
});
