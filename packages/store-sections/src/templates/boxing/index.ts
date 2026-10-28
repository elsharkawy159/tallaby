/**
 * Lakma (template 95, boxing and combat; Claude Design "Storefront
 * Templates"): a dark homepage on near-black paper, a fight red for
 * actions and a yellow highlight, Changa headings over Cairo text and
 * tight 4px corners. A fight shop: 20% off training kits, the most used
 * gear, the week-one kit, Lakma in numbers and messages from the gym.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): gloves on a tyre, on
 * grass and on mats, focus mitts, headgear on a ring post, a heavy bag,
 * jump ropes, water bottles and empty rings. No fighters, no hands, no
 * brand logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const BOXING_KEY = "boxing";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(BOXING_KEY, getDesign(id)!, { corners: 4, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  whiteGloves: pexels(6296058, 900),
  redGloves: pexels(13179513, 900),
  pinkGloves: pexels(6456153, 900),
  goldGloves: pexels(6296114, 900),
  vintageGloves: pexels(5862212, 900),
  mitts: pexels(6296112, 900),
  headgear: pexels(9943994, 900),
  heavyBag: pexels(8612522, 900),
  rope: pexels(8032916, 900),
  ropes: pexels(6339692, 900),
  bottles: pexels(8611246, 900),
  ring: pexels(8612028),
};

const NAME = L("لكمة فايت شوب", "Lakma Fight Shop");

const header = lib("header-brand-bar", {
  text: { "م": L("ل", "L"), "اسم متجرك": NAME, "ابحث في المتجر": L("ابحث عن جوانتي، شوال، حبل…", "Search gloves, bags, ropes…") },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("إيدك فوق", "Hands up"),
    "كلمنا على واتساب": L("اسأل كوتش على واتساب", "Ask a coach on WhatsApp"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ لكمة فايت شوب. كل الحقوق محفوظة.", "© 2026 Lakma Fight Shop. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن لكمة", "About Lakma"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-fullbleed", {
    photo: [PHOTOS.ring],
    text: {
      "المجموعة الجديدة": L("لكمة", "Lakma"),
      "صُنعت لتدوم معك": L("معدات بتستحمل كل جولة", "Gear built for every round"),
      "خامات مختارة وتفاصيل هادئة، وتوصيل سريع لحد باب البيت.": L("جوانتي وخوذ وأكياس اتجربت في الصالة قبل ما تتباع.", "Gloves, headgear and bags tested in the gym before we sell them."),
      "تسوّق الآن": L("تسوق المعدات", "Shop the gear"),
      "صورة الواجهة": L("حلبة ملاكمة", "A boxing ring"),
    },
  }),
  lib("categories-big-type", { text: { "الأقسام": L("جهّز نفسك", "Gear up") } }),
  lib("products-bento", {
    text: { "الأكثر طلبًا": L("اختيارات المقاتلين", "Fighters’ picks"), "الكل بيسأل عليهم": L("الأكتر استخداماً", "Most used") },
    links: { "/products": BEST },
  }),
  lib("team-numbers", {
    text: {
      "٧ سنين في أرقام": L("لكمة لحد دلوقتي", "Lakma so far"),
      "٥٠ ألف": L("٦٬٢٠٠", "6,200"),
      "عميل رجعلنا تاني": L("مقاتل اتجهز", "fighters equipped"),
      "٢٧": L("١٤", "14"),
      "محافظة بنوصلها": L("جيم بنوردله", "gyms supplied"),
    },
  }),
  lib("testimonials-chat", {
    text: {
      "من الواتساب": L("الآراء", "Reviews"),
      "رسايل بتفرّحنا": L("من الجيم", "From the gym"),
      "مريم أ.": L("كوتش حازم", "Coach Hazem"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "طلبت ١٠ جوز جوانتي للجيم ووصلوا في يومين، والجلد تقيل ومتين.",
        "Ordered 10 pairs of gloves for the gym and they arrived in two days; the leather is heavy and tough.",
      ),
      "ده يسعدنا جدًا، شكرًا ليكي!": L("تمرين موفق يا كوتش!", "Train well, coach!"),
      "عمر ك.": L("عمر ك.", "Omar K."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "بدّلت الجوانتي من ١٢ أونصة لـ ١٤ من غير أي تعب.",
        "Swapped my gloves from 12 oz to 14 oz with zero hassle.",
      ),
      "يوسف م.": L("نور ع.", "Nour A."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L(
        "باكدج البداية فيه كل حاجة لأول أسبوع، والرباط اللي ببلاش جودته حلوة.",
        "The starter kit has everything for week one, and the free wraps are good quality.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن لكمة", "About Lakma"), L("أدوات ملاكمة وقتال لتمرين حقيقي.", "Boxing and combat gear for real training.")),
  aboutStory(lib, {
    photo: PHOTOS.ring,
    alt: L("حلبة ملاكمة فاضية وشكاير متعلقة", "An empty boxing ring with hanging bags"),
    eyebrow: L("من الحلبة", "From the ring"),
    title: L("كوتشات بيجهّزوا مقاتلين", "Coaches kitting out fighters"),
    text: L(
      "بدأنا نجيب جوانتيات وشكاير لجيمنا، وبعدين الجيمات اللي حوالينا بقت تطلب مننا.",
      "We started bringing in gloves and bags for our own gym, then the gyms around us began ordering too.",
    ),
    more: L("النهارده بنورّد لـ ١٤ جيم وبنجهّز مقاتلين في كل مصر.", "Today we supply 14 gyms and equip fighters across Egypt."),
    button: L("تسوق الجوانتيات", "Shop gloves"),
    href: search("جوانتي"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("جوانتيات ورباطات وشكاير لتمرين حقيقي.", "Gloves, wraps and bags for real training."),
  categories: [
    ["gloves", "جوانتيات", "Gloves", PHOTOS.redGloves],
    ["bags", "شكاير وأدوات", "Bags & gear", PHOTOS.heavyBag],
    ["protection", "حماية", "Protection", PHOTOS.headgear],
    ["mitts", "فوكس ميت", "Focus mitts", PHOTOS.mitts],
    ["ropes", "حبال نط", "Jump ropes", PHOTOS.rope],
    ["bottles", "زجاجات مية", "Water bottles", PHOTOS.bottles],
  ],
  products: [
    ["white-training-gloves", "gloves", "جوانتي تمرين أبيض ١٤ أونصة", "White Training Gloves 14 oz", PHOTOS.whiteGloves, 1450, { isFeatured: true, rating: 4.8, sold90: 180 }],
    ["speed-jump-rope", "ropes", "حبل نط سرعة", "Speed Jump Rope", PHOTOS.rope, 250, { sold90: 210 }],
    ["sparring-headgear", "protection", "خوذة سبارنج", "Sparring Headgear", PHOTOS.headgear, 1100, { sold90: 64 }],
    ["red-leather-gloves", "gloves", "جوانتي جلد أحمر", "Red Leather Gloves", PHOTOS.redGloves, 1850, { compareAtPrice: 2200, rating: 4.9, sold90: 96 }],
    ["pink-gloves", "gloves", "جوانتي بينك ١٠ أونصة", "Pink Gloves 10 oz", PHOTOS.pinkGloves, 1250, { sold90: 70 }],
    ["gold-pro-gloves", "gloves", "جوانتي برو أبيض ودهبي", "White and Gold Pro Gloves", PHOTOS.goldGloves, 2650, { sold90: 28 }],
    ["vintage-lace-gloves", "gloves", "جوانتي بأربطة كلاسيك", "Classic Lace-Up Gloves", PHOTOS.vintageGloves, 2300, { inStock: false, sold90: 12 }],
    ["gloves-and-mitts", "mitts", "جوانتي وفوكس ميت", "Gloves and Focus Mitts", PHOTOS.mitts, 2100, { isFeatured: true, sold90: 48 }],
    ["leather-heavy-bag", "bags", "شوال ملاكمة جلد", "Leather Heavy Bag", PHOTOS.heavyBag, 5400, { compareAtPrice: 5900, sold90: 20 }],
    ["gym-rope-pack", "ropes", "باكدج حبال للجيم (٤ قطع)", "Gym Rope Pack (4)", PHOTOS.ropes, 850, { sold90: 36 }],
    ["steel-bottle-pair", "bottles", "جوز زجاجات مية ستانلس", "Steel Bottle Pair", PHOTOS.bottles, 480, { sold90: 90 }],
  ],
});

export const BOXING = libraryTemplate({
  key: BOXING_KEY,
  version: 3,
  changelog: "Boxing v3: categories after the hero",
  productPage: { surface: "flat", thumbs: "bottom", band: "brand", extras: ["product-perks"], copy: { reviews: L("رسائل من الجيم", "Messages from the gym"), related: L("كمّل عدّتك", "Complete your kit") } },
  name: L("لكمة", "Lakma"),
  description: L(
    "ملاكمة وقتال بصفحة رئيسية غامقة: الأكتر استخداماً ولكمة في أرقام. أربع صفحات جاهزة.",
    "Boxing and combat with a dark homepage: most used and Lakma in numbers. Four ready pages.",
  ),
  category: "sports",
  sortOrder: 950,
  palette: ["#111111", "#1c1c1c", "#facc15", "#dc2626"],
  colors: {
    primary: "#dc2626",
    secondary: "#1c1c1c",
    background: "#111111",
    foreground: "#f5f5f5",
    muted: "#a3a3a3",
    border: "#2c2c2c",
    accent: "#facc15",
  },
  fonts: { heading: "Changa", body: "Cairo" },
  radius: 4,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن لكمة", "About"), seo: { title: L("عن لكمة فايت شوب", "About Lakma Fight Shop") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("بنورّد للجيمات والأكاديميات، ابعتلنا الكميات.", "We supply gyms and academies; send us the quantities."),
        heading: L("اسأل عن مقاس جوانتي أو طلب جيم", "Ask about glove sizes or a gym order"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والأوزان والتوصيل.", "Sizes, weights and delivery."),
        question: L("أختار وزن الجوانتي إزاي؟", "How do I choose a glove weight?"),
        answer: L("١٢ أونصة للشنطة والميتس، و١٤ أو ١٦ أونصة للسبارنج حسب وزنك.", "12 oz for bags and mitts, 14 or 16 oz for sparring depending on your weight."),
      }),
    },
  ],
  demo: DEMO,
});
