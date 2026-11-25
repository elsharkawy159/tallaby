/**
 * Souq (template 105, online supermarket; Claude Design "Storefront
 * Templates"): pale green-white paper, a leaf green for actions and a
 * sunny yellow highlight, Lalezar headings on Changa and 16px corners.
 * Fresh groceries the same day: banners for fruit and veg, bakery and
 * pantry, aisles, today's shelf, 45-minute zones, the fruit and veg as a
 * carousel (the store's 1st category) and help on WhatsApp.
 * Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-23): fruit bowls on a
 * counter, a crusty loaf, spice and pantry jars, a market basket of fruit
 * and flowers, fresh herbs, eggs, milk bottles, white cheese and lemons.
 * No people, no hands, no logos (the design's veg-box photo with a hand
 * and its greens photo with a woman were replaced).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const SOUQ_KEY = "souq";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SOUQ_KEY, getDesign(id)!, { corners: 16, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  produceBanner: pexels(10821202),
  bakeryBanner: pexels(4881596),
  pantryBanner: pexels(458796),
  basket: pexels(16999667, 900),
  fruitBowls: pexels(10821202, 900),
  loaf: pexels(4881596, 900),
  pantry: pexels(3737639, 900),
  spices: pexels(458796, 900),
  herbs: pexels(4113927, 900),
  eggs: pexels(4110225, 900),
  milk: pexels(4578396, 900),
  cheese: pexels(36570893, 900),
  lemons: pexels(31428126, 900),
  fruitWide: pexels(16999667),
};

const NAME = L("سوق", "Souq");

const header = lib("header-search", {
  text: {
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "ابحث عن منتج…": L("خبز، خضار، أرز…", "Bread, veg, rice…"),
    "وصل حديثًا": L("خضار وفاكهة", "Fruit & veg"),
    "الأكثر مبيعًا": L("مخبوزات", "Bakery"),
    "العروض": L("ألبان وبيض", "Dairy & eggs"),
    "هدايا": L("بقالة", "Pantry"),
    "إكسسوارات": L("الأكثر مبيعاً", "Best sellers"),
    "صور ومواصفات لكل منتج": L("صور وأوزان واضحة لكل منتج", "Clear photos and weights for every product"),
  },
  links: { "/products": [undefined, search("خضار"), search("عيش"), search("لبن"), search("بقالة"), BEST] },
});

const footer = lib("footer-ruled", {
  text: {
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "منتجات مختارة بعناية لكل يوم.": L("خضار وفاكهة ومخبوزات وبقالة يومية.", "Fruit, veg, bakery and everyday groceries."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ سوق. كل الحقوق محفوظة.", "© 2026 Souq. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.produceBanner, PHOTOS.bakeryBanner, PHOTOS.pantryBanner],
    text: {
      "وصل حديثًا": L("وصل حديثًا", "New in"),
      "الموسم الجديد وصل": L("خضار وفاكهة طازجة", "Fresh fruit and veg"),
      "قطع مختارة بعناية لكل يوم.": L("تشكيلة خضار وفاكهة بالوزن الذي تختاره.", "Fruit and veg by the weight you choose."),
      "تسوّق الجديد": L("تسوق خضار وفاكهة", "Shop fruit & veg"),
      "صورة الحملة الأولى": L("طبقا فاكهة على رخام المطبخ", "Two bowls of fruit on a kitchen counter"),
      "الأكثر مبيعًا": L("المخبوزات", "Bakery"),
      "المفضّلة عند عملائنا": L("مخبوزات متنوعة", "A range of breads"),
      "القطع الأكثر طلبًا في المتجر.": L("خبز بلدي وفينو وساوردو.", "Baladi, fino and sourdough."),
      "تصفّح الأكثر مبيعًا": L("تسوق مخبوزات", "Shop bakery"),
      "صورة الحملة الثانية": L("رغيف خبز محمّر على خلفية سوداء", "A crusty loaf on a dark background"),
      "مختارات الأسبوع": L("البقالة", "Pantry"),
      "قطع مختارة لهذا الأسبوع": L("الأساسيات اليومية", "Everyday basics"),
      "تشكيلة مختارة من أحدث القطع في المتجر.": L("أرز ومكرونة وتوابل.", "Rice, pasta and spices."),
      "تسوّق المختارات": L("تسوق بقالة", "Shop pantry"),
      "صورة الحملة الثالثة": L("برطمانات توابل وحبوب على رف خشب", "Jars of spices and grains on a wooden shelf"),
    },
    links: { "/products": [search("خضار"), search("عيش"), search("بقالة")] },
  }),
  lib("categories-tiles", {
    photo: [PHOTOS.basket, PHOTOS.loaf, PHOTOS.pantry, PHOTOS.eggs],
    text: {
      "تسوّق حسب القسم": L("الأقسام", "Aisles"),
      "اختر القسم الذي يناسبك من كل ما نقدمه.": L("خضار وفاكهة ومخبوزات وألبان وبقالة.", "Fruit, veg, bakery, dairy and pantry."),
      "كل الأقسام": L("كل المنتجات", "All products"),
      "وصل حديثًا": L("خضار وفاكهة", "Fruit & veg"),
      "الأكثر مبيعًا": L("مخبوزات", "Bakery"),
      "العروض": L("بقالة", "Pantry"),
      "هدايا": L("ألبان وبيض", "Dairy & eggs"),
    },
    links: { "/products": [SHOP, search("خضار"), search("عيش"), search("بقالة"), search("لبن")] },
  }),
  lib("products-tabbed", {
    text: {
      "منتجاتنا": L("منتجاتنا", "Our products"),
      "وصل جديد": L("وصل جديد", "New in"),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [NEW, BEST, RATED] },
  }),
  lib("pay-zones", {
    text: {
      "نوصّل إلى كل مصر": L("مناطق التوصيل", "Delivery zones"),
      "المدة والمصاريف حسب محافظتك.": L("المدة والمصاريف حسب منطقتك.", "Time and fee depend on your area."),
      "توصيل مجاني للطلبات فوق ١٬٥٠٠ ج.م": L("توصيل مجاني للطلبات فوق ٤٠٠ ج.م", "Free delivery on orders over EGP 400"),
      "القاهرة والجيزة": L("الدقي", "Dokki"),
      "١–٢ يوم": L("٣٠ دقيقة", "30 min"),
      "٥٠ ج.م": L("١٠ ج.م", "EGP 10"),
      "الإسكندرية والدلتا": L("العجوزة", "Agouza"),
      "مدن القناة": L("الزمالك", "Zamalek"),
      "٢–٣ أيام": L("٤٥ دقيقة", "45 min"),
      "٦٥ ج.م": L("١٥ ج.م", "EGP 15"),
      "الصعيد": L("المهندسين", "Mohandessin"),
      "٣–٥ أيام": L("ساعة", "60 min"),
      "٨٠ ج.م": L("٢٠ ج.م", "EGP 20"),
      "البحر الأحمر وسيناء": L("بولاق الدكرور", "Boulaq El Dakrour"),
      "٤–٦ أيام": L("ساعة ونصف", "90 min"),
      "٩٥ ج.م": L("٢٥ ج.م", "EGP 25"),
    },
  }),
  // The store's 1st category (fruit and veg, in the demo) as a carousel.
  lib("products-category-carousel", { lists: [undefined, { limit: 4 }] }),
  lib("service-support", {
    text: {
      "الدعم": L("الدعم", "Support"),
      "هل تحتاج إلى مساعدة؟": L("هل نسيت منتجًا؟", "Forgot an item?"),
      "نرد خلال أقل من ساعة": L("تواصل معنا بشأن طلبك", "Contact us about your order"),
      "من ١٠ ص إلى ١٠ م": L("من ٨ صباحًا حتى منتصف الليل", "8 am to midnight"),
      "زُر أحد فروعنا": L("زُر متجرنا", "Visit us"),
      "٣ فروع في القاهرة": L("٢٥ شارع مصدق، الدقي", "25 Mossadak St, Dokki"),
      "بدون موعد": L("مفتوح يوميًا", "Open every day"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن سوق", "About Souq"), L("خضار وفاكهة ومخبوزات وبقالة يومية.", "Fruit, veg, bakery and everyday groceries.")),
  aboutStory(lib, {
    photo: PHOTOS.fruitWide,
    alt: L("سلة خوص بها فاكهة وزهور", "A wicker basket of fruit and flowers"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("البقالة كلها في هاتفك", "Your groceries on your phone"),
    text: L("نختار الخضار والفاكهة والمخبوزات والبقالة، ونعرض وزن وسعر كل منتج بوضوح.", "We choose fruit, veg, bakery and pantry goods, and show every product's weight and price clearly."),
    more: L("تواصل معنا لأي سؤال عن منتج أو طلب.", "Contact us with any question about a product or an order."),
    button: L("تسوق الآن", "Shop now"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("خضار وفاكهة ومخبوزات وبقالة يومية.", "Fruit, veg, bakery and everyday groceries."),
  categories: [
    ["produce", "خضار وفاكهة", "Fruit & veg", PHOTOS.basket],
    ["bakery", "مخبوزات", "Bakery", PHOTOS.loaf],
    ["pantry", "بقالة", "Pantry", PHOTOS.pantry],
    ["dairy", "ألبان وبيض", "Dairy & eggs", PHOTOS.eggs],
  ],
  products: [
    ["fresh-sourdough", "bakery", "خبز ساوردو", "Fresh Sourdough", PHOTOS.loaf, 95, { isFeatured: true, rating: 4.7, sold90: 240 }],
    ["fruit-basket", "produce", "سلة فاكهة", "Fruit Basket", PHOTOS.basket, 260, { sold90: 180 }],
    ["pantry-pack", "pantry", "مجموعة بقالة", "Pantry Pack", PHOTOS.pantry, 280, { compareAtPrice: 320, sold90: 96 }],
    ["spice-set", "pantry", "طقم توابل", "Spice Set", PHOTOS.spices, 210, { sold90: 30 }],
    ["greens-bundle", "produce", "باقة ورقيات", "Greens Bundle", PHOTOS.herbs, 140, { sold90: 61 }],
    ["farm-eggs-12", "dairy", "بيض بلدي ١٢ بيضة", "Farm Eggs, 12", PHOTOS.eggs, 85, { sold90: 300 }],
    ["fresh-milk", "dairy", "حليب طازج ١ لتر", "Fresh Milk, 1 L", PHOTOS.milk, 45, { sold90: 280 }],
    ["white-cheese", "dairy", "جبن أبيض ٥٠٠ جم", "White Cheese, 500 g", PHOTOS.cheese, 110, { rating: 4.8, sold90: 150 }],
    ["lemons-1kg", "produce", "ليمون ١ كيلو", "Lemons, 1 kg", PHOTOS.lemons, 30, { compareAtPrice: 40, inStock: false, sold90: 90 }],
    // The fourth for fruit and veg, so its carousel fills a row of four (v4).
    ["mixed-fruit-bowl", "produce", "تشكيلة فاكهة", "Mixed Fruit Selection", PHOTOS.fruitBowls, 220, { sold90: 18 }],
  ],
});

export const SOUQ = libraryTemplate({
  key: SOUQ_KEY,
  version: 4,
  changelog: "Souq v4: a fruit and veg carousel (the store's 1st category) on the home",
  productPage: { thumbs: "bottom", band: "brand", extras: ["product-shipping"], copy: { reviews: L("آراء المشترين", "Shopper reviews"), related: L("أضف إلى سلتك", "Add to your basket") } },
  name: L("سوق", "Souq"),
  description: L(
    "سوبر ماركت إلكتروني: لافتات متحركة، الأقسام، رف اليوم، مناطق التوصيل والدعم. أربع صفحات جاهزة.",
    "Online supermarket: a banner carousel, aisles, today's shelf, delivery zones and support. Four ready pages.",
  ),
  category: "food",
  style: ["bold"],
  sortOrder: 1050,
  palette: ["#f7f8f2", "#e9eddc", "#ffcc33", "#2f7d32"],
  colors: {
    primary: "#2f7d32",
    secondary: "#e9eddc",
    background: "#ffffff",
    foreground: "#1c2416",
    muted: "#5e6955",
    border: "#d8dfc6",
    accent: "#ffcc33",
  },
  fonts: { heading: "Lalezar", body: "Changa" },
  radius: 16,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن سوق", "About"), seo: { title: L("عن سوق", "About Souq") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("راسلنا على souq@souq.eg.", "Write to souq@souq.eg."),
        heading: L("اسأل عن منتج لم تجده", "Ask about a product you cannot find"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والدفع والاسترجاع.", "Delivery, payment and returns."),
        question: L("ماذا لو كان منتج ناقصًا من الطلب؟", "What if an item is missing?"),
        answer: L("تواصل معنا لأي مشكلة في طلبك.", "Contact us about any problem with your order."),
      }),
    },
  ],
  demo: DEMO,
});
