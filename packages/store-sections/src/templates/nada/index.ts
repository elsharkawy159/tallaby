/**
 * Nada (template 60, clean minimal skincare; Claude Design "Storefront
 * Templates"): near-white paper, a deep sage green for actions and a pale
 * sage highlight, Almarai throughout and soft 24px corners. A five-product
 * routine from Fayoum: a split-screen routine hero, three promises, the five
 * best sellers, buy more of the olive soap and save, points on every order
 * and questions. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): dropper bottles, amber
 * oil and pump bottles, cream jars, olive soap bars and a gua sha set on
 * plain surfaces. No people, no hands and no brand labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const NADA_KEY = "nada";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(NADA_KEY, getDesign(id)!, { corners: 24, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  faceOil: pexels(12146904, 900),
  faceOilHero: pexels(12146904),
  faceWash: pexels(6811698, 900),
  oliveSoap: pexels(6690863, 900),
  bodyOil: pexels(7795790, 900),
  hairOil: pexels(7796159, 900),
  ritualSet: pexels(8102128, 900),
  sheaButter: pexels(6690234, 900),
  calmSerum: pexels(4735943, 900),
  pumpTrio: pexels(8709569),
};

const NAME = L("ندى سكين", "Nada Skin");

const header = lib("header-line", {
  text: {
    "م": L("ن", "N"),
    "اسم متجرك": NAME,
    "المتجر": L("الروتين", "The routine"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("عن ندى", "About"),
  },
  links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-ruled", {
  text: {
    "م": L("ن", "N"),
    "اسم متجرك": NAME,
    "منتجات أصلية بضمان، توصلك لحد البيت.": L("٥ منتجات. ده الروتين كله.", "Five products. That is the whole routine."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ ندى سكين. كل الحقوق محفوظة.", "© 2026 Nada Skin. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن ندى", "About Nada"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.faceOilHero],
    text: {
      "كوليكشن الموسم": L("الروتين", "The routine"),
      "صوت أنقى، كل يوم": L("٥ خطوات، ولا حاجة زيادة", "Five steps, nothing extra"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "تنضيف، تونر، زيت، جسم، شعر. بكميات صغيرة في الفيوم.",
        "Cleanse, tone, oil, body, hair. Made in small batches in Fayoum.",
      ),
      "تسوق الآن": L("تسوقي الروتين", "Shop the routine"),
      "العروض": L("الأكثر مبيعاً", "Best sellers"),
      "صورة الحملة": L("زجاجتين زيت وش بقطّارة", "Two face oil dropper bottles"),
    },
    links: { "/products": [SHOP, BEST] },
  }),
  lib("features-ruled", {
    text: {
      "توصيل سريع": L("من غير عطور", "No fragrance added"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("لطيف على البشرة الحساسة.", "Gentle on sensitive skin."),
      "الدفع عند الاستلام": L("معصور على البارد", "Cold pressed"),
      "أو ادفع بالبطاقة والمحفظة": L("الزيوت بتحافظ على فيتاميناتها.", "Oils keep their vitamins."),
      "استرجاع سهل": L("إزاز", "Glass bottles"),
      "١٤ يومًا لتغيّر رأيك": L("رجّعيها وخدي خصم ريفيل.", "Return them for a refill discount."),
      "دعم على واتساب": L("عينات ببلاش", "Free samples"),
      "أشخاص حقيقيون طوال الأسبوع": L("في كل طلب، عشان تجربي الجديد.", "In every box, so you can try what is new."),
    },
  }),
  lib("products-grid", {
    as: "the-five",
    text: {
      "وصل حديثًا": L("الخمسة", "The five"),
      "أحدث المنتجات اللي نزلت المتجر.": L("المنتجات اللي معظم عميلاتنا بيبدأوا بيها.", "The products most of our customers start with."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("bundle-quantity", {
    text: {
      "وفّر مع الكمية": L("وفّري مع الكمية", "Save with quantity"),
      "السعر العادي": L("السعر العادي", "Regular price"),
      "وفّر ١٠٪": L("وفّري ١٠٪", "Save 10%"),
      "على الطلب كله": L("على الطلب كله", "On the whole order"),
      "وفّر ١٨٪": L("وفّري ١٥٪", "Save 15%"),
      "اختار عدد القطع من السلة.": L("اختاري عدد القطع من السلة.", "Choose how many in your cart."),
    },
    lists: [{ source: "best-sellers" }],
  }),
  lib("text-steps", {
    as: "points",
    text: {
      "إزاي ترجّع منتج": L("نقط على كل طلب", "Points on every order"),
      "ابعتلنا على واتساب": L("اكسبي", "Earn"),
      "خلال ١٤ يوم من الاستلام مع رقم الطلب.": L("نقطة على كل ١٠ ج.م بتشتري بيها.", "One point for every EGP 10 you spend."),
      "جهّز المنتج": L("استبدلي", "Redeem"),
      "في علبته الأصلية بكل الإكسسوارات.": L("كل ١٠٠ نقطة = خصم ١٠ ج.م على أي طلب.", "Every 100 points = EGP 10 off any order."),
      "المندوب يستلم": L("رجّعي الإزاز", "Return bottles"),
      "خلال يومين شغل من عنوانك.": L("٥٠ نقطة لكل إزازة فاضية بترجعيها.", "50 points for every empty bottle you return."),
      "فلوسك ترجع": L("اعرفي رصيدك", "Check your balance"),
      "بنفس طريقة الدفع خلال ٥ أيام.": L("بنبعتلك رصيد نقطك على واتساب مع كل طلب.", "We send your points balance on WhatsApp with every order."),
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
  pageHeader(lib, "about-header", L("عن ندى", "About Nada"), L("ورشة عناية صغيرة في الفيوم.", "A small skincare workshop in Fayoum.")),
  aboutStory(lib, {
    photo: PHOTOS.pumpTrio,
    alt: L("زجاجات عسلي بمضخة جنب ورق مروحة", "Amber pump bottles beside a paper fan"),
    eyebrow: L("الفيوم", "Fayoum"),
    title: L("روتين أقصر، بشرة أهدى", "A shorter routine, calmer skin"),
    text: L("بدأنا لما لقينا رفّ الحمام مليان ١٢ منتج ولا واحد فيهم شغال. خليناهم ٥.", "We started when our bathroom shelf held twelve products and none of them worked. We kept five."),
    more: L("وكل دفعة بنعملها صغيرة، عشان توصلك طازة.", "And every batch is small, so it reaches you fresh."),
    button: L("تسوقي الروتين", "Shop the routine"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("٥ منتجات. ده الروتين كله.", "Five products. That is the whole routine."),
  categories: [
    ["face", "الوش", "Face", PHOTOS.faceOil],
    ["body", "الجسم", "Body", PHOTOS.bodyOil],
    ["hair", "الشعر", "Hair", PHOTOS.hairOil],
    ["sets", "أطقم", "Sets", PHOTOS.ritualSet],
  ],
  products: [
    ["prickly-pear-face-oil", "face", "زيت التين الشوكي", "Prickly Pear Face Oil", PHOTOS.faceOil, 690, { isFeatured: true, rating: 4.8, sold90: 164 }],
    ["rose-water-face-wash", "face", "غسول ماء الورد", "Rose Water Face Wash", PHOTOS.faceWash, 320, { rating: 4.7, sold90: 120 }],
    ["olive-oil-soap-trio", "body", "٣ صابون زيت زيتون", "Olive Oil Soap Trio", PHOTOS.oliveSoap, 240, { rating: 4.9, sold90: 210 }],
    ["sesame-body-oil", "body", "زيت سمسم للجسم", "Sesame Body Oil", PHOTOS.bodyOil, 380, { sold90: 48 }],
    ["rosemary-hair-oil", "hair", "زيت روزماري", "Rosemary Hair Oil", PHOTOS.hairOil, 290, { compareAtPrice: 340, rating: 4.8, sold90: 188 }],
    ["full-ritual-set", "sets", "طقم الروتين الكامل", "Full Ritual Set", PHOTOS.ritualSet, 1290, { compareAtPrice: 1520, isFeatured: true, rating: 4.9, sold90: 62 }],
    ["shea-body-butter", "body", "زبدة شيا للجسم", "Shea Body Butter", PHOTOS.sheaButter, 420, { sold90: 74 }],
    ["calm-serum", "face", "سيرم مهدّي", "Calm Serum", PHOTOS.calmSerum, 560, { sold90: 90 }],
  ],
});

export const NADA = libraryTemplate({
  key: NADA_KEY,
  version: 1,
  name: L("ندى", "Nada"),
  description: L(
    "عناية بسيطة ونضيفة: روتين من ٥ منتجات، وفّري مع الكمية ونقط على كل طلب. أربع صفحات جاهزة.",
    "Clean, minimal skincare: a five-product routine, quantity savings and points on every order. Four ready pages.",
  ),
  category: "beauty",
  sortOrder: 600,
  palette: ["#fbfbf9", "#eef1ec", "#dfe9d5", "#3e6b57"],
  colors: {
    primary: "#3e6b57",
    secondary: "#eef1ec",
    background: "#fbfbf9",
    foreground: "#1d2420",
    muted: "#5a635d",
    border: "#e0e5dd",
    accent: "#dfe9d5",
  },
  fonts: { heading: "Almarai", body: "Almarai" },
  radius: 24,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن ندى", "About"), seo: { title: L("عن ندى", "About Nada") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصلي معانا", "Contact us"),
        text: L("الفيوم، وبنوصل لكل المحافظات.", "Fayoum, delivering to every governorate."),
        heading: L("اسألي عن بشرتك", "Ask about your skin"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الروتين والنقط والإزاز.", "The routine, points and bottles."),
        question: L("إزاي أرجّع الإزاز الفاضي؟", "How do I return empty bottles?"),
        answer: L("سلّميها للمندوب مع طلبك الجاي، وبنضيفلك ٥٠ نقطة لكل إزازة.", "Hand them to the courier with your next order and we add 50 points per bottle."),
      }),
    },
  ],
  demo: DEMO,
});
