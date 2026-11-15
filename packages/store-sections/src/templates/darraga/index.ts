/**
 * Darraga (template 93, city cycling; Claude Design "Storefront
 * Templates"): pale sage paper, a burnt orange for actions and a lime
 * highlight, Readex Pro throughout and 10px corners. A bike shop with a
 * workshop in Zamalek: a split opening, service in a day, workshop prices,
 * essentials before your first ride and where to come by. Built from
 * section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): parked city bikes,
 * helmets on a bar and on handlebars, lamps, a bell, a rear rack and a
 * bike shop floor. No riders, no hands, no brand logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const DARRAGA_KEY = "darraga";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(DARRAGA_KEY, getDesign(id)!, { corners: 10, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  orangeBikes: pexels(7463837),
  orangeBikesSmall: pexels(7463837, 900),
  redBike: pexels(38119894, 900),
  shopFloor: pexels(11075610),
  helmetsBars: pexels(12956080, 900),
  helmetsWall: pexels(37625583, 900),
  headlight: pexels(30557807, 900),
  ledLamp: pexels(17774654, 900),
  rearRack: pexels(31032854, 900),
  bell: pexels(19335817, 900),
  pack: pexels(12220945, 900),
};

const NAME = L("عجلة بايكس", "Darraga Bikes");

const header = lib("header-ruled", {
  text: { "م": L("ع", "D"), "اسم متجرك": NAME, "المتجر": L("الدراجات والأدوات", "Bikes & gear"), "العروض": L("الأكثر مبيعاً", "Best sellers") },
  links: { "/products": [SHOP, BEST, SHOP, SHOP] },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك ليصلك جديدنا أولًا.": L("اشترك ليصلك جديد الدراجات والإكسسوارات.", "Subscribe for new bikes and accessories."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ عجلة بايكس. كل الحقوق محفوظة.", "© 2026 Darraga Bikes. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.orangeBikes],
    text: {
      "مجموعة الموسم": L("دراجات المدينة", "City bikes"),
      "صوت أنقى، كل يوم": L("دراجات وخوذ وإكسسوارات", "Bikes, helmets and accessories"),
      "منتجات مختارة بمواصفات واضحة لكل يوم.": L(
        "خوذ وأضواء وحقائب ورفوف لدراجات المدينة.",
        "Helmets, lights, bags and racks for city bikes.",
      ),
      "تسوق الآن": L("تسوق الأدوات", "Shop gear"),
      "العروض": L("الدراجات", "Bikes"),
      "صورة الحملة": L("دراجتا مدينة برتقاليتان على الرصيف", "Two orange city bikes on the pavement"),
    },
    links: { "/products": [SHOP, search("عجلة")] },
  }),
  lib("categories-circles", { text: { "ما الذي تبحث عنه؟": L("ما الذي تبحث عنه؟", "What are you looking for?") } }),
  lib("products-rows", {
    text: { "إكسسوارات بأسعار مناسبة": L("أساسيات الدراجة", "Bike essentials") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 6 }],
  }),
  lib("service-price-menu", {
    text: {
      "أسعار الخدمات": L("أسعار الورشة", "Workshop prices"),
      "الأسعار شاملة قطع الغيار الأصلية والضمان.": L("يظهر السعر قبل بدء العمل، وتُحسب القطع منفصلة.", "You get the price before any work; parts are charged separately."),
      "الهواتف": L("صيانة", "Service"),
      "تغيير بطارية": L("ضبط أساسي", "Basic tune-up"),
      "٦٥٠ ج.م": L("٣٠٠ ج.م", "EGP 300"),
      "تغيير شاشة": L("صيانة كاملة", "Full service"),
      "٢٤٠٠ ج.م": L("٦٥٠ ج.م", "EGP 650"),
      "منفذ الشحن": L("تنظيف وتزييت السلسلة", "Chain clean and lube"),
      "٤٥٠ ج.م": L("١٢٠ ج.م", "EGP 120"),
      "الشاشات والمنزل": L("تصليح", "Repairs"),
      "تركيب حائط": L("إطار مثقوب", "Flat tyre"),
      "٣٥٠ ج.م": L("٨٠ ج.م", "EGP 80"),
      "ضبط جهاز الاستقبال": L("وسائد الفرامل", "Brake pads"),
      "١٥٠ ج.م": L("١٨٠ ج.م", "EGP 180"),
      "السماعات": L("تركيب", "Fitting"),
      "تغيير وسائد الأذن": L("تركيب ضوء أمامي وخلفي", "Front and rear light fitting"),
      "١٢٠ ج.م": L("٦٠ ج.م", "EGP 60"),
      "تنظيف وفحص": L("تركيب حامل أو رف", "Mount or rack fitting"),
      "٨٠ ج.م": L("٥٠ ج.م", "EGP 50"),
    },
  }),
  lib("team-branches", {
    text: {
      "الفروع": L("الورشة", "Workshop"),
      "تفضّل بزيارتنا": L("تفضّل بزيارتنا", "Visit us"),
      "فرع الدقي": L("الورشة، الزمالك", "Workshop, Zamalek"),
      "٢٤ شارع التحرير، الدقي": L("شارع حسن صبري، الزمالك", "Hassan Sabry St, Zamalek"),
      "يوميًا من ١٢ ظهرًا حتى ١١ م": L("يوميًا من ٩ ص حتى ٩ م", "Daily, 9 am – 9 pm"),
      "فرع مدينة نصر": L("نقطة استلام المعادي", "Maadi pick-up point"),
      "سيتي ستارز، الدور الأول": L("شارع ٩، المعادي", "Road 9, Maadi"),
      "يوميًا من ١٠ ص حتى ١٠ م": L("يوميًا من ١٠ ص حتى ٨ م", "Daily, 10 am – 8 pm"),
      "فرع المعادي": L("نقطة استلام التجمع", "New Cairo pick-up point"),
      "شارع ٩، المعادي": L("شارع التسعين، التجمع الخامس", "90th St, Fifth Settlement"),
      "السبت – الخميس، ١٢ – ١٠ م": L("السبت – الخميس، ١٢ – ٨ م", "Sat – Thu, 12 – 8 pm"),
    },
    links: { "https://maps.google.com": "https://maps.google.com/" },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن عجلة بايكس", "About Darraga Bikes"), L("دراجات مدينة وخوذ وإكسسوارات.", "City bikes, helmets and accessories.")),
  aboutStory(lib, {
    photo: PHOTOS.shopFloor,
    alt: L("دراجات معروضة داخل المتجر", "Bikes on display inside the shop"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("دراجات للتنقل في المدينة", "Bikes for getting around the city"),
    text: L(
      "نختار دراجات وخوذًا وأضواء وحقائب للتنقل اليومي، ونعرض مواصفات كل منتج بوضوح.",
      "We pick bikes, helmets, lights and bags for daily rides, with clear specs for every product.",
    ),
    more: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
    button: L("تسوق الأدوات", "Shop gear"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("دراجات مدينة وخوذ وإكسسوارات.", "City bikes, helmets and accessories."),
  categories: [
    ["bikes", "دراجات", "Bikes", PHOTOS.redBike],
    ["helmets", "خوذ", "Helmets", PHOTOS.helmetsBars],
    ["gear", "أضواء وأدوات", "Lights & gear", PHOTOS.headlight],
    ["racks", "رفوف وحوامل", "Racks & carriers", PHOTOS.rearRack],
    ["bells", "أجراس", "Bells", PHOTOS.bell],
    ["bags", "حقائب", "Bags", PHOTOS.pack],
  ],
  products: [
    ["city-helmet", "helmets", "خوذة مدينة", "City Helmet", PHOTOS.helmetsBars, 1450, { isFeatured: true, rating: 4.8, sold90: 96 }],
    ["light-road-helmet", "helmets", "خوذة طريق خفيفة", "Light Road Helmet", PHOTOS.helmetsWall, 1850, { compareAtPrice: 2100, sold90: 40 }],
    ["front-headlight", "gear", "كشاف أمامي", "Front Headlight", PHOTOS.headlight, 380, { sold90: 120 }],
    ["classic-led-lamp", "gear", "كشاف LED كلاسيكي", "Classic LED Lamp", PHOTOS.ledLamp, 450, { sold90: 64 }],
    ["rear-rack-reflector", "racks", "رف خلفي بعاكس", "Rear Rack with Reflector", PHOTOS.rearRack, 690, { sold90: 38 }],
    ["brass-bell", "bells", "جرس نحاس", "Brass Bell", PHOTOS.bell, 150, { sold90: 150 }],
    ["commuter-pack", "bags", "حقيبة تنقل ٢٠ لتر", "Commuter Pack 20 L", PHOTOS.pack, 1650, { sold90: 44 }],
    ["orange-city-bike", "bikes", "دراجة مدينة برتقالية", "Orange City Bike", PHOTOS.orangeBikesSmall, 14500, { isFeatured: true, rating: 4.9, sold90: 22 }],
    ["red-step-through", "bikes", "دراجة حمراء بإطار منخفض", "Red Step-Through Bike", PHOTOS.redBike, 12900, { compareAtPrice: 13900, sold90: 18 }],
  ],
});

export const DARRAGA = libraryTemplate({
  key: DARRAGA_KEY,
  version: 3,
  changelog: "Darraga v3: categories after the hero, gear before the workshop, one price list",
  productPage: { thumbs: "side", band: "shelf", extras: ["product-perks"], copy: { reviews: L("آراء راكبي الدراجات", "From the riders"), related: L("إكسسوارات أخرى لدراجتك", "More for your bike") } },
  name: L("عجلة", "Darraga"),
  description: L(
    "دراجات وورشة: أساسيات الدراجة، أسعار الورشة وعنوان الورشة. أربع صفحات جاهزة.",
    "Bikes and a workshop: first-ride essentials, workshop prices and where to find us. Four ready pages.",
  ),
  category: "sports",
  style: ["bold"],
  sortOrder: 930,
  palette: ["#f5f6f2", "#e6e8df", "#a3e635", "#c2410c"],
  colors: {
    primary: "#c2410c",
    secondary: "#e6e8df",
    background: "#ffffff",
    foreground: "#1b1f16",
    muted: "#575d4f",
    border: "#d5d9cb",
    accent: "#a3e635",
  },
  fonts: { heading: "Readex Pro", body: "Readex Pro" },
  radius: 10,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن عجلة", "About"), seo: { title: L("عن عجلة بايكس", "About Darraga Bikes") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("شارع حسن صبري، الزمالك. يوميًا من ٩ ص حتى ٩ م.", "Hassan Sabry St, Zamalek. Daily, 9 am – 9 pm."),
        heading: L("اسأل عن صيانة أو مقاس", "Ask about a service or a size"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الورشة والمقاسات والطلب.", "Workshop, sizes and ordering."),
        question: L("كيف أختار مقاس الدراجة؟", "How do I choose a bike size?"),
        answer: L("مقاس الإطار مذكور في وصف كل دراجة. لأي سؤال، تواصل معنا.", "Each bike lists its frame size. For any question, contact us."),
      }),
    },
  ],
  demo: DEMO,
});
