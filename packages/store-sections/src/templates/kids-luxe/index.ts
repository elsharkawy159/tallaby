/**
 * Kids Luxe (2026-10-28, kids & toys niche, premium / minimal): oat paper,
 * deep olive ink and a light clay accent (the footer band, with dark ink
 * on it), El Messiri headings over IBM Plex Sans Arabic, near-square 6px corners and a wide 1400px container. A calm
 * Montessori boutique: top bar header, a background video of wooden toys,
 * a hairline-ruled category grid, best sellers under collection chips, the
 * boutique story beside its toy shelves, four category rows, a ruled
 * newsletter bar and the wordmark footer. Built from section library
 * designs (`fromLibrary`).
 *
 * Photos and video: Pexels, each checked by eye (2026-10-28): toys, art
 * supplies and nurseries only, no people or hands, no readable brand logos,
 * none used twice. Video 3676819, HD 2048px file (poster 3676819; fallback
 * 10325105); about 8923987, about page 8923952; tiles 3661197, 7298152,
 * 6114955, 18142322, 31061847, 7491421; products as listed in `DEMO`.
 * QA swaps (2026-10-28): tile 39759254 (a toddler) became 7491421; three
 * same-shoot animal sets (3661239, 3663071, 3663058) became 32720286,
 * 19612921 and 7663985.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels, pexelsVideo, pexelsVideoPoster, phone } from "../library-template";

export const KIDS_LUXE_KEY = "kids-luxe";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(KIDS_LUXE_KEY, getDesign(id)!, { corners: 6, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  heroVideo: pexelsVideo(3676819, "3676819-hd_2048_1080_25fps.mp4"),
  heroPoster: pexelsVideoPoster(3676819),
  shelves: pexels(8923987, 1200),
  playCorner: pexels(8923952, 1200),
  // Category cells.
  catWooden: pexels(3661197, 1200),
  catPlush: pexels(7298152, 1200),
  catPuzzles: pexels(6114955, 1200),
  catArts: pexels(18142322, 1200),
  catBlocks: pexels(31061847, 1200),
  catNursery: pexels(7491421, 1200),
};

const NAME = L("توت", "Toot");

const header = lib("header-topbar", {
  text: {
    "توصيل سريع لكل محافظات مصر": L("ألعاب خشب وقطن آمنة", "Safe wood and cotton toys"),
    "الدفع عند الاستلام": L("تغليف هدايا مجاني", "Free gift wrapping"),
    "تتبّع طلبك": L("تتبّع", "Track order"),
    "اسم متجرك": NAME,
    "المتجر": L("كل الألعاب", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر طلبًا", "Best sellers"),
    "من نحن": L("البوتيك", "Our boutique"),
  },
  links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
});

const footer = lib("footer-wordmark", {
  text: {
    "تسوّق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل الألعاب", "All toys"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "من نحن": L("عن توت", "About Toot"),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L(phone("٠١٢٨ ٣٤٠ ٦٧١٩"), "+20 128 340 6719"),
    "‏hello@store.com": L("‏hello@toot.eg", "hello@toot.eg"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ توت. كل الحقوق محفوظة.", "© 2026 Toot. All rights reserved."),
  },
  links: { "/products": [SHOP, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-video", {
    photo: [PHOTOS.heroPoster],
    nodes: { "الفيديو": { props: { url: PHOTOS.heroVideo } }, "التعتيم": { style: { opacity: 30 } } },
    text: {
      "فيديو الواجهة": L("ألعاب خشب على رف هادي", "Wooden toys on a quiet shelf"),
      "المجموعة الجديدة": L("مجموعة الشتا ٢٠٢٦", "The Winter 2026 collection"),
      "مساحتك، بطريقتك": L("ألعاب تكبر مع طفلك", "Toys that grow with your child"),
      "قطع مختارة بعناية، وتوصيل سريع لحد باب البيت.": L(
        "خشب زان، ألوان مائية آمنة وقطن عضوي. كل لعبة مختارة عشان تتلعب سنين وتتورث.",
        "Beech wood, child-safe water-based paints and organic cotton. Every toy is chosen to be played with for years, then handed down.",
      ),
      "تسوّق الآن": L("تسوّق", "Shop now"),
      "شوف الجديد": L("الجديد", "New in"),
    },
    links: { "/products": SHOP, "/products?sort=newest": NEW },
  }),
  lib("categories-ruled", {
    text: {
      "الأقسام": L("الأقسام", "Departments"),
      "تسوق بالقسم": L("تسوّق حسب نوع اللعب", "Shop by kind of play"),
      "منتج": L("لعبة", "toys"),
    },
    lists: [{ limit: 6 }],
    nodes: { "الأقسام": { style: { columns: 3 } } },
  }),
  lib("products-tabs-grid", {
    text: {
      "وصل حديثاً": L("الألعاب الأكثر حبًا", "Our most-loved toys"),
      "الجديد": L("وصل حديثًا", "New in"),
      "الأكثر مبيعاً": L("الأكثر مبيعًا", "Best sellers"),
      "الأعلى تقييمًا": L("الأعلى تقييمًا", "Top rated"),
      "عرض الكل": L("كل الألعاب", "Shop all toys"),
    },
    lists: [{ source: "best-sellers" }],
  }),
  lib("about-split-story", {
    photo: [undefined, undefined, PHOTOS.shelves],
    text: {
      "صورة القصة": L("رفوف خشب عليها ألعاب مونتيسوري مرتبة", "Wooden shelves of neatly arranged Montessori toys"),
      "من ورشتنا": L("من الزمالك، من ٢٠١٩", "From Zamalek, since 2019"),
      "متصمم عشانك ومعمول في القاهرة": L("لعب أقل، لعب أحلى", "Fewer toys, better play"),
      "بنعمل كميات صغيرة عشان كل قطعة تفضل مميزة ومفيش حاجة تترمي.": L(
        "بدأنا توت لما دوّرنا لبنتنا على ألعاب هادية من غير بلاستيك ولا أصوات عالية. كل لعبة عندنا بتتجرب في البوتيك قبل ما تنزل الموقع.",
        "We started Toot while looking for calm toys for our daughter, with no plastic and no loud noises. Every toy is tried in the boutique before it reaches the site.",
      ),
      "كل قطعة بتتقص وتتخيط عند فريقنا في المعادي.": L(
        "خشب زان ودهانات مائية آمنة، وقطن عضوي في كل العرايس. والتغليف هدية من غير ما تطلب.",
        "Beech wood and child-safe water-based paints, with organic cotton in every soft toy. Gift wrapping comes without asking.",
      ),
      "حكايتنا": L("زور البوتيك", "Visit the boutique"),
    },
  }),
  ...categoryRows(lib, { viewAll: L("عرض الكل", "View all") }),
  lib("newsletter-ruled", {
    text: {
      "خد ١٠٪ خصم على أول طلب": L("رسالة توت الشهرية", "The monthly Toot letter"),
      "عروض للمشتركين بس، مرة في الأسبوع.": L(
        "لعبة جديدة، فكرة لعب في البيت ونصيحة حسب سن طفلك، مرة في الشهر.",
        "A new toy, an idea for play at home and a tip for your child’s age, once a month.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن توت", "About Toot"), L("ألعاب خشب وقطن طبيعي، مختارة في الزمالك.", "Natural wood and cotton toys, chosen in Zamalek.")),
  aboutStory(lib, {
    photo: PHOTOS.playCorner,
    alt: L("ركن لعب هادي بألعاب تعليمية خشب", "A calm play corner of wooden learning toys"),
    eyebrow: L("البوتيك", "The boutique"),
    title: L("كل لعبة اتجربت قبل ما توصلك", "Every toy is tried before it reaches you"),
    text: L(
      "في البوتيك عندنا ركن لعب صغير. أي لعبة جديدة بتقعد فيه أسبوعين، ولو الأطفال رجعولها تاني، بتنزل الموقع.",
      "Our boutique has a small play corner. Every new toy spends two weeks there, and if children keep coming back to it, it goes on the site.",
    ),
    more: L("وبنرد على أي سؤال عن السن المناسب أو الخامة بنفسنا على واتساب.", "And we answer every question about the right age or material ourselves on WhatsApp."),
    button: L("تسوّق الأكثر حبًا", "Shop the favourites"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ألعاب خشب وقطن طبيعي، مختارة في الزمالك.", "Natural wood and cotton toys, chosen in Zamalek."),
  categories: [
    ["wooden-toys", "ألعاب خشب", "Wooden toys", PHOTOS.catWooden],
    ["plush-toys", "عرايس ودباديب", "Soft toys", PHOTOS.catPlush],
    ["puzzles-games", "بازل وألعاب ذكاء", "Puzzles & games", PHOTOS.catPuzzles],
    ["arts-crafts", "رسم وتلوين", "Arts & crafts", PHOTOS.catArts],
    ["building-blocks", "مكعبات وتركيب", "Building blocks", PHOTOS.catBlocks],
    ["baby-nursery", "أوضة البيبي", "Baby & nursery", PHOTOS.catNursery],
  ],
  products: [
    // Wooden toys
    ["safari-trio", "wooden-toys", "طقم حيوانات سفاري خشب", "Wooden Safari Trio", P(3661222), 890, { isFeatured: true, rating: 4.9, sold90: 74 }],
    ["birthday-train", "wooden-toys", "قطر عيد ميلاد خشب بحوامل شمع", "Wooden Birthday Train with Candle Holders", P(32720286), 950, { rating: 4.8, sold90: 52 }],
    ["whale-octopus", "wooden-toys", "حوت وأخطبوط خشب ملون", "Whale and Octopus Set", P(3663056), 720, { rating: 4.7, sold90: 38 }],
    ["rocking-horse", "wooden-toys", "حصان هزاز خشب كلاسيك", "Classic Wooden Rocking Horse", P(19612921), 3450, { rating: 4.9, sold90: 21 }],
    ["pull-along-mouse", "wooden-toys", "فار خشب بعربية للشد", "Wooden Pull-Along Mouse", P(7663985), 520, { compareAtPrice: 620, rating: 4.8, sold90: 33 }],
    ["ring-stacker", "wooden-toys", "حلقات تركيب خشب هادية", "Wooden Ring Stacker", P(9271757), 450, { rating: 4.7, sold90: 47 }],
    ["rainbow-xylophone", "wooden-toys", "إكسيليفون قوس قزح", "Rainbow Xylophone", P(6743164), 640, { rating: 4.6, sold90: 29 }],
    ["bead-abacus", "wooden-toys", "عدّاد خرز خشب", "Wooden Bead Abacus", P(8923958), 760, { rating: 4.8, sold90: 24 }],
    // Soft toys
    ["cream-teddy", "plush-toys", "دبدوب كريمي بفيونكة", "Cream Teddy Bear", P(6792048), 690, { isFeatured: true, rating: 4.9, sold90: 66 }],
    ["white-bear", "plush-toys", "دبدوب أبيض ناعم", "Soft White Bear", P(10581600), 590, { rating: 4.7, sold90: 41 }],
    ["linen-bunny", "plush-toys", "أرنوبة كتان بفستان منقط", "Linen Bunny Doll", P(19314757), 820, { rating: 5, sold90: 35 }],
    ["knitted-bunny", "plush-toys", "أرنب تريكو يدوي", "Hand-Knitted Bunny", P(5581171), 750, { rating: 4.8, sold90: 18, inStock: false }],
    ["grey-elephant", "plush-toys", "فيل قطيفة رمادي", "Grey Elephant Plush", P(14495298), 540, { rating: 4.6, sold90: 27 }],
    ["grey-mouse", "plush-toys", "فار قطيفة رمادي", "Grey Mouse Plush", P(5895046), 420, { rating: 4.5, sold90: 22 }],
    ["white-rabbit", "plush-toys", "أرنب أبيض صغير", "Little White Rabbit", P(6017186), 480, { compareAtPrice: 560, rating: 4.7, sold90: 30 }],
    ["ballerina-bunny", "plush-toys", "أرنوبة باليرينا", "Ballerina Bunny Doll", P(4886921), 870, { rating: 4.8, sold90: 20 }],
    // Puzzles & games
    ["wooden-jigsaw", "puzzles-games", "بازل خشب ١٠٠ قطعة", "Wooden Jigsaw, 100 Pieces", P(3852577), 560, { rating: 4.7, sold90: 34 }],
    ["puzzle-board", "puzzles-games", "لوحة بازل خشب كبيرة", "Large Wooden Puzzle Board", P(6275821), 480, { rating: 4.6, sold90: 21 }],
    ["ivory-chess", "puzzles-games", "شطرنج عاجي للمبتدئين", "Ivory Chess Set for Beginners", P(30182768), 1250, { rating: 4.9, sold90: 16 }],
    ["ivory-dominoes", "puzzles-games", "دومينو عاجي في علبة", "Ivory Domino Set", P(8102734), 650, { rating: 4.8, sold90: 25 }],
    ["classic-dominoes", "puzzles-games", "دومينو كلاسيك", "Classic Dominoes", P(10622582), 390, { rating: 4.5, sold90: 31 }],
    ["walnut-dominoes", "puzzles-games", "دومينو خشب جوز", "Walnut Wooden Dominoes", P(38977743), 720, { compareAtPrice: 850, rating: 4.8, sold90: 19 }],
    ["blank-jigsaw", "puzzles-games", "بازل أبيض تلوّنه بنفسك", "Blank Colour-Your-Own Jigsaw", P(17770333), 290, { rating: 4.4, sold90: 28 }],
    ["domino-blocks", "puzzles-games", "قطع دومينو خشب للرص", "Wooden Domino Run Blocks", P(353641), 540, { rating: 4.6, sold90: 14 }],
    // Arts & crafts
    ["purple-pencils", "arts-crafts", "ألوان خشب درجات البنفسجي", "Purple Pencil Set", P(4519779), 260, { rating: 4.7, sold90: 44 }],
    ["pastel-pencils", "arts-crafts", "ألوان خشب باستيل ٢٤ لون", "Pastel Pencils, 24 Colours", P(9282312), 380, { isFeatured: true, rating: 4.9, sold90: 58 }],
    ["oil-pastels", "arts-crafts", "ألوان باستيل زيت", "Oil Pastel Set", P(2237106), 290, { rating: 4.6, sold90: 26 }],
    ["sharpened-pencils", "arts-crafts", "علبة ألوان خشب مبرية", "Coloured Pencil Tin", P(7054405), 320, { rating: 4.7, sold90: 37 }],
    ["watercolour-palette", "arts-crafts", "باليتة ألوان مائية", "Watercolour Palette", P(1576210), 450, { rating: 4.8, sold90: 29 }],
    ["watercolour-tray", "arts-crafts", "علبة ألوان مائية ١٢ لون", "Watercolour Tray, 12 Colours", P(31251949), 390, { rating: 4.5, sold90: 23 }],
    ["artist-brushes", "arts-crafts", "طقم فرش رسم للأطفال", "Kids’ Artist Brush Set", P(7257019), 240, { rating: 4.6, sold90: 32 }],
    ["brush-holder", "arts-crafts", "فرش رسم مع حامل", "Brush Set with Holder", P(38807889), 340, { rating: 4.5, sold90: 12 }],
    // Building blocks
    ["pastel-cubes", "building-blocks", "مكعبات خشب باستيل", "Pastel Wooden Cubes", P(6693300), 680, { rating: 4.8, sold90: 27 }],
    ["natural-shapes", "building-blocks", "أشكال خشب طبيعي", "Natural Wooden Shapes", P(7318130), 590, { rating: 4.7, sold90: 19 }],
    ["natural-blocks", "building-blocks", "مكعبات زان طبيعي ٥٠ قطعة", "Natural Beech Blocks, 50 Pieces", P(31061859), 1150, { rating: 4.9, sold90: 22 }],
    ["builder-planks", "building-blocks", "ألواح بناء خشب ١٠٠ قطعة", "Wooden Builder Planks, 100 Pieces", P(31061860), 1450, { rating: 4.8, sold90: 15 }],
    // Baby & nursery
    ["crib-mobile", "baby-nursery", "معلقة سرير خشب بنجوم", "Wooden Star Crib Mobile", P(11369154), 980, { rating: 4.9, sold90: 18 }],
    ["teddy-mobile", "baby-nursery", "معلقة سرير بدباديب", "Teddy Bear Crib Mobile", P(36276498), 1150, { rating: 4.7, sold90: 12 }],
    ["moses-basket", "baby-nursery", "سلة نوم بيبي", "Baby Moses Basket", P(12056684), 3200, { rating: 4.8, sold90: 9 }],
    ["elephant-blanket", "baby-nursery", "بطانية سرير بأفيال", "Elephant Crib Blanket", P(4964488), 850, { rating: 4.6, sold90: 21 }],
  ],
});

export const KIDS_LUXE = libraryTemplate({
  key: KIDS_LUXE_KEY,
  version: 1,
  name: L("توت", "Toot"),
  description: L(
    "بوتيك ألعاب هادي: فيديو ألعاب خشب، أقسام بخطوط رفيعة وأربع صفوف للأقسام. لمحلات ألعاب المونتيسوري والهدايا الراقية.",
    "A calm toy boutique: a wooden-toy video, hairline category cells and four category rows. For Montessori and premium gift toy shops.",
  ),
  category: "kids",
  sortOrder: 1290,
  palette: ["#f6f2ea", "#ebe4d6", "#2f3a2e", "#cfae8a"],
  colors: {
    primary: "#2f3a2e",
    secondary: "#ebe4d6",
    background: "#f6f2ea",
    foreground: "#22261f",
    muted: "#66675c",
    border: "#dcd5c6",
    accent: "#cfae8a",
  },
  fonts: { heading: "El Messiri", body: "IBM Plex Sans Arabic" },
  radius: 6,
  containerMaxWidth: 1400,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن توت", "About"), seo: { title: L("عن توت", "About Toot") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("زورنا أو كلمنا", "Visit or call us"),
        text: L("البوتيك: ١٤ شارع البرازيل، الزمالك، القاهرة. من ١١ الصبح لـ ٩ بالليل.", "Boutique: 14 Brazil St, Zamalek, Cairo. Open 11am to 9pm."),
        heading: L("اسألنا عن لعبة مناسبة لسن طفلك", "Ask us about the right toy for your child’s age"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الأمان والخامات والتوصيل.", "Safety, materials and delivery."),
        question: L("الألعاب آمنة للأطفال الصغيرين؟", "Are the toys safe for young children?"),
        answer: L(
          "أيوه، كل الألعاب الخشب مدهونة بألوان مائية آمنة، والعرايس محشية قطن. وعلى كل منتج السن المناسب ليه.",
          "Yes. All our wooden toys use child-safe water-based paints and the soft toys are cotton-filled. Every product shows the age it suits.",
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
    copy: { reviews: L("آراء الأهالي", "What parents say"), related: L("ألعاب تكمّل الركن", "Toys that complete the corner") },
  },
});
