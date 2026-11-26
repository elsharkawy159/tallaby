/**
 * Hekaya (template 31, children's books; Claude Design "Storefront
 * Templates"): warm paper, a deep navy for actions and a sunny yellow
 * highlight, Baloo Bhaijaan 2 throughout and round 22px corners. A
 * teacher-run bookshop: a split hero, the shelves, the shelf, why Hekaya,
 * the year in numbers, publishers and parents' questions. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): books on shelves,
 * wooden letter and number blocks. No children, parents, hands or
 * readable titles.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const HEKAYA_KEY = "hekaya";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(HEKAYA_KEY, getDesign(id)!, { corners: 22, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  animalsOnBooks: pexels(3661201),
  shelfBooks: pexels(7703324, 900),
  bookcase: pexels(4887260, 900),
  alphabet: pexels(1822568, 900),
  numberBlocks: pexels(311268, 900),
  sorter: pexels(6693309, 900),
  stacker: pexels(9271761, 900),
  animalsSmall: pexels(3661201, 900),
};

const NAME = L("مكتبة حكاية", "Hekaya Books");

const header = lib("header-pill", {
  text: { "اسم متجرك": NAME, "المتجر": L("كل الكتب", "All books"), "العروض": L("الأكثر مبيعاً", "Best sellers"), "المدونة": L("من نحن", "About") },
  links: { "/products": [SHOP, BEST], "/blog": "/about" },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("كتب وقصص جديدة", "New books and stories"),
    "منتجات جديدة وأخبار المتجر.": L("أخبار الكتب الجديدة لكل عمر.", "News of new books for every age."),
    "م": L("ح", "H"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ مكتبة حكاية. كل الحقوق محفوظة.", "© 2026 Hekaya Books. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-split", {
    photo: [PHOTOS.animalsOnBooks],
    text: {
      "صورة الواجهة": L("حيوانات خشب فوق كومة كتب", "Wooden animals on a stack of books"),
      "المجموعة الجديدة": L("جديد الشهر", "New this month"),
      "مختارة بعناية": L("قصص مصورة للأطفال", "Picture books for kids"),
      "قطع مختارة بعناية، لكل قطعة تفاصيلها المميزة.": L(
        "كتب مصورة بالعربية والإنجليزية لكل عمر.",
        "Arabic and English picture books for every age.",
      ),
      "تسوّق المجموعة": L("تسوق الكتب الجديدة", "Shop new books"),
      "حكايتنا": L("من نحن", "Who we are"),
    },
    links: { "/products": NEW },
  }),
  lib("categories-captioned", { text: { "اكتشف الأقسام": L("رفوف حكاية", "Hekaya shelves"), "كل الأقسام": L("كل الكتب", "All books") } }),
  lib("products-shelf", {
    text: { "تسوّق حسب اختيارك": L("الرف", "The shelf"), "وصل جديد": L("جديد", "New"), "عليه خصم": L("الأعلى تقييماً", "Top rated") },
    links: { "/products": [NEW, BEST, RATED, SHOP] },
  }),
  lib("features-bento", {
    text: {
      "وعدنا لك": L("لماذا حكاية", "Why Hekaya"),
      "نختار كل منتج كأننا نختاره لأنفسنا": L("كتب مختارة بعناية", "Carefully chosen books"),
      "اعرف أكثر": L("تعرّف علينا", "About us"),
      "الشحن": L("حسب العمر", "By age"),
      "تظهر تكلفة الشحن ومدته عند إتمام الطلب": L("العمر المناسب مكتوب لكل كتاب.", "The suitable age is shown for every book."),
      "الدفع عند الاستلام": L("بالعربية والإنجليزية", "Arabic and English"),
      "أو بطرق الدفع المتاحة عند الطلب": L("كتب مصورة وقصص وألعاب تعليمية.", "Picture books, stories and learning toys."),
      "الاستبدال والاسترجاع": L("تفاصيل واضحة", "Clear details"),
      "التفاصيل في صفحة السياسات": L("صور وتفاصيل لكل كتاب.", "Photos and details for every book."),
    },
  }),
  // v5 (2026-11-25, owner): the store's 1st category as a carousel after the reasons.
  lib("products-category-carousel", { lists: [undefined, { limit: 4 }] }),
  lib("stats-sentence", {
    text: {
      "وصّلنا": L("قرأ عملاؤنا", "Our readers finished"),
      "٢٥ ألف": L("٦٢ ألف", "62,000"),
      "طلب لـ": L("كتاب هذا العام في", "books this year across"),
      "محافظة، ومتوسط تقييم عملائنا": L("محافظة، ومتوسط تقييم الأهل", "governorates, and parents rate us"),
    },
  }),
  lib("brands-bubbles", {
    name: L("دور نشر نحبها", "Publishers we love"),
    text: {
      "ماركات نحبها": L("دور نشر نحبها", "Publishers we love"),
      "فولتا": "Dar Hekaya",
      "نورو": "Kalimat",
      "كيان": "Little Owl",
      "ساحل": "Nahdet",
      "أوربت": "Story Kite",
      "ميزان": "Bookling",
      "لومو": "Al Fanous",
    },
    links: {
      "/products": [search("Dar Hekaya"), search("Kalimat"), search("Little Owl"), search("Nahdet"), search("Story Kite"), search("Bookling"), search("Al Fanous")],
    },
  }),
  lib("faq-chat", { text: { "أسئلتكم المتكررة": L("أسئلة الأهل", "Parents ask us…") } }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن حكاية", "About Hekaya"), L("مكتبة أطفال بكتب عربية وإنجليزية.", "A children’s bookshop of Arabic and English books.")),
  aboutStory(lib, {
    photo: PHOTOS.bookcase,
    alt: L("رفوف مليئة بكتب ملوّنة", "Shelves full of colourful books"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("كتب لكل عمر", "Books for every age"),
    text: L("نختار كتبًا بالعربية والإنجليزية مناسبة لكل عمر، برسوم جميلة.", "Well-illustrated Arabic and English books for every age."),
    more: L("تواصل معنا لأي سؤال عن كتاب.", "Contact us with any question about a book."),
    button: L("تسوق الكتب", "Shop books"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("قصص بالعربية والإنجليزية للقرّاء الصغار.", "Arabic and English stories for little readers."),
  categories: [
    // v5: learn and play first, so the category carousel (the 1st category) shows a full row.
    ["play", "تعلّم والعب", "Learn & play", PHOTOS.alphabet],
    ["arabic", "قصص عربية", "Arabic stories", PHOTOS.shelfBooks],
    ["english", "كتب إنجليزية", "English books", PHOTOS.bookcase],
    ["blocks", "مكعبات", "Blocks", PHOTOS.numberBlocks],
    ["animals", "حكايات الحيوانات", "Animal tales", PHOTOS.animalsOnBooks],
  ],
  products: [
    ["bedtime-stories-box", "arabic", "علبة قصص قبل النوم", "Bedtime Stories Box", PHOTOS.shelfBooks, 650, { isFeatured: true, rating: 4.9, sold90: 340 }],
    ["animal-stories-set", "animals", "طقم حكايات الحيوانات", "Animal Stories Set", PHOTOS.animalsSmall, 520, { sold90: 120 }],
    ["first-readers-set", "english", "طقم القارئ الأول", "First Readers Set", PHOTOS.bookcase, 780, { rating: 4.8, sold90: 186 }],
    ["story-bin-mixed-ages", "english", "صندوق قصص لأعمار متنوعة", "Story Bin, Mixed Ages", PHOTOS.shelfBooks, 990, { compareAtPrice: 1250, sold90: 41 }],
    ["arabic-letters-blocks", "play", "مكعبات الحروف", "Arabic Letters Blocks", PHOTOS.alphabet, 590, { isFeatured: true, sold90: 72 }],
    ["counting-blocks", "blocks", "مكعبات العد", "Rainbow Counting Blocks", PHOTOS.numberBlocks, 520, { compareAtPrice: 620, sold90: 118 }],
    ["shape-sorter", "play", "لعبة الأشكال", "Shape Sorter", PHOTOS.sorter, 320, { sold90: 41 }],
    ["learn-to-count-blocks", "play", "مكعبات تعلّم العد", "Learn-to-Count Blocks", PHOTOS.numberBlocks, 450, { sold90: 52 }],
    ["learning-stacker", "play", "برج الحلقات", "Learning Stacker", PHOTOS.stacker, 260, { inStock: false, sold90: 30 }],
  ],
});

export const HEKAYA = libraryTemplate({
  key: HEKAYA_KEY,
  version: 6,
  changelog: "Hekaya v5: products by category as a carousel on the home",
  name: L("حكاية", "Hekaya"),
  description: L(
    "كتب أطفال: جديد الشهر، اختيار عمر القارئ، لماذا حكاية ودور النشر. أربع صفحات جاهزة.",
    "Children’s books: new this month, pick your reader’s age, why Hekaya and publishers. Four ready pages.",
  ),
  category: "books",
  style: ["playful"],
  sortOrder: 310,
  palette: ["#fffaf1", "#fde8c9", "#ffc94d", "#1f3a5f"],
  colors: {
    primary: "#1f3a5f",
    secondary: "#fde8c9",
    background: "#ffffff",
    foreground: "#1f3a5f",
    muted: "#566781",
    border: "#f0dfc1",
    accent: "#ffc94d",
  },
  fonts: { heading: "Baloo Bhaijaan 2", body: "Baloo Bhaijaan 2" },
  radius: 22,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن حكاية", "About"), seo: { title: L("عن حكاية", "About Hekaya") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("١٤ شارع ٩، المعادي، القاهرة.", "14 Road 9, Maadi, Cairo."),
        heading: L("اسألنا عن كتاب لعمر معين", "Ask us for a book for any age"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الكتب والأعمار والطلبات.", "Books, ages and orders."),
        question: L("كيف أختار كتابًا يناسب العمر؟", "How do I choose a book for the right age?"),
        answer: L("العمر المناسب مكتوب في تفاصيل كل كتاب، ويمكنك التصفح حسب القسم.", "Each book shows its suitable age, and you can browse by shelf."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "shelf", thumbs: "side", band: "shelf", copy: { reviews: L("آراء القرّاء الصغار وأهلهم", "Readers and parents say"), related: L("كتب قد تعجبك", "Books to read next") } },
});
