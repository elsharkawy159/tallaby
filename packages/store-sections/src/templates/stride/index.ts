/**
 * Stride (template 33, running and recovery; Claude Design "Storefront
 * Templates"): cool mint paper, a deep petrol for actions and a lime
 * highlight, Alexandria throughout and round 20px corners. A runners' shop:
 * an offer ticker, ticket slides, aisles, the shelf, what comes with every
 * order, twin offers and WhatsApp reviews. Built from section library
 * designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): trainers and a bottle
 * on grass, mats, bands, ropes, a watch and earbuds. No people and no
 * brand marks.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const STRIDE_KEY = "stride";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(STRIDE_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  trainers: pexels(7880188),
  trainersSmall: pexels(7880188, 900),
  colourMats: pexels(40074772, 900),
  rolledMats: pexels(4325439, 900),
  buds: pexels(8858287, 900),
  watch: pexels(13007642, 900),
  rope: pexels(8032842, 900),
  ropes: pexels(6339719, 900),
  ropesWide: pexels(6339721),
  matDumbbells: pexels(5412251, 900),
  bands: pexels(16695681, 900),
  powerBank: pexels(3921704, 900),
};

const NAME = L("خطوة", "Khatwa");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("توصيل مجاني فوق ١٢٠٠ ج.م لكل المحافظات", "Free delivery over EGP 1,200 nationwide"),
    "الكود: SAVE10": L("الكود: STRIDE10", "Code: STRIDE10"),
    "م": L("خ", "K"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
  },
  links: { "/products": [SHOP, BEST, SHOP, SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("خطة الجري الأسبوعية", "The weekly run plan"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("خطة تمرين قصيرة وعرض واحد، كل خميس.", "A short training plan and one offer, every Thursday."),
    "م": L("خ", "K"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ خطوة. كل الحقوق محفوظة.", "© 2026 Khatwa. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("promo-ticker", {
    text: {
      "الكود: SAVE10": L("الكود: STRIDE10", "Code: STRIDE10"),
      "توصيل مجاني فوق ١٥٠٠ ج.م": L("توصيل مجاني فوق ١٢٠٠ ج.م", "Free delivery over EGP 1,200"),
      "خصم ١٥٪ على المجموعات": L("خصم ١٥٪ على باقات الريكفري", "15% off recovery bundles"),
      "استرجاع خلال ١٤ يومًا": L("استبدال المقاس مجاناً", "Free size swaps"),
    },
  }),
  lib("hero-ticket", {
    photo: [PHOTOS.trainers, PHOTOS.colourMats, PHOTOS.buds],
    text: {
      "صورة الحملة": L("كوتشي جري وزمزمية على النجيلة", "Running shoes and a bottle on grass"),
      "مجموعة الخريف": L("موسم الجري", "Running season"),
      "ألوان هادئة لأيام أطول": L("خطوة خفيفة لكل كيلو", "A lighter step for every kilometre"),
      "تسوّق المجموعة": L("تسوق الجري", "Shop running"),
      "عروض الأسبوع": L("ريكفري ومات", "Recovery & mats"),
      "هدايا مختارة": L("سماعات وساعات", "Audio & watches"),
    },
    links: { "/products": [search("جري"), search("مات"), search("سماعة")] },
  }),
  lib("categories-bento", {
    photo: [PHOTOS.trainersSmall, PHOTOS.colourMats, PHOTOS.watch, PHOTOS.buds, PHOTOS.rope],
    text: {
      "أقسامنا": L("تسوق حسب التمرين", "Shop by session"),
      "الأكثر مبيعًا": L("الجري", "Running"),
      "الأكثر طلبًا": L("الأكثر طلباً", "Most wanted"),
      "العروض": L("يوجا وريكفري", "Yoga & recovery"),
      "هدايا": L("ساعات", "Watches"),
      "إكسسوارات": L("سماعات", "Audio"),
      "أساسيات": L("أساسيات", "Essentials"),
    },
    links: { "/products": [SHOP, search("جري"), search("مات"), search("ساعة"), search("سماعة"), search("حبل")] },
  }),
  lib("products-shelf", {
    text: { "تسوّق حسب مزاجك": L("الرف", "The shelf"), "وصل جديد": L("جديد", "New"), "عليه خصم": L("الأعلى تقييماً", "Top rated") },
    links: { "/products": [NEW, BEST, RATED, SHOP] },
  }),
  lib("about-list", {
    photo: [undefined, undefined, undefined, undefined, undefined, PHOTOS.ropes],
    text: {
      "صورة المتجر": L("حبال ودمبل على أرضية الجيم", "Ropes and dumbbells on a gym floor"),
      "مع كل طلب": L("مع كل طلب", "With every order"),
      "كل منتج بيتراجع قبل ما يوصلك": L("بنجرب كل حاجة على التراك الأول", "We test everything on the track first"),
      "فاتورة رسمية وضمان": L("استبدال المقاس مجاناً خلال ١٤ يوم", "Free size swaps within 14 days"),
      "تغليف محمي من الصدمات": L("خطة جري ٤ أسابيع ببلاش", "A free four-week run plan"),
      "رقم تتبع على واتساب": L("رقم تتبع على واتساب", "Tracking number on WhatsApp"),
      "اعرف أكتر": L("اعرف أكتر", "Learn more"),
    },
  }),
  lib("promo-twin", {
    photo: [undefined, undefined, PHOTOS.matDumbbells, PHOTOS.bands],
    text: {
      "لحد ٣٠٪": L("لحد ٢٥٪", "Up to 25%"),
      "تخفيضات الموسم": L("أساسيات تمرين البيت", "Home training basics"),
      "باقة": L("باقة", "Bundle"),
      "اشتري ٢ والتالت هدية": L("حبال المقاومة: ٢ والتالت هدية", "Resistance bands: buy 2, get the third free"),
    },
    links: { "/products": [search("مات"), search("حبال")] },
  }),
  lib("testimonials-chat", {
    text: {
      "رسايل بتفرّحنا": L("رسايل من العدّائين", "Notes from runners"),
      "مريم أ.": L("نادين ف.", "Nadine F."),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "خلصت أول ١٠ كيلو بالخطة اللي بعتوها. شكراً بجد!",
        "Finished my first 10 km with the plan you sent. Thank you!",
      ),
      "ده يسعدنا جدًا، شكرًا ليكي!": L("مبروك! جاهزة للـ ٢١؟", "Congrats! Ready for 21?"),
      "عمر ك.": L("يوسف ط.", "Youssef T."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("بدّلت المقاس في يومين ومن غير ولا جنيه.", "Swapped the size in two days at no cost."),
      "يوسف م.": L("هبة س.", "Heba S."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("المات تقيل ومش بيتحرك، والزمزمية بتحافظ على البرودة.", "The mat is heavy and stays put, and the bottle keeps water cold."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن خطوة", "About Khatwa"), L("محل جري صغير بدأ من نادي جري في الشيخ زايد.", "A small running shop that started from a run club in Sheikh Zayed.")),
  aboutStory(lib, {
    photo: PHOTOS.ropesWide,
    alt: L("حبال تمرين ودمبل", "Training ropes and dumbbells"),
    eyebrow: L("الشيخ زايد", "Sheikh Zayed"),
    title: L("من نادي جري لمحل", "From a run club to a shop"),
    text: L("كنا بنجري كل جمعة الصبح، وبقينا نجيب الأدوات لبعض. دلوقتي بنجيبها لكل مصر.", "We ran every Friday morning and started sourcing gear for each other. Now we ship it across Egypt."),
    more: L("وكل طلب معاه خطة جري ٤ أسابيع.", "And every order comes with a four-week run plan."),
    button: L("تسوق الجري", "Shop running"),
    href: search("جري"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أدوات جري وريكفري لكل خطوة.", "Running and recovery gear for every step."),
  categories: [
    ["running", "الجري", "Running", PHOTOS.trainersSmall],
    ["recovery", "يوجا وريكفري", "Yoga & recovery", PHOTOS.colourMats],
    ["tech", "ساعات وسماعات", "Watches & audio", PHOTOS.watch],
  ],
  products: [
    ["daily-trainer", "running", "كوتشي جري يومي", "Daily Run Trainer", PHOTOS.trainersSmall, 2350, { isFeatured: true, rating: 4.8, sold90: 260 }],
    ["run-kit-bottle", "running", "زمزمية جري معزولة", "Insulated Run Bottle", PHOTOS.rope, 390, { sold90: 140 }],
    ["speed-rope", "running", "حبل نط سرعة", "Speed Jump Rope", PHOTOS.ropes, 280, { compareAtPrice: 340, sold90: 96 }],
    ["colour-yoga-mat", "recovery", "مات يوجا ملوّن", "Colour Yoga Mat", PHOTOS.colourMats, 650, { rating: 4.7, sold90: 188 }],
    ["thick-recovery-mat", "recovery", "مات ريكفري سميك", "Thick Recovery Mat", PHOTOS.rolledMats, 790, { sold90: 70 }],
    ["band-trio", "recovery", "طقم ٣ حبال مقاومة", "Resistance Band Trio", PHOTOS.bands, 450, { isFeatured: true, sold90: 152 }],
    ["mat-and-weights", "recovery", "مات ودمبل خفيف", "Mat & Light Weights", PHOTOS.matDumbbells, 1150, { compareAtPrice: 1350, sold90: 48 }],
    ["gps-run-watch", "tech", "ساعة جري GPS", "GPS Run Watch", PHOTOS.watch, 3450, { rating: 4.6, sold90: 64 }],
    ["sport-buds", "tech", "سماعة رياضية لاسلكية", "Wireless Sport Buds", PHOTOS.buds, 1290, { sold90: 110 }],
    ["pocket-power-bank", "tech", "باور بانك صغير", "Pocket Power Bank", PHOTOS.powerBank, 690, { inStock: false, sold90: 35 }],
  ],
});

export const STRIDE = libraryTemplate({
  key: STRIDE_KEY,
  version: 2,
  name: L("سترايد", "Stride"),
  description: L(
    "جري وريكفري: شريط عروض، شرائح تذاكر، أقسام بنتو ورسايل العملاء. أربع صفحات جاهزة.",
    "Running and recovery: an offer ticker, ticket slides, bento aisles and customer messages. Four ready pages.",
  ),
  category: "sports",
  sortOrder: 330,
  palette: ["#f6f8f6", "#e3ece8", "#c8f26b", "#14303b"],
  colors: {
    primary: "#14303b",
    secondary: "#e3ece8",
    background: "#f6f8f6",
    foreground: "#14303b",
    muted: "#4f656d",
    border: "#d6e1dc",
    accent: "#c8f26b",
  },
  fonts: { heading: "Alexandria", body: "Alexandria" },
  radius: 20,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن خطوة", "About"), seo: { title: L("عن خطوة", "About Khatwa") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("مول أركان، الشيخ زايد.", "Arkan Mall, Sheikh Zayed."),
        heading: L("اسأل عن مقاسك أو خطتك", "Ask about your size or your plan"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والاستبدال والتوصيل.", "Sizes, swaps and delivery."),
        question: L("لو المقاس طلع مش مظبوط؟", "What if the size is wrong?"),
        answer: L("ابعتلنا على واتساب خلال ١٤ يوم وهنبدّله ببلاش.", "Message us on WhatsApp within 14 days and we swap it for free."),
      }),
    },
  ],
  demo: DEMO,
});
