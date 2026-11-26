/**
 * Grocery Luxe (2026-10-28, grocery & food niche, premium / minimal): cream
 * paper, deep olive ink and saffron, Noto Naskh Arabic headings over Readex
 * Pro, near-square 4px corners and a wide 1440px container. A quiet
 * fine-food hall: the announcement header, a background video of wet
 * tomatoes, chilies and broccoli, portrait photo tiles, a best-seller
 * carousel, the pantry story in an inset panel, four category rows with
 * portrait cards, the classic brand-coloured newsletter and the ruled
 * footer. Built from section library designs (`fromLibrary`).
 *
 * Photos and video: Pexels, each checked by eye (2026-10-28): food on light,
 * neutral backgrounds only, no people or hands, no labels or brands, none
 * used twice. Video 9020663 (vegetables close-up, 15 s), poster from the same
 * video. Scenes: 33035363 (cheese board, home story), 9105966 (honey jars,
 * about page). Bakery 5978248 replaces 13177922
 * (a logo on the plate, QA 2026-10-28). Tiles: 14199600, 33329205, 34936588, 8581011, 37006558,
 * 33074061. Products: listed in `DEMO` below.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels, phone, pexelsVideo, pexelsVideoPoster } from "../library-template";

export const GROCERY_LUXE_KEY = "grocery-luxe";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(GROCERY_LUXE_KEY, getDesign(id)!, { corners: 4, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  heroVideo: pexelsVideo(9020663, "9020663-uhd_2560_1440_25fps.mp4"),
  heroPoster: pexelsVideoPoster(9020663),
  cheeseBoard: pexels(33035363, 1200),
  honeyJars: pexels(9105966, 1200),
  // Category tiles.
  catFruits: pexels(14199600, 1200),
  catVegetables: pexels(33329205, 1200),
  catBakery: pexels(34936588, 1200),
  catPantry: pexels(8581011, 1200),
  catDairy: pexels(37006558, 1200),
  catCoffee: pexels(33074061, 1200),
};

const NAME = L("مذاق", "Mazaq");

/** A phone number that keeps its digit groups in order and on one line. */
const tel = (number: string) => phone(number).replace(/ /g, "\u00a0");

const header = lib("header-announcement", {
  text: {
    "تشكيلة الموسم الجديد وصلت": L("فاكهة وخضار وجبن وعسل مختار", "Chosen fruit, vegetables, cheese and honey"),
    "الدفع عند الاستلام": L("أوزان وتفاصيل واضحة لكل منتج", "Clear weights and details for every product"),
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("تتبّع طلبك", "Track order"),
    "من نحن": L("عن مذاق", "About"),
  },
  links: { "/products": [undefined, NEW, undefined, undefined, NEW], "/blog": "/profile/orders" },
});

const footer = lib("footer-ruled", {
  text: {
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "منتجات مختارة بعناية لكل يوم.": L(
      `بقالة فاخرة: فاكهة مختارة وجبن وعسل ومخبوزات. ٨ شارع البرازيل، الزمالك، القاهرة | ${tel("٠١٢٧ ٣٩٤ ٥١٨٠")} | hello@mazaq.eg`,
      `A fine grocer: chosen fruit, cheese, honey and bakes. 8 Brazil St, Zamalek, Cairo | ${tel("+20 127 394 5180")} | hello@mazaq.eg`,
    ),
    "تسوق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل المنتجات", "All products"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "من نحن": L("عن مذاق", "About Mazaq"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ مذاق. كل الحقوق محفوظة.", "© 2026 Mazaq. All rights reserved."),
  },
  links: { "/products": [SHOP, NEW, BEST, RATED], "https://wa.me/": "https://wa.me/201273945180" },
});

const home: Design[] = [
  lib("hero-video", {
    photo: [PHOTOS.heroPoster],
    nodes: { "الفيديو": { props: { url: PHOTOS.heroVideo } }, "التعتيم": { style: { opacity: 35 } } },
    text: {
      "فيديو الواجهة": L("طماطم وفلفل وثوم وبروكلي طازج بقطرات الماء", "Wet tomatoes, peppers, garlic and broccoli up close"),
      "المجموعة الجديدة": L("تشكيلة الموسم", "The season’s selection"),
      "تصميم هادئ لكل يوم": L("خضار وفاكهة وجبن وعسل", "Produce, cheese and honey"),
      "قطع مختارة بعناية لكل يوم.": L(
        "خضار وفاكهة موسمية، وجبن وعسل ومكسرات، ومخبوزات وقهوة وشاي.",
        "Seasonal fruit and vegetables, cheese, honey and nuts, bakes, coffee and tea.",
      ),
      "تسوّق الآن": L("تسوّق المختارات", "Shop the selection"),
      "اكتشف الجديد": L("وصل حديثًا", "New in"),
    },
    links: { "/products": SHOP, "/products?sort=newest": NEW },
  }),
  lib("categories-photo-tiles", {
    text: { "تسوّق حسب القسم": L("تسوّق حسب القسم", "Shop by aisle") },
    // All six aisles in one row (the design shows five).
    lists: [{ limit: 6 }],
    nodes: { "الأقسام": { style: { columns: 6 } } },
  }),
  lib("products-carousel", {
    text: { "الأكثر مبيعاً": L("المفضّل عند عملائنا", "Our customers’ favourites") },
    links: { "/products": BEST },
    lists: [{ limit: 8 }],
  }),
  lib("about-inset", {
    photo: [undefined, undefined, undefined, undefined, undefined, undefined, undefined, PHOTOS.cheeseBoard],
    text: {
      "كيف نعمل": L("كيف نختار", "How we choose"),
      "تفاصيل واضحة لكل منتج": L("منتجات مختارة بعناية", "Products chosen with care"),
      "نعرض لكل منتج صورًا ومواصفات ومقاسات واضحة.": L(
        "فاكهة وخضار موسمية، وجبن وعسل ومكسرات، مع الوزن والتفاصيل واضحة لكل منتج.",
        "Seasonal produce, cheese, honey and nuts, with the weight and details clear for every product.",
      ),
      "اعرف أكثر": L("اعرف حكايتنا", "Our story"),
      "صورة المتجر": L("لوح جبن وعنب ومكسرات على طاولة", "A cheese board with grapes, nuts and charcuterie"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("عرض الكل", "View all"),
    nodes: { "صورة البطاقة": { style: { aspectRatio: "portrait" } } },
  }),
  lib("newsletter-classic", {
    text: {
      "اشترك في نشرتنا البريدية": L("اشترك في نشرتنا البريدية", "Join our newsletter"),
      "اشترك لتصلك أخبار المنتجات الجديدة.": L(
        "أخبار المنتجات الموسمية الجديدة ووصفات بسيطة.",
        "News of new seasonal products and simple recipes.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن مذاق", "About Mazaq"), L("بقالة فاخرة ومنتجات مختارة.", "A fine grocer of chosen products.")),
  aboutStory(lib, {
    photo: PHOTOS.honeyJars,
    alt: L("وعاءان من العسل الطبيعي على صينية خشبية", "Two jars of natural honey on a wooden tray"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("منتجات مختارة من السوق", "Chosen from the market"),
    text: L(
      "فاكهة وخضار ومخبوزات وجبن وعسل ومكسرات وقهوة، بأوزان وتفاصيل واضحة.",
      "Fruit, vegetables, bakes, cheese, honey, nuts and coffee, with clear weights and details.",
    ),
    more: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
    button: L("تسوّق المفضّل", "Shop favourites"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("بقالة فاخرة: فاكهة مختارة وجبن وعسل ومخبوزات.", "A fine grocer: chosen fruit, cheese, honey and bakes."),
  categories: [
    ["fruits", "فواكه", "Fruits", PHOTOS.catFruits],
    ["vegetables", "خضار", "Vegetables", PHOTOS.catVegetables],
    ["bakery", "مخبوزات", "Bakery", PHOTOS.catBakery],
    ["pantry", "المؤن والمكسرات", "Pantry, nuts & honey", PHOTOS.catPantry],
    ["dairy-cheese", "ألبان وجبن", "Dairy & cheese", PHOTOS.catDairy],
    ["coffee-tea", "قهوة وشاي", "Coffee & tea", PHOTOS.catCoffee],
  ],
  products: [
    // Fruits
    ["fresh-figs", "fruits", "تين طازج، علبة ٥٠٠ جم", "Fresh Figs, 500 g", P(5475178), 185, { isFeatured: true, rating: 4.9, sold90: 142 }],
    ["pomegranates", "fruits", "رمان منفلوطي، ١ كجم", "Manfalouty Pomegranates, 1 kg", P(6956386), 65, { rating: 4.8, sold90: 118 }],
    ["lemons", "fruits", "ليمون أضاليا، ١ كجم", "Adalia Lemons, 1 kg", P(37654710), 45, { rating: 4.7, sold90: 96 }],
    ["cherries", "fruits", "كريز أحمر، علبة ٢٥٠ جم", "Red Cherries, 250 g", P(109274), 240, { compareAtPrice: 280, rating: 4.9, sold90: 74 }],
    ["pears", "fruits", "كمثرى، ١ كجم", "Pears, 1 kg", P(9457697), 95, { rating: 4.6, sold90: 51 }],
    ["avocados", "fruits", "أفوكادو هاس، ٣ حبات", "Hass Avocados, 3 pcs", P(4352092), 120, { rating: 4.7, sold90: 88 }],
    ["watermelon-wedges", "fruits", "بطيخ مقطّع، علبة ١ كجم", "Watermelon Wedges, 1 kg box", P(3429784), 55, { rating: 4.5, sold90: 63, inStock: false }],
    ["blueberries", "fruits", "توت أزرق، علبة ١٢٥ جم", "Blueberries, 125 g", P(1765022), 160, { rating: 4.8, sold90: 102 }],
    // Vegetables
    ["asparagus", "vegetables", "هليون أخضر، ربطة ٢٥٠ جم", "Green Asparagus, 250 g", P(4033043), 145, { rating: 4.7, sold90: 39 }],
    ["garlic-bulbs", "vegetables", "ثوم بلدي، ٥٠٠ جم", "Local Garlic, 500 g", P(6576763), 60, { rating: 4.8, sold90: 133 }],
    ["beetroot", "vegetables", "بنجر بالعرش، ١ كجم", "Beetroot with Leaves, 1 kg", P(5758605), 35, { rating: 4.6, sold90: 47 }],
    ["purple-eggplant", "vegetables", "باذنجان رومي، ١ كجم", "Purple Eggplant, 1 kg", P(5644866), 30, { rating: 4.5, sold90: 71 }],
    ["baby-spinach", "vegetables", "سبانخ صغيرة، ٢٠٠ جم", "Baby Spinach, 200 g", P(4506881), 40, { compareAtPrice: 48, rating: 4.7, sold90: 84 }],
    ["sweet-corn", "vegetables", "ذرة حلوة، ٢ كوز", "Sweet Corn, 2 cobs", P(38519270), 30, { rating: 4.6, sold90: 58 }],
    ["red-chilies", "vegetables", "فلفل حار أحمر، ١٠٠ جم", "Red Chilies, 100 g", P(5957547), 20, { rating: 4.4, sold90: 42 }],
    ["mini-bell-peppers", "vegetables", "فلفل ألوان ميني، ٥٠٠ جم", "Mini Bell Peppers, 500 g", P(7657012), 70, { rating: 4.8, sold90: 66 }],
    // Bakery
    ["french-macarons", "bakery", "ماكرون فرنسي، ١٢ قطعة", "French Macarons, 12 pcs", P(15779770), 360, { isFeatured: true, rating: 4.9, sold90: 77 }],
    ["hazelnut-eclairs", "bakery", "إكلير بالبندق، ٤ قطع", "Hazelnut Éclairs, 4 pcs", P(5978248), 220, { rating: 4.8, sold90: 64 }],
    ["berry-tart", "bakery", "تارت التوت", "Berry Tart", P(38673820), 95, { rating: 4.7, sold90: 38 }],
    ["butter-croissant", "bakery", "كرواسون فرنسي بالزبدة", "French Butter Croissant", P(15023803), 45, { rating: 4.9, sold90: 212 }],
    ["pistachio-baklava", "bakery", "بقلاوة بالفستق، ٥٠٠ جم", "Pistachio Baklava, 500 g", P(33066196), 420, { compareAtPrice: 470, rating: 4.9, sold90: 93 }],
    ["cheesecake-slice", "bakery", "تشيز كيك بالتوت", "Berry Cheesecake Slice", P(1126359), 110, { rating: 4.6, sold90: 45 }],
    ["bagels", "bakery", "بيغل سادة، ٤ قطع", "Plain Bagels, 4 pcs", P(8599524), 80, { rating: 4.5, sold90: 29 }],
    ["pretzels", "bakery", "بريتزل بالملح، ٦ قطع", "Salted Pretzels, 6 pcs", P(18354020), 90, { rating: 4.4, sold90: 24 }],
    // Pantry
    ["raw-almonds", "pantry", "لوز نيء، ٥٠٠ جم", "Raw Almonds, 500 g", P(57042), 340, { rating: 4.8, sold90: 81 }],
    ["pistachios", "pantry", "فستق حلبي محمص، ٥٠٠ جم", "Roasted Pistachios, 500 g", P(1799307), 480, { isFeatured: true, rating: 4.9, sold90: 97 }],
    ["walnut-halves", "pantry", "عين جمل أنصاف، ٢٥٠ جم", "Walnut Halves, 250 g", P(34415576), 230, { rating: 4.7, sold90: 55 }],
    ["blossom-honey", "pantry", "عسل زهر البرسيم، ٥٠٠ جم", "Clover Blossom Honey, 500 g", P(5634212), 260, { rating: 5, sold90: 124 }],
    ["medjool-dates", "pantry", "بلح مجدول، ١ كجم", "Medjool Dates, 1 kg", P(12042620), 390, { compareAtPrice: 440, rating: 4.9, sold90: 109 }],
    ["cinnamon-sticks", "pantry", "قرفة عيدان، ١٠٠ جم", "Cinnamon Sticks, 100 g", P(5475175), 75, { rating: 4.6, sold90: 48 }],
    ["dark-chocolate", "pantry", "شوكولاتة داكنة ٧٠٪، ١٠٠ جم", "Dark Chocolate 70%, 100 g", P(6167328), 120, { rating: 4.8, sold90: 72 }],
    ["dried-apricots", "pantry", "مشمش مجفف، ٢٥٠ جم", "Dried Apricots, 250 g", P(4499215), 140, { rating: 4.5, sold90: 36 }],
    // Dairy & cheese
    ["camembert", "dairy-cheese", "جبنة كممبير، ٢٥٠ جم", "Camembert, 250 g", P(5202250), 290, { rating: 4.8, sold90: 41 }],
    ["farm-butter", "dairy-cheese", "زبدة فلاحي، ٢٥٠ جم", "Farm Butter, 250 g", P(10165696), 140, { rating: 4.9, sold90: 87 }],
    ["fresh-milk", "dairy-cheese", "حليب بقري طازج، ١ لتر", "Fresh Cow’s Milk, 1 L", P(5946755), 45, { rating: 4.7, sold90: 156 }],
    ["feta", "dairy-cheese", "جبنة فيتا، ٤٠٠ جم", "Feta, 400 g", P(6128854), 110, { rating: 4.6, sold90: 68 }],
    // Coffee & tea
    ["roasted-coffee-beans", "coffee-tea", "بن محمص وسط، ٢٥٠ جم", "Medium Roast Coffee Beans, 250 g", P(12007828), 260, { rating: 4.8, sold90: 79 }],
    ["hibiscus-tea", "coffee-tea", "كركديه أسواني، ٢٠٠ جم", "Aswan Hibiscus, 200 g", P(38293145), 70, { rating: 4.7, sold90: 53 }],
    ["fresh-mint-tea", "coffee-tea", "شاي أخضر بالنعناع، ٢٥ كيس", "Green Mint Tea, 25 bags", P(36228288), 85, { rating: 4.6, sold90: 44 }],
    ["espresso-blend", "coffee-tea", "خلطة إسبريسو، ٢٥٠ جم", "Espresso Blend, 250 g", P(11160148), 290, { rating: 4.9, sold90: 62 }],
  ],
});

export const GROCERY_LUXE = libraryTemplate({
  key: GROCERY_LUXE_KEY,
  version: 2,
  name: L("مذاق", "Mazaq"),
  description: L(
    "بقالة فاخرة بهدوء: فيديو خضار طازج، صور أقسام طويلة وأربعة صفوف للأقسام. لمتاجر الأكل الراقي والمنتجات المختارة.",
    "A quiet fine-food store: a fresh-produce video, tall aisle photos and four category rows. For gourmet grocers and curated food shops.",
  ),
  category: "sweets",
  style: ["luxe"],
  sortOrder: 1350,
  palette: ["#faf6ee", "#efe8d8", "#2f3a24", "#c8902f"],
  colors: {
    primary: "#2f3a24",
    secondary: "#efe8d8",
    background: "#ffffff",
    foreground: "#1e2318",
    muted: "#646a58",
    border: "#e0d8c6",
    accent: "#c8902f",
  },
  fonts: { heading: "Noto Naskh Arabic", body: "Readex Pro" },
  radius: 4,
  containerMaxWidth: 1440,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن مذاق", "About"), seo: { title: L("عن مذاق", "About Mazaq") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل معنا", "Contact us"),
        text: L("٨ شارع البرازيل، الزمالك، القاهرة. يوميًا من ٨ صباحًا حتى ١١ مساءً.", "8 Brazil St, Zamalek, Cairo. Open daily from 8am to 11pm."),
        heading: L("لديك سؤال عن منتج؟", "A question about a product?"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المنتجات والأوزان والطلبات.", "Products, weights and orders."),
        question: L("كيف أحفظ الجبن والألبان؟", "How should I store cheese and dairy?"),
        answer: L(
          "احفظها في الثلاجة فور الاستلام، وراجع تاريخ الصلاحية المكتوب على كل عبوة.",
          "Keep them in the fridge once they arrive and check the date on each pack.",
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
    copy: { reviews: L("آراء عملائنا", "What our customers say"), related: L("يُقدَّم معه", "Serve it with") },
  },
});
