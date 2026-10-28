/**
 * Gifts Bold (2026-10-28, gifts & handmade niche, bold / playful): white
 * paper, deep ink, a raspberry pink and a sunshine yellow, Lemonada headings
 * over Rubik, round 20px corners and a 1320px container. A loud, party-ready
 * home: a scrolling ticker header, a three-slide hero carousel, round
 * category stories, a bento of best sellers, the wrapping-table story on a
 * wide photo, four category rows with rounded frames, a photo newsletter
 * banner and the help footer. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye at about 2000px (2026-10-28): gifts,
 * candles, ceramics, soap, baskets, leather and dried flowers only; no
 * people or hands, no printed labels or logos, none used twice. Slides:
 * 6057211 (wrapped gifts on red), 28271468 (teal glazed plates), 19687408
 * (hanging baskets). Scenes: 35459476 (purple bow on green, home story),
 * 9392989 (fruit-shaped soaps, newsletter), 1666069 (gift boxes on red, about
 * page). Tiles: 8210489, 10410342, 13975260, 30101150, 5806980, 34443363
 * (replaces 37326652, kept by fashion), 39327426. Products: listed in `DEMO`
 * below; this build replaced 7123104 (bows only), 28028316 (kept by fashion),
 * the cropped wallet sets, 14641615 and 15068312 (framed art, printed pages),
 * 16124848 and 12498357 (a scooter, lettered mugs) and four bath bombs from
 * one shoot.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels, phone } from "../library-template";

export const GIFTS_BOLD_KEY = "gifts-bold";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(GIFTS_BOLD_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  slideGifts: pexels(6057211, 1920),
  slidePlates: pexels(28271468, 1920),
  slideBaskets: pexels(19687408, 1920),
  bowStory: pexels(35459476, 1200),
  newsletter: pexels(9392989, 1200),
  giftWall: pexels(1666069, 1200),
  // Category circles.
  catCandles: pexels(8210489, 1200),
  catCeramics: pexels(10410342, 1200),
  catGiftBoxes: pexels(13975260, 1200),
  catSoap: pexels(30101150, 1200),
  catWeaving: pexels(5806980, 1200),
  catLeather: pexels(34443363, 1200),
  catFlowers: pexels(39327426, 1200),
};

const NAME = L("شريطة", "Shareeta");

/** A phone number that keeps its digit groups in order and on one line. */
const tel = (number: string) => phone(number).replace(/ /g, " ");

const header = lib("header-centered-ticker", {
  text: {
    "توصيل لكل محافظات مصر": L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
    "الدفع عند الاستلام": L("تغليف وكارت ببلاش مع كل هدية", "Free wrap and card with every gift"),
    "استبدال سهل خلال ١٤ يوم": L("تتبّع طلبك من صفحة طلباتي", "Track your order in My orders"),
    "اسم متجرك": NAME,
    "المتجر": L("كل الهدايا", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر طلبًا", "Best sellers"),
    "من نحن": L("عن شريطة", "About"),
    "تواصل معنا": L("تتبّع طلبك", "Track order"),
  },
  links: { "/products": [undefined, undefined, NEW], "/blog": BEST, "/contact": "/profile/orders" },
});

const footer = lib("footer-help", {
  text: {
    "واتساب": L("واتساب", "WhatsApp"),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L(tel("٠١٠٠ ٣٨٢ ٥٧١٦"), tel("+20 100 382 5716")),
    "اتصل": L("اتصل بينا", "Call us"),
    "تتبع طلبك": L("تتبّع طلبك", "Track your order"),
    "برقم الطلب": L("من صفحة طلباتي", "From My orders"),
    "اسم متجرك": NAME,
    "تسوق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل الهدايا", "All gifts"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "من نحن": L("عن شريطة", "About Shareeta"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ شريطة. كل الحقوق محفوظة.", "© 2026 Shareeta. All rights reserved."),
  },
  links: {
    "https://wa.me/201001234567": "https://wa.me/201003825716",
    "tel:+201001234567": "tel:+201003825716",
    "/contact": "/profile/orders",
    "/products": [SHOP, NEW, BEST, RATED],
  },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.slideGifts, PHOTOS.slidePlates, PHOTOS.slideBaskets],
    text: {
      "صورة الحملة الأولى": L("هدايا ملفوفة بشرايط على خلفية حمرا", "Ribboned gifts on a red background"),
      "وصل حديثًا": L("وصل حديثًا", "Just landed"),
      "الموسم الجديد وصل": L("هدايا تفرّح من أول نظرة", "Gifts that make them smile"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("شموع، خزف وعلب هدايا ملونة، متغلفة وجاهزة توصل.", "Candles, ceramics and colourful gift boxes, wrapped and ready to go."),
      "تسوّق الجديد": L("شوف الجديد", "Shop new"),
      "صورة الحملة الثانية": L("أطباق خزف تركواز مزججة", "Glazed turquoise ceramic plates"),
      "الأكثر مبيعًا": L("من الفخرانية", "From the potters"),
      "المفضّلة عند عملائنا": L("خزف ملون من الفيوم", "Colourful pottery from Fayoum"),
      "القطع اللي بترجع لها كل مرة.": L("كل طبق متشكل ومتلوّن بالإيد، فمفيش اتنين زي بعض.", "Each plate is shaped and glazed by hand, so no two match."),
      "شوف الأكثر مبيعًا": L("الأكثر طلبًا", "Best sellers"),
      "صورة الحملة الثالثة": L("سلال خوص متعلقة في السقف", "Wicker baskets hanging from the ceiling"),
      "عروض الأسبوع": L("صناديق الهدايا", "Gift hampers"),
      "خصومات لفترة محدودة": L("ظبّط سلة على ذوقك", "Build a hamper your way"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("اختار السلة وحط فيها شمعة وصابون وكارت، وإحنا نغلفها.", "Pick a basket, add a candle, soap and a card, and we wrap it."),
      "تسوّق العروض": L("تسوّق الكل", "Shop all"),
    },
    links: { "/products": [NEW, BEST, SHOP] },
  }),
  lib("categories-circles", {
    text: { "بتدوّر على إيه؟": L("هتهادي مين النهارده؟", "Who are you gifting today?") },
  }),
  lib("products-bento", {
    text: {
      "الأكثر طلبًا": L("الأكثر طلبًا", "Best sellers"),
      "الكل بيسأل عليهم": L("الهدايا اللي الكل بيسأل عليها", "The gifts everyone asks about"),
      "عرض الكل": L("الكل", "All"),
    },
    links: { "/products": BEST },
    // The big card shows the top seller, so the small ones start from the second.
    lists: [undefined, { offset: 1 }],
  }),
  lib("about-wide", {
    photo: [undefined, undefined, undefined, undefined, undefined, undefined, PHOTOS.bowStory],
    text: {
      "كل منتج بيتراجع قبل ما يوصلك": L("ترابيزة التغليف عندنا مبتهداش", "Our wrapping table never rests"),
      "صورة المتجر": L("فيونكة بنفسجي على قماش أخضر", "A purple bow on green cloth"),
      "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف، عشان تفتح العلبة وانت مطمن.": L(
        "+٢٥٠٠٠ هدية غلفناها لأعياد ميلاد وخطوبات ونجاح. كل هدية بتاخد ورق وشريطة على ذوقك، وكارت مكتوب بالإيد.",
        "25,000+ gifts wrapped for birthdays, engagements and graduations. Each one gets the paper and ribbon you pick, plus a handwritten card.",
      ),
      "شوف إزاي بنشتغل": L("اعرف حكايتنا", "Our story"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("الكل", "All"),
    nodes: { "صورة المنتج": { style: { radius: 20 } } },
  }),
  lib("newsletter-banner", {
    photo: [undefined, undefined, undefined, undefined, PHOTOS.newsletter],
    text: {
      "صورة من المتجر": L("صابون على شكل فواكه ملونة في صناديق خشب", "Colourful fruit-shaped soaps in wooden crates"),
      "خليك قريب": L("خليك قريب", "Stay close"),
      "اعرف المجموعة الجديدة قبل الكل": L("أفكار هدايا لكل مناسبة", "Gift ideas for every occasion"),
      "إيميل واحد في الأسبوع فيه القطع الجديدة والعروض الخاصة.": L("إيميل واحد في الأسبوع فيه الهدايا الجديدة وأفكار للتغليف.", "One email a week with new gifts and wrapping ideas."),
      "من غير رسائل مزعجة، وتقدر تلغي في أي وقت.": L("من غير رسائل مزعجة، وتقدر تلغي في أي وقت.", "No spam, unsubscribe any time."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن شريطة", "About Shareeta"), L("هدايا ملونة متغلفة بالإيد في مصر الجديدة.", "Colourful gifts, wrapped by hand in Heliopolis.")),
  aboutStory(lib, {
    photo: PHOTOS.giftWall,
    alt: L("علب هدايا بشرايط حمرا قدام حيطة حمرا", "Ribboned gift boxes against a red wall"),
    eyebrow: L("من ٢٠١٩", "Since 2019"),
    title: L("بدأت بشريطة واحدة", "It started with one ribbon"),
    text: L(
      "كنا بنغلف هدايا صحابنا في البيت، والطلبات زادت لحد ما فتحنا محل صغير في الكوربة.",
      "We wrapped gifts for friends at home until the orders grew into a small shop in Korba.",
    ),
    more: L("ولسه كل هدية بتتغلف بالإيد، ونوصلها لأي محافظة في مصر.", "Every gift is still wrapped by hand, and we deliver to every governorate."),
    button: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("هدايا ملونة متغلفة بالإيد في مصر الجديدة.", "Colourful gifts, wrapped by hand in Heliopolis."),
  categories: [
    ["candles", "الشموع", "Candles", PHOTOS.catCandles],
    ["ceramics", "الخزف", "Ceramics", PHOTOS.catCeramics],
    ["gift-boxes", "علب الهدايا", "Gift boxes", PHOTOS.catGiftBoxes],
    ["soap-bath", "الصابون والحمّام", "Soap & bath", PHOTOS.catSoap],
    ["weaving-baskets", "كروشيه وسلال", "Crochet & baskets", PHOTOS.catWeaving],
    ["leather-goods", "الجلد", "Leather", PHOTOS.catLeather],
    ["wood-botanicals", "الورد المجفف", "Dried flowers", PHOTOS.catFlowers],
  ],
  products: [
    // Candles
    ["neon-swirl-candles", "candles", "شموع نيون ملفوفة", "Neon Swirl Candles", P(4397805), 180, { isFeatured: true, rating: 4.8, sold90: 112 }],
    ["dotted-taper-set", "candles", "شموع رفيعة منقطة", "Dotted Taper Set", P(34654829), 420, { rating: 4.9, sold90: 63 }],
    ["ember-candle-cluster", "candles", "طقم شموع برتقالي وأحمر", "Ember Candle Cluster", P(39853162), 560, { compareAtPrice: 650, rating: 4.6, sold90: 38 }],
    ["flower-jar-candles", "candles", "شموع بأشكال ورد", "Flower Jar Candles", P(26997713), 390, { rating: 4.8, sold90: 47 }],
    ["red-taper-bundle", "candles", "حزمة شموع حمرا", "Red Taper Bundle", P(39441297), 340, { rating: 4.5, sold90: 29 }],
    ["heart-soy-duo", "candles", "شمعة قلب وشمعة صويا", "Heart and Soy Candle Duo", P(27089756), 480, { rating: 5, sold90: 54 }],
    ["twisted-white-tapers", "candles", "شموع بيضا ملفوفة", "Twisted White Tapers", P(36486735), 260, { rating: 4.7, sold90: 33 }],
    ["ring-holder-taper", "candles", "شمعة رفيعة بشمعدان حلقة", "Ring Holder Taper", P(39238773), 450, { rating: 4.4, sold90: 15, inStock: false }],
    // Ceramics
    ["red-wall-vase-trio", "ceramics", "٣ فازات بيضا", "White Vase Trio", P(14608171), 890, { isFeatured: true, rating: 4.8, sold90: 49 }],
    ["tall-neck-vase", "ceramics", "فازة بيضا رقبة طويلة", "Tall-Neck Vase", P(34775286), 650, { rating: 4.6, sold90: 27 }],
    ["blue-brown-bottles", "ceramics", "فازتين أزرق وبني", "Blue and Brown Bottle Vases", P(7674557), 780, { rating: 4.7, sold90: 31 }],
    ["iznik-floral-vase", "ceramics", "فازة إزنيك بورد", "Iznik Floral Vase", P(31687846), 1850, { rating: 4.9, sold90: 22 }],
    ["wisteria-bowls", "ceramics", "سلطانيات مرسومة بالفوشيا", "Wisteria Painted Bowls", P(17888788), 520, { rating: 4.8, sold90: 36 }],
    ["painted-rice-bowls", "ceramics", "سلطانيات مرسومة بالإيد", "Hand-Painted Rice Bowls", P(18464086), 690, { compareAtPrice: 790, rating: 4.7, sold90: 40 }],
    ["pink-leaf-plate", "ceramics", "طبق وردي بنقش ورقة", "Pink Leaf Plate", P(10410291), 380, { rating: 4.6, sold90: 25 }],
    ["blue-spiral-bowl", "ceramics", "سلطانية زرقا حلزونية", "Blue Spiral Bowl", P(11691548), 340, { rating: 4.5, sold90: 18 }],
    // Gift boxes
    ["pastel-box-tower", "gift-boxes", "برج علب باستيل", "Pastel Box Tower", P(7679762), 450, { isFeatured: true, rating: 4.9, sold90: 71 }],
    ["ribbon-box-stack", "gift-boxes", "علب هدايا بشرايط متراصة", "Ribbon Box Stack", P(264985), 520, { rating: 4.8, sold90: 44 }],
    ["red-bow-flatlay", "gift-boxes", "طقم علب بفيونكات حمرا", "Red Bow Box Set", P(1303080), 690, { rating: 4.7, sold90: 35 }],
    ["heart-print-gifts", "gift-boxes", "هدايا بورق قلوب", "Heart-Print Gifts", P(6478865), 380, { rating: 4.6, sold90: 52 }],
    ["red-white-duo", "gift-boxes", "علبتين أحمر وأبيض", "Red and White Box Duo", P(13975271), 420, { rating: 4.7, sold90: 28 }],
    ["lilac-dot-box", "gift-boxes", "علبة بنفسجي منقطة", "Lilac Dot Gift Box", P(39461354), 260, { rating: 4.5, sold90: 21 }],
    ["red-bow-box", "gift-boxes", "علبة بفيونكة حمرا", "Red Bow Gift Box", P(4397844), 310, { compareAtPrice: 360, rating: 4.8, sold90: 39 }],
    ["red-ribbon-sleeves", "gift-boxes", "علب طويلة بشرايط حمرا", "Red Ribbon Sleeves", P(7984849), 290, { rating: 4.6, sold90: 24 }],
    // Soap & bath
    ["geode-bath-bombs", "soap-bath", "قنابل استحمام جيود", "Geode Bath Bombs", P(7175329), 320, { rating: 4.9, sold90: 58 }],
    ["rainbow-soap-bars", "soap-bath", "صابون قوس قزح", "Rainbow Soap Bars", P(14017558), 180, { rating: 4.8, sold90: 77 }],
    ["sunny-bath-bombs", "soap-bath", "قنابل استحمام ألوان الصيف", "Sunny Bath Bombs", P(7175340), 240, { rating: 4.7, sold90: 46 }],
    ["sea-bath-bombs", "soap-bath", "قنابل استحمام ألوان البحر", "Sea-Tone Bath Bombs", P(11270388), 290, { rating: 4.6, sold90: 34 }],
    ["seashell-bath-bombs", "soap-bath", "قنابل استحمام بالصدف", "Seashell Bath Bombs", P(7175334), 350, { rating: 4.8, sold90: 30 }],
    ["rose-honey-soaps", "soap-bath", "صابون ورد وعسل", "Rose and Honey Soaps", P(10853717), 210, { rating: 4.7, sold90: 41 }],
    ["pastel-bath-mix", "soap-bath", "تشكيلة قنابل استحمام باستيل", "Pastel Bath Bomb Mix", P(7175332), 390, { compareAtPrice: 450, rating: 4.5, sold90: 26 }],
    ["tropical-soap-set", "soap-bath", "طقم صابون استوائي", "Tropical Soap Set", P(14017559), 420, { rating: 4.8, sold90: 22 }],
    // Crochet & baskets
    ["granny-square-blanket", "weaving-baskets", "بطانية كروشيه مربعات", "Granny-Square Blanket", P(5806996), 1650, { rating: 4.9, sold90: 18 }],
    ["terracotta-macrame", "weaving-baskets", "معلقة مكرمية تيراكوتا", "Terracotta Macramé Hanging", P(11889288), 780, { rating: 4.6, sold90: 14 }],
    ["rainbow-woven-baskets", "weaving-baskets", "سلال منسوجة ملونة", "Rainbow Woven Baskets", P(35971177), 540, { rating: 4.8, sold90: 32 }],
    ["blue-pattern-tote", "weaving-baskets", "شنطة خوص بنقش أزرق", "Blue Pattern Basket Tote", P(29530568), 490, { rating: 4.7, sold90: 19 }],
    // Leather
    ["burgundy-card-pouch", "leather-goods", "حافظة كروت نبيتي", "Burgundy Card Pouch", P(33190012), 390, { rating: 4.7, sold90: 23 }],
    ["snap-coin-pouch", "leather-goods", "محفظة فكة بزرار", "Snap Coin Pouch", P(12444598), 320, { rating: 4.6, sold90: 17 }],
    ["espresso-belt", "leather-goods", "حزام جلد بني غامق", "Espresso Leather Belt", P(31367058), 650, { rating: 4.5, sold90: 12 }],
    ["cherry-crossbody", "leather-goods", "شنطة كروس كرز", "Cherry Crossbody", P(12442673), 1450, { rating: 4.8, sold90: 15 }],
    // Dried flowers
    ["blush-dried-bouquet", "wood-botanicals", "بوكيه ورد مجفف بينك", "Blush Dried Bouquet", P(15575099), 690, { rating: 4.8, sold90: 27 }],
    ["teal-vase-bouquet", "wood-botanicals", "ورد مجفف في فازة تركواز", "Dried Bouquet in a Teal Vase", P(38417099), 890, { rating: 4.7, sold90: 16 }],
    ["scarlet-dried-bouquet", "wood-botanicals", "بوكيه مجفف أحمر", "Scarlet Dried Bouquet", P(31046064), 750, { rating: 4.9, sold90: 21 }],
    ["pampas-burst-bouquet", "wood-botanicals", "بوكيه بامباس ملون", "Pampas Burst Bouquet", P(8532401), 820, { rating: 4.6, sold90: 13 }],
  ],
});

export const GIFTS_BOLD = libraryTemplate({
  key: GIFTS_BOLD_KEY,
  version: 1,
  name: L("شريطة", "Shareeta"),
  description: L(
    "هدايا بألوان فرحانة: سلايدر بثلاث صور، أقسام دايرية وأربع صفوف منتجات. لمتاجر الهدايا والمناسبات اللي عايزة طاقة.",
    "Joyful, colourful gifts: a three-slide hero, round categories and four product rows. For gift and party stores that want energy.",
  ),
  category: "handmade",
  sortOrder: 1450,
  palette: ["#ffffff", "#fdeef4", "#c2185b", "#ffc93c"],
  colors: {
    primary: "#c2185b",
    secondary: "#fdeef4",
    background: "#ffffff",
    foreground: "#1a1320",
    muted: "#5f5566",
    border: "#f3d6e3",
    accent: "#ffc93c",
  },
  fonts: { heading: "Lemonada", body: "Rubik" },
  radius: 20,
  containerMaxWidth: 1320,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن شريطة", "About"), seo: { title: L("عن شريطة", "About Shareeta") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("كلمنا", "Talk to us"),
        text: L("٧ شارع بغداد، الكوربة، مصر الجديدة، القاهرة.", "7 Baghdad St, Korba, Heliopolis, Cairo."),
        heading: L("عايز هدية مخصوص؟ قولنا المناسبة", "Need a custom gift? Tell us the occasion"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التغليف والكروت والتوصيل.", "Wrapping, cards and delivery."),
        question: L("ممكن أختار لون الورق والشريطة؟", "Can I choose the paper and ribbon?"),
        answer: L(
          "أيوه، عندنا ١٥ لون ورق و١٠ ألوان شرايط. اكتب اختيارك في ملاحظات الطلب أو ابعتهولنا على واتساب.",
          "Yes. We stock 15 papers and 10 ribbon colours. Add your pick in the order notes or send it on WhatsApp.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "side",
    band: "paper",
    extras: ["product-perks"],
    copy: { reviews: L("فرحة اللي اتهادوا", "Happy receivers"), related: L("هدايا تانية هتعجبك", "More gifts you’ll love") },
  },
});
