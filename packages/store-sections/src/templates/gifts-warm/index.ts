/**
 * Gifts Warm (2026-10-28, gifts & handmade niche, warm / crafty): kraft
 * cream paper, terracotta and sage, Aref Ruqaa headings over Readex Pro,
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
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("أهلًا بيك في سَبَت، وتوصيل لكل مصر", "Welcome to Sabat | Delivery across Egypt"),
    "الدفع عند الاستلام": L("الدفع عند الاستلام", "Cash on delivery"),
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
    "أساسيات كل يوم، مختارة بعناية.": L("هدايا معمولة بالإيد من ورش صغيرة في القاهرة والفيوم وأسوان.", "Handmade gifts from small workshops in Cairo, Fayoum and Aswan."),
    "تسوّق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل الهدايا", "All gifts"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "من نحن": L("حكايتنا", "Our story"),
    "تواصل معنا": L("تواصل معنا", "Contact"),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L(tel("٠١١٥ ٦٤٩ ٢٧٣٠"), tel("+20 115 649 2730")),
    "‏hello@store.com": L("‏hello@sabat.eg", "hello@sabat.eg"),
    "١٢ شارع النيل، الزمالك، القاهرة": L("٩ شارع المعز، الجمالية، القاهرة", "9 El Moez St, El Gamaleya, Cairo"),
    "السبت إلى الخميس، ١٠ ص – ١٠ م": L("كل يوم من ١١ الصبح لـ ١١ بالليل", "Daily, 11am to 11pm"),
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
      "صورة الواجهة": L("شموع صويا في برطمانات مع ينسون نجمي", "Soy candles in jars with star anise"),
      "موسم جديد": L("معمول بالإيد", "Made by hand"),
      "ادخل الموسم الجديد بخطوة واثقة": L("هدايا ليها حكاية", "Gifts with a story"),
      "قطع مريحة وطبقات سهلة تتلبس كل يوم.": L(
        "شموع وصابون وخزف وسلال من ورش صغيرة، متغلفة بورق كرافت وخيط دوبارة.",
        "Candles, soap, stoneware and baskets from small workshops, wrapped in kraft paper and twine.",
      ),
      "تسوّق المجموعة": L("تسوّق الهدايا", "Shop gifts"),
      "الجديد": L("وصل حديثًا", "New in"),
      "الإطلاق الجاي": L("سوق سَبَت الجاي", "The next Sabat market"),
      "قطع جديدة بتنزل كل خميس، كن أول من يشوفها.": L(
        "كل أول جمعة في الشهر بنفتح الورشة للزوار، وبتنزل قطع جديدة من الحرفيين.",
        "On the first Friday of each month we open the workshop and new pieces arrive from our makers.",
      ),
      "شوف الجديد": L("شوف الجديد", "See new in"),
    },
    links: { "/products": SHOP },
  }),
  lib("categories-captioned", {
    text: {
      "اكتشف الأقسام": L("من ورش الحرفيين", "From our makers’ workshops"),
      "كل الأقسام": L("الكل", "All"),
      "منتج": L("منتجات", "items"),
    },
    lists: [{ limit: 6 }],
    nodes: { "الأقسام": { style: { columns: 3 } } },
  }),
  lib("products-shelf", {
    text: {
      "تسوّق حسب مزاجك": L("المفضّل عند عملائنا", "Our customers’ favourites"),
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
      "من ورشتنا": L("من ورشتنا", "From our workshop"),
      "متصمم عشانك ومعمول في القاهرة": L("كل قطعة وراها إيد صنايعي", "Every piece has a maker behind it"),
      "بنعمل كميات صغيرة عشان كل قطعة تفضل مميزة ومفيش حاجة تترمي.": L(
        "بنشتغل مع فخرانية تونس في الفيوم، وصنايعية الخوص في أسوان، وبنصب الشموع ونقطع الصابون في ورشتنا في الجمالية.",
        "We work with the potters of Tunis village in Fayoum and basket weavers in Aswan, and pour candles and cut soap in our Gamaleya workshop.",
      ),
      "كل قطعة بتتقص وتتخيط عند فريقنا في المعادي.": L(
        "+٩٠٠٠ هدية خرجت من عندنا، وتقييمنا ٤٫٨ من ٥.",
        "9,000+ gifts sent from our workshop, rated 4.8 out of 5.",
      ),
      "حكايتنا": L("اقرا حكايتنا", "Read our story"),
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
      "صورة من المتجر": L("بوكيهات ورد مجفف ملفوفة بورق", "Dried flower bouquets wrapped in paper"),
      "للمشتركين": L("رسالة سَبَت", "The Sabat letter"),
      "خد ١٠٪ خصم على أول طلب": L("حكايات الحرفيين، كل شهر", "Makers’ stories, every month"),
      "اشترك عشان توصلك المنتجات الجديدة والعروض الخاصة.": L(
        "قطع جديدة من الورش، ومواعيد سوق سَبَت، وأفكار بسيطة لتغليف الهدايا.",
        "New pieces from the workshops, Sabat market dates and simple gift-wrapping ideas.",
      ),
      "بدون رسائل مزعجة. تقدر تلغي في أي وقت.": L("بدون رسائل مزعجة. تقدر تلغي في أي وقت.", "No spam. Unsubscribe any time."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("حكايتنا", "Our story"), L("هدايا معمولة بالإيد، من ورش صغيرة في مصر.", "Handmade gifts from small workshops across Egypt.")),
  aboutStory(lib, {
    photo: PHOTOS.aboutPage,
    alt: L("سلتين خوص على رف خشب", "Two woven baskets on a wooden shelf"),
    eyebrow: L("من ٢٠١٦", "Since 2016"),
    title: L("ورشة صغيرة في الجمالية", "A small workshop in Gamaleya"),
    text: L(
      "بدأنا بسبت خوص واحد من أسوان، ودلوقتي بنشتغل مع أكتر من ٣٠ حرفي في كل مصر.",
      "We started with one wicker basket from Aswan. Today we work with more than 30 makers across Egypt.",
    ),
    more: L("وبندفع للحرفي سعره العادل قبل ما القطعة تتباع.", "And we pay every maker a fair price before the piece is sold."),
    button: L("تسوّق المفضّل", "Shop favourites"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("هدايا معمولة بالإيد، من ورش صغيرة في مصر.", "Handmade gifts from small workshops across Egypt."),
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
    ["beeswax-honeycomb-pillars", "candles", "شموع شمع نحل شهد", "Beeswax Honeycomb Pillars", P(34806970), 480, { compareAtPrice: 540, rating: 4.8, sold90: 37 }],
    ["ivory-pillar-pair", "candles", "شمعتين عاجي", "Ivory Pillar Pair", P(11065761), 290, { rating: 4.6, sold90: 31 }],
    ["ribbed-glass-tealight", "candles", "شمعة في كوب زجاج مضلع", "Ribbed Glass Tealight", P(6255814), 180, { rating: 4.7, sold90: 55 }],
    ["concrete-cup-candle", "candles", "شمعة في كوب أسمنت", "Concrete Cup Candle", P(8251557), 390, { rating: 4.5, sold90: 22 }],
    ["linen-glass-candle", "candles", "شمعة بيضا في كوب زجاج", "Linen Glass Candle", P(6311976), 420, { rating: 4.8, sold90: 28 }],
    ["chalk-pillar-candle", "candles", "شمعة بيضا عمود", "Chalk Pillar Candle", P(8217514), 260, { rating: 4.4, sold90: 14, inStock: false }],
    // Pottery
    ["stoneware-mug-pair", "ceramics", "مجين ستونوير", "Stoneware Mug Pair", P(6312194), 520, { isFeatured: true, rating: 4.9, sold90: 49 }],
    ["cocoa-glazed-mug", "ceramics", "مج بني مزجج", "Cocoa Glazed Mug", P(31046284), 240, { rating: 4.7, sold90: 38 }],
    ["nesting-bowls-plate", "ceramics", "سلطانيات متداخلة وطبق", "Nesting Bowls and Plate", P(6739690), 690, { rating: 4.8, sold90: 26 }],
    ["speckled-bowl-set", "ceramics", "سلطانية بيضا منقطة مع أطباق", "Speckled Bowl Set", P(8251788), 590, { rating: 4.6, sold90: 21 }],
    ["two-tone-serving-bowl", "ceramics", "سلطانية تقديم بلونين", "Two-Tone Serving Bowl", P(11065506), 380, { rating: 4.7, sold90: 24 }],
    ["blush-cup-set", "ceramics", "طقم سلطانية وفنجان روز", "Blush Bowl and Cup Set", P(7674572), 460, { compareAtPrice: 520, rating: 4.8, sold90: 33 }],
    ["marbled-bowls", "ceramics", "سلطانيات رخامي", "Marbled Clay Bowls", P(6739219), 640, { rating: 4.6, sold90: 18 }],
    ["tunis-clay-bowls", "ceramics", "سلطانيات طين من تونس", "Tunis Village Clay Bowls", P(32212371), 750, { rating: 4.9, sold90: 29 }],
    // Gift wrap
    ["pine-twine-parcel", "gift-boxes", "طرد كرافت بخيط وصنوبر", "Pine and Twine Parcel", P(1693650), 150, { rating: 4.8, sold90: 61 }],
    ["berry-wrapped-gift", "gift-boxes", "هدية بورق بني وتوت", "Berry Wrapped Gift", P(3298036), 180, { rating: 4.7, sold90: 44 }],
    ["plain-kraft-box", "gift-boxes", "علبة كرافت بغطا", "Plain Kraft Box", P(8015467), 60, { rating: 4.5, sold90: 83 }],
    ["chrysanthemum-gift", "gift-boxes", "علبة كرافت بورد أراولة", "Chrysanthemum Gift Box", P(17191388), 290, { isFeatured: true, rating: 4.9, sold90: 39 }],
    ["tissue-kraft-bag", "gift-boxes", "شنطة كرافت بورق حرير", "Kraft Bag with Tissue", P(9218541), 45, { rating: 4.6, sold90: 72 }],
    ["window-kraft-box", "gift-boxes", "علبة كرافت مفتوحة", "Open Kraft Gift Box", P(7957723), 75, { rating: 4.6, sold90: 34 }],
    ["sage-kraft-bags", "gift-boxes", "شنط كرافت زيتي", "Sage Kraft Bags", P(8557942), 55, { rating: 4.4, sold90: 27 }],
    ["twist-handle-bags", "gift-boxes", "شنط كرافت بيد ملفوفة", "Twist-Handle Kraft Bags", P(1666067), 50, { rating: 4.7, sold90: 46 }],
    // Soap & bath
    ["cloud-bath-bombs", "soap-bath", "قنابل استحمام بيضا", "Cloud Bath Bombs", P(6683019), 280, { rating: 4.8, sold90: 47 }],
    ["loofah-bath-trio", "soap-bath", "٣ قنابل استحمام على ليفة", "Bath Bomb Trio on Loofah", P(7924192), 340, { rating: 4.7, sold90: 35 }],
    ["mesh-bag-bombs", "soap-bath", "قنابل استحمام في شبكة قطن", "Bath Bombs in a Cotton Net", P(6682989), 310, { rating: 4.6, sold90: 29 }],
    ["rose-sponge-set", "soap-bath", "قنبلة استحمام وسفنجة بحر", "Bath Bomb and Sea Sponge", P(6724338), 260, { rating: 4.8, sold90: 31 }],
    ["olive-leaf-bombs", "soap-bath", "قنابل استحمام بورق زيتون", "Olive Leaf Bath Bombs", P(6683006), 290, { rating: 4.5, sold90: 19 }],
    ["clay-layer-soap", "soap-bath", "صابون طين طبقات", "Layered Clay Soap", P(5420490), 140, { compareAtPrice: 170, rating: 4.9, sold90: 58 }],
    ["bath-ritual-bowl", "soap-bath", "طقم حمّام في سلطانية", "Bath Ritual Bowl Set", P(6683000), 450, { rating: 4.7, sold90: 22 }],
    ["pink-bath-salts", "soap-bath", "ملح استحمام وردي", "Pink Bath Salts", P(20862392), 220, { rating: 4.6, sold90: 26 }],
    // Baskets
    ["handled-tray-basket", "weaving-baskets", "سبت خوص بإيدين", "Handled Tray Basket", P(2113125), 480, { rating: 4.8, sold90: 24 }],
    ["cream-wicker-pair", "weaving-baskets", "سبتين خوص كريمي", "Cream Wicker Pair", P(17836852), 650, { rating: 4.6, sold90: 15 }],
    ["hanging-market-basket", "weaving-baskets", "سبت سوق متعلق", "Hanging Market Basket", P(33566970), 390, { rating: 4.7, sold90: 18 }],
    ["aswan-straw-baskets", "weaving-baskets", "سلال قش من أسوان", "Aswan Straw Baskets", P(34667143), 560, { rating: 4.9, sold90: 21 }],
    // Leather
    ["leaf-charm-journal", "leather-goods", "دفتر جلد بتعليقة ورقة شجر", "Leaf Charm Journal", P(35810927), 590, { rating: 4.8, sold90: 27 }],
    ["chestnut-notebook", "leather-goods", "نوتة جلد بني بأستك", "Chestnut Leather Notebook", P(8489918), 420, { rating: 4.7, sold90: 19 }],
    ["tooled-backpack-purse", "leather-goods", "شنطة ضهر جلد محفور", "Tooled Leather Backpack", P(12442672), 1650, { rating: 4.6, sold90: 11 }],
    ["embossed-flap-pouch", "leather-goods", "محفظة جلد بقلاب منقوش", "Embossed Flap Pouch", P(13870014), 380, { rating: 4.5, sold90: 13 }],
    // Woodware
    ["slotted-beech-spoons", "wood-botanicals", "معالق زان بفتحات", "Slotted Beech Spoons", P(5507645), 190, { rating: 4.7, sold90: 32 }],
    ["tied-spoon-bundle", "wood-botanicals", "حزمة معالق خشب", "Tied Spoon Bundle", P(6962748), 240, { rating: 4.8, sold90: 25 }],
    ["acacia-board-set", "wood-botanicals", "ألواح تقطيع أكاسيا", "Acacia Board Set", P(17974511), 520, { rating: 4.6, sold90: 17 }],
    ["pine-keepsake-box", "wood-botanicals", "صندوق ذكريات خشب صنوبر", "Pine Keepsake Box", P(221004), 330, { rating: 4.9, sold90: 22 }],
  ],
});

export const GIFTS_WARM = libraryTemplate({
  key: GIFTS_WARM_KEY,
  version: 1,
  name: L("سَبَت", "Sabat"),
  description: L(
    "هدايا هاند ميد بروح الورشة: صورة كبيرة، أقسام بعدد المنتجات وحكاية الحرفيين. لمتاجر المشغولات اليدوية والهدايا الطبيعية.",
    "Warm handmade gifts with a workshop feel: one big photo, categories with counts and the makers’ story. For handmade and natural gift stores.",
  ),
  category: "handmade",
  sortOrder: 1460,
  palette: ["#f6efe4", "#ebdfcc", "#9a4a2c", "#7d8a5c"],
  colors: {
    primary: "#9a4a2c",
    secondary: "#ebdfcc",
    background: "#f6efe4",
    foreground: "#2e2620",
    muted: "#6b5d50",
    border: "#e0d2bd",
    accent: "#7d8a5c",
  },
  fonts: { heading: "Aref Ruqaa", body: "Readex Pro" },
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
        title: L("تعالى الورشة", "Visit the workshop"),
        text: L("٩ شارع المعز، الجمالية، القاهرة. مفتوح كل يوم من ١١ الصبح لـ ١١ بالليل.", "9 El Moez St, El Gamaleya, Cairo. Open daily, 11am to 11pm."),
        heading: L("اسألنا عن أي قطعة أو هدية", "Ask us about any piece or gift"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الحرفيين والتغليف والتوصيل.", "Makers, wrapping and delivery."),
        question: L("ليه كل قطعة شكلها مختلف شوية؟", "Why does each piece look a little different?"),
        answer: L(
          "عشان كل قطعة معمولة بالإيد، فاللون والملمس بيختلفوا شوية من قطعة للتانية. ده جزء من جمالها، ولو عايز تشوف القطعة نفسها ابعتلنا على واتساب.",
          "Each piece is made by hand, so colour and texture vary a little. That is part of its charm; message us on WhatsApp to see the exact piece.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    band: "shelf",
    extras: ["product-perks"],
    copy: { reviews: L("من بيوت عملائنا", "From our customers’ homes"), related: L("تليق معاها", "Goes well with") },
  },
});
