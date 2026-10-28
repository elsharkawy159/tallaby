/**
 * Furniture Warm (2026-10-28, furniture niche, warm / editorial): sand
 * paper, walnut brown and caramel, Noto Naskh Arabic headings over Almarai,
 * soft 8px corners and a 1360px container. A slow, magazine-like home: the
 * announcement header, one full-bleed photo of a reading corner, captioned
 * category cards with counts, best sellers, the workshop story beside a
 * photo, four category rows with 4:3 photos, a photo newsletter card and
 * the centred footer. Built from section library designs (`fromLibrary`).
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

export const FURNITURE_WARM_KEY = "furniture-warm";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(FURNITURE_WARM_KEY, getDesign(id)!, { corners: 8, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  hero: pexels(2079246, 1920),
  story: pexels(19650953, 1200),
  aboutPage: pexels(276528, 1200),
  newsletter: pexels(12289396, 1200),
  // Category cards.
  catSofas: pexels(17168851, 1200),
  catArmchairs: pexels(9330539, 1200),
  catTables: pexels(6908357, 1200),
  catLighting: pexels(16433482, 1200),
  catBeds: pexels(37323045, 1200),
  catDecor: pexels(35082703, 1200),
};

const NAME = L("سُكنى", "Sokna");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("أهلًا بيك في سُكنى · توصيل لكل محافظات مصر", "Welcome to Sokna · Delivery across Egypt"),
    "الدفع عند الاستلام": L("الدفع عند الاستلام", "Cash on delivery"),
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "المتجر": L("كل القطع", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("تتبّع طلبك", "Track order"),
    "من نحن": L("حكايتنا", "Our story"),
  },
  links: { "/products": [undefined, NEW, undefined, undefined, NEW], "/blog": "/profile/orders" },
});

const footer = lib("footer-centered", {
  text: {
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.": L(
      "أثاث خشب طبيعي معمول على مهل في ورشتنا بالعبور. ٢٢ شارع النهضة، المعادي، القاهرة · ٠١١٥ ٢٣٧ ٨٨٤٠ · hello@sokna.eg",
      "Solid-wood furniture made slowly in our Obour workshop. 22 El Nahda St, Maadi, Cairo · +20 115 237 8840 · hello@sokna.eg",
    ),
    "من نحن": L("حكايتنا", "Our story"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ سُكنى. كل الحقوق محفوظة.", "© 2026 Sokna. All rights reserved."),
  },
});

const home: Design[] = [
  lib("hero-fullbleed", {
    photo: [PHOTOS.hero],
    text: {
      "صورة الواجهة": L("ركن قراءة بكراسي خشب ورفوف كتب", "A reading corner with wooden chairs and bookshelves"),
      "المجموعة الجديدة": L("مجموعة البلوط والكتان", "The oak and linen edit"),
      "صُنعت لتدوم معك": L("بيت يشبهك، على مهلك", "A home that feels like you"),
      "خامات مختارة وتفاصيل هادئة، وتوصيل سريع لحد باب البيت.": L(
        "خشب طبيعي، كتان مغسول وألوان الأرض. قطع تتجمع حواليها العيلة كل يوم.",
        "Natural wood, washed linen and earthy tones. Pieces the family gathers around every day.",
      ),
      "تسوّق الآن": L("تسوّق المجموعة", "Shop the edit"),
      "شوف الجديد": L("وصل حديثًا", "New in"),
    },
    links: { "/products": SHOP, "/products?sort=newest": NEW },
  }),
  lib("categories-captioned", {
    text: {
      "اكتشف الأقسام": L("ركن لكل حاجة في البيت", "A corner for everything"),
      "كل الأقسام": L("كل القطع", "Shop all"),
      "منتج": L("قطعة", "pieces"),
    },
  }),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("القطع المفضلة عندكم", "Your favourite pieces"),
      "أحدث المنتجات اللي نزلت المتجر.": L("اللي بيتطلب كل أسبوع، وبيخلص بسرعة.", "What gets ordered every week, and sells out fast."),
      "عرض الكل": L("الأكثر مبيعًا", "All best sellers"),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers" }],
  }),
  lib("about-split-story", {
    photo: [undefined, undefined, PHOTOS.story],
    text: {
      "صورة القصة": L("صالة بكنبة بيج مودولار وحيطة طوب", "A modular beige sofa against a brick wall"),
      "من ورشتنا": L("من ورشتنا", "From our workshop"),
      "متصمم عشانك ومعمول في القاهرة": L("معمول على مهل، عشان يعيش", "Made slowly, made to last"),
      "بنعمل كميات صغيرة عشان كل قطعة تفضل مميزة ومفيش حاجة تترمي.": L(
        "بنشتغل بخشب البلوط والزان المجفف، وبنعمل كميات صغيرة عشان كل قطعة تتشطب بإيد واحد من صنايعيتنا.",
        "We work in kiln-dried oak and beech, in small batches, so every piece is finished by hand by one of our makers.",
      ),
      "كل قطعة بتتقص وتتخيط عند فريقنا في المعادي.": L(
        "+٨٠٠٠ بيت في مصر فيه قطعة من سُكنى، وتقييمنا ٤٫٨ من ٥.",
        "8,000+ homes in Egypt have a Sokna piece, rated 4.8 out of 5.",
      ),
      "حكايتنا": L("اقرا حكايتنا", "Read our story"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("كل القطع", "Shop all"),
    nodes: { "صورة البطاقة": { style: { aspectRatio: "landscape" } } },
  }),
  lib("newsletter-photo", {
    photo: [undefined, undefined, undefined, PHOTOS.newsletter],
    text: {
      "صورة من المتجر": L("صالة رمادي بترابيزتين مدورين", "A grey living room with two round tables"),
      "للمشتركين": L("رسالة سُكنى", "The Sokna letter"),
      "خد ١٠٪ خصم على أول طلب": L("أفكار للبيت، كل شهر", "Ideas for home, every month"),
      "اشترك عشان توصلك المنتجات الجديدة والعروض الخاصة.": L(
        "قطع جديدة من الورشة، وطرق بسيطة تخلّي بيتك أدفى.",
        "New pieces from the workshop, and simple ways to make your home warmer.",
      ),
      "بدون رسائل مزعجة. تقدر تلغي في أي وقت.": L("بدون رسائل مزعجة. تقدر تلغي في أي وقت.", "No spam. Unsubscribe any time."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("حكايتنا", "Our story"), L("أثاث خشب طبيعي، معمول على مهل في القاهرة.", "Solid-wood furniture, made slowly in Cairo.")),
  aboutStory(lib, {
    photo: PHOTOS.aboutPage,
    alt: L("معرض بكنب بيج وترابيزة صالون", "A showroom with beige sofas and a coffee table"),
    eyebrow: L("من ٢٠١٨", "Since 2018"),
    title: L("ورشة صغيرة في العبور", "A small workshop in Obour"),
    text: L("بدأنا بأربع صنايعية وفكرة واحدة: أثاث بسيط من خشب حقيقي، يتصلح بدل ما يترمي.", "We started with four makers and one idea: simple furniture in real wood that gets repaired, not thrown away."),
    more: L("ولسه كل قطعة بتتشطب بالإيد، وبنصلّح أي قطعة من عندنا مهما كان عمرها.", "Every piece is still hand-finished, and we repair any Sokna piece, whatever its age."),
    button: L("تسوّق المفضلة", "Shop favourites"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أثاث خشب طبيعي، معمول على مهل في القاهرة.", "Solid-wood furniture, made slowly in Cairo."),
  categories: [
    ["sofas", "الكنب", "Sofas", PHOTOS.catSofas],
    ["armchairs", "الكراسي والفوتيهات", "Chairs", PHOTOS.catArmchairs],
    ["tables", "السفرة والترابيزات", "Dining & tables", PHOTOS.catTables],
    ["lighting", "الإضاءة", "Lighting", PHOTOS.catLighting],
    ["beds", "غرف النوم", "Bedroom", PHOTOS.catBeds],
    ["decor", "الفخار والديكور", "Pottery & decor", PHOTOS.catDecor],
  ],
  products: [
    // Sofas
    ["sand-linen-sofa", "sofas", "كنبة كتان رملي", "Sand Linen Sofa", P(12277196), 26500, { isFeatured: true, rating: 4.9, sold90: 58 }],
    ["cotton-cloud-sofa", "sofas", "كنبة قطن أبيض بمخدات", "Cotton Cloud Sofa", P(12285890), 29900, { rating: 4.8, sold90: 46 }],
    ["oak-daybed", "sofas", "دايبد بلوط بمرتبة", "Oak Daybed", P(4352247), 17500, { rating: 4.7, sold90: 31 }],
    ["cream-three-seater", "sofas", "كنبة كريم ٣ مقاعد", "Cream Three-Seater", P(30440152), 23900, { compareAtPrice: 26900, rating: 4.8, sold90: 39 }],
    ["saddle-leather-sofa", "sofas", "كنبة جلد سرج", "Saddle Leather Sofa", P(6480707), 34500, { rating: 4.7, sold90: 21 }],
    ["ink-velvet-sofa", "sofas", "كنبة قطيفة كحلي", "Ink Velvet Sofa", P(30386991), 31500, { rating: 4.6, sold90: 17 }],
    ["clay-linen-sofa", "sofas", "كنبة كتان طيني", "Clay Linen Sofa", P(7018400), 27900, { rating: 4.5, sold90: 14 }],
    ["ribbed-ivory-sofa", "sofas", "كنبة عاجي مضلعة", "Ribbed Ivory Sofa", P(8580720), 32900, { rating: 4.7, sold90: 11, inStock: false }],
    // Chairs
    ["pebble-swivel-chair", "armchairs", "فوتيه بيبل دوّار", "Pebble Swivel Chair", P(8066334), 8900, { rating: 4.8, sold90: 44 }],
    ["walnut-sunlit-armchair", "armchairs", "فوتيه جوز بمخدة", "Walnut Armchair", P(32710106), 11500, { rating: 4.9, sold90: 37 }],
    ["patchwork-lounge-chair", "armchairs", "كرسي باتشورك خشب", "Patchwork Lounge Chair", P(8389905), 7900, { rating: 4.6, sold90: 22 }],
    ["stone-tufted-armchair", "armchairs", "فوتيه حجري كابيتونيه", "Stone Tufted Armchair", P(11112735), 9400, { compareAtPrice: 10900, rating: 4.7, sold90: 29 }],
    ["cane-teak-chair", "armchairs", "كرسي خيزران وتيك", "Cane and Teak Chair", P(29350087), 6800, { rating: 4.9, sold90: 33 }],
    ["merlot-lounge-chair", "armchairs", "كرسي لاونج نبيتي", "Merlot Lounge Chair", P(6078545), 7200, { rating: 4.5, sold90: 13 }],
    ["slate-shell-chair", "armchairs", "كرسي صدفة رصاصي", "Slate Shell Chair", P(32553376), 6400, { rating: 4.4, sold90: 10 }],
    ["fireside-wing-chair", "armchairs", "فوتيه فايرسايد", "Fireside Wing Chair", P(18258470), 10200, { rating: 4.6, sold90: 16 }],
    // Dining & tables
    ["rustic-dining-set", "tables", "سفرة ريفي ٨ كراسي", "Rustic Dining Set", P(7538106), 32500, { rating: 4.8, sold90: 19 }],
    ["loft-long-table", "tables", "سفرة لوفت طويلة", "Loft Long Table", P(5472818), 28900, { rating: 4.7, sold90: 12 }],
    ["farm-bench-dining", "tables", "سفرة بدكّة خشب", "Farm Bench Dining Set", P(4221404), 26500, { compareAtPrice: 29500, rating: 4.9, sold90: 23 }],
    ["garden-cross-dining", "tables", "سفرة كروس للجنينة", "Garden Cross-Back Dining", P(10877168), 24900, { rating: 4.6, sold90: 15 }],
    ["mahogany-dining-set", "tables", "سفرة ماهوجني كلاسيك", "Mahogany Dining Set", P(3935326), 21500, { rating: 4.7, sold90: 18 }],
    ["round-slat-coffee-table", "tables", "ترابيزة صالون شرائح", "Round Slat Coffee Table", P(7607461), 5900, { rating: 4.8, sold90: 41 }],
    ["round-pedestal-dining", "tables", "سفرة مدورة برجل واحدة", "Round Pedestal Dining Set", P(7195598), 4800, { rating: 4.5, sold90: 26 }],
    ["chandelier-dining-set", "tables", "سفرة كريز بنجفة", "Cherry Dining Set", P(3935317), 23900, { rating: 4.6, sold90: 9 }],
    // Lighting
    ["pleated-floor-lamp", "lighting", "أباجورة أرضي بلسيه", "Pleated Floor Lamp", P(1612726), 3600, { rating: 4.8, sold90: 32 }],
    ["swing-arm-floor-lamp", "lighting", "أباجورة أرضي بذراع", "Swing-Arm Floor Lamp", P(26346242), 4200, { rating: 4.7, sold90: 24 }],
    ["shelf-glow-floor-lamp", "lighting", "أباجورة أرضي بيضا", "White Glow Floor Lamp", P(18873546), 3300, { rating: 4.5, sold90: 15 }],
    ["paper-shade-lamp-pair", "lighting", "أباجورة ورق ثنائي", "Paper Shade Lamp Pair", P(12648787), 4600, { compareAtPrice: 5200, rating: 4.6, sold90: 19 }],
    ["vintage-brass-table-lamp", "lighting", "أباجورة نحاس فينتدج", "Vintage Brass Table Lamp", P(6053887), 2600, { rating: 4.9, sold90: 38 }],
    ["linen-cylinder-lamp", "lighting", "أباجورة كتان أسطواني", "Linen Cylinder Lamp", P(17994856), 1850, { rating: 4.7, sold90: 29 }],
    ["clay-bedside-lamp", "lighting", "أباجورة فخار للكومودينو", "Clay Bedside Lamp", P(18280834), 2100, { rating: 4.8, sold90: 27 }],
    ["wicker-pendant-trio", "lighting", "ثلاثي إضاءة خوص معلقة", "Wicker Pendant Trio", P(17299918), 3900, { rating: 4.6, sold90: 21 }],
    // Bedroom
    ["gallery-oak-bed", "beds", "سرير بلوط بسيط", "Simple Oak Bed", P(31173588), 18900, { rating: 4.9, sold90: 22 }],
    ["reclaimed-platform-bed", "beds", "سرير خشب معاد تدويره", "Reclaimed Platform Bed", P(5644286), 22500, { rating: 4.7, sold90: 14 }],
    ["pine-slat-bed", "beds", "سرير صنوبر شرائح", "Pine Slat Bed", P(7055750), 14900, { compareAtPrice: 16500, rating: 4.6, sold90: 17 }],
    ["botanical-iron-bed", "beds", "سرير حديد أسود", "Black Iron Bed", P(5152681), 12900, { rating: 4.5, sold90: 11 }],
    // Pottery & decor
    ["sand-jug-vases", "decor", "فازات إبريق رملي", "Sand Jug Vases", P(33126633), 950, { rating: 4.8, sold90: 28 }],
    ["slate-orchid-vases", "decor", "فازات أردوازي", "Slate Bud Vases", P(13907998), 780, { rating: 4.6, sold90: 19 }],
    ["terracotta-bud-vases", "decor", "فازات تراكوتا صغيرة", "Terracotta Bud Vases", P(27180805), 640, { rating: 4.7, sold90: 24 }],
    ["dried-palm-bouquet", "decor", "بوكيه سعف مجفف", "Dried Palm Bouquet", P(6963598), 850, { rating: 4.5, sold90: 16 }],
  ],
});

export const FURNITURE_WARM = libraryTemplate({
  key: FURNITURE_WARM_KEY,
  version: 1,
  name: L("سُكنى", "Sokna"),
  description: L(
    "أثاث خشب دافي بروح مجلة: صورة كبيرة، أقسام بعدد القطع وحكاية الورشة. لمتاجر الأثاث الطبيعي والهاند ميد.",
    "Warm, editorial wood furniture: one big photo, categories with piece counts and the workshop story. For natural and handmade furniture stores.",
  ),
  category: "home",
  sortOrder: 1220,
  palette: ["#f4ede4", "#e9dfd2", "#7a4b2e", "#c9a27a"],
  colors: {
    primary: "#7a4b2e",
    secondary: "#e9dfd2",
    background: "#f4ede4",
    foreground: "#2f2a24",
    muted: "#6e6257",
    border: "#ddd0c0",
    accent: "#c9a27a",
  },
  fonts: { heading: "Noto Naskh Arabic", body: "Almarai" },
  radius: 8,
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
        title: L("تعالى زورنا", "Come and visit"),
        text: L("٢٢ شارع النهضة، المعادي، القاهرة. مفتوح كل يوم من ١١ الصبح لـ ١٠ بالليل.", "22 El Nahda St, Maadi, Cairo. Open daily from 11am to 10pm."),
        heading: L("اسألنا عن أي قطعة", "Ask us about any piece"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الخشب والتوصيل والصيانة.", "Wood, delivery and care."),
        question: L("إزاي أحافظ على الخشب؟", "How do I care for the wood?"),
        answer: L(
          "امسحه بقماشة ناشفة، وادهنه بزيت الكتان مرة كل ٦ شهور. ولو اتخدش ابعتلنا صورة على واتساب ونقولك تعمل إيه.",
          "Wipe it with a dry cloth and oil it with linseed oil every six months. If it gets scratched, send us a photo on WhatsApp and we will tell you what to do.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    band: "shelf",
    extras: ["product-perks"],
    copy: { reviews: L("من بيوت عملائنا", "From our customers’ homes"), related: L("قطع تليق معاها", "Pieces that suit it") },
  },
});
