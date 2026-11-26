/**
 * Gifts Warm (2026-10-28, gifts & handmade niche, warm / crafty): kraft
 * cream paper, terracotta and sage, Amiri headings over Readex Pro,
 * soft 12px corners and a 1360px container. A slow, workshop-table home: the
 * announcement header, one wide photo of soy candles and star anise over a
 * market-day strip, captioned category cards with counts, a shelf of best
 * sellers, the workshop story beside a photo, four category rows with square
 * photos, a photo newsletter card and the classic footer. Built from section
 * library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye at about 2000px (2026-10-28): kraft
 * wrapping, candles, stoneware, soap, baskets, leather and wood only; no
 * people or hands, no stamps, labels or logos, none used twice. Hero: 6755745
 * (soy candles with star anise). Scenes: 8238252 (a candle with daisies and
 * matches, home story), 22484952 (dried bouquets, newsletter), 10117739
 * (two baskets on a wooden shelf, about page). Tiles: 34443051, 29286721,
 * 35115586, 7777106 (bath salts; replaces 6513063, stamped soaps), 15301857,
 * 21326994 (replaces 4452399, a camera and logos), 6569304 (replaces
 * 31703678). Products: listed in `DEMO` below; this build replaced 13408929,
 * 4452393, 10963244 and 6721315 (embossed logos), 595910 and 7410461
 * (handwriting, a printed card) and one bath bomb from the same shoot.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels, phone } from "../library-template";

export const GIFTS_WARM_KEY = "gifts-warm";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(GIFTS_WARM_KEY, getDesign(id)!, { corners: 12, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  hero: pexels(6755745, 1920),
  story: pexels(8238252, 1200),
  newsletter: pexels(22484952, 1200),
  aboutPage: pexels(10117739, 1200),
  // Category cards.
  catCandles: pexels(34443051, 1200),
  catCeramics: pexels(29286721, 1200),
  catGiftBoxes: pexels(35115586, 1200),
  catSoap: pexels(7777106, 1200),
  catWeaving: pexels(15301857, 1200),
  catLeather: pexels(21326994, 1200),
  catWood: pexels(6569304, 1200),
};

const NAME = L("سَبَت", "Sabat");

/** A phone number that keeps its digit groups in order and on one line. */
const tel = (number: string) => phone(number).replace(/ /g, " ");

const header = lib("header-announcement", {
  text: {
    "تشكيلة الموسم الجديد وصلت": L("هدايا ومشغولات يدوية مختارة", "Handmade gifts and crafts"),
    "الدفع عند الاستلام": L("صور وتفاصيل لكل قطعة", "Photos and details for every piece"),
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "المتجر": L("كل الهدايا", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("تتبّع طلبك", "Track order"),
    "من نحن": L("حكايتنا", "Our story"),
  },
  links: { "/products": [undefined, NEW, undefined, undefined, NEW], "/blog": "/profile/orders" },
});

const footer = lib("footer-classic", {
  text: {
    "اسم متجرك": NAME,
    "أساسيات كل يوم، مختارة بعناية.": L("شموع وصابون وخزف وسلال مصنوعة يدويًا.", "Handmade candles, soap, stoneware and baskets."),
    "تسوّق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل الهدايا", "All gifts"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "من نحن": L("حكايتنا", "Our story"),
    "تواصل معنا": L("تواصل معنا", "Contact"),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L(tel("٠١١٥ ٦٤٩ ٢٧٣٠"), tel("+20 115 649 2730")),
    "‏hello@store.com": L("‏hello@sabat.eg", "hello@sabat.eg"),
    "١٢ شارع النيل، الزمالك، القاهرة": L("٩ شارع المعز، الجمالية، القاهرة", "9 El Moez St, El Gamaleya, Cairo"),
    "السبت إلى الخميس، ١٠ ص – ١٠ م": L("يوميًا من ١١ صباحًا حتى ١١ مساءً", "Daily, 11am to 11pm"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ سَبَت. كل الحقوق محفوظة.", "© 2026 Sabat. All rights reserved."),
    // The storefront adds its own "Powered by" line, so the design's credit stays empty.
    "بواسطة طلبي": L("", ""),
  },
  links: { "https://wa.me/": "https://wa.me/201156492730", "/products": [SHOP, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-banner", {
    photo: [PHOTOS.hero],
    text: {
      "صورة الواجهة": L("شموع صويا في أوعية زجاجية مع ينسون نجمي", "Soy candles in jars with star anise"),
      "موسم جديد": L("صناعة يدوية", "Made by hand"),
      "ادخل الموسم الجديد بخطوة واثقة": L("هدايا مصنوعة يدويًا", "Handmade gifts"),
      "قطع مريحة وطبقات سهلة للارتداء اليومي.": L(
        "شموع وصابون وخزف وسلال خوص، وعلب وأكياس كرافت للهدايا.",
        "Candles, soap, stoneware and wicker baskets, with kraft boxes and bags for gifts.",
      ),
      "تسوّق المجموعة": L("تسوّق الهدايا", "Shop gifts"),
      "الجديد": L("وصل حديثًا", "New in"),
      "الإطلاق القادم": L("قطع جديدة قريبًا", "New pieces soon"),
      "قطع جديدة قريبًا، كن أول من يراها.": L(
        "تصل قطع جديدة من الشموع والخزف والسلال باستمرار.",
        "New candles, stoneware and baskets arrive regularly.",
      ),
      "اكتشف الجديد": L("اكتشف الجديد", "See new in"),
    },
    links: { "/products": SHOP },
  }),
  lib("categories-captioned", {
    text: {
      "اكتشف الأقسام": L("الأقسام", "Categories"),
      "كل الأقسام": L("الكل", "All"),
      "منتج": L("منتجات", "items"),
    },
    lists: [{ limit: 6 }],
    nodes: { "الأقسام": { style: { columns: 3 } } },
  }),
  lib("products-shelf", {
    text: {
      "تسوّق حسب اختيارك": L("المفضّل عند عملائنا", "Our customers’ favourites"),
      "وصل جديد": L("الأكثر طلبًا", "Best sellers"),
      "الأكثر مبيعًا": L("وصل حديثًا", "New in"),
      "عليه خصم": L("الأعلى تقييمًا", "Top rated"),
      "كل المنتجات": L("كل الهدايا", "All gifts"),
    },
    links: { "/products": [BEST, NEW, RATED, SHOP] },
    lists: [{ source: "best-sellers" }],
  }),
  lib("about-split-story", {
    photo: [undefined, undefined, PHOTOS.story],
    text: {
      "صورة القصة": L("شمعة في كوب زجاج جنب بابونج وكبريت", "A glass candle beside chamomile and matches"),
      "عن المتجر": L("من ورشتنا", "From our workshop"),
      "تصميم مدروس وخامات مختارة": L("قطع مصنوعة يدويًا", "Handmade pieces"),
      "نختار كل قطعة بعناية لتبقى مميزة.": L(
        "فخار وسلال خوص وشموع مصبوبة وصابون مقطّع يدويًا، ولكل قطعة طابعها الخاص.",
        "Pottery, wicker baskets, poured candles and hand-cut soap, each piece with its own character.",
      ),
      "ونعرض لكل قطعة صورًا ومقاسات واضحة.": L(
        "ونعرض لكل قطعة صورًا ومقاسات واضحة.",
        "With clear photos and sizes for every piece.",
      ),
      "حكايتنا": L("اقرأ حكايتنا", "Read our story"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("الكل", "All"),
    muted: [1, 3],
    nodes: { "صورة البطاقة": { style: { aspectRatio: "square" } } },
  }),
  lib("newsletter-photo", {
    photo: [undefined, undefined, undefined, PHOTOS.newsletter],
    text: {
      "صورة من المتجر": L("باقات ورد مجفف ملفوفة بالورق", "Dried flower bouquets wrapped in paper"),
      "للمشتركين": L("رسالة سَبَت", "The Sabat letter"),
      "اشترك في نشرتنا البريدية": L("اشترك في نشرتنا البريدية", "Join our newsletter"),
      "اشترك لتصلك أخبار المنتجات الجديدة.": L(
        "أخبار القطع الجديدة من الشموع والخزف والسلال.",
        "News of new candles, stoneware and baskets.",
      ),
      "بدون رسائل مزعجة، ويمكنك إلغاء الاشتراك في أي وقت.": L("بدون رسائل مزعجة، ويمكنك إلغاء الاشتراك في أي وقت.", "No spam. Unsubscribe any time."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("حكايتنا", "Our story"), L("هدايا ومشغولات مصنوعة يدويًا.", "Handmade gifts and crafts.")),
  aboutStory(lib, {
    photo: PHOTOS.aboutPage,
    alt: L("سلتا خوص على رف خشبي", "Two woven baskets on a wooden shelf"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("مشغولات يدوية مختارة", "Chosen handmade pieces"),
    text: L(
      "شموع وخزف وصابون وسلال وقطع من الجلد والخشب، لكل منها صور وتفاصيل واضحة.",
      "Candles, stoneware, soap, baskets, leather and wood, each with clear photos and details.",
    ),
    more: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
    button: L("تسوّق المفضّل", "Shop favourites"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("هدايا ومشغولات مصنوعة يدويًا.", "Handmade gifts and crafts."),
  categories: [
    ["candles", "الشموع", "Candles", PHOTOS.catCandles],
    ["ceramics", "الخزف والفخار", "Pottery", PHOTOS.catCeramics],
    ["gift-boxes", "التغليف والعلب", "Gift wrap", PHOTOS.catGiftBoxes],
    ["soap-bath", "الصابون والحمّام", "Soap & bath", PHOTOS.catSoap],
    ["weaving-baskets", "سلال الخوص", "Baskets", PHOTOS.catWeaving],
    ["leather-goods", "الجلد", "Leather", PHOTOS.catLeather],
    ["wood-botanicals", "أدوات الخشب", "Woodware", PHOTOS.catWood],
  ],
  products: [
    // Candles
    ["anise-tray-candles", "candles", "شموع صويا على صينية خشب", "Soy Candles on a Wooden Tray", P(6755749), 560, { isFeatured: true, rating: 4.9, sold90: 68 }],
    ["amber-twine-candle", "candles", "شمعة عنبري مع خيط دوبارة", "Amber Candle with Twine", P(8789742), 340, { rating: 4.7, sold90: 42 }],
    ["beeswax-honeycomb-pillars", "candles", "شموع من شمع النحل بنقش الشهد", "Beeswax Honeycomb Pillars", P(34806970), 480, { compareAtPrice: 540, rating: 4.8, sold90: 37 }],
    ["ivory-pillar-pair", "candles", "شمعتان بلون عاجي", "Ivory Pillar Pair", P(11065761), 290, { rating: 4.6, sold90: 31 }],
    ["ribbed-glass-tealight", "candles", "شمعة في كوب زجاج مضلع", "Ribbed Glass Tealight", P(6255814), 180, { rating: 4.7, sold90: 55 }],
    ["concrete-cup-candle", "candles", "شمعة في كوب أسمنت", "Concrete Cup Candle", P(8251557), 390, { rating: 4.5, sold90: 22 }],
    ["linen-glass-candle", "candles", "شمعة بيضاء في كوب زجاجي", "Linen Glass Candle", P(6311976), 420, { rating: 4.8, sold90: 28 }],
    ["chalk-pillar-candle", "candles", "شمعة عمود بيضاء", "Chalk Pillar Candle", P(8217514), 260, { rating: 4.4, sold90: 14, inStock: false }],
    // Pottery
    ["stoneware-mug-pair", "ceramics", "كوبان من الخزف الحجري", "Stoneware Mug Pair", P(6312194), 520, { isFeatured: true, rating: 4.9, sold90: 49 }],
    ["cocoa-glazed-mug", "ceramics", "كوب بني مزجج", "Cocoa Glazed Mug", P(31046284), 240, { rating: 4.7, sold90: 38 }],
    ["nesting-bowls-plate", "ceramics", "أوعية متداخلة وطبق", "Nesting Bowls and Plate", P(6739690), 690, { rating: 4.8, sold90: 26 }],
    ["speckled-bowl-set", "ceramics", "وعاء أبيض منقط مع أطباق", "Speckled Bowl Set", P(8251788), 590, { rating: 4.6, sold90: 21 }],
    ["two-tone-serving-bowl", "ceramics", "وعاء تقديم بلونين", "Two-Tone Serving Bowl", P(11065506), 380, { rating: 4.7, sold90: 24 }],
    ["blush-cup-set", "ceramics", "طقم وعاء وفنجان وردي", "Blush Bowl and Cup Set", P(7674572), 460, { compareAtPrice: 520, rating: 4.8, sold90: 33 }],
    ["marbled-bowls", "ceramics", "أوعية فخار رخامية", "Marbled Clay Bowls", P(6739219), 640, { rating: 4.6, sold90: 18 }],
    ["tunis-clay-bowls", "ceramics", "أوعية فخار", "Clay Bowls", P(32212371), 750, { rating: 4.9, sold90: 29 }],
    // Gift wrap
    ["pine-twine-parcel", "gift-boxes", "طرد كرافت بخيط وصنوبر", "Pine and Twine Parcel", P(1693650), 150, { rating: 4.8, sold90: 61 }],
    ["berry-wrapped-gift", "gift-boxes", "هدية بورق بني وتوت", "Berry Wrapped Gift", P(3298036), 180, { rating: 4.7, sold90: 44 }],
    ["plain-kraft-box", "gift-boxes", "علبة كرافت بغطاء", "Plain Kraft Box", P(8015467), 60, { rating: 4.5, sold90: 83 }],
    ["chrysanthemum-gift", "gift-boxes", "علبة كرافت بزهور الأقحوان", "Chrysanthemum Gift Box", P(17191388), 290, { isFeatured: true, rating: 4.9, sold90: 39 }],
    ["tissue-kraft-bag", "gift-boxes", "حقيبة كرافت بورق حرير", "Kraft Bag with Tissue", P(9218541), 45, { rating: 4.6, sold90: 72 }],
    ["window-kraft-box", "gift-boxes", "علبة كرافت مفتوحة", "Open Kraft Gift Box", P(7957723), 75, { rating: 4.6, sold90: 34 }],
    ["sage-kraft-bags", "gift-boxes", "حقائب كرافت زيتية", "Sage Kraft Bags", P(8557942), 55, { rating: 4.4, sold90: 27 }],
    ["twist-handle-bags", "gift-boxes", "حقائب كرافت بمقبض ملفوف", "Twist-Handle Kraft Bags", P(1666067), 50, { rating: 4.7, sold90: 46 }],
    // Soap & bath
    ["cloud-bath-bombs", "soap-bath", "قنابل استحمام بيضاء", "Cloud Bath Bombs", P(6683019), 280, { rating: 4.8, sold90: 47 }],
    ["loofah-bath-trio", "soap-bath", "٣ قنابل استحمام على ليفة", "Bath Bomb Trio on Loofah", P(7924192), 340, { rating: 4.7, sold90: 35 }],
    ["mesh-bag-bombs", "soap-bath", "قنابل استحمام في شبكة قطن", "Bath Bombs in a Cotton Net", P(6682989), 310, { rating: 4.6, sold90: 29 }],
    ["rose-sponge-set", "soap-bath", "قنبلة استحمام وسفنجة بحر", "Bath Bomb and Sea Sponge", P(6724338), 260, { rating: 4.8, sold90: 31 }],
    ["olive-leaf-bombs", "soap-bath", "قنابل استحمام بورق زيتون", "Olive Leaf Bath Bombs", P(6683006), 290, { rating: 4.5, sold90: 19 }],
    ["clay-layer-soap", "soap-bath", "صابون طين طبقات", "Layered Clay Soap", P(5420490), 140, { compareAtPrice: 170, rating: 4.9, sold90: 58 }],
    ["bath-ritual-bowl", "soap-bath", "طقم استحمام في وعاء", "Bath Ritual Bowl Set", P(6683000), 450, { rating: 4.7, sold90: 22 }],
    ["pink-bath-salts", "soap-bath", "ملح استحمام وردي", "Pink Bath Salts", P(20862392), 220, { rating: 4.6, sold90: 26 }],
    // Baskets
    ["handled-tray-basket", "weaving-baskets", "سلة خوص بمقبضين", "Handled Tray Basket", P(2113125), 480, { rating: 4.8, sold90: 24 }],
    ["cream-wicker-pair", "weaving-baskets", "سلتا خوص بلون كريمي", "Cream Wicker Pair", P(17836852), 650, { rating: 4.6, sold90: 15 }],
    ["hanging-market-basket", "weaving-baskets", "سلة تسوق معلقة", "Hanging Market Basket", P(33566970), 390, { rating: 4.7, sold90: 18 }],
    ["aswan-straw-baskets", "weaving-baskets", "سلال قش", "Straw Baskets", P(34667143), 560, { rating: 4.9, sold90: 21 }],
    // Leather
    ["leaf-charm-journal", "leather-goods", "دفتر جلد بتعليقة ورقة شجر", "Leaf Charm Journal", P(35810927), 590, { rating: 4.8, sold90: 27 }],
    ["chestnut-notebook", "leather-goods", "دفتر جلد بني بشريط مطاطي", "Chestnut Leather Notebook", P(8489918), 420, { rating: 4.7, sold90: 19 }],
    ["tooled-backpack-purse", "leather-goods", "حقيبة ظهر جلد محفور", "Tooled Leather Backpack", P(12442672), 1650, { rating: 4.6, sold90: 11 }],
    ["embossed-flap-pouch", "leather-goods", "محفظة جلد بقلاب منقوش", "Embossed Flap Pouch", P(13870014), 380, { rating: 4.5, sold90: 13 }],
    // Woodware
    ["slotted-beech-spoons", "wood-botanicals", "ملاعق زان بفتحات", "Slotted Beech Spoons", P(5507645), 190, { rating: 4.7, sold90: 32 }],
    ["tied-spoon-bundle", "wood-botanicals", "حزمة ملاعق خشبية", "Tied Spoon Bundle", P(6962748), 240, { rating: 4.8, sold90: 25 }],
    ["acacia-board-set", "wood-botanicals", "ألواح تقطيع أكاسيا", "Acacia Board Set", P(17974511), 520, { rating: 4.6, sold90: 17 }],
    ["pine-keepsake-box", "wood-botanicals", "صندوق ذكريات خشب صنوبر", "Pine Keepsake Box", P(221004), 330, { rating: 4.9, sold90: 22 }],
  ],
});

export const GIFTS_WARM = libraryTemplate({
  key: GIFTS_WARM_KEY,
  // v2 (2026-11-16, owner): Amiri headings replace Aref Ruqaa, which read oddly to shoppers.
  version: 3,
  name: L("سَبَت", "Sabat"),
  description: L(
    "هدايا يدوية بروح الورشة: صورة كبيرة، أقسام بعدد المنتجات وحكاية المتجر. لمتاجر المشغولات اليدوية والهدايا الطبيعية.",
    "Warm handmade gifts with a workshop feel: one big photo, categories with counts and the shop’s story. For handmade and natural gift stores.",
  ),
  category: "handmade",
  style: ["warm"],
  sortOrder: 1460,
  palette: ["#f6efe4", "#ebdfcc", "#9a4a2c", "#7d8a5c"],
  colors: {
    primary: "#9a4a2c",
    secondary: "#ebdfcc",
    background: "#ffffff",
    foreground: "#2e2620",
    muted: "#6b5d50",
    border: "#e0d2bd",
    accent: "#7d8a5c",
  },
  fonts: { heading: "Amiri", body: "Readex Pro" },
  radius: 12,
  containerMaxWidth: 1360,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("حكايتنا", "Our story"), seo: { title: L("حكايتنا", "Our story") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل معنا", "Contact us"),
        text: L("٩ شارع المعز، الجمالية، القاهرة. يوميًا من ١١ صباحًا حتى ١١ مساءً.", "9 El Moez St, El Gamaleya, Cairo. Open daily, 11am to 11pm."),
        heading: L("اسألنا عن أي قطعة أو هدية", "Ask us about any piece or gift"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("القطع اليدوية والخامات والطلبات.", "Handmade pieces, materials and orders."),
        question: L("لماذا تختلف القطع قليلًا عن بعضها؟", "Why does each piece look a little different?"),
        answer: L(
          "لأن كل قطعة مصنوعة يدويًا، يختلف اللون والملمس قليلًا من قطعة إلى أخرى. تواصل معنا لأي سؤال عن قطعة.",
          "Each piece is made by hand, so colour and texture vary a little. Contact us with any question about a piece.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    band: "shelf",
    extras: ["product-perks"],
    copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("يتناسب معها", "Goes well with") },
  },
});
