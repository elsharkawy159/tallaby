/**
 * Tany (template 59, refurbished electronics; Claude Design "Storefront
 * Templates"): pale sage paper, deep green ink, a leaf green for actions and
 * a lime highlight, Cairo throughout and 10px corners. A renewed-devices
 * shop: up to 40% off, how we renew a device, renewed best sellers, more
 * warranty cover, open before you pay, delivery days and order tracking.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): earbuds in their cases,
 * smartwatches on desks, headphones, a living-room TV, a router, a smart
 * speaker and power banks on marble. No people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const TANY_KEY = "tany";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(TANY_KEY, getDesign(id)!, { corners: 10, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  pulseBuds: pexels(8858287, 900),
  airBuds: pexels(11390378, 900),
  ultra: pexels(7947641, 900),
  studio: pexels(5269735, 900),
  tvRoom: pexels(6980724, 900),
  router: pexels(28348054, 900),
  speaker: pexels(1279107, 900),
  powerBank: pexels(3921704, 900),
  bench: pexels(3921718),
};

const NAME = L("تاني أجين", "Tany Again");

const header = lib("header-ruled", {
  text: {
    "م": L("ت", "T"),
    "اسم متجرك": NAME,
    "المتجر": L("المجدد", "Renewed"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
  },
  links: { "/products": [undefined, BEST, undefined, undefined] },
});

const footer = lib("footer-help", {
  text: {
    "م": L("ت", "T"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ تاني أجين. كل الحقوق محفوظة.", "© 2026 Tany Again. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("promo-percent", {
    text: {
      "٣٠٪": L("٤٠٪", "40%"),
      "خصم": L("وفّر لحد", "Save up to"),
      "على كل المنتجات": L("زي الجديد، متفحص مرتين", "Like new, checked twice"),
      "لحد آخر الشهر أو لحد ما الكمية تخلص.": L("كل جهاز بيعدي فحص ٤٠ نقطة وبيتشحن بضمان ٦ شهور.", "Every device passes a 40-point check and ships with a 6-month warranty."),
      "تسوق العرض": L("تسوق المجدد", "Shop renewed"),
    },
    links: { "/products": SHOP },
  }),
  lib("text-steps", {
    text: {
      "إزاي ترجّع منتج": L("بنجدد الجهاز إزاي", "How we renew a device"),
      "ابعتلنا على واتساب": L("اختبار", "Test"),
      "خلال ١٤ يوم من الاستلام مع رقم الطلب.": L("٤٠ فحص للبطارية والشاشة والصوت والمداخل.", "40 checks on battery, screen, sound and ports."),
      "جهّز المنتج": L("تنضيف", "Clean"),
      "في علبته الأصلية بكل الإكسسوارات.": L("بيتفتح ويتنضف ويتقفل، وأطراف ووسايد جديدة.", "Opened, cleaned and resealed, with new tips and cushions."),
      "المندوب يستلم": L("تصنيف", "Grade"),
      "خلال يومين شغل من عنوانك.": L("فئة A أو B، مع صور لأي علامة.", "Grade A or B, with photos of any marks."),
      "فلوسك ترجع": L("ضمان", "Warranty"),
      "بنفس طريقة الدفع خلال ٥ أيام.": L("بيتشحن بضمان ٦ شهور وتقدر تزوده.", "It ships with a 6-month warranty you can extend."),
    },
  }),
  lib("products-list", {
    text: {
      "الكتالوج": L("الأكتر طلباً", "Top picks"),
      "كل الإكسسوارات": L("الأكثر مبيعاً من المجدد", "Renewed best sellers"),
      "كل اللي تحتاجه في مكان واحد، أصلي وبضمان.": L("أجهزة أصلية متفحصة، بسعر أقل من الجديد بكتير.", "Genuine devices, checked, for much less than new."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 5 }],
  }),
  lib("service-plans", {
    text: {
      "احمي جهازك أكتر": L("زوّد الضمان", "Add more cover"),
      "سنة": L("٦ شهور", "6 months"),
      "١٩٩ ج.م": L("مجاناً", "Free"),
      "سنتين": L("سنة", "1 year"),
      "٣٤٩ ج.م": L("٢٤٩ ج.م", "EGP 249"),
      "٣ سنين": L("سنتين", "2 years"),
      "٤٧٩ ج.م": L("٣٩٩ ج.م", "EGP 399"),
      "إصلاح الأعطال": L("تصليح أو تغيير", "Repair or replace"),
      "فني في البيت": L("المندوب ياخده ببلاش", "Free courier pick-up"),
      "جهاز بديل وقت الصيانة": L("جهاز بديل وقت التصليح", "Loan device during repair"),
      "كل مزايا السنتين": L("كل مزايا السنة", "Everything in 1 year"),
      "كسر الشاشة مرة واحدة": L("حادثة واحدة", "One accident"),
    },
  }),
  lib("pay-open-box", {
    text: {
      "جرّب المنتج قدام المندوب.": L("شغّل الجهاز واتأكد من الفئة قدام المندوب.", "Switch the device on and check its grade in front of the courier."),
    },
  }),
  lib("pay-days", {
    text: {
      "القاهرة، الجيزة": L("القاهرة والجيزة", "Cairo and Giza"),
      "الإسكندرية، الدلتا، مدن القناة": L("الدلتا والقناة", "Delta and Canal"),
      "٤–٦": L("٤–٥", "4–5"),
      "الصعيد، البحر الأحمر، سيناء": L("الصعيد", "Upper Egypt"),
    },
  }),
  lib("track-ask"),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن تاني أجين", "About Tany Again"), L("متفحص ومتنضف ومضمون. زي الجديد، بسعر أقل.", "Checked, cleaned and guaranteed. Like new, for less.")),
  aboutStory(lib, {
    photo: PHOTOS.bench,
    alt: L("باور بانك وشاحن وكابلات على رخام", "A power bank, a charger and cables on marble"),
    eyebrow: L("الدقي", "Dokki"),
    title: L("جهاز كويس يستاهل فرصة تانية", "A good device deserves a second go"),
    text: L("بناخد أجهزة مستعملة أصلية، ونفحصها ٤٠ فحص وننضفها ونصنفها بصراحة.", "We take genuine used devices, run 40 checks, clean them and grade them honestly."),
    more: L("وكل جهاز بيخرج بضمان ٦ شهور، فبتوفّر من غير ما تقلق.", "And every device leaves with a 6-month warranty, so you save without worrying."),
    button: L("تسوق المجدد", "Shop renewed"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("متفحص ومتنضف ومضمون. زي الجديد، بسعر أقل.", "Checked, cleaned and guaranteed. Like new, for less."),
  categories: [
    ["audio", "سماعات", "Audio", PHOTOS.pulseBuds],
    ["watches", "ساعات", "Watches", PHOTOS.ultra],
    ["tv", "التلفزيون والبيت", "TV & home", PHOTOS.tvRoom],
    ["power", "الطاقة", "Power", PHOTOS.powerBank],
  ],
  products: [
    ["pulse-buds-pro-renewed", "audio", "بالس برو مجددة (فئة A)", "Pulse Buds Pro, renewed (grade A)", PHOTOS.pulseBuds, 1090, { compareAtPrice: 1730, isFeatured: true, rating: 4.6, sold90: 140 }],
    ["ultra-3-renewed", "watches", "ألترا 3 مجددة (فئة A)", "Ultra 3, renewed (grade A)", PHOTOS.ultra, 890, { compareAtPrice: 1450, sold90: 88 }],
    ["smart-tv-43-renewed", "tv", "شاشة سمارت ٤٣ مجددة (فئة B)", "43-inch Smart TV, renewed (grade B)", PHOTOS.tvRoom, 6900, { compareAtPrice: 11900, sold90: 41 }],
    ["power-bank-10k-renewed", "power", "باور بانك 10K مجدد", "10K Power Bank, renewed", PHOTOS.powerBank, 590, { compareAtPrice: 990, sold90: 22 }],
    ["studio-headphones-renewed", "audio", "سماعة ستوديو مجددة (فئة A)", "Studio Headphones, renewed (grade A)", PHOTOS.studio, 590, { compareAtPrice: 990, sold90: 30 }],
    ["air-buds-4-renewed", "audio", "إير 4 مجددة (فئة B)", "Air Buds 4, renewed (grade B)", PHOTOS.airBuds, 790, { compareAtPrice: 1390, sold90: 54 }],
    ["wifi-router-renewed", "tv", "راوتر واي فاي مجدد", "Wi-Fi Router, renewed", PHOTOS.router, 950, { compareAtPrice: 1600, sold90: 26 }],
    ["mini-speaker-renewed", "tv", "سبيكر ذكي ميني مجدد", "Mini Smart Speaker, renewed", PHOTOS.speaker, 690, { compareAtPrice: 1450, inStock: false, sold90: 18 }],
  ],
});

export const TANY = libraryTemplate({
  key: TANY_KEY,
  version: 1,
  name: L("تاني", "Tany"),
  description: L(
    "إلكترونيات مجددة: وفّر لحد ٤٠٪، بنجدد الجهاز إزاي، الضمان، افتح قبل ما تدفع وتتبع طلبك. أربع صفحات جاهزة.",
    "Refurbished electronics: save up to 40%, how we renew a device, warranty, open before you pay and order tracking. Four ready pages.",
  ),
  category: "electronics",
  sortOrder: 590,
  palette: ["#f4f7f2", "#e2ead9", "#c5f07a", "#2f7d32"],
  colors: {
    primary: "#2f7d32",
    secondary: "#e2ead9",
    background: "#f4f7f2",
    foreground: "#17251a",
    muted: "#4f5f50",
    border: "#d0dbc4",
    accent: "#c5f07a",
  },
  fonts: { heading: "Cairo", body: "Cairo" },
  radius: 10,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن تاني أجين", "About"), seo: { title: L("عن تاني أجين", "About Tany Again") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("اسأل عن فئة جهاز أو ابعتلنا جهازك القديم.", "Ask about a device's grade or send us your old one."),
        heading: L("اسأل عن جهاز مجدد", "Ask about a renewed device"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الفئات والفحص والضمان.", "Grades, checks and warranty."),
        question: L("إيه الفرق بين فئة A وفئة B؟", "What is the difference between grade A and grade B?"),
        answer: L("فئة A شبه جديدة، وفئة B فيها علامات خفيفة بنصورها لك في صفحة المنتج.", "Grade A looks almost new; grade B has light marks we photograph on the product page."),
      }),
    },
  ],
  demo: DEMO,
});
