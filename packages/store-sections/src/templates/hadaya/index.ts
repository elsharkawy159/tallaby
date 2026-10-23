/**
 * Hadaya (template 45, kids' gift shop; Claude Design "Storefront
 * Templates"): peach paper, a toy blue for actions and a sunshine yellow
 * highlight, Baloo Bhaijaan 2 throughout and round 22px corners. A
 * birthday shop: the right gift in two minutes, gifts by age, shop by
 * budget, a party pack of three, a budget sort, a coupon and parents'
 * reviews. Built from section library designs (`fromLibrary`).
 *
 * Gift wrap is free on every order; there is no wrap option or gift message
 * field in checkout. The party pack total is typed copy for the three
 * newest products.
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

const NAME = L("هدايا كيدز", "Hadaya Kids");

const header = lib("header-pill", {
  text: {
    "اسم متجرك": NAME,
    "المتجر": L("كل الهدايا", "All gifts"),
    "العروض": L("تركيب", "Building"),
    "المدونة": L("حواديت", "Stories"),
  },
  links: { "/products": [SHOP, search("تركيب")], "/blog": search("حواديت") },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("متنساش أي عيد ميلاد", "Never miss a birthday"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("قولنا التاريخ، ونبعتلك أفكار هدايا قبلها بأسبوع.", "Tell us the date, we email gift ideas a week before."),
    "م": L("ه", "H"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ هدايا كيدز. كل الحقوق محفوظة.", "© 2026 Hadaya Kids. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.rainbowWide],
    text: {
      "كوليكشن الموسم": L("محل أعياد الميلاد", "Birthday shop"),
      "صوت أنقى، كل يوم": L("الهدية الصح في دقيقتين", "The right gift in two minutes"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "اختار السن والميزانية. بنغلفها ببلاش وبتوصل خلال ٢٤ ساعة في القاهرة.",
        "Pick an age and a budget. We wrap it for free and deliver within 24 hours in Cairo.",
      ),
      "تسوق الآن": L("كل الهدايا", "All gifts"),
      "العروض": L("بوكسات الهدايا", "Gift boxes"),
      "صورة الحملة": L("قوس قزح خشب ولعبة أشكال على الأرض", "A wooden rainbow and a shape sorter on the floor"),
    },
    links: { "/products": [SHOP, search("بوكس")] },
  }),
  lib("bundle-gifts", {
    photo: [PHOTOS.stacker, PHOTOS.toolKit, PHOTOS.dinos, PHOTOS.books],
    text: {
      "هدايا": L("حسب السن", "By age"),
      "هدية لمين؟": L("عنده كام سنة؟", "How old are they?"),
      "ليه": L("٠–٢ سنة", "0–2 years"),
      "ليها": L("٣–٥ سنين", "3–5 years"),
      "للطلبة": L("٦–٨ سنين", "6–8 years"),
      "للجيمرز": L("للقُرّاء", "Readers"),
    },
    links: { "/products": [search("بوكس"), search("طقم"), search("تركيب"), search("حواديت")] },
  }),
  lib("finder-price-bands", {
    text: {
      "أقل من ٦٠٠": L("أقل من ٤٥٠", "Under 450"),
      "٦٠٠ – ١٬٥٠٠": L("٤٥٠ – ٧٠٠", "450 – 700"),
      "أكتر من ١٬٥٠٠": L("أكتر من ٧٠٠", "Over 700"),
      "تسوق الشريحة دي": L("شوف الهدايا دي", "See these gifts"),
    },
  }),
  lib("bundle-poster", {
    text: {
      "طقم المشاوير": L("باكدج الحفلة", "Party pack"),
      "كل اللي تحتاجه في الطريق": L("٣ هدايا لـ٣ ولاد عم", "Three gifts for three cousins"),
      "١٬٢٧٠ ج.م": L("١٬٠٢٩ ج.م", "EGP 1,029"),
      "بدل ١٬٤٩٠ ج.م": L("بدل ١٬٢١٠ ج.م", "Was EGP 1,210"),
      "اشتري الطقم": L("خد التلاتة", "Get all three"),
    },
    links: { "/products": NEW },
  }),
  lib("finder-budget", {
    text: {
      "ابدأ من الأوفر": L("هدية على قد ميزانيتك", "A gift for your budget"),
      "رتبنالك المنتجات من الأقل سعرًا. عايز تشوف الأغلى الأول؟ اختار من الزراير.": L(
        "من ٣٠٠ لـ ١٥٠٠ ج.م: رتبنالك الهدايا من الأرخص. عايز البوكسات الكبيرة الأول؟ اختار من الزراير.",
        "From EGP 300 to 1,500: gifts sorted from the lowest price. Want the big boxes first? Use the buttons.",
      ),
    },
  }),
  lib("cart-coupon", {
    text: {
      "١٠٪": L("٥٠ ج.م", "EGP 50"),
      "خصم على أول طلب": L("خصم على الطلبات فوق ٥٠٠", "Off orders over EGP 500"),
      "الكود: WELCOME10": L("الكود: HADAYA50", "Code: HADAYA50"),
      "صالح ٤٨ ساعة": L("على كل طلب، طول السنة", "Every order, all year"),
    },
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("من الأهالي", "From parents"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "اخترت بالسن والميزانية في دقيقتين، والتغليف تحفة.",
        "Picked by age and budget in two minutes, wrapped beautifully.",
      ),
      "م": L("ه", "H"),
      "مريم أ.": L("هبة ر.", "Heba R."),
      "القاهرة": L("المعادي", "Maadi"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("وصلت تاني يوم الصبح، قبل الحفلة.", "Arrived the next morning, in time for the party."),
      "ي": L("م", "M"),
      "يوسف م.": L("مصطفى إ.", "Mostafa E."),
      "المنصورة": L("مدينة نصر", "Nasr City"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("بوكس حلو. نفسي في كتب أكتر للأكبر.", "Great box. I would like more books for older kids."),
      "ع": L("آ", "A"),
      "عمر ك.": L("آية ل.", "Aya L."),
      "الإسكندرية": L("الجيزة", "Giza"),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("الكارت كان مكتوب بخط الإيد باسم ابني.", "The card was handwritten with my son’s name."),
      "س": L("ن", "N"),
      "سلمى ر.": L("نرمين ع.", "Nermine A."),
      "أسيوط": L("مصر الجديدة", "Heliopolis"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("الديناصورات خامتها كويسة وألوانها آمنة.", "The dinosaurs are well made with safe paint."),
      "ن": L("ط", "T"),
      "نور ح.": L("طارق ح.", "Tarek H."),
      "الجيزة": L("الشيخ زايد", "Sheikh Zayed"),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("ساعدوني على واتساب أختار لتوأم بنت وولد.", "They helped me on WhatsApp choose for boy-girl twins."),
      "ك": L("ر", "R"),
      "كريم ع.": L("رحاب ع.", "Rehab A."),
    },
    links: { "/products": RATED },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن هدايا كيدز", "About Hadaya Kids"), L("محل هدايا أطفال في المعادي بيغلف كل طلب ببلاش.", "A kids’ gift shop in Maadi that wraps every order for free.")),
  aboutStory(lib, {
    photo: PHOTOS.giftsSmall,
    alt: L("علب هدايا متغلفة بشرايط", "Wrapped gift boxes with ribbons"),
    eyebrow: L("المعادي", "Maadi"),
    title: L("هدية كل عيد ميلاد", "A gift for every birthday"),
    text: L("بنرتب الهدايا حسب السن والميزانية، عشان تلاقي الصح في دقيقتين.", "We sort gifts by age and budget, so you find the right one in two minutes."),
    more: L("وكل طلب بيتغلف ببلاش ومعاه كارت.", "And every order is wrapped for free with a card."),
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
    ["gifts", "بوكسات هدايا", "Gift boxes", PHOTOS.giftsSmall],
  ],
  products: [
    ["animal-friends-set", "pretend", "طقم أصحاب الحيوانات", "Animal Friends Set", PHOTOS.safari, 390, { sold90: 74 }],
    ["wooden-tool-kit", "pretend", "شنطة عدة خشب", "Wooden Tool Kit", PHOTOS.toolKit, 480, { sold90: 96 }],
    ["first-readers-set", "books", "طقم أول قراية", "First Readers Set", PHOTOS.readers, 340, { sold90: 33 }],
    ["rainbow-block-set", "build", "طقم مكعبات قوس قزح", "Rainbow Block Set", PHOTOS.numberBlocks, 650, { isFeatured: true, rating: 4.9, sold90: 180 }],
    ["dinosaur-builders", "build", "ديناصورات تركيب", "Dinosaur Builders", PHOTOS.dinos, 560, { sold90: 41 }],
    ["first-birthday-box", "gifts", "بوكس أول عيد ميلاد", "First Birthday Box", PHOTOS.stacker, 1150, { compareAtPrice: 1350, isFeatured: true, sold90: 58 }],
    ["bedtime-stories-box", "books", "بوكس حواديت قبل النوم", "Bedtime Stories Box", PHOTOS.books, 520, { rating: 4.8, sold90: 88 }],
    ["playroom-starter-set", "build", "طقم أوضة اللعب", "Playroom Starter Set", PHOTOS.bricks, 1450, { sold90: 19 }],
    ["party-gift-box", "gifts", "بوكس هدايا الحفلة", "Party Gift Box", PHOTOS.giftsSmall, 890, { inStock: false, sold90: 24 }],
  ],
});

export const HADAYA = libraryTemplate({
  key: HADAYA_KEY,
  version: 1,
  name: L("هدايا", "Hadaya"),
  description: L(
    "محل هدايا أطفال: الهدية الصح في دقيقتين، حسب السن، حسب الميزانية، باكدج الحفلة، كوبون وآراء الأهالي. أربع صفحات جاهزة.",
    "Kids’ gift shop: the right gift in two minutes, by age, by budget, a party pack, a coupon and parents’ reviews. Four ready pages.",
  ),
  category: "kids",
  sortOrder: 450,
  palette: ["#fff7f0", "#ffe4d1", "#ffcc4d", "#3b4cca"],
  colors: {
    primary: "#3b4cca",
    secondary: "#ffe4d1",
    background: "#fff7f0",
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
    { slug: "about", name: L("عن هدايا كيدز", "About"), seo: { title: L("عن هدايا كيدز", "About Hadaya Kids") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("شارع ٩، المعادي، القاهرة.", "Road 9, Maadi, Cairo."),
        heading: L("محتار في هدية؟ اسألنا", "Stuck on a gift? Ask us"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التغليف والتوصيل والاستبدال.", "Wrapping, delivery and exchanges."),
        question: L("التغليف بفلوس؟", "Does gift wrap cost extra?"),
        answer: L("لأ، كل طلب بيتغلف ببلاش ومعاه كارت.", "No, every order is wrapped for free with a card."),
      }),
    },
  ],
  demo: DEMO,
});
