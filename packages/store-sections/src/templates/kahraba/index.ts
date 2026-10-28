/**
 * Kahraba (template 98, EV charging and gear; Claude Design "Storefront
 * Templates"): cool blue-white paper, a deep ink for type and a cyan for
 * actions, Readex Pro throughout and 14px corners. A home-charging shop:
 * wake up to a full battery, how installation works, book a survey, extend
 * the charger warranty, accessories for the car and questions. Built from
 * section library designs (`fromLibrary`).
 *
 * As in the design, the demo has few EV products (chargers and cables);
 * the rest are ordinary car accessories.
 *
 * Photos: Pexels, each checked by eye (2026-10-21): charging ports with
 * the cable plugged in, a charger holster, rubber mats, an action camera,
 * a vent mount and a power bank. No people, no hands, no car badges and no
 * charger brands.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const KAHRABA_KEY = "kahraba";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(KAHRABA_KEY, getDesign(id)!, { corners: 14, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  whitePort: pexels(3846205),
  whitePortSmall: pexels(3846205, 900),
  yellowPort: pexels(32472668, 900),
  yellowPortWide: pexels(32472668),
  vanPort: pexels(18555543, 900),
  greyPort: pexels(9799743, 900),
  holster: pexels(9799738, 900),
  floorMat: pexels(28055130, 900),
  camera: pexels(2294894, 900),
  ventMount: pexels(13536013, 900),
  powerBank: pexels(3921704, 900),
};

const NAME = L("كهربا EV", "Kahraba EV");

const header = lib("header-line", {
  text: {
    "م": L("ك", "K"),
    "اسم متجرك": NAME,
    "العروض": L("الشواحن", "Chargers"),
    "المدونة": L("الأسئلة", "FAQ"),
  },
  links: { "/products": [undefined, search("شاحن"), undefined, undefined, search("شاحن")], "/blog": "/faq" },
});

const footer = lib("footer-ruled", {
  text: {
    "م": L("ك", "K"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ كهربا EV. كل الحقوق محفوظة.", "© 2026 Kahraba EV. All rights reserved."),
    "منتجات أصلية بضمان، توصلك لحد البيت.": L("شواحن بيت وإكسسوارات للعربيات الكهربا، بضمان سنتين.", "Home chargers and accessories for electric cars, with a 2-year warranty."),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.whitePort],
    text: {
      "كوليكشن الموسم": L("اشحن في البيت", "Charge at home"),
      "صوت أنقى، كل يوم": L("اصحى والبطارية مليانة", "Wake up to a full battery"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "شواحن حائط بيركبها كهربائيين معتمدين، بضمان سنتين.",
        "Wall chargers installed by certified electricians, with a 2-year warranty.",
      ),
      "تسوق الآن": L("تسوق الشواحن", "Shop chargers"),
      "العروض": L("احجز معاينة", "Book a survey"),
      "صورة الحملة": L("كابل شحن موصول بعربية كهربا بيضا", "A charging cable plugged into a white electric car"),
    },
    links: { "/products": [search("شاحن"), "/contact"] },
  }),
  lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": L("اشحن وجهّز عربيتك", "Charge and kit out your car") } }),
  lib("products-rows", {
    text: { "إكسسوارات بسعر حلو": L("للعربية", "For the car") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 6 }],
  }),
  lib("text-steps", {
    text: {
      "إزاي ترجّع منتج": L("التركيب بيمشي إزاي", "How installation works"),
      "ابعتلنا على واتساب": L("معاينة", "Survey"),
      "خلال ١٤ يوم من الاستلام مع رقم الطلب.": L("بنشوف لوحة الكهربا والجراج.", "We check your panel and parking."),
      "جهّز المنتج": L("السعر", "Quote"),
      "في علبته الأصلية بكل الإكسسوارات.": L("سعر ثابت يوصلك على واتساب.", "A fixed price, sent on WhatsApp."),
      "المندوب يستلم": L("التركيب", "Install"),
      "خلال يومين شغل من عنوانك.": L("نص يوم، ومتجرب على عربيتك.", "Half a day, tested on your car."),
      "فلوسك ترجع": L("التسليم", "Handover"),
      "بنفس طريقة الدفع خلال ٥ أيام.": L("بنعلّمك التطبيق وبتستلم شهادة الضمان.", "We show you the app and hand over the warranty card."),
    },
  }),
  lib("service-booking", {
    text: {
      "احجز معاد الفني": L("احجز معاينة", "Book a survey"),
      "تركيب شاشة · حوالي ساعة": L("معاينة شاحن البيت · نص ساعة", "Home charger survey · 30 minutes"),
      "مواعيد الزيارات": L("مواعيد المعاينة", "Survey times"),
    },
  }),
  lib("faq-columns", {
    as: "faq-home",
    text: {
      "أسئلة شائعة": L("أسئلة", "Questions"),
      "كيف أعرف أن طلبي وصل إليكم؟": L("الشاحن يناسب عربيتي؟", "Will the charger fit my car?"),
      "ستظهر لك صفحة تأكيد وتصلك رسالة، ونتصل بك لتأكيد طلبات الدفع عند الاستلام.": L(
        "شواحننا بفيشة تايب ٢، ودي اللي في أغلب العربيات الكهربا في مصر.",
        "Our chargers use a Type 2 plug, which most electric cars in Egypt have.",
      ),
      "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("محتاج عداد كهربا جديد؟", "Do I need a new meter?"),
      "نعم، حتى يتم شحنه. تواصل معنا بأسرع وقت.": L("غالبًا لأ. بنحدد ده في المعاينة ونقولك قبل أي حاجة.", "Usually not. We check at the survey and tell you first."),
      "كم يستغرق التوصيل؟": L("التركيب بياخد قد إيه؟", "How long does installation take?"),
      "القاهرة والجيزة من يوم إلى يومين، وباقي المحافظات من ٢ إلى ٦ أيام.": L(
        "نص يوم في أغلب البيوت، ومنجرّب الشحن على عربيتك قبل ما نمشي.",
        "Half a day in most homes, and we test charging on your car before we leave.",
      ),
      "هل التوصيل متاح لكل المحافظات؟": L("بتركبوا برة القاهرة؟", "Do you install outside Cairo?"),
      "نعم، نوصل لكل محافظات مصر.": L("التركيب في القاهرة والجيزة، والإكسسوارات بتتشحن لكل المحافظات.", "Installation is in Cairo and Giza; accessories ship everywhere."),
      "ما سياسة الاسترجاع؟": L("الضمان بيغطي إيه؟", "What does the warranty cover?"),
      "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": L(
        "القطع والمصنعية لمدة سنتين، وتقدر تمده لـ ٤ أو ٦ سنين.",
        "Parts and labour for two years, extendable to four or six.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن كهربا EV", "About Kahraba EV"), L("شواحن بيت وإكسسوارات للعربيات الكهربا.", "Home chargers and accessories for electric cars.")),
  aboutStory(lib, {
    photo: PHOTOS.yellowPortWide,
    alt: L("عربية صفرا موصولة بكابل شحن", "A yellow car plugged into a charging cable"),
    eyebrow: L("القاهرة", "Cairo"),
    title: L("الشحن يبقى من البيت", "Charging starts at home"),
    text: L("فريقنا كهربائيين معتمدين، بيركبوا الشاحن ويجربوه على عربيتك في نفس اليوم.", "Our team are certified electricians who install the charger and test it on your car the same day."),
    more: L("وكل شاحن عليه ضمان سنتين، وتقدر تمده لحد ٦ سنين.", "Every charger has a two-year warranty, extendable to six."),
    button: L("تسوق الشواحن", "Shop chargers"),
    href: search("شاحن"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("شواحن بيت وإكسسوارات للعربيات الكهربا.", "Home chargers and accessories for electric cars."),
  categories: [
    ["charging", "الشحن", "Charging", PHOTOS.vanPort],
    ["cabin", "الصالون", "Cabin", PHOTOS.floorMat],
    ["tech", "تكنولوجيا", "Car tech", PHOTOS.camera],
    ["home", "شواحن البيت", "Home chargers", PHOTOS.greyPort],
    ["on-the-go", "شحن في الطريق", "On-the-go charging", PHOTOS.yellowPort],
  ],
  products: [
    ["smart-home-charger-7kw", "home", "شاحن البيت الذكي ٧ كيلووات", "Smart Home Charger 7 kW", PHOTOS.greyPort, 28500, { isFeatured: true, rating: 4.9, sold90: 40 }],
    ["type-2-cable-5m", "charging", "كابل شحن تايب ٢، ٥ متر", "Type 2 Charging Cable, 5 m", PHOTOS.vanPort, 6900, { rating: 4.8, sold90: 72 }],
    ["portable-charger", "on-the-go", "شاحن متنقل للسفر", "Portable Travel Charger", PHOTOS.yellowPort, 14500, { compareAtPrice: 16000, sold90: 31 }],
    ["wall-cable-holster", "charging", "حامل كابل حائط", "Wall Cable Holster", PHOTOS.holster, 1200, { sold90: 58 }],
    ["charging-port-cover", "charging", "غطا مدخل الشحن", "Charging Port Cover", PHOTOS.whitePortSmall, 350, { sold90: 44 }],
    ["rubber-floor-mats", "cabin", "دواسات كاوتش", "Rubber Floor Mats", PHOTOS.floorMat, 950, { sold90: 120 }],
    ["vent-phone-mount", "cabin", "حامل موبايل للتكييف", "Vent Phone Mount", PHOTOS.ventMount, 480, { isFeatured: true, sold90: 160 }],
    ["dash-camera", "tech", "كاميرا تابلوه", "Dash Camera", PHOTOS.camera, 2400, { rating: 4.6, sold90: 66 }],
    ["car-power-bank", "tech", "باور بانك للعربية", "Car Power Bank", PHOTOS.powerBank, 790, { inStock: false, sold90: 38 }],
  ],
});

export const KAHRABA = libraryTemplate({
  key: KAHRABA_KEY,
  version: 3,
  changelog: "Kahraba v3: categories after the hero, chargers before the install, one service block",
  productPage: { thumbs: "side", band: "shelf", extras: ["product-perks"], copy: { reviews: L("رأي أصحاب الشواحن", "From charger owners"), related: L("إكسسوارات للعربية", "Accessories for the car") } },
  name: L("كهربا", "Kahraba"),
  description: L(
    "شحن العربيات الكهربا: شاحن البيت، خطوات التركيب، احجز معاينة وأسئلة. أربع صفحات جاهزة.",
    "EV charging: home chargers, how installation works, survey booking and questions. Four ready pages.",
  ),
  category: "auto",
  sortOrder: 980,
  palette: ["#f5f8fa", "#e3ecf2", "#a5f3fc", "#0891b2"],
  colors: {
    primary: "#0891b2",
    secondary: "#e3ecf2",
    background: "#f5f8fa",
    foreground: "#0b1b26",
    muted: "#4b5d6a",
    border: "#cfdde8",
    accent: "#a5f3fc",
  },
  fonts: { heading: "Readex Pro", body: "Readex Pro" },
  radius: 14,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن كهربا EV", "About"), seo: { title: L("عن كهربا EV", "About Kahraba EV") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("التركيب في القاهرة والجيزة.", "Installation in Cairo and Giza."),
        heading: L("ابعت موديل العربية وعنوانك", "Send your car model and address"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الشواحن والتركيب والضمان.", "Chargers, installation and warranty."),
        question: L("أقدر أرجّع الشاحن؟", "Can I return the charger?"),
        answer: L("أيوه خلال ١٤ يوم لو لسه متركبش وفي علبته.", "Yes, within 14 days if it is not installed and still boxed."),
      }),
    },
  ],
  demo: DEMO,
});
