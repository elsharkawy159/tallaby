/**
 * Nashat (template 109, home fitness; Claude Design "Storefront
 * Templates"): cool grey paper, a black brand colour and an electric lime
 * highlight, Reem Kufi headings over Cairo text and 6px corners. A home gym
 * shop: banners for weights, kits and mats, best sellers, spend more save
 * more and messages from captains. Built from section library designs
 * (`fromLibrary`).
 *
 * The design's second banner says "sportswear" over a kit photo; it now
 * talks about the training kits it links to. The third spend tier
 * (EGP 3,500 → EGP 500) is the library's, the design has two tiers.
 *
 * Photos: Pexels, each checked by eye (2026-10-23): a kettlebell rack, a
 * flat lay of bands, a suspension trainer, trainers and dumbbells (900px
 * only: its 1280px copy is a library stock photo), a mat
 * with trainers on grass, hex dumbbells, a flat lay with a mat, bands, a
 * watch and trainers, rolled black mats, a smart watch, earbuds in their
 * case, grey kettlebells, blue dumbbells, pink bands with yellow
 * dumbbells, a jump rope with a bottle, a blue mat with dumbbells and a
 * home gym room. The design's photo with legs in leggings and its two
 * local device renders were replaced. No people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const NASHAT_KEY = "nashat";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(NASHAT_KEY, getDesign(id)!, { corners: 6, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  kettlebellRack: pexels(14502821),
  strengthKitWide: pexels(3927387),
  trainerFlatLaySmall: pexels(6740821, 900),
  grassMat: pexels(7880203),
  grassMatSmall: pexels(7880203, 900),
  hexDumbbells: pexels(29224210, 900),
  strengthKit: pexels(3927387, 900),
  blackMats: pexels(4325439, 900),
  watch: pexels(13007642, 900),
  earbuds: pexels(8858287, 900),
  kettlebells: pexels(13863727, 900),
  blueDumbbells: pexels(5412247, 900),
  bands: pexels(16695681, 900),
  rope: pexels(8032842, 900),
  matDumbbells: pexels(5412251, 900),
  homeGym: pexels(27195989),
};

const NAME = L("نشاط", "Nashat");

const header = lib("header-brand-bar", {
  text: { "م": L("ن", "N"), "اسم متجرك": NAME, "ابحث في المتجر": L("ابحث عن دمبل، مات، حبال…", "Search dumbbells, mats, bands…") },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("اتمرن في البيت أو الجيم", "Train at home or at the gym"),
    "كلمنا على واتساب": L("اسأل كوتش على واتساب", "Ask a coach on WhatsApp"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ نشاط. كل الحقوق محفوظة.", "© 2026 Nashat. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن نشاط", "About Nashat"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.kettlebellRack, PHOTOS.strengthKitWide, PHOTOS.grassMat],
    text: {
      "وصل حديثًا": L("أوزان", "Weights"),
      "الموسم الجديد وصل": L("اتمرن في البيت وابدأ خفيف", "Train at home, start light"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("دمبلز وكيتل بل من ٢ كيلو.", "Dumbbells and kettlebells from 2 kg."),
      "تسوّق الجديد": L("تسوق أوزان", "Shop weights"),
      "صورة الحملة الأولى": L("رف كيتل بل ملونة", "A rack of coloured kettlebells"),
      "الأكثر مبيعًا": L("باكدجات", "Kits"),
      "المفضّلة عند عملائنا": L("جيم كامل في شنطة", "A whole gym in one bag"),
      "القطع اللي بترجع لها كل مرة.": L("مات وحبال مقاومة ودمبل في باكدج واحد.", "A mat, resistance bands and dumbbells in one kit."),
      "شوف الأكثر مبيعًا": L("تسوق باكدجات", "Shop kits"),
      "صورة الحملة الثانية": L("مات وحبال مقاومة ودمبل وساعة على رخام", "A mat, resistance bands, dumbbells and a watch on marble"),
      "عروض الأسبوع": L("مات", "Mats"),
      "خصومات لفترة محدودة": L("افرد المات واتمطط وكرر", "Roll out, stretch, repeat"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("مات مانع للانزلاق لليوجا والبيلاتس.", "Non-slip mats for yoga and pilates."),
      "تسوّق العروض": L("تسوق مات", "Shop mats"),
      "صورة الحملة الثالثة": L("مات تمرين وكوتشي وإزازة مية على النجيلة", "A training mat, trainers and a water bottle on the grass"),
    },
    links: { "/products": [search("دمبل"), search("باكدج"), search("مات")] },
  }),
  lib("categories-feature-list"),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("الأكثر مبيعاً", "Best sellers"),
      "أحدث المنتجات اللي نزلت المتجر.": L("الأدوات اللي الناس بتتمرن بيها أكتر.", "The gear people train with most."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("testimonials-chat", {
    text: {
      "من الواتساب": L("الآراء", "Reviews"),
      "رسايل بتفرّحنا": L("من الكباتن", "From captains"),
      "مريم أ.": L("خالد ب.", "Khaled B."),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "أدوات جامدة، بتمرن بيها ٥ أيام في الأسبوع.",
        "Solid gear, I train with it five days a week.",
      ),
      "ده يسعدنا جدًا، شكرًا ليكي!": L("تمرين موفق يا كابتن!", "Train well, captain!"),
      "عمر ك.": L("منة س.", "Menna S."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "توصيل سريع وردوا على أسئلتي عن الأوزان على واتساب.",
        "Fast delivery, and they answered my questions about weights on WhatsApp.",
      ),
      "يوسف م.": L("علي ح.", "Ali H."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("جودة حلوة. ٣ أيام لإسكندرية.", "Good quality. Three days to Alexandria."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن نشاط", "About Nashat"), L("أدوات تتمرن بيها في البيت أو الجيم.", "Gear to train at home or at the gym.")),
  aboutStory(lib, {
    photo: PHOTOS.homeGym,
    alt: L("أوضة جيم في البيت فيها مات ودمبل وعجلة", "A home gym room with mats, dumbbells and a bike"),
    eyebrow: L("في البيت", "At home"),
    title: L("الجيم ممكن يبقى أوضة في البيت", "A gym can be a room at home"),
    text: L("بنختار أدوات تمرين بتعيش: دمبل بروس كاوتش، مات سميك وحبال بخمس مستويات.", "We pick training gear that lasts: rubber-headed dumbbells, thick mats and bands in five levels."),
    more: L("والتوصيل ببلاش فوق ١٬٥٠٠ جنيه، والاسترجاع خلال ٣٠ يوم.", "Free delivery over EGP 1,500, and returns within 30 days."),
    button: L("تسوق الأدوات", "Shop gear"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أدوات تتمرن بيها في البيت أو الجيم.", "Gear to train at home or at the gym."),
  categories: [
    ["weights", "أوزان", "Weights", PHOTOS.hexDumbbells],
    ["kits", "باكدجات", "Kits", PHOTOS.strengthKit],
    ["mats", "مات", "Mats", PHOTOS.blackMats],
    ["tech", "تكنولوجيا", "Tech", PHOTOS.watch],
    ["bands", "حبال ومقاومة", "Bands & ropes", PHOTOS.bands],
    ["kettlebells", "كيتل بل", "Kettlebells", PHOTOS.kettlebells],
    ["earbuds", "سماعات", "Earbuds", PHOTOS.earbuds],
  ],
  products: [
    ["home-strength-kit", "kits", "باكدج قوة البيت", "Home Strength Kit", PHOTOS.strengthKit, 2450, { compareAtPrice: 2800, isFeatured: true, rating: 4.8, sold90: 142 }],
    ["hex-dumbbell-pair-10kg", "weights", "جوز دمبل ١٠ كيلو", "Hex Dumbbell Pair 10 kg", PHOTOS.hexDumbbells, 1350, { sold90: 98 }],
    ["thick-training-mat", "mats", "مات تمرين سميك", "Thick Training Mat", PHOTOS.grassMatSmall, 690, { sold90: 120 }],
    ["resistance-band-set", "bands", "طقم حبال مقاومة", "Resistance Band Set", PHOTOS.bands, 390, { rating: 4.7, sold90: 210 }],
    ["pulse-sport-watch", "tech", "ساعة بالس سبورت", "Pulse Sport Watch", PHOTOS.watch, 1450, { sold90: 44 }],
    ["wireless-sport-earbuds", "earbuds", "سماعة سبورت لاسلكية", "Wireless Sport Earbuds", PHOTOS.earbuds, 540, { compareAtPrice: 690, sold90: 77 }],
    ["kettlebell-pair-8kg", "kettlebells", "جوز كيتل بل ٨ كيلو", "Kettlebell Pair 8 kg", PHOTOS.kettlebells, 1200, { sold90: 56 }],
    ["vinyl-dumbbells-2kg", "weights", "دمبل فينيل ٢ كيلو", "Vinyl Dumbbells 2 kg", PHOTOS.blueDumbbells, 320, { sold90: 130 }],
    ["suspension-trainer-kit", "kits", "باكدج حبل التعليق", "Suspension Trainer Kit", PHOTOS.trainerFlatLaySmall, 1650, { sold90: 38 }],
    ["speed-jump-rope", "bands", "حبل نط سريع", "Speed Jump Rope", PHOTOS.rope, 260, { sold90: 90 }],
    ["mat-dumbbell-set", "mats", "مات ودمبل ١٫٥ كيلو", "Mat and 1.5 kg Dumbbell Set", PHOTOS.matDumbbells, 890, { inStock: false, sold90: 47 }],
  ],
});

export const NASHAT = libraryTemplate({
  key: NASHAT_KEY,
  version: 3,
  changelog: "Nashat v3: categories after the hero",
  productPage: { thumbs: "side", band: "brand", extras: ["product-perks"], copy: { reviews: L("كلام الكباتن", "Words from the captains"), related: L("كمّل تمرينتك", "Complete your workout") } },
  name: L("نشاط", "Nashat"),
  description: L(
    "لياقة في البيت: بانرات متحركة، الأكثر مبيعاً ورسايل الكباتن. أربع صفحات جاهزة.",
    "Home fitness: banner carousel, best sellers and messages from captains. Four ready pages.",
  ),
  category: "sports",
  sortOrder: 1090,
  palette: ["#f4f5f2", "#e5e8e1", "#c6f432", "#111111"],
  colors: {
    primary: "#111111",
    secondary: "#e5e8e1",
    background: "#f4f5f2",
    foreground: "#121412",
    muted: "#5a5f58",
    border: "#d3d8cd",
    accent: "#c6f432",
  },
  fonts: { heading: "Reem Kufi", body: "Cairo" },
  radius: 6,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن نشاط", "About"), seo: { title: L("عن نشاط", "About Nashat") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("nashat@nashat.eg، القاهرة.", "nashat@nashat.eg, Cairo."),
        heading: L("قولنا هدفك ونختارلك الأدوات", "Tell us your goal and we will pick your gear"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الأوزان والتوصيل والاسترجاع.", "Weights, delivery and returns."),
        question: L("أقدر أرجّع الأدوات؟", "Can I return gear?"),
        answer: L("أيوه، خلال ٣٠ يوم لو مستعملتهاش، في علبتها الأصلية.", "Yes, within 30 days if unused, in the original box."),
      }),
    },
  ],
  demo: DEMO,
});
