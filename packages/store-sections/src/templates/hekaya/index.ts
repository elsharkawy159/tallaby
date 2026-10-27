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

const NAME = L("حكاية بوكس", "Hekaya Books");

const header = lib("header-pill", {
  text: { "اسم متجرك": NAME, "المتجر": L("كل الكتب", "All books"), "العروض": L("الأكثر مبيعاً", "Best sellers"), "المدونة": L("عننا", "About") },
  links: { "/products": [SHOP, BEST], "/blog": "/about" },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("حكاية كل جمعة", "A story every Friday"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("حكاية قصيرة ببلاش على الإيميل قبل النوم.", "A free short story by email for bedtime."),
    "م": L("ح", "H"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ حكاية بوكس. كل الحقوق محفوظة.", "© 2026 Hekaya Books. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-split", {
    photo: [PHOTOS.animalsOnBooks],
    text: {
      "صورة الواجهة": L("حيوانات خشب فوق كومة كتب", "Wooden animals on a stack of books"),
      "المجموعة الجديدة": L("جديد الشهر ده", "New this month"),
      "معمول بكميات صغيرة": L("حكايات هيطلبوها تاني", "Stories they will ask for again"),
      "قطع مختارة بعناية، بنعملها بكميات صغيرة عشان كل واحدة تفضل مميزة.": L(
        "كتب مصورة عربي وإنجليزي مختارة من مدرّستين، بتغليف هدية مجاني.",
        "Arabic and English picture books picked by two teachers, with free gift wrap.",
      ),
      "تسوّق المجموعة": L("تسوق الكتب الجديدة", "Shop new books"),
      "حكايتنا": L("مين إحنا", "Who we are"),
    },
    links: { "/products": NEW },
  }),
  lib("categories-captioned", { text: { "اكتشف الأقسام": L("رفوف حكاية", "Hekaya shelves"), "كل الأقسام": L("كل الكتب", "All books") } }),
  lib("products-shelf", {
    text: { "تسوّق حسب مزاجك": L("الرف", "The shelf"), "وصل جديد": L("جديد", "New"), "عليه خصم": L("الأعلى تقييماً", "Top rated") },
    links: { "/products": [NEW, BEST, RATED, SHOP] },
  }),
  lib("features-bento", {
    text: {
      "وعدنا ليك": L("ليه حكاية", "Why Hekaya"),
      "نشتري لك كأننا بنشتري لنفسنا": L("كتب مختارة من مدرسين", "Books picked by teachers"),
      "اعرف أكتر": L("اعرف الفريق", "Meet the team"),
      "توصيل سريع": L("متراجعة حسب السن", "Age-checked"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("كل كتاب بيتقري قبل ما يتعرض.", "Every book is read before it is listed."),
      "الدفع عند الاستلام": L("تغليف مجاني", "Free gift wrap"),
      "أو ادفع بالبطاقة والمحفظة": L("ومعاه كارت بالاسم.", "With a name card."),
      "استرجاع سهل": L("استبدال لو مقفول", "Swap unopened"),
      "١٤ يومًا لتغيّر رأيك": L("خلال ١٤ يوم.", "Within 14 days."),
    },
  }),
  lib("stats-sentence", {
    text: {
      "وصّلنا": L("قرّاءنا خلّصوا", "Our readers finished"),
      "٢٥ ألف": L("٦٢ ألف", "62,000"),
      "طلب لـ": L("كتاب السنة دي في", "books this year across"),
      "محافظة، وعملاءنا مدّيين متوسط": L("محافظة، وتقييم الأهالي", "governorates, and parents rate us"),
    },
  }),
  lib("brands-bubbles", {
    name: L("دور نشر بنحبها", "Publishers we love"),
    text: {
      "ماركات بنحبها": L("دور نشر بنحبها", "Publishers we love"),
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
  lib("faq-chat", { text: { "سألتونا كتير…": L("الأهالي بيسألونا…", "Parents ask us…") } }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن حكاية", "About Hekaya"), L("مكتبة أطفال في المعادي بدأتها مدرّستين.", "A children’s bookshop in Maadi started by two teachers.")),
  aboutStory(lib, {
    photo: PHOTOS.bookcase,
    alt: L("رفوف مليانة كتب ملوّنة", "Shelves full of colourful books"),
    eyebrow: L("المعادي", "Maadi"),
    title: L("كل كتاب بيتقري قبل ما يتعرض", "Every book is read before it is listed"),
    text: L("إحنا مدرّستين بنختار كتب عربي وإنجليزي مناسبة لكل سن، برسومات حلوة.", "We are two teachers choosing well-illustrated Arabic and English books for every age."),
    more: L("واشتري ٣ كتب والرابع ببلاش.", "And buy three books, get the fourth free."),
    button: L("تسوق الكتب", "Shop books"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("حكايات عربي وإنجليزي للقرّاء الصغيرين.", "Arabic and English stories for little readers."),
  categories: [
    ["arabic", "حكايات عربي", "Arabic stories", PHOTOS.shelfBooks],
    ["english", "كتب إنجليزي", "English books", PHOTOS.bookcase],
    ["play", "اتعلم والعب", "Learn & play", PHOTOS.alphabet],
  ],
  products: [
    ["bedtime-stories-box", "arabic", "بوكس حكايات قبل النوم", "Bedtime Stories Box", PHOTOS.shelfBooks, 650, { isFeatured: true, rating: 4.9, sold90: 340 }],
    ["animal-stories-set", "arabic", "طقم حكايات الحيوانات", "Animal Stories Set", PHOTOS.animalsSmall, 520, { sold90: 120 }],
    ["first-readers-set", "english", "طقم القارئ الأول", "First Readers Set", PHOTOS.bookcase, 780, { rating: 4.8, sold90: 186 }],
    ["story-bin-mixed-ages", "english", "صندوق حكايات مشكل", "Story Bin, Mixed Ages", PHOTOS.shelfBooks, 990, { compareAtPrice: 1250, sold90: 41 }],
    ["arabic-letters-blocks", "play", "مكعبات الحروف", "Arabic Letters Blocks", PHOTOS.alphabet, 590, { isFeatured: true, sold90: 72 }],
    ["counting-blocks", "play", "مكعبات العد", "Rainbow Counting Blocks", PHOTOS.numberBlocks, 520, { compareAtPrice: 620, sold90: 118 }],
    ["shape-sorter", "play", "لعبة الأشكال", "Shape Sorter", PHOTOS.sorter, 320, { sold90: 41 }],
    ["learning-stacker", "play", "برج الحلقات", "Learning Stacker", PHOTOS.stacker, 260, { inStock: false, sold90: 30 }],
  ],
});

export const HEKAYA = libraryTemplate({
  key: HEKAYA_KEY,
  version: 4,
  changelog: "Hekaya v4: new hero, categories, section order",
  name: L("حكاية", "Hekaya"),
  description: L(
    "كتب أطفال: جديد الشهر، اختار سن القارئ، ليه حكاية ودور النشر. أربع صفحات جاهزة.",
    "Children’s books: new this month, pick your reader’s age, why Hekaya and publishers. Four ready pages.",
  ),
  category: "books",
  sortOrder: 310,
  palette: ["#fffaf1", "#fde8c9", "#ffc94d", "#1f3a5f"],
  colors: {
    primary: "#1f3a5f",
    secondary: "#fde8c9",
    background: "#fffaf1",
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
        heading: L("اسألنا عن كتاب لسن معين", "Ask us for a book for any age"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الكتب والتغليف والتوصيل.", "Books, gift wrap and delivery."),
        question: L("بتغلفوا الكتب هدية؟", "Do you gift-wrap books?"),
        answer: L("أيوه، اكتبلنا في ملاحظات الطلب وبنغلفه ونحط كارت باسمك.", "Yes. Add a note to your order and we wrap it with a card in your name."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "shelf", thumbs: "side", band: "shelf", copy: { back: L("رجوع للمكتبة", "Back to the bookshop"), reviews: L("رأي القرّاء الصغار وأهاليهم", "Readers and parents say"), related: L("كتب بعدها", "Books to read next") } },
});
