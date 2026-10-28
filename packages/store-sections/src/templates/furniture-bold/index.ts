/**
 * Furniture Bold (2026-10-28, furniture niche, bold / promotional): white
 * paper, near-black ink, a loud tangerine and a sunny yellow, Alexandria
 * headings over Cairo, 16px corners and a 1280px container. A colourful,
 * high-energy home: a scrolling ticker header, a three-slide hero carousel,
 * round category stories, boxed best sellers, a wide workshop story, four
 * category rows with rounded frames, a photo newsletter banner and the
 * help footer. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-28): furniture and interiors
 * only, no people, no brand labels, none used twice.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const FURNITURE_BOLD_KEY = "furniture-bold";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(FURNITURE_BOLD_KEY, getDesign(id)!, { corners: 16, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  slideShowroom: pexels(6969830, 1920),
  slideBeige: pexels(39828916, 1920),
  slideLiving: pexels(1643383, 1920),
  aerialLounge: pexels(19955699, 1200),
  bedroomStory: pexels(6312357, 1200),
  newsletter: pexels(1457842, 1200),
  // Category circles.
  catSofas: pexels(6580416, 1200),
  catArmchairs: pexels(8066334, 1200),
  catTables: pexels(7538106, 1200),
  catLighting: pexels(11681194, 1200),
  catBeds: pexels(27164976, 1200),
  catDecor: pexels(27180805, 1200),
};

const NAME = L("كنبة", "Kanaba");

const header = lib("header-centered-ticker", {
  text: {
    "توصيل لكل محافظات مصر": L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
    "الدفع عند الاستلام": L("ادفع عند الاستلام", "Pay on delivery"),
    "استبدال سهل خلال ١٤ يوم": L("تتبّع طلبك من صفحة طلباتي", "Track your order from My orders"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر مبيعًا", "Best sellers"),
    "من نحن": L("عن كنبة", "About"),
    "تواصل معنا": L("تتبّع طلبك", "Track order"),
  },
  links: { "/products": [undefined, undefined, NEW], "/blog": BEST, "/contact": "/profile/orders" },
});

const footer = lib("footer-help", {
  text: {
    "واتساب": L("واتساب", "WhatsApp"),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L("٠١٠٠ ٦٤٨ ٣٢١٠", "+20 100 648 3210"),
    "اتصل": L("اتصل بينا", "Call us"),
    "تتبع طلبك": L("تتبّع طلبك", "Track your order"),
    "برقم الطلب": L("من صفحة طلباتي", "From My orders"),
    "اسم متجرك": NAME,
    "تسوق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل المنتجات", "All products"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "من نحن": L("عن كنبة", "About Kanaba"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ كنبة. كل الحقوق محفوظة.", "© 2026 Kanaba. All rights reserved."),
  },
  links: {
    "https://wa.me/201001234567": "https://wa.me/201006483210",
    "tel:+201001234567": "tel:+201006483210",
    "/contact": "/profile/orders",
    "/products": [SHOP, NEW, BEST, RATED],
  },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.slideShowroom, PHOTOS.slideBeige, PHOTOS.slideLiving],
    text: {
      "صورة الحملة الأولى": L("صالة بكنبة تيل وفوتيه فوشيا", "A living room with a teal sofa and a fuchsia chair"),
      "وصل حديثًا": L("المجموعة الجديدة", "Just landed"),
      "الموسم الجديد وصل": L("ألوان تصحّي البيت", "Colour that wakes up the room"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("كنب وفوتيهات بألوان جريئة، وتوصيل وتركيب خلال أسبوع.", "Bold sofas and armchairs, delivered and assembled within a week."),
      "تسوّق الجديد": L("شوف الجديد", "Shop new in"),
      "صورة الحملة الثانية": L("صالة بكنبة بيج ومخدات زرقا", "A beige sofa with blue cushions"),
      "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
      "المفضّلة عند عملائنا": L("الكنب اللي الكل بيسأل عليه", "The sofas everyone asks about"),
      "القطع اللي بترجع لها كل مرة.": L("مريحة، سهلة التنضيف، وقماشها بيستحمل الأطفال والقطط.", "Comfortable, easy to clean, and fabrics that survive kids and cats."),
      "شوف الأكثر مبيعًا": L("شوف الأكثر مبيعًا", "Shop best sellers"),
      "صورة الحملة الثالثة": L("صالة مفتوحة بركنة بيج", "An open living room with a beige corner sofa"),
      "عروض الأسبوع": L("صالة كاملة", "The full room"),
      "خصومات لفترة محدودة": L("كمّل صالتك في طلب واحد", "Finish your living room in one order"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("كنبة، فوتيه، ترابيزة وإضاءة بتتنسق مع بعض.", "A sofa, an armchair, a table and lighting that match."),
      "تسوّق العروض": L("تسوّق كل القطع", "Shop everything"),
    },
    links: { "/products": [NEW, BEST, SHOP] },
  }),
  lib("categories-circles", {
    text: { "بتدوّر على إيه؟": L("بتدوّر على إيه؟", "What are you looking for?") },
  }),
  lib("products-boxed", {
    text: {
      "أساسيات كل يوم": L("الأكثر مبيعًا الشهر ده", "This month’s best sellers"),
      "عرض الكل": L("عرض الكل", "View all"),
    },
    links: { "/products": BEST },
  }),
  lib("about-wide", {
    photo: [undefined, undefined, undefined, undefined, undefined, undefined, PHOTOS.aerialLounge],
    text: {
      "كل منتج بيتراجع قبل ما يوصلك": L("من ورشتنا في دمياط لصالتك", "From our Damietta workshop to your living room"),
      "صورة المتجر": L("صالة من فوق بكنبتين جلد", "A living room from above with two leather sofas"),
      "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف، عشان تفتح العلبة وانت مطمن.": L(
        "+١٢٠٠٠ بيت مصري فرشناه. بنصنع كل كنبة بإيدينا، بنجرب القماش قبل ما ينزل، وبنضمن الهيكل سنتين.",
        "12,000+ Egyptian homes furnished. We build every sofa by hand, test every fabric first, and guarantee frames for two years.",
      ),
      "شوف إزاي بنشتغل": L("اعرف حكايتنا", "Our story"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("شوف الكل", "See all"),
    nodes: { "صورة المنتج": { style: { radius: 16 } } },
  }),
  lib("newsletter-banner", {
    photo: [undefined, undefined, undefined, undefined, PHOTOS.newsletter],
    text: {
      "صورة من المتجر": L("صالة بكنبة كحلي وشباك على البحر", "A navy sofa by a sea-view window"),
      "خليك قريب": L("خليك قريب", "Stay close"),
      "اعرف المجموعة الجديدة قبل الكل": L("اعرف الألوان الجديدة قبل الكل", "See the new colours first"),
      "إيميل واحد في الأسبوع فيه القطع الجديدة والعروض الخاصة.": L("إيميل واحد في الأسبوع فيه القطع الجديدة وأفكار لتنسيق الألوان.", "One email a week with new pieces and colour ideas."),
      "من غير رسائل مزعجة، وتقدر تلغي في أي وقت.": L("من غير رسائل مزعجة، وتقدر تلغي في أي وقت.", "No spam, unsubscribe any time."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن كنبة", "About Kanaba"), L("كنب وأثاث بألوان جريئة، معمول في دمياط.", "Bold, colourful furniture, made in Damietta.")),
  aboutStory(lib, {
    photo: PHOTOS.bedroomStory,
    alt: L("صالة بكنبة كحلي وفوتيهين بيج", "A navy sofa with two beige armchairs"),
    eyebrow: L("من ٢٠١٥", "Since 2015"),
    title: L("الأثاث مش لازم يكون بيج", "Furniture doesn’t have to be beige"),
    text: L("بدأنا بكنبة واحدة لونها برتقالي، والناس طلبت منها مية. من ساعتها وإحنا بنعمل ألوان تفرّح.", "We started with one orange sofa and got a hundred orders for it. We have made joyful colours ever since."),
    more: L("كل قطعة بتتنجد عندنا في دمياط، وبنوصلها ونركبها في كل مصر.", "Every piece is upholstered in our Damietta workshop and delivered and assembled across Egypt."),
    button: L("تسوّق الأكثر مبيعًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("كنب وأثاث بألوان جريئة، معمول في دمياط.", "Bold, colourful furniture, made in Damietta."),
  categories: [
    ["sofas", "الكنب", "Sofas", PHOTOS.catSofas],
    ["armchairs", "الفوتيهات", "Armchairs", PHOTOS.catArmchairs],
    ["tables", "الترابيزات والسفرة", "Tables & dining", PHOTOS.catTables],
    ["lighting", "الإضاءة", "Lighting", PHOTOS.catLighting],
    ["beds", "غرف النوم", "Bedroom", PHOTOS.catBeds],
    ["decor", "الديكور", "Decor", PHOTOS.catDecor],
  ],
  products: [
    // Sofas
    ["ocean-blue-sofa", "sofas", "كنبة أوشن أزرق", "Ocean Blue Sofa", P(2986011), 24900, { isFeatured: true, rating: 4.9, sold90: 88 }],
    ["lagoon-lounge-sectional", "sofas", "ركنة لاجون رمادي", "Lagoon Lounge Sectional", P(12289396), 18900, { compareAtPrice: 21500, rating: 4.7, sold90: 61 }],
    ["cobalt-modular-sofa", "sofas", "كنبة كوبالت مودولار", "Cobalt Modular Sofa", P(6438762), 39500, { rating: 4.8, sold90: 47 }],
    ["cognac-leather-sofa", "sofas", "كنبة جلد كونياك", "Cognac Leather Sofa", P(6480707), 34900, { rating: 4.8, sold90: 39 }],
    ["mint-wall-sofa", "sofas", "كنبة رمادي ٣ مقاعد", "Grey Three-Seater", P(12277216), 21500, { rating: 4.6, sold90: 34 }],
    ["l-shape-stripe-sofa", "sofas", "ركنة L مقلمة", "Striped L-Shape Sofa", P(4172381), 45900, { compareAtPrice: 52000, rating: 4.5, sold90: 22 }],
    ["cloud-loveseat", "sofas", "كنبة مقعدين كلاود", "Cloud Loveseat", P(10912069), 15900, { rating: 4.7, sold90: 28 }],
    ["jungle-grey-sofa", "sofas", "كنبة جنجل رمادي", "Jungle Grey Sofa", P(6758245), 27500, { rating: 4.6, sold90: 19 }],
    // Armchairs
    ["mustard-tufted-pair", "armchairs", "فوتيه مستردة كابيتونيه", "Mustard Tufted Armchair", P(923192), 8900, { rating: 4.8, sold90: 52 }],
    ["red-blue-tub-chairs", "armchairs", "كرسي تَب أحمر وأزرق", "Red & Blue Tub Chair", P(2766975), 4900, { compareAtPrice: 5900, rating: 4.7, sold90: 66 }],
    ["emerald-gold-chair", "armchairs", "كرسي زمردي برجل دهبي", "Emerald Gold-Leg Chair", P(12379606), 5800, { rating: 4.9, sold90: 43 }],
    ["tan-leather-lounge", "armchairs", "فوتيه جلد عسلي", "Tan Leather Lounge Chair", P(20794782), 12900, { rating: 4.8, sold90: 31 }],
    ["sunshine-shell-chair", "armchairs", "فوتيه صن شاين", "Sunshine Shell Chair", P(34984836), 7400, { rating: 4.6, sold90: 37 }],
    ["yellow-wingback", "armchairs", "فوتيه بظهر عالي أصفر", "Yellow Wingback", P(22431340), 9600, { rating: 4.7, sold90: 25 }],
    ["azure-button-chair", "armchairs", "فوتيه أزور بزراير", "Azure Button Armchair", P(8082560), 8200, { rating: 4.5, sold90: 18 }],
    ["fringe-velvet-stools", "armchairs", "كرسي قطيفة بشراشيب", "Fringed Velvet Slipper Chair", P(28827983), 6300, { rating: 4.4, sold90: 14 }],
    // Tables & dining
    ["scandi-round-dining", "tables", "سفرة مدورة إسكندنافي", "Scandi Round Dining Set", P(7046002), 16900, { rating: 4.7, sold90: 29 }],
    ["ring-glass-coffee-table", "tables", "ترابيزة صالون زجاج بحلقة", "Ring Glass Coffee Table", P(35741389), 14500, { compareAtPrice: 16900, rating: 4.8, sold90: 33 }],
    ["butter-side-table", "tables", "ترابيزة جانبية زبدة", "Butter Side Table", P(40287716), 2900, { rating: 4.6, sold90: 41 }],
    ["white-hex-side-table", "tables", "ترابيزة جانبية بيضا", "White Hex Side Table", P(11311199), 2400, { rating: 4.5, sold90: 27 }],
    ["slatted-oak-coffee-table", "tables", "ترابيزة صالون بلوط", "Slatted Oak Coffee Table", P(7607461), 6800, { rating: 4.8, sold90: 36 }],
    ["birch-round-table", "tables", "ترابيزة سفرة بتولا مدورة", "Birch Round Table", P(7180275), 9900, { rating: 4.6, sold90: 15 }],
    ["farmhouse-dining-table", "tables", "سفرة فارم هاوس خشب", "Farmhouse Dining Table", P(8113029), 18500, { rating: 4.7, sold90: 12 }],
    ["cherry-dining-set", "tables", "سفرة كريز ٦ كراسي", "Cherry Dining Set", P(3935317), 24900, { rating: 4.5, sold90: 9 }],
    // Lighting
    ["slim-arc-floor-lamp", "lighting", "أباجورة أرضي رفيعة", "Slim Floor Lamp", P(32684360), 3900, { rating: 4.6, sold90: 34 }],
    ["sage-reading-lamp", "lighting", "أباجورة قراءة مريمية", "Sage Reading Lamp", P(29236098), 3400, { rating: 4.7, sold90: 29 }],
    ["swing-arm-desk-lamps", "lighting", "أباجورة مكتب ذراع", "Swing-Arm Desk Lamp", P(7439756), 1450, { rating: 4.8, sold90: 57 }],
    ["ember-bedside-lamp", "lighting", "أباجورة كومودينو حمرا", "Ember Bedside Lamp", P(6641820), 1650, { compareAtPrice: 1950, rating: 4.5, sold90: 23 }],
    ["tangerine-dome-lamp", "lighting", "أباجورة قبة برتقالي", "Tangerine Dome Lamp", P(8872548), 2200, { rating: 4.9, sold90: 48 }],
    ["matte-black-pendants", "lighting", "إضاءة معلقة أسود مطفي", "Matte Black Pendants", P(13108827), 2600, { rating: 4.6, sold90: 21 }],
    ["mosaic-glass-lamps", "lighting", "أباجورة موزاييك", "Mosaic Glass Lamp", P(38669981), 1900, { rating: 4.8, sold90: 39 }],
    ["swing-wall-lamp", "lighting", "أباليك حيطة متحرك", "Swing Wall Lamp", P(12522583), 1750, { rating: 4.4, sold90: 12 }],
    // Bedroom
    ["navy-headboard-bed", "beds", "سرير بظهر خشب على حيطة كحلي", "Walnut Headboard Bed", P(4993094), 19900, { rating: 4.7, sold90: 14 }],
    ["sunlit-platform-bed", "beds", "سرير بلاتفورم", "Sunlit Platform Bed", P(36816982), 16500, { rating: 4.6, sold90: 18 }],
    ["cottage-white-bed", "beds", "سرير كوتيدج أبيض", "Cottage White Bed", P(8583606), 17900, { compareAtPrice: 19900, rating: 4.5, sold90: 11 }],
    ["linen-layer-bed", "beds", "سرير لينن بمخدات", "Layered Linen Bed", P(15743375), 21900, { rating: 4.8, sold90: 16 }],
    // Decor
    ["painted-vase-set", "decor", "طقم فازات ملونة", "Painted Vase Set", P(8063852), 1650, { rating: 4.8, sold90: 31 }],
    ["sculpted-jug-vase", "decor", "فازة إبريق منحوتة", "Sculpted Jug Vase", P(19341648), 890, { rating: 4.6, sold90: 22 }],
    ["peach-vase-tray", "decor", "فازة خوخي بصينية", "Peach Vase with Tray", P(7572727), 690, { rating: 4.7, sold90: 26 }],
    ["macrame-wall-hanging", "decor", "معلقة مكرمية", "Macramé Wall Hanging", P(13211211), 1150, { rating: 4.5, sold90: 17 }],
  ],
});

export const FURNITURE_BOLD = libraryTemplate({
  key: FURNITURE_BOLD_KEY,
  version: 1,
  name: L("كنبة", "Kanaba"),
  description: L(
    "أثاث بألوان جريئة: سلايدر بثلاث صور، أقسام دايرية وأربع صفوف منتجات. للمتاجر اللي عايزة طاقة وبيع سريع.",
    "Bold, colourful furniture: a three-slide hero, round categories and four product rows. For stores that want energy and fast sales.",
  ),
  category: "home",
  sortOrder: 1210,
  palette: ["#ffffff", "#fff1ea", "#e2552f", "#ffd23f"],
  colors: {
    primary: "#d9481f",
    secondary: "#fff1ea",
    background: "#ffffff",
    foreground: "#151515",
    muted: "#5e5a57",
    border: "#f0dcd2",
    accent: "#ffd23f",
  },
  fonts: { heading: "Alexandria", body: "Cairo" },
  radius: 16,
  containerMaxWidth: 1280,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن كنبة", "About"), seo: { title: L("عن كنبة", "About Kanaba") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("كلمنا", "Talk to us"),
        text: L("١٤ شارع جامعة الدول العربية، المهندسين، الجيزة.", "14 Gameat El Dewal El Arabeya St, Mohandessin, Giza."),
        heading: L("محتار في اللون؟ ابعتلنا صورة صالتك", "Unsure about colour? Send us a photo of your room"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الألوان والتوصيل والضمان.", "Colours, delivery and guarantee."),
        question: L("أقدر أطلب الكنبة بلون تاني؟", "Can I order a sofa in another colour?"),
        answer: L(
          "أيوه، كل الكنب متاح بـ ١٢ لون قماش. ابعتلنا على واتساب ونبعتلك عينات، والتنفيذ بياخد ١٠ أيام عمل.",
          "Yes, every sofa comes in 12 fabric colours. Message us on WhatsApp for swatches; made-to-order takes 10 working days.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "side",
    band: "paper",
    extras: ["product-perks"],
    copy: { reviews: L("صالات عملائنا", "Our customers’ rooms"), related: L("ينفع معاها", "Goes well with") },
  },
});
