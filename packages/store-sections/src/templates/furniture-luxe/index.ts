/**
 * Furniture Luxe (2026-10-28, furniture niche, premium / minimal): ivory
 * paper, espresso ink and brass, Amiri headings over IBM Plex Sans Arabic,
 * square corners and a wide 1440px container. A quiet, gallery-like home:
 * top bar header, a background video of a marble-and-brass living room,
 * photo tiles, best sellers, the showroom story, four category rows,
 * a centred newsletter and the wordmark footer. Built from section library
 * designs (`fromLibrary`).
 *
 * Photos and video: Pexels, each checked by eye (2026-10-28): furniture and
 * interiors only, no people, no brand labels, none used twice.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels, pexelsVideo, pexelsVideoPoster } from "../library-template";

export const FURNITURE_LUXE_KEY = "furniture-luxe";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(FURNITURE_LUXE_KEY, getDesign(id)!, { corners: 0, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  heroVideo: pexelsVideo(29466012, "12684183_1920_1080_60fps.mp4"),
  heroPoster: pexelsVideoPoster(29466012),
  palaceLounge: pexels(20418771, 1200),
  greyLounge: pexels(1648776, 1200),
  // Category tiles.
  catSofas: pexels(6312357, 1200),
  catArmchairs: pexels(13806257, 1200),
  catTables: pexels(7195595, 1200),
  catLighting: pexels(10821415, 1200),
  catBeds: pexels(14883343, 1200),
  catDecor: pexels(7119222, 1200),
};

const NAME = L("مرمر", "Marmar");

const header = lib("header-topbar", {
  text: {
    "توصيل سريع لكل محافظات مصر": L("توصيل وتركيب لحد البيت في كل محافظات مصر", "Delivery and assembly at home, across Egypt"),
    "الدفع عند الاستلام": L("ادفع عند الاستلام", "Pay on delivery"),
    "تتبّع طلبك": L("تتبّع طلبك", "Track your order"),
    "اسم متجرك": NAME,
    "المتجر": L("كل القطع", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر طلبًا", "Best sellers"),
    "من نحن": L("المعرض", "Our showroom"),
  },
  links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
});

const footer = lib("footer-wordmark", {
  text: {
    "تسوّق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل القطع", "All pieces"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "من نحن": L("عن مرمر", "About Marmar"),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L("٠١٢٢ ٤٨٦ ٣٩٠٥", "+20 122 486 3905"),
    "‏hello@store.com": L("‏hello@marmar.eg", "hello@marmar.eg"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ مرمر. كل الحقوق محفوظة.", "© 2026 Marmar. All rights reserved."),
  },
  links: { "/products": [SHOP, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-video", {
    photo: [PHOTOS.heroPoster],
    nodes: { "الفيديو": { props: { url: PHOTOS.heroVideo } }, "التعتيم": { style: { opacity: 30 } } },
    text: {
      "فيديو الواجهة": L("صالة بالرخام والنحاس", "A marble and brass living room"),
      "المجموعة الجديدة": L("مجموعة الخريف ٢٠٢٦", "The Autumn 2026 collection"),
      "مساحتك، بطريقتك": L("أثاث يعيش معاك سنين", "Furniture made to stay for years"),
      "قطع مختارة بعناية، وتوصيل سريع لحد باب البيت.": L(
        "خشب زان مجفف، قماش مقاوم للبقع وتركيب في البيت. كل قطعة متشطبة يدويًا في ورشتنا في دمياط.",
        "Kiln-dried beech, stain-resistant fabrics and assembly at home. Every piece is hand-finished in our Damietta workshop.",
      ),
      "تسوّق الآن": L("اكتشف المجموعة", "Explore the collection"),
      "شوف الجديد": L("وصل حديثًا", "New in"),
    },
    links: { "/products": SHOP, "/products?sort=newest": NEW },
  }),
  lib("categories-photo-tiles", {
    text: { "تسوّق حسب القسم": L("تسوّق حسب الغرفة", "Shop by room") },
  }),
  lib("products-minimal", {
    text: {
      "الأكثر طلباً": L("القطع الأكثر طلبًا", "Our most-loved pieces"),
      "الأكثر مبيعاً": L("الأكثر مبيعًا", "Best sellers"),
      "الجديد": L("وصل حديثًا", "New in"),
      "الأعلى تقييمًا": L("الأعلى تقييمًا", "Top rated"),
      "عرض الكل": L("كل القطع", "Shop all"),
    },
  }),
  lib("about-overlap", {
    person: [undefined, undefined, undefined, undefined, PHOTOS.palaceLounge],
    text: {
      "صورة المتجر": L("صالون بسقف عالي وكراسي حمرا", "A high-ceilinged salon with red armchairs"),
      "من داخل المتجر": L("من ١٩٩٨", "Since 1998"),
      "بدأنا من محل صغير": L("ثلاث أجيال في صناعة الأثاث", "Three generations of furniture makers"),
      "نختار كل منتج بعناية ونغلّفه بأيدينا، ونعرف عملاءنا بالاسم.": L(
        "بدأنا ورشة صغيرة في دمياط، واليوم عندنا معرض في التجمع الخامس. كل قطعة بتتقص وتتنجد وتتشطب عندنا، وبنضمن الهيكل ٥ سنين.",
        "We started as a small Damietta workshop and now have a showroom in New Cairo. Every piece is cut, upholstered and finished by us, with a five-year frame guarantee.",
      ),
      "اعرف أكثر": L("زور المعرض", "Visit the showroom"),
    },
  }),
  ...categoryRows(lib, { viewAll: L("عرض الكل", "View all"), muted: [1, 3] }),
  lib("newsletter-centered", {
    text: {
      "النشرة": L("نشرة مرمر", "The Marmar letter"),
      "خد ١٠٪ خصم على أول طلب": L("كن أول من يشوف المجموعات الجديدة", "See new collections first"),
      "اشترك عشان توصلك المنتجات الجديدة والعروض الخاصة.": L(
        "رسالة واحدة في الشهر: قطع جديدة، أفكار لتنسيق البيت ومواعيد افتتاح المجموعات في المعرض.",
        "One letter a month: new pieces, styling ideas and collection openings at the showroom.",
      ),
      "بدون رسائل مزعجة. تقدر تلغي في أي وقت.": L("بدون رسائل مزعجة. تقدر تلغي في أي وقت.", "No spam. Unsubscribe any time."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن مرمر", "About Marmar"), L("أثاث متشطب يدويًا من دمياط، من ١٩٩٨.", "Hand-finished furniture from Damietta, since 1998.")),
  aboutStory(lib, {
    photo: PHOTOS.greyLounge,
    alt: L("صالة بكنبة بني وستائر خضرا", "A living room with a brown sofa and green curtains"),
    eyebrow: L("الورشة والمعرض", "Workshop and showroom"),
    title: L("كل قطعة معمولة عندنا", "Every piece is made by us"),
    text: L("من اختيار الخشب لحد آخر غرزة في التنجيد، الشغل كله بيتعمل في ورشتنا.", "From choosing the wood to the last upholstery stitch, all the work happens in our workshop."),
    more: L("وبنضمن الهيكل ٥ سنين، والتركيب في البيت علينا.", "Frames carry a five-year guarantee, and assembly at home is on us."),
    button: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أثاث متشطب يدويًا من دمياط، من ١٩٩٨.", "Hand-finished furniture from Damietta, since 1998."),
  categories: [
    ["sofas", "الكنب والصالونات", "Sofas", PHOTOS.catSofas],
    ["armchairs", "الفوتيهات", "Armchairs", PHOTOS.catArmchairs],
    ["tables", "الترابيزات", "Tables", PHOTOS.catTables],
    ["lighting", "الإضاءة", "Lighting", PHOTOS.catLighting],
    ["beds", "غرف النوم", "Bedroom", PHOTOS.catBeds],
    ["decor", "الديكور", "Decor", PHOTOS.catDecor],
  ],
  products: [
    // Sofas
    ["noor-velvet-sofa", "sofas", "كنبة نور قطيفة زيتي", "Noor Velvet Sofa, Teal", P(30520758), 42500, { isFeatured: true, rating: 4.9, sold90: 64 }],
    ["zamalek-sand-sofa", "sofas", "كنبة الزمالك ٣ مقاعد", "Zamalek Three-Seater", P(12277196), 38900, { compareAtPrice: 44000, rating: 4.8, sold90: 51 }],
    ["midnight-velvet-sofa", "sofas", "كنبة ميدنايت كحلي", "Midnight Velvet Sofa", P(30386991), 36500, { rating: 4.7, sold90: 33 }],
    ["luna-curved-sofa", "sofas", "كنبة لونا منحنية", "Luna Curved Sofa", P(8987432), 47800, { rating: 5, sold90: 22 }],
    ["blush-linen-sofa", "sofas", "كنبة روز كتان", "Rose Linen Sofa", P(7018400), 33900, { rating: 4.6, sold90: 18 }],
    ["cloud-corner-sofa", "sofas", "ركنة كلاود رمادي", "Cloud Corner Sofa", P(6588592), 58500, { compareAtPrice: 64900, rating: 4.8, sold90: 41 }],
    ["channel-ivory-sofa", "sofas", "كنبة تشانل عاجي", "Channel Sofa, Ivory", P(8580720), 39500, { rating: 4.7, sold90: 12, inStock: false }],
    ["oval-lounge-sectional", "sofas", "ركنة أوفال مودرن", "Oval Lounge Sectional", P(12289396), 64900, { rating: 4.5, sold90: 9 }],
    // Armchairs
    ["wingback-leather-pair", "armchairs", "فوتيه جلد بظهر عالي", "Leather Wingback Armchair", P(33646085), 18900, { rating: 4.8, sold90: 47 }],
    ["charcoal-wing-chair", "armchairs", "فوتيه فحمي بمخدة", "Charcoal Wing Chair", P(18258470), 12500, { rating: 4.7, sold90: 29 }],
    ["emerald-shell-chair", "armchairs", "فوتيه زمردي صدفة", "Emerald Shell Chair", P(4278985), 9800, { compareAtPrice: 11500, rating: 4.9, sold90: 38 }],
    ["noir-lounge-chair", "armchairs", "فوتيه نوار", "Noir Lounge Chair", P(39680454), 14200, { rating: 4.6, sold90: 15 }],
    ["bordeaux-boucle-chair", "armchairs", "كرسي بوكليه نبيتي", "Bordeaux Bouclé Chair", P(5662650), 8900, { rating: 4.8, sold90: 26 }],
    ["patchwork-club-chair", "armchairs", "كرسي باتشورك خشب", "Patchwork Club Chair", P(8389905), 16500, { rating: 4.7, sold90: 19 }],
    ["caramel-lounge-chair", "armchairs", "فوتيه كراميل", "Caramel Lounge Chair", P(12269764), 10900, { rating: 4.5, sold90: 11 }],
    ["forest-cube-chair", "armchairs", "فوتيه كيوب أخضر", "Forest Cube Armchair", P(12961120), 9600, { rating: 4.4, sold90: 8 }],
    // Tables
    ["malachite-nesting-tables", "tables", "طقم ترابيزات مالاكيت", "Malachite Nesting Tables", P(15253318), 14800, { rating: 4.9, sold90: 36 }],
    ["travertine-side-table", "tables", "ترابيزة جانبية ترافرتين", "Travertine Side Table", P(6078539), 6900, { rating: 4.8, sold90: 44 }],
    ["glass-ring-coffee-table", "tables", "ترابيزة صالون زجاج", "Glass Ring Coffee Table", P(35741389), 8400, { compareAtPrice: 9900, rating: 4.6, sold90: 21 }],
    ["verde-marble-coffee-table", "tables", "ترابيزة رخام فيردي", "Verde Marble Coffee Table", P(19991831), 11200, { rating: 4.8, sold90: 30 }],
    ["blush-marble-nightstand", "tables", "كومودينو رخام روز", "Blush Marble Nightstand", P(35645257), 7400, { rating: 4.7, sold90: 14 }],
    ["round-walnut-dining", "tables", "سفرة جوز مدورة ٦ كراسي", "Round Walnut Dining Set", P(7195598), 52500, { rating: 4.9, sold90: 9 }],
    ["onyx-tray-tables", "tables", "ترابيزات أونيكس بصينية", "Onyx Tray Tables", P(7749060), 5800, { rating: 4.5, sold90: 17 }],
    ["black-glass-side-table", "tables", "ترابيزة جانبية زجاج أسود", "Black Glass Side Table", P(6044978), 3900, { rating: 4.4, sold90: 12 }],
    // Lighting
    ["brass-trio-floor-lamps", "lighting", "أباليك أرضي نحاس ثلاثي", "Brass Trio Floor Lamps", P(11850174), 9800, { rating: 4.8, sold90: 33 }],
    ["linen-drum-floor-lamp", "lighting", "أباجورة أرضي كتان", "Linen Drum Floor Lamp", P(32008152), 6400, { rating: 4.7, sold90: 25 }],
    ["crystal-cage-floor-lamp", "lighting", "أباجورة كريستال", "Crystal Cage Floor Lamp", P(17075439), 7900, { compareAtPrice: 8900, rating: 4.6, sold90: 19 }],
    ["classic-bronze-table-lamp", "lighting", "أباجورة برونز كلاسيك", "Classic Bronze Table Lamp", P(35392792), 4200, { rating: 4.9, sold90: 41 }],
    ["pleated-gold-lamp", "lighting", "أباجورة ذهبي بلسيه", "Pleated Gold Lamp", P(14540915), 3600, { rating: 4.7, sold90: 28 }],
    ["turned-wood-lamp", "lighting", "أباجورة خشب مخروط", "Turned Wood Table Lamp", P(5598270), 2900, { rating: 4.5, sold90: 13 }],
    ["amber-rib-pendant", "lighting", "نجفة معلقة عنبري", "Amber Ribbed Pendant", P(40493750), 3400, { rating: 4.8, sold90: 22 }],
    ["teal-enamel-pendants", "lighting", "إضاءة معلقة مينا تيل", "Teal Enamel Pendant", P(9628657), 2700, { rating: 4.4, sold90: 9 }],
    // Bedroom
    ["versailles-carved-bed", "beds", "سرير فرساي محفور", "Versailles Carved Bed", P(4682136), 46500, { rating: 4.8, sold90: 12 }],
    ["tufted-onyx-bed", "beds", "سرير كابيتونيه أسود", "Tufted Onyx Bed", P(29640156), 32900, { rating: 4.7, sold90: 16 }],
    ["emerald-panel-bed", "beds", "سرير بانيل زمردي", "Emerald Panel Bed", P(8135505), 28500, { compareAtPrice: 31900, rating: 4.6, sold90: 10 }],
    ["slate-upholstered-bed", "beds", "سرير منجد رصاصي", "Slate Upholstered Bed", P(6207451), 26900, { rating: 4.5, sold90: 8 }],
    // Decor
    ["monochrome-floor-vases", "decor", "طقم فازات أرضي أبيض", "Monochrome Floor Vases", P(38408974), 2400, { rating: 4.6, sold90: 14 }],
    ["matte-gourd-vases", "decor", "فازات قرعة مطفي", "Matte Gourd Vases", P(17619624), 1250, { rating: 4.7, sold90: 21 }],
    ["ivory-vase-trio", "decor", "ثلاثي فازات عاجي", "Ivory Vase Trio", P(8217492), 980, { rating: 4.8, sold90: 33 }],
    ["ring-vase-pampas", "decor", "فازة حلقة مع بامباس", "Ring Vase with Pampas", P(4207892), 750, { rating: 4.5, sold90: 19 }],
  ],
});

export const FURNITURE_LUXE = libraryTemplate({
  key: FURNITURE_LUXE_KEY,
  version: 1,
  name: L("مرمر", "Marmar"),
  description: L(
    "أثاث فاخر بهدوء: فيديو صالة بالرخام، صور غرف كبيرة وأربع صفوف للأقسام. لمعارض الأثاث الراقي.",
    "Quiet luxury furniture: a marble living-room video, large room photos and four category rows. For premium furniture showrooms.",
  ),
  category: "home",
  sortOrder: 1200,
  palette: ["#f7f4ee", "#ece6db", "#2b2622", "#b08d57"],
  colors: {
    primary: "#2b2622",
    secondary: "#ece6db",
    background: "#f7f4ee",
    foreground: "#1d1b18",
    muted: "#6b625a",
    border: "#ddd5c8",
    accent: "#b08d57",
  },
  fonts: { heading: "Amiri", body: "IBM Plex Sans Arabic" },
  radius: 0,
  containerMaxWidth: 1440,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن مرمر", "About"), seo: { title: L("عن مرمر", "About Marmar") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("زورنا أو كلمنا", "Visit or call us"),
        text: L("المعرض: ٩٠ شارع التسعين الشمالي، التجمع الخامس، القاهرة الجديدة.", "Showroom: 90 North 90th St, Fifth Settlement, New Cairo."),
        heading: L("احجز زيارة للمعرض", "Book a showroom visit"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والتركيب والضمان.", "Delivery, assembly and guarantee."),
        question: L("التركيب عليكم؟", "Do you assemble the furniture?"),
        answer: L(
          "أيوه، فريقنا بيوصل القطعة ويركبها في مكانها وياخد الكرتون معاه. التوصيل في القاهرة والجيزة خلال ٥ لـ ٧ أيام عمل.",
          "Yes. Our team delivers, assembles the piece in place and takes the packaging away. Cairo and Giza delivery takes 5 to 7 working days.",
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
    copy: { reviews: L("آراء عملائنا", "What our clients say"), related: L("قطع تكمّل المكان", "Pieces that complete the room") },
  },
});
