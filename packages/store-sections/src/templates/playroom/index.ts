/**
 * Playroom (template 28, wooden toys; Claude Design "Storefront
 * Templates"): warm cream paper, a coral for actions and a peach
 * highlight, Lemonada display type over Tajawal and round 22px corners. A
 * gift-friendly toy shop: campaigns, shop by age and play, a tabbed shelf,
 * the birthday-box deal, parents' promises, playtime photos and answers.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): wooden toys, blocks,
 * animals and stackers. No children, parents or hands.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const PLAYROOM_KEY = "playroom";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(PLAYROOM_KEY, getDesign(id)!, { corners: 22, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  dinoFloor: pexels(3661261),
  xylophone: pexels(6743166),
  blocksPillow: pexels(4964375),
  stackerGrey: pexels(9271758, 900),
  stackerPeach: pexels(9271761, 900),
  roundBlocks: pexels(6188059, 900),
  seaFriends: pexels(3661242, 900),
  plushBasket: pexels(7055945, 900),
  dinoWindow: pexels(3663060, 900),
  miniAnimals: pexels(1319572, 900),
  sorter: pexels(6693309, 900),
  maracas: pexels(9271755, 900),
  stackBoard: pexels(6692962, 900),
  numberBlocks: pexels(311268, 900),
  alphabet: pexels(1822568, 900),
  dinoTrio: pexels(3661194, 900),
  safari: pexels(3663061, 900),
  trucks: pexels(10831693, 900),
  cat: pexels(1340376, 900),
};

const NAME = L("لعبة توي", "Lo’ba Toys");

const header = lib("header-pill", {
  text: { "اسم متجرك": NAME, "المتجر": L("كل الألعاب", "All toys"), "العروض": L("الأكثر مبيعاً", "Best sellers"), "المدونة": L("عننا", "About") },
  links: { "/products": [SHOP, BEST], "/blog": "/about" },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("تذكير بأعياد الميلاد وألعاب جديدة", "Birthday reminders and new toys"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("بنبعتلك إيميل قبل كل عيد ميلاد بتسجله بأسبوع.", "We email you a week before each birthday you save."),
    "م": L("ل", "L"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ لعبة توي. كل الحقوق محفوظة.", "© 2026 Lo’ba Toys. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-ticket", {
    photo: [PHOTOS.dinoFloor, PHOTOS.xylophone, PHOTOS.blocksPillow],
    text: {
      "صورة الحملة": L("ديناصورات خشب ملوّنة على الأرض", "Colourful wooden dinosaurs on the floor"),
      "مجموعة الخريف": L("وصل جديد", "New in"),
      "ألوان هادئة لأيام أطول": L("ألعاب معمولة تتلعب سنين", "Toys made to be played with for years"),
      "تسوّق المجموعة": L("تسوق الجديد", "Shop new toys"),
      "عروض الأسبوع": L("بوكسات أعياد ميلاد بتغليف مجاني", "Birthday boxes, wrapped for free"),
      "هدايا مختارة": L("مكعبات لأول سنة", "Blocks for the first year"),
    },
    links: { "/products": [NEW, search("بوكس"), search("مكعبات")] },
  }),
  lib("categories-tiles", {
    photo: [PHOTOS.stackerGrey, PHOTOS.roundBlocks, PHOTOS.seaFriends, PHOTOS.plushBasket],
    text: {
      "تسوّق حسب القسم": L("تسوق حسب السن واللعب", "Shop by age and play"),
      "اختر القسم الذي يناسبك من كل ما نقدمه.": L("ألعاب خشب بألوان آمنة لكل سن.", "Wooden toys with safe paints for every age."),
      "وصل حديثًا": L("بيبي وصغيرين", "Baby & toddler"),
      "الأكثر مبيعًا": L("مكعبات وتركيب", "Blocks & building"),
      "العروض": L("لعب تمثيلي", "Pretend play"),
      "هدايا": L("هدايا", "Gifts"),
    },
    links: { "/products": [SHOP, search("بيبي"), search("مكعبات"), search("حيوانات"), search("هدية")] },
  }),
  lib("products-tabbed", {
    text: { "المتجر": L("الألعاب", "Toys"), "منتجاتنا": L("الأطفال بيحبوها", "Loved by kids"), "وصل جديد": L("جديد", "New"), "العروض": L("الأعلى تقييماً", "Top rated") },
    links: { "/products": [NEW, BEST, RATED] },
  }),
  lib("features-icon-cards", {
    text: {
      "لماذا تشتري منا": L("ليه الأهالي بيختارونا", "Why parents choose us"),
      "تسوّق وأنت مطمئن": L("آمنة وبسيطة وبتعيش", "Safe, simple, made to last"),
      "توصيل سريع": L("ألوان آمنة", "Non-toxic paint"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("ألوان مية متختبرة للأطفال.", "Water-based paints tested for children."),
      "الدفع عند الاستلام": L("تغليف هدية مجاني", "Free gift wrap"),
      "أو ادفع بالبطاقة والمحفظة": L("كل طلب ومعاه كارت.", "Every order, with a card."),
      "استرجاع سهل": L("من ٢ لـ ٤ أيام", "2 to 4 days"),
      "١٤ يومًا لتغيّر رأيك": L("توصيل لكل مصر.", "Delivered across Egypt."),
      "دعم على واتساب": L("استبدال سهل", "Easy exchange"),
      "أشخاص حقيقيون طوال الأسبوع": L("خلال ١٤ يوم لو مش مفتوحة.", "Within 14 days, unopened."),
    },
  }),
  lib("gallery-polaroids", {
    photo: [undefined, undefined, undefined, PHOTOS.dinoWindow, PHOTOS.miniAnimals, PHOTOS.sorter, PHOTOS.maracas, PHOTOS.stackBoard],
    text: {
      "عملاؤنا": L("وقت اللعب في بيوتكم", "Playtime at your homes"),
      "أرسل لنا صورتك": L("ابعتلنا صورة", "Send us a photo"),
      "مريم": L("ديناصورات لينا", "Lina’s dinosaurs"),
      "عمر": L("حديقة آدم", "Adam’s zoo"),
      "نور": L("لعبة عمر", "Omar’s sorter"),
      "يوسف": L("مزيكا سارة", "Sara’s maracas"),
      "سلمى": L("برج فريدة", "Farida’s tower"),
    },
  }),
  lib("faq-cards", {
    text: {
      "قبل أن تطلب": L("قبل ما تطلب", "Before you order"),
      "ما سياسة الاسترجاع؟": L("الألعاب آمنة لسن كام؟", "What age are the toys safe for?"),
      "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": L(
        "السن مكتوب على كل لعبة. ألعاب البيبي من غير قطع صغيرة، وكل الألوان مية ومتختبرة.",
        "The age is on every toy. Baby toys have no small parts, and all paints are water-based and tested.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن لعبة", "About Lo’ba"), L("محل ألعاب صغير في المعادي بدأه أب وأم.", "A small toy shop in Maadi started by two parents.")),
  aboutStory(lib, {
    photo: PHOTOS.safari,
    alt: L("زرافة وفيل وتمساح خشب", "A wooden giraffe, elephant and crocodile"),
    eyebrow: L("المعادي", "Maadi"),
    title: L("ألعاب بتعيش أطول من الطفولة", "Toys that outlast childhood"),
    text: L("بنختار ألعاب خشب بألوان مية آمنة، من غير بطاريات ولا شاشات.", "We pick wooden toys with safe water-based paints, no batteries and no screens."),
    more: L("وكل طلب بيوصل متغلف هدية ببلاش.", "And every order arrives gift wrapped for free."),
    button: L("تسوق الألعاب", "Shop toys"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ألعاب خشب بتعيش أطول من الطفولة.", "Wooden toys that last longer than childhood."),
  categories: [
    ["baby", "بيبي وصغيرين", "Baby & toddler", PHOTOS.stackerGrey],
    ["build", "مكعبات وتركيب", "Blocks & building", PHOTOS.roundBlocks],
    ["pretend", "لعب تمثيلي", "Pretend play", PHOTOS.trucks],
    ["gifts", "هدايا", "Gifts", PHOTOS.plushBasket],
  ],
  products: [
    ["number-blocks", "build", "مكعبات أرقام", "Number Blocks", PHOTOS.numberBlocks, 650, { isFeatured: true, rating: 4.9, sold90: 310 }],
    ["alphabet-blocks", "build", "مكعبات الحروف", "Alphabet Blocks", PHOTOS.alphabet, 590, { sold90: 120 }],
    ["dinosaur-trio", "pretend", "ثلاثي الديناصورات", "Dinosaur Trio", PHOTOS.dinoTrio, 560, { compareAtPrice: 650, sold90: 88 }],
    ["safari-friends", "pretend", "أصحاب السفاري", "Safari Friends", PHOTOS.safari, 420, { sold90: 66 }],
    ["sea-friends", "pretend", "أصحاب البحر", "Sea Friends", PHOTOS.seaFriends, 420, { sold90: 40 }],
    ["wooden-trucks", "pretend", "عربيات خشب", "Wooden Trucks", PHOTOS.trucks, 480, { rating: 4.8, sold90: 142 }],
    ["pastel-stacker", "baby", "برج حلقات", "Pastel Stacker", PHOTOS.stackerPeach, 260, { rating: 4.8, sold90: 198 }],
    ["rainbow-xylophone", "baby", "إكسيليفون قوس قزح", "Rainbow Xylophone", PHOTOS.xylophone, 390, { sold90: 74 }],
    ["first-birthday-box", "gifts", "بوكس أول عيد ميلاد", "First Birthday Box", PHOTOS.blocksPillow, 990, { compareAtPrice: 1150, isFeatured: true, sold90: 74 }],
    ["pull-along-cat", "baby", "قطة بعصاية", "Pull-along Cat", PHOTOS.cat, 220, { inStock: false, sold90: 30 }],
  ],
});

export const PLAYROOM = libraryTemplate({
  key: PLAYROOM_KEY,
  version: 3,
  changelog: "Playroom v3: product page",
  name: L("بلاي روم", "Playroom"),
  description: L(
    "ألعاب خشب: حملات، تسوق حسب السن، بوكس عيد الميلاد وصور اللعب. أربع صفحات جاهزة.",
    "Wooden toys: campaigns, shop by age, the birthday box and playtime photos. Four ready pages.",
  ),
  category: "kids",
  sortOrder: 280,
  palette: ["#fff8ec", "#ffe7c2", "#ff8a5c", "#24324a"],
  colors: {
    primary: "#e0532f",
    secondary: "#ffe7c2",
    background: "#fff8ec",
    foreground: "#24324a",
    muted: "#5a6478",
    border: "#f1dfc2",
    accent: "#ffd29e",
  },
  fonts: { heading: "Lemonada", body: "Tajawal" },
  radius: 22,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عننا", "About"), seo: { title: L("عن لعبة", "About Lo’ba") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("٣ شارع ٩، المعادي، القاهرة.", "3 Street 9, Maadi, Cairo."),
        heading: L("محتار في هدية؟", "Not sure which gift?"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الأمان والتغليف والتوصيل.", "Safety, gift wrap and delivery."),
        question: L("الألوان آمنة؟", "Are the paints safe?"),
        answer: L("كل الألوان مية ومتختبرة للأطفال، ومفيش قطع صغيرة في ألعاب البيبي.", "All paints are water-based and tested for children, and baby toys have no small parts."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "card", thumbs: "bottom", band: "brand", extras: ["product-shipping"], copy: { reviews: L("آراء الأهالي", "Parents say"), related: L("ألعاب تحبها كمان", "More toys to love") } },
});
