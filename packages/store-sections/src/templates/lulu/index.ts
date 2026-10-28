/**
 * Lulu (template 83, freshwater pearls; Claude Design "Storefront
 * Templates"): soft pearl-white paper, a slate blue for actions and a
 * sand highlight, Amiri headings over Noto Kufi Arabic and round 20px
 * corners. A quiet pearl house: pearls for every day, how we choose, new
 * pieces, a private viewing in Zamalek, the founder's note and reviews.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): pearl strands on books,
 * dishes, coral, crochet and satin, pearl bracelets on white plates and
 * pearl earrings on fabric. No necks, ears, hands or people, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const LULU_KEY = "lulu";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(LULU_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const PHOTOS = {
  bookStrands: pexels(29033684),
  coral: pexels(9428788),
  freshwater: pexels(5357486, 900),
  dropHoops: pexels(36823005, 900),
  baroque: pexels(36854165, 900),
  classicBracelet: pexels(36823003, 900),
  crystalEarrings: pexels(33154633, 900),
  layered: pexels(14584454, 900),
  coinPearl: pexels(23495720, 900),
  threeRow: pexels(8281588, 900),
  strands: pexels(908183, 900),
  shellPlate: pexels(36229128, 900),
};

const NAME = L("بيت اللولي", "Lulu House");

const header = lib("header-centered", {
  text: {
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨": L("لولي مية عذبة، متربط باليد", "Freshwater pearls, knotted by hand"),
    "المتجر": L("اللولي", "Pearls"),
    "العروض": L("الجديد", "New"),
    "المدونة": L("الأسئلة", "FAQ"),
  },
  links: { "/products": [undefined, NEW, undefined, undefined, NEW], "/blog": "/faq" },
});

const footer = lib("footer-links", {
  text: {
    "م": L("ل", "L"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ بيت اللولي. كل الحقوق محفوظة.", "© 2026 Lulu House. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.bookStrands],
    text: {
      "كوليكشن الموسم": L("مية عذبة", "Freshwater"),
      "صوت أنقى، كل يوم": L("لولي لكل يوم", "Pearls for every day"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "كل عقد متربط باليد عشان لو اتقطع ما تقعش ولا لولية.",
        "Each strand knotted by hand so a break never loses a pearl.",
      ),
      "تسوق الآن": L("تسوقي اللولي", "Shop pearls"),
      "العروض": L("احجزي معاينة", "Book a viewing"),
      "صورة الحملة": L("عقود لولي على كتاب قديم", "Pearl strands draped over an old book"),
    },
    links: { "/products": [SHOP, "/contact"] },
  }),
  lib("categories-captioned", { text: { "اكتشف الأقسام": L("لولي لكل يوم", "Pearls for every day"), "كل الأقسام": L("كل القطع", "All pieces") } }),
  lib("products-feature", {
    text: { "اختيارنا ليك": L("قطع جديدة", "New pieces"), "اختيار الأسبوع": L("جديد", "New") },
  }),
  lib("features-side-title", {
    text: {
      "ليه الناس بترجع لنا تاني": L("بنختار إزاي", "How we choose"),
      "أربع حاجات بنلتزم بيها في كل طلب.": L("٤ فحوصات قبل ما اللولية تتلضم.", "Four checks before a pearl is strung."),
      "توصيل سريع": L("اللمعة", "Lustre"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("انعكاس واضح على سطح اللولية.", "A clear reflection on the surface."),
      "الدفع عند الاستلام": L("الشكل", "Shape"),
      "أو ادفع بالبطاقة والمحفظة": L("قريب من المدور.", "Near round."),
      "استرجاع سهل": L("السطح", "Surface"),
      "١٤ يومًا لتغيّر رأيك": L("علامات قليلة.", "Few marks."),
      "دعم على واتساب": L("العقدة", "The knot"),
      "أشخاص حقيقيون طوال الأسبوع": L("عقدة حرير بين كل لولية والتانية.", "A silk knot between every pearl."),
    },
  }),
  lib("team-founder", {
    text: {
      "عايزين كل حد يشتري من عندنا مرة يرجع تاني من غير ما نفكره.": L(
        "اللولية بتاخد ٣ سنين عشان تكبر. أقل حاجة إننا نربطها صح.",
        "A pearl takes three years to grow. The least we can do is knot it properly.",
      ),
      "م": L("ل", "L"),
      "منى عادل": L("لولوة سعد", "Lulwa Saad"),
    },
  }),
  lib("service-booking", {
    text: {
      "احجز معاد الفني": L("احجزي معاينة", "Book a viewing"),
      "تركيب شاشة · حوالي ساعة": L("معاينة خاصة في الزمالك · نص ساعة", "Private viewing in Zamalek · 30 minutes"),
      "مواعيد الزيارات": L("المواعيد المتاحة", "Available times"),
      "أو احجز على واتساب": L("أو احجزي على واتساب", "Or book on WhatsApp"),
    },
  }),
  lib("testimonials-ruled", {
    text: {
      "آراء العملاء": L("الآراء", "Reviews"),
      "قالوا عننا": L("لبسوه", "Worn by"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "لبست العقد في فرحي، ولسه بلبسه كل جمعة.",
        "I wore the strand at my wedding and still wear it every Friday.",
      ),
      "م": L("ي", "Y"),
      "مريم أ.": L("ياسمين أ.", "Yasmine A."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("المعاينة في الزمالك كانت هادية والشرح كان حلو جداً.", "The viewing in Zamalek was calm and beautifully explained."),
      "ع": L("ش", "S"),
      "عمر ك.": L("شيرين ك.", "Shereen K."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("اتقطع العقد ولضموه تاني ببلاش من غير ما تقع لولية.", "The strand broke and they restrung it free without losing a pearl."),
      "ن": L("د", "D"),
      "نور ح.": L("دينا ح.", "Dina H."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن بيت اللولي", "About Lulu House"), L("لولي مية عذبة متربط باليد في الزمالك.", "Freshwater pearls knotted by hand in Zamalek.")),
  aboutStory(lib, {
    photo: PHOTOS.coral,
    alt: L("عقود لولي على قماش أبيض مع مرجان", "Pearl strands on white fabric with coral"),
    eyebrow: L("الزمالك", "Zamalek"),
    title: L("كل لولية بعقدتها", "Every pearl knotted"),
    text: L("بنختار اللولي واحدة واحدة، ونربط عقدة حرير بين كل لولية والتانية.", "We pick pearls one by one and tie a silk knot between each of them."),
    more: L("وإعادة اللضم ببلاش لمدة سنة.", "And restringing is free for a year."),
    button: L("تسوقي اللولي", "Shop pearls"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("لولي مية عذبة، متربط باليد.", "Freshwater pearls, knotted by hand."),
  categories: [
    ["necklaces", "عقود", "Necklaces", PHOTOS.strands],
    ["earrings", "حلقان", "Earrings", PHOTOS.dropHoops],
    ["bracelets", "غوايش", "Bracelets", PHOTOS.baroque],
    ["baroque", "لولي باروك", "Baroque pearls", PHOTOS.baroque],
    ["sets", "أطقم", "Sets", PHOTOS.shellPlate],
  ],
  products: [
    ["freshwater-strand", "necklaces", "عقد لولي مية عذبة", "Freshwater Strand", PHOTOS.freshwater, 1980, { isFeatured: true, rating: 4.8, sold90: 160 }],
    ["pearl-drop-hoops", "earrings", "حلق هوب بلولية", "Pearl Drop Hoops", PHOTOS.dropHoops, 1188, { sold90: 120 }],
    ["baroque-bracelet", "baroque", "غويشة لولي باروك", "Baroque Pearl Bracelet", PHOTOS.baroque, 1740, { sold90: 88 }],
    ["classic-pearl-bracelet", "bracelets", "غويشة لولي كلاسيك", "Classic Pearl Bracelet", PHOTOS.classicBracelet, 1140, { sold90: 44 }],
    ["three-row-bracelet", "bracelets", "غويشة ٣ صفوف", "Three-Row Bracelet", PHOTOS.threeRow, 3480, { compareAtPrice: 4080, isFeatured: true, sold90: 31 }],
    ["crystal-pearl-earrings", "earrings", "حلق كريستال ولولي", "Crystal Pearl Earrings", PHOTOS.crystalEarrings, 1440, { compareAtPrice: 1680, sold90: 52 }],
    ["layered-strands", "necklaces", "عقود طبقات", "Layered Strands", PHOTOS.layered, 2650, { rating: 4.9, sold90: 36 }],
    ["coin-pearl-necklace", "necklaces", "عقد عملة ولولي", "Coin & Pearl Necklace", PHOTOS.coinPearl, 1590, { sold90: 40 }],
    ["pearl-brooch-set", "sets", "طقم لولي وبروش", "Pearl & Brooch Set", PHOTOS.shellPlate, 2900, { inStock: false, sold90: 18 }],
  ],
});

export const LULU = libraryTemplate({
  key: LULU_KEY,
  version: 3,
  changelog: "Lulu v3: categories, section order",
  productPage: { thumbs: "side", button: "outline", gallery: "end", band: "paper", copy: { reviews: L("رأي من لبسته", "From those who wear it"), related: L("لؤلؤ يليق معاه", "Pearls to wear with it") } },
  name: L("لولو", "Lulu"),
  description: L(
    "لولي مية عذبة: هيرو نصين، بنختار إزاي، قطع جديدة، حجز معاينة، كلمة المؤسسة والآراء. أربع صفحات جاهزة.",
    "Freshwater pearls: a split hero, how we choose, new pieces, a viewing booking, the founder's note and reviews. Four ready pages.",
  ),
  category: "jewelry",
  sortOrder: 830,
  palette: ["#fbf9f6", "#f1ece5", "#e7dfd2", "#5e6b7c"],
  colors: {
    primary: "#5e6b7c",
    secondary: "#f1ece5",
    background: "#fbf9f6",
    foreground: "#22201d",
    muted: "#625d56",
    border: "#e5ddd2",
    accent: "#e7dfd2",
  },
  fonts: { heading: "Amiri", body: "Noto Kufi Arabic" },
  radius: 20,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عننا", "About"), seo: { title: L("عن بيت اللولي", "About Lulu House") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصلي معانا", "Contact us"),
        text: L("شارع البرازيل، الزمالك. المعاينة بالحجز.", "Brazil St, Zamalek. Viewings by appointment."),
        heading: L("عن عقد أو معاينة", "About a strand or a viewing"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("اللولي واللضم والعناية.", "Pearls, stringing and care."),
        question: L("أحافظ على اللولي إزاي؟", "How do I care for pearls?"),
        answer: L("البسيه بعد البرفان، وامسحيه بقماشة ناعمة، وخليه في كيسه لوحده.", "Put it on after perfume, wipe it with a soft cloth and keep it in its own pouch."),
      }),
    },
  ],
  demo: DEMO,
});
