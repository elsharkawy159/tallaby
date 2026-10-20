/**
 * Zaki (template 57, smart home and TV; Claude Design "Storefront
 * Templates"): pale green-grey paper, deep green ink, a teal for actions and
 * a warm yellow highlight, Noto Kufi Arabic throughout and 14px corners. An
 * installer's shop: smart TV in an afternoon, what our technicians do, book
 * a technician, installation prices, extend your warranty and questions.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): wall-mounted TVs in empty
 * living rooms, indoor cameras, a smart plug, a smart home set, routers, a
 * smart speaker, a power bank and a charger. No people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const ZAKI_KEY = "zaki";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ZAKI_KEY, getDesign(id)!, { corners: 14, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  tvConsole: pexels(6020432),
  tvLounge: pexels(39338464),
  tv43: pexels(10078142, 900),
  tv55: pexels(6636297, 900),
  smartKit: pexels(29292011, 900),
  smartPlug: pexels(4148576, 900),
  camera: pexels(33104381, 900),
  panCamera: pexels(28940577, 900),
  router: pexels(29711663, 900),
  speaker: pexels(4132542, 900),
  powerBank: pexels(3921705, 900),
  charger: pexels(35921904, 900),
};

const NAME = L("بيت زكي", "Beit Zaki");

const header = lib("header-line", {
  text: {
    "م": L("ز", "Z"),
    "اسم متجرك": NAME,
    "المتجر": L("الأجهزة", "Devices"),
    "العروض": L("البيت الذكي", "Smart home"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("عن بيت زكي", "About"),
  },
  links: { "/products": [SHOP, search("ذكي"), undefined, SHOP, search("ذكي")], "/blog": "/faq" },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك وخد العروض قبل أي حد.": L("نصايح للبيت الذكي وعروض التركيب للمشتركين.", "Smart home tips and installation offers for subscribers."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ بيت زكي. كل الحقوق محفوظة.", "© 2026 Beit Zaki. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن بيت زكي", "About Beit Zaki"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const QUESTIONS = {
  "كيف أعرف أن طلبي وصل إليكم؟": L("التركيب مجاني فعلاً؟", "Is installation really free?"),
  "ستظهر لك صفحة تأكيد وتصلك رسالة، ونتصل بك لتأكيد طلبات الدفع عند الاستلام.": L(
    "أيوه في القاهرة والجيزة مع أي رسيفر أو حامل فوق ٦٠٠ ج.م، وغير كده حسب قايمة الأسعار.",
    "Yes in Cairo and Giza with any TV box or mount over EGP 600; otherwise see the price list.",
  ),
  "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("الفني بيجيب معاه الحامل؟", "Does the technician bring the mount?"),
  "نعم، حتى يتم شحنه. تواصل معنا بأسرع وقت.": L("لو طلبته معانا أيوه، ولو عندك حامل بنركبه برضه.", "If you ordered it from us, yes; if you have your own, we fit that too."),
  "كم يستغرق التوصيل؟": L("التركيب بياخد قد إيه؟", "How long does a visit take?"),
  "القاهرة والجيزة من يوم إلى يومين، وباقي المحافظات من ٢ إلى ٦ أيام.": L(
    "حوالي ساعة للشاشة والرسيفر، وبنمشي بعد ما نتأكد إن كل التطبيقات شغالة.",
    "About an hour for the screen and box, and we leave only once every app works.",
  ),
  "هل التوصيل متاح لكل المحافظات؟": L("بتركبوا على أي حيطة؟", "Can you mount on any wall?"),
  "نعم، نوصل لكل محافظات مصر.": L("أيوه، طوب أو خرسانة أو جبس، وبنخبّي السلك.", "Yes, brick, concrete or plasterboard, and we hide the cable."),
} as const;

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.tvConsole],
    text: {
      "كوليكشن الموسم": L("بنركبهولك", "Installed for you"),
      "صوت أنقى، كل يوم": L("تلفزيون سمارت في ساعتين", "Smart TV in an afternoon"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "بنركب الشاشة ونظبط الرسيفر وندخلك على تطبيقاتك.",
        "We mount the screen, set up the box and sign you in to your apps.",
      ),
      "تسوق الآن": L("احجز تركيب", "Book installation"),
      "العروض": L("تسوق الأجهزة", "Shop devices"),
      "صورة الحملة": L("شاشة على الحيطة فوق ترابيزة خشب", "A wall-mounted TV over a wooden console"),
    },
    links: { "/products": ["/contact", SHOP] },
  }),
  lib("service-cards", {
    text: {
      "خدمات بعد البيع": L("الفنيين بتوعنا بيعملوا إيه", "What our technicians do"),
      "عشان جهازك يفضل شغال زي الجديد.": L("من أول الشاشة على الحيطة لحد آخر تطبيق.", "From the screen on the wall to the last app."),
      "تركيب في البيت": L("تركيب شاشة حائط", "TV wall mounting"),
      "نركّب الشاشة أو الرسيفر ونظبط القنوات.": L("أي حيطة والسلك مستخبي.", "Any wall, cables hidden."),
      "من ٢٥٠ ج.م": L("من ٣٥٠ ج.م", "From EGP 350"),
      "صيانة وإصلاح": L("ظبط الرسيفر", "Box setup"),
      "تغيير بطارية أو شاشة في نفس اليوم.": L("تطبيقات وقنوات وحسابات.", "Apps, channels and accounts."),
      "استبدل القديم": L("فحص الواي فاي", "Wi-Fi check"),
      "جيب جهازك القديم وخد خصم على الجديد.": L("نلاقي الأماكن الضعيفة ونقويها.", "We find the dead spots and fix them."),
      "مجانًا": L("من ٢٠٠ ج.م", "From EGP 200"),
      "سنة أو سنتين زيادة على ضمان الوكيل.": L("سنة أو سنتين زيادة على ضمان الجهاز.", "One or two extra years on top of the device warranty."),
    },
  }),
  lib("service-booking", {
    text: {
      "احجز معاد الفني": L("احجز فني", "Book a technician"),
      "تركيب شاشة · حوالي ساعة": L("تركيب وظبط الشاشة · حوالي ساعة", "TV mounting and setup · about one hour"),
    },
  }),
  lib("service-price-menu", {
    text: {
      "أسعار الخدمات": L("أسعار التركيب", "Installation prices"),
      "الأسعار شاملة قطع الغيار الأصلية والضمان.": L("مجاناً مع أي رسيفر أو حامل فوق ٦٠٠ ج.م.", "Free with any TV box or mount over EGP 600."),
      "الموبايل": L("التركيب", "Mounting"),
      "تغيير بطارية": L("لحد ٥٥ بوصة", "Up to 55 inch"),
      "٦٥٠ ج.م": L("٣٥٠ ج.م", "EGP 350"),
      "تغيير شاشة": L("٦٥ بوصة وأكتر", "65 inch and up"),
      "٢٤٠٠ ج.م": L("٥٠٠ ج.م", "EGP 500"),
      "سوكت الشحن": L("إخفاء السلك في الحيطة", "Cable hidden in the wall"),
      "٤٥٠ ج.م": L("٢٥٠ ج.م", "EGP 250"),
      "الشاشات والبيت": L("الظبط", "Setup"),
      "تركيب حائط": L("رسيفر", "TV box"),
      "٣٥٠ ج.م": L("١٥٠ ج.م", "EGP 150"),
      "ضبط رسيفر": L("ساوند بار", "Sound bar"),
      "١٥٠ ج.م": L("٢٠٠ ج.م", "EGP 200"),
      "السماعات": L("البيت الذكي", "Smart home"),
      "تغيير وسايد": L("كاميرا مراقبة", "Security camera"),
      "١٢٠ ج.م": L("٢٠٠ ج.م", "EGP 200"),
      "تنظيف وفحص": L("فيشة أو لمبة ذكية", "Smart plug or bulb"),
      "٨٠ ج.م": L("٥٠ ج.م", "EGP 50"),
    },
  }),
  lib("service-plans", {
    text: {
      "احمي جهازك أكتر": L("مد الضمان", "Extend your warranty"),
      "إصلاح الأعطال": L("تصليح أو تغيير", "Repair or replace"),
      "فني في البيت": L("زيارة في البيت", "Home visit"),
      "جهاز بديل وقت الصيانة": L("رسيفر بديل وقت التصليح", "Loan box during repair"),
      "كسر الشاشة مرة واحدة": L("حادثة واحدة", "One accident"),
    },
  }),
  lib("faq-columns", {
    as: "faq-home",
    text: {
      "أسئلة شائعة": L("أسئلة", "Questions"),
      ...QUESTIONS,
      "ما طرق الدفع المتاحة؟": L("بتدفع إمتى؟", "When do I pay?"),
      "الدفع عند الاستلام، والبطاقات، والمحافظ الإلكترونية، وإنستاباي.": L(
        "بعد ما الفني يخلص وتتأكد إن كل حاجة شغالة، كاش أو كارت أو إنستاباي.",
        "After the technician finishes and you check everything works: cash, card or InstaPay.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن بيت زكي", "About Beit Zaki"), L("رسيفرات وحوامل وبيت ذكي، بنركبهالك.", "TV boxes, mounts and smart home, installed for you.")),
  aboutStory(lib, {
    photo: PHOTOS.tvLounge,
    alt: L("أوضة معيشة فيها شاشة على الحيطة وسماعات", "A living room with a wall-mounted TV and speakers"),
    eyebrow: L("مدينة نصر", "Nasr City"),
    title: L("الجهاز لوحده مش كفاية", "A device alone is not enough"),
    text: L("بدأنا فنيين تركيب، وكل يوم نلاقي ناس اشترت جهاز حلو ومحدش ظبطهولهم.", "We started as installers, and every day we met people with a great device nobody set up for them."),
    more: L("فبقينا نبيع الجهاز ونركبه ونفضل معاك بالضمان.", "So now we sell the device, install it and stay with you on warranty."),
    button: L("احجز فني", "Book a technician"),
    href: "/contact",
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("رسيفرات وحوامل وبيت ذكي، بنركبهالك.", "TV boxes, mounts and smart home, installed for you."),
  categories: [
    ["tv", "التلفزيون", "TV", PHOTOS.tv43],
    ["smart", "البيت الذكي", "Smart home", PHOTOS.smartKit],
    ["wifi", "الواي فاي", "Wi-Fi", PHOTOS.router],
    ["power", "الطاقة", "Power", PHOTOS.powerBank],
  ],
  products: [
    ["smart-tv-43", "tv", "شاشة سمارت ٤٣ بوصة", "43-inch Smart TV", PHOTOS.tv43, 11900, { isFeatured: true, rating: 4.6, sold90: 60 }],
    ["smart-tv-55", "tv", "شاشة سمارت ٥٥ بوصة", "55-inch Smart TV", PHOTOS.tv55, 18900, { compareAtPrice: 20500, sold90: 34 }],
    ["smart-home-kit", "smart", "باكدج البيت الذكي", "Smart Home Starter Kit", PHOTOS.smartKit, 2450, { isFeatured: true, sold90: 48 }],
    ["wifi-smart-plug", "smart", "فيشة ذكية واي فاي", "Wi-Fi Smart Plug", PHOTOS.smartPlug, 390, { sold90: 150 }],
    ["indoor-camera", "smart", "كاميرا داخلية واي فاي", "Indoor Wi-Fi Camera", PHOTOS.camera, 990, { rating: 4.7, sold90: 90 }],
    ["pan-camera-360", "smart", "كاميرا بتلف ٣٦٠°", "360° Pan Camera", PHOTOS.panCamera, 1290, { compareAtPrice: 1450, sold90: 70 }],
    ["wifi-6-router", "wifi", "راوتر واي فاي 6", "Wi-Fi 6 Router", PHOTOS.router, 2100, { sold90: 55 }],
    ["mini-smart-speaker", "smart", "سبيكر ذكي ميني", "Mini Smart Speaker", PHOTOS.speaker, 1450, { inStock: false, sold90: 20 }],
    ["maggo-10k-power-bank", "power", "باور بانك ماج 10K", "MagGo 10K Power Bank", PHOTOS.powerBank, 1835, { sold90: 40 }],
    ["dual-usb-c-charger", "power", "شاحن USB-C مزدوج", "Dual USB-C Charger", PHOTOS.charger, 390, { compareAtPrice: 460, sold90: 210 }],
  ],
});

export const ZAKI = libraryTemplate({
  key: ZAKI_KEY,
  version: 1,
  name: L("زكي", "Zaki"),
  description: L(
    "البيت الذكي والتلفزيون مع التركيب: خدمات الفنيين، احجز فني، أسعار التركيب ومد الضمان. أربع صفحات جاهزة.",
    "Smart home and TV with installation: technician services, book a visit, installation prices and extended warranty. Four ready pages.",
  ),
  category: "electronics",
  sortOrder: 570,
  palette: ["#f5f7f6", "#e3ebe7", "#fcd34d", "#0f766e"],
  colors: {
    primary: "#0f766e",
    secondary: "#e3ebe7",
    background: "#f5f7f6",
    foreground: "#13221c",
    muted: "#4d5c55",
    border: "#d3ddd8",
    accent: "#fcd34d",
  },
  fonts: { heading: "Noto Kufi Arabic", body: "Noto Kufi Arabic" },
  radius: 14,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن بيت زكي", "About"), seo: { title: L("عن بيت زكي", "About Beit Zaki") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("تركيب مجاني في القاهرة والجيزة.", "Free installation in Cairo and Giza."),
        heading: L("اسأل عن تركيب أو جهاز", "Ask about installation or a device"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التركيب والضمان والتوصيل.", "Installation, warranty and delivery."),
        question: L("الضمان بيغطي التركيب؟", "Does the warranty cover installation?"),
        answer: L("أيوه، لو الحامل وقع أو السلك فك خلال سنة بنرجعلك ببلاش.", "Yes, if the mount slips or a cable comes loose within a year we come back for free."),
      }),
    },
  ],
  demo: DEMO,
});
