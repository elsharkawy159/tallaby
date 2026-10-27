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
  lib("categories-chips", { text: { "إيه اللي في بالك؟": L("هتشرب إيه بكرة الصبح؟", "What’s in your cup tomorrow?") } }),
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
  lib("text-steps", {
    as: "points",
    name: L("القهوة بتوصلك إزاي", "How your coffee arrives"),
    text: {
      "إزاي ترجّع منتج": L("بنحمّص", "We roast"),
      "ابعتلنا على واتساب": L("كل اتنين الصبح", "Every Monday morning"),
      "خلال ١٤ يوم من الاستلام مع رقم الطلب.": L("بكميات صغيرة عشان توصلك طازة.", "In small batches so it reaches you fresh."),
      "جهّز المنتج": L("بنشحن", "We ship"),
      "في علبته الأصلية بكل الإكسسوارات.": L("يوم التلات، في أكياس بصمام.", "On Tuesday, in valve bags."),
      "المندوب يستلم": L("بتوصلك", "It arrives"),
      "خلال يومين شغل من عنوانك.": L("خلال يومين لأي محافظة.", "Within two days, anywhere in Egypt."),
      "فلوسك ترجع": L("اسألنا", "Ask us"),
      "بنفس طريقة الدفع خلال ٥ أيام.": L("ابعتلنا على واتساب ونساعدك تختار التحميصة.", "Message us on WhatsApp and we help you pick a roast."),
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
  version: 3,
  changelog: "Bunn v3: categories, wide hero photo, section order",
  productPage: { thumbs: "side", band: "brand", copy: { back: L("رجوع للمحمصة", "Back to the roastery"), reviews: L("رأي شاربي القهوة", "From coffee drinkers"), related: L("جرّب معاه كمان", "More to try") } },
  name: L("بُن", "Bunn"),
  description: L(
    "اشتراك قهوة مختصة: كلمة تحميص الكبيرة، ابدأ من هنا، طريقة التحضير ورسايل الصبح. أربع صفحات جاهزة.",
    "Specialty coffee subscription: the big ROAST word, start here, a brewing guide and morning messages. Four ready pages.",
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
