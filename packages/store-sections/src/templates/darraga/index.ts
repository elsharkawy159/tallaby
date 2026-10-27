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
  text: { "م": L("ع", "D"), "اسم متجرك": NAME, "المتجر": L("العجل والأدوات", "Bikes & gear"), "العروض": L("الأكثر مبيعاً", "Best sellers") },
  links: { "/products": [SHOP, BEST, SHOP, SHOP] },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك وخد العروض قبل أي حد.": L("مواعيد مشاوير الجمعة وعروض الورشة أول بأول.", "Friday ride dates and workshop offers as they come."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ عجلة بايكس. كل الحقوق محفوظة.", "© 2026 Darraga Bikes. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.orangeBikes],
    text: {
      "كوليكشن الموسم": L("لف المدينة", "Ride the city"),
      "صوت أنقى، كل يوم": L("روح الشغل بالعجلة", "Ride to work, skip the traffic"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "خوذ ونور وشنط متجربة في شوارع القاهرة. أول صيانة ببلاش، وقسّط على ١٢ شهر.",
        "Helmets, lights and packs tested on Cairo streets. Free first service, and pay over 12 months.",
      ),
      "تسوق الآن": L("تسوق الأدوات", "Shop gear"),
      "العروض": L("العجل", "Bikes"),
      "صورة الحملة": L("عجلتين مدينة برتقالي على الرصيف", "Two orange city bikes on the pavement"),
    },
    links: { "/products": [SHOP, search("عجلة")] },
  }),
  lib("categories-circles", { text: { "بتدوّر على إيه؟": L("محتاج إيه للمشوار؟", "What does your ride need?") } }),
  lib("products-rows", {
    text: { "إكسسوارات بسعر حلو": L("قبل أول مشوار", "Before your first ride") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 5 }],
  }),
  lib("service-price-menu", {
    text: {
      "أسعار الخدمات": L("أسعار الورشة", "Workshop prices"),
      "الأسعار شاملة قطع الغيار الأصلية والضمان.": L("السعر بيوصلك قبل الشغل، والقطع بتتحسب لوحدها.", "You get the price before any work; parts are charged separately."),
      "الموبايل": L("صيانة", "Service"),
      "تغيير بطارية": L("ظبط عادي", "Basic tune-up"),
      "٦٥٠ ج.م": L("٣٠٠ ج.م", "EGP 300"),
      "تغيير شاشة": L("صيانة كاملة", "Full service"),
      "٢٤٠٠ ج.م": L("٦٥٠ ج.م", "EGP 650"),
      "سوكت الشحن": L("تنظيف وتشحيم الجنزير", "Chain clean and lube"),
      "٤٥٠ ج.م": L("١٢٠ ج.م", "EGP 120"),
      "الشاشات والبيت": L("تصليح", "Repairs"),
      "تركيب حائط": L("كاوتش مخروم", "Flat tyre"),
      "٣٥٠ ج.م": L("٨٠ ج.م", "EGP 80"),
      "ضبط رسيفر": L("تيل فرامل", "Brake pads"),
      "١٥٠ ج.م": L("١٨٠ ج.م", "EGP 180"),
      "السماعات": L("تركيب", "Fitting"),
      "تغيير وسايد": L("تركيب كشاف ونور خلفي", "Front and rear light fitting"),
      "١٢٠ ج.م": L("٦٠ ج.م", "EGP 60"),
      "تنظيف وفحص": L("تركيب حامل أو رف", "Mount or rack fitting"),
      "٨٠ ج.م": L("٥٠ ج.م", "EGP 50"),
    },
  }),
  lib("team-branches", {
    text: {
      "الفروع": L("الورشة", "Workshop"),
      "زورنا": L("عدّي علينا", "Come by"),
      "فرع الدقي": L("الورشة، الزمالك", "Workshop, Zamalek"),
      "٢٤ شارع التحرير، الدقي": L("شارع حسن صبري، الزمالك", "Hassan Sabry St, Zamalek"),
      "يوميًا من ١٢ الضهر لـ ١١ م": L("يوميًا من ٩ ص لـ ٩ م", "Daily, 9 am – 9 pm"),
      "فرع مدينة نصر": L("نقطة استلام المعادي", "Maadi pick-up point"),
      "سيتي ستارز، الدور الأول": L("شارع ٩، المعادي", "Road 9, Maadi"),
      "يوميًا من ١٠ ص لـ ١٠ م": L("يوميًا من ١٠ ص لـ ٨ م", "Daily, 10 am – 8 pm"),
      "فرع المعادي": L("نقطة استلام التجمع", "New Cairo pick-up point"),
      "شارع ٩، المعادي": L("شارع التسعين، التجمع الخامس", "90th St, Fifth Settlement"),
      "السبت – الخميس، ١٢ – ١٠ م": L("السبت – الخميس، ١٢ – ٨ م", "Sat – Thu, 12 – 8 pm"),
    },
    links: { "https://maps.google.com": "https://maps.google.com/" },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن عجلة بايكس", "About Darraga Bikes"), L("محل عجل وورشة في الزمالك.", "A bike shop and workshop in Zamalek.")),
  aboutStory(lib, {
    photo: PHOTOS.shopFloor,
    alt: L("عجل معروضة جوه المحل", "Bikes on display inside the shop"),
    eyebrow: L("الزمالك", "Zamalek"),
    title: L("بنروح الشغل بالعجلة من ٢٠١٦", "Riding to work since 2016"),
    text: L(
      "بدأنا جروب مشاوير كل جمعة، وبعدين فتحنا الورشة عشان نصلّح عجل أصحابنا.",
      "We started a Friday ride group, then opened the workshop to fix our friends’ bikes.",
    ),
    more: L("النهارده بنبيع عجل وأدوات متجربة في شوارع القاهرة.", "Today we sell bikes and gear tested on Cairo streets."),
    button: L("تسوق الأدوات", "Shop gear"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("عجل مدينة وخوذ وورشة في الزمالك.", "City bikes, helmets and a workshop in Zamalek."),
  categories: [
    ["bikes", "عجل", "Bikes", PHOTOS.redBike],
    ["helmets", "خوذ", "Helmets", PHOTOS.helmetsBars],
    ["gear", "نور وأدوات", "Lights & gear", PHOTOS.headlight],
  ],
  products: [
    ["city-helmet", "helmets", "خوذة مدينة", "City Helmet", PHOTOS.helmetsBars, 1450, { isFeatured: true, rating: 4.8, sold90: 96 }],
    ["light-road-helmet", "helmets", "خوذة طريق خفيفة", "Light Road Helmet", PHOTOS.helmetsWall, 1850, { compareAtPrice: 2100, sold90: 40 }],
    ["front-headlight", "gear", "كشاف أمامي", "Front Headlight", PHOTOS.headlight, 380, { sold90: 120 }],
    ["classic-led-lamp", "gear", "كشاف LED كلاسيك", "Classic LED Lamp", PHOTOS.ledLamp, 450, { sold90: 64 }],
    ["rear-rack-reflector", "gear", "رف خلفي بعاكس", "Rear Rack with Reflector", PHOTOS.rearRack, 690, { sold90: 38 }],
    ["brass-bell", "gear", "جرس نحاس", "Brass Bell", PHOTOS.bell, 150, { sold90: 150 }],
    ["commuter-pack", "gear", "شنطة مشاوير ٢٠ لتر", "Commuter Pack 20 L", PHOTOS.pack, 1650, { sold90: 44 }],
    ["orange-city-bike", "bikes", "عجلة سيتي برتقالي", "Orange City Bike", PHOTOS.orangeBikesSmall, 14500, { isFeatured: true, rating: 4.9, sold90: 22 }],
    ["red-step-through", "bikes", "عجلة حمرا بدون عارضة", "Red Step-Through Bike", PHOTOS.redBike, 12900, { compareAtPrice: 13900, sold90: 18 }],
  ],
});

export const DARRAGA = libraryTemplate({
  key: DARRAGA_KEY,
  version: 3,
  changelog: "Darraga v3: categories after the hero, gear before the workshop, one price list",
  productPage: { thumbs: "side", band: "shelf", extras: ["product-perks"], copy: { back: L("رجوع للدراجات", "Back to the bikes"), reviews: L("رأي الراكبين", "From the riders"), related: L("جهّز قبل أول مشوار", "Gear up for your first ride") } },
  name: L("عجلة", "Darraga"),
  description: L(
    "عجل وورشة: أساسيات أول مشوار، أسعار الورشة وعنوان الورشة. أربع صفحات جاهزة.",
    "Bikes and a workshop: first-ride essentials, workshop prices and where to find us. Four ready pages.",
  ),
  category: "sports",
  sortOrder: 930,
  palette: ["#f5f6f2", "#e6e8df", "#a3e635", "#c2410c"],
  colors: {
    primary: "#c2410c",
    secondary: "#e6e8df",
    background: "#f5f6f2",
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
        text: L("شارع حسن صبري، الزمالك. يوميًا من ٩ ص لـ ٩ م.", "Hassan Sabry St, Zamalek. Daily, 9 am – 9 pm."),
        heading: L("احجز صيانة أو اسأل عن مقاس", "Book a service or ask about a size"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الورشة والتقسيط والتوصيل.", "Workshop, instalments and delivery."),
        question: L("أول صيانة ببلاش فعلاً؟", "Is the first service really free?"),
        answer: L("أيوه، أي عجلة من عندنا ليها ظبط ببلاش خلال أول ٣ شهور.", "Yes, every bike from us gets a free tune-up within the first 3 months."),
      }),
    },
  ],
  demo: DEMO,
});
