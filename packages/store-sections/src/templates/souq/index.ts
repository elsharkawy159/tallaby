/**
 * Souq (template 105, online supermarket; Claude Design "Storefront
 * Templates"): pale green-white paper, a leaf green for actions and a
 * sunny yellow highlight, Lalezar headings on Changa and 16px corners.
 * Fresh groceries the same day: banners for fruit and veg, bakery and
 * pantry, aisles, today's shelf, 45-minute zones and help on WhatsApp.
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
    "ابحث عن منتج…": L("عيش، خضار، رز…", "Bread, veg, rice…"),
    "وصل حديثًا": L("خضار وفاكهة", "Fruit & veg"),
    "الأكثر مبيعًا": L("مخبوزات", "Bakery"),
    "العروض": L("ألبان وبيض", "Dairy & eggs"),
    "هدايا": L("بقالة", "Pantry"),
    "إكسسوارات": L("الأكثر مبيعاً", "Best sellers"),
    "توصيل خلال ٤٨ ساعة": L("نفس اليوم للطلبات قبل ٢ الضهر", "Same day for orders before 2 pm"),
  },
  links: { "/products": [undefined, search("خضار"), search("عيش"), search("لبن"), search("بقالة"), BEST] },
});

const footer = lib("footer-ruled", {
  text: {
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "منتجات أصلية بضمان، توصلك لحد البيت.": L("بقالة طازة توصلك في نفس اليوم.", "Fresh groceries delivered the same day."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ سوق. كل الحقوق محفوظة.", "© 2026 Souq. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.produceBanner, PHOTOS.bakeryBanner, PHOTOS.pantryBanner],
    text: {
      "وصل حديثًا": L("طازة النهارده", "Fresh today"),
      "الموسم الجديد وصل": L("من السوق لباب البيت", "From the market to your door"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("اطلب قبل ٢ الضهر يوصلك في نفس اليوم.", "Order before 2 pm for same-day delivery."),
      "تسوّق الجديد": L("تسوق خضار وفاكهة", "Shop fruit & veg"),
      "صورة الحملة الأولى": L("طبقين فاكهة على رخامة المطبخ", "Two bowls of fruit on a kitchen counter"),
      "الأكثر مبيعًا": L("المخبوزات", "Bakery"),
      "المفضّلة عند عملائنا": L("عيش بيتخبز كل يوم الصبح", "Bread baked every morning"),
      "القطع اللي بترجع لها كل مرة.": L("بلدي وفينو وساوردو.", "Baladi, fino and sourdough."),
      "شوف الأكثر مبيعًا": L("تسوق مخبوزات", "Shop bakery"),
      "صورة الحملة الثانية": L("رغيف عيش محمّر على خلفية سودا", "A crusty loaf on a dark background"),
      "عروض الأسبوع": L("البقالة", "Pantry"),
      "خصومات لفترة محدودة": L("اتموّن بالأساسيات", "Stock up on the basics"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("رز ومكرونة وتوابل بأسعار كل يوم.", "Rice, pasta and spices at everyday prices."),
      "تسوّق العروض": L("تسوق بقالة", "Shop pantry"),
      "صورة الحملة الثالثة": L("برطمانات توابل وحبوب على رف خشب", "Jars of spices and grains on a wooden shelf"),
    },
    links: { "/products": [search("خضار"), search("عيش"), search("بقالة")] },
  }),
  lib("categories-tiles", {
    photo: [PHOTOS.basket, PHOTOS.loaf, PHOTOS.pantry, PHOTOS.eggs],
    text: {
      "تسوّق حسب القسم": L("الأقسام", "Aisles"),
      "اختر القسم الذي يناسبك من كل ما نقدمه.": L("كل اللي البيت محتاجه، من غير ما تنزل.", "Everything the house needs, without going out."),
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
      "منتجاتنا": L("النهارده", "Today"),
      "وصل جديد": L("وصل جديد", "New in"),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [NEW, BEST, RATED] },
  }),
  lib("pay-zones", {
    text: {
      "بنوصل لكل مصر": L("مناطق الـ٤٥ دقيقة", "45-minute zones"),
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
      "٤–٦ أيام": L("ساعة ونص", "90 min"),
      "٩٥ ج.م": L("٢٥ ج.م", "EGP 25"),
    },
  }),
  lib("service-support", {
    text: {
      "الدعم": L("إحنا موجودين", "We are here"),
      "محتاج مساعدة؟": L("نسيت حاجة؟", "Forgot something?"),
      "بنرد في أقل من ساعة": L("ابعتها وهنضيفها لطلبك", "Message us and we add it to your order"),
      "من ١٠ ص لـ ١٠ م": L("من ٨ الصبح لـ ١٢ بالليل", "8 am – midnight"),
      "زور فرع": L("عدّي علينا", "Drop by"),
      "٣ فروع في القاهرة": L("٢٥ شارع مصدق، الدقي", "25 Mossadak St, Dokki"),
      "من غير معاد": L("مفتوح كل يوم", "Open every day"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن سوق", "About Souq"), L("بقالة طازة توصلك في نفس اليوم.", "Fresh groceries delivered the same day.")),
  aboutStory(lib, {
    photo: PHOTOS.fruitWide,
    alt: L("سبت خوص فيه فاكهة وورد", "A wicker basket of fruit and flowers"),
    eyebrow: L("الدقي", "Dokki"),
    title: L("السوق كله في موبايلك", "The whole market on your phone"),
    text: L("بنشتري الخضار والفاكهة من السوق كل يوم الصبح، والعيش من الفرن، ونجهز طلبك على طول.", "We buy fruit and veg at the market every morning and bread from the bakery, then pack your order right away."),
    more: L("اطلب قبل ٢ الضهر ويوصلك في نفس اليوم.", "Order before 2 pm and it arrives the same day."),
    button: L("تسوق دلوقتي", "Shop now"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("بقالة طازة توصلك في نفس اليوم.", "Fresh groceries delivered the same day."),
  categories: [
    ["produce", "خضار وفاكهة", "Fruit & veg", PHOTOS.basket],
    ["bakery", "مخبوزات", "Bakery", PHOTOS.loaf],
    ["pantry", "بقالة", "Pantry", PHOTOS.pantry],
    ["dairy", "ألبان وبيض", "Dairy & eggs", PHOTOS.eggs],
  ],
  products: [
    ["fresh-sourdough", "bakery", "عيش ساوردو", "Fresh Sourdough", PHOTOS.loaf, 95, { isFeatured: true, rating: 4.7, sold90: 240 }],
    ["fruit-basket", "produce", "سبت فاكهة", "Fruit Basket", PHOTOS.basket, 260, { sold90: 180 }],
    ["pantry-pack", "pantry", "باكدج بقالة", "Pantry Pack", PHOTOS.pantry, 280, { compareAtPrice: 320, sold90: 96 }],
    ["spice-set", "pantry", "طقم توابل", "Spice Set", PHOTOS.spices, 210, { sold90: 30 }],
    ["greens-bundle", "produce", "باقة ورقيات", "Greens Bundle", PHOTOS.herbs, 140, { sold90: 61 }],
    ["farm-eggs-12", "dairy", "بيض بلدي ١٢ بيضة", "Farm Eggs, 12", PHOTOS.eggs, 85, { sold90: 300 }],
    ["fresh-milk", "dairy", "لبن طازة ١ لتر", "Fresh Milk, 1 L", PHOTOS.milk, 45, { sold90: 280 }],
    ["white-cheese", "dairy", "جبنة بيضا ٥٠٠ جم", "White Cheese, 500 g", PHOTOS.cheese, 110, { rating: 4.8, sold90: 150 }],
    ["lemons-1kg", "produce", "ليمون ١ كيلو", "Lemons, 1 kg", PHOTOS.lemons, 30, { compareAtPrice: 40, inStock: false, sold90: 90 }],
  ],
});

export const SOUQ = libraryTemplate({
  key: SOUQ_KEY,
  version: 3,
  changelog: "Souq v3: hero first, section order",
  productPage: { thumbs: "bottom", band: "brand", extras: ["product-shipping"], copy: { back: L("رجوع للسوق", "Back to the aisles"), reviews: L("آراء اللي اشتروا", "From shoppers like you"), related: L("ضيف على سلتك", "Add to your basket") } },
  name: L("سوق", "Souq"),
  description: L(
    "سوبر ماركت أونلاين: بانرات متحركة، الأقسام، رف النهارده، مناطق الـ٤٥ دقيقة والدعم. أربع صفحات جاهزة.",
    "Online supermarket: a banner carousel, aisles, today's shelf, 45-minute zones and support. Four ready pages.",
  ),
  category: "food",
  sortOrder: 1050,
  palette: ["#f7f8f2", "#e9eddc", "#ffcc33", "#2f7d32"],
  colors: {
    primary: "#2f7d32",
    secondary: "#e9eddc",
    background: "#f7f8f2",
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
        text: L("ابعتلنا على souq@souq.eg أو على واتساب.", "Write to souq@souq.eg or on WhatsApp."),
        heading: L("اسأل عن منتج مش لاقيه", "Ask about a product you cannot find"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والدفع والاسترجاع.", "Delivery, payment and returns."),
        question: L("لو منتج ناقص من الطلب؟", "What if an item is missing?"),
        answer: L("كلمنا على واتساب ونبعته في نفس اليوم أو نرجعلك تمنه.", "Message us on WhatsApp and we send it the same day or refund it."),
      }),
    },
  ],
  demo: DEMO,
});
