/**
 * Mobilia (template 76, modern furniture; Claude Design "Storefront
 * Templates"): off-white paper, a graphite brand colour and a warm sand
 * highlight, IBM Plex Sans Arabic throughout and tight 4px corners. A quiet
 * furniture showroom: less but better, rooms, best sellers, pay over 24
 * months, when it arrives and questions. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): sofas, beds, armchairs,
 * side tables, a floor lamp and showroom rooms. No people, no hands, no
 * logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const MOBILIA_KEY = "mobilia";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(MOBILIA_KEY, getDesign(id)!, { corners: 4, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  navySofaRoom: pexels(6312357),
  livingRoom: pexels(1648776, 900),
  bedroom: pexels(5152681, 900),
  showroom: pexels(6969830, 900),
  bedsideLamp: pexels(545012, 900),
  mirrorsCorner: pexels(5490341),
  linenSofa: pexels(30440152, 900),
  greenVelvetSofa: pexels(30520758, 900),
  navySofa: pexels(6312357, 900),
  oakBed: pexels(31173588, 900),
  pineBed: pexels(7055750, 900),
  nightstand: pexels(33000100, 900),
  tanArmchair: pexels(12269764, 900),
  greenArmchair: pexels(12961120, 900),
  swivelChairs: pexels(8066334, 900),
  oakChairs: pexels(29917912, 900),
  marbleTable: pexels(6078539, 900),
  floorLamp: pexels(32684360, 900),
};

const NAME = L("موبيليا القاهرة", "Mobilia Cairo");

const header = lib("header-line", {
  text: {
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "المتجر": L("كل الأثاث", "All furniture"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("المعرض", "Showroom"),
    "تواصل معنا": L("تواصل", "Contact"),
  },
  links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-ruled", {
  text: {
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "منتجات أصلية بضمان، توصلك لحد البيت.": L("أثاث بسيط، بيوصل متركب.", "Simple furniture, delivered assembled."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ موبيليا القاهرة. كل الحقوق محفوظة.", "© 2026 Mobilia Cairo. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("المعرض", "Our showroom"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.navySofaRoom],
    text: {
      "كوليكشن الموسم": L("الكوليكشن الجديد", "New collection"),
      "صوت أنقى، كل يوم": L("أقل، بس أحسن", "Less, but better"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "خشب صلب وكتان بـ٥ ألوان هادية، وبيوصلك متركب ببلاش.",
        "Solid wood and linen in five calm colours, delivered and assembled free.",
      ),
      "تسوق الآن": L("تسوق الأثاث", "Shop furniture"),
      "العروض": L("الأكثر مبيعاً", "Best sellers"),
      "صورة الحملة": L("أوضة معيشة بكنبة قطيفة كحلي وفوتيهين", "A living room with a navy velvet sofa and two armchairs"),
    },
    links: { "/products": [SHOP, BEST] },
  }),
  lib("categories-tiles", {
    photo: [PHOTOS.livingRoom, PHOTOS.bedroom, PHOTOS.showroom, PHOTOS.bedsideLamp],
    text: {
      "تسوّق حسب القسم": L("الأوض", "Rooms"),
      "اختر القسم الذي يناسبك من كل ما نقدمه.": L("ابدأ بالأوضة اللي بتجهزها.", "Start with the room you are furnishing."),
      "كل الأقسام": L("كل الأثاث", "All furniture"),
      "وصل حديثًا": L("الليفنج", "Living room"),
      "الأكثر مبيعًا": L("أوضة النوم", "Bedroom"),
      "العروض": L("فوتيهات", "Armchairs"),
      "هدايا": L("ترابيزات وإضاءة", "Tables & lighting"),
    },
    links: { "/products": [undefined, search("كنبة"), search("سرير"), search("فوتيه"), search("ترابيزة")] },
  }),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("الأكثر مبيعاً", "Best sellers"),
      "أحدث المنتجات اللي نزلت المتجر.": L("القطع اللي البيوت بتختارها أكتر.", "The pieces homes choose most."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("pay-installments", {
    text: {
      "قسّطها": L("قسّط الكنبة", "Split the sofa"),
      "على كام شهر؟": L("على كام شهر؟", "Over how many months?"),
      "من غير فوايد ولا مقدم مع شركات التقسيط.": L(
        "من غير فوايد على ٦ و١٢ شهر، ومن غير مقدم مع شركات التقسيط.",
        "No interest over 6 and 12 months, and no down payment with our partners.",
      ),
    },
  }),
  lib("pay-days", {
    text: {
      "هيوصلك إمتى؟": L("هيوصلك إمتى؟", "When will it arrive?"),
      "١": L("٥", "5"),
      "يوم": L("أيام", "days"),
      "القاهرة، الجيزة": L("القطع الجاهزة في القاهرة والجيزة", "In-stock pieces in Cairo and Giza"),
      "٢–٣": L("٣", "3"),
      "أيام": L("أسابيع", "weeks"),
      "الإسكندرية، الدلتا، مدن القناة": L("القطع اللي بتتعمل بالطلب", "Made-to-order pieces"),
      "الصعيد، البحر الأحمر، سيناء": L("مقاسات خاصة على مقاس أوضتك، والتركيب ببلاش", "Custom sizes for your room, with free assembly"),
    },
  }),
  lib("faq-columns", {
    as: "faq-home",
    text: {
      "أسئلة شائعة": L("أسئلة", "Questions"),
      "كيف أعرف أن طلبي وصل إليكم؟": L("التركيب عليكم ولا عليا؟", "Do you assemble it?"),
      "ستظهر لك صفحة تأكيد وتصلك رسالة، ونتصل بك لتأكيد طلبات الدفع عند الاستلام.": L(
        "علينا. فريقنا بيوصل القطعة ويركبها ويشيل الكراتين ببلاش.",
        "We do. Our team delivers, assembles and takes the boxes away for free.",
      ),
      "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("ينفع أشوف القماش قبل ما أطلب؟", "Can I see the fabric before I order?"),
      "نعم، حتى يتم شحنه. تواصل معنا بأسرع وقت.": L(
        "أيوه، نبعتلك عينات القماش ببلاش، أو تعالى المعرض في التجمع.",
        "Yes, we send fabric samples free, or visit our showroom in New Cairo.",
      ),
      "كم يستغرق التوصيل؟": L("التوصيل بياخد قد إيه؟", "How long does delivery take?"),
      "القاهرة والجيزة من يوم إلى يومين، وباقي المحافظات من ٢ إلى ٦ أيام.": L(
        "القطع الجاهزة في ٥ أيام، والقطع اللي بتتعمل بالطلب في ٣ أسابيع.",
        "In-stock pieces in 5 days, made-to-order pieces in 3 weeks.",
      ),
      "هل التوصيل متاح لكل المحافظات؟": L("بتوصلوا برا القاهرة؟", "Do you deliver outside Cairo?"),
      "نعم، نوصل لكل محافظات مصر.": L("أيوه، للإسكندرية والدلتا ومدن القناة، والتركيب برضه ببلاش.", "Yes, to Alexandria, the Delta and the Canal cities, with free assembly too."),
      "ما طرق الدفع المتاحة؟": L("أقدر أقسّط؟", "Can I pay in instalments?"),
      "الدفع عند الاستلام، والبطاقات، والمحافظ الإلكترونية، وإنستاباي.": L(
        "أيوه، لحد ٢٤ شهر مع فاليو وسيمبل وسهولة، أو ادفع كاش عند الاستلام.",
        "Yes, up to 24 months with valU, Sympl and souhoola, or pay cash on delivery.",
      ),
      "ما سياسة الاسترجاع؟": L("لو المقاس مش مظبوط؟", "What if it does not fit?"),
      "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": L(
        "القطع الجاهزة بتترجع خلال ١٤ يوم، ومقاسات كل قطعة مكتوبة في صفحتها.",
        "In-stock pieces can be returned within 14 days; every piece lists its dimensions.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("المعرض", "Our showroom"), L("معرض أثاث في التجمع الخامس من ٢٠١٦.", "A furniture showroom in New Cairo since 2016.")),
  aboutStory(lib, {
    photo: PHOTOS.mirrorsCorner,
    alt: L("ركن فيه فوتيه وكنبة ومرايات مدورة", "A corner with an armchair, a sofa and round mirrors"),
    eyebrow: L("من ٢٠١٦", "Since 2016"),
    title: L("أثاث بيعيش، مش بيتغير كل سنة", "Furniture that lasts, not one that changes every year"),
    text: L("بنعمل كل قطعة من خشب زان صلب وكتان مصري في ورشتنا في دمياط، بخمس ألوان هادية تمشي مع بعض.", "We make every piece from solid beech and Egyptian linen in our Damietta workshop, in five calm colours that go together."),
    more: L("وبنوصلها ونركبها ببلاش في كل حتة بنوصلها.", "And we deliver and assemble it free wherever we deliver."),
    button: L("تسوق الأثاث", "Shop furniture"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أثاث بسيط، بيوصل متركب.", "Simple furniture, delivered assembled."),
  categories: [
    ["sofas", "كنب", "Sofas", PHOTOS.livingRoom],
    ["bedroom", "نوم", "Bedroom", PHOTOS.bedroom],
    ["chairs", "فوتيهات وكراسي", "Armchairs & chairs", PHOTOS.showroom],
    ["tables", "ترابيزات وإضاءة", "Tables & lighting", PHOTOS.bedsideLamp],
  ],
  products: [
    ["low-linen-sofa", "sofas", "كنبة كتان واطية", "Low Linen Sofa", PHOTOS.linenSofa, 26500, { isFeatured: true, rating: 4.8, sold90: 58 }],
    ["velvet-lounge-sofa", "sofas", "كنبة قطيفة زيتي", "Velvet Lounge Sofa", PHOTOS.greenVelvetSofa, 31900, { rating: 4.7, sold90: 21 }],
    ["navy-velvet-sofa", "sofas", "كنبة قطيفة كحلي", "Navy Velvet Sofa", PHOTOS.navySofa, 28500, { compareAtPrice: 32000, sold90: 17 }],
    ["oak-bed-frame", "bedroom", "سرير خشب أرو", "Oak Bed Frame", PHOTOS.oakBed, 18900, { isFeatured: true, rating: 4.8, sold90: 44 }],
    ["pine-bed", "bedroom", "سرير خشب صنوبر", "Pine Bed Frame", PHOTOS.pineBed, 14500, { sold90: 29 }],
    ["oak-nightstand", "bedroom", "كومودينو خشب بدرج", "Oak Nightstand", PHOTOS.nightstand, 3200, { sold90: 52 }],
    ["reading-armchair", "chairs", "فوتيه قراية", "Reading Armchair", PHOTOS.tanArmchair, 8900, { rating: 4.9, sold90: 37 }],
    ["green-armchair", "chairs", "فوتيه زيتي", "Olive Armchair", PHOTOS.greenArmchair, 9400, { sold90: 22 }],
    ["swivel-chair", "chairs", "كرسي دوّار", "Swivel Chair", PHOTOS.swivelChairs, 7600, { inStock: false, sold90: 14 }],
    ["oak-dining-chair", "chairs", "كرسي سفرة أرو", "Oak Dining Chair", PHOTOS.oakChairs, 2900, { sold90: 66 }],
    ["marble-side-table", "tables", "ترابيزة رخام جلالة", "Marble Side Table", PHOTOS.marbleTable, 4200, { compareAtPrice: 4900, sold90: 19 }],
    ["linen-floor-lamp", "tables", "أباجورة أرضي", "Linen Floor Lamp", PHOTOS.floorLamp, 2600, { sold90: 15 }],
  ],
});

export const MOBILIA = libraryTemplate({
  key: MOBILIA_KEY,
  version: 1,
  name: L("موبيليا", "Mobilia"),
  description: L(
    "أثاث مودرن بسيط: الأوض، الأكثر مبيعاً، التقسيط لحد ٢٤ شهر ومواعيد التوصيل. أربع صفحات جاهزة.",
    "Modern, simple furniture: rooms, best sellers, pay over 24 months and delivery times. Four ready pages.",
  ),
  category: "home",
  sortOrder: 760,
  palette: ["#f7f7f5", "#ececea", "#e9d8b4", "#2f2f2f"],
  colors: {
    primary: "#2f2f2f",
    secondary: "#ececea",
    background: "#f7f7f5",
    foreground: "#161616",
    muted: "#5a5a56",
    border: "#dededa",
    accent: "#e9d8b4",
  },
  fonts: { heading: "IBM Plex Sans Arabic", body: "IBM Plex Sans Arabic" },
  radius: 4,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("المعرض", "Showroom"), seo: { title: L("المعرض", "Our showroom") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("المعرض: ٩٠ شارع التسعين الشمالي، التجمع الخامس.", "Showroom: 90 North 90th St, New Cairo."),
        heading: L("ابعتلنا مقاسات الأوضة", "Send us your room’s measurements"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والتركيب والتقسيط.", "Delivery, assembly and instalments."),
        question: L("ينفع أرجّع قطعة اتعملت بالطلب؟", "Can I return a made-to-order piece?"),
        answer: L("لا، عشان كده بنبعت عينة القماش واللون قبل ما نبدأ.", "No, which is why we send the fabric and colour sample before we start."),
      }),
    },
  ],
  demo: DEMO,
});
