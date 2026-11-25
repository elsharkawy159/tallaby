/**
 * Basecamp (template 35, camping and outdoor; Claude Design "Storefront
 * Templates"): sand paper, a deep pine for actions and a desert amber
 * highlight, Changa throughout and 6px corners. A desert outfitter: a
 * camp poster, the aisles, trail picks, the gear brands, how renting
 * works, why campers come back, what the press says and a big sign-up. Built from section
 * library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): tents on sand and in a
 * canyon, a desert camp, backpacks and a gear flat lay. No people and no
 * brand marks.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const BASECAMP_KEY = "basecamp";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(BASECAMP_KEY, getDesign(id)!, { corners: 6, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  desertCamp: pexels(10434667),
  desertCampSmall: pexels(10434667, 900),
  whiteSandTent: pexels(18353868, 900),
  canyonTents: pexels(30069036),
  canyonTentsSmall: pexels(30069036, 900),
  packOnRock: pexels(30829443, 900),
  daypack: pexels(1178525, 900),
  flatLay: pexels(821750, 900),
  bottle: pexels(8032842, 900),
  powerBank: pexels(3921704, 900),
  watch: pexels(13007642, 900),
};

const NAME = L("وادي أوتدور", "Wadi Outdoor");

const BRANDS = ["Dune Works", "Siwa Trail", "Nomad Co.", "Red Sea Gear", "Sinai Peak", "Oasis", "Camel Pack"];

const header = lib("header-brand-bar", {
  text: { "م": L("و", "W"), "اسم متجرك": NAME, "ابحث في المتجر": L("ابحث عن خيمة، حقيبة، كشاف…", "Search tents, packs, lamps…") },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك ليصلك جديدنا أولًا.": L("اشترك ليصلك جديد معدات التخييم.", "Subscribe for new camping gear."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ وادي أوتدور. كل الحقوق محفوظة.", "© 2026 Wadi Outdoor. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-poster", {
    photo: [undefined, undefined, PHOTOS.desertCamp],
    text: {
      "مجموعة الموسم": L("موسم التخييم", "Camping season"),
      "وصل حديثًا": L("معدات للصحراء والجبل", "Gear for desert and mountain"),
      "صورة الحملة": L("مخيم في الصحراء ليلًا", "A desert camp at night"),
      "مجموعة": L("مجموعة", "Collection"),
      "٢٠٢٦": L("٢٠٢٦", "2026"),
      "الجديدة": L("للتخييم", "for camping"),
      "الموسم الجديد وصل": L("معدات التخييم والرحلات", "Camping and trip gear"),
      "قطع خفيفة بخامات طبيعية ومقاسات كاملة.": L(
        "خيام وأكياس نوم وكشافات وحقائب للرحلات.",
        "Tents, sleeping bags, lamps and packs for trips.",
      ),
      "اكتشف المجموعة": L("جهّز رحلتك", "Gear up for the trip"),
    },
    links: { "/products": search("خيمة") },
  }),
  lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": L("حسب نوع الرحلة", "Shop by trip") } }),
  lib("products-bento", { text: { "منتجات يكثر الطلب عليها": L("اختيارات الرحلة", "Trail picks") }, links: { "/products": BEST } }),
  lib("brands-bubbles", {
    name: L("ماركات المعدات", "Gear brands"),
    text: {
      "ماركات نحبها": L("علامات تجارية نثق بها", "Brands we trust"),
      "فولتا": BRANDS[0]!,
      "نورو": BRANDS[1]!,
      "كيان": BRANDS[2]!,
      "ساحل": BRANDS[3]!,
      "أوربت": BRANDS[4]!,
      "ميزان": BRANDS[5]!,
      "لومو": BRANDS[6]!,
    },
    links: { "/products": BRANDS.map(search) },
  }),
  // v5 (2026-11-16, owner): every home has a real products grid; it shows what the main list does not.
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("وصل حديثًا", "New in"),
      "أحدث المنتجات في المتجر.": L("أحدث المنتجات في المتجر.", "The newest products in the store."),
    },
    links: { "/products": NEW },
    lists: [{ source: "newest", limit: 8 }],
  }),
  lib("text-steps", {
    text: {
      "كيف ترجع منتجًا": L("كيف تطلب معداتك", "How to order your gear"),
      "راسلنا على واتساب": L("اختر المعدات", "Pick your gear"),
      "خلال ١٤ يومًا من الاستلام مع رقم الطلب.": L("خيمة، كيس نوم، كشاف: أضفها إلى السلة.", "Tent, sleeping bag, lamp: add them to the cart."),
      "جهّز المنتج": L("أكّد الطلب", "Confirm the order"),
      "في علبته الأصلية بكل الإكسسوارات.": L("أدخل العنوان ورقم الهاتف.", "Enter your address and phone number."),
      "يستلمه المندوب": L("استلم طلبك", "Receive your order"),
      "من عنوانك خلال يومي عمل.": L("تظهر تكلفة الشحن ومدته عند إتمام الطلب.", "Shipping cost and time are shown at checkout."),
      "استرداد المبلغ": L("جهّز رحلتك", "Plan your trip"),
      "بطريقة الدفع نفسها خلال ٥ أيام.": L("راجع مواصفات كل منتج قبل الرحلة.", "Check each product's specs before the trip."),
    },
  }),
  lib("features-side-title", {
    text: {
      "لماذا تتسوق معنا": L("لماذا تتسوق معنا", "Why shop with us"),
      "أربعة أمور نهتم بها في كل طلب.": L("أربعة أمور تهمّنا في كل منتج.", "Four things we care about in every product."),
      "الشحن": L("للصحراء والجبل", "For desert and mountain"),
      "تظهر تكلفة الشحن ومدته عند إتمام الطلب": L("معدات مناسبة للرحلات البرية والتخييم", "Gear made for trips and camping"),
      "الدفع عند الاستلام": L("مواصفات واضحة", "Clear specs"),
      "أو بطرق الدفع المتاحة عند الطلب": L("الوزن والمقاس والخامة لكل منتج", "Weight, size and material for every product"),
      "الاستبدال والاسترجاع": L("تشكيلة كاملة", "A full range"),
      "التفاصيل في صفحة السياسات": L("خيام وحقائب وأدوات وأجهزة شحن", "Tents, packs, tools and power"),
      "تواصل معنا": L("تواصل معنا", "Contact us"),
      "لأي سؤال عن طلب أو منتج": L("لأي سؤال عن منتج", "With any question about a product"),
    },
  }),
  // v6 (2026-11-25, owner): the store's 1st category as a carousel in place of the press quotes.
  lib("products-category-carousel", { lists: [undefined, { limit: 4 }] }),
  lib("newsletter-big", {
    text: {
      "اشترك في نشرتنا البريدية": L("جديد معدات التخييم", "New camping gear"),
      "كن أول من يعرف بالمنتجات الجديدة.": L("اشترك ليصلك جديد المعدات.", "Subscribe for new gear."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن وادي", "About Wadi"), L("معدات تخييم ورحلات للصحراء والجبل.", "Camping and trip gear for desert and mountain.")),
  aboutStory(lib, {
    photo: PHOTOS.canyonTents,
    alt: L("خيم في وادي صخري", "Tents in a rocky canyon"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("معدات للرحلات البرية", "Gear for the outdoors"),
    text: L("نختار خيامًا وحقائب وأدوات تتحمّل الرحلات، ونعرض مواصفات كل منتج بوضوح.", "We pick tents, packs and tools made for trips, with clear specs for every product."),
    more: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
    button: L("تسوق المعدات", "Shop gear"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("معدات تخييم ورحلات للصحرا والجبل.", "Camping and trip gear for the desert and the mountains."),
  categories: [
    ["tents", "خيم ومخيم", "Tents & camp", PHOTOS.whiteSandTent],
    ["packs", "حقائب", "Packs", PHOTOS.packOnRock],
    ["trail", "أدوات الرحلة", "Trail kit", PHOTOS.flatLay],
    ["water", "المياه والزمزميات", "Water & bottles", PHOTOS.bottle],
    ["power", "أجهزة وشحن", "Devices & power", PHOTOS.powerBank],
  ],
  products: [
    ["dome-tent-3p", "tents", "خيمة قبة ٣ أفراد", "Dome Tent, 3 Person", PHOTOS.whiteSandTent, 4200, { isFeatured: true, rating: 4.8, sold90: 74 }],
    ["canyon-tent-2p", "tents", "خيمة خفيفة لفردين", "Light Tent, 2 Person", PHOTOS.canyonTentsSmall, 3100, { sold90: 58 }],
    ["desert-camp-kit", "tents", "طقم مخيم الصحراء", "Desert Camp Kit", PHOTOS.desertCampSmall, 8900, { compareAtPrice: 9900, isFeatured: true, sold90: 21 }],
    // v6: a fourth camp product, so the category carousel (the 1st category) shows a full row.
    ["camp-starter-kit", "tents", "طقم بداية التخييم", "Camp Starter Kit", PHOTOS.flatLay, 1650, { sold90: 34 }],
    ["trek-pack-45l", "packs", "حقيبة ظهر ٤٥ لتر", "Trek Pack 45 L", PHOTOS.packOnRock, 2650, { rating: 4.7, sold90: 66 }],
    ["canvas-daypack", "packs", "حقيبة يومية من قماش الكانفاس", "Canvas Daypack", PHOTOS.daypack, 1350, { sold90: 90 }],
    ["trail-essentials-set", "trail", "طقم أساسيات الرحلة", "Trail Essentials Set", PHOTOS.flatLay, 1150, { sold90: 102 }],
    ["insulated-bottle", "water", "زمزمية معزولة", "Insulated Bottle", PHOTOS.bottle, 420, { sold90: 160 }],
    ["solar-power-bank", "power", "بطارية شحن متنقلة للرحلات", "Trip Power Bank", PHOTOS.powerBank, 890, { compareAtPrice: 990, sold90: 70 }],
    ["gps-trail-watch", "power", "ساعة GPS للرحلات", "GPS Trail Watch", PHOTOS.watch, 3650, { inStock: false, rating: 4.6, sold90: 28 }],
  ],
});

export const BASECAMP = libraryTemplate({
  key: BASECAMP_KEY,
  version: 6,
  changelog: "Basecamp v6: products by category as a carousel on the home",
  name: L("بيس كامب", "Basecamp"),
  description: L(
    "تخييم ورحلات: موسم التخييم، ما يميزنا، العلامات التجارية وخطوات الطلب. أربع صفحات جاهزة.",
    "Camping and trips: the season, why us, brands and how to order. Four ready pages.",
  ),
  category: "sports",
  style: ["warm"],
  sortOrder: 350,
  palette: ["#efeadf", "#ded6c4", "#e0922f", "#1f2b24"],
  colors: {
    primary: "#1f2b24",
    secondary: "#ded6c4",
    background: "#ffffff",
    foreground: "#1f2b24",
    muted: "#5b6159",
    border: "#d6cdb8",
    accent: "#e0922f",
  },
  fonts: { heading: "Changa", body: "Changa" },
  radius: 6,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن وادي", "About"), seo: { title: L("عن وادي", "About Wadi") }, sections: about },
    {
      slug: "contact",
      name: L("خطط رحلتك", "Plan a trip"),
      seo: { title: L("خطط رحلتك", "Plan a trip") },
      sections: contactPage(lib, {
        title: L("خطط رحلتك", "Plan a trip"),
        text: L("تواصل معنا لأي سؤال عن المعدات.", "Contact us with any question about gear."),
        heading: L("أرسل سؤالك عن المعدات", "Send your question about gear"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المعدات والمقاسات والطلب.", "Gear, sizes and ordering."),
        question: L("كيف أختار الخيمة المناسبة؟", "How do I choose the right tent?"),
        answer: L("راجع عدد الأفراد والوزن والمقاس في وصف كل خيمة.", "Check the capacity, weight and size in each tent's description."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "shelf", thumbs: "side", band: "shelf", extras: ["product-perks"], copy: { reviews: L("آراء المخيّمين", "Campers' reviews"), related: L("معدات أخرى لرحلتك", "More gear for your trip") } },
});
