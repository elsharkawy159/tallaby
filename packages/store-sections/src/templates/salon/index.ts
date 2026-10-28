/**
 * Salon (template 106, living room furniture; Claude Design "Storefront
 * Templates"): warm stone paper, a walnut brown for actions and a sand
 * highlight, Noto Naskh Arabic headings over Noto Kufi Arabic text and
 * almost square 2px corners. A furniture shop: banners for sofas, bedrooms
 * and armchairs, rooms, best sellers, pay over 24 months, when it arrives
 * and questions. Built from section library designs (`fromLibrary`).
 *
 * The design's third delivery band ("EGP 0 assembly fee") cannot get its
 * own unit (the bands share "days"), so it reads "4–6 weeks for custom
 * sizes, with free assembly".
 *
 * Photos: Pexels, each checked by eye (2026-10-23): a living room with a
 * brown sofa, a bed with a white side table, a showroom with velvet swivel
 * chairs, a navy velvet sofa room, a reclaimed-wood bed, a terracotta
 * armchair, a green armchair, a teal sofa, a wooden coffee table, a
 * nightstand, a marble side table, floor and bedside lamps, and a corner
 * with round mirrors. No people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const SALON_KEY = "salon";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SALON_KEY, getDesign(id)!, { corners: 2, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  livingRoom: pexels(1648776),
  bedroom: pexels(5152681),
  showroom: pexels(6969830),
  navySofaRoom: pexels(6312357, 900),
  woodBed: pexels(31173588, 900),
  tanArmchair: pexels(12269764, 900),
  bedsideLamp: pexels(545012, 900),
  tealSofa: pexels(30520758, 900),
  greenArmchair: pexels(12961120, 900),
  coffeeTable: pexels(30440152, 900),
  nightstand: pexels(33000100, 900),
  marbleTable: pexels(6078539, 900),
  floorLamp: pexels(32684360, 900),
  mirrorsCorner: pexels(5490341),
};

const NAME = L("صالون", "Salon");

const header = lib("header-ruled", {
  text: {
    "م": L("ص", "S"),
    "اسم متجرك": NAME,
    "المتجر": L("كل الأثاث", "All furniture"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
  },
  links: { "/products": [SHOP, BEST, undefined, undefined] },
});

const footer = lib("footer-wordmark", {
  text: {
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ صالون. كل الحقوق محفوظة.", "© 2026 Salon. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن صالون", "About Salon"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.livingRoom, PHOTOS.bedroom, PHOTOS.showroom],
    text: {
      "وصل حديثًا": L("كنب", "Sofas"),
      "الموسم الجديد وصل": L("كنبة للسهرات الطويلة", "A sofa for long evenings"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("قعدة عميقة بأقمشة سهلة التنظيف.", "Deep seats in fabrics that clean easily."),
      "تسوّق الجديد": L("تسوق كنب", "Shop sofas"),
      "صورة الحملة الأولى": L("صالة بكنبة بني وفوتيهين وستاير", "A living room with a brown sofa, two armchairs and curtains"),
      "الأكثر مبيعًا": L("أوضة النوم", "Bedroom"),
      "المفضّلة عند عملائنا": L("الراحة بتبدأ بالسرير الصح", "Rest starts with the right bed"),
      "القطع اللي بترجع لها كل مرة.": L("سراير وكومودينوهات بتشطيب أرو وجوز.", "Beds and side tables in oak and walnut finishes."),
      "شوف الأكثر مبيعًا": L("تسوق نوم", "Shop bedroom"),
      "صورة الحملة الثانية": L("سرير بمفرش مشجر جنب كومودينو أبيض", "A bed with a leaf-print cover beside a white side table"),
      "عروض الأسبوع": L("فوتيهات", "Armchairs"),
      "خصومات لفترة محدودة": L("كرسي واحد وركن جديد", "One chair, a new corner"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("كراسي قراية وكراسي ديكور.", "Reading chairs and accent seats."),
      "تسوّق العروض": L("تسوق فوتيهات", "Shop armchairs"),
      "صورة الحملة الثالثة": L("فوتيهات قطيفة دوّارة في المعرض", "Velvet swivel armchairs in the showroom"),
    },
    links: { "/products": [search("كنبة"), search("سرير"), search("فوتيه")] },
  }),
  lib("categories-tiles", {
    photo: [PHOTOS.navySofaRoom, PHOTOS.woodBed, PHOTOS.tanArmchair, PHOTOS.bedsideLamp],
    text: {
      "تسوّق حسب القسم": L("الأوض", "Rooms"),
      "اختر القسم الذي يناسبك من كل ما نقدمه.": L("ابدأ بالأوضة اللي بتجهزها.", "Start with the room you are furnishing."),
      "كل الأقسام": L("كل الأثاث", "All furniture"),
      "وصل حديثًا": L("كنب", "Sofas"),
      "الأكثر مبيعًا": L("نوم", "Bedroom"),
      "العروض": L("فوتيهات", "Armchairs"),
      "هدايا": L("إضاءة وترابيزات", "Lighting & tables"),
    },
    links: { "/products": [undefined, search("كنبة"), search("سرير"), search("فوتيه"), search("أباجورة")] },
  }),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("الأكثر مبيعاً", "Best sellers"),
      "أحدث المنتجات اللي نزلت المتجر.": L("القطع اللي البيوت بتعيش فيها أكتر.", "The pieces homes live with most."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("pay-installments", {
    text: {
      "قسّطها": L("قسّط الكنبة", "Split the sofa"),
      "من غير فوايد ولا مقدم مع شركات التقسيط.": L(
        "على ٦ أو ١٢ أو ٢٤ شهر، من غير مقدم مع شركات التقسيط.",
        "Over 6, 12 or 24 months, with no down payment through our partners.",
      ),
    },
  }),
  lib("faq-columns", {
    as: "faq-home",
    text: {
      "أسئلة شائعة": L("أسئلة", "Questions"),
      "كيف أعرف أن طلبي وصل إليكم؟": L("التركيب عليكم؟", "Do you assemble it?"),
      "ستظهر لك صفحة تأكيد وتصلك رسالة، ونتصل بك لتأكيد طلبات الدفع عند الاستلام.": L(
        "أيوه، فريقنا بيوصل القطعة ويركبها ويشيل الكراتين، والتركيب ببلاش.",
        "Yes, our team delivers, assembles and takes the boxes away, and assembly is free.",
      ),
      "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("ينفع أشوف القماش قبل ما أطلب؟", "Can I see the fabric before I order?"),
      "نعم، حتى يتم شحنه. تواصل معنا بأسرع وقت.": L("أيوه، نبعتلك عينات القماش ببلاش.", "Yes, we send fabric samples free."),
      "كم يستغرق التوصيل؟": L("التوصيل بياخد قد إيه؟", "How long does delivery take?"),
      "القاهرة والجيزة من يوم إلى يومين، وباقي المحافظات من ٢ إلى ٦ أيام.": L(
        "القطع الجاهزة في ٥ أيام، واللي بتتعمل بالطلب في ٣ أسابيع.",
        "In-stock pieces in 5 days, made-to-order pieces in 3 weeks.",
      ),
      "هل التوصيل متاح لكل المحافظات؟": L("بتوصلوا برا القاهرة؟", "Do you deliver outside Cairo?"),
      "نعم، نوصل لكل محافظات مصر.": L("أيوه، لكل المحافظات، والتركيب برضه ببلاش.", "Yes, to every governorate, with free assembly too."),
      "ما طرق الدفع المتاحة؟": L("أقدر أقسّط؟", "Can I pay in instalments?"),
      "الدفع عند الاستلام، والبطاقات، والمحافظ الإلكترونية، وإنستاباي.": L(
        "أيوه، لحد ٢٤ شهر مع شركات التقسيط، أو ادفع كاش عند الاستلام.",
        "Yes, up to 24 months with our instalment partners, or pay cash on delivery.",
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
  pageHeader(lib, "about-header", L("عن صالون", "About Salon"), L("أثاث معمول عشان يتعاش فيه.", "Furniture made to be lived with.")),
  aboutStory(lib, {
    photo: PHOTOS.mirrorsCorner,
    alt: L("ركن فيه فوتيه خشب وكنبة ومرايات مدورة", "A corner with a wooden armchair, a sofa and round mirrors"),
    eyebrow: L("الصالة", "The living room"),
    title: L("أثاث معمول عشان يتعاش فيه", "Furniture made to be lived with"),
    text: L("كنب وفوتيهات بهياكل زان وأقمشة سهلة التنظيف، معمولة للسهرات الطويلة والعيلة الكبيرة.", "Sofas and armchairs on beech frames in easy-clean fabrics, made for long evenings and big families."),
    more: L("وبنوصل ونركب ببلاش، وتقدر تقسّط على شهور.", "And we deliver and assemble free, and you can pay in instalments."),
    button: L("تسوق الأثاث", "Shop furniture"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أثاث معمول عشان يتعاش فيه.", "Furniture made to be lived with."),
  categories: [
    ["sofas", "كنب", "Sofas", PHOTOS.navySofaRoom],
    ["bedroom", "نوم", "Bedroom", PHOTOS.woodBed],
    ["chairs", "فوتيهات", "Armchairs", PHOTOS.tanArmchair],
    ["lighting", "إضاءة وترابيزات", "Lighting & tables", PHOTOS.bedsideLamp],
  ],
  products: [
    ["low-linen-sofa", "sofas", "كنبة كتان واطية", "Low Linen Sofa", PHOTOS.navySofaRoom, 26500, { isFeatured: true, rating: 4.8, sold90: 58 }],
    ["velvet-lounge-sofa", "sofas", "كنبة قطيفة", "Velvet Lounge Sofa", PHOTOS.tealSofa, 31900, { sold90: 21 }],
    ["oak-bed-frame", "bedroom", "سرير أرو", "Oak Bed Frame", PHOTOS.woodBed, 18900, { rating: 4.8, sold90: 44 }],
    ["reading-armchair", "chairs", "فوتيه قراية", "Reading Armchair", PHOTOS.tanArmchair, 8900, { rating: 4.9, sold90: 37 }],
    ["marble-side-table", "lighting", "ترابيزة رخام", "Marble Side Table", PHOTOS.marbleTable, 4200, { compareAtPrice: 4900, sold90: 19 }],
    ["linen-floor-lamp", "lighting", "أباجورة كتان", "Linen Floor Lamp", PHOTOS.floorLamp, 2600, { sold90: 15 }],
    ["green-armchair", "chairs", "فوتيه زيتي", "Olive Armchair", PHOTOS.greenArmchair, 9400, { sold90: 22 }],
    ["oak-nightstand", "bedroom", "كومودينو بدرج", "Nightstand with Drawer", PHOTOS.nightstand, 3200, { sold90: 52 }],
    ["walnut-coffee-table", "lighting", "ترابيزة وسط جوز", "Walnut Coffee Table", PHOTOS.coffeeTable, 5600, { inStock: false, sold90: 26 }],
  ],
});

export const SALON = libraryTemplate({
  key: SALON_KEY,
  version: 3,
  changelog: "Salon v3: one payment block",
  productPage: { surface: "flat", thumbs: "side", gallery: "end", button: "outline", band: "paper", extras: ["product-perks"], copy: { reviews: L("آراء أصحاب البيوت", "From homeowners"), related: L("قطع تناسب الأوضة", "Pieces for the room") } },
  name: L("صالون", "Salon"),
  description: L(
    "أثاث الصالة: بانرات متحركة، الأوض، الأكثر مبيعاً، التقسيط لحد ٢٤ شهر وأسئلة. أربع صفحات جاهزة.",
    "Living room furniture: banner carousel, rooms, best sellers, pay over 24 months and questions. Four ready pages.",
  ),
  category: "home",
  sortOrder: 1060,
  palette: ["#f6f4f0", "#ebe7e0", "#d9b98c", "#5a4636"],
  colors: {
    primary: "#5a4636",
    secondary: "#ebe7e0",
    background: "#f6f4f0",
    foreground: "#24211d",
    muted: "#6b655d",
    border: "#dcd6cc",
    accent: "#d9b98c",
  },
  fonts: { heading: "Noto Naskh Arabic", body: "Noto Kufi Arabic" },
  radius: 2,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن صالون", "About"), seo: { title: L("عن صالون", "About Salon") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("salon@salon.eg، القاهرة.", "salon@salon.eg, Cairo."),
        heading: L("ابعتلنا مقاسات الصالة", "Send us your room’s measurements"),
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
