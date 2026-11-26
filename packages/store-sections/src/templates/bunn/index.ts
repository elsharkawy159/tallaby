/**
 * Bunn (template 75, specialty coffee subscription; Claude Design
 * "Storefront Templates"): oat paper, a roaster's orange for actions and a
 * peach highlight, Readex Pro throughout and square corners. A coffee lab:
 * the big ROAST word, subscribe and save, our pick to start with, a
 * brewing guide, Bunn points and morning messages. Built from section
 * library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): roasted beans close up
 * and in a pile, dark espresso beans, a Turkish coffee cup, green beans, a
 * pour-over dripper, moka pots on a shelf, kettles on a stove, vintage hand
 * grinders and a cappuccino. No people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const BUNN_KEY = "bunn";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(BUNN_KEY, getDesign(id)!, { corners: 0, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  beansClose: pexels(33015766, 1600),
  beansPile: pexels(4157763, 900),
  espressoBeans: pexels(36343666, 900),
  turkishCup: pexels(38523136, 900),
  greenBeans: pexels(7125599, 900),
  dripper: pexels(6775603, 900),
  mokaPots: pexels(10880512, 900),
  kettles: pexels(12974474, 900),
  grinders: pexels(13490220, 900),
  grindersWide: pexels(13490220),
  cappuccino: pexels(27860686, 900),
};

const NAME = L("بن لاب", "Bunn Lab");

const header = lib("header-ruled", {
  text: {
    "م": L("ب", "B"),
    "اسم متجرك": NAME,
    "المتجر": L("البن", "Coffee"),
    "العروض": L("الأكثر طلبًا", "Most ordered"),
  },
  links: { "/products": [SHOP, BEST, undefined, undefined] },
});

const footer = lib("footer-links", {
  text: {
    "م": L("ب", "B"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ بن لاب. كل الحقوق محفوظة.", "© 2026 Bunn Lab. All rights reserved."),
  },
  links: { "/products": [SHOP, NEW, BEST] },
});

const home: Design[] = [
  lib("hero-big-word", { text: { "جديد": L("تحميص", "ROAST") }, lists: [{ source: "featured" }] }),
  lib("categories-chips", { text: { "عمّ تبحث؟": L("عمّ تبحث؟", "What are you looking for?") } }),
  lib("finder-pick", {
    text: {
      "إن كنت ستشتري واحدة فقط": L("ابدأ من هنا", "Start here"),
      "عزل ضوضاء قوي": L("تحميص فاتح بطعم حلو بلا مرارة", "Light roast, sweet, no bitterness"),
      "بطارية ٣٠ ساعة": L("تناسب V60 أو الموكا", "Works in a V60 or a moka pot"),
      "تصميم خفيف": L("حبوب كاملة أو مطحونة", "Whole bean or ground"),
      "الأوفر سعرًا": L("شوكولاتة", "Chocolatey"),
      "الأفخم": L("كلاسيكية", "Classic"),
    },
  }),
  lib("text-steps", {
    as: "points",
    name: L("من البن إلى الفنجان", "From bean to cup"),
    text: {
      "كيف ترجع منتجًا": L("اختر البن", "Pick the coffee"),
      "راسلنا على واتساب": L("حسب طريقة التحضير", "By brewing method"),
      "خلال ١٤ يومًا من الاستلام مع رقم الطلب.": L("حبوب كاملة أو مطحونة لكل طريقة تحضير.", "Whole bean or ground for every brewing method."),
      "جهّز المنتج": L("اختر الطحنة", "Pick the grind"),
      "في علبته الأصلية بكل الإكسسوارات.": L("خشنة أو متوسطة أو ناعمة.", "Coarse, medium or fine."),
      "يستلمه المندوب": L("اطلب", "Order"),
      "من عنوانك خلال يومي عمل.": L("أضف البن إلى السلة وأكمل الطلب.", "Add it to your cart and check out."),
      "استرداد المبلغ": L("تواصل معنا", "Contact us"),
      "بطريقة الدفع نفسها خلال ٥ أيام.": L("تواصل معنا لأي سؤال عن التحميص أو الطحنة.", "Contact us with any question about a roast or a grind."),
    },
  }),
  // v4 (2026-11-16, owner): every home has at least one real products grid.
  lib("products-grid", {
    as: "new-in",
    text: { "وصل حديثًا": L("وصل حديثًا", "New in"), "أحدث المنتجات في المتجر.": L("أحدث المنتجات في المتجر.", "The newest products in the store.") },
    links: { "/products": NEW },
    lists: [{ source: "newest", limit: 8 }],
  }),
  lib("text-terms", {
    text: {
      "شروط الضمان": L("طريقة التحضير", "Brewing guide"),
      "المدة": L("V60", "V60"),
      "سنة من تاريخ الفاتورة.": L("١٥ جرام بن و٢٥٠ مل ماء على ٩٣ درجة.", "15 g coffee, 250 ml water at 93°C."),
      "يغطي": L("موكا", "Moka"),
      "عيوب الصناعة.": L("املأ حتى الصمام، على نار متوسطة.", "Fill to the valve, medium heat."),
      "لا يغطي": L("تركي", "Turkish"),
      "الكسر والمياه وسوء الاستخدام.": L("ملعقة ممتلئة لكل فنجان.", "One heaped spoon per cup."),
      "المطلوب": L("المكبس الفرنسي", "French press"),
      "الفاتورة والعلبة الأصلية.": L("طحنة خشنة و٤ دقائق قبل الضغط.", "Coarse grind and four minutes before you press."),
    },
  }),
  // v5 (2026-11-25, owner): the store's 1st category as a carousel after the terms.
  lib("products-category-carousel", { lists: [undefined, { limit: 4 }] }),
  lib("testimonials-chat", {
    text: {
      "رسائل تسعدنا": L("رسائل العملاء", "Customer messages"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L("بن السيدامو رائحته واضحة وطعمه متوازن.", "The Sidamo has a clear aroma and a balanced taste."),
      "هذا يسعدنا جدًا، شكرًا لك!": L("شكرًا لك! جرّب الكولومبي في المرة القادمة.", "Thank you! Try the Colombia next time."),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L("طحنة الموكا مناسبة تمامًا.", "The moka grind is just right."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("البن التركي بالحبهان أصبح قهوتي اليومية.", "The cardamom Turkish is now my daily coffee."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن بن لاب", "About Bunn Lab"), L("بن مختص وأدوات تحضير القهوة.", "Specialty coffee and brewing gear.")),
  aboutStory(lib, {
    photo: PHOTOS.grindersWide,
    alt: L("مطاحن قهوة يدوية على طاولة", "Hand coffee grinders on a table"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("بن من منشأ واحد", "Single-origin coffee"),
    text: L("نختار بنًا من منشأ واحد بتحميص فاتح ومتوسط، ونكتب تفاصيل كل نوع بوضوح.", "We choose single-origin coffee in light and medium roasts and describe each one clearly."),
    more: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
    button: L("تسوق البن", "Shop coffee"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("بن من منشأ واحد وأدوات تحضير القهوة.", "Single-origin coffee and brewing gear."),
  categories: [
    ["beans", "بن", "Beans", PHOTOS.beansClose],
    ["turkish", "تركي", "Turkish", PHOTOS.turkishCup],
    ["brewing", "أدوات التحضير", "Brewing gear", PHOTOS.dripper],
    ["espresso", "إسبريسو", "Espresso", PHOTOS.espressoBeans],
    ["green", "بن أخضر", "Green beans", PHOTOS.greenBeans],
    ["grinders", "مطاحن", "Grinders", PHOTOS.grinders],
    ["kettles", "غلايات", "Kettles", PHOTOS.kettles],
    ["cups", "فناجين", "Cups", PHOTOS.cappuccino],
  ],
  products: [
    ["ethiopia-sidamo", "beans", "إثيوبيا سيدامو ٢٥٠ جم", "Ethiopia Sidamo, 250 g", PHOTOS.beansClose, 420, { isFeatured: true, rating: 4.9, sold90: 180 }],
    ["colombia-huila", "beans", "كولومبيا هويلا ٢٥٠ جم", "Colombia Huila, 250 g", PHOTOS.beansPile, 440, { sold90: 150 }],
    // v5: two more beans, so the category carousel (the 1st category) shows a full row.
    ["brazil-santos", "beans", "البرازيل سانتوس ٢٥٠ جم", "Brazil Santos, 250 g", PHOTOS.espressoBeans, 380, { sold90: 110 }],
    ["green-arabica-250g", "beans", "أرابيكا خضراء للتحميص المنزلي ٢٥٠ جم", "Green Arabica for Home Roasting, 250 g", PHOTOS.greenBeans, 220, { sold90: 26 }],
    ["house-turkish", "turkish", "بن تركي بالحبهان ٥٠٠ جم", "House Turkish with Cardamom, 500 g", PHOTOS.turkishCup, 360, { sold90: 220 }],
    ["green-arabica", "green", "أرابيكا أخضر ١ كيلو", "Green Arabica, 1 kg", PHOTOS.greenBeans, 780, { compareAtPrice: 900, sold90: 30 }],
    ["espresso-blend", "espresso", "خلطة إسبريسو ٢٥٠ جم", "Espresso Blend, 250 g", PHOTOS.espressoBeans, 390, { sold90: 120 }],
    ["cappuccino-cup", "cups", "فنجان كابتشينو سيراميك", "Ceramic Cappuccino Cup", PHOTOS.cappuccino, 190, { sold90: 90 }],
    ["pour-over-dripper", "brewing", "قمع تقطير V60", "V60 Pour-Over Dripper", PHOTOS.dripper, 650, { rating: 4.8, sold90: 40 }],
    ["moka-pot", "brewing", "إبريق موكا ٣ فناجين", "Moka Pot, 3 cups", PHOTOS.mokaPots, 900, { sold90: 34 }],
    ["gooseneck-kettle", "kettles", "غلاية بصنبور رفيع", "Gooseneck Kettle", PHOTOS.kettles, 1250, { inStock: false, sold90: 18 }],
    ["hand-grinder", "grinders", "مطحنة يدوية", "Hand Grinder", PHOTOS.grinders, 1100, { sold90: 22 }],
  ],
});

export const BUNN = libraryTemplate({
  key: BUNN_KEY,
  version: 6,
  changelog: "Bunn v5: products by category as a carousel on the home",
  productPage: { thumbs: "side", band: "brand", copy: { reviews: L("آراء محبي القهوة", "From coffee drinkers"), related: L("قد يعجبك أيضًا", "More to try") } },
  name: L("بُن", "Bunn"),
  description: L("قهوة مختصة: كلمة تحميص الكبيرة، ابدأ من هنا، طريقة التحضير ورسائل العملاء. أربع صفحات جاهزة.", "Specialty coffee: the big ROAST word, start here, a brewing guide and customer messages. Four ready pages."),
  category: "sweets",
  style: ["bold"],
  sortOrder: 750,
  palette: ["#f4f1ec", "#e6e0d6", "#ffd8a8", "#d9480f"],
  colors: {
    primary: "#d9480f",
    secondary: "#e6e0d6",
    background: "#ffffff",
    foreground: "#1a1714",
    muted: "#5d564f",
    border: "#d8d0c3",
    accent: "#ffd8a8",
  },
  fonts: { heading: "Readex Pro", body: "Readex Pro" },
  radius: 0,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن بن لاب", "About"), seo: { title: L("عن بن لاب", "About Bunn Lab") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("تواصل معنا لأي سؤال عن البن أو أدوات التحضير.", "Contact us with any question about coffee or brewing gear."),
        heading: L("اسأل عن تحميص أو طحنة", "Ask about a roast or a grind"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التحميص والطحن وطرق التحضير.", "Roasting, grinding and brewing."),
        question: L("هل يتوفر البن مطحونًا؟", "Is the coffee available ground?"),
        answer: L("اختر الحبوب الكاملة أو الطحنة المناسبة من خيارات المنتج إن توفرت.", "Choose whole bean or a grind from the product options where available."),
      }),
    },
  ],
  demo: DEMO,
});
