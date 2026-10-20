/**
 * Sabon (template 63, handmade soap and bath; Claude Design "Storefront
 * Templates"): cream paper, an olive green for actions and a honey yellow
 * highlight, Noto Naskh Arabic headings over Almarai and 14px corners. An
 * Alexandria soap workshop: six weeks of curing, four bars for the price of
 * three, shop by use, from oil to bar, the free delivery goal and the
 * regulars. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): handmade soap bars in
 * stacks and rows, olive oil with olives, bath salts and soap on a wooden
 * stool. No people, no hands and no brand labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const SABON_KEY = "sabon";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SABON_KEY, getDesign(id)!, { corners: 14, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  oliveBar: pexels(6690197, 900),
  laurelBar: pexels(6690839, 900),
  goatMilk: pexels(10155373, 900),
  roseBar: pexels(9475427, 900),
  coffeeStack: pexels(6621471, 900),
  fourBars: pexels(6621322, 900),
  roseSalts: pexels(20862412, 900),
  seaSalt: pexels(6690851, 900),
  giftRow: pexels(6621467, 900),
  faceBars: pexels(3940337, 900),
  bodyRow: pexels(7173554, 900),
  cureStack: pexels(6621497, 1200),
  oliveOil: pexels(16486887, 900),
  cutBars: pexels(5420572, 900),
  honeyBars: pexels(16244099),
  bathStool: pexels(6810863, 900),
};

const NAME = L("صابون بلدي", "Sabon Beladi");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("٤ قطع بسعر ٣ · توصيل مجاني فوق ٤٠٠ ج.م", "Buy 4 bars, pay for 3 · Free delivery over EGP 400"),
    "الكود: SAVE10": L("الكود: SABON4", "Code: SABON4"),
    "م": L("ص", "S"),
    "اسم متجرك": NAME,
    "المتجر": L("الصابون", "Soap"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("الورشة", "Our workshop"),
  },
  links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("اعرف الدفعة الجاية", "Hear about the next batch"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("بنقطّع دفعة جديدة كل أسبوعين، وبنبعتلك قبلها.", "We cut a new batch every two weeks and tell you first."),
    "م": L("ص", "S"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ صابون بلدي. كل الحقوق محفوظة.", "© 2026 Sabon Beladi. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("about-inset", {
    photo: [undefined, undefined, undefined, undefined, undefined, undefined, undefined, PHOTOS.cureStack],
    text: {
      "إزاي بنشتغل": L("شغل إيد", "Handmade"),
      "كل منتج بيتراجع قبل ما يوصلك": L("٦ أسابيع على الرف قبل ما يوصلك", "Six weeks on the shelf before it reaches you"),
      "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف.": L(
        "صابون زيت زيتون وغار ولبن معيز، متقطع باليد في إسكندرية.",
        "Olive oil, laurel and goat milk soap, cut by hand in Alexandria.",
      ),
      "اعرف أكتر": L("تسوق الصابون", "Shop soap"),
      "صورة المتجر": L("قوالب صابون فوق بعض", "A stack of soap bars"),
    },
    links: { "/about": SHOP },
  }),
  lib("bundle-quantity", {
    text: {
      "وفّر مع الكمية": L("كل ما تزود توفّر", "Buy more, save more"),
      "على القطعة التانية": L("على القطعة التانية", "On the second bar"),
      "٣ قطع": L("٤ قطع", "4 bars"),
      "على الطلب كله": L("يعني ٤ بسعر ٣", "That is 4 for the price of 3"),
      "وفّر ١٨٪": L("وفّر ٢٥٪", "Save 25%"),
      "قطعة واحدة": L("قطعة واحدة", "1 bar"),
      "قطعتين": L("قطعتين", "2 bars"),
      "اختار عدد القطع من السلة.": L("اختار عدد القطع من السلة، والخصم بالكود SABON4.", "Choose how many in your cart; the saving comes with code SABON4."),
    },
    lists: [{ source: "best-sellers" }],
  }),
  lib("categories-tiles", {
    photo: [PHOTOS.faceBars, PHOTOS.bodyRow, PHOTOS.seaSalt, PHOTOS.giftRow],
    text: {
      "تسوّق حسب القسم": L("تسوق حسب الاستخدام", "Shop by use"),
      "اختر القسم الذي يناسبك من كل ما نقدمه.": L("صابون للوش، للجسم، للحمّام، وللهدايا.", "Soap for the face, the body, the bath and for gifts."),
      "كل الأقسام": L("كل الصابون", "All soap"),
      "وصل حديثًا": L("للوش", "Face"),
      "الأكثر مبيعًا": L("للجسم", "Body"),
      "العروض": L("للحمّام", "Bath"),
      "هدايا": L("هدايا", "Gifts"),
    },
    links: { "/products": [SHOP, search("وش"), search("جسم"), search("ملح"), search("هدية")] },
  }),
  lib("about-stories", {
    photo: [undefined, PHOTOS.oliveOil, PHOTOS.cutBars, PHOTOS.coffeeStack],
    text: {
      "إزاي بنشتغل": L("بيتعمل إزاي", "How it is made"),
      "من المخزن لإيدك": L("من الزيت للقالب", "From oil to bar"),
      "بنختار": L("عصر", "Press"),
      "من موردين معتمدين بس.": L("زيت زيتون معصور على البارد من سيوة.", "Cold-pressed olive oil from Siwa."),
      "بنراجع": L("صب وتقطيع", "Pour and cut"),
      "كل منتج قبل ما يتغلّف.": L("بيتصب في قوالب خشب ويتقطع باليد.", "Poured into wooden moulds, cut by hand."),
      "بنوصّل": L("تخزين", "Cure"),
      "لحد باب البيت خلال أيام.": L("٦ أسابيع على رفوف مفتوحة.", "Six weeks on open shelves."),
    },
  }),
  lib("cart-free-delivery", {
    text: {
      "١٥٠٠ ج.م": L("٤٠٠ ج.م", "EGP 400"),
      "والتوصيل عليك مجاني": L("والتوصيل علينا", "and delivery is on us"),
      "كمّل تسوق": L("كمّل تسوق", "Keep shopping"),
    },
  }),
  lib("testimonials-ruled", {
    text: {
      "آراء العملاء": L("الآراء", "Reviews"),
      "قالوا عننا": L("زباينّا", "Our regulars"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "صابون الغار ريّح فروة راسي من أول أسبوع، وريحته نضيفة من غير عطر.",
        "The laurel soap calmed my scalp in the first week, and it smells clean without perfume.",
      ),
      "م": L("ه", "H"),
      "مريم أ.": L("هالة س.", "Hala S."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("القالب بيعيش معايا أكتر من شهر لأنه متخزن كويس.", "A bar lasts me more than a month because it is cured properly."),
      "ع": L("ط", "T"),
      "عمر ك.": L("طارق ف.", "Tarek F."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("بشتري ٤ بسعر ٣ كل شهر للبيت كله.", "I buy four for three every month for the whole house."),
      "ن": L("د", "D"),
      "نور ح.": L("دينا ح.", "Dina H."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("الورشة", "Our workshop"), L("ورشة صابون صغيرة في إسكندرية.", "A small soap workshop in Alexandria.")),
  aboutStory(lib, {
    photo: PHOTOS.honeyBars,
    alt: L("قوالب صابون جنب طبق عسل", "Soap bars beside a bowl of honey"),
    eyebrow: L("إسكندرية", "Alexandria"),
    title: L("صابون زي صابون زمان", "Soap the way it used to be"),
    text: L("بنعمل الصابون على البارد بزيت زيتون حقيقي، من غير دهون حيوانية ولا ألوان صناعية.", "We make cold-process soap with real olive oil, no animal fat and no artificial colour."),
    more: L("وكل قالب بيقعد ٦ أسابيع على الرف عشان يبقى ناشف وبيعيش.", "And every bar cures six weeks on the shelf so it is hard and lasts."),
    button: L("تسوق الصابون", "Shop soap"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("صابون متقطع باليد ومتخزن ٦ أسابيع.", "Soap cut by hand, cured for six weeks."),
  categories: [
    ["face", "للوش", "Face", PHOTOS.faceBars],
    ["body", "للجسم", "Body", PHOTOS.bodyRow],
    ["bath", "للحمّام", "Bath", PHOTOS.bathStool],
    ["gifts", "هدايا", "Gifts", PHOTOS.giftRow],
  ],
  products: [
    ["olive-oil-soap", "body", "صابون زيت زيتون", "Olive Oil Soap", PHOTOS.oliveBar, 90, { isFeatured: true, rating: 4.9, sold90: 320 }],
    ["laurel-soap", "body", "صابون غار", "Laurel Soap", PHOTOS.laurelBar, 110, { rating: 4.8, sold90: 210 }],
    ["goat-milk-soap", "face", "صابون لبن معيز", "Goat Milk Soap", PHOTOS.goatMilk, 120, { rating: 4.8, sold90: 164 }],
    ["rose-clay-soap", "face", "صابون ورد وطين", "Rose Clay Soap", PHOTOS.roseBar, 120, { sold90: 96 }],
    ["coffee-scrub-bar", "body", "صابون قهوة مقشّر", "Coffee Scrub Bar", PHOTOS.coffeeStack, 100, { compareAtPrice: 120, sold90: 88 }],
    ["four-bar-pack", "gifts", "باكيدج ٤ قطع", "Four-Bar Pack", PHOTOS.fourBars, 330, { compareAtPrice: 440, isFeatured: true, sold90: 74 }],
    ["rose-bath-salts", "bath", "ملح حمّام بالورد", "Rose Bath Salts", PHOTOS.roseSalts, 180, { sold90: 52 }],
    ["siwa-sea-salt", "bath", "ملح سيوة للحمّام", "Siwa Bath Salt", PHOTOS.seaSalt, 150, { sold90: 40 }],
    ["seven-bar-gift-box", "gifts", "بوكس هدية ٧ قطع", "Seven-Bar Gift Box", PHOTOS.giftRow, 620, { rating: 4.9, sold90: 36 }],
  ],
});

export const SABON = libraryTemplate({
  key: SABON_KEY,
  version: 1,
  name: L("صابون", "Sabon"),
  description: L(
    "صابون يدوي ومستلزمات حمام: ٤ قطع بسعر ٣، تسوق حسب الاستخدام، من الزيت للقالب وهدف التوصيل المجاني. أربع صفحات جاهزة.",
    "Handmade soap and bath: four bars for three, shop by use, from oil to bar and a free delivery goal. Four ready pages.",
  ),
  category: "beauty",
  sortOrder: 630,
  palette: ["#fbf8f1", "#f0e9d8", "#f2d16b", "#6b7d2a"],
  colors: {
    primary: "#6b7d2a",
    secondary: "#f0e9d8",
    background: "#fbf8f1",
    foreground: "#2b2a20",
    muted: "#625e4e",
    border: "#e3d9c2",
    accent: "#f2d16b",
  },
  fonts: { heading: "Noto Naskh Arabic", body: "Almarai" },
  radius: 14,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("الورشة", "About"), seo: { title: L("الورشة", "Our workshop") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("الورشة في محرم بك، إسكندرية.", "The workshop is in Moharram Bek, Alexandria."),
        heading: L("اسأل عن صابون لبشرتك", "Ask which soap suits your skin"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الصابون والعروض والتوصيل.", "Soap, offers and delivery."),
        question: L("عرض ٤ بسعر ٣ بيشتغل إزاي؟", "How does buy 4, pay for 3 work?"),
        answer: L("حط ٤ قطع أو أكتر في السلة واكتب الكود SABON4، والقطعة الأرخص بتبقى ببلاش.", "Put four or more bars in your cart and enter code SABON4; the cheapest bar is free."),
      }),
    },
  ],
  demo: DEMO,
});
