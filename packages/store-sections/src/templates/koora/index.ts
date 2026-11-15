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

const NAME = L("متجر كورة", "Koora Shop");

const header = lib("header-chips", {
  text: { "م": L("ك", "K"), "اسم متجرك": NAME, "ابحث عن منتج…": L("ابحث عن كرة، طقم، أقماع…", "Search balls, kits, cones…") },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا لزيارتك": L("نراك في الملعب", "See you on the pitch"),
    "تواصل معنا على واتساب": L("تواصل معنا لأي سؤال", "Contact us with any question"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ متجر كورة. كل الحقوق محفوظة.", "© 2026 Koora Shop. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن متجر كورة", "About Koora Shop"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-poster", {
    photo: [undefined, undefined, PHOTOS.goal],
    text: {
      "مجموعة الموسم": L("طلبات الفرق", "Team orders"),
      "وصل حديثًا": L("أطقم وكرات وأدوات تمرين", "Kits, balls and training gear"),
      "صورة الحملة": L("مرمى في ملعب خالٍ", "A goal on an empty pitch"),
      "مجموعة": L("أطقم", "Kits"),
      "٢٠٢٦": L("كاملة", "complete"),
      "الجديدة": L("للفرق", "for teams"),
      "الموسم الجديد وصل": L("جهّز الفريق كله", "Kit out the whole team"),
      "قطع خفيفة بخامات طبيعية ومقاسات كاملة.": L(
        "أطقم وكرات وأقماع وشباك مرمى بمقاسات وكميات تناسب الفرق.",
        "Kits, balls, cones and goal nets in sizes and quantities for teams.",
      ),
      "اكتشف المجموعة": L("ابدأ طلب فريق", "Start a team order"),
    },
    links: { "/products": search("طقم") },
  }),
  lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": L("جهّز الفريق", "Kit out the team") } }),
  lib("products-bento", {
    text: { "الأكثر طلبًا": L("التمرين", "Training"), "منتجات يكثر الطلب عليها": L("اختيارات المدرب", "Coach picks") },
    links: { "/products": BEST },
  }),
  lib("testimonials-chat", {
    text: {
      "من الواتساب": L("الآراء", "Reviews"),
      "رسائل تسعدنا": L("من قادة الفرق", "From team captains"),
      "مريم أ.": L("كابتن أحمد", "Captain Ahmed"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الأطقم مطابقة للصور والمقاسات مضبوطة.",
        "The kits match the photos and the sizes are right.",
      ),
      "هذا يسعدنا جدًا، شكرًا لك!": L("بالتوفيق في البطولة!", "Good luck in the tournament!"),
      "عمر ك.": L("كابتن كريم", "Captain Karim"),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L(
        "الأقماع وسلم الرشاقة خفيفة وسهلة الحمل.",
        "The cones and agility ladder are light and easy to carry.",
      ),
      "يوسف م.": L("كابتن يوسف", "Captain Youssef"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L(
        "الكرات تتحمّل اللعب على النجيل الصناعي.",
        "The balls hold up on artificial turf.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن متجر كورة", "About Koora Shop"), L("أدوات كرة القدم للفرق والأكاديميات.", "Football gear for teams and academies.")),
  aboutStory(lib, {
    photo: PHOTOS.parkGoal,
    alt: L("مرمى في ملعب عشبي", "A goal on a grass pitch"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("أدوات كرة القدم للفرق", "Football gear for teams"),
    text: L(
      "أطقم وكرات وأدوات تمرين بمقاسات وكميات تناسب الفرق.",
      "Kits, balls and training gear in sizes and quantities for teams.",
    ),
    more: L("تواصل معنا لأي سؤال عن طلب فريقك.", "Contact us with any question about your team order."),
    button: L("ابدأ طلب فريق", "Start a team order"),
    href: search("طقم"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("كرات وأطقم وأدوات تمرين لكرة القدم.", "Balls, kits and training gear for football."),
  categories: [
    ["kits", "أطقم الفرق", "Team kits", PHOTOS.teamShirts],
    ["balls", "كرات", "Balls", PHOTOS.threeBalls],
    ["training", "أدوات تمرين", "Training gear", PHOTOS.cones],
    ["goals", "مرامٍ وشباك", "Goals & nets", PHOTOS.goalSmall],
    ["bibs", "صدريات تمرين", "Bibs", PHOTOS.ballsBibs],
    ["leather", "كرات جلد", "Leather balls", PHOTOS.leatherBall],
    ["agility", "رشاقة", "Agility", PHOTOS.ladder],
    ["academy", "أطقم أكاديمية", "Academy sets", PHOTOS.ballsCones],
  ],
  products: [
    ["printed-team-kit", "kits", "طقم فريق كامل", "Full Team Kit", PHOTOS.teamShirts, 650, { isFeatured: true, rating: 4.8, sold90: 260 }],
    ["training-bibs", "bibs", "طقم صدريات تمرين (١٠ قطع)", "Training Bibs (10)", PHOTOS.ballsBibs, 480, { sold90: 90 }],
    ["match-ball-3", "balls", "كرات تمرين مقاس ٥ (٣ قطع)", "Training Balls Size 5 (3)", PHOTOS.threeBalls, 1350, { compareAtPrice: 1500, rating: 4.7, sold90: 140 }],
    ["five-a-side-ball", "balls", "كرة خماسي", "Five-a-Side Ball", PHOTOS.twoBalls, 520, { isFeatured: true, sold90: 210 }],
    ["classic-leather-ball", "leather", "كرة جلد كلاسيكية", "Classic Leather Ball", PHOTOS.leatherBall, 790, { sold90: 44 }],
    ["marker-cones", "training", "أقماع تمرين (٥٠ قطعة)", "Marker Cones (50)", PHOTOS.cones, 320, { sold90: 170 }],
    ["agility-ladder", "agility", "سلم رشاقة ٦ متر", "Agility Ladder 6 m", PHOTOS.ladder, 390, { sold90: 120 }],
    ["academy-set", "academy", "طقم أكاديمية كرات وأقماع", "Academy Balls & Cones Set", PHOTOS.ballsCones, 2650, { compareAtPrice: 2950, sold90: 26 }],
    ["portable-goal", "goals", "مرمى متنقل ٣×٢ متر", "Portable Goal 3×2 m", PHOTOS.parkGoal, 4200, { inStock: false, sold90: 8 }],
    ["goal-net-pair", "goals", "زوج شباك مرمى", "Goal Net Pair", PHOTOS.goalNight, 1100, { sold90: 30 }],
  ],
});

export const KOORA = libraryTemplate({
  key: KOORA_KEY,
  version: 3,
  changelog: "Koora v3: categories after the hero",
  productPage: { thumbs: "bottom", band: "brand", extras: ["product-perks"], copy: { reviews: L("آراء الفرق", "From teams"), related: L("جهّز الفريق", "Kit out the team") } },
  name: L("كورة", "Koora"),
  description: L(
    "أدوات كرة القدم للفرق: طلبات الفرق، سعر الكمية، اختيارات المدرب وآراء الفرق. أربع صفحات جاهزة.",
    "Football gear for teams: team orders, quantity pricing, coach picks and team reviews. Four ready pages.",
  ),
  category: "sports",
  style: ["bold"],
  sortOrder: 920,
  palette: ["#f4f7f4", "#e2ebe3", "#facc15", "#15803d"],
  colors: {
    primary: "#15803d",
    secondary: "#e2ebe3",
    background: "#ffffff",
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
    { slug: "about", name: L("عن متجر كورة", "About"), seo: { title: L("عن متجر كورة", "About Koora Shop") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("تواصل معنا لأي سؤال عن منتج أو مقاس.", "Contact us with any question about a product or size."),
        heading: L("اسأل عن مقاس أو منتج", "Ask about a size or product"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("طلبات الفرق والمقاسات والكميات.", "Team orders, sizes and quantities."),
        question: L("كيف أطلب لفريق كامل؟", "How do I order for a whole team?"),
        answer: L(
          "أضف المقاسات والكميات إلى السلة، واكتب أي تفاصيل في ملاحظة الطلب.",
          "Add the sizes and quantities to the cart and write any details in the order note.",
        ),
      }),
    },
  ],
  demo: DEMO,
});
