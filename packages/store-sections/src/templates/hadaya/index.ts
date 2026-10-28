/**
 * Hadaya (template 45, kids' gift shop; Claude Design "Storefront
 * Templates"): peach paper, a toy blue for actions and a sunshine yellow
 * highlight, Baloo Bhaijaan 2 throughout and round 22px corners. A
 * birthday shop (v3, section order): a rainbow poster with the free-wrap
 * sticker, what they love to play with, gifted most, our promises, gifts
 * by budget and parents' reviews. Built from section library designs
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
  lib("hero-poster", {
    photo: [undefined, undefined, PHOTOS.rainbowWide],
    text: {
      "مجموعة الموسم": L("محل أعياد الميلاد", "Birthday shop"),
      "من ١ إلى ٣٠ نوفمبر": L("توصيل خلال ٢٤ ساعة في القاهرة", "Delivered within 24 hours in Cairo"),
      "صورة الحملة": L("قوس قزح خشب ولعبة أشكال على الأرض", "A wooden rainbow and a shape sorter on the floor"),
      "خصم": L("تغليف", "Gift wrap"),
      "٣٠٪": L("ببلاش", "Free"),
      "لفترة محدودة": L("على كل هدية", "on every gift"),
      "الموسم الجديد وصل": L("الهدية الصح في دقيقتين", "The right gift in two minutes"),
      "قطع خفيفة بخامات طبيعية، مقاسات كاملة وتبديل مجاني خلال ١٤ يومًا.": L(
        "اختار القسم والميزانية، وإحنا نغلفها ونكتب الكارت باسم صاحب العيد.",
        "Pick a category and a budget; we wrap it and write the card with the birthday child’s name.",
      ),
      "اكتشف المجموعة": L("كل الهدايا", "All gifts"),
    },
  }),
  lib("categories-chips", { text: { "إيه اللي في بالك؟": L("بيحب يلعب بإيه؟", "What do they love to play with?") } }),
  lib("products-rail", {
    text: { "بيحبوها": L("الأهالي بيختاروها", "Parents’ picks"), "الأكثر مبيعًا": L("الأكتر هدية", "Gifted most") },
    links: { "/products": BEST },
  }),
  lib("features-classic", {
    text: {
      "توصيل سريع": L("توصيل في ٢٤ ساعة", "Delivery in 24 hours"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("في القاهرة والجيزة، قبل الحفلة", "In Cairo and Giza, before the party"),
      "الدفع عند الاستلام": L("تغليف ببلاش", "Free gift wrap"),
      "أو ادفع بالبطاقة والمحفظة": L("وكارت مكتوب بخط الإيد", "With a handwritten card"),
      "استرجاع سهل": L("استبدال سهل", "Easy exchange"),
      "١٤ يومًا لتغيّر رأيك": L("لو الهدية اتكررت، بدّلها خلال ١٤ يوم", "Got it twice? Swap it within 14 days"),
      "دعم على واتساب": L("نساعدك تختار", "We help you choose"),
      "أشخاص حقيقيون طوال الأسبوع": L("ابعتلنا السن على واتساب", "Send us the age on WhatsApp"),
    },
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
    ["animals", "حيوانات", "Animals", PHOTOS.safari],
    ["dinos", "ديناصورات", "Dinosaurs", PHOTOS.dinos],
    ["baby", "للبيبي", "Baby & toddler", PHOTOS.stacker],
    ["learning", "تعليمي", "Learning", PHOTOS.readers],
  ],
  products: [
    ["animal-friends-set", "animals", "طقم أصحاب الحيوانات", "Animal Friends Set", PHOTOS.safari, 390, { sold90: 74 }],
    ["wooden-tool-kit", "pretend", "شنطة عدة خشب", "Wooden Tool Kit", PHOTOS.toolKit, 480, { sold90: 96 }],
    ["first-readers-set", "learning", "طقم أول قراية", "First Readers Set", PHOTOS.readers, 340, { sold90: 33 }],
    ["rainbow-block-set", "build", "طقم مكعبات قوس قزح", "Rainbow Block Set", PHOTOS.numberBlocks, 650, { isFeatured: true, rating: 4.9, sold90: 180 }],
    ["dinosaur-builders", "dinos", "ديناصورات تركيب", "Dinosaur Builders", PHOTOS.dinos, 560, { sold90: 41 }],
    ["first-birthday-box", "gifts", "بوكس أول عيد ميلاد", "First Birthday Box", PHOTOS.stacker, 1150, { compareAtPrice: 1350, isFeatured: true, sold90: 58 }],
    ["bedtime-stories-box", "books", "بوكس حواديت قبل النوم", "Bedtime Stories Box", PHOTOS.books, 520, { rating: 4.8, sold90: 88 }],
    ["playroom-starter-set", "build", "طقم أوضة اللعب", "Playroom Starter Set", PHOTOS.bricks, 1450, { sold90: 19 }],
    ["party-gift-box", "gifts", "بوكس هدايا الحفلة", "Party Gift Box", PHOTOS.giftsSmall, 890, { inStock: false, sold90: 24 }],
    ["rainbow-ring-stacker", "baby", "برج حلقات ملون", "Rainbow Ring Stacker", PHOTOS.stacker, 320, { sold90: 66 }],
  ],
});

export const HADAYA = libraryTemplate({
  key: HADAYA_KEY,
  version: 3,
  changelog: "Hadaya v3: poster hero, categories, no coupon, section order",
  productPage: { surface: "card", thumbs: "bottom", band: "brand", extras: ["product-perks"], copy: { reviews: L("رأي الأهالي", "What parents say"), related: L("هدايا تانية حلوة", "More gifts they will love") } },
  name: L("هدايا", "Hadaya"),
  description: L(
    "محل هدايا أطفال: الهدية الصح في دقيقتين، حسب السن، حسب الميزانية وآراء الأهالي. أربع صفحات جاهزة.",
    "Kids’ gift shop: the right gift in two minutes, by age, by budget and parents’ reviews. Four ready pages.",
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
