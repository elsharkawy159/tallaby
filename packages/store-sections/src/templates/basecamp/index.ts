/**
 * Basecamp (template 35, camping and outdoor; Claude Design "Storefront
 * Templates"): sand paper, a deep pine for actions and a desert amber
 * highlight, Changa throughout and 6px corners. A desert outfitter: a
 * camp film, why campers come back, trail picks, what the press says,
 * the gear brands, how renting works and a big sign-up. Built from section
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
  text: { "م": L("و", "W"), "اسم متجرك": NAME, "ابحث في المتجر": L("ابحث عن خيمة، شنطة، كشاف…", "Search tents, packs, lamps…") },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك وخد العروض قبل أي حد.": L("مواعيد الرحلات وعروض الإيجار أول بأول.", "Trip dates and rental offers as they open."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ وادي أوتدور. كل الحقوق محفوظة.", "© 2026 Wadi Outdoor. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-poster", {
    photo: [undefined, undefined, PHOTOS.desertCamp],
    text: {
      "مجموعة الموسم": L("موسم الصحرا", "Desert season"),
      "من ١ إلى ٣٠ نوفمبر": L("من أكتوبر لمارس", "October to March"),
      "صورة الحملة": L("مخيم في الصحرا بالليل", "A desert camp at night"),
      "خصم": L("إيجار من", "Rent from"),
      "٣٠٪": L("٢٥٠", "250"),
      "لفترة محدودة": L("ج.م لليلة", "EGP a night"),
      "الموسم الجديد وصل": L("ليلة في الصحرا البيضا بأدواتنا", "A night in the White Desert with our gear"),
      "قطع خفيفة بخامات طبيعية، مقاسات كاملة وتبديل مجاني خلال ١٤ يومًا.": L(
        "خيم وشنط نوم وكشافات، للشرا أو للإيجار، مجرّبة في الفرافرة.",
        "Tents, sleeping bags and lamps to buy or rent, tested in Farafra.",
      ),
      "اكتشف المجموعة": L("جهّز رحلتك", "Gear up for the trip"),
    },
    links: { "/products": search("خيمة") },
  }),
  lib("features-side-title", {
    text: {
      "ليه الناس بترجع لنا تاني": L("ليه المخيمين بيرجعولنا", "Why campers come back"),
      "أربع حاجات بنلتزم بيها في كل طلب.": L("أربع حاجات بنلتزم بيها في كل رحلة.", "Four things we stand by on every trip."),
      "توصيل سريع": L("اتجربت في الصحرا", "Desert tested"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("كل خيمة بتبات ليلة في الفرافرة قبل ما تتباع", "Every tent spends a night in Farafra before we sell it"),
      "الدفع عند الاستلام": L("اشتري أو أجّر", "Buy or rent"),
      "أو ادفع بالبطاقة والمحفظة": L("أجّر لعطلة نهاية الأسبوع وخصم الإيجار لو اشتريت", "Rent for a weekend; the fee comes off if you buy"),
      "استرجاع سهل": L("صيانة مجانية", "Free repairs"),
      "١٤ يومًا لتغيّر رأيك": L("سوست وخياطة أول سنة", "Zips and seams for the first year"),
      "دعم على واتساب": L("مرشد على واتساب", "A guide on WhatsApp"),
      "أشخاص حقيقيون طوال الأسبوع": L("نساعدك تخطط رحلتك قبل ما تشتري", "We help you plan the trip before you buy"),
    },
  }),
  lib("products-bento", { text: { "الكل بيسأل عليهم": L("اختيارات الرحلة", "Trail picks") }, links: { "/products": BEST } }),
  lib("brands-quotes", {
    text: {
      "«واحد من أكتر المتاجر اللي ممكن تثق فيها لو بتدور على منتج أصلي.»": L(
        "«المكان اللي بتروحله قبل أي رحلة صحرا: أدوات مجرّبة ونصيحة بجد.»",
        "“The place to go before any desert trip: tested gear and honest advice.”",
      ),
      "ساحل": "Rahhala",
      "أوربت": "Sahraa Mag",
      "ميزان": "Trip Notes",
    },
  }),
  lib("brands-bubbles", {
    name: L("ماركات المعدات", "Gear brands"),
    text: {
      "ماركات بنحبها": L("ماركات بنثق فيها", "Brands we trust"),
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
  lib("text-steps", {
    text: {
      "إزاي ترجّع منتج": L("إزاي تأجّر معداتك", "How renting works"),
      "ابعتلنا على واتساب": L("اختار المعدات", "Pick your gear"),
      "خلال ١٤ يوم من الاستلام مع رقم الطلب.": L("خيمة، شنطة نوم، كشاف: ابعتلنا القائمة والتاريخ.", "Tent, sleeping bag, lamp: send us the list and dates."),
      "جهّز المنتج": L("ادفع التأمين", "Pay the deposit"),
      "في علبته الأصلية بكل الإكسسوارات.": L("تأمين بيرجعلك كامل لما المعدات ترجع سليمة.", "Refunded in full when the gear comes back sound."),
      "المندوب يستلم": L("استلم قبل الرحلة", "Collect before the trip"),
      "خلال يومين شغل من عنوانك.": L("من المحل أو توصيل لباب البيت يوم الخميس.", "From the shop, or delivered on Thursday."),
      "فلوسك ترجع": L("رجّعها بعد الرحلة", "Return after the trip"),
      "بنفس طريقة الدفع خلال ٥ أيام.": L("خلال يومين، ومن غير غسيل؛ إحنا بننضفها.", "Within two days, unwashed; we clean it."),
    },
  }),
  lib("newsletter-big", {
    text: {
      "خد ١٠٪ خصم على أول طلب": L("أول إيجار عليك خصم ٢٠٪", "20% off your first rental"),
      "عروض للمشتركين بس، مرة في الأسبوع.": L("ومواعيد الرحلات الجماعية قبل ما تتقفل.", "Plus group trip dates before they fill up."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن وادي", "About Wadi"), L("محل رحلات ومعدات تخييم في المعادي.", "A trips and camping gear shop in Maadi.")),
  aboutStory(lib, {
    photo: PHOTOS.canyonTents,
    alt: L("خيم في وادي صخري", "Tents in a rocky canyon"),
    eyebrow: L("المعادي", "Maadi"),
    title: L("بدأنا مرشدين رحلات", "We started as trip guides"),
    text: L("عشر سنين بنطلع سيوة وسانت كاترين والصحرا البيضا، وكل حاجة في المحل جربناها هناك.", "Ten years of trips to Siwa, St Catherine and the White Desert, and we used everything in the shop out there."),
    more: L("وأي معدات ممكن تأجّرها قبل ما تشتري.", "And you can rent any gear before you buy it."),
    button: L("تسوق المعدات", "Shop gear"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("معدات تخييم ورحلات للصحرا والجبل.", "Camping and trip gear for the desert and the mountains."),
  categories: [
    ["tents", "خيم ومخيم", "Tents & camp", PHOTOS.whiteSandTent],
    ["packs", "شنط", "Packs", PHOTOS.packOnRock],
    ["trail", "أدوات الرحلة", "Trail kit", PHOTOS.flatLay],
  ],
  products: [
    ["dome-tent-3p", "tents", "خيمة قبة ٣ أفراد", "Dome Tent, 3 Person", PHOTOS.whiteSandTent, 4200, { isFeatured: true, rating: 4.8, sold90: 74 }],
    ["canyon-tent-2p", "tents", "خيمة خفيفة لفردين", "Light Tent, 2 Person", PHOTOS.canyonTentsSmall, 3100, { sold90: 58 }],
    ["desert-camp-kit", "tents", "باقة مخيم الصحرا", "Desert Camp Kit", PHOTOS.desertCampSmall, 8900, { compareAtPrice: 9900, isFeatured: true, sold90: 21 }],
    ["trek-pack-45l", "packs", "شنطة ترِك ٤٥ لتر", "Trek Pack 45 L", PHOTOS.packOnRock, 2650, { rating: 4.7, sold90: 66 }],
    ["canvas-daypack", "packs", "شنطة يوم كانفس", "Canvas Daypack", PHOTOS.daypack, 1350, { sold90: 90 }],
    ["trail-essentials-set", "trail", "طقم أساسيات الرحلة", "Trail Essentials Set", PHOTOS.flatLay, 1150, { sold90: 102 }],
    ["insulated-bottle", "trail", "زمزمية معزولة", "Insulated Bottle", PHOTOS.bottle, 420, { sold90: 160 }],
    ["solar-power-bank", "trail", "باور بانك للرحلات", "Trip Power Bank", PHOTOS.powerBank, 890, { compareAtPrice: 990, sold90: 70 }],
    ["gps-trail-watch", "trail", "ساعة GPS للرحلات", "GPS Trail Watch", PHOTOS.watch, 3650, { inStock: false, rating: 4.6, sold90: 28 }],
  ],
});

export const BASECAMP = libraryTemplate({
  key: BASECAMP_KEY,
  version: 1,
  name: L("بيس كامب", "Basecamp"),
  description: L(
    "تخييم ورحلات: موسم الصحرا، ليه بيرجعولنا، الماركات وإزاي تأجّر. أربع صفحات جاهزة.",
    "Camping and trips: a desert season poster, why campers come back, the brands and how renting works. Four ready pages.",
  ),
  category: "sports",
  sortOrder: 350,
  palette: ["#efeadf", "#ded6c4", "#e0922f", "#1f2b24"],
  colors: {
    primary: "#1f2b24",
    secondary: "#ded6c4",
    background: "#efeadf",
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
        text: L("٩ شارع ٢٣١، المعادي.", "9 Road 231, Maadi."),
        heading: L("قولنا رايح فين وهنقولك محتاج إيه", "Tell us where you are going and we tell you what you need"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الإيجار والتأمين والتوصيل.", "Rentals, deposits and delivery."),
        question: L("لو المعدات اتبهدلت في الرحلة؟", "What if the gear gets damaged on the trip?"),
        answer: L("التلف العادي علينا. الكسر بنخصمه من التأمين بعد ما نوريك الصور.", "Normal wear is on us. Breakage comes out of the deposit after we show you photos."),
      }),
    },
  ],
  demo: DEMO,
});
