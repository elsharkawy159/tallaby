/**
 * Zay (template 50, men’s essentials; Claude Design "Storefront Templates"):
 * cool grey paper, near-black ink, a navy for actions and a periwinkle
 * highlight, Readex Pro throughout and sharp 4px corners. A basics shop
 * (v3): the weekday kit as a three-photo collage, the categories in big
 * type, this week’s shelf, why Zay, the reorders and WhatsApp reviews. Built
 * from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): tees and shirts on rails
 * and hangers, folded knits, a suit jacket on a wall hook, a shirt shelf and
 * a leather work bag. No people, no hands, no mannequins and no logos (the
 * design's photos of models were all replaced).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const ZAY_KEY = "zay";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ZAY_KEY, getDesign(id)!, { corners: 4, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  teeRail: pexels(39277919, 900),
  threeTees: pexels(18199559, 900),
  foldedKnits: pexels(30569741, 900),
  beanie: pexels(30263573, 900),
  workBag: pexels(10919291, 900),
  overshirt: pexels(5424909, 900),
  plaidRail: pexels(39176732, 900),
  poplinRail: pexels(7755387, 900),
  suitJacket: pexels(37524688, 900),
  dressShirt: pexels(1682699, 900),
  shirtShelf: pexels(29765480),
};

const NAME = L("زي مِن", "Zay Men");

const header = lib("header-chips", {
  text: {
    "م": L("ز", "Z"),
    "اسم متجرك": NAME,
    "ابحث عن منتج…": L("ابحث عن تيشيرت، قميص، تريكو…", "Search tees, shirts, knitwear…"),
  },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("البس ببساطة", "Dress simple"),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن زي", "About Zay"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ زي مِن. كل الحقوق محفوظة.", "© 2026 Zay Men. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-collage", {
    photo: [pexels(18199559, 1200), PHOTOS.foldedKnits, pexels(5424909, 1400)],
    text: {
      "حكاية الموسم": L("طقم الأسبوع", "The weekday kit"),
      "٣ قطع تكفي أسبوعًا كاملًا": L("٣ قطع تكفي أسبوعك", "Three pieces, your whole week"),
      "نسّقها معًا أو مع ما تملكه بالفعل، وكل قطعة متاحة بأكثر من لون.": L(
        "قطن مصري تقيل وقصّات مظبوطة، كل قطعة بتتلبس مع التانية.",
        "Heavy Egyptian cotton and fits that work: every piece goes with the others.",
      ),
      "تسوّق اللوك": L("تسوق الأساسيات", "Shop the basics"),
      "القطعة الأولى": L("تيشيرت تقيل", "Heavy tee"),
      "القطعة الثانية": L("تريكو", "Knitwear"),
      "القطعة الثالثة": L("أوفرشيرت", "Overshirt"),
    },
    links: { "/products": NEW },
  }),
  lib("categories-big-type"),
  lib("products-shelf", {
    text: {
      "تسوّق حسب مزاجك": L("الأسبوع ده", "This week"),
      "عليه خصم": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [NEW, BEST, RATED, SHOP] },
  }),
  lib("features-compare", {
    text: {
      "إحنا ولا غيرنا؟": L("ليه زي؟", "Why Zay?"),
      "متجرنا": L("زي", "Zay"),
      "منتجات أصلية بفاتورة": L("قطن مصري ٢٤٠ جرام", "Egyptian cotton, 240 g"),
      "ضمان محلي": L("تبديل مقاس ببلاش", "Free size exchange"),
      "استرجاع خلال ١٤ يوم": L("٣ قصّات في كل مقاس", "Three fits in every size"),
    },
  }),
  lib("products-carousel", {
    text: { "الأكثر مبيعاً": L("بيرجعوا يطلبوه", "The ones they reorder") },
    links: { "/products": BEST },
  }),
  lib("testimonials-chat", {
    text: {
      "من الواتساب": L("الآراء", "Reviews"),
      "رسايل بتفرّحنا": L("من واتساب", "From WhatsApp"),
      "مريم أ.": L("أحمد س.", "Ahmed S."),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "التيشيرت التقيل ده أحسن حاجة اشتريتها السنة دي. اتغسل عشر مرات ولسه زي ما هو.",
        "This heavy tee is the best thing I bought this year. Ten washes and it still holds its shape.",
      ),
      "ده يسعدنا جدًا، شكرًا ليكي!": L("ده يسعدنا جداً، شكراً يا أحمد!", "So happy to hear that, thanks Ahmed!"),
      "عمر ك.": L("مصطفى ع.", "Mostafa A."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "طلبت الفيت السليم وطلع ضيق، بدّلته بالريجيولار ببلاش في يومين.",
        "Ordered the slim fit and it was tight; swapped it for regular for free in two days.",
      ),
      "يوسف م.": L("كريم ن.", "Karim N."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("خدت طقم الشغل كله، والأوفرشيرت شكله غالي جداً.", "Took the whole weekday kit; the overshirt looks expensive."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن زي", "About Zay"), L("زي مِن أساسيات رجالي مظبوطة، بـ٣ قصّات.", "Zay Men makes men’s basics that fit, in three cuts.")),
  aboutStory(lib, {
    photo: PHOTOS.shirtShelf,
    alt: L("قمصان متطبقة على رفوف خشب", "Folded shirts on wooden shelves"),
    eyebrow: L("من ٢٠٢١", "Since 2021"),
    title: L("أساسيات، بس مظبوطة", "Basics, done properly"),
    text: L("كل قطعة بـ٣ قصّات: سليم وريجيولار وواسع، عشان تلاقي مقاسك من أول مرة.", "Every piece comes in three fits, slim, regular and relaxed, so you find your size first time."),
    more: L("قطن مصري ٢٤٠ جرام، متقصوص ومتخيط في المحلة.", "240 g Egyptian cotton, cut and sewn in El Mahalla."),
    button: L("تسوق الأساسيات", "Shop the basics"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أساسيات مظبوطة، بـ٣ قصّات.", "Basics that fit, in three cuts."),
  categories: [
    ["tees", "تيشيرتات", "Tees", PHOTOS.threeTees],
    ["shirts", "قمصان وأوفرشيرت", "Shirts & overshirts", PHOTOS.plaidRail],
    ["knit", "تريكو", "Knitwear", PHOTOS.foldedKnits],
    ["bags", "شنط", "Bags", PHOTOS.workBag],
  ],
  products: [
    ["heavy-cotton-tee", "tees", "تيشيرت قطن تقيل", "Heavy Cotton Tee", PHOTOS.teeRail, 450, { isFeatured: true, rating: 4.8, sold90: 320 }],
    ["merino-crew-knit", "knit", "بلوفر ميرينو", "Merino Crew Knit", PHOTOS.foldedKnits, 990, { sold90: 44 }],
    ["leather-work-bag", "bags", "شنطة شغل جلد", "Leather Work Bag", PHOTOS.workBag, 2100, { rating: 4.8, sold90: 62 }],
    ["tee-three-pack", "tees", "٣ تيشيرتات", "Tee Three-Pack", PHOTOS.threeTees, 1150, { compareAtPrice: 1350, sold90: 88 }],
    ["sand-overshirt", "shirts", "أوفرشيرت رملي", "Sand Overshirt", PHOTOS.overshirt, 1990, { rating: 4.7, sold90: 110 }],
    ["plaid-flannel-shirt", "shirts", "قميص فلانيل كاروهات", "Plaid Flannel Shirt", PHOTOS.plaidRail, 1290, { sold90: 52 }],
    ["poplin-shirt", "shirts", "قميص بوبلين", "Poplin Shirt", PHOTOS.poplinRail, 990, { sold90: 70 }],
    ["unlined-suit-jacket", "shirts", "جاكت بدلة من غير بطانة", "Unlined Suit Jacket", PHOTOS.suitJacket, 2900, { sold90: 21 }],
    ["salmon-dress-shirt", "shirts", "قميص سلمون", "Salmon Dress Shirt", PHOTOS.dressShirt, 1150, { compareAtPrice: 1350, sold90: 30 }],
    ["rib-beanie", "knit", "طاقية تريكو مقلّمة", "Striped Rib Beanie", PHOTOS.beanie, 350, { inStock: false, sold90: 18 }],
  ],
});

export const ZAY = libraryTemplate({
  key: ZAY_KEY,
  version: 3,
  changelog: "Zay v3: new hero, categories, section order",
  productPage: { thumbs: "side", band: "brand", extras: ["product-perks"], copy: { back: L("كل الأساسيات", "All the basics"), reviews: L("اللي جرّبوه على واتساب", "Tried and reviewed on WhatsApp"), related: L("كمّل أسبوعك", "Complete your week") } },
  name: L("زي", "Zay"),
  description: L(
    "أساسيات رجالي: طقم الأسبوع، الأقسام، رف الأسبوع، المقارنة، اللي بيرجعوا يطلبوه وآراء واتساب. أربع صفحات جاهزة.",
    "Men’s essentials: the weekday kit, categories, this week’s shelf, a comparison, the reorders and WhatsApp reviews. Four ready pages.",
  ),
  category: "fashion",
  sortOrder: 500,
  palette: ["#f3f4f6", "#e5e7eb", "#c7d2fe", "#1f3a5f"],
  colors: {
    primary: "#1f3a5f",
    secondary: "#e5e7eb",
    background: "#f3f4f6",
    foreground: "#111827",
    muted: "#4b5563",
    border: "#d1d5db",
    accent: "#c7d2fe",
  },
  fonts: { heading: "Readex Pro", body: "Readex Pro" },
  radius: 4,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن زي", "About"), seo: { title: L("عن زي", "About Zay") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("كل يوم من ١٢ الضهر لـ ١٠ بالليل، على الإيميل أو واتساب.", "Every day, 12 pm to 10 pm, by email or WhatsApp."),
        heading: L("اسأل عن مقاس أو قصّة", "Ask about a size or fit"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("القصّات والمقاسات والتوصيل.", "Fits, sizes and delivery."),
        question: L("أختار أنهي قصّة؟", "Which fit should I pick?"),
        answer: L("السليم على الجسم، والريجيولار مريح، والواسع أوفر سايز. جدول المقاسات في صفحة كل منتج.", "Slim sits close, regular is easy and relaxed is oversized. Each product page has the size chart."),
      }),
    },
  ],
  demo: DEMO,
});
