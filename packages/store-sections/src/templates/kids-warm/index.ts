/**
 * Kids Warm (2026-10-28, kids & toys niche, warm / editorial): peach paper,
 * terracotta ink and a honey accent, Lemonada headings over Almarai, soft
 * 14px corners and a 1360px container. A cosy family toy shop: the
 * announcement header, a split hero of soft toys on a bed, category cards
 * with counts, a featured-gifts panel, the family story over a nursery
 * photo, four category rows with tall photos, a brand newsletter panel and
 * the classic footer with the shop's address. Built from section library
 * designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-28): toys, art supplies and
 * nurseries only, no people or hands, no readable brand logos, none used
 * twice. Hero 30141711; about 4682141, about page 8031964; tiles 14739171,
 * 31378103, 13427933, 11013402, 31061858, 7937988; products as listed in
 * `DEMO` (8923962 replaced the brick fire truck 14823947, whose door decal
 * carries printed text). QA swaps (2026-10-28): hero 7055932 (a quilt printed
 * with words), about 6835137 (a branded toy box), tile 17768376 (book
 * spines), 34121887 and 32410090 (lettering), 4519774 (a brand print), the
 * same-shoot 32720291, 7123080, 7123083 and 39006179, and 3482443.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels, phone } from "../library-template";

export const KIDS_WARM_KEY = "kids-warm";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(KIDS_WARM_KEY, getDesign(id)!, { corners: 14, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  hero: pexels(30141711, 1920),
  nursery: pexels(4682141, 1200),
  babyRoom: pexels(8031964, 1200),
  // Category cards.
  catWooden: pexels(14739171, 1200),
  catPlush: pexels(31378103, 1200),
  catPuzzles: pexels(13427933, 1200),
  catArts: pexels(11013402, 1200),
  catBlocks: pexels(31061858, 1200),
  catNursery: pexels(7937988, 1200),
};

const NAME = L("حُضن", "Hodn");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("أهلًا بيك في حُضن · توصيل لكل محافظات مصر", "Welcome to Hodn · Delivery across Egypt"),
    "الدفع عند الاستلام": L("تغليف هدايا بإيدينا", "Gift-wrapped by hand"),
    "م": L("ح", "H"),
    "اسم متجرك": NAME,
    "المتجر": L("الألعاب", "Shop"),
    "العروض": L("الجديد", "New"),
    "المدونة": L("طلباتي", "Orders"),
    "من نحن": L("حكايتنا", "Story"),
  },
  links: { "/products": [undefined, NEW, undefined, undefined, NEW], "/blog": "/profile/orders" },
});

const footer = lib("footer-classic", {
  text: {
    "اسم متجرك": NAME,
    "أساسيات كل يوم، مختارة بعناية.": L("ألعاب دافية تتحضن وتتورث، من مصر الجديدة.", "Warm toys to hug and hand down, from Heliopolis."),
    "تسوّق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل الألعاب", "All toys"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "من نحن": L("حكايتنا", "Our story"),
    "تواصل معنا": L("تواصل معنا", "Contact"),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L(phone("٠١١٢ ٦٠٤ ٩٣٨٥"), "+20 112 604 9385"),
    "‏hello@store.com": L(handle("hello@hodn.eg"), "hello@hodn.eg"),
    "١٢ شارع النيل، الزمالك، القاهرة": L("٨ شارع بغداد، الكوربة، مصر الجديدة، القاهرة", "8 Baghdad St, Korba, Heliopolis, Cairo"),
    "السبت إلى الخميس، ١٠ ص – ١٠ م": L("كل يوم من ١١ الصبح لـ ١٠ بالليل", "Daily, 11am to 10pm"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ حُضن. كل الحقوق محفوظة.", "© 2026 Hodn. All rights reserved."),
  },
  links: { "https://wa.me/": "https://wa.me/201126049385", "/products": [SHOP, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-split", {
    photo: [PHOTOS.hero],
    text: {
      "صورة الواجهة": L("دبدوب نايم في سرير حديد قديم وسط اللبلاب", "A teddy bear asleep in an old iron bed among ivy"),
      "المجموعة الجديدة": L("مجموعة الشتا الدافية", "The cosy winter edit"),
      "معمول بكميات صغيرة": L("ألعاب تتحضن وتتورث", "Toys to hug, then hand down"),
      "قطع مختارة بعناية، بنعملها بكميات صغيرة عشان كل واحدة تفضل مميزة.": L(
        "دباديب ناعمة، قطارات خشب وألوان مائية، مختارة بإيد أم وجدّة عشان تفضل مع طفلك سنين.",
        "Soft bears, wooden trains and watercolours, chosen by a mum and a grandma to last for years.",
      ),
      "تسوّق المجموعة": L("تسوّق", "Shop"),
      "حكايتنا": L("حكايتنا", "About"),
    },
    links: { "/products": SHOP },
  }),
  lib("categories-chips", {
    text: { "إيه اللي في بالك؟": L("ركن لكل نوع لعب", "A corner for every kind of play") },
    lists: [{ limit: 6 }],
    nodes: { "الأقسام": { style: { columns: 3 } } },
  }),
  lib("products-panel-rail", {
    text: {
      "هدايا": L("هدايا", "Gifts"),
      "هدايا تحت ١٠٠٠ جنيه": L("هدايا من القلب", "Gifts from the heart"),
      "اختيارات مضمونة لأي مناسبة.": L("لعبة بتتحضن، متغلفة بإيدينا ومعاها كارت باسم طفلك.", "A toy to hug, wrapped by hand with a card bearing your child’s name."),
      "عرض الكل": L("كل الهدايا", "All gifts"),
    },
  }),
  lib("about-overlap", {
    person: [undefined, undefined, undefined, undefined, PHOTOS.nursery],
    text: {
      "صورة المتجر": L("أوضة بيبي واسعة بسرير أبيض وترابيزة صغيرة", "A roomy nursery with a white crib and a little table"),
      "من داخل المتجر": L("من مصر الجديدة، من ٢٠١٦", "From Heliopolis, since 2016"),
      "بدأنا من محل صغير": L("محل عيلة، بيختار لعيلتك", "A family shop, choosing for your family"),
      "نختار كل منتج بعناية ونغلّفه بأيدينا، ونعرف عملاءنا بالاسم.": L(
        "حُضن بدأ من أم وجدّة بيدوّروا على ألعاب دافية لأحفادهم. لحد النهارده بنختار كل لعبة بنفسنا، وبنغلّف كل طلب بإيدينا.",
        "Hodn began with a mother and a grandmother looking for warm toys for their grandchildren. We still choose every toy ourselves and wrap every order by hand.",
      ),
      "اعرف أكثر": L("اقرا حكايتنا", "Read our story"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("كل الألعاب", "Shop all"),
    muted: [2, 4],
    nodes: { "صورة البطاقة": { style: { aspectRatio: "portrait" } } },
  }),
  lib("newsletter-classic", {
    text: {
      "خد ١٠٪ خصم على أول طلب": L("حكاية كل شهر", "A story every month"),
      "اشترك وأول ما يوصل جديد أو عرض للمشتركين هتعرف.": L(
        "ألعاب جديدة، فكرة لعب بسيطة في البيت وحكاية قصيرة تقراها لطفلك قبل النوم.",
        "New toys, a simple play idea for home and a short story to read to your child at bedtime.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("حكايتنا", "Our story"), L("ألعاب دافية تتحضن وتتورث، من مصر الجديدة.", "Warm toys to hug and hand down, from Heliopolis.")),
  aboutStory(lib, {
    photo: PHOTOS.babyRoom,
    alt: L("أوضة نوم بيبي مضيئة وهادية", "A bright, quiet baby room"),
    eyebrow: L("من ٢٠١٦", "Since 2016"),
    title: L("بدأنا عشان أحفادنا", "We started for our grandchildren"),
    text: L(
      "الجدّة كانت بتخيّط دباديب لأحفادها، والجيران بقوا يطلبوا زيها. فتحنا محل صغير في الكوربة، ومن ساعتها وإحنا بنختار ألعاب فيها نفس الدفا.",
      "Grandma sewed teddy bears for her grandchildren, and the neighbours started asking for the same. We opened a small shop in Korba, and we have chosen toys with that same warmth ever since.",
    ),
    more: L("كل طلب بيتغلّف بإيدينا، ومعاه كارت مكتوب باسم طفلك.", "Every order is wrapped by hand, with a card written with your child’s name."),
    button: L("تسوّق المفضّل", "Shop favourites"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ألعاب دافية تتحضن وتتورث، من مصر الجديدة.", "Warm toys to hug and hand down, from Heliopolis."),
  categories: [
    ["wooden-toys", "ألعاب خشب", "Wooden toys", PHOTOS.catWooden],
    ["plush-toys", "دباديب", "Teddy bears", PHOTOS.catPlush],
    ["puzzles-games", "ألعاب العيلة", "Games", PHOTOS.catPuzzles],
    ["arts-crafts", "رسم وتلوين", "Arts & crafts", PHOTOS.catArts],
    ["building-blocks", "مكعبات وتركيب", "Blocks", PHOTOS.catBlocks],
    ["baby-nursery", "البيبي", "Baby", PHOTOS.catNursery],
  ],
  products: [
    // Wooden toys
    ["pastel-train", "wooden-toys", "قطر خشب باستيل", "Pastel Wooden Train", P(32720288), 780, { rating: 4.9, sold90: 58 }],
    ["block-box", "wooden-toys", "صندوق مكعبات خشب ملونة", "Box of Coloured Wooden Blocks", P(6692949), 950, { rating: 4.8, sold90: 41 }],
    ["felt-rocking-horse", "wooden-toys", "حصان هزاز صغير بلباد", "Little Felt Rocking Horse", P(35006806), 690, { rating: 4.7, sold90: 26, inStock: false }],
    ["wooden-jeeps", "wooden-toys", "طقم عربيات جيب خشب", "Wooden Jeep Set", P(5433851), 1350, { rating: 4.8, sold90: 22 }],
    ["vintage-car", "wooden-toys", "عربية خشب فينتدج", "Vintage Wooden Car", P(32111145), 620, { rating: 4.6, sold90: 31 }],
    ["rocking-horse", "wooden-toys", "حصان هزاز خشب", "Wooden Rocking Horse", P(4090991), 2850, { compareAtPrice: 3200, rating: 4.9, sold90: 14 }],
    ["elephant-puzzle", "wooden-toys", "بازل فيل خشب", "Wooden Elephant Puzzle", P(4309153), 340, { rating: 4.7, sold90: 37 }],
    ["car-and-peg", "wooden-toys", "عربيتين خشب وعروسة وتد", "Wooden Cars and Peg Doll", P(6865340), 420, { rating: 4.5, sold90: 29 }],
    // Teddy bears
    ["brown-teddy", "plush-toys", "دبدوب بني بتيشيرت", "Brown Teddy in a T-Shirt", P(5786757), 590, { rating: 4.8, sold90: 52 }],
    ["honey-bear", "plush-toys", "دبدوب عسلي كبير", "Big Honey Bear", P(5802595), 890, { rating: 4.9, sold90: 44 }],
    ["bandana-teddy", "plush-toys", "دبدوب بباندانا كاروهات", "Bandana Teddy", P(15130371), 520, { rating: 4.8, sold90: 61 }],
    ["ribbon-teddy", "plush-toys", "دبدوب بفيونكة", "Ribbon Teddy", P(7436118), 650, { rating: 4.7, sold90: 35 }],
    ["cuddle-bear", "plush-toys", "دبدوب حضن كريمي", "Cream Cuddle Bear", P(2815377), 720, { compareAtPrice: 820, rating: 4.9, sold90: 39 }],
    ["sand-teddy", "plush-toys", "دبدوب رملي صغير", "Little Sand Teddy", P(19849143), 420, { rating: 4.6, sold90: 27 }],
    ["garden-bear", "plush-toys", "دبدوب الجنينة", "Garden Bear", P(113559), 480, { rating: 4.5, sold90: 18 }],
    ["grey-bear", "plush-toys", "دبدوب رمادي ناعم", "Soft Grey Bear", P(8126678), 560, { rating: 4.7, sold90: 24 }],
    // Family games
    ["walnut-dominoes", "puzzles-games", "دومينو خشب جوز", "Walnut Dominoes", P(38977737), 690, { rating: 4.8, sold90: 33 }],
    ["ludo-pawns", "puzzles-games", "عساكر لودو ملونة", "Colourful Ludo Pawns", P(792051), 260, { rating: 4.7, sold90: 21 }],
    ["wooden-bishop", "puzzles-games", "شطرنج خشب منحوت", "Carved Wooden Chess Set", P(19327149), 1450, { rating: 4.9, sold90: 12 }],
    ["chess-set", "puzzles-games", "شطرنج خشب للعيلة", "Family Wooden Chess Set", P(16256893), 1150, { compareAtPrice: 1300, rating: 4.8, sold90: 17 }],
    ["classic-dominoes", "puzzles-games", "دومينو كلاسيك أسود", "Classic Black Dominoes", P(1393972), 320, { rating: 4.5, sold90: 38 }],
    ["yellow-jigsaw", "puzzles-games", "بازل أبيض ٢٠٠ قطعة", "White Jigsaw, 200 Pieces", P(4124718), 260, { rating: 4.6, sold90: 25 }],
    ["first-shape-puzzle", "puzzles-games", "أول بازل أشكال خشب", "First Wooden Shape Puzzle", P(6692956), 320, { rating: 4.6, sold90: 30 }],
    ["dice-board-game", "puzzles-games", "لعبة سلم وتعبان بالزهر", "Snakes and Ladders Dice Game", P(278918), 290, { rating: 4.7, sold90: 42 }],
    // Arts & crafts
    ["pencil-tips", "arts-crafts", "ألوان خشب ٣٦ لون", "Coloured Pencils, 36 Colours", P(10753540), 340, { rating: 4.8, sold90: 47 }],
    ["pencil-cup", "arts-crafts", "كوباية ألوان خشب", "Pencil Cup Set", P(12204014), 280, { rating: 4.6, sold90: 34 }],
    ["pastel-pencil-cup", "arts-crafts", "ألوان خشب باستيل ١٢ لون", "Pastel Pencils, 12 Colours", P(6952419), 190, { rating: 4.7, sold90: 56 }],
    ["pencil-ramp", "arts-crafts", "ألوان خشب ١٢ لون", "Coloured Pencils, 12 Colours", P(7986301), 150, { rating: 4.5, sold90: 62 }],
    ["watercolour-set", "arts-crafts", "علبة ألوان مائية بفرشة", "Watercolour Box with Brush", P(19196316), 390, { rating: 4.8, sold90: 28 }],
    ["watercolour-pad", "arts-crafts", "ألوان مائية مع كراسة رسم", "Watercolours with Sketch Pad", P(13600524), 450, { rating: 4.7, sold90: 23 }],
    ["travel-paint-box", "arts-crafts", "علبة ألوان مائية للسفر", "Travel Paint Box", P(14628036), 520, { compareAtPrice: 590, rating: 4.6, sold90: 15 }],
    ["painted-tray", "arts-crafts", "باليتة ألوان مائية ٢٤ لون", "Watercolour Palette, 24 Colours", P(34334768), 480, { rating: 4.9, sold90: 19 }],
    // Building blocks
    ["pink-brick-pack", "building-blocks", "مكعبات كبيرة بمبي", "Big Pink Bricks", P(7123024), 650, { isFeatured: true, rating: 4.7, sold90: 21 }],
    ["builder-tray", "building-blocks", "صينية مكعبات بناء بألوان الأرض", "Earth-Tone Builder Tray", P(9218692), 1150, { isFeatured: true, rating: 4.8, sold90: 17 }],
    ["stacking-towers", "building-blocks", "طقم أبراج تركيب خشب", "Wooden Stacking Towers Set", P(8923962), 1250, { isFeatured: true, rating: 4.9, sold90: 26 }],
    ["pastel-blocks", "building-blocks", "مكعبات خشب باستيل", "Pastel Wooden Blocks", P(6693315), 560, { isFeatured: true, rating: 4.6, sold90: 12 }],
    // Baby
    ["knit-booties", "baby-nursery", "لكلوك تريكو أبيض", "White Knit Booties", P(39462003), 290, { isFeatured: true, rating: 4.8, sold90: 33 }],
    ["knit-set", "baby-nursery", "طقم تريكو بيبي بطاقيتين ودبدوب", "Baby Knit Set with Two Hats and a Bear", P(5881236), 690, { isFeatured: true, rating: 4.7, sold90: 27 }],
    ["collar-dresses", "baby-nursery", "فستان بيبي بياقة دانتيل", "Baby Dress with Lace Collar", P(32234111), 590, { rating: 4.8, sold90: 22 }],
    ["teddy-booties", "baby-nursery", "لكلوك تريكو بدبدوب", "Teddy Knit Booties", P(37240170), 320, { rating: 4.9, sold90: 18 }],
  ],
});

export const KIDS_WARM = libraryTemplate({
  key: KIDS_WARM_KEY,
  version: 1,
  name: L("حُضن", "Hodn"),
  description: L(
    "محل ألعاب عيلة بروح دافية: واجهة بنصين، كروت أقسام، لوحة هدايا وحكاية العيلة. لمحلات الألعاب والهدايا والدباديب.",
    "A warm family toy shop: a split hero, category cards, a gifts panel and the family story. For toy, gift and teddy-bear shops.",
  ),
  category: "kids",
  sortOrder: 1310,
  palette: ["#fbf3ec", "#f3e3d3", "#9c4a2f", "#e3a35f"],
  colors: {
    primary: "#9c4a2f",
    secondary: "#f3e3d3",
    background: "#fbf3ec",
    foreground: "#3a2a22",
    muted: "#74604f",
    border: "#e8d6c4",
    accent: "#e3a35f",
  },
  fonts: { heading: "Lemonada", body: "Almarai" },
  radius: 14,
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
        text: L("المحل: ٨ شارع بغداد، الكوربة، مصر الجديدة، القاهرة.", "Shop: 8 Baghdad St, Korba, Heliopolis, Cairo."),
        heading: L("عايز هدية بكارت باسم طفل؟ ابعتلنا", "Want a gift with a named card? Message us"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الهدايا والتغليف والتوصيل.", "Gifts, wrapping and delivery."),
        question: L("ممكن تكتبوا اسم الطفل على الكارت؟", "Can you write the child’s name on the card?"),
        answer: L(
          "أيوه، اكتب الاسم والرسالة في ملاحظات الطلب، وهنكتبهم بخط الإيد ونغلّف الهدية. التوصيل في القاهرة خلال ٢ لـ ٣ أيام.",
          "Yes. Add the name and message in the order notes and we will handwrite the card and wrap the gift. Cairo delivery takes 2 to 3 days.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    band: "shelf",
    extras: ["product-perks"],
    copy: { reviews: L("من بيوت عملائنا", "From our customers’ homes"), related: L("يتحضن معاها", "Cuddles well with") },
  },
});
