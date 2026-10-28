/**
 * Gifts Luxe (2026-10-28, gifts & handmade niche, premium / minimal):
 * porcelain paper, charcoal ink and champagne gold, El Messiri headings over
 * Readex Pro, near-square 2px corners and a 1400px container. A candlelit,
 * gallery-quiet home: the top bar header, a background video of gold-lined
 * candles burning, a ruled list of categories with photos, best sellers in a
 * carousel, the atelier story on a brand panel, four category rows with
 * portrait photos, a ruled newsletter bar and the light centred footer.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos and video: Pexels, each checked by eye at about 2000px (2026-10-28):
 * candles, ceramics, wrapped gifts, soap, macramé, leather and wood only; no
 * people or hands, no printed labels, stamps or logos, none used twice.
 * Video: 14898350 (four gold-patterned candles burning), with its poster.
 * Scenes: 12781290 (candles in glass jars, home story), 5566964 (handmade
 * plates and bowls on linen, about page). Tiles: 6311863, 6469143, 14365405
 * (replaces 5725871, bows only), 11635439, 6208095, 12444596 (replaces
 * 31959216, kept by fashion), 35482197 (replaces 6944232). Products: listed
 * in `DEMO` below; this build also replaced 30235390 (printed book under the
 * candles), 39042286 (a gift tag with writing) and 6944927 (same shoot as its
 * neighbours).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels, pexelsVideo, pexelsVideoPoster, phone } from "../library-template";

export const GIFTS_LUXE_KEY = "gifts-luxe";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(GIFTS_LUXE_KEY, getDesign(id)!, { corners: 2, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  heroVideo: pexelsVideo(14898350, "14898350-hd_1920_1080_60fps.mp4"),
  heroPoster: pexelsVideoPoster(14898350),
  candleJars: pexels(12781290, 1200),
  handmadePlates: pexels(5566964, 1200),
  // Category photos.
  catCandles: pexels(6311863, 1200),
  catCeramics: pexels(6469143, 1200),
  catGiftBoxes: pexels(14365405, 1200),
  catSoap: pexels(11635439, 1200),
  catWeaving: pexels(6208095, 1200),
  catLeather: pexels(12444596, 1200),
  catWood: pexels(35482197, 1200),
};

const NAME = L("وَهَج", "Wahag");

/** A phone number that keeps its digit groups in order and on one line. */
const tel = (number: string) => phone(number).replace(/ /g, " ");

const header = lib("header-topbar", {
  text: {
    "توصيل سريع لكل محافظات مصر": L("تغليف هدايا ببلاش، وتوصيل لكل مصر", "Free gift wrap, delivery across Egypt"),
    "الدفع عند الاستلام": L("ادفع عند الاستلام", "Pay on delivery"),
    "تتبّع طلبك": L("تتبّع طلبك", "Track your order"),
    "اسم متجرك": NAME,
    "المتجر": L("كل الهدايا", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر طلبًا", "Best sellers"),
    "من نحن": L("الأتيليه", "Our atelier"),
  },
  links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
});

const footer = lib("footer-centered-light", {
  text: {
    "اسم متجرك": NAME,
    "قطع مختارة بعناية، بتوصل لحد باب البيت.": L(
      `شموع وخزف وهدايا معمولة بالإيد في أتيليه الزمالك. ١٤ شارع البرازيل، الزمالك، القاهرة، ${tel("٠١٢٢ ٧١٨ ٤٠٩٦")}، ${handle("hello@wahag.eg")}`,
      `Candles, ceramics and handmade gifts from our Zamalek atelier. 14 Brazil St, Zamalek, Cairo | ${tel("+20 122 718 4096")} | hello@wahag.eg`,
    ),
    "المتجر": L("كل الهدايا", "Shop all"),
    "من نحن": L("عن وَهَج", "About Wahag"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ وَهَج. كل الحقوق محفوظة.", "© 2026 Wahag. All rights reserved."),
  },
  links: { "https://wa.me/": "https://wa.me/201227184096" },
});

const home: Design[] = [
  lib("hero-video", {
    photo: [PHOTOS.heroPoster],
    nodes: { "الفيديو": { props: { url: PHOTOS.heroVideo } }, "التعتيم": { style: { opacity: 35 } } },
    text: {
      "فيديو الواجهة": L("أربع شمعات بنقوش دهبي بتنوّر", "Four gold-patterned candles burning"),
      "المجموعة الجديدة": L("مجموعة الشتا ٢٠٢٦", "The Winter 2026 edit"),
      "مساحتك، بطريقتك": L("هدية تتفتح على مهل", "A gift worth opening slowly"),
      "قطع مختارة بعناية، وتوصيل سريع لحد باب البيت.": L(
        "شموع صويا متصبوبة بالإيد، خزف من الفسطاط وعلب هدايا بتتغلف قدامك في أتيليه الزمالك.",
        "Hand-poured soy candles, Fustat ceramics and gift boxes wrapped to order in our Zamalek atelier.",
      ),
      "تسوّق الآن": L("اكتشف الهدايا", "Shop gifts"),
      "شوف الجديد": L("وصل حديثًا", "New in"),
    },
    links: { "/products": SHOP, "/products?sort=newest": NEW },
  }),
  lib("categories-ruled", {
    text: {
      "الأقسام": L("الأتيليه", "The atelier"),
      "تسوق بالقسم": L("هدية لكل حد بتحبه", "A gift for everyone you love"),
      "منتج": L("منتجات", "items"),
    },
    lists: [{ limit: 6 }],
    nodes: { "الأقسام": { style: { columns: 3 } } },
  }),
  lib("products-carousel", {
    text: { "الأكثر مبيعاً": L("الهدايا الأكثر طلبًا", "Our most-gifted pieces"), "عرض الكل": L("الكل", "All") },
    links: { "/products": BEST },
    lists: [{ limit: 8 }],
  }),
  lib("about-inset", {
    photo: [undefined, undefined, undefined, undefined, undefined, undefined, undefined, PHOTOS.candleJars],
    text: {
      "إزاي بنشتغل": L("من الأتيليه", "From the atelier"),
      "كل منتج بيتراجع قبل ما يوصلك": L("كل شمعة بتتصب بالإيد", "Every candle is poured by hand"),
      "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف.": L(
        "بنصب الشمع على دفعات صغيرة، وبنختار الخزف من ورش الفسطاط بنفسنا، وكل هدية بتتغلف بورق وشريطة ساتان وكارت مكتوب بخط الإيد.",
        "We pour wax in small batches, choose every ceramic piece from the Fustat workshops ourselves, and wrap each gift with satin ribbon and a handwritten card.",
      ),
      "اعرف أكتر": L("اعرف حكايتنا", "Our story"),
      "صورة المتجر": L("شموع بتنور في برطمانات زجاج", "Candles glowing in glass jars"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("الكل", "All"),
    muted: [1, 3],
    nodes: { "صورة البطاقة": { style: { aspectRatio: "portrait" } } },
  }),
  lib("newsletter-ruled", {
    text: {
      "خد ١٠٪ خصم على أول طلب": L("اعرف المجموعة الجديدة قبل الكل", "See each new edit first"),
      "عروض للمشتركين بس، مرة في الأسبوع.": L("رسالة واحدة في الشهر من الأتيليه.", "One letter a month from the atelier."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن وَهَج", "About Wahag"), L("شموع وخزف وهدايا معمولة بالإيد في الزمالك.", "Candles, ceramics and handmade gifts from Zamalek.")),
  aboutStory(lib, {
    photo: PHOTOS.handmadePlates,
    alt: L("أطباق وأوعية خزف يدوي على قماش كتان", "Handmade ceramic plates and bowls on linen"),
    eyebrow: L("من ٢٠١٧", "Since 2017"),
    title: L("أتيليه صغير بيحب التفاصيل", "A small atelier that loves details"),
    text: L(
      "بدأنا بشمعة واحدة في مطبخ البيت، واليوم بنشتغل مع أكتر من ٢٠ حرفي من الفسطاط لحد الفيوم.",
      "We began with one candle in a home kitchen. Today we work with more than 20 makers, from Fustat to Fayoum.",
    ),
    more: L("وكل هدية لسه بتتغلف عندنا بالإيد، ومعاها كارت بالكلام اللي تحب تقوله.", "Every gift is still wrapped by hand here, with a card that says what you want to say."),
    button: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("شموع وخزف وهدايا معمولة بالإيد في الزمالك.", "Candles, ceramics and handmade gifts from Zamalek."),
  categories: [
    ["candles", "الشموع", "Candles", PHOTOS.catCandles],
    ["ceramics", "الخزف والفخار", "Ceramics", PHOTOS.catCeramics],
    ["gift-boxes", "علب الهدايا", "Gift boxes", PHOTOS.catGiftBoxes],
    ["soap-bath", "الصابون والحمّام", "Soap & bath", PHOTOS.catSoap],
    ["weaving-baskets", "المكرمية", "Macramé", PHOTOS.catWeaving],
    ["leather-goods", "منتجات الجلد", "Leather", PHOTOS.catLeather],
    ["wood-botanicals", "الخشب", "Wood", PHOTOS.catWood],
  ],
  products: [
    // Candles
    ["forest-glass-candle", "candles", "شمعة زجاج غامق بغطاء خشب", "Forest Glass Candle", P(6311847), 850, { isFeatured: true, rating: 4.9, sold90: 74 }],
    ["amber-jar-trio", "candles", "طقم ٣ شموع برطمان عنبري", "Amber Jar Candle Trio", P(7004676), 1250, { compareAtPrice: 1450, rating: 4.8, sold90: 61 }],
    ["clip-top-jar-candle", "candles", "شمعة برطمان بقفل", "Clip-Top Jar Candle", P(6311810), 690, { rating: 4.7, sold90: 38 }],
    ["noir-bowl-candle", "candles", "شمعة سودا في وعاء خشب", "Noir Candle in Wooden Bowl", P(11145797), 980, { rating: 4.8, sold90: 29 }],
    ["apothecary-amber-candle", "candles", "شمعة برطمان عنبري", "Amber Apothecary Candle", P(7004675), 520, { rating: 4.6, sold90: 44 }],
    ["pressed-flower-candles", "candles", "شموع بورد مجفف", "Pressed Flower Candles", P(7233925), 1150, { rating: 5, sold90: 23 }],
    ["botanical-tin-candles", "candles", "شموع علب نحاس بأعشاب", "Botanical Tin Candles", P(11497486), 640, { rating: 4.5, sold90: 19, inStock: false }],
    ["eucalyptus-cork-candle", "candles", "شمعة زجاج أخضر بغطاء فلين", "Eucalyptus Cork Candle", P(6311850), 790, { rating: 4.7, sold90: 27 }],
    // Ceramics
    ["ring-stoneware-vase", "ceramics", "فازة ستونوير حلقة", "Ring Stoneware Vase", P(33105316), 1350, { isFeatured: true, rating: 4.9, sold90: 41 }],
    ["ribbed-white-vase", "ceramics", "فازة بيضا مضلعة", "Ribbed White Vase", P(6770266), 760, { rating: 4.7, sold90: 35 }],
    ["fluted-plinth-vase", "ceramics", "فازة بيضا مخططة", "Fluted White Vase", P(6944986), 690, { rating: 4.6, sold90: 22 }],
    ["moon-floor-vase", "ceramics", "فازة قمر بيضا كبيرة", "Large Moon Vase", P(34022883), 2400, { compareAtPrice: 2750, rating: 4.8, sold90: 16 }],
    ["textured-vase-set", "ceramics", "طقم فازات ستونوير بنقوش", "Textured Stoneware Vase Set", P(31493659), 2900, { rating: 4.8, sold90: 14 }],
    ["fustat-clay-set", "ceramics", "طقم أباريق وفازات طين", "Fustat Clay Jug Set", P(38001670), 1850, { rating: 4.9, sold90: 26 }],
    ["bud-vase-trio", "ceramics", "٣ فازات ستونوير صغيرة", "Stoneware Bud Vase Trio", P(12859529), 980, { rating: 4.7, sold90: 31 }],
    ["glazed-brown-vases", "ceramics", "فازات بني مزجج", "Glazed Brown Vases", P(32856216), 1650, { rating: 4.5, sold90: 12 }],
    // Gift boxes
    ["golden-gift-basket", "gift-boxes", "سلة هدايا بالسيلوفان", "Golden Gift Basket", P(27393960), 2650, { isFeatured: true, rating: 4.9, sold90: 52 }],
    ["linen-pouch-box", "gift-boxes", "علبة كرافت بكيس كتان", "Kraft Box with Linen Pouch", P(8015884), 420, { rating: 4.6, sold90: 47 }],
    ["teal-gift-tower", "gift-boxes", "علب هدايا تركواز بشريطة سودا", "Teal Gift Box Tower", P(33629669), 1450, { rating: 4.8, sold90: 24 }],
    ["gold-sparkle-box", "gift-boxes", "علبة هدايا دهبي لامعة", "Gold Sparkle Gift Box", P(7826283), 560, { rating: 4.7, sold90: 33 }],
    ["blue-ribbon-box", "gift-boxes", "علبة هدايا زرقا بشريطة دهبي", "Blue Box, Gold Ribbon", P(33774172), 480, { rating: 4.6, sold90: 28 }],
    ["red-gift-stack", "gift-boxes", "علب هدايا حمرا متراصة", "Red Gift Box Stack", P(6087540), 1250, { compareAtPrice: 1400, rating: 4.8, sold90: 21 }],
    ["emerald-satin-box", "gift-boxes", "علبة هدايا خضرا بشريطة ساتان", "Emerald Satin Gift Box", P(31496295), 620, { rating: 4.7, sold90: 18 }],
    ["rose-gift-box", "gift-boxes", "علبة بيضا بفيونكة حمرا ووردة", "White Box with a Rose", P(13983751), 890, { rating: 5, sold90: 39 }],
    // Soap & bath
    ["olive-cream-soaps", "soap-bath", "صابونتين زيتون وكريمي", "Olive and Cream Soaps", P(4202469), 260, { rating: 4.8, sold90: 66 }],
    ["sage-dish-soap", "soap-bath", "صابونة مريمية على طبق", "Sage Soap on a Dish", P(6690176), 320, { rating: 4.7, sold90: 34 }],
    ["shampoo-bar-stack", "soap-bath", "شامبو صلب ٤ قطع", "Shampoo Bar Stack", P(3737603), 540, { rating: 4.6, sold90: 29 }],
    ["rosemary-layer-soap", "soap-bath", "صابون طبقات بإكليل الجبل", "Rosemary Layer Soap", P(29189982), 290, { rating: 4.8, sold90: 41 }],
    ["sculpted-soap-set", "soap-bath", "طقم صابون منحوت", "Sculpted Soap Set", P(8297186), 480, { rating: 4.5, sold90: 17 }],
    ["honey-oat-soaps", "soap-bath", "صابون عسل وشوفان", "Honey Oat Soaps", P(7173531), 350, { rating: 4.9, sold90: 37 }],
    ["clay-soap-squares", "soap-bath", "مكعبات صابون طين", "Clay Soap Squares", P(4857078), 310, { rating: 4.6, sold90: 22 }],
    ["rose-whip-set", "soap-bath", "طقم صابون وزبدة ورد", "Rose Butter and Soap Set", P(5928023), 590, { rating: 4.7, sold90: 25 }],
    // Macramé
    ["boho-macrame-hanging", "weaving-baskets", "معلقة مكرمية بوهو", "Boho Macramé Hanging", P(12956063), 1150, { rating: 4.8, sold90: 19 }],
    ["driftwood-macrame", "weaving-baskets", "مكرمية على عصاية خشب", "Driftwood Macramé", P(12956041), 1450, { rating: 4.7, sold90: 13 }],
    ["woven-wall-panel", "weaving-baskets", "لوحة مكرمية منسوجة", "Woven Wall Panel", P(35033796), 1350, { rating: 4.6, sold90: 11 }],
    ["fringe-macrame-set", "weaving-baskets", "طقم مكرمية بشراشيب", "Fringe Macramé Set", P(8503256), 1750, { rating: 4.5, sold90: 8 }],
    // Leather
    ["embossed-black-belt", "leather-goods", "حزام أسود منقوش", "Embossed Black Belt", P(38053161), 950, { rating: 4.7, sold90: 16 }],
    ["cognac-belt", "leather-goods", "حزام جلد كونياك", "Cognac Leather Belt", P(35322147), 890, { rating: 4.8, sold90: 21 }],
    ["gold-buckle-belt", "leather-goods", "حزام أسود بإبزيم دهبي", "Gold Buckle Belt", P(38053193), 920, { rating: 4.6, sold90: 12 }],
    ["forest-croc-belt", "leather-goods", "حزام أخضر كروكو", "Forest Croc Belt", P(35322142), 980, { rating: 4.5, sold90: 9 }],
    // Wood
    ["teak-bowl-slab", "wood-botanicals", "أوعية ساج على قرصة خشب", "Teak Bowls on a Slab", P(6944234), 1250, { rating: 4.8, sold90: 18 }],
    ["oak-bowl-set", "wood-botanicals", "وعاء خشب مع أطباق", "Oak Bowl Set", P(8251778), 890, { rating: 4.6, sold90: 14 }],
    ["stacked-teak-bowls", "wood-botanicals", "أوعية ساج متراصة", "Stacked Teak Bowls", P(6944987), 1150, { rating: 4.7, sold90: 12 }],
    ["walnut-pedestal-bowl", "wood-botanicals", "وعاء جوز على قاعدة", "Walnut Pedestal Bowl", P(6952248), 780, { rating: 4.9, sold90: 10 }],
  ],
});

export const GIFTS_LUXE = libraryTemplate({
  key: GIFTS_LUXE_KEY,
  version: 1,
  name: L("وَهَج", "Wahag"),
  description: L(
    "هدايا وشموع بروح أتيليه: فيديو شموع بتنوّر، أقسام بخط رفيع وأربع صفوف للأقسام. لمتاجر الهدايا الراقية والهاند ميد.",
    "Atelier-style gifts and candles: a candlelit video, ruled categories and four category rows. For premium gift and handmade stores.",
  ),
  category: "handmade",
  sortOrder: 1440,
  palette: ["#faf6f0", "#efe8de", "#2a2522", "#a8844f"],
  colors: {
    primary: "#2a2522",
    secondary: "#efe8de",
    background: "#faf6f0",
    foreground: "#1f1b18",
    muted: "#665c54",
    border: "#e3d9cc",
    accent: "#a8844f",
  },
  fonts: { heading: "El Messiri", body: "Readex Pro" },
  radius: 2,
  containerMaxWidth: 1400,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن وَهَج", "About"), seo: { title: L("عن وَهَج", "About Wahag") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("زورنا في الأتيليه", "Visit the atelier"),
        text: L("١٤ شارع البرازيل، الزمالك، القاهرة. مفتوح من ١٢ الضهر لـ ١٠ بالليل.", "14 Brazil St, Zamalek, Cairo. Open noon to 10pm."),
        heading: L("محتاج هدية لمناسبة معينة؟", "Need a gift for an occasion?"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التغليف والكروت والتوصيل.", "Wrapping, cards and delivery."),
        question: L("ممكن الهدية توصل باسمي لحد تاني؟", "Can you deliver a gift to someone else?"),
        answer: L(
          "أيوه، اكتب عنوان اللي هتهاديه ورسالة الكارت، وإحنا بنغلفها ونوصلها من غير فاتورة جوه العلبة. التوصيل في القاهرة والجيزة خلال يومين.",
          "Yes. Add their address and your card message, and we wrap and deliver it without a receipt inside. Cairo and Giza delivery takes two days.",
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
    copy: { reviews: L("كلام اللي اتهادوا", "From those who received it"), related: L("تكمّل الهدية", "To complete the gift") },
  },
});
