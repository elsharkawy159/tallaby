/**
 * Rokn (template 80, decor and gifts; Claude Design "Storefront
 * Templates"): warm cream paper, a walnut brown for actions and a honey
 * highlight, Amiri headings over Noto Sans Arabic and 18px corners. A small
 * decor and gift studio: small things that finish a room, gifts by who they
 * are for, shop by budget, the five given most, a gift card and one
 * customer's words. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): stoneware vases, empty
 * frames, candles, macrame, throws, cushions and wrapped gift boxes. No
 * people, no hands, no logos.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Rokn Studio itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const ROKN_KEY = "rokn";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ROKN_KEY, getDesign(id)!, { corners: 18, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  dottedVases: pexels(7119222),
  vaseShelf: pexels(8063882, 900),
  frameRoom: pexels(6373517, 900),
  candleCorner: pexels(16411135, 900),
  featherHanging: pexels(16176329, 900),
  woodTray: pexels(36089265),
  donutVase: pexels(4207892, 900),
  twoToneVases: pexels(33126633, 900),
  whiteAmphoras: pexels(19193216, 900),
  pinkVase: pexels(7572727, 900),
  oakFrame: pexels(4207785, 900),
  blackFrame: pexels(8490257, 900),
  woodFrame: pexels(7956938, 900),
  blackVaseTray: pexels(7670689, 900),
  candleJar: pexels(6311829, 900),
  macrame: pexels(13211211, 900),
  waffleThrow: pexels(4577654, 900),
  cushions: pexels(9290601, 900),
  giftBoxes: pexels(3873488, 900),
};

const NAME = L("ركن ستوديو", "Rokn Studio");

/**
 * Rokn Studio's own content: what the look is built with when no edition is
 * applied (the template `rokn` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  hero: {
    alt: L("فازتين سيراميك منقوشين", "Two dotted ceramic vases"),
    eyebrow: L("محل هدايا", "Gift shop"),
    title: L("حاجات صغيرة وفرق كبير", "Small things, big difference"),
    line: L("فازات وبراويز ومنسوجات متختارة تمشي مع بعض، ومتغلفة هدية ببلاش.", "Vases, frames and textiles chosen to work together, gift-wrapped for free."),
    // Goes to the whole catalog; the second button is `custom.best-label` (the best sellers).
    cta: L("تسوق الديكور", "Shop decor"),
  },
  categories: { title: L("هتزيّن إيه؟", "What are you decorating?") },
  // A numbered list of six of what `journey.primary` shows: an eyebrow, a title and a line.
  products: {
    primary: {
      eyebrow: L("أحسن ٥", "Top 5"),
      title: L("الأكتر إهداءً", "Given most"),
      line: L("الهدايا اللي الناس بترجع تطلبها لحبايبهم.", "The gifts people come back to order for the people they love."),
    },
  },
  // Optional, with `custom.reviews-city`: one large buyer quote, its name (the avatar letter is the name's first letter) and city. Without them the home page ends on the list.
  reviews: {
    title: L("قالوا عننا", "What they say"),
    items: [
      {
        quote: L(
          "«طلبت فازة وبرواز هدية بيت جديد، ووصلوا متغلفين بكارت مكتوب بخط الإيد. صاحبتي فرحت جداً.»",
          "“I ordered a vase and a frame as a housewarming gift; they arrived wrapped with a handwritten card. My friend loved it.”",
        ),
        name: L("نادين س.", "Nadine S."),
      },
    ],
  },
  about: {
    line: L("ستوديو ديكور وهدايا صغير في المعادي.", "A small decor and gift studio in Maadi."),
    alt: L("صينية خشب عليها شمعة وقواعد أكواب", "A wooden tray with a candle jar and coasters"),
    eyebrow: L("المعادي", "Maadi"),
    title: L("بنختار حاجات تمشي مع بعض", "We choose things that go together"),
    text: L("كل فازة وبرواز ومفرش في الستوديو متختار عشان يمشي مع الباقي، فتقدر تكمّل ركن كامل من مكان واحد.", "Every vase, frame and textile in the studio is chosen to go with the rest, so you can finish a whole corner in one place."),
    more: L("وكل طلب بيتغلف هدية ببلاش.", "And every order is gift-wrapped for free."),
    // Goes to the whole catalog.
    cta: L("تسوق الديكور", "Shop decor"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("٧ شارع ٩، المعادي.", "7 Road 9, Maadi."),
    heading: L("اطلب كارت هدية أو اسأل عن هدية", "Order a gift card or ask about a gift"),
  },
  faq: {
    line: L("التغليف والتوصيل والاسترجاع.", "Gift wrap, delivery and returns."),
    question: L("ينفع أبعت الهدية لعنوان تاني؟", "Can I send the gift to another address?"),
    answer: L("أيوه، اكتب عنوان الشخص في الطلب ومش هنحط فاتورة جوه العلبة.", "Yes, add their address to the order and we leave the invoice out of the box."),
  },
  custom: {
    // The header's line under the store name, a few words.
    tagline: L("حاجات صغيرة بتكمّل الأوضة", "Small things that finish a room"),
    // The label of the link to the best sellers (header and the hero's second button), two words.
    "best-label": L("الأكثر إهداءً", "Most gifted"),
    // The about page's name (header, footer, page title), one or two words.
    "about-label": L("الستوديو", "The studio"),
    // The price finder: a title and three price bands (the links stay the finder's own).
    "price-title": L("حسب ميزانيتك", "Shop by budget"),
    "price-band-1": L("أقل من ٥٠٠", "Under 500"),
    "price-band-2": L("٥٠٠ – ٧٠٠", "500 – 700"),
    "price-band-3": L("أكتر من ٧٠٠", "Over 700"),
    // The quote's city (with `reviews`).
    "reviews-city": L("مصر الجديدة", "Heliopolis"),
  },
  // hero.tall: the split hero's photo (square on desktop, so the subject sits in the middle); story: the about page (4:5).
  photos: { hero: { tall: PHOTOS.dottedVases }, story: PHOTOS.woodTray },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (New in, FAQ, Top rated, By price) and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const x = c.custom;
  const aboutLabel = x["about-label"]!;
  const tiles = c.photos.tiles.length;

  const header = lib("header-centered", {
    text: {
      "المتجر": L("الجديد", "New in"),
      "العروض": x["best-label"]!,
      "اسم متجرك": name,
      "مختارات بعناية منذ ٢٠١٨": x.tagline!,
      "المدونة": L("الأسئلة", "FAQ"),
      "من نحن": aboutLabel,
    },
    links: { "/products": [NEW, BEST, undefined, NEW, BEST], "/blog": "/faq" },
  });

  const footer = lib("footer-wordmark", {
    text: {
      "اسم متجرك": name,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "العروض": L("الأعلى تقييماً", "Top rated"),
      "من نحن": aboutLabel,
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  // Absent in an edition without buyer quotes: the section is left out.
  const reviews: LookContent["reviews"] | undefined = c.reviews;
  const city: LookContent["custom"][string] | undefined = x["reviews-city"];
  const home: Design[] = [
    lib("hero-halves", {
      photo: [undefined, c.photos.hero.tall],
      text: {
        "كوليكشن الموسم": c.hero.eyebrow,
        "صوت أنقى، كل يوم": c.hero.title,
        "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": c.hero.line,
        "تسوق الآن": c.hero.cta,
        "العروض": x["best-label"]!,
        "صورة الحملة": c.hero.alt,
      },
      links: { "/products": [SHOP, BEST] },
    }),
    lib("categories-circles", {
      text: { "بتدوّر على إيه؟": c.categories.title },
      // Six across by design; a store with another number of categories gets one full row of them (phones swipe).
      ...(tiles !== 6 && { nodes: { "الأقسام": { style: { columns: tiles }, tablet: { columns: tiles } } } }),
    }),
    lib("finder-price-bands", {
      text: {
        "حسب السعر": L("حسب السعر", "By price"),
        "تسوق حسب ميزانيتك": x["price-title"]!,
        "أقل من ٦٠٠": x["price-band-1"]!,
        "٦٠٠ – ١٬٥٠٠": x["price-band-2"]!,
        "أكتر من ١٬٥٠٠": x["price-band-3"]!,
      },
    }),
    lib("products-list", {
      text: {
        "الكتالوج": c.products.primary.eyebrow,
        "كل الإكسسوارات": c.products.primary.title,
        "كل اللي تحتاجه في مكان واحد، أصلي وبضمان.": c.products.primary.line,
      },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary, limit: 6 }],
    }),
    ...(reviews && city
      ? [
          lib("testimonials-spotlight", {
            text: {
              "«من أفضل تجارب الشراء أونلاين. الطلب وصل بسرعة، والتغليف أنيق، والمنتج أفضل من الصور.»": reviews.items[0]!.quote,
              "م": initialOf(reviews.items[0]!.name),
              "مريم أ.": reviews.items[0]!.name,
              "القاهرة": city,
            },
          }),
        ]
      : []),
  ];

  const about: Design[] = [
    pageHeader(lib, "about-header", aboutLabel, c.about.line),
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
      { slug: "about", name: aboutLabel, seo: { title: aboutLabel }, sections: about },
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
  description: L("حاجات صغيرة بتكمّل الأوضة.", "Small things that finish a room."),
  categories: [
    ["vases", "فازات", "Vases", PHOTOS.vaseShelf],
    ["frames", "براويز", "Frames", PHOTOS.frameRoom],
    ["candles", "شموع", "Candles", PHOTOS.candleCorner],
    ["textiles", "منسوجات", "Textiles", PHOTOS.featherHanging],
    ["cushions", "مخدات", "Cushions", PHOTOS.cushions],
    ["trays", "صواني", "Trays", PHOTOS.woodTray],
  ],
  products: [
    ["donut-stoneware-vase", "vases", "فازة دونات ستون وير", "Stoneware Donut Vase", PHOTOS.donutVase, 450, { isFeatured: true, rating: 4.8, sold90: 140 }],
    ["two-tone-vases", "vases", "فازتين على صينية خشب", "Two-Tone Vase Pair", PHOTOS.twoToneVases, 590, { rating: 4.7, sold90: 88 }],
    ["white-amphora-pair", "vases", "زلعتين بيض", "White Amphora Pair", PHOTOS.whiteAmphoras, 650, { sold90: 46 }],
    ["pink-vase-tray", "vases", "فازة بينك على صينية", "Pink Vase on a Tray", PHOTOS.pinkVase, 480, { sold90: 52 }],
    ["oak-frame-vase-set", "frames", "برواز أرو وفازة", "Oak Frame & Vase Set", PHOTOS.oakFrame, 690, { isFeatured: true, sold90: 61 }],
    ["black-frame", "frames", "برواز أسود", "Black Frame", PHOTOS.blackFrame, 320, { sold90: 70 }],
    ["washed-wood-frame", "frames", "برواز خشب مغسول", "Washed Wood Frame", PHOTOS.woodFrame, 280, { sold90: 34 }],
    ["black-vase-candle-tray", "candles", "صينية شمع وفازة سودا", "Black Vase & Candle Tray", PHOTOS.blackVaseTray, 540, { sold90: 39 }],
    ["amber-candle-jar", "candles", "شمعة في برطمان عنبري", "Amber Candle Jar", PHOTOS.candleJar, 260, { sold90: 95 }],
    ["macrame-wall-hanging", "textiles", "معلقة مكرمية", "Macrame Wall Hanging", PHOTOS.macrame, 420, { inStock: false, sold90: 21 }],
    ["waffle-throw", "textiles", "بطانية وافل", "Waffle Throw", PHOTOS.waffleThrow, 890, { compareAtPrice: 1050, sold90: 40 }],
    ["cushion-set", "cushions", "طقم مخدات ألوان", "Cushion Set", PHOTOS.cushions, 650, { sold90: 22 }],
    ["wooden-serving-tray", "trays", "صينية خشب", "Wooden Serving Tray", PHOTOS.woodTray, 380, { sold90: 48 }],
  ],
});

export const ROKN = editionTemplate({
  key: ROKN_KEY,
  version: 3,
  changelog: "Rokn v3: categories, section order",
  productPage: { thumbs: "bottom", gallery: "end", band: "shelf", extras: ["product-shipping"], copy: { reviews: L("كلمات عملائنا", "Customers' words"), related: L("هدايا صغيرة معاه", "Small gifts to go with it") } },
  name: L("ركن", "Rokn"),
  description: L(
    "ديكور وهدايا: هدايا حسب الشخص، حسب الميزانية، الأكتر إهداءً وكارت هدية. أربع صفحات جاهزة.",
    "Decor and gifts: gifts by person, by budget, given most and a gift card. Four ready pages.",
  ),
  category: "home",
  style: ["warm", "classic"],
  sortOrder: 800,
  palette: ["#faf6f1", "#f0e7dc", "#f2cc8f", "#7f5539"],
  colors: {
    primary: "#7f5539",
    secondary: "#f0e7dc",
    background: "#ffffff",
    foreground: "#2a2420",
    muted: "#675c53",
    border: "#e3d6c6",
    accent: "#f2cc8f",
  },
  fonts: { heading: "Amiri", body: "Noto Sans Arabic" },
  radius: 18,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "hero",
    "categories.title",
    "products.primary.eyebrow",
    "products.primary.title",
    "products.primary.line",
    "about",
    "contact",
    "faq",
    "photos.hero.tall",
    "photos.story",
    "custom.tagline",
    "custom.best-label",
    "custom.about-label",
    "custom.price-title",
    "custom.price-band-1",
    "custom.price-band-2",
    "custom.price-band-3",
  ],
  // A buyer quote is a demo claim: a pack writes a real one (with its city) or leaves it out (the section is then not built).
  // A list of six best sellers; no category rows.
  optional: ["reviews", "custom.reviews-city"],
  journey: { primary: "best-sellers", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
