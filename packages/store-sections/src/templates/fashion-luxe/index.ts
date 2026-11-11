/**
 * Fashion Luxe "Hareer" (fashion niche, premium / minimal): white paper,
 * jet-black ink and a soft taupe, Reem Kufi headings over Noto Sans Arabic,
 * square corners and a wide 1400px container. Built from section library
 * designs (`fromLibrary`).
 *
 * v3 (look-first pilot, 2026-11-11, ROADMAP F-89): the home page rebuilt
 * around photos, on one product stage. Home, nine sections:
 *   1. `hero-video`                  the season's rail, copy fading out on scroll
 *   2. `categories-photo-tiles`      four portrait tiles
 *   3. `products-grid`               eight best sellers
 *   4. `about-two-tone`              the atelier story (`reveal-scrub`)
 *   5. `products-category-carousel`  shoes (the store's 3rd category)
 *   6. `gallery-shop-look`           a flat lay with three product dots
 *   7. `products-category-carousel`  bags (the store's 4th category)
 *   8. `features-classic`            the ruled promises row
 *   9. `newsletter-ruled`            no discount copy
 * Chrome: `header-centered-ticker` v2 and `footer-links` v2 (its top hairline
 * hidden: the newsletter's own closes the page).
 *
 * The shop-the-look dots show the store's three newest products, so the demo
 * lists a cream overshirt, a cable knit and a beige tote first: the pieces
 * nearest to the coat, knit and bag in the look photo.
 *
 * Photos and video: Pexels, checked 2026-11-11, white-studio packshots for
 * the products; no people, no logos, none shared with another template.
 * Hero video 8580858 (its poster: a rail with knits, loafers and a straw
 * tote). Category tiles: tops 5706275, knits and jackets 10838789, shoes
 * 27609337, bags 5706269. Two-tone banner 6461507. Shop the look 14577586
 * (dots: coat, knit, bag). About page 7147454.
 * Products, tops: 12025472, 11671964, 8532616, 28297697, 13181673, 20763273;
 * knits and jackets: 4641824, 5704187, 45982, 9603627, 9603630, 6044143,
 * 13094187; shoes: 15557045, 15557047, 15059774, 15059775; bags and leather:
 * 36365228, 22432987, 22432992, 22434759, 26610519, 15763948, 22434781.
 * Dropped: the dresses category (bridal gowns hanging in rooms, not
 * packshots) and every v2 product photo that was not a studio packshot.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import type { NodeTemplate } from "../../elements/tree";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import {
  demoStore,
  handle,
  libraryTemplate,
  pexels,
  pexelsVideo,
  pexelsVideoPoster,
  phone,
} from "../library-template";

export const FASHION_LUXE_KEY = "fashion-luxe";

const lib = (id: string, patch: LibraryPatch = {}): Design =>
  fromLibrary(FASHION_LUXE_KEY, getDesign(id)!, { corners: 0, ...patch });

/**
 * A library design with its nodes of one type changed in tree order. For
 * what a `nodes` patch cannot reach: nodes with no layer label, or several
 * nodes sharing one label (the three dots of `gallery-shop-look`). The tree
 * keeps its shape, only props and styles change.
 */
function retouch(
  design: Design,
  type: string,
  change: (node: NodeTemplate, index: number) => NodeTemplate,
): Design {
  return {
    ...design,
    tree: (t) => {
      let index = 0;
      const visit = (node: NodeTemplate): NodeTemplate => {
        const next = node.type === type ? change(node, index++) : node;
        return next.children
          ? { ...next, children: next.children.map(visit) }
          : next;
      };
      return visit(design.tree(t));
    },
  };
}

/** Hides the first node of a `retouch` (a doubled hairline between two ruled sections). */
const hideFirst = (node: NodeTemplate, index: number): NodeTemplate =>
  index === 0
    ? { ...node, style: { ...node.style, borderWidth: 0, opacity: 0 } }
    : node;

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  heroVideo: pexelsVideo(8580858, "8580858-hd_1920_1080_30fps.mp4"),
  heroPoster: pexelsVideoPoster(8580858),
  atelier: pexels(7147454, 1200),
  tools: pexels(6461507, 1600),
  look: pexels(14577586, 1400),
  // Category tiles.
  catTops: pexels(5706275, 1200),
  catKnits: pexels(10838789, 1200),
  catShoes: pexels(27609337, 1200),
  catBags: pexels(5706269, 1200),
};

/** The look photo's dots, in percent from its left and top: the coat, the knit, the bag (the store's 1st–3rd newest). */
const LOOK_DOTS = [
  { x: 25, y: 41 },
  { x: 50, y: 29 },
  { x: 22, y: 77 },
] as const;

const NAME = L("حرير", "Hareer");
const VIEW_ALL = L("عرض الكل", "View all");

const header = lib("header-centered-ticker", {
  text: {
    "توصيل لكل محافظات مصر": L(
      "توصيل لكل محافظات مصر",
      "Delivery across Egypt",
    ),
    "الدفع عند الاستلام": L("ادفع عند الاستلام", "Pay on delivery"),
    "استبدال سهل خلال ١٤ يوم": L(
      "استبدال المقاس خلال ١٤ يوم",
      "Size exchange within 14 days",
    ),
    "اسم متجرك": NAME,
    المتجر: L("كل القطع", "Shop all"),
    العروض: L("وصل حديثًا", "New in"),
    المدونة: L("الأكثر طلبًا", "Best sellers"),
    "من نحن": L("الأتيليه", "Atelier"),
    "تواصل معنا": L("تتبّع طلبك", "Track order"),
  },
  links: {
    "/products": [undefined, undefined, NEW],
    "/blog": BEST,
    "/contact": "/profile/orders",
  },
});

// The newsletter above ends on its own hairline, so the footer's first one is hidden (two lines 32px apart otherwise).
const footer = retouch(
  lib("footer-links", {
    text: {
      م: L("ح", "H"),
      "اسم متجرك": NAME,
      "كل المنتجات": L("كل القطع", "All pieces"),
      "وصل حديثًا": L("وصل حديثًا", "New in"),
      "الأكثر مبيعًا": L("الأكثر طلبًا", "Best sellers"),
      "الشحن والتوصيل": L("الشحن والتوصيل", "Shipping"),
      "الاسترجاع والاستبدال": L("الاستبدال", "Exchanges"),
      "الأسئلة الشائعة": L("الأسئلة الشائعة", "FAQ"),
      "من نحن": L("عن حرير", "About"),
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L(
        "© ٢٠٢٦ حرير. كل الحقوق محفوظة.",
        "© 2026 Hareer. All rights reserved.",
      ),
    },
    links: {
      "/products": [SHOP, NEW, BEST],
      "https://wa.me/": "https://wa.me/201227409315",
    },
    // Phones: the links wrap, so a dot could end a line alone.
    nodes: { فاصل: { mobile: { hidden: true } } },
  }),
  "divider",
  hideFirst,
);

/** One row of four of a category's products, by the category's place in the store. */
const categoryRow = (place: number): Design =>
  lib("products-category-carousel", {
    as: `category-row-${place}`,
    text: { "عرض الكل": VIEW_ALL },
    lists: [{ offset: place - 1 }, { categoryIndex: place, limit: 4 }],
  });

const home: Design[] = [
  lib("hero-video", {
    photo: [PHOTOS.heroPoster],
    nodes: {
      الفيديو: { props: { url: PHOTOS.heroVideo } },
      التعتيم: { style: { opacity: 28 } },
    },
    text: {
      "فيديو الواجهة": L(
        "شماعة عليها تريكو وجنبها شنطة قش",
        "A rail of knits beside a straw tote",
      ),
      "المجموعة الجديدة": L("مجموعة خريف ٢٠٢٦", "Autumn 2026"),
      "مساحتك، بطريقتك": L(
        "أناقة هادية تعيش معاك",
        "Quiet pieces, made to last",
      ),
      "قطع مختارة بعناية، وتوصيل سريع لحد باب البيت.": L(
        "قطن مصري وصوف ناعم وجلد طبيعي. كل قطعة متفصلة في أتيليه حرير في جاردن سيتي.",
        "Egyptian cotton, soft wool and real leather. Every piece is cut and sewn in our Garden City atelier.",
      ),
      "تسوّق الآن": L("اكتشف المجموعة", "Explore the edit"),
      "شوف الجديد": L("وصل حديثًا", "New in"),
    },
    links: { "/products": SHOP, "/products?sort=newest": NEW },
  }),
  lib("categories-photo-tiles", {
    text: {
      "تسوّق حسب القسم": L("الدولاب كله في مكان واحد", "The whole wardrobe"),
      منتج: L("قطع", "pieces"),
    },
  }),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("القطع الأكثر طلبًا", "Most-loved pieces"),
      "أحدث المنتجات اللي نزلت المتجر.": L(
        "القطع اللي عملاءنا بيرجعولها كل موسم.",
        "The pieces our clients come back to every season.",
      ),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers" }],
    // Tablets: 4 columns, so the 8 best sellers fill two rows.
    nodes: { المنتجات: { tablet: { columns: 4 } } },
  }),
  lib("about-two-tone", {
    photo: [undefined, undefined, PHOTOS.tools],
    text: {
      "صورة البانر": L(
        "مقص وبكر خيط ومتر قياس على ترابيزة الأتيليه",
        "Scissors, thread and a tape measure on the atelier table",
      ),
      "صناعة مصرية": L(
        "أتيليه حرير، من ٢٠٠٩",
        "The Hareer atelier, since 2009",
      ),
      "متعمول عشان يريّحك ويعيش معاك": L(
        "الخياطة هي الحكاية كلها",
        "It is all in the tailoring",
      ),
      "خامات مختارة وتفاصيل متشطبة بإيدينا، عشان تفضل معاك سنين.": L(
        "بنقص ونخيّط كل قطعة في جاردن سيتي، بكميات قليلة وتشطيب يدوي.",
        "Every piece is cut and sewn in Garden City, in small runs and finished by hand.",
      ),
      "تسوّق الآن": L("حكاية الأتيليه", "The atelier story"),
    },
    links: { "/products": "/about" },
  }),
  categoryRow(3),
  // Phones keep the look photo's tall crop (the design squares it), so the dots stay on their pieces.
  retouch(
    retouch(
      lib("gallery-shop-look", {
        photo: [PHOTOS.look],
        text: {
          "صورة اللوك": L(
            "بالطو وبلوفر ضفاير وجينز وشنطة مبطنة على رخام أبيض",
            "A coat, a cable knit, jeans and a quilted bag laid on white marble",
          ),
          "تسوّق اللوك": L("لوك الأسبوع", "This week's look"),
          "كل اللي في الصورة": L(
            "طبقات هادية ليوم طويل",
            "Soft layers for a long day",
          ),
          "دوس على أي نقطة في الصورة وشوف القطعة وسعرها، وضيفها للسلة على طول.":
            L(
              "دوس على أي نقطة في الصورة وشوف القطعة اللي نسّقناها معاها من المجموعة.",
              "Tap a dot on the photo to see the piece from the collection we styled with it.",
            ),
          "تسوّق الكل": L("وصل حديثًا", "Shop new in"),
        },
        links: { "/products": NEW },
      }),
      "hotspot",
      (node, index) => ({
        ...node,
        props: { ...node.props, ...LOOK_DOTS[index] },
      }),
    ),
    "image",
    (node, index) =>
      index === 0
        ? {
            ...node,
            breakpointStyles: {
              ...node.breakpointStyles,
              mobile: {
                ...node.breakpointStyles?.mobile,
                aspectRatio: "portrait",
              },
            },
          }
        : node,
  ),
  categoryRow(4),
  lib("features-classic", {
    text: {
      "توصيل سريع": L("توصيل لحد الباب", "Delivered to your door"),
      "من يوم إلى ٤ أيام لكل المحافظات": L(
        "من يوم إلى ٤ أيام لكل المحافظات",
        "1 to 4 days to every governorate",
      ),
      "استرجاع سهل": L("استبدال المقاس", "Size exchange"),
      "١٤ يومًا لتغيّر رأيك": L(
        "خلال ١٤ يوم من الاستلام",
        "Within 14 days of delivery",
      ),
      "دعم على واتساب": L("تعديل في الأتيليه", "Alterations at the atelier"),
      "أشخاص حقيقيون طوال الأسبوع": L(
        "نظبط القطعة عليك من غير مصاريف",
        "We adjust your piece, free of charge",
      ),
    },
  }),
  // The promises row above ends on a hairline, so the newsletter's first one is hidden.
  retouch(
    lib("newsletter-ruled", {
      text: {
        "خد ١٠٪ خصم على أول طلب": L(
          "شوف المجموعة الجديدة قبل الكل",
          "See each new collection first",
        ),
        "عروض للمشتركين بس، مرة في الأسبوع.": L(
          "رسالة واحدة في الشهر من الأتيليه.",
          "One letter a month from the atelier.",
        ),
      },
    }),
    "divider",
    hideFirst,
  ),
];

const about: Design[] = [
  pageHeader(
    lib,
    "about-header",
    L("عن حرير", "About Hareer"),
    L(
      "ملابس متفصلة في القاهرة، من ٢٠٠٩.",
      "Clothes tailored in Cairo, since 2009.",
    ),
  ),
  aboutStory(lib, {
    photo: PHOTOS.atelier,
    alt: L(
      "أتيليه حرير: مانيكان وماكينة خياطة على جدار أبيض",
      "The Hareer atelier: a dress form and a sewing machine by a white wall",
    ),
    eyebrow: L("الأتيليه", "The atelier"),
    title: L("قطع أقل، معمولة أحسن", "Fewer pieces, better made"),
    text: L(
      "بنعمل مجموعتين في السنة بس، وكل موديل بيتخيط بكميات صغيرة عشان التشطيب يفضل مظبوط.",
      "We make two collections a year, and each style is sewn in small runs so the finish stays right.",
    ),
    more: L(
      "وأي قطعة تحتاج تعديل في المقاس، بنظبطها في الأتيليه من غير مصاريف.",
      "Any piece that needs altering is adjusted at the atelier, free of charge.",
    ),
    button: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L(
    "ملابس وأحذية وشنط متفصلة في القاهرة، من ٢٠٠٩.",
    "Clothes, shoes and bags made in Cairo, since 2009.",
  ),
  categories: [
    ["tops", "التيشيرتات والقمصان", "Tees & shirts", PHOTOS.catTops],
    ["knits", "التريكو والجواكت", "Knits & jackets", PHOTOS.catKnits],
    ["shoes", "الأحذية", "Shoes", PHOTOS.catShoes],
    ["bags", "الشنط والجلود", "Bags & leather", PHOTOS.catBags],
  ],
  // Newest first. The first three are the shop-the-look dots: a jacket, a knit, a bag.
  products: [
    [
      "cream-overshirt",
      "knits",
      "أوفر شيرت صوف كريمي",
      "Cream Wool Overshirt",
      P(4641824),
      3400,
      { rating: 4.7, sold90: 21 },
    ],
    [
      "cable-knit-sweater",
      "knits",
      "بلوفر ضفاير صوف",
      "Cable Knit Sweater",
      P(5704187),
      2650,
      { isFeatured: true, rating: 4.9, sold90: 71 },
    ],
    [
      "beige-leather-tote",
      "bags",
      "شنطة توت جلد بيج",
      "Beige Leather Tote",
      P(36365228),
      4600,
      { rating: 4.9, sold90: 49 },
    ],
    // Tees & shirts
    [
      "essential-white-tee",
      "tops",
      "تيشيرت قطن أبيض",
      "Essential White Tee",
      P(12025472),
      690,
      { rating: 4.8, sold90: 84 },
    ],
    [
      "noir-cotton-tee",
      "tops",
      "تيشيرت قطن أسود",
      "Noir Cotton Tee",
      P(8532616),
      690,
      { rating: 4.8, sold90: 38 },
    ],
    [
      "navy-check-shirt",
      "tops",
      "قميص كاروه كحلي",
      "Navy Check Shirt",
      P(28297697),
      1390,
      { rating: 4.7, sold90: 55 },
    ],
    [
      "zip-polo-knit",
      "tops",
      "بولو تريكو بسوستة",
      "Zip Polo Knit",
      P(20763273),
      1650,
      { rating: 4.8, sold90: 33 },
    ],
    [
      "striped-tee",
      "tops",
      "تيشيرت مقلم",
      "Striped Tee",
      P(13181673),
      850,
      { compareAtPrice: 990, rating: 4.6, sold90: 27 },
    ],
    [
      "fitted-white-tee",
      "tops",
      "تيشيرت أبيض مفصل",
      "Fitted White Tee",
      P(11671964),
      750,
      { rating: 4.7, sold90: 24 },
    ],
    // Knits & jackets
    [
      "navy-stripe-knit",
      "knits",
      "بلوفر مقلم كحلي",
      "Navy Stripe Knit",
      P(45982),
      2400,
      { rating: 4.8, sold90: 62 },
    ],
    [
      "black-leather-jacket",
      "knits",
      "جاكيت جلد أسود",
      "Black Leather Jacket",
      P(6044143),
      5600,
      { rating: 4.9, sold90: 58 },
    ],
    [
      "grey-shirt-jacket",
      "knits",
      "جاكيت قميص رمادي",
      "Grey Shirt-Jacket",
      P(13094187),
      3200,
      { rating: 4.7, sold90: 30 },
    ],
    [
      "soft-wool-cardigan",
      "knits",
      "كارديجان صوف ناعم",
      "Soft Wool Cardigan",
      P(9603627),
      2600,
      { rating: 4.6, sold90: 19 },
    ],
    [
      "ribbed-button-cardigan",
      "knits",
      "كارديجان ريب بزراير",
      "Ribbed Button Cardigan",
      P(9603630),
      2200,
      { rating: 4.5, sold90: 12 },
    ],
    // Shoes
    [
      "black-oxfords",
      "shoes",
      "حذاء أكسفورد أسود",
      "Black Oxfords",
      P(15557045),
      3500,
      { rating: 4.9, sold90: 76 },
    ],
    [
      "brown-derbies",
      "shoes",
      "حذاء ديربي بني",
      "Brown Derbies",
      P(15059774),
      3200,
      { rating: 4.8, sold90: 52 },
    ],
    [
      "black-wingtip-brogues",
      "shoes",
      "حذاء بروج أسود",
      "Black Wingtip Brogues",
      P(15557047),
      3600,
      { rating: 4.8, sold90: 31 },
    ],
    [
      "dark-brown-brogues",
      "shoes",
      "حذاء بروج بني غامق",
      "Dark Brown Brogues",
      P(15059775),
      3450,
      { rating: 4.7, sold90: 23 },
    ],
    // Bags & leather
    [
      "pink-quilted-tote",
      "bags",
      "شنطة يد وردي مبطنة",
      "Pink Quilted Tote",
      P(22432987),
      3800,
      { rating: 4.8, sold90: 67 },
    ],
    [
      "tan-leather-wallet",
      "bags",
      "محفظة جلد عسلي",
      "Tan Leather Wallet",
      P(15763948),
      1150,
      { rating: 4.7, sold90: 44 },
    ],
    [
      "burgundy-duffle-bag",
      "bags",
      "شنطة دافل جلد نبيتي",
      "Burgundy Leather Duffle",
      P(22434759),
      4400,
      { rating: 4.7, sold90: 26 },
    ],
    [
      "burgundy-quilted-tote",
      "bags",
      "شنطة يد نبيتي مبطنة",
      "Burgundy Quilted Tote",
      P(22432992),
      3900,
      { rating: 4.6, sold90: 22 },
    ],
    [
      "floral-embroidered-handbag",
      "bags",
      "شنطة مطرزة بالورد",
      "Floral Embroidered Handbag",
      P(26610519),
      4200,
      { rating: 4.8, sold90: 18 },
    ],
    [
      "scalloped-leather-wallet",
      "bags",
      "محفظة جلد نبيتي",
      "Burgundy Leather Wallet",
      P(22434781),
      1250,
      { rating: 4.6, sold90: 15 },
    ],
  ],
});

export const FASHION_LUXE = libraryTemplate({
  key: FASHION_LUXE_KEY,
  version: 3,
  name: L("حرير", "Hareer"),
  description: L(
    "أزياء راقية بهدوء: فيديو لشماعة الموسم، أقسام بصور طولية، لوك تتسوقه بالنقط وصفوف منتجات على خلفية واحدة. لبوتيكات الملابس الراقية.",
    "Quiet luxury fashion: a video of the season's rail, portrait category tiles, a look you shop by its dots and product rows on one stage. For premium clothing boutiques.",
  ),
  category: "fashion",
  style: ["luxe"],
  sortOrder: 1230,
  palette: ["#f7f6f3", "#ecebe6", "#161616", "#a08c72"],
  colors: {
    primary: "#161616",
    secondary: "#ecebe6",
    background: "#ffffff",
    foreground: "#141414",
    muted: "#64615c",
    border: "#dcdad3",
    accent: "#a08c72",
  },
  fonts: { heading: "Reem Kufi", body: "Noto Sans Arabic" },
  radius: 0,
  containerMaxWidth: 1400,
  productStage: { ratio: "1:1", fit: "cover" },
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    {
      slug: "about",
      name: L("عن حرير", "About"),
      seo: { title: L("عن حرير", "About Hareer") },
      sections: about,
    },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("زورنا في الأتيليه", "Visit the atelier"),
        text: L(
          `١٨ شارع أحمد باشا، جاردن سيتي، القاهرة، ${phone("+20 122 740 9315")}، ${handle("atelier@hareer.eg")}`,
          `18 Ahmed Pasha St, Garden City, Cairo | ${phone("+20 122 740 9315")} | ${handle("atelier@hareer.eg")}`,
        ),
        heading: L("احجز ميعاد قياس", "Book a fitting"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L(
          "المقاسات والتعديل والاستبدال.",
          "Sizing, alterations and exchanges.",
        ),
        question: L(
          "لو المقاس مش مظبوط أعمل إيه؟",
          "What if the size is not right?",
        ),
        answer: L(
          "تقدر تستبدل المقاس خلال ١٤ يوم، أو تعدي على الأتيليه ونظبط القطعة عليك من غير مصاريف.",
          "Exchange the size within 14 days, or drop by the atelier and we will alter the piece to fit, free of charge.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    surface: "flat",
    band: "paper",
    extras: ["product-perks"],
    copy: {
      reviews: L("آراء عميلاتنا", "What our clients say"),
      related: L("قطع تكمّل اللوك", "Complete the look"),
    },
  },
});
