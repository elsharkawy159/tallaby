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
  beansClose: pexels(33015766, 900),
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
    "العروض": L("الأكتر طلباً", "Most ordered"),
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
  lib("bundle-quantity", {
    text: {
      "وفّر مع الكمية": L("اشترك ووفّر", "Subscribe and save"),
      "قطعة واحدة": L("كيس واحد", "1 bag"),
      "السعر العادي": L("كل أسبوعين", "Every two weeks"),
      "قطعتين": L("كيسين", "2 bags"),
      "على القطعة التانية": L("على الكيسين", "On both bags"),
      "٣ قطع": L("٣ أكياس", "3 bags"),
      "على الطلب كله": L("على الطلب كله", "On the whole order"),
      "وفّر ١٨٪": L("وفّر ٢٠٪", "Save 20%"),
      "اختار عدد القطع من السلة.": L(
        "اختار عدد الأكياس من السلة، وابعتلنا على واتساب لو عايز نفس الطلب كل أسبوعين.",
        "Choose how many bags in your cart, and message us on WhatsApp to repeat it every two weeks.",
      ),
    },
    lists: [{ source: "featured" }],
  }),
  lib("finder-pick", {
    text: {
      "لو هتشتري واحدة بس": L("ابدأ من هنا", "Start here"),
      "أحسن عزل ضوضاء في الفئة": L("فاتحة ومسكرة ومن غير مرارة", "Bright and sweet, no bitterness"),
      "بطارية ٣٠ ساعة": L("بتنفع في V60 أو موكا", "Works in a V60 or a moka pot"),
      "ضمان سنتين": L("متحمصة الاتنين ده", "Roasted this Monday"),
      "أوفر اختيار": L("شوكولاتة", "Chocolatey"),
      "الأفخم": L("كلاسيك", "Classic"),
    },
  }),
  lib("text-terms", {
    text: {
      "شروط الضمان": L("طريقة التحضير", "Brewing guide"),
      "المدة": L("V60", "V60"),
      "سنة من تاريخ الفاتورة.": L("١٥ جرام بن و٢٥٠ مل مية على ٩٣ درجة.", "15 g coffee, 250 ml water at 93°C."),
      "بيغطي": L("موكا", "Moka"),
      "عيوب الصناعة.": L("املا لحد البلف ونار متوسطة.", "Fill to the valve, medium heat."),
      "مش بيغطي": L("تركي", "Turkish"),
      "الكسر والمياه وسوء الاستخدام.": L("معلقة مليانة لكل فنجان.", "One heaped spoon per cup."),
      "المطلوب": L("فرنش برس", "French press"),
      "الفاتورة والعلبة الأصلية.": L("طحنة خشنة و٤ دقايق قبل ما تضغط.", "Coarse grind and four minutes before you press."),
    },
  }),
  lib("text-steps", {
    as: "points",
    name: L("نقط بن", "Bunn points"),
    text: {
      "إزاي ترجّع منتج": L("كل كيس بيجيبلك فنجان", "Every bag earns a cup"),
      "ابعتلنا على واتساب": L("١٠ نقط لكل كيس", "10 points per bag"),
      "خلال ١٤ يوم من الاستلام مع رقم الطلب.": L("على كل طلب، من أول كيس.", "Earned on every order, from your first bag."),
      "جهّز المنتج": L("١٠٠ نقطة = كيس ببلاش", "100 points = a free bag"),
      "في علبته الأصلية بكل الإكسسوارات.": L("بدلها بأي كيس ٢٥٠ جم.", "Swap them for any 250 g bag."),
      "المندوب يستلم": L("محاصيل جديدة بدري", "New lots early"),
      "خلال يومين شغل من عنوانك.": L("الأعضاء بيدوقوا الأول.", "Members taste first."),
      "فلوسك ترجع": L("اسأل عن نقطك", "Ask about your points"),
      "بنفس طريقة الدفع خلال ٥ أيام.": L("ابعتلنا رقم موبايلك على واتساب ونقولك رصيدك.", "Send us your phone number on WhatsApp and we tell you your balance."),
    },
  }),
  lib("testimonials-chat", {
    text: {
      "رسايل بتفرّحنا": L("رسايل الصبح", "Morning messages"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "السيدامو وصلت والكيس لسه دافي من التحميص. أحلى فنجان من شهور.",
        "The Sidamo arrived still warm from the roaster. Best cup in months.",
      ),
      "ده يسعدنا جدًا، شكرًا ليكي!": L("صباح الفل! جرّبي الكولومبي الجاية.", "Good morning! Try the Colombia next."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "سألتكم عن الطحنة للموكا وردّيتوا في دقيقتين.",
        "I asked about the grind for my moka pot and you replied in two minutes.",
      ),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("التركي بالحبهان بقى قهوة البيت كله.", "The cardamom Turkish is now the whole house’s coffee."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن بن لاب", "About Bunn Lab"), L("محمصة صغيرة في الزمالك.", "A small roastery in Zamalek.")),
  aboutStory(lib, {
    photo: PHOTOS.grindersWide,
    alt: L("مطاحن قهوة يدوي على ترابيزة", "Hand coffee grinders on a table"),
    eyebrow: L("الزمالك", "Zamalek"),
    title: L("منشأ واحد، تحميص كل اتنين", "Single origin, roasted every Monday"),
    text: L("بنستورد البن الأخضر من مزارع بنعرف أسماءها، ونحمّص دفعات صغيرة كل يوم اتنين.", "We import green beans from farms we know by name and roast small batches every Monday."),
    more: L("وبنكتب يوم التحميص على كل كيس.", "And every bag carries its roast date."),
    button: L("تسوق البن", "Shop coffee"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("قهوة جديدة من منشأ واحد على بابك كل أسبوعين.", "A new single origin at your door every two weeks."),
  categories: [
    ["beans", "بن", "Beans", PHOTOS.beansClose],
    ["turkish", "تركي", "Turkish", PHOTOS.turkishCup],
    ["brewing", "أدوات التحضير", "Brewing gear", PHOTOS.dripper],
  ],
  products: [
    ["ethiopia-sidamo", "beans", "إثيوبيا سيدامو ٢٥٠ جم", "Ethiopia Sidamo, 250 g", PHOTOS.beansClose, 420, { isFeatured: true, rating: 4.9, sold90: 180 }],
    ["colombia-huila", "beans", "كولومبيا هويلا ٢٥٠ جم", "Colombia Huila, 250 g", PHOTOS.beansPile, 440, { sold90: 150 }],
    ["house-turkish", "turkish", "تركي البيت بالحبهان ٥٠٠ جم", "House Turkish with Cardamom, 500 g", PHOTOS.turkishCup, 360, { sold90: 220 }],
    ["green-arabica", "beans", "أرابيكا أخضر ١ كيلو", "Green Arabica, 1 kg", PHOTOS.greenBeans, 780, { compareAtPrice: 900, sold90: 30 }],
    ["espresso-blend", "beans", "خلطة إسبريسو ٢٥٠ جم", "Espresso Blend, 250 g", PHOTOS.espressoBeans, 390, { sold90: 120 }],
    ["cappuccino-cup", "brewing", "فنجان كابتشينو سيراميك", "Ceramic Cappuccino Cup", PHOTOS.cappuccino, 190, { sold90: 90 }],
    ["pour-over-dripper", "brewing", "قمع تقطير V60", "V60 Pour-Over Dripper", PHOTOS.dripper, 650, { rating: 4.8, sold90: 40 }],
    ["moka-pot", "brewing", "موكا ٣ فناجين", "Moka Pot, 3 cups", PHOTOS.mokaPots, 900, { sold90: 34 }],
    ["gooseneck-kettle", "brewing", "غلاية بلبلة رفيعة", "Gooseneck Kettle", PHOTOS.kettles, 1250, { inStock: false, sold90: 18 }],
    ["hand-grinder", "brewing", "مطحنة يدوي", "Hand Grinder", PHOTOS.grinders, 1100, { sold90: 22 }],
  ],
});

export const BUNN = libraryTemplate({
  key: BUNN_KEY,
  version: 1,
  name: L("بُن", "Bunn"),
  description: L(
    "اشتراك قهوة مختصة: كلمة تحميص الكبيرة، اشترك ووفّر، ابدأ من هنا، طريقة التحضير، نقط بن ورسايل الصبح. أربع صفحات جاهزة.",
    "Specialty coffee subscription: the big ROAST word, subscribe and save, start here, a brewing guide, Bunn points and morning messages. Four ready pages.",
  ),
  category: "sweets",
  sortOrder: 750,
  palette: ["#f4f1ec", "#e6e0d6", "#ffd8a8", "#d9480f"],
  colors: {
    primary: "#d9480f",
    secondary: "#e6e0d6",
    background: "#f4f1ec",
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
        text: L("٩ شارع البرازيل، الزمالك.", "9 Brazil St, Zamalek."),
        heading: L("اسأل عن طحنة أو اشتراك", "Ask about a grind or a subscription"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التحميص والطحن والاشتراك.", "Roasting, grinding and subscriptions."),
        question: L("بتطحنوا البن؟", "Do you grind the coffee?"),
        answer: L("أيوه، اكتب طريقة التحضير في ملاحظات الطلب ونطحنه على مقاسها.", "Yes, write your brewing method in the order notes and we grind for it."),
      }),
    },
  ],
  demo: DEMO,
});
