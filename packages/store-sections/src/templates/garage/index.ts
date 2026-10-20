/**
 * Garage (template 36, car accessories; Claude Design "Storefront
 * Templates"): concrete paper, near-black type and a signal yellow, Changa
 * throughout and tight 4px corners. A bold accessories shop: a garage-sale
 * poster, four aisles, drivers' picks, why Torque, the weekend deal, small
 * upgrades and drivers on WhatsApp. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): phone mounts, seats,
 * a steering wheel, tools, jumper cables and keys. No people, no car
 * badges and no product brands.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const GARAGE_KEY = "garage";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(GARAGE_KEY, getDesign(id)!, { corners: 4, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  workshop: pexels(34337558),
  workshopSmall: pexels(34337558, 900),
  ventMount: pexels(13536013, 900),
  dashMount: pexels(7738878, 900),
  jumperCables: pexels(7568447, 900),
  toolWall: pexels(4480461, 900),
  spanners: pexels(4480466, 900),
  leatherSeat: pexels(10196155, 900),
  headrest: pexels(9258341, 900),
  plaidSeat: pexels(7916803, 900),
  steering: pexels(39813049, 900),
  keys: pexels(842528, 900),
  powerBank: pexels(3921704, 900),
};

const NAME = L("تورك أوتو", "Torque Auto");

const header = lib("header-brand-bar", {
  text: { "م": L("ت", "T"), "اسم متجرك": NAME, "ابحث في المتجر": L("ابحث عن حامل، فرش، عدة…", "Search mounts, covers, tools…") },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("سوق بأمان، وارجع لنا", "Drive safe, come back soon"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ تورك أوتو. كل الحقوق محفوظة.", "© 2026 Torque Auto. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن تورك", "About Torque"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-poster", {
    photo: [undefined, undefined, PHOTOS.workshop],
    text: {
      "مجموعة الموسم": L("أوكازيون الجراج", "Garage sale"),
      "من ١ إلى ٣٠ نوفمبر": L("لحد آخر الشهر", "Until the end of the month"),
      "صورة الحملة": L("ورشة عربيات فيها عدة ورافعات", "A car workshop with tools and lifts"),
      "خصم": L("خصم لحد", "Up to"),
      "٣٠٪": L("٤٠٪", "40%"),
      "لفترة محدودة": L("على العدة", "off tools"),
      "الموسم الجديد وصل": L("جهّز عربيتك قبل الشتا", "Get your car ready for winter"),
      "قطع خفيفة بخامات طبيعية، مقاسات كاملة وتبديل مجاني خلال ١٤ يومًا.": L(
        "حوامل وفرش وعدة طوارئ، وتركيب مجاني في الفرع لأي طلب فوق ٨٠٠ ج.م.",
        "Mounts, covers and emergency kits, with free fitting at the shop on orders over EGP 800.",
      ),
      "اكتشف المجموعة": L("تسوق الأوكازيون", "Shop the sale"),
    },
    links: { "/products": BEST },
  }),
  lib("categories-chips", { text: { "إيه اللي في بالك؟": L("عربيتك محتاجة إيه؟", "What does your car need?") } }),
  lib("products-bento", { text: { "الكل بيسأل عليهم": L("اختيارات السواقين", "Drivers’ picks") }, links: { "/products": BEST } }),
  lib("features-compare", {
    text: {
      "قارن": L("قارن", "Compare"),
      "إحنا ولا غيرنا؟": L("ليه تورك؟", "Why Torque?"),
      "متجرنا": NAME,
      "غيرنا": L("محلات تانية", "Other shops"),
      "ضمان محلي": L("تركيب مجاني في الفرع", "Free fitting at the shop"),
      "رد على واتساب في دقايق": L("نتأكد إن القطعة تركب عربيتك", "We check the part fits your car"),
    },
  }),
  lib("promo-deal", {
    photo: [undefined, undefined, undefined, PHOTOS.jumperCables],
    text: {
      "صورة العرض": L("كابلات اشتراك بطارية متعلقة", "Jumper cables hanging up"),
      "عرض اليوم": L("عرض الويك إند", "Weekend deal"),
      "اسم العرض أو المنتج هنا": L("شنطة طوارئ العربية", "Car emergency kit"),
      "اكتب سبب العرض وما يحصل عليه العميل في سطر واحد.": L(
        "كابلات اشتراك ونفّاخ كاوتش ومثلث تحذير في شنطة واحدة.",
        "Jumper cables, a tyre inflator and a warning triangle in one bag.",
      ),
      "وفّر ٢٥٪": L("وفّر ٣٠٪", "Save 30%"),
      "الحق العرض": L("الحق العرض", "Grab the deal"),
    },
    links: { "/products": search("طوارئ") },
  }),
  lib("products-rows", {
    text: { "إكسسوارات بسعر حلو": L("ترقيات صغيرة بفرق كبير", "Small upgrades, big difference") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers" }],
  }),
  lib("testimonials-chat", {
    text: {
      "رسايل بتفرّحنا": L("السواقين على واتساب", "Drivers on WhatsApp"),
      "مريم أ.": L("شريف م.", "Sherif M."),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "ركبتوا الفرش في نص ساعة وطلع مظبوط على المقاعد.",
        "You fitted the covers in half an hour and they sit perfectly.",
      ),
      "ده يسعدنا جدًا، شكرًا ليكي!": L("نورتنا! أي وقت.", "Glad to have you! Any time."),
      "عمر ك.": L("ياسمين ع.", "Yasmine A."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("الحامل المغناطيس ماسك الموبايل حتى في المطبات.", "The magnetic mount holds the phone even over bumps."),
      "يوسف م.": L("محمود ك.", "Mahmoud K."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("شنطة الطوارئ أنقذتني على الصحراوي.", "The emergency kit saved me on the desert road."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن تورك", "About Torque"), L("ورشة إكسسوارات عربيات في مصر الجديدة.", "A car accessories workshop in Heliopolis.")),
  aboutStory(lib, {
    photo: PHOTOS.workshopSmall,
    alt: L("ورشة عربيات", "A car workshop"),
    eyebrow: L("مصر الجديدة", "Heliopolis"),
    title: L("بنركّب اللي بنبيعه", "We fit what we sell"),
    text: L("إحنا ورشة قبل ما نكون محل: كل قطعة بنجربها على عربيات حقيقية قبل ما تنزل الموقع.", "We are a workshop before a shop: every part is tried on real cars before it goes online."),
    more: L("والتركيب مجاني في الفرع للطلبات فوق ٨٠٠ ج.م.", "And fitting is free at the shop on orders over EGP 800."),
    button: L("تسوق الإكسسوارات", "Shop accessories"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("إكسسوارات وعدة للعربية، بتركيب مجاني.", "Car accessories and tools, with free fitting."),
  categories: [
    ["mounts", "حوامل موبايل", "Phone mounts", PHOTOS.dashMount],
    ["interior", "الصالون", "Interior", PHOTOS.leatherSeat],
    ["tools", "عدة وطوارئ", "Tools & emergency", PHOTOS.spanners],
    ["extras", "إضافات", "Extras", PHOTOS.keys],
  ],
  products: [
    ["magnetic-vent-mount", "mounts", "حامل مغناطيس للتكييف", "Magnetic Vent Mount", PHOTOS.ventMount, 290, { isFeatured: true, rating: 4.7, sold90: 410 }],
    ["dash-phone-mount", "mounts", "حامل تابلوه بشاحن", "Dash Mount with Charger", PHOTOS.dashMount, 650, { sold90: 180 }],
    ["leather-seat-covers", "interior", "فرش جلد للمقاعد", "Leather Seat Covers", PHOTOS.leatherSeat, 3200, { compareAtPrice: 3800, isFeatured: true, rating: 4.8, sold90: 96 }],
    ["neck-headrest-pillow", "interior", "مخدة رقبة للمسند", "Headrest Neck Pillow", PHOTOS.headrest, 380, { sold90: 150 }],
    ["plaid-seat-blanket", "interior", "غطا مقاعد كاروهات", "Plaid Seat Blanket", PHOTOS.plaidSeat, 540, { sold90: 60 }],
    ["steering-wheel-cover", "interior", "جلدة دركسيون", "Steering Wheel Cover", PHOTOS.steering, 320, { sold90: 220 }],
    ["emergency-kit", "tools", "شنطة طوارئ العربية", "Car Emergency Kit", PHOTOS.jumperCables, 890, { compareAtPrice: 1270, rating: 4.9, sold90: 132 }],
    ["spanner-set", "tools", "طقم مفاتيح ١٢ قطعة", "12-Piece Spanner Set", PHOTOS.spanners, 750, { sold90: 74 }],
    ["garage-tool-board", "tools", "لوحة عدة للجراج", "Garage Tool Board", PHOTOS.toolWall, 2400, { inStock: false, sold90: 18 }],
    ["key-holder-set", "extras", "ميدالية وجراب مفتاح", "Key Ring & Fob Case", PHOTOS.keys, 180, { sold90: 260 }],
    ["car-power-bank", "extras", "باور بانك للعربية", "Car Power Bank", PHOTOS.powerBank, 790, { sold90: 88 }],
  ],
});

export const GARAGE = libraryTemplate({
  key: GARAGE_KEY,
  version: 2,
  name: L("جراج", "Garage"),
  description: L(
    "إكسسوارات عربيات: بوستر أوكازيون، اختيارات السواقين، مقارنة، عرض الويك إند ورسايل واتساب. أربع صفحات جاهزة.",
    "Car accessories: a sale poster, drivers’ picks, a comparison, the weekend deal and WhatsApp messages. Four ready pages.",
  ),
  category: "auto",
  sortOrder: 360,
  palette: ["#f2f2f0", "#e4e4e0", "#f2b705", "#121417"],
  colors: {
    primary: "#121417",
    secondary: "#e4e4e0",
    background: "#f2f2f0",
    foreground: "#121417",
    muted: "#585c63",
    border: "#d8d8d3",
    accent: "#f2b705",
  },
  fonts: { heading: "Changa", body: "Changa" },
  radius: 4,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن تورك", "About"), seo: { title: L("عن تورك", "About Torque") }, sections: about },
    {
      slug: "contact",
      name: L("احجز تركيب", "Book a fitting"),
      seo: { title: L("احجز تركيب", "Book a fitting") },
      sections: contactPage(lib, {
        title: L("احجز تركيب", "Book a fitting"),
        text: L("٤٠ شارع الحجاز، مصر الجديدة.", "40 El Hegaz St, Heliopolis."),
        heading: L("ابعت نوع العربية وموديلها ونقولك إيه اللي يركب", "Send your car’s make and model and we tell you what fits"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التركيب والمقاسات والتوصيل.", "Fitting, sizes and delivery."),
        question: L("إزاي أعرف إن القطعة تركب عربيتي؟", "How do I know a part fits my car?"),
        answer: L("ابعتلنا الماركة والموديل وسنة الصنع على واتساب قبل الطلب.", "Send us the make, model and year on WhatsApp before you order."),
      }),
    },
  ],
  demo: DEMO,
});
