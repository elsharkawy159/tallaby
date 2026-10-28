/**
 * Koora (template 92, football gear; Claude Design "Storefront Templates"):
 * pale pitch-green paper, a deep pitch green for actions and a referee
 * yellow highlight, Changa headings over Cairo text and tight 8px corners.
 * A five-a-side shop for teams: a poster for team orders, team pricing,
 * coach picks, spend tiers and messages from captains. Built from section
 * library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): balls on turf, cones,
 * an agility ladder, bibs, goals and nets, and folded blank team shirts. No
 * players, no legs or feet, no brand logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const KOORA_KEY = "koora";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(KOORA_KEY, getDesign(id)!, { corners: 8, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  goal: pexels(33537003),
  goalSmall: pexels(33537003, 900),
  goalNight: pexels(37391237, 900),
  parkGoal: pexels(18026260, 900),
  teamShirts: pexels(18199559, 900),
  threeBalls: pexels(36618476, 900),
  twoBalls: pexels(21792470, 900),
  leatherBall: pexels(38275739, 900),
  ballsBibs: pexels(27915834, 900),
  ballsCones: pexels(6658150, 900),
  cones: pexels(2128220, 900),
  ladder: pexels(13204961, 900),
};

const NAME = L("كورة شوب", "Koora Shop");

const header = lib("header-chips", {
  text: { "م": L("ك", "K"), "اسم متجرك": NAME, "ابحث عن منتج…": L("ابحث عن كورة، طقم، أقماع…", "Search balls, kits, cones…") },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("نتقابل في الملعب", "See you on the pitch"),
    "كلمنا على واتساب": L("ابعت طلب الفريق على واتساب", "Send your team order on WhatsApp"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ كورة شوب. كل الحقوق محفوظة.", "© 2026 Koora Shop. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن كورة شوب", "About Koora Shop"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-poster", {
    photo: [undefined, undefined, PHOTOS.goal],
    text: {
      "مجموعة الموسم": L("طلبات الفرق", "Team orders"),
      "من ١ إلى ٣٠ نوفمبر": L("أطقم بأسامي وأرقام اللعيبة", "Kits with players’ names and numbers"),
      "صورة الحملة": L("جول في ملعب فاضي", "A goal on an empty pitch"),
      "خصم": L("أطقم", "Kits"),
      "٣٠٪": L("كاملة", "complete"),
      "لفترة محدودة": L("للفرق", "for teams"),
      "الموسم الجديد وصل": L("جهّز الفريق كله", "Kit out the whole team"),
      "قطع خفيفة بخامات طبيعية، مقاسات كاملة وتبديل مجاني خلال ١٤ يومًا.": L(
        "طباعة الاسم والرقم ببلاش على أي طلب فريق، وتوصيل مجاني فوق ٩٠٠ ج.م.",
        "Free name and number printing on every team order, and free delivery over EGP 900.",
      ),
      "اكتشف المجموعة": L("ابدأ طلب فريق", "Start a team order"),
    },
    links: { "/products": search("طقم") },
  }),
  lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": L("جهّز الفريق", "Kit out the team") } }),
  lib("products-bento", {
    text: { "الأكثر طلبًا": L("التمرين", "Training"), "الكل بيسأل عليهم": L("اختيارات الكوتش", "Coach picks") },
    links: { "/products": BEST },
  }),
  lib("testimonials-chat", {
    text: {
      "من الواتساب": L("الآراء", "Reviews"),
      "رسايل بتفرّحنا": L("من الكباتن", "From captains"),
      "مريم أ.": L("كابتن أحمد", "Captain Ahmed"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الـ ١٢ طقم وصلوا قبل الدورة بيومين، والأسامي متطبعة مظبوط.",
        "All 12 kits arrived two days before the tournament, names printed perfectly.",
      ),
      "ده يسعدنا جدًا، شكرًا ليكي!": L("بالتوفيق في الدورة يا كابتن!", "Good luck in the tournament, captain!"),
      "عمر ك.": L("كابتن كريم", "Captain Karim"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "بدّلنا ٣ مقاسات من غير أي تعب، وردوا علينا في دقايق.",
        "We swapped three sizes with no hassle, and they replied in minutes.",
      ),
      "يوسف م.": L("كابتن يوسف", "Captain Youssef"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L(
        "تاني موسم نطلب منهم. الكور بتستحمل النجيلة الصناعي.",
        "Our second season ordering. The balls hold up on artificial turf.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن كورة شوب", "About Koora Shop"), L("أدوات كورة للخماسي والأكاديميات.", "Football gear for five-a-side and academies.")),
  aboutStory(lib, {
    photo: PHOTOS.parkGoal,
    alt: L("جول في ملعب نجيلة", "A goal on a grass pitch"),
    eyebrow: L("مدينة نصر", "Nasr City"),
    title: L("بدأنا فريق خماسي", "We started as a five-a-side team"),
    text: L(
      "كنا بنلف على المحلات عشان نلاقي أطقم بسعر معقول للفريق، فقررنا نجيبها بنفسنا.",
      "We kept hunting for affordable team kits, so we decided to bring them in ourselves.",
    ),
    more: L("النهارده بنجهّز فرق وأكاديميات في كل المحافظات.", "Today we kit out teams and academies across Egypt."),
    button: L("ابدأ طلب فريق", "Start a team order"),
    href: search("طقم"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("كور وأطقم وأدوات تمرين للخماسي.", "Balls, kits and training gear for five-a-side."),
  categories: [
    ["kits", "أطقم الفرق", "Team kits", PHOTOS.teamShirts],
    ["balls", "كور", "Balls", PHOTOS.threeBalls],
    ["training", "أدوات تمرين", "Training gear", PHOTOS.cones],
    ["goals", "جول وشبك", "Goals & nets", PHOTOS.goalSmall],
    ["bibs", "بيبات", "Bibs", PHOTOS.ballsBibs],
    ["leather", "كور جلد", "Leather balls", PHOTOS.leatherBall],
    ["agility", "رشاقة", "Agility", PHOTOS.ladder],
    ["academy", "أطقم أكاديمية", "Academy sets", PHOTOS.ballsCones],
  ],
  products: [
    ["printed-team-kit", "kits", "طقم فريق بالاسم والرقم", "Printed Team Kit", PHOTOS.teamShirts, 650, { isFeatured: true, rating: 4.8, sold90: 260 }],
    ["training-bibs", "bibs", "طقم بيبات تمرين (١٠ قطع)", "Training Bibs (10)", PHOTOS.ballsBibs, 480, { sold90: 90 }],
    ["match-ball-3", "balls", "كور تمرين مقاس ٥ (٣ قطع)", "Training Balls Size 5 (3)", PHOTOS.threeBalls, 1350, { compareAtPrice: 1500, rating: 4.7, sold90: 140 }],
    ["five-a-side-ball", "balls", "كورة خماسي", "Five-a-Side Ball", PHOTOS.twoBalls, 520, { isFeatured: true, sold90: 210 }],
    ["classic-leather-ball", "leather", "كورة جلد كلاسيك", "Classic Leather Ball", PHOTOS.leatherBall, 790, { sold90: 44 }],
    ["marker-cones", "training", "أقماع تمرين (٥٠ قطعة)", "Marker Cones (50)", PHOTOS.cones, 320, { sold90: 170 }],
    ["agility-ladder", "agility", "سلم رشاقة ٦ متر", "Agility Ladder 6 m", PHOTOS.ladder, 390, { sold90: 120 }],
    ["academy-set", "academy", "طقم أكاديمية كور وأقماع", "Academy Balls & Cones Set", PHOTOS.ballsCones, 2650, { compareAtPrice: 2950, sold90: 26 }],
    ["portable-goal", "goals", "جول متنقل ٣×٢ متر", "Portable Goal 3×2 m", PHOTOS.parkGoal, 4200, { inStock: false, sold90: 8 }],
    ["goal-net-pair", "goals", "جوز شبك جول", "Goal Net Pair", PHOTOS.goalNight, 1100, { sold90: 30 }],
  ],
});

export const KOORA = libraryTemplate({
  key: KOORA_KEY,
  version: 3,
  changelog: "Koora v3: categories after the hero",
  productPage: { thumbs: "bottom", band: "brand", extras: ["product-perks"], copy: { reviews: L("رسائل الكباتن", "Messages from captains"), related: L("جهّز الفريق", "Kit out the team") } },
  name: L("كورة", "Koora"),
  description: L(
    "أدوات كورة للفرق: طلبات الفرق، سعر الكمية، اختيارات الكوتش ورسايل الكباتن. أربع صفحات جاهزة.",
    "Football gear for teams: team orders, quantity pricing, coach picks and notes from captains. Four ready pages.",
  ),
  category: "sports",
  sortOrder: 920,
  palette: ["#f4f7f4", "#e2ebe3", "#facc15", "#15803d"],
  colors: {
    primary: "#15803d",
    secondary: "#e2ebe3",
    background: "#f4f7f4",
    foreground: "#0e1f14",
    muted: "#4a5c50",
    border: "#cfdcd1",
    accent: "#facc15",
  },
  fonts: { heading: "Changa", body: "Cairo" },
  radius: 8,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن كورة شوب", "About"), seo: { title: L("عن كورة شوب", "About Koora Shop") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("ابعتلنا عدد اللعيبة والمقاسات وهنبعتلك عرض سعر.", "Send us the number of players and sizes and we will send a quote."),
        heading: L("اطلب عرض سعر لفريقك", "Ask for a team quote"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("طلبات الفرق والطباعة والتوصيل.", "Team orders, printing and delivery."),
        question: L("أطبع الأسامي والأرقام إزاي؟", "How do I get names and numbers printed?"),
        answer: L(
          "اكتب اسم ورقم كل لعيب في ملاحظة الطلب، والطباعة ببلاش على طلبات الفرق.",
          "Write each player’s name and number in the order note; printing is free on team orders.",
        ),
      }),
    },
  ],
  demo: DEMO,
});
