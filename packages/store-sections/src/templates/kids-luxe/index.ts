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
    "تسوّق سهل من هاتفك": L("ألعاب من الخشب والقطن", "Wood and cotton toys"),
    "الدفع عند الاستلام": L("العمر المناسب لكل لعبة", "The right age for every toy"),
    "تتبّع طلبك": L("تتبّع", "Track order"),
    "اسم متجرك": NAME,
    "المتجر": L("كل الألعاب", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر طلبًا", "Best sellers"),
    "من نحن": L("من نحن", "About"),
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
      "فيديو الواجهة": L("ألعاب خشبية على رف هادئ", "Wooden toys on a quiet shelf"),
      "المجموعة الجديدة": L("مجموعة الشتاء", "The winter collection"),
      "تصميم هادئ لكل يوم": L("ألعاب من الخشب والقطن", "Wooden and cotton toys"),
      "قطع مختارة بعناية لكل يوم.": L(
        "ألعاب من خشب الزان بألوان مائية، ودمى من القطن العضوي، لكل عمر.",
        "Beech wood toys with water-based paints and organic cotton soft toys, for every age.",
      ),
      "تسوّق الآن": L("تسوّق", "Shop now"),
      "اكتشف الجديد": L("الجديد", "New in"),
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
      "وصل حديثاً": L("الألعاب الأكثر طلبًا", "Our most-loved toys"),
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
      "صورة القصة": L("رفوف خشبية عليها ألعاب مونتيسوري مرتبة", "Wooden shelves of neatly arranged Montessori toys"),
      "عن المتجر": L("عن المتجر", "About the shop"),
      "تصميم مدروس وخامات مختارة": L("ألعاب هادئة ومختارة", "Calm, chosen toys"),
      "نختار كل قطعة بعناية لتبقى مميزة.": L(
        "ألعاب هادئة من الخشب والقطن، بلا أصوات عالية، مع العمر المناسب لكل لعبة.",
        "Calm wooden and cotton toys with no loud noises, each with its suitable age.",
      ),
      "ونعرض لكل قطعة صورًا ومقاسات واضحة.": L(
        "خشب زان ودهانات مائية، وقطن عضوي في الدمى، مع صور وتفاصيل واضحة.",
        "Beech wood, water-based paints and organic cotton soft toys, with clear photos and details.",
      ),
      "حكايتنا": L("حكايتنا", "Our story"),
    },
  }),
  ...categoryRows(lib, { viewAll: L("عرض الكل", "View all") }),
  lib("newsletter-ruled", {
    text: {
      "اشترك في نشرتنا البريدية": L("اشترك في نشرتنا البريدية", "Join our newsletter"),
      "كن أول من يعرف بالمنتجات الجديدة.": L(
        "ألعاب جديدة وأفكار للعب ونصائح حسب عمر الطفل.",
        "New toys, play ideas and tips by age.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن توت", "About Toot"), L("ألعاب من الخشب والقطن الطبيعي.", "Natural wood and cotton toys.")),
  aboutStory(lib, {
    photo: PHOTOS.playCorner,
    alt: L("ركن لعب هادئ بألعاب تعليمية خشبية", "A calm play corner of wooden learning toys"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("ألعاب مختارة لكل عمر", "Toys chosen for every age"),
    text: L(
      "ألعاب خشب ودمى قطن وبازل وأدوات رسم، مع العمر المناسب والخامة لكل منتج.",
      "Wooden toys, cotton soft toys, puzzles and art supplies, each with its age and material.",
    ),
    more: L("تواصل معنا لأي سؤال عن العمر المناسب أو الخامة.", "Contact us with any question about the right age or material."),
    button: L("تسوّق الأكثر طلبًا", "Shop the favourites"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ألعاب من الخشب والقطن الطبيعي.", "Natural wood and cotton toys."),
  categories: [
    ["wooden-toys", "ألعاب خشب", "Wooden toys", PHOTOS.catWooden],
    ["plush-toys", "دمى ودباديب", "Soft toys", PHOTOS.catPlush],
    ["puzzles-games", "بازل وألعاب ذكاء", "Puzzles & games", PHOTOS.catPuzzles],
    ["arts-crafts", "رسم وتلوين", "Arts & crafts", PHOTOS.catArts],
    ["building-blocks", "مكعبات وتركيب", "Building blocks", PHOTOS.catBlocks],
    ["baby-nursery", "غرفة الرضيع", "Baby & nursery", PHOTOS.catNursery],
  ],
  products: [
    // Wooden toys
    ["safari-trio", "wooden-toys", "طقم حيوانات سفاري خشب", "Wooden Safari Trio", P(3661222), 890, { isFeatured: true, rating: 4.9, sold90: 74 }],
    ["birthday-train", "wooden-toys", "قطار عيد ميلاد خشبي بحوامل شموع", "Wooden Birthday Train with Candle Holders", P(32720286), 950, { rating: 4.8, sold90: 52 }],
    ["whale-octopus", "wooden-toys", "حوت وأخطبوط خشب ملون", "Whale and Octopus Set", P(3663056), 720, { rating: 4.7, sold90: 38 }],
    ["rocking-horse", "wooden-toys", "حصان هزاز خشبي كلاسيكي", "Classic Wooden Rocking Horse", P(19612921), 3450, { rating: 4.9, sold90: 21 }],
    ["pull-along-mouse", "wooden-toys", "فأر خشبي بعجلات للسحب", "Wooden Pull-Along Mouse", P(7663985), 520, { compareAtPrice: 620, rating: 4.8, sold90: 33 }],
    ["ring-stacker", "wooden-toys", "حلقات تركيب خشبية بألوان هادئة", "Wooden Ring Stacker", P(9271757), 450, { rating: 4.7, sold90: 47 }],
    ["rainbow-xylophone", "wooden-toys", "إكسيليفون قوس قزح", "Rainbow Xylophone", P(6743164), 640, { rating: 4.6, sold90: 29 }],
    ["bead-abacus", "wooden-toys", "عدّاد خرز خشب", "Wooden Bead Abacus", P(8923958), 760, { rating: 4.8, sold90: 24 }],
    // Soft toys
    ["cream-teddy", "plush-toys", "دبدوب كريمي بفيونكة", "Cream Teddy Bear", P(6792048), 690, { isFeatured: true, rating: 4.9, sold90: 66 }],
    ["white-bear", "plush-toys", "دبدوب أبيض ناعم", "Soft White Bear", P(10581600), 590, { rating: 4.7, sold90: 41 }],
    ["linen-bunny", "plush-toys", "دمية أرنب كتان بفستان منقط", "Linen Bunny Doll", P(19314757), 820, { rating: 5, sold90: 35 }],
    ["knitted-bunny", "plush-toys", "أرنب تريكو يدوي", "Hand-Knitted Bunny", P(5581171), 750, { rating: 4.8, sold90: 18, inStock: false }],
    ["grey-elephant", "plush-toys", "فيل قطيفة رمادي", "Grey Elephant Plush", P(14495298), 540, { rating: 4.6, sold90: 27 }],
    ["grey-mouse", "plush-toys", "فأر قطيفة رمادي", "Grey Mouse Plush", P(5895046), 420, { rating: 4.5, sold90: 22 }],
    ["white-rabbit", "plush-toys", "أرنب أبيض صغير", "Little White Rabbit", P(6017186), 480, { compareAtPrice: 560, rating: 4.7, sold90: 30 }],
    ["ballerina-bunny", "plush-toys", "دمية أرنب باليرينا", "Ballerina Bunny Doll", P(4886921), 870, { rating: 4.8, sold90: 20 }],
    // Puzzles & games
    ["wooden-jigsaw", "puzzles-games", "بازل خشب ١٠٠ قطعة", "Wooden Jigsaw, 100 Pieces", P(3852577), 560, { rating: 4.7, sold90: 34 }],
    ["puzzle-board", "puzzles-games", "لوحة بازل خشب كبيرة", "Large Wooden Puzzle Board", P(6275821), 480, { rating: 4.6, sold90: 21 }],
    ["ivory-chess", "puzzles-games", "شطرنج عاجي للمبتدئين", "Ivory Chess Set for Beginners", P(30182768), 1250, { rating: 4.9, sold90: 16 }],
    ["ivory-dominoes", "puzzles-games", "دومينو عاجي في علبة", "Ivory Domino Set", P(8102734), 650, { rating: 4.8, sold90: 25 }],
    ["classic-dominoes", "puzzles-games", "دومينو كلاسيكي", "Classic Dominoes", P(10622582), 390, { rating: 4.5, sold90: 31 }],
    ["walnut-dominoes", "puzzles-games", "دومينو خشب جوز", "Walnut Wooden Dominoes", P(38977743), 720, { compareAtPrice: 850, rating: 4.8, sold90: 19 }],
    ["blank-jigsaw", "puzzles-games", "بازل أبيض تلوّنه بنفسك", "Blank Colour-Your-Own Jigsaw", P(17770333), 290, { rating: 4.4, sold90: 28 }],
    ["domino-blocks", "puzzles-games", "قطع دومينو خشب للرص", "Wooden Domino Run Blocks", P(353641), 540, { rating: 4.6, sold90: 14 }],
    // Arts & crafts
    ["purple-pencils", "arts-crafts", "ألوان خشب درجات البنفسجي", "Purple Pencil Set", P(4519779), 260, { rating: 4.7, sold90: 44 }],
    ["pastel-pencils", "arts-crafts", "ألوان خشب باستيل ٢٤ لون", "Pastel Pencils, 24 Colours", P(9282312), 380, { isFeatured: true, rating: 4.9, sold90: 58 }],
    ["oil-pastels", "arts-crafts", "ألوان باستيل زيت", "Oil Pastel Set", P(2237106), 290, { rating: 4.6, sold90: 26 }],
    ["sharpened-pencils", "arts-crafts", "علبة ألوان خشب مبرية", "Coloured Pencil Tin", P(7054405), 320, { rating: 4.7, sold90: 37 }],
    ["watercolour-palette", "arts-crafts", "لوحة ألوان مائية", "Watercolour Palette", P(1576210), 450, { rating: 4.8, sold90: 29 }],
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
    ["moses-basket", "baby-nursery", "سلة نوم للرضيع", "Baby Moses Basket", P(12056684), 3200, { rating: 4.8, sold90: 9 }],
    ["elephant-blanket", "baby-nursery", "بطانية سرير بأفيال", "Elephant Crib Blanket", P(4964488), 850, { rating: 4.6, sold90: 21 }],
  ],
});

export const KIDS_LUXE = libraryTemplate({
  key: KIDS_LUXE_KEY,
  version: 2,
  name: L("توت", "Toot"),
  description: L(
    "متجر ألعاب هادئ: فيديو ألعاب خشبية، أقسام بخطوط رفيعة وأربعة صفوف للأقسام. لمتاجر ألعاب المونتيسوري والهدايا الراقية.",
    "A calm toy boutique: a wooden-toy video, hairline category cells and four category rows. For Montessori and premium gift toy shops.",
  ),
  category: "books",
  style: ["luxe", "minimal"],
  sortOrder: 1290,
  palette: ["#f6f2ea", "#ebe4d6", "#2f3a2e", "#cfae8a"],
  colors: {
    primary: "#2f3a2e",
    secondary: "#ebe4d6",
    background: "#ffffff",
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
        title: L("تواصل معنا", "Contact us"),
        text: L("١٤ شارع البرازيل، الزمالك، القاهرة. من ١١ صباحًا حتى ٩ مساءً.", "14 Brazil St, Zamalek, Cairo. Open 11am to 9pm."),
        heading: L("اسألنا عن لعبة مناسبة لسن طفلك", "Ask us about the right toy for your child’s age"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الخامات والأعمار والطلبات.", "Materials, ages and orders."),
        question: L("ما العمر المناسب لكل لعبة؟", "What age does each toy suit?"),
        answer: L(
          "العمر المناسب والخامة مكتوبان في تفاصيل كل منتج.",
          "Every product shows the age it suits and its materials.",
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
    copy: { reviews: L("آراء الأهل", "What parents say"), related: L("ألعاب قد تعجبك", "Toys that complete the corner") },
  },
});
