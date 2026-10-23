/**
 * Sabaho (template 42, breakfast and pantry delivery; Claude Design
 * "Storefront Templates"): warm white paper, a sunny yellow highlight and a
 * leaf green for actions, Alexandria throughout and 16px corners. A morning
 * delivery shop: a free-delivery goal from the cart, order tonight for
 * breakfast by 9, the weekend breakfast set, the most reordered, the weekly
 * veg box by quantity, delivery areas, order cut-offs, the SABAH10 coupon
 * and order tracking. Built from section library designs (`fromLibrary`).
 *
 * Delivery zone fees are section copy (checkout still uses governorate
 * fees) and there is no delivery-slot picker. The library zones table has
 * five rows where rows two and three share a time and fee, so the design's
 * three areas are split into five. Bundle and quantity savings are display
 * only (typed totals). The hero's "Delivery areas" anchor goes to the
 * shipping page.
 *
 * Photos: Pexels, each checked by eye (2026-10-23): market baskets of
 * vegetables, a straw bag of fruit and vegetables, fresh herbs on a board,
 * a sourdough loaf, labelled pantry jars, spice jars, jar shelves, a tray
 * of eggs, milk bottles on a sill, white cheese with herbs and fruit bowls
 * on a kitchen counter. No people, no hands and no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const SABAHO_KEY = "sabaho";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SABAHO_KEY, getDesign(id)!, { corners: 16, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;
const VEG = search("خضار");

const PHOTOS = {
  marketWide: pexels(37321079),
  vegBox: pexels(37321079, 900),
  basket: pexels(16999667, 900),
  herbs: pexels(4113927, 900),
  sourdough: pexels(4881596, 900),
  pantry: pexels(3737639, 900),
  spices: pexels(458796, 900),
  jarShelves: pexels(4440173, 900),
  eggs: pexels(4110225, 900),
  milk: pexels(4578396, 900),
  cheese: pexels(36570893, 900),
  fruitBowls: pexels(10821202),
};

const NAME = L("صباحو", "Sabaho");

const header = lib("header-line", {
  text: {
    "م": L("ص", "S"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("خضار وفاكهة", "Fruit & veg"),
    "المدونة": L("المخبوزات", "Bakery"),
    "تواصل معنا": L("تتبع الطلب", "Track order"),
  },
  links: { "/products": [SHOP, VEG, undefined, SHOP, VEG], "/blog": search("عيش"), "/contact": "/profile/orders" },
});

const footer = lib("footer-help", {
  text: {
    "م": L("ص", "S"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ صباحو. كل الحقوق محفوظة.", "© 2026 Sabaho. All rights reserved."),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("cart-free-delivery", { text: { "١٥٠٠ ج.م": L("٦٠٠ ج.م", "EGP 600") } }),
  lib("hero-halves", {
    photo: [undefined, PHOTOS.marketWide],
    text: {
      "كوليكشن الموسم": L("توصيل الفطار", "Breakfast delivery"),
      "صوت أنقى، كل يوم": L("اطلب بالليل، الفطار قبل ٩", "Order tonight, breakfast by 9"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "عيش متخبز ٥ الصبح، خضار متقطف امبارح، وبقالة البيت في نفس البوكس.",
        "Bread baked at 5 am, vegetables picked yesterday, and pantry staples in the same box.",
      ),
      "تسوق الآن": L("ابدأ البوكس", "Start your box"),
      "العروض": L("مناطق التوصيل", "Delivery areas"),
      "صورة الحملة": L("سبت خضار في السوق", "Market baskets of vegetables"),
    },
    links: { "/products": [SHOP, "/shipping"] },
  }),
  lib("bundle-plus", {
    text: {
      "اشتريهم مع بعض ووفّر": L("فطار الويك إند", "The weekend breakfast"),
      "١٬٢٧٠ ج.م": L("٥٠٠ ج.م", "EGP 500"),
      "بدل ١٬٤٩٠ ج.م": L("بدل ٥٥٥ ج.م", "Instead of EGP 555"),
      "وفّر ٢٢٠ ج.م": L("وفّر ٥٥ ج.م", "Save EGP 55"),
    },
  }),
  lib("products-rows", {
    text: { "إكسسوارات بسعر حلو": L("الأكتر إعادة طلب", "Most reordered") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 6 }],
  }),
  lib("bundle-quantity", {
    text: {
      "وفّر مع الكمية": L("البوكس الأسبوعي", "Weekly box"),
      "قطعة واحدة": L("بوكس واحد", "One box"),
      "قطعتين": L("بوكسين", "Two boxes"),
      "على القطعة التانية": L("على البوكسين", "On both boxes"),
      "وفّر ١٠٪": L("وفّر ٨٪", "Save 8%"),
      "٣ قطع": L("٤ بوكسات", "Four boxes"),
      "وفّر ١٨٪": L("وفّر ١٥٪", "Save 15%"),
      "اختار عدد القطع من السلة.": L("اختار عدد البوكسات من السلة.", "Choose how many boxes in the cart."),
    },
    lists: [{ source: "featured" }],
  }),
  lib("pay-zones", {
    text: {
      "بنوصل لكل مصر": L("بنوصل فين", "Where we deliver"),
      "المدة والمصاريف حسب محافظتك.": L("معاد التوصيل ومصاريفه حسب منطقتك.", "Delivery time and fee by area."),
      "توصيل مجاني للطلبات فوق ١٬٥٠٠ ج.م": L("توصيل مجاني للطلبات فوق ٦٠٠ ج.م", "Free delivery over EGP 600"),
      "المدة": L("بيوصل", "Arrives"),
      "القاهرة والجيزة": L("المهندسين، الدقي، الزمالك", "Mohandessin, Dokki, Zamalek"),
      "١–٢ يوم": L("قبل ٩ الصبح", "Before 9 am"),
      "٥٠ ج.م": L("٢٥ ج.م", "EGP 25"),
      "الإسكندرية والدلتا": L("المعادي ومصر الجديدة", "Maadi and Heliopolis"),
      "٢–٣ أيام": L("قبل ١٠ الصبح", "Before 10 am"),
      "٦٥ ج.م": L("٣٥ ج.م", "EGP 35"),
      "مدن القناة": L("مدينة نصر والتجمع", "Nasr City and New Cairo"),
      "الصعيد": L("الشيخ زايد وأكتوبر", "Sheikh Zayed and October"),
      "٣–٥ أيام": L("قبل ١١ الصبح", "Before 11 am"),
      "٨٠ ج.م": L("٤٥ ج.م", "EGP 45"),
      "البحر الأحمر وسيناء": L("العبور والشروق", "Obour and Shorouk"),
      "٤–٦ أيام": L("قبل ١٢ الضهر", "Before noon"),
      "٩٥ ج.م": L("٥٥ ج.م", "EGP 55"),
    },
  }),
  lib("pay-days", {
    text: {
      "هيوصلك إمتى؟": L("آخر معاد للطلب", "Order cut-off"),
      "١": L("١٢", "12"),
      "يوم": L("نص الليل", "midnight"),
      "القاهرة، الجيزة": L("اطلب قبل نص الليل لفطار الصبح", "Order by midnight for next-morning breakfast"),
      "٢–٣": L("٩", "9"),
      "أيام": L("الصبح", "in the morning"),
      "الإسكندرية، الدلتا، مدن القناة": L("توصيل وسط القاهرة والجيزة", "Inner Cairo and Giza deliveries arrive"),
      "٤–٦": L("كل يوم", "Every day"),
      "الصعيد، البحر الأحمر، سيناء": L("بنوصل كل يوم حتى الجمعة", "We deliver every day, Fridays included"),
    },
  }),
  lib("cart-coupon", {
    text: {
      "خصم على أول طلب": L("خصم على أول بوكس", "Off your first box"),
      "الكود: WELCOME10": L("الكود: SABAH10", "Code: SABAH10"),
      "صالح ٤٨ ساعة": L("صالح على أول طلب", "Valid on your first order"),
    },
  }),
  lib("track-ask"),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن صباحو", "About Sabaho"), L("توصيل فطار وبقالة من المهندسين.", "A breakfast and pantry delivery from Mohandessin.")),
  aboutStory(lib, {
    photo: PHOTOS.fruitBowls,
    alt: L("سلطانيات فاكهة على رخامة المطبخ", "Fruit bowls on a kitchen counter"),
    eyebrow: L("كل يوم الصبح", "Every morning"),
    title: L("الفطار على بابك قبل ٩", "Breakfast at your door before 9"),
    text: L("بنخبز العيش ٥ الصبح، وبنجيب الخضار من المزرعة امبارح، وبنجهز البوكس بالليل.", "We bake bread at 5 am, bring vegetables from the farm the day before, and pack the box at night."),
    more: L("ورجّع البرطمانات الفاضية مع المندوب وادفع أقل في الريفيل.", "And send empty jars back with the courier to pay less for refills."),
    button: L("ابدأ البوكس", "Start your box"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("الفطار والبقالة على بابك قبل ٩.", "Breakfast and pantry, at your door before 9."),
  categories: [
    ["produce", "خضار وفاكهة", "Fruit & veg", PHOTOS.basket],
    ["greens", "ورقيات", "Greens", PHOTOS.herbs],
    ["bakery", "مخبوزات", "Bakery", PHOTOS.sourdough],
    ["dairy", "ألبان وبيض", "Dairy & eggs", PHOTOS.eggs],
    ["pantry", "بقالة", "Pantry", PHOTOS.pantry],
  ],
  products: [
    ["fresh-sourdough", "bakery", "عيش ساوردو طازة", "Fresh Sourdough", PHOTOS.sourdough, 95, { sold90: 210 }],
    ["fruit-veg-basket", "produce", "سلة خضار وفاكهة", "Fruit & Veg Basket", PHOTOS.basket, 320, { sold90: 144 }],
    ["organic-greens-bundle", "greens", "باقة ورقيات أورجانيك", "Organic Greens Bundle", PHOTOS.herbs, 140, { sold90: 96 }],
    ["weekly-veg-box", "produce", "بوكس خضار الأسبوع", "Weekly Veg Box", PHOTOS.vegBox, 260, { isFeatured: true, rating: 4.8, sold90: 320 }],
    ["pantry-staples-pack", "pantry", "باكدج رز وعدس ومكرونة", "Rice, Lentils & Pasta Pack", PHOTOS.pantry, 280, { compareAtPrice: 330, sold90: 77 }],
    ["spice-starter-set", "pantry", "طقم توابل للمبتدئين", "Spice Starter Set", PHOTOS.spices, 210, { sold90: 41 }],
    ["pantry-jar-refill", "pantry", "ريفيل برطمانات البقالة", "Pantry Jar Refill", PHOTOS.jarShelves, 160, { sold90: 28 }],
    ["farm-eggs", "dairy", "بيض بلدي ١٢ بيضة", "Farm Eggs, 12", PHOTOS.eggs, 85, { sold90: 180 }],
    ["fresh-milk", "dairy", "لبن طازة لتر", "Fresh Milk, 1 L", PHOTOS.milk, 45, { sold90: 150 }],
    ["white-cheese", "dairy", "جبنة بيضا بالزعتر", "White Cheese with Thyme", PHOTOS.cheese, 120, { sold90: 60 }],
  ],
});

export const SABAHO = libraryTemplate({
  key: SABAHO_KEY,
  version: 1,
  name: L("صباحو", "Sabaho"),
  description: L(
    "توصيل فطار وبقالة: هدف التوصيل المجاني، فطار الويك إند، الأكتر إعادة طلب، البوكس الأسبوعي، مناطق ومواعيد التوصيل، كوبون أول طلب وتتبع الطلب. أربع صفحات جاهزة.",
    "Breakfast and pantry delivery: free delivery goal, the weekend breakfast, most reordered, the weekly box, delivery areas and cut-offs, a first-order coupon and order tracking. Four ready pages.",
  ),
  category: "food",
  sortOrder: 420,
  palette: ["#fffdf6", "#fdf0cf", "#ffd23f", "#1f7a3a"],
  colors: {
    primary: "#1f7a3a",
    secondary: "#fdf0cf",
    background: "#fffdf6",
    foreground: "#17321f",
    muted: "#56635a",
    border: "#eee3c4",
    accent: "#ffd23f",
  },
  fonts: { heading: "Alexandria", body: "Alexandria" },
  radius: 16,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن صباحو", "About"), seo: { title: L("عن صباحو", "About Sabaho") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("شارع جامعة الدول، المهندسين.", "Gameat El Dowal St, Mohandessin."),
        heading: L("اسأل عن البوكس أو منطقتك", "Ask about your box or your area"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والبوكس والدفع.", "Delivery, the box and payment."),
        question: L("أقدر أوقف البوكس الأسبوعي؟", "Can I pause the weekly box?"),
        answer: L("أيوه، ابعتلنا على واتساب قبل نص الليل اللي قبل التوصيل.", "Yes, message us on WhatsApp by midnight before the delivery."),
      }),
    },
  ],
  demo: DEMO,
});
