/**
 * Sage, formerly Botanica (template 12, natural hair and body care; Claude Design
 * "Storefront Templates"): cream paper, a deep olive for actions and a
 * honey highlight, Noto Naskh Arabic headings over IBM Plex Sans Arabic and
 * soft 24px corners. A farm-to-bottle store: the farm panel, the promise,
 * seed to bottle, a refill offer, product reviews, the year in numbers and
 * the founder's letter. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): rosemary, amber oil
 * bottles, handmade soaps and rose water. No people, hands or brand labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const BOTANICA_KEY = "botanica";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(BOTANICA_KEY, getDesign(id)!, { corners: 24, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  rosemaryPots: pexels(17679558),
  rosemaryField: pexels(17677894, 900),
  rosemaryTin: pexels(135168, 900),
  amberBottles: pexels(6694145, 900),
  oilRow: pexels(5682924, 900),
  oilsDisplay: pexels(6693946, 900),
  dropper: pexels(10819538, 900),
  eucalyptusOil: pexels(4857813, 900),
  soapRow: pexels(6621470, 900),
  soapMix: pexels(6930879, 900),
  soapStack: pexels(3735152, 900),
  roseWater: pexels(18331626, 900),
};

const NAME = L("نايل بوتانكس", "Nile Botanics");

const header = lib("header-line", {
  text: {
    "م": L("ن", "N"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("مزرعتنا", "Our farm"),
  },
  links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك وخد العروض قبل أي حد.": L("رسالة كل شهر من المزرعة، وأول فرصة للزيوت الجديدة.", "A monthly letter from the farm, and first access to new oils."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ نايل بوتانكس. كل الحقوق محفوظة.", "© 2026 Nile Botanics. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("مزرعتنا", "Our farm"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("about-inset", {
    photo: [undefined, undefined, undefined, undefined, undefined, undefined, undefined, PHOTOS.rosemaryPots],
    text: {
      "إزاي بنشتغل": L("من مزرعتنا", "From our farm"),
      "كل منتج بيتراجع قبل ما يوصلك": L("زيوت بتتعصر في نفس أسبوع الشحن", "Oils pressed the week they ship"),
      "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف.": L(
        "روزماري وسمسم وتين شوكي من مزارعنا في الفيوم، معصورين على البارد بكميات صغيرة.",
        "Rosemary, sesame and prickly pear from our partner farms in Fayoum, pressed cold in small batches.",
      ),
      "اعرف أكتر": L("تسوق زيوت الشعر", "Shop hair oils"),
      "صورة المتجر": L("أصص روزماري على رف خشب", "Rosemary pots on a wooden stand"),
    },
    links: { "/about": SHOP },
  }),
  lib("features-bento", {
    text: {
      "وعدنا ليك": L("وعدنا", "Our promise"),
      "نشتري لك كأننا بنشتري لنفسنا": L("بس اللي بشرتك تفهمه", "Only what your skin can read"),
      "اعرف أكتر": L("اقرا المكونات", "Read the ingredients"),
      "توصيل سريع": L("من غير حشو", "No fillers"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("كل إزازة فيها ٥ مكونات أو أقل.", "Every bottle lists five ingredients or fewer."),
      "الدفع عند الاستلام": L("عبوات ريفيل", "Refill pouches"),
      "أو ادفع بالبطاقة والمحفظة": L("رجّع الإزازة ووفّر ٢٠٪.", "Send the bottle back, save 20%."),
      "استرجاع سهل": L("من المزرعة للباب", "Farm to door"),
      "١٤ يومًا لتغيّر رأيك": L("بيتعصر ويتشحن في نفس الأسبوع.", "Pressed and shipped the same week."),
    },
  }),
  lib("about-stories", {
    photo: [undefined, PHOTOS.rosemaryField, PHOTOS.amberBottles, PHOTOS.soapRow],
    text: {
      "إزاي بنشتغل": L("بيتعمل إزاي", "How it is made"),
      "من المخزن لإيدك": L("من البذرة للإزازة", "From seed to bottle"),
      "بنختار": L("بنزرع", "We grow"),
      "من موردين معتمدين بس.": L("روزماري وسمسم في مزرعتين في الفيوم.", "Rosemary and sesame on two farms in Fayoum."),
      "بنراجع": L("بنعصر", "We press"),
      "كل منتج قبل ما يتغلّف.": L("عصر على البارد تحت ٤٠ درجة عشان الفيتامينات.", "Cold-pressed below 40°C to keep the nutrients."),
      "بنوصّل": L("بنعبّي", "We bottle"),
      "لحد باب البيت خلال أيام.": L("في إزاز عسلي، متعلّم باليد.", "In amber glass, labelled by hand."),
    },
  }),
  lib("promo-percent", {
    text: {
      "٣٠٪": L("٢٠٪", "20%"),
      "على كل المنتجات": L("خصم على كل ريفيل", "off every refill"),
      "لحد آخر الشهر أو لحد ما الكمية تخلص.": L("رجّع أي إزازة فاضية مع طلبك الجاي.", "Return any empty bottle with your next order."),
      "تسوق العرض": L("تسوق الزيوت", "Shop the oils"),
    },
    links: { "/products": SHOP },
  }),
  lib("testimonials-products", {
    photo: [PHOTOS.amberBottles, PHOTOS.dropper, PHOTOS.soapRow, PHOTOS.roseWater],
    text: {
      "تقييمات": L("التقييمات", "Reviews"),
      "تقييمات على منتجات حقيقية": L("نتايج حقيقية", "Real results"),
      "الطقم الكلاسيك": L("زيت شعر روزماري", "Rosemary Hair Oil"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "٣ شهور زيت روزماري وشعري بقى أتقل من قدام.",
        "Three months of rosemary oil and my hair is thicker at the front.",
      ),
      "م": L("م", "M"),
      "مريم أ.": L("منى ك.", "Mona K."),
      "الحقيبة اليومية": L("زيت وش تين شوكي", "Prickly Pear Face Oil"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("زيت الوش بيتشرب بسرعة ومش بيعملي حبوب.", "The face oil absorbs fast and does not break me out."),
      "ع": L("د", "D"),
      "عمر ك.": L("داليا س.", "Dalia S."),
      "الإسكندرية": L("الجيزة", "Giza"),
      "العلبة الهدية": L("٣ صابون زيت زيتون", "Olive Oil Soap Trio"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("صابون حلو، نفسي يبقى أكبر.", "Lovely soaps; I wish they came in a bigger bar."),
      "ن": L("ر", "R"),
      "نور ح.": L("رنا ح.", "Rana H."),
      "الجيزة": L("الإسكندرية", "Alexandria"),
      "الإصدار الجديد": L("تونر ماء ورد", "Rose Water Toner"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("أحلى ماء ورد استخدمته، ريحته طبيعية جداً.", "The nicest rose water I have used; it smells completely natural."),
      "ي": L("ه", "H"),
      "يوسف م.": L("هالة ف.", "Hala F."),
    },
    links: { "/products": [SHOP, SHOP, SHOP, SHOP, SHOP] },
  }),
  lib("stats-sentence", {
    text: {
      "وصّلنا": L("عصرنا", "We pressed"),
      "٢٥ ألف": L("١٨ ألف", "18,000"),
      "طلب لـ": L("إزازة السنة دي لعملاء في", "bottles this year for customers in"),
      "محافظة، وعملاءنا مدّيين متوسط": L("محافظة، وتقييمنا", "governorates, rated"),
    },
  }),
  lib("newsletter-letter", {
    text: {
      "رسالة كل أسبوع": L("رسالة كل شهر", "A monthly letter"),
      "أهلًا،": L("أهلاً،", "Hello,"),
      "كل خميس بكتب رسالة قصيرة فيها أحسن حاجة جربناها الأسبوع ده، وعرض للمشتركين بس.": L(
        "مرة في الشهر بكتب عن اللي بيتزرع في المزرعة وبدي المشتركين أول فرصة للزيوت الجديدة.",
        "Once a month I write about what is growing on the farm and give subscribers first access to new oils.",
      ),
      "أ": L("س", "S"),
      "أحمد": L("سلمى", "Salma"),
      "صاحب المتجر": L("مؤسسة نايل بوتانكس", "Founder, Nile Botanics"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("مزرعتنا", "Our farm"), L("مزرعة عائلية في الفيوم بتعصر زيوت من ٢٠١٥.", "A family farm in Fayoum pressing oils since 2015.")),
  aboutStory(lib, {
    photo: PHOTOS.rosemaryTin,
    alt: L("نبتة روزماري في أصيص صفيح", "A rosemary plant in a tin pot"),
    eyebrow: L("من ٢٠١٥", "Since 2015"),
    title: L("زيوت من أرضنا", "Oils from our own land"),
    text: L("بنزرع الروزماري والسمسم بنفسنا، وبنعصر على البارد بكميات صغيرة عشان الزيت يوصلك طازة.", "We grow our own rosemary and sesame and press cold in small batches, so the oil reaches you fresh."),
    more: L("وكل إزازة بترجعها بتوفرلك ٢٠٪.", "And every bottle you return saves you 20%."),
    button: L("تسوق كل المنتجات", "Shop all"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("زيوت معصورة على البارد من مزارع مصرية.", "Cold-pressed oils from Egyptian farms."),
  categories: [
    ["hair", "زيوت الشعر", "Hair oils", PHOTOS.amberBottles],
    ["body", "عناية الجسم", "Body care", PHOTOS.soapMix],
    ["face", "عناية الوش", "Face care", PHOTOS.eucalyptusOil],
    ["sets", "أطقم الروتين", "Ritual sets", PHOTOS.oilsDisplay],
  ],
  products: [
    ["rosemary-hair-oil", "hair", "زيت شعر روزماري", "Rosemary Hair Oil", PHOTOS.amberBottles, 420, { isFeatured: true, rating: 4.8, sold90: 520 }],
    ["black-seed-hair-oil", "hair", "زيت شعر حبة البركة", "Black Seed Hair Oil", PHOTOS.oilRow, 390, { sold90: 120 }],
    ["sesame-body-oil", "body", "زيت جسم سمسم", "Sesame Body Oil", PHOTOS.eucalyptusOil, 380, { sold90: 88 }],
    ["olive-oil-soap-trio", "body", "٣ صابون زيت زيتون", "Olive Oil Soap Trio", PHOTOS.soapRow, 240, { compareAtPrice: 290, sold90: 206 }],
    ["siwa-soap-selection", "body", "تشكيلة صابون سيوة", "Siwa Soap Selection", PHOTOS.soapStack, 320, { sold90: 74 }],
    ["prickly-pear-face-oil", "face", "زيت وش تين شوكي", "Prickly Pear Face Oil", PHOTOS.dropper, 690, { rating: 4.8, sold90: 140 }],
    ["rose-water-toner", "face", "تونر ماء ورد", "Rose Water Toner", PHOTOS.roseWater, 260, { sold90: 173 }],
    ["full-ritual-set", "sets", "طقم الروتين الكامل", "Full Ritual Set", PHOTOS.oilsDisplay, 1350, { compareAtPrice: 1590, isFeatured: true, rating: 4.9, sold90: 64 }],
  ],
});

export const BOTANICA = libraryTemplate({
  key: BOTANICA_KEY,
  version: 2,
  name: L("سيج", "Sage"),
  description: L(
    "عناية طبيعية بالشعر والجسم: من المزرعة للإزازة، ريفيل، تقييمات ورسالة المؤسسة. أربع صفحات جاهزة.",
    "Natural hair and body care: farm to bottle, refills, reviews and the founder's letter. Four ready pages.",
  ),
  category: "beauty",
  sortOrder: 120,
  palette: ["#f6f1e3", "#e9e0c8", "#d9b45a", "#2d3a22"],
  colors: {
    primary: "#2d3a22",
    secondary: "#e9e0c8",
    background: "#f6f1e3",
    foreground: "#2d3a22",
    muted: "#5e6650",
    border: "#ddd2b6",
    accent: "#e6c97e",
  },
  fonts: { heading: "Noto Naskh Arabic", body: "IBM Plex Sans Arabic" },
  radius: 24,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("مزرعتنا", "Our farm"), seo: { title: L("مزرعتنا", "Our farm") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("طريق المزارع، الفيوم.", "Farm Road, Fayoum."),
        heading: L("اسألنا عن روتينك", "Ask us about your routine"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الريفيل والمكونات والتوصيل.", "Refills, ingredients and delivery."),
        question: L("الريفيل بيشتغل إزاي؟", "How do refills work?"),
        answer: L(
          "رجّع أي إزازة فاضية مع طلبك الجاي للمندوب، وخد خصم ٢٠٪ على الريفيل.",
          "Hand any empty bottle to the courier with your next order and get 20% off the refill.",
        ),
      }),
    },
  ],
  demo: DEMO,
});
