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
    "تسوّق سهل من هاتفك": L("شموع وخزف وهدايا مختارة", "Candles, ceramics and chosen gifts"),
    "الدفع عند الاستلام": L("صور ومواصفات لكل منتج", "Photos and details for every product"),
    "تتبّع طلبك": L("تتبّع طلبك", "Track your order"),
    "اسم متجرك": NAME,
    "المتجر": L("كل الهدايا", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر طلبًا", "Best sellers"),
    "من نحن": L("من نحن", "About"),
  },
  links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
});

const footer = lib("footer-centered-light", {
  text: {
    "اسم متجرك": NAME,
    "قطع مختارة بعناية لكل يوم.": L(
      `شموع وخزف وهدايا مصنوعة يدويًا. ١٤ شارع البرازيل، الزمالك، القاهرة، ${tel("٠١٢٢ ٧١٨ ٤٠٩٦")}، ${handle("hello@wahag.eg")}`,
      `Candles, ceramics and handmade gifts. 14 Brazil St, Zamalek, Cairo | ${tel("+20 122 718 4096")} | hello@wahag.eg`,
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
      "فيديو الواجهة": L("أربع شموع مضاءة بنقوش ذهبية", "Four gold-patterned candles burning"),
      "المجموعة الجديدة": L("مجموعة الشتاء", "The winter edit"),
      "تصميم هادئ لكل يوم": L("شموع وخزف وعلب هدايا", "Candles, ceramics and gift boxes"),
      "قطع مختارة بعناية لكل يوم.": L(
        "شموع صويا مصبوبة يدويًا وقطع خزف وعلب هدايا لكل مناسبة.",
        "Hand-poured soy candles, ceramics and gift boxes for every occasion.",
      ),
      "تسوّق الآن": L("اكتشف الهدايا", "Shop gifts"),
      "اكتشف الجديد": L("وصل حديثًا", "New in"),
    },
    links: { "/products": SHOP, "/products?sort=newest": NEW },
  }),
  lib("categories-ruled", {
    text: {
      "الأقسام": L("الأقسام", "Categories"),
      "تسوق بالقسم": L("هدايا لكل مناسبة", "Gifts for every occasion"),
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
      "كيف نعمل": L("صناعة يدوية", "Handmade"),
      "تفاصيل واضحة لكل منتج": L("شموع مصبوبة يدويًا", "Hand-poured candles"),
      "نعرض لكل منتج صورًا ومواصفات ومقاسات واضحة.": L(
        "شمع مصبوب على دفعات صغيرة، وقطع خزف مختارة، وعلب هدايا بأحجام وألوان مختلفة.",
        "Wax poured in small batches, chosen ceramics and gift boxes in several sizes and colours.",
      ),
      "اعرف أكثر": L("اعرف حكايتنا", "Our story"),
      "صورة المتجر": L("شموع مضاءة في أوعية زجاجية", "Candles glowing in glass jars"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("الكل", "All"),
    muted: [1, 3],
    nodes: { "صورة البطاقة": { style: { aspectRatio: "portrait" } } },
  }),
  lib("newsletter-ruled", {
    text: {
      "اشترك في نشرتنا البريدية": L("اشترك ليصلك الجديد أولًا", "Hear about new pieces first"),
      "كن أول من يعرف بالمنتجات الجديدة.": L("أخبار المنتجات الجديدة والمجموعات الموسمية.", "News of new pieces and seasonal edits."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن وَهَج", "About Wahag"), L("شموع وخزف وهدايا مصنوعة يدويًا.", "Candles, ceramics and handmade gifts.")),
  aboutStory(lib, {
    photo: PHOTOS.handmadePlates,
    alt: L("أطباق وأوعية خزف يدوي على قماش كتان", "Handmade ceramic plates and bowls on linen"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("قطع مختارة بعناية", "Pieces chosen with care"),
    text: L(
      "شموع وخزف وصابون وقطع من الخشب والجلد، لكل منها صور وتفاصيل واضحة.",
      "Candles, ceramics, soap, wood and leather, each with clear photos and details.",
    ),
    more: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
    button: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("شموع وخزف وهدايا مصنوعة يدويًا.", "Candles, ceramics and handmade gifts."),
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
    ["amber-jar-trio", "candles", "طقم ٣ شموع في أوعية عنبرية", "Amber Jar Candle Trio", P(7004676), 1250, { compareAtPrice: 1450, rating: 4.8, sold90: 61 }],
    ["clip-top-jar-candle", "candles", "شمعة في وعاء زجاجي بقفل", "Clip-Top Jar Candle", P(6311810), 690, { rating: 4.7, sold90: 38 }],
    ["noir-bowl-candle", "candles", "شمعة سوداء في وعاء خشبي", "Noir Candle in Wooden Bowl", P(11145797), 980, { rating: 4.8, sold90: 29 }],
    ["apothecary-amber-candle", "candles", "شمعة في وعاء عنبري", "Amber Apothecary Candle", P(7004675), 520, { rating: 4.6, sold90: 44 }],
    ["pressed-flower-candles", "candles", "شموع بورد مجفف", "Pressed Flower Candles", P(7233925), 1150, { rating: 5, sold90: 23 }],
    ["botanical-tin-candles", "candles", "شموع علب نحاس بأعشاب", "Botanical Tin Candles", P(11497486), 640, { rating: 4.5, sold90: 19, inStock: false }],
    ["eucalyptus-cork-candle", "candles", "شمعة زجاج أخضر بغطاء فلين", "Eucalyptus Cork Candle", P(6311850), 790, { rating: 4.7, sold90: 27 }],
    // Ceramics
    ["ring-stoneware-vase", "ceramics", "مزهرية خزف حجري بحلقة", "Ring Stoneware Vase", P(33105316), 1350, { isFeatured: true, rating: 4.9, sold90: 41 }],
    ["ribbed-white-vase", "ceramics", "مزهرية بيضاء مضلعة", "Ribbed White Vase", P(6770266), 760, { rating: 4.7, sold90: 35 }],
    ["fluted-plinth-vase", "ceramics", "مزهرية بيضاء مخططة", "Fluted White Vase", P(6944986), 690, { rating: 4.6, sold90: 22 }],
    ["moon-floor-vase", "ceramics", "مزهرية قمر بيضاء كبيرة", "Large Moon Vase", P(34022883), 2400, { compareAtPrice: 2750, rating: 4.8, sold90: 16 }],
    ["textured-vase-set", "ceramics", "طقم مزهريات خزف حجري بنقوش", "Textured Stoneware Vase Set", P(31493659), 2900, { rating: 4.8, sold90: 14 }],
    ["fustat-clay-set", "ceramics", "طقم أباريق ومزهريات فخار", "Clay Jug and Vase Set", P(38001670), 1850, { rating: 4.9, sold90: 26 }],
    ["bud-vase-trio", "ceramics", "٣ مزهريات خزف حجري صغيرة", "Stoneware Bud Vase Trio", P(12859529), 980, { rating: 4.7, sold90: 31 }],
    ["glazed-brown-vases", "ceramics", "مزهريات بنية مزججة", "Glazed Brown Vases", P(32856216), 1650, { rating: 4.5, sold90: 12 }],
    // Gift boxes
    ["golden-gift-basket", "gift-boxes", "سلة هدايا بالسيلوفان", "Golden Gift Basket", P(27393960), 2650, { isFeatured: true, rating: 4.9, sold90: 52 }],
    ["linen-pouch-box", "gift-boxes", "علبة كرافت بكيس كتان", "Kraft Box with Linen Pouch", P(8015884), 420, { rating: 4.6, sold90: 47 }],
    ["teal-gift-tower", "gift-boxes", "علب هدايا فيروزية بشريط أسود", "Teal Gift Box Tower", P(33629669), 1450, { rating: 4.8, sold90: 24 }],
    ["gold-sparkle-box", "gift-boxes", "علبة هدايا ذهبية لامعة", "Gold Sparkle Gift Box", P(7826283), 560, { rating: 4.7, sold90: 33 }],
    ["blue-ribbon-box", "gift-boxes", "علبة هدايا زرقاء بشريط ذهبي", "Blue Box, Gold Ribbon", P(33774172), 480, { rating: 4.6, sold90: 28 }],
    ["red-gift-stack", "gift-boxes", "علب هدايا حمراء متراصة", "Red Gift Box Stack", P(6087540), 1250, { compareAtPrice: 1400, rating: 4.8, sold90: 21 }],
    ["emerald-satin-box", "gift-boxes", "علبة هدايا خضراء بشريط ساتان", "Emerald Satin Gift Box", P(31496295), 620, { rating: 4.7, sold90: 18 }],
    ["rose-gift-box", "gift-boxes", "علبة بيضاء بشريط أحمر ووردة", "White Box with a Rose", P(13983751), 890, { rating: 5, sold90: 39 }],
    // Soap & bath
    ["olive-cream-soaps", "soap-bath", "قطعتا صابون بالزيتون والكريمة", "Olive and Cream Soaps", P(4202469), 260, { rating: 4.8, sold90: 66 }],
    ["sage-dish-soap", "soap-bath", "صابونة مريمية على طبق", "Sage Soap on a Dish", P(6690176), 320, { rating: 4.7, sold90: 34 }],
    ["shampoo-bar-stack", "soap-bath", "شامبو صلب ٤ قطع", "Shampoo Bar Stack", P(3737603), 540, { rating: 4.6, sold90: 29 }],
    ["rosemary-layer-soap", "soap-bath", "صابون طبقات بإكليل الجبل", "Rosemary Layer Soap", P(29189982), 290, { rating: 4.8, sold90: 41 }],
    ["sculpted-soap-set", "soap-bath", "طقم صابون منحوت", "Sculpted Soap Set", P(8297186), 480, { rating: 4.5, sold90: 17 }],
    ["honey-oat-soaps", "soap-bath", "صابون عسل وشوفان", "Honey Oat Soaps", P(7173531), 350, { rating: 4.9, sold90: 37 }],
    ["clay-soap-squares", "soap-bath", "مكعبات صابون طين", "Clay Soap Squares", P(4857078), 310, { rating: 4.6, sold90: 22 }],
    ["rose-whip-set", "soap-bath", "طقم صابون وزبدة ورد", "Rose Butter and Soap Set", P(5928023), 590, { rating: 4.7, sold90: 25 }],
    // Macramé
    ["boho-macrame-hanging", "weaving-baskets", "معلقة مكرمية بطراز بوهيمي", "Boho Macramé Hanging", P(12956063), 1150, { rating: 4.8, sold90: 19 }],
    ["driftwood-macrame", "weaving-baskets", "مكرمية على عصا خشبية", "Driftwood Macramé", P(12956041), 1450, { rating: 4.7, sold90: 13 }],
    ["woven-wall-panel", "weaving-baskets", "لوحة مكرمية منسوجة", "Woven Wall Panel", P(35033796), 1350, { rating: 4.6, sold90: 11 }],
    ["fringe-macrame-set", "weaving-baskets", "طقم مكرمية بشراشيب", "Fringe Macramé Set", P(8503256), 1750, { rating: 4.5, sold90: 8 }],
    // Leather
    ["embossed-black-belt", "leather-goods", "حزام أسود منقوش", "Embossed Black Belt", P(38053161), 950, { rating: 4.7, sold90: 16 }],
    ["cognac-belt", "leather-goods", "حزام جلد كونياك", "Cognac Leather Belt", P(35322147), 890, { rating: 4.8, sold90: 21 }],
    ["gold-buckle-belt", "leather-goods", "حزام أسود بإبزيم ذهبي", "Gold Buckle Belt", P(38053193), 920, { rating: 4.6, sold90: 12 }],
    ["forest-croc-belt", "leather-goods", "حزام أخضر بنقشة جلد التمساح", "Forest Croc Belt", P(35322142), 980, { rating: 4.5, sold90: 9 }],
    // Wood
    ["teak-bowl-slab", "wood-botanicals", "أوعية ساج على لوح خشبي", "Teak Bowls on a Slab", P(6944234), 1250, { rating: 4.8, sold90: 18 }],
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
    "هدايا وشموع بروح المشغل اليدوي: فيديو شموع مضاءة، أقسام بخط رفيع وأربعة صفوف للأقسام. لمتاجر الهدايا الراقية والمنتجات اليدوية.",
    "Atelier-style gifts and candles: a candlelit video, ruled categories and four category rows. For premium gift and handmade stores.",
  ),
  category: "handmade",
  style: ["luxe"],
  sortOrder: 1440,
  palette: ["#faf6f0", "#efe8de", "#2a2522", "#a8844f"],
  colors: {
    primary: "#2a2522",
    secondary: "#efe8de",
    background: "#ffffff",
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
        title: L("تواصل معنا", "Contact us"),
        text: L("١٤ شارع البرازيل، الزمالك، القاهرة. من ١٢ ظهرًا حتى ١٠ مساءً.", "14 Brazil St, Zamalek, Cairo. Open noon to 10pm."),
        heading: L("تبحث عن هدية لمناسبة معينة؟", "Looking for a gift for an occasion?"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الهدايا والمنتجات والطلبات.", "Gifts, products and orders."),
        question: L("هل يمكن إرسال الهدية إلى عنوان آخر؟", "Can I send a gift to another address?"),
        answer: L(
          "اكتب عنوان المستلم عند إتمام الطلب. تظهر تكلفة الشحن ومدته عند إتمام الطلب.",
          "Enter the recipient's address at checkout. Shipping cost and time are shown at checkout.",
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
    copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("لإكمال الهدية", "To complete the gift") },
  },
});
