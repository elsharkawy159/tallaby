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
    "منتجات مختارة بعناية لكل يوم.": L("شواحن منزلية وإكسسوارات للسيارات الكهربائية.", "Home chargers and accessories for electric cars."),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.whitePort],
    text: {
      "مجموعة الموسم": L("شواحن المنزل", "Home chargers"),
      "صوت أنقى، كل يوم": L("شواحن السيارات الكهربائية وإكسسواراتها", "EV chargers and accessories"),
      "منتجات مختارة بمواصفات واضحة لكل يوم.": L(
        "شواحن حائط وكابلات Type 2 وإكسسوارات للسيارات الكهربائية.",
        "Wall chargers, Type 2 cables and accessories for electric cars.",
      ),
      "تسوق الآن": L("تسوق الشواحن", "Shop chargers"),
      "العروض": L("تواصل معنا", "Contact us"),
      "صورة الحملة": L("كابل شحن موصول بسيارة كهربائية بيضاء", "A charging cable plugged into a white electric car"),
    },
    links: { "/products": [search("شاحن"), "/contact"] },
  }),
  lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": L("شواحن وإكسسوارات لسيارتك", "Chargers and accessories for your car") } }),
  lib("products-rows", {
    text: { "إكسسوارات بأسعار مناسبة": L("للسيارة", "For the car") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 6 }],
  }),
  lib("text-steps", {
    text: {
      "كيف ترجع منتجًا": L("كيف يتم التركيب", "How installation works"),
      "راسلنا على واتساب": L("معاينة", "Survey"),
      "خلال ١٤ يومًا من الاستلام مع رقم الطلب.": L("فحص لوحة الكهرباء ومكان الشحن.", "A check of the panel and the parking spot."),
      "جهّز المنتج": L("السعر", "Quote"),
      "في علبته الأصلية بكل الإكسسوارات.": L("عرض سعر واضح قبل البدء.", "A clear quote before any work."),
      "يستلمه المندوب": L("التركيب", "Install"),
      "من عنوانك خلال يومي عمل.": L("تركيب الشاحن وتجربته على السيارة.", "The charger is installed and tested on the car."),
      "استرداد المبلغ": L("التسليم", "Handover"),
      "بطريقة الدفع نفسها خلال ٥ أيام.": L("شرح طريقة استخدام الشاحن وتطبيقه.", "A walk-through of the charger and its app."),
    },
  }),
  // v4 (2026-11-16, owner): every home has at least one real products grid.
  lib("products-grid", {
    as: "new-in",
    text: { "وصل حديثًا": L("وصل حديثًا", "New in"), "أحدث المنتجات في المتجر.": L("أحدث المنتجات في المتجر.", "The newest products in the store.") },
    links: { "/products": NEW },
    lists: [{ source: "newest", limit: 8 }],
  }),
  lib("service-booking", {
    text: {
      "احجز موعد الفني": L("احجز معاينة", "Book a survey"),
      "تركيب شاشة · حوالي ساعة": L("معاينة شاحن المنزل · نصف ساعة", "Home charger survey · 30 minutes"),
      "مواعيد الزيارات": L("مواعيد المعاينة", "Survey times"),
    },
  }),
  // v5 (2026-11-25, owner): the store's 1st category as a carousel after the booking.
  lib("products-category-carousel", { lists: [undefined, { limit: 4 }] }),
  lib("faq-columns", {
    as: "faq-home",
    text: {
      "أسئلة شائعة": L("أسئلة", "Questions"),
      "كيف أعرف أن طلبي وصل إليكم؟": L("هل يناسب الشاحن سيارتي؟", "Will the charger fit my car?"),
      "ستظهر لك صفحة تأكيد بعد إتمام الطلب.": L(
        "شواحننا بقابس Type 2، المستخدم في أغلب السيارات الكهربائية.",
        "Our chargers use a Type 2 plug, used by most electric cars.",
      ),
      "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("هل أحتاج إلى عداد كهرباء جديد؟", "Do I need a new meter?"),
      "تواصل معنا في أقرب وقت لنراجع طلبك.": L("يختلف ذلك حسب التمديدات الكهربائية في المكان. تواصل معنا لأي سؤال.", "It depends on the wiring at your place. Contact us with any question."),
      "كم يستغرق التوصيل؟": L("كم يستغرق التركيب؟", "How long does installation take?"),
      "تظهر تكلفة الشحن ومدته عند إتمام الطلب.": L(
        "تختلف المدة حسب المكان. تواصل معنا لمعرفة التفاصيل.",
        "It depends on the place. Contact us for details.",
      ),
      "إلى أين يتوفر التوصيل؟": L("أين تتوفر خدمة التركيب؟", "Where is installation available?"),
      "تظهر مناطق التوصيل المتاحة عند إتمام الطلب.": L("تواصل معنا لمعرفة إتاحة التركيب في منطقتك. وتظهر مناطق التوصيل عند إتمام الطلب.", "Contact us to check installation in your area. Delivery areas are shown at checkout."),
      "ما سياسة الاسترجاع؟": L("ما سياسة الاسترجاع؟", "What is your return policy?"),
      "راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.": L("راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.", "See the exchange and return policy page."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن كهربا EV", "About Kahraba EV"), L("شواحن منزلية وإكسسوارات للسيارات الكهربائية.", "Home chargers and accessories for electric cars.")),
  aboutStory(lib, {
    photo: PHOTOS.yellowPortWide,
    alt: L("سيارة صفراء موصولة بكابل شحن", "A yellow car plugged into a charging cable"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("الشحن يبدأ من المنزل", "Charging starts at home"),
    text: L("شواحن حائط ومتنقلة وكابلات وإكسسوارات، بمواصفات واضحة لكل منتج.", "Wall and portable chargers, cables and accessories, with clear specs for every product."),
    more: L("تواصل معنا لأي سؤال عن الشاحن المناسب لسيارتك.", "Contact us with any question about the right charger for your car."),
    button: L("تسوق الشواحن", "Shop chargers"),
    href: search("شاحن"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("شواحن منزلية وإكسسوارات للسيارات الكهربائية.", "Home chargers and accessories for electric cars."),
  categories: [
    ["charging", "الشحن", "Charging", PHOTOS.vanPort],
    ["cabin", "الصالون", "Cabin", PHOTOS.floorMat],
    ["tech", "تكنولوجيا", "Car tech", PHOTOS.camera],
    ["home", "شواحن المنزل", "Home chargers", PHOTOS.greyPort],
    ["on-the-go", "شحن في الطريق", "On-the-go charging", PHOTOS.yellowPort],
  ],
  products: [
    ["smart-home-charger-7kw", "home", "شاحن المنزل الذكي ٧ كيلووات", "Smart Home Charger 7 kW", PHOTOS.greyPort, 28500, { isFeatured: true, rating: 4.9, sold90: 40 }],
    ["type-2-cable-5m", "charging", "كابل شحن Type 2، ٥ متر", "Type 2 Charging Cable, 5 m", PHOTOS.vanPort, 6900, { rating: 4.8, sold90: 72 }],
    ["portable-charger", "on-the-go", "شاحن متنقل للسفر", "Portable Travel Charger", PHOTOS.yellowPort, 14500, { compareAtPrice: 16000, sold90: 31 }],
    ["wall-cable-holster", "charging", "حامل كابل حائط", "Wall Cable Holster", PHOTOS.holster, 1200, { sold90: 58 }],
    ["charging-port-cover", "charging", "غطاء مدخل الشحن", "Charging Port Cover", PHOTOS.whitePortSmall, 350, { sold90: 44 }],
    // v5: a fourth charging product, so the category carousel (the 1st category) shows a full row.
    ["type-2-cable-10m", "charging", "كابل شحن Type 2، ١٠ متر", "Type 2 Charging Cable, 10 m", PHOTOS.yellowPort, 9400, { sold90: 24 }],
    ["rubber-floor-mats", "cabin", "دواسات مطاطية", "Rubber Floor Mats", PHOTOS.floorMat, 950, { sold90: 120 }],
    ["vent-phone-mount", "cabin", "حامل هاتف لفتحة التكييف", "Vent Phone Mount", PHOTOS.ventMount, 480, { isFeatured: true, sold90: 160 }],
    ["dash-camera", "tech", "كاميرا لوحة القيادة", "Dash Camera", PHOTOS.camera, 2400, { rating: 4.6, sold90: 66 }],
    ["car-power-bank", "tech", "بطارية متنقلة للسيارة", "Car Power Bank", PHOTOS.powerBank, 790, { inStock: false, sold90: 38 }],
  ],
});

export const KAHRABA = libraryTemplate({
  key: KAHRABA_KEY,
  version: 6,
  changelog: "Kahraba v5: products by category as a carousel on the home",
  productPage: { thumbs: "side", band: "shelf", extras: ["product-perks"], copy: { reviews: L("آراء مستخدمي الشواحن", "From charger owners"), related: L("إكسسوارات للسيارة", "Accessories for the car") } },
  name: L("كهربا", "Kahraba"),
  description: L(
    "شحن السيارات الكهربائية: شاحن المنزل، خطوات التركيب، حجز معاينة وأسئلة. أربع صفحات جاهزة.",
    "EV charging: home chargers, how installation works, survey booking and questions. Four ready pages.",
  ),
  category: "auto",
  style: ["minimal"],
  sortOrder: 980,
  palette: ["#f5f8fa", "#e3ecf2", "#a5f3fc", "#0891b2"],
  colors: {
    primary: "#0891b2",
    secondary: "#e3ecf2",
    background: "#ffffff",
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
        text: L("تواصل معنا لأي سؤال عن الشواحن.", "Contact us with any question about chargers."),
        heading: L("أرسل طراز سيارتك وعنوانك", "Send your car model and address"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الشواحن والتركيب والطلبات.", "Chargers, installation and orders."),
        question: L("هل يمكنني إرجاع الشاحن؟", "Can I return the charger?"),
        answer: L("راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.", "See the exchange and return policy page."),
      }),
    },
  ],
  demo: DEMO,
});
