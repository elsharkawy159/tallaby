/**
 * Kids Bold (2026-10-28, kids & toys niche, bold / playful): white paper,
 * navy ink, a cobalt blue and a sunny yellow, Baloo Bhaijaan 2 headings over
 * Rubik, round 24px corners and a 1280px container. A loud, colourful toy
 * shop: a scrolling ticker header, a three-slide hero carousel, round
 * category stories, a best-seller bento, the playroom story in a yellow ring,
 * four category rows with rounded frames, a slim sign-up strip and the help
 * footer. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-28): toys, art supplies and
 * baby things only, no people or hands, no readable brand logos, none used
 * twice. Slides 6219121, 31674909, 6692838; about 8535631, about page
 * 38724011; tiles 6219103, 17419386, 7776189, 5512623, 34817524, 30161670;
 * products as listed in `DEMO`. QA swaps (2026-10-28): 9951401 (superhero
 * figures), 6693305 (engraved brand), 10068743 (a person’s legs), 8289844,
 * 4491703, 15844906, and three puzzle cubes (36303023, 5664491, 10285256)
 * plus the same-shoot 9227507 were replaced.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels, phone } from "../library-template";

export const KIDS_BOLD_KEY = "kids-bold";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(KIDS_BOLD_KEY, getDesign(id)!, { corners: 24, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  slideRainbow: pexels(6219121, 1920),
  slidePawns: pexels(31674909, 1920),
  slideMarbleRun: pexels(6692838, 1920),
  playroom: pexels(8535631, 1200),
  crochetBasket: pexels(38724011, 1200),
  // Category circles.
  catWooden: pexels(6219103, 1200),
  catPlush: pexels(17419386, 1200),
  catPuzzles: pexels(7776189, 1200),
  catArts: pexels(5512623, 1200),
  catBlocks: pexels(34817524, 1200),
  catNursery: pexels(30161670, 1200),
};

const NAME = L("فرفوش", "Farfoosh");

const header = lib("header-centered-ticker", {
  text: {
    "تفاصيل ومقاسات واضحة لكل منتج": L("ألعاب خشب وقطيفة ومكعبات", "Wooden toys, plush and blocks"),
    "الدفع عند الاستلام": L("العمر المناسب لكل لعبة", "The right age for every toy"),
    "تسوّق سهل من هاتفك": L("تتبّع طلبك من صفحة طلباتي", "Track your order from My orders"),
    "اسم متجرك": NAME,
    "المتجر": L("الألعاب", "Toys"),
    "العروض": L("الجديد", "New"),
    "المدونة": L("الأشهر", "Popular"),
    "من نحن": L("عنّا", "About"),
    "تواصل معنا": L("طلباتي", "Orders"),
  },
  links: { "/products": [undefined, undefined, NEW], "/blog": BEST, "/contact": "/profile/orders" },
});

const footer = lib("footer-help", {
  text: {
    "واتساب": L("واتساب", "WhatsApp"),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L(phone("٠١٠٩ ٥٥٢ ٨١٤٠"), "+20 109 552 8140"),
    "اتصل": L("اتصل بنا", "Call us"),
    "تتبع طلبك": L("تتبّع طلبك", "Track your order"),
    "برقم الطلب": L("من صفحة طلباتي", "From My orders"),
    "اسم متجرك": NAME,
    "تسوق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل الألعاب", "All toys"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "من نحن": L("عن فرفوش", "About Farfoosh"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ فرفوش. كل الحقوق محفوظة.", "© 2026 Farfoosh. All rights reserved."),
  },
  links: {
    "https://wa.me/201001234567": "https://wa.me/201095528140",
    "tel:+201001234567": "tel:+201095528140",
    "/contact": "/profile/orders",
    "/products": [SHOP, NEW, BEST, RATED],
  },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.slideRainbow, PHOTOS.slidePawns, PHOTOS.slideMarbleRun],
    text: {
      "صورة الحملة الأولى": L("أفيال خشب على قوس قزح ملون", "Wooden elephants on a colourful rainbow stacker"),
      "وصل حديثًا": L("وصل حديثًا", "Just landed"),
      "الموسم الجديد وصل": L("ألعاب بألوان مبهجة", "Bright, colourful toys"),
      "قطع مختارة بعناية لكل يوم.": L("ألعاب خشب وقطيفة ومكعبات بألوان مبهجة.", "Wooden toys, plush and blocks in bright colours."),
      "تسوّق الجديد": L("الجديد", "New in"),
      "صورة الحملة الثانية": L("قطع ألعاب خشب ملونة", "Colourful wooden game pawns"),
      "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
      "المفضّلة عند عملائنا": L("الألعاب الأكثر طلبًا", "Everyone’s favourites"),
      "القطع الأكثر طلبًا في المتجر.": L("ألعاب للتعلّم والتسلية.", "Toys for learning and fun."),
      "تصفّح الأكثر مبيعًا": L("الأشهر", "Popular"),
      "صورة الحملة الثالثة": L("مسار كور خشب ملون", "A colourful wooden marble run"),
      "مختارات الأسبوع": L("ركن اللعب", "The play corner"),
      "قطع مختارة لهذا الأسبوع": L("جهّز ركن لعب كاملًا", "A whole play corner"),
      "تشكيلة مختارة من أحدث القطع في المتجر.": L("مكعبات وبازل وألوان ودمى في مكان واحد.", "Blocks, puzzles, crayons and dolls in one place."),
      "تسوّق المختارات": L("كل الألعاب", "All toys"),
    },
    links: { "/products": [NEW, BEST, SHOP] },
  }),
  lib("categories-circles", {
    text: { "ما الذي تبحث عنه؟": L("بماذا تريد أن تلعب اليوم؟", "What shall we play today?") },
  }),
  lib("products-bento", {
    text: {
      "منتجات يكثر الطلب عليها": L("اختيارات فرفوش", "Farfoosh picks"),
      "عرض الكل": L("الكل", "All"),
    },
    links: { "/products": SHOP },
    lists: [{ source: "featured" }, { source: "featured" }],
  }),
  lib("about-circle", {
    person: [PHOTOS.playroom],
    text: {
      "صورة الفريق": L("ركن لعب بخشب فاتح وكور ورق ملونة", "A play corner with light wood and paper pompoms"),
      "من نحن": L("من نحن", "About us"),
      "فريق يختار منتجات المتجر بعناية": L("ألعاب ملونة لكل عمر", "Colourful toys for every age"),
      "نختار كل منتج كأنه لنا، ونوضّح تفاصيله ومقاساته.": L(
        "نختار ألعابًا ملونة لكل عمر، ونوضّح تفاصيلها والعمر المناسب لها.",
        "Colourful toys for every age, with their details and suitable age.",
      ),
      "قابل الفريق": L("اعرف حكايتنا", "Our story"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("الكل", "All"),
    muted: [1, 3],
    nodes: { "صورة المنتج": { style: { radius: 24 } } },
  }),
  lib("newsletter-strip", {
    text: {
      "اعرف الجديد أولًا": L("اعرف الألعاب الجديدة أولًا", "Hear about new toys first"),
      "أحدث المجموعات في بريدك الإلكتروني.": L(
        "ألعاب جديدة وأفكار للعب.",
        "New toys and play ideas.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن فرفوش", "About Farfoosh"), L("ألعاب بألوان مبهجة لكل عمر.", "Toys in bright colours for every age.")),
  aboutStory(lib, {
    photo: PHOTOS.crochetBasket,
    alt: L("سلة مليئة بدمى كروشيه ملونة", "A basket of colourful crochet toys"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("ألعاب ملونة ومختارة", "Colourful, chosen toys"),
    text: L(
      "ألعاب خشب وقطيفة وكروشيه، وبازل ومكعبات وألوان، مع العمر المناسب لكل لعبة.",
      "Wooden, plush and crochet toys, puzzles, blocks and crayons, with the right age for each.",
    ),
    more: L("تواصل معنا لأي سؤال عن ألعابنا.", "Contact us with any question about our toys."),
    button: L("تسوّق الأكثر مبيعًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ألعاب بألوان مبهجة لكل عمر.", "Toys in bright colours for every age."),
  categories: [
    ["wooden-toys", "ألعاب خشب", "Wooden toys", PHOTOS.catWooden],
    ["plush-toys", "دمى ودباديب", "Plush toys", PHOTOS.catPlush],
    ["puzzles-games", "بازل وألعاب ذكاء", "Puzzles & games", PHOTOS.catPuzzles],
    ["arts-crafts", "رسم وتلوين", "Arts & crafts", PHOTOS.catArts],
    ["building-blocks", "مكعبات وتركيب", "Building blocks", PHOTOS.catBlocks],
    ["baby-nursery", "الرضع", "Baby", PHOTOS.catNursery],
  ],
  products: [
    // Wooden toys
    ["elephant-family", "wooden-toys", "عائلة أفيال خشبية", "Wooden Elephant Family", P(6219057), 690, { rating: 4.9, sold90: 92 }],
    ["colour-tower", "wooden-toys", "برج تركيب ألوان وأشكال", "Colour and Shape Stacking Tower", P(33971311), 520, { rating: 4.8, sold90: 81 }],
    ["stacking-collection", "wooden-toys", "طقم ٣ ألعاب تركيب", "Stacking Toy Trio", P(33971335), 890, { compareAtPrice: 1050, rating: 4.7, sold90: 54 }],
    ["shape-sorter", "wooden-toys", "لعبة فرز الأشكال", "Wooden Shape Sorter", P(35579574), 460, { rating: 4.8, sold90: 63 }],
    ["circle-puzzle-board", "wooden-toys", "لوحة أشكال خشبية للصغار", "Toddler Shape Board", P(6692927), 390, { rating: 4.6, sold90: 38 }],
    ["train-cars", "wooden-toys", "عربات قطار خشبية", "Wooden Train Cars", P(4887202), 650, { rating: 4.7, sold90: 45 }],
    ["railway-bridge", "wooden-toys", "قطار بقضبان وجسر", "Railway Set with Bridge", P(15250000), 1850, { rating: 4.9, sold90: 27 }],
    ["xylophone-tractor", "wooden-toys", "إكسيليفون خشب مع جرار لعبة", "Wooden Xylophone with Toy Tractor", P(6743154), 690, { rating: 4.5, sold90: 49 }],
    // Plush toys
    ["blue-owl", "plush-toys", "بومة قطيفة زرقاء", "Blue Owl Plush", P(1364562), 380, { rating: 4.7, sold90: 58 }],
    ["orange-crochet-cat", "plush-toys", "قطة كروشيه برتقالية", "Orange Crochet Cat", P(38707397), 450, { rating: 4.9, sold90: 47 }],
    ["crochet-cat", "plush-toys", "قطة كروشيه بعقدة حمراء", "Crochet Cat with Red Bow", P(38718818), 450, { rating: 4.8, sold90: 33 }],
    ["striped-pup", "plush-toys", "جرو كروشيه مخطط", "Striped Crochet Pup", P(38718819), 420, { rating: 4.6, sold90: 29 }],
    ["crochet-sheep", "plush-toys", "خروف كروشيه", "Crochet Sheep", P(36779480), 480, { rating: 4.7, sold90: 24 }],
    ["pink-crochet-bear", "plush-toys", "دبدوب كروشيه وردي", "Pink Crochet Bear", P(36619687), 520, { rating: 4.8, sold90: 31 }],
    ["white-bear", "plush-toys", "دبدوب أبيض كبير", "Big White Bear", P(6771365), 690, { compareAtPrice: 790, rating: 4.6, sold90: 42 }],
    ["unicorn", "plush-toys", "حصان وحيد القرن من القطيفة", "Unicorn Plush", P(4887163), 560, { rating: 4.9, sold90: 55, inStock: false }],
    // Puzzles & games
    ["classic-cube", "puzzles-games", "مكعب ألغاز كلاسيكي", "Classic Puzzle Cube", P(19673918), 180, { rating: 4.7, sold90: 120 }],
    ["meeple-set", "puzzles-games", "قطع لعب خشب ملونة ٦٠ قطعة", "Wooden Game Pieces, 60 Pieces", P(6990406), 240, { rating: 4.8, sold90: 74 }],
    ["dice-pawns", "puzzles-games", "نرد وقطع لعب خشبية كبيرة", "Big Wooden Dice and Pawns", P(34695098), 220, { rating: 4.6, sold90: 51 }],
    ["shape-puzzle", "puzzles-games", "بازل أشكال خشبي للصغار", "Toddler Wooden Shape Puzzle", P(6692950), 390, { compareAtPrice: 450, rating: 4.7, sold90: 36 }],
    ["colour-puzzle", "puzzles-games", "بازل ألوان ٥٠٠ قطعة", "Colour Jigsaw, 500 Pieces", P(9227217), 340, { rating: 4.8, sold90: 28 }],
    ["games-set", "puzzles-games", "طقم ألعاب العائلة: نرد وأعواد", "Family Games Set: Dice and Pick-Up Sticks", P(5477844), 290, { rating: 4.6, sold90: 22 }],
    ["mixed-jigsaw", "puzzles-games", "بازل ألوان ١٠٠٠ قطعة", "Colour Jigsaw, 1,000 Pieces", P(5142463), 460, { rating: 4.7, sold90: 19 }],
    ["jigsaw-pile", "puzzles-games", "بازل أبيض وأسود", "Black and White Jigsaw", P(30708396), 380, { rating: 4.5, sold90: 14 }],
    // Arts & crafts
    ["four-pencils", "arts-crafts", "ألوان خشب جامبو ٤ ألوان", "Jumbo Pencils, 4 Colours", P(19658263), 95, { rating: 4.6, sold90: 88 }],
    ["rainbow-pencils", "arts-crafts", "ألوان خشب قوس قزح ١٢ لون", "Rainbow Pencils, 12 Colours", P(194098), 160, { rating: 4.8, sold90: 102 }],
    ["pencil-star", "arts-crafts", "ألوان خشب ٢٤ لون", "Coloured Pencils, 24 Colours", P(3907094), 240, { rating: 4.7, sold90: 67 }],
    ["wax-crayons", "arts-crafts", "ألوان شمع قوس قزح", "Rainbow Wax Crayons", P(8605023), 140, { rating: 4.6, sold90: 73 }],
    ["crayon-tray", "arts-crafts", "صينية ألوان شمع ٤٨ لون", "Crayon Tray, 48 Colours", P(8593813), 320, { rating: 4.8, sold90: 41 }],
    ["chunky-crayons", "arts-crafts", "ألوان شمع سميكة للصغار", "Chunky Toddler Crayons", P(9149206), 120, { rating: 4.7, sold90: 59 }],
    ["yellow-crayons", "arts-crafts", "ألوان شمع ١٠ ألوان", "Wax Crayons, 10 Colours", P(2078147), 110, { rating: 4.5, sold90: 46 }],
    ["pencil-bundle", "arts-crafts", "حزمة ألوان خشب ٣٦ لون", "Pencil Bundle, 36 Colours", P(6978729), 290, { compareAtPrice: 340, rating: 4.7, sold90: 32 }],
    // Building blocks
    ["brick-box", "building-blocks", "علبة مكعبات تركيب ٥٠٠ قطعة", "Building Bricks Box, 500 Pieces", P(4491701), 1450, { isFeatured: true, rating: 4.8, sold90: 39 }],
    ["stacking-cylinders", "building-blocks", "أسطوانات تركيب خشب ملونة", "Colourful Wooden Stacking Cylinders", P(6188056), 650, { isFeatured: true, rating: 4.7, sold90: 31 }],
    ["big-brick-mix", "building-blocks", "مكعبات كبيرة للصغار", "Big Bricks for Toddlers", P(4491711), 990, { isFeatured: true, rating: 4.9, sold90: 44 }],
    ["pastel-blocks", "building-blocks", "مكعبات خشب باستيل", "Pastel Wooden Blocks", P(6693303), 590, { isFeatured: true, rating: 4.6, sold90: 25 }],
    // Baby
    ["cloud-mobile", "baby-nursery", "معلقة سرير سحاب", "Cloud Crib Mobile", P(11116578), 690, { rating: 4.8, sold90: 22 }],
    ["bear-socks", "baby-nursery", "جوارب رضع بدبدوب، زوجان", "Bear Baby Socks, Two Pairs", P(14195487), 180, { rating: 4.6, sold90: 28 }],
    ["onesie-set", "baby-nursery", "٣ بودي قطن", "3 Cotton Bodysuits", P(17713240), 520, { isFeatured: true, rating: 4.9, sold90: 47 }],
    ["pink-baby-shoes", "baby-nursery", "حذاء رضع وردي", "Pink Baby Shoes", P(792797), 380, { rating: 4.7, sold90: 19 }],
  ],
});

export const KIDS_BOLD = libraryTemplate({
  key: KIDS_BOLD_KEY,
  version: 1,
  name: L("فرفوش", "Farfoosh"),
  description: L(
    "ألعاب بألوان جريئة: واجهة بثلاث صور، أقسام دائرية، شبكة للأكثر مبيعًا وأربعة صفوف منتجات. لمتاجر الألعاب التي تريد طاقة وحيوية.",
    "Loud, colourful toys: a three-slide hero, round categories, a best-seller bento and four product rows. For toy shops that want energy.",
  ),
  category: "kids",
  style: ["bold", "playful"],
  sortOrder: 1300,
  palette: ["#ffffff", "#fff4d6", "#1f5fd1", "#ffc83d"],
  colors: {
    primary: "#1f5fd1",
    secondary: "#fff4d6",
    background: "#ffffff",
    foreground: "#1b1f3b",
    muted: "#555b75",
    border: "#e6e3f0",
    accent: "#ffc83d",
  },
  fonts: { heading: "Baloo Bhaijaan 2", body: "Rubik" },
  radius: 24,
  containerMaxWidth: 1280,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن فرفوش", "About"), seo: { title: L("عن فرفوش", "About Farfoosh") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل معنا", "Talk to us"),
        text: L("٣٢ شارع مكرم عبيد، مدينة نصر، القاهرة.", "32 Makram Ebeid St, Nasr City, Cairo."),
        heading: L("أخبرنا بعمر طفلك ونرشّح لك لعبة", "Tell us your child’s age and we’ll suggest a toy"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الألعاب والأعمار والطلبات.", "Toys, ages and orders."),
        question: L("هل يمكن إرسال اللعبة إلى عنوان آخر؟", "Can I send a toy to another address?"),
        answer: L(
          "اكتب عنوان المستلم عند إتمام الطلب. تظهر تكلفة الشحن ومدته عند إتمام الطلب.",
          "Enter the recipient's address at checkout. Shipping cost and time are shown at checkout.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "side",
    surface: "card",
    band: "brand",
    extras: ["product-perks", "product-shipping"],
    copy: { reviews: L("آراء الأهل", "What parents say"), related: L("ألعاب قد تعجبك", "Plays well with") },
  },
});
