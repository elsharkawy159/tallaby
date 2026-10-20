/**
 * Dokan (template 74, neighbourhood minimarket; Claude Design "Storefront
 * Templates"): white paper, a corner-shop blue for actions and a bright
 * yellow highlight, Rubik throughout and 12px corners. The corner shop in
 * 45 minutes: the free-delivery goal, aisles, today's shelf, delivery
 * zones, cash, card or wallet, and Gamal on WhatsApp. Built from section
 * library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): fruit bowls on a
 * counter, a crusty loaf, pantry jars, milk bottles, eggs, white cheese,
 * spice jars, a fruit and veg tote, fresh herbs, potatoes and lemons. No
 * people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const DOKAN_KEY = "dokan";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(DOKAN_KEY, getDesign(id)!, { corners: 12, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  fruitBowls: pexels(10821202, 900),
  fruitBowlsWide: pexels(10821202),
  loaf: pexels(4881596, 900),
  pantry: pexels(3737639, 900),
  milk: pexels(4578396, 900),
  eggs: pexels(4110225, 900),
  cheese: pexels(36570893, 900),
  spices: pexels(458796, 900),
  tote: pexels(16999667, 900),
  herbs: pexels(4113927, 900),
  potatoes: pexels(36400786, 900),
  lemons: pexels(31428126, 900),
};

const NAME = L("دكان جمال", "Dokan Gamal");

const header = lib("header-search", {
  text: {
    "م": L("د", "D"),
    "اسم متجرك": NAME,
    "ابحث عن منتج…": L("لبن، عيش، بيض…", "Milk, bread, eggs…"),
    "وصل حديثًا": L("خضار وفاكهة", "Fruit & veg"),
    "الأكثر مبيعًا": L("مخبوزات", "Bakery"),
    "العروض": L("ألبان وبيض", "Dairy & eggs"),
    "هدايا": L("بقالة", "Pantry"),
    "إكسسوارات": L("توابل", "Spices"),
    "توصيل خلال ٤٨ ساعة": L("توصيل ٤٥ دقيقة", "45-minute delivery"),
  },
  links: { "/products": [undefined, search("خضار"), search("عيش"), search("لبن"), search("بقالة"), search("توابل")] },
});

const footer = lib("footer-help", {
  text: {
    "م": L("د", "D"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ دكان جمال. كل الحقوق محفوظة.", "© 2026 Dokan Gamal. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED], "/contact": "/profile/orders" },
});

const home: Design[] = [
  lib("cart-free-delivery", {
    text: {
      "١٥٠٠ ج.م": L("٣٠٠ ج.م", "EGP 300"),
      "والتوصيل عليك مجاني": L("والتوصيل في ٤٥ دقيقة ببلاش", "and 45-minute delivery is free"),
    },
    links: { "/products": BEST },
  }),
  lib("categories-tiles", {
    photo: [PHOTOS.fruitBowls, PHOTOS.loaf, PHOTOS.pantry, PHOTOS.milk],
    text: {
      "تسوّق حسب القسم": L("الأقسام", "Aisles"),
      "اختر القسم الذي يناسبك من كل ما نقدمه.": L("كل اللي في الدكان، من غير ما تنزل.", "Everything in the shop, without leaving home."),
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
      "التوصيل": L("التوصيل", "Delivery"),
      "بنوصل لكل مصر": L("مناطق الـ٤٥ دقيقة", "45-minute zones"),
      "المدة والمصاريف حسب محافظتك.": L("المدة والمصاريف حسب منطقتك.", "Time and fee depend on your area."),
      "توصيل مجاني للطلبات فوق ١٬٥٠٠ ج.م": L("توصيل مجاني للطلبات فوق ٣٠٠ ج.م", "Free delivery on orders over EGP 300"),
      "القاهرة والجيزة": L("الدقي", "Dokki"),
      "١–٢ يوم": L("٤٥ دقيقة", "45 min"),
      "٥٠ ج.م": L("١٥ ج.م", "EGP 15"),
      "الإسكندرية والدلتا": L("العجوزة", "Agouza"),
      "مدن القناة": L("الزمالك", "Zamalek"),
      "٢–٣ أيام": L("٤٥ دقيقة", "45 min"),
      "٦٥ ج.م": L("١٥ ج.م", "EGP 15"),
      "الصعيد": L("المهندسين", "Mohandessin"),
      "٣–٥ أيام": L("ساعة", "60 min"),
      "٨٠ ج.م": L("٢٠ ج.م", "EGP 20"),
      "البحر الأحمر وسيناء": L("إمبابة", "Imbaba"),
      "٤–٦ أيام": L("ساعة وربع", "75 min"),
      "٩٥ ج.م": L("٢٥ ج.م", "EGP 25"),
    },
  }),
  lib("pay-methods", {
    text: {
      "ادفع بالطريقة اللي تريحك": L("كاش أو كارت أو محفظة", "Cash, card or wallet"),
      "ادفع للمندوب بعد ما تفتح الطلب.": L("ادفع للمندوب لما الطلب يوصل.", "Pay the courier when your order arrives."),
      "كارت بنكي": L("كارت على الباب", "Card at the door"),
      "فيزا وماستركارد وميزة.": L("المندوب معاه ماكينة فيزا وميزة.", "The courier carries a Visa and Meeza card machine."),
      "تقسيط": L("إنستاباي", "InstaPay"),
      "لحد ٢٤ شهر من غير مقدم.": L("حوّل على حساب الدكان وابعت الإيصال.", "Transfer to the shop’s account and send the receipt."),
      "فاليو · سيمبل · سهولة": L("من غير رسوم", "No fees"),
      "حوّل من موبايلك في ثانية.": L("حوّل من موبايلك قبل ما المندوب يوصل.", "Transfer from your phone before the courier arrives."),
      "فودافون كاش · إنستاباي": L("كل المحافظ الإلكترونية", "Every mobile wallet"),
    },
  }),
  lib("service-support", {
    text: {
      "الدعم": L("جمال موجود", "Gamal is here"),
      "محتاج مساعدة؟": L("نسيت حاجة؟", "Forgot something?"),
      "بنرد في أقل من ساعة": L("ابعتها وهنضيفها لطلبك", "Message us and we add it to your order"),
      "١٩١٢٣": L("٠١٠ ١٢٣٤ ٥٦٧٨", "010 1234 5678"),
      "من ١٠ ص لـ ١٠ م": L("من ٨ الصبح لـ ٢ بالليل", "8 am – 2 am"),
      "زور فرع": L("عدّي على الدكان", "Drop by the shop"),
      "٣ فروع في القاهرة": L("١٢ شارع التحرير، الدقي", "12 Tahrir St, Dokki"),
      "من غير معاد": L("مفتوح كل يوم", "Open every day"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن دكان جمال", "About Dokan Gamal"), L("دكان الحي في الدقي من ١٩٩٥.", "The Dokki corner shop since 1995.")),
  aboutStory(lib, {
    photo: PHOTOS.fruitBowlsWide,
    alt: L("طبقين فاكهة على رخامة المطبخ", "Two bowls of fruit on a kitchen counter"),
    eyebrow: L("الدقي", "Dokki"),
    title: L("الدكان اللي عارف اسمك", "The shop that knows your name"),
    text: L("جمال فتح الدكان سنة ١٩٩٥، والنهارده نفس الدكان بيوصلك في ٤٥ دقيقة.", "Gamal opened the shop in 1995; today the same shop delivers in 45 minutes."),
    more: L("ولو نسيت حاجة، ابعتها على واتساب ونضيفها قبل ما المندوب يتحرك.", "And if you forget something, send it on WhatsApp and we add it before the courier leaves."),
    button: L("تسوق دلوقتي", "Shop now"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("كل حاجة من الدكان، في ٤٥ دقيقة.", "Everything from the corner shop, in 45 minutes."),
  categories: [
    ["produce", "خضار وفاكهة", "Fruit & veg", PHOTOS.fruitBowls],
    ["bakery", "مخبوزات", "Bakery", PHOTOS.loaf],
    ["dairy", "ألبان وبيض", "Dairy & eggs", PHOTOS.milk],
    ["pantry", "بقالة", "Pantry", PHOTOS.pantry],
  ],
  products: [
    ["fresh-sourdough", "bakery", "عيش ساوردو", "Fresh Sourdough", PHOTOS.loaf, 95, { isFeatured: true, rating: 4.7, sold90: 240 }],
    ["veg-basket", "produce", "سلة خضار", "Veg Basket", PHOTOS.tote, 260, { sold90: 180 }],
    ["pantry-pack", "pantry", "باكدج بقالة", "Pantry Pack", PHOTOS.pantry, 280, { compareAtPrice: 320, sold90: 96 }],
    ["spice-set", "pantry", "طقم توابل", "Spice Set", PHOTOS.spices, 210, { sold90: 30 }],
    ["greens-bundle", "produce", "باقة ورقيات", "Greens Bundle", PHOTOS.herbs, 140, { sold90: 61 }],
    ["eggs-12", "dairy", "بيض بلدي ١٢ بيضة", "Farm Eggs, 12", PHOTOS.eggs, 85, { sold90: 300 }],
    ["fresh-milk", "dairy", "لبن طازة ١ لتر", "Fresh Milk, 1 L", PHOTOS.milk, 45, { sold90: 280 }],
    ["white-cheese", "dairy", "جبنة بيضا ٥٠٠ جم", "White Cheese, 500 g", PHOTOS.cheese, 110, { rating: 4.8, sold90: 150 }],
    ["potatoes-2kg", "produce", "بطاطس ٢ كيلو", "Potatoes, 2 kg", PHOTOS.potatoes, 40, { sold90: 120 }],
    ["lemons-1kg", "produce", "ليمون ١ كيلو", "Lemons, 1 kg", PHOTOS.lemons, 30, { compareAtPrice: 40, sold90: 90 }],
  ],
});

export const DOKAN = libraryTemplate({
  key: DOKAN_KEY,
  version: 1,
  name: L("دكان", "Dokan"),
  description: L(
    "سوبر ماركت الحي: هدف التوصيل المجاني، الأقسام، رف النهارده، مناطق الـ٤٥ دقيقة، طرق الدفع وواتساب الدكان. أربع صفحات جاهزة.",
    "Neighbourhood minimarket: free-delivery goal, aisles, today’s shelf, 45-minute zones, ways to pay and the shop’s WhatsApp. Four ready pages.",
  ),
  category: "food",
  sortOrder: 740,
  palette: ["#ffffff", "#f2f5f7", "#ffcf33", "#0b6bcb"],
  colors: {
    primary: "#0b6bcb",
    secondary: "#f2f5f7",
    background: "#ffffff",
    foreground: "#0f1d26",
    muted: "#4a5a64",
    border: "#e2e8ec",
    accent: "#ffcf33",
  },
  fonts: { heading: "Rubik", body: "Rubik" },
  radius: 12,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن دكان جمال", "About"), seo: { title: L("عن دكان جمال", "About Dokan Gamal") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("١٢ شارع التحرير، الدقي.", "12 Tahrir St, Dokki."),
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
