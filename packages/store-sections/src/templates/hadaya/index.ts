/**
 * Hadaya (template 45, kids' gift shop; Claude Design "Storefront
 * Templates"): peach paper, a toy blue for actions and a sunshine yellow
 * highlight, Baloo Bhaijaan 2 throughout and round 22px corners. A
 * birthday shop (v3, section order): a rainbow poster with the free-wrap
 * sticker, what they love to play with, gifted most, our promises, gifts
 * by budget, parents' reviews and the building toys as a carousel (the
 * store's 1st category). Built from section library designs
 * (`fromLibrary`).
 *
 * Gift wrap is free on every order; there is no wrap option or gift message
 * field in checkout.
 *
 * Photos: Pexels, each checked by eye (2026-10-23): wrapped gift boxes,
 * numbered wooden blocks, a wooden tool kit laid flat, toy dinosaurs on
 * orange, wooden safari animals, a wooden stacker, picture books on a
 * shelf, a classroom bookcase, loose building bricks and a wooden rainbow.
 * The design's photos of children playing were all replaced. No people, no
 * hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const HADAYA_KEY = "hadaya";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(HADAYA_KEY, getDesign(id)!, { corners: 22, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  giftsSmall: pexels(1303087, 900),
  numberBlocks: pexels(311269, 900),
  toolKit: pexels(7269570, 900),
  dinos: pexels(8014537, 900),
  safari: pexels(3663061, 900),
  stacker: pexels(9271758, 900),
  books: pexels(31024471, 900),
  readers: pexels(8364640, 900),
  bricks: pexels(4491702, 900),
  rainbowWide: pexels(38695466),
};

const NAME = L("هدايا الصغار", "Hadaya Kids");

const header = lib("header-pill", {
  text: {
    "اسم متجرك": NAME,
    "المتجر": L("كل الهدايا", "All gifts"),
    "العروض": L("ألعاب التركيب", "Building"),
    "المدونة": L("قصص", "Stories"),
  },
  links: { "/products": [SHOP, search("تركيب")], "/blog": search("حواديت") },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("أفكار هدايا لكل مناسبة", "Gift ideas for every occasion"),
    "منتجات جديدة وأخبار المتجر.": L("منتجات جديدة وأفكار هدايا للأطفال.", "New products and gift ideas for kids."),
    "م": L("ه", "H"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ هدايا الصغار. كل الحقوق محفوظة.", "© 2026 Hadaya Kids. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-poster", {
    photo: [undefined, undefined, PHOTOS.rainbowWide],
    text: {
      "مجموعة الموسم": L("هدايا أعياد الميلاد", "Birthday gifts"),
      "وصل حديثًا": L("ألعاب وكتب وعلب هدايا", "Toys, books and gift boxes"),
      "صورة الحملة": L("قوس قزح خشب ولعبة أشكال على الأرض", "A wooden rainbow and a shape sorter on the floor"),
      "مجموعة": L("هدايا", "Gifts"),
      "٢٠٢٦": L("لكل", "for every"),
      "الجديدة": L("مناسبة", "occasion"),
      "الموسم الجديد وصل": L("هدايا لكل عمر", "Gifts for every age"),
      "قطع خفيفة بخامات طبيعية ومقاسات كاملة.": L(
        "تصفّح حسب القسم والسعر واختر الهدية المناسبة.",
        "Browse by category and price to find the right gift.",
      ),
      "اكتشف المجموعة": L("كل الهدايا", "All gifts"),
    },
  }),
  lib("categories-chips", { text: { "عمّ تبحث؟": L("ماذا يحب أن يلعب؟", "What do they love to play with?") } }),
  lib("products-rail", {
    text: { "المفضلة لدى العملاء": L("اختيارات الأهل", "Parents’ picks"), "الأكثر مبيعًا": L("الأكثر طلبًا", "Best sellers") },
    links: { "/products": BEST },
  }),
  lib("features-classic", {
    text: {
      "الشحن": L("حسب العمر", "By age"),
      "تظهر تكلفة الشحن ومدته عند إتمام الطلب": L("العمر المناسب في تفاصيل كل لعبة", "The suitable age shown for every toy"),
      "الدفع عند الاستلام": L("تشكيلة واسعة", "A wide range"),
      "أو بطرق الدفع المتاحة عند الطلب": L("ألعاب وكتب وعلب هدايا", "Toys, books and gift boxes"),
      "الاستبدال والاسترجاع": L("تفاصيل واضحة", "Clear details"),
      "التفاصيل في صفحة السياسات": L("صور ومواصفات لكل منتج", "Photos and details for every product"),
      "تواصل معنا": L("نساعدك في الاختيار", "We help you choose"),
      "لأي سؤال عن طلب أو منتج": L("تواصل معنا لأي سؤال", "Contact us with any question"),
    },
  }),
  lib("finder-budget", {
    text: {
      "ابدأ بالأقل سعرًا": L("هدية تناسب ميزانيتك", "A gift for your budget"),
      "رتّبنا لك المنتجات من الأقل سعرًا. تريد رؤية الأعلى سعرًا أولًا؟ اختر من الأزرار.": L(
        "رتّبنا الهدايا من الأقل سعرًا. تريد علب الهدايا الكبيرة أولًا؟ اختر من الأزرار.",
        "Gifts sorted from the lowest price. Want the big boxes first? Use the buttons.",
      ),
    },
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("آراء الأهل", "From parents"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "اخترت الهدية حسب العمر والسعر بسهولة.",
        "Easy to choose by age and price.",
      ),
      "م": L("ه", "H"),
      "مريم أ.": L("هبة ر.", "Heba R."),
      "القاهرة": L("حكايتنا", "Our story"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("المكعبات ألوانها جميلة وخامتها جيدة.", "The blocks have lovely colours and feel well made."),
      "ي": L("م", "M"),
      "يوسف م.": L("مصطفى إ.", "Mostafa E."),
      "المنصورة": L("مدينة نصر", "Nasr City"),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L("علبة جميلة، وأتمنى كتبًا أكثر للأعمار الأكبر.", "A lovely box. I would like more books for older kids."),
      "ع": L("آ", "A"),
      "عمر ك.": L("آية ل.", "Aya L."),
      "الإسكندرية": L("الجيزة", "Giza"),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("كتب القصص مناسبة لعمر ابني تمامًا.", "The story books suit my son’s age exactly."),
      "س": L("ن", "N"),
      "سلمى ر.": L("نرمين ع.", "Nermine A."),
      "أسيوط": L("مصر الجديدة", "Heliopolis"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("الديناصورات خامتها جيدة وألوانها زاهية.", "The dinosaurs are well made with bright colours."),
      "ن": L("ط", "T"),
      "نور ح.": L("طارق ح.", "Tarek H."),
      "الجيزة": L("الشيخ زايد", "Sheikh Zayed"),
      "خدمة العملاء محترمة جدًا وساعدوني في اختيار المنتج المناسب.": L("وجدت هدايا مناسبة لتوأم ولد وبنت.", "I found the right gifts for boy-girl twins."),
      "ك": L("ر", "R"),
      "كريم ع.": L("رحاب ع.", "Rehab A."),
    },
    links: { "/products": RATED },
  }),
  // The store's 1st category (building toys in the demo) as a carousel.
  lib("products-category-carousel", { lists: [undefined, { limit: 4 }] }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن هدايا الصغار", "About Hadaya Kids"), L("هدايا للأطفال حسب العمر والسعر.", "Kids’ gifts by age and price.")),
  aboutStory(lib, {
    photo: PHOTOS.giftsSmall,
    alt: L("علب هدايا مغلفة بشرائط", "Wrapped gift boxes with ribbons"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("هدية لكل عيد ميلاد", "A gift for every birthday"),
    text: L("نرتّب الهدايا حسب العمر والسعر، لتجد المناسب بسهولة.", "Gifts sorted by age and price, so the right one is easy to find."),
    more: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
    button: L("تسوق الهدايا", "Shop gifts"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("هدايا أعياد الميلاد حسب السن والميزانية.", "Birthday gifts sorted by age and budget."),
  categories: [
    ["build", "مكعبات وتركيب", "Blocks & building", PHOTOS.numberBlocks],
    ["pretend", "لعب تمثيلي", "Pretend play", PHOTOS.toolKit],
    ["books", "كتب", "Books", PHOTOS.books],
    ["gifts", "علب هدايا", "Gift boxes", PHOTOS.giftsSmall],
    ["animals", "حيوانات", "Animals", PHOTOS.safari],
    ["dinos", "ديناصورات", "Dinosaurs", PHOTOS.dinos],
    ["baby", "للرضع والصغار", "Baby & toddler", PHOTOS.stacker],
    ["learning", "تعليمي", "Learning", PHOTOS.readers],
  ],
  products: [
    ["animal-friends-set", "animals", "طقم أصحاب الحيوانات", "Animal Friends Set", PHOTOS.safari, 390, { sold90: 74 }],
    ["wooden-tool-kit", "pretend", "حقيبة عدة خشبية", "Wooden Tool Kit", PHOTOS.toolKit, 480, { sold90: 96 }],
    ["first-readers-set", "learning", "طقم القراءة الأولى", "First Readers Set", PHOTOS.readers, 340, { sold90: 33 }],
    ["rainbow-block-set", "build", "طقم مكعبات قوس قزح", "Rainbow Block Set", PHOTOS.numberBlocks, 650, { isFeatured: true, rating: 4.9, sold90: 180 }],
    ["dinosaur-builders", "dinos", "ديناصورات تركيب", "Dinosaur Builders", PHOTOS.dinos, 560, { sold90: 41 }],
    ["first-birthday-box", "gifts", "علبة أول عيد ميلاد", "First Birthday Box", PHOTOS.stacker, 1150, { compareAtPrice: 1350, isFeatured: true, sold90: 58 }],
    ["bedtime-stories-box", "books", "علبة قصص قبل النوم", "Bedtime Stories Box", PHOTOS.books, 520, { rating: 4.8, sold90: 88 }],
    ["playroom-starter-set", "build", "طقم غرفة اللعب", "Playroom Starter Set", PHOTOS.bricks, 1450, { sold90: 19 }],
    ["party-gift-box", "gifts", "علبة هدايا الحفلة", "Party Gift Box", PHOTOS.giftsSmall, 890, { inStock: false, sold90: 24 }],
    ["rainbow-ring-stacker", "baby", "برج حلقات ملون", "Rainbow Ring Stacker", PHOTOS.stacker, 320, { sold90: 66 }],
    // Two more building toys, so the building carousel fills its row of four (v4).
    ["dinosaur-block-set", "build", "مكعبات ديناصورات", "Dinosaur Block Set", PHOTOS.dinos, 480, { sold90: 16 }],
    ["wooden-stacking-tower", "build", "برج تركيب خشبي", "Wooden Stacking Tower", PHOTOS.stacker, 360, { sold90: 14 }],
  ],
});

export const HADAYA = libraryTemplate({
  key: HADAYA_KEY,
  version: 4,
  changelog: "Hadaya v4: a building-toys carousel (the store's 1st category) on the home",
  productPage: { surface: "card", thumbs: "bottom", band: "brand", extras: ["product-perks"], copy: { reviews: L("آراء الأهل", "What parents say"), related: L("هدايا أخرى قد تعجبك", "More gifts they will love") } },
  name: L("هدايا", "Hadaya"),
  description: L(
    "متجر هدايا أطفال: هدايا حسب العمر، حسب الميزانية وآراء الأهل. أربع صفحات جاهزة.",
    "Kids’ gift shop: gifts by age, by budget and parents’ reviews. Four ready pages.",
  ),
  category: "kids",
  style: ["playful"],
  sortOrder: 450,
  palette: ["#fff7f0", "#ffe4d1", "#ffcc4d", "#3b4cca"],
  colors: {
    primary: "#3b4cca",
    secondary: "#ffe4d1",
    background: "#ffffff",
    foreground: "#1e2a5a",
    muted: "#56607f",
    border: "#f5d8c2",
    accent: "#ffcc4d",
  },
  fonts: { heading: "Baloo Bhaijaan 2", body: "Baloo Bhaijaan 2" },
  radius: 22,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن هدايا الصغار", "About"), seo: { title: L("عن هدايا الصغار", "About Hadaya Kids") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("شارع ٩، المعادي، القاهرة.", "Road 9, Maadi, Cairo."),
        heading: L("تحتاج مساعدة في اختيار هدية؟ اسألنا", "Stuck on a gift? Ask us"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الهدايا والأعمار والطلبات.", "Gifts, ages and orders."),
        question: L("كيف أختار هدية تناسب العمر؟", "How do I pick a gift for the right age?"),
        answer: L("العمر المناسب مكتوب في تفاصيل كل منتج، ويمكنك التصفح حسب القسم والسعر.", "Each product shows its suitable age, and you can browse by category and price."),
      }),
    },
  ],
  demo: DEMO,
});
