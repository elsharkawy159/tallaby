/**
 * Ward (template 103, everyday beauty; Claude Design "Storefront
 * Templates"): blush-white paper, plum-brown ink, a rose for actions and a
 * pale pink highlight, Amiri headings on Noto Naskh Arabic and soft 20px
 * corners. Skin, body and hair care that keeps it simple: banners for face,
 * body and hair, three promises, the five, buy more and save, points on
 * every order and questions. Built from section library designs
 * (`fromLibrary`).
 *
 * Rewards have no library designs yet: "How points work" uses the numbered
 * steps (`text-steps`), with the points as copy (no points ledger).
 *
 * Photos: Pexels, each checked by eye (2026-10-23): dropper bottles, a
 * serum and gua sha set, amber oil and pump bottles, a body brush, cream
 * jars, olive soap bars and a bath stool. No people, no hands and no brand
 * labels (the design's photos with a hand or a printed brand were
 * replaced).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const WARD_KEY = "ward";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(WARD_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  faceBanner: pexels(8102128),
  bodyBanner: pexels(7796159),
  hairBanner: pexels(7795790),
  faceOil: pexels(12146904, 900),
  toner: pexels(4735943, 900),
  faceWash: pexels(6811698, 900),
  oliveSoap: pexels(6690863, 900),
  bodyOil: pexels(7795790, 900),
  hairOil: pexels(7796159, 900),
  ritualSet: pexels(8102128, 900),
  sheaButter: pexels(6690234, 900),
  pumpTrio: pexels(8709569),
};

const NAME = L("ورد", "Ward");

const header = lib("header-centered", {
  text: {
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨": L("عناية من غير تعقيد", "Care, kept simple"),
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("عن ورد", "About"),
    "تواصل معنا": L("تواصل", "Contact"),
  },
  links: { "/products": [undefined, BEST, undefined, undefined, BEST], "/blog": "/faq" },
});

const footer = lib("footer-centered", {
  text: {
    "م": L("و", "W"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.": L("عناية بالبشرة والجسم والشعر من غير تعقيد.", "Skin, body and hair care that keeps it simple."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ ورد. كل الحقوق محفوظة.", "© 2026 Ward. All rights reserved."),
  },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.faceBanner, PHOTOS.bodyBanner, PHOTOS.hairBanner],
    text: {
      "وصل حديثًا": L("عناية البشرة", "Skincare"),
      "الموسم الجديد وصل": L("روتين بسيط وبيجيب نتيجة", "A simple routine that works"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("غسول وسيروم وكريم مختارين لجو القاهرة.", "Cleanser, serum and cream, chosen for Cairo weather."),
      "تسوّق الجديد": L("تسوقي الوش", "Shop face"),
      "صورة الحملة الأولى": L("سيرم وجوا شا وصابونة على قماش أسود", "A serum, a gua sha and a soap bar on black cloth"),
      "الأكثر مبيعًا": L("عناية الجسم", "Body care"),
      "المفضّلة عند عملائنا": L("بشرة ناعمة طول الصيف", "Soft skin all summer"),
      "القطع اللي بترجع لها كل مرة.": L("زيوت خفيفة وفرشاة للجسم.", "Light oils and a body brush."),
      "شوف الأكثر مبيعًا": L("تسوقي الجسم", "Shop body"),
      "صورة الحملة الثانية": L("فرشاة جسم وزيت عسلي على صينية خشب", "A body brush and amber oil on a wooden tray"),
      "عروض الأسبوع": L("الشعر", "Hair"),
      "خصومات لفترة محدودة": L("هيشان أقل ولمعة أكتر", "Less frizz, more shine"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("زيوت وماسكات لكل أنواع الشعر.", "Oils and masks for every hair type."),
      "تسوّق العروض": L("تسوقي الشعر", "Shop hair"),
      "صورة الحملة الثالثة": L("زجاجات زيت عسلي بمضخة وقطّارة", "Amber pump and dropper bottles of oil"),
    },
    links: { "/products": [search("وش"), search("جسم"), search("شعر")] },
  }),
  lib("categories-circles", { text: { "بتدوّر على إيه؟": L("بشرتك محتاجة إيه؟", "What does your skin need?") } }),
  lib("products-grid", {
    as: "the-five",
    text: {
      "وصل حديثًا": L("الخمسة", "The five"),
      "أحدث المنتجات اللي نزلت المتجر.": L("المنتجات اللي أغلب عميلاتنا بيبدأوا بيها.", "The products most of our customers start with."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("features-ruled", {
    text: {
      "توصيل سريع": L("من غير عطور", "No fragrance added"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("لطيف على البشرة الحساسة.", "Gentle on sensitive skin."),
      "الدفع عند الاستلام": L("معصور على البارد", "Cold pressed"),
      "أو ادفع بالبطاقة والمحفظة": L("الزيوت بتحافظ على فيتاميناتها.", "Oils keep their vitamins."),
      "استرجاع سهل": L("إزاز", "Glass bottles"),
      "١٤ يومًا لتغيّر رأيك": L("رجّعيها ونعيد ملاها.", "Return them and we refill them."),
      "دعم على واتساب": L("عينة مجانية", "A free sample"),
      "أشخاص حقيقيون طوال الأسبوع": L("مع كل طلب، عشان تجربي الجديد.", "With every order, so you can try what is new."),
    },
  }),
  lib("text-steps", {
    as: "points",
    name: L("الريفيل بيشتغل إزاي", "How refills work"),
    text: {
      "إزاي ترجّع منتج": L("الريفيل بيشتغل إزاي", "How refills work"),
      "ابعتلنا على واتساب": L("اطلبي", "Order"),
      "خلال ١٤ يوم من الاستلام مع رقم الطلب.": L("اختاري زيتك المفضل.", "Pick your favourite oil."),
      "جهّز المنتج": L("رجّعي", "Return"),
      "في علبته الأصلية بكل الإكسسوارات.": L("سلّمي الإزازة الفاضية للمندوب.", "Hand the empty bottle to the courier."),
      "المندوب يستلم": L("استلمي", "Receive"),
      "خلال يومين شغل من عنوانك.": L("بترجعلك مليانة في الطلب اللي بعده.", "It comes back full in your next order."),
      "فلوسك ترجع": L("اعرفي رصيدك", "Check your balance"),
      "بنفس طريقة الدفع خلال ٥ أيام.": L("وبنبعتلك على واتساب أول ما الإزازة ترجع.", "And we message you on WhatsApp when the bottle is back."),
    },
  }),
  lib("faq-columns", {
    as: "home-faq",
    text: {
      "أسئلة شائعة": L("أسئلة", "Questions"),
      "كيف أعرف أن طلبي وصل إليكم؟": L("أبدأ بأنهي منتج؟", "Which product should I start with?"),
      "ستظهر لك صفحة تأكيد وتصلك رسالة، ونتصل بك لتأكيد طلبات الدفع عند الاستلام.": L(
        "ابدئي بزيت التين الشوكي وتونر ماء الورد، وزوّدي الباقي على مهلك.",
        "Start with the prickly pear oil and the rose water toner, then add the rest at your pace.",
      ),
      "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("المنتجات مناسبة للبشرة الحساسة؟", "Are they suitable for sensitive skin?"),
      "نعم، حتى يتم شحنه. تواصل معنا بأسرع وقت.": L("أيوه، كلها من غير عطور ومن غير كحول.", "Yes, everything is fragrance free and alcohol free."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن ورد", "About Ward"), L("عناية بالبشرة والجسم والشعر من غير تعقيد.", "Skin, body and hair care that keeps it simple.")),
  aboutStory(lib, {
    photo: PHOTOS.pumpTrio,
    alt: L("زجاجات عسلي بمضخة جنب مروحة ورق", "Amber pump bottles beside a paper fan"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("منتجات قليلة بتعمل فرق", "A few products that make a difference"),
    text: L("بنختار زيوت معصورة على البارد وصابون زيت زيتون وتونر من غير كحول، ونسيب الباقي.", "We pick cold-pressed oils, olive oil soap and an alcohol-free toner, and leave out the rest."),
    more: L("وكل الإزاز بيرجعلنا ونعيد ملاه.", "And every bottle comes back to us to be refilled."),
    button: L("تسوقي الأكثر مبيعاً", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("عناية بالبشرة والجسم والشعر من غير تعقيد.", "Skin, body and hair care that keeps it simple."),
  categories: [
    ["face", "الوش", "Face", PHOTOS.faceOil],
    ["body", "الجسم", "Body", PHOTOS.oliveSoap],
    ["hair", "الشعر", "Hair", PHOTOS.hairOil],
    ["sets", "أطقم", "Sets", PHOTOS.ritualSet],
  ],
  products: [
    ["prickly-pear-face-oil", "face", "زيت التين الشوكي", "Prickly Pear Face Oil", PHOTOS.faceOil, 690, { isFeatured: true, rating: 4.8, sold90: 164 }],
    ["rose-water-toner", "face", "تونر ماء الورد", "Rose Water Toner", PHOTOS.toner, 320, { rating: 4.7, sold90: 120 }],
    ["olive-oil-soap-trio", "body", "٣ صابون زيت زيتون", "Olive Oil Soap Trio", PHOTOS.oliveSoap, 240, { rating: 4.9, sold90: 210 }],
    ["sesame-body-oil", "body", "زيت سمسم للجسم", "Sesame Body Oil", PHOTOS.bodyOil, 380, { sold90: 48 }],
    ["rosemary-hair-oil", "hair", "زيت روزماري", "Rosemary Hair Oil", PHOTOS.hairOil, 290, { compareAtPrice: 340, rating: 4.8, sold90: 188 }],
    ["full-ritual-set", "sets", "طقم الروتين الكامل", "Full Ritual Set", PHOTOS.ritualSet, 1290, { compareAtPrice: 1520, sold90: 62 }],
    ["gentle-face-wash", "face", "غسول وش لطيف", "Gentle Face Wash", PHOTOS.faceWash, 280, { sold90: 90 }],
    ["shea-body-butter", "body", "زبدة شيا للجسم", "Shea Body Butter", PHOTOS.sheaButter, 420, { inStock: false, sold90: 74 }],
  ],
});

export const WARD = libraryTemplate({
  key: WARD_KEY,
  version: 3,
  changelog: "Ward v3: categories after the hero, products before the promises",
  productPage: { surface: "shelf", thumbs: "bottom", band: "paper", copy: { back: L("رجوع لروتينك", "Back to your routine"), reviews: L("بشرتهم قالت", "What their skin says"), related: L("كمّلي الروتين", "Finish the routine") } },
  name: L("ورد", "Ward"),
  description: L(
    "جمال كل يوم: بانرات متحركة، الخمسة، الريفيل بيشتغل إزاي وأسئلة. أربع صفحات جاهزة.",
    "Everyday beauty: a banner carousel, the five, how refills work and questions. Four ready pages.",
  ),
  category: "beauty",
  sortOrder: 1030,
  palette: ["#fbf8f6", "#f2e9e6", "#f1c6c9", "#9b3d5a"],
  colors: {
    primary: "#9b3d5a",
    secondary: "#f2e9e6",
    background: "#fbf8f6",
    foreground: "#2e2326",
    muted: "#6e5f62",
    border: "#e6d8d3",
    accent: "#f1c6c9",
  },
  fonts: { heading: "Amiri", body: "Noto Naskh Arabic" },
  radius: 20,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن ورد", "About"), seo: { title: L("عن ورد", "About Ward") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("ابعتيلنا على ward@ward.eg أو على واتساب.", "Write to ward@ward.eg or on WhatsApp."),
        heading: L("اسألي عن روتينك", "Ask about your routine"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المنتجات والريفيل والتوصيل.", "Products, refills and delivery."),
        question: L("إزاي أرجّع الإزاز؟", "How do I return the bottles?"),
        answer: L("سلّميها للمندوب مع طلبك الجاي، وبنرجعهالك مليانة.", "Hand them to the courier with your next order, and we send them back full."),
      }),
    },
  ],
  demo: DEMO,
});
