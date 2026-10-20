/**
 * Lahma (template 71, butcher and meat boxes; Claude Design "Storefront
 * Templates"): warm cream paper, a deep butcher's red for actions and a
 * mustard highlight, Changa headings over Cairo text and tight 6px
 * corners. A farm butcher: the Eid box poster, this week's cuts, the grill
 * pack bundle, cold-chain zones, open before you pay and the regulars'
 * reviews. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): a rib roast on a board,
 * raw cuts with a pepper mill, minced beef, kofta on a grill and on a
 * plate, lamb chops, sausages, a pot roast, a grilled steak and half a
 * grilled chicken. No people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const LAHMA_KEY = "lahma";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(LAHMA_KEY, getDesign(id)!, { corners: 6, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  ribRoast: pexels(33157191, 900),
  ribRoastWide: pexels(33157191),
  rawCuts: pexels(28881694, 900),
  rawCutsWide: pexels(28881694),
  steakCut: pexels(36319691, 900),
  minced: pexels(128401, 900),
  koftaGrill: pexels(31249644, 900),
  koftaPlate: pexels(32986492, 900),
  lambChops: pexels(6281506, 900),
  sausages: pexels(10794112, 900),
  potRoast: pexels(6545671, 900),
  grilledSteak: pexels(28292008, 900),
  chicken: pexels(36895285, 900),
};

const NAME = L("الجزار", "El Gazzar");

const header = lib("header-brand-bar", {
  text: {
    "م": L("ج", "G"),
    "اسم متجرك": NAME,
    "ابحث في المتجر": L("ابحث عن كفتة، ريش، بوكس…", "Search kofta, chops, boxes…"),
  },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("بيتقطع طازة كل يوم الصبح", "Cut fresh, every morning"),
    "كلمنا على واتساب": L("اطلب على واتساب", "Order on WhatsApp"),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ الجزار. كل الحقوق محفوظة.", "© 2026 El Gazzar. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-poster", {
    photo: [undefined, undefined, PHOTOS.ribRoastWide],
    text: {
      "مجموعة الموسم": L("بوكسات العيد", "Eid boxes"),
      "من ١ إلى ٣٠ نوفمبر": L("اطلب قبلها بـ٤٨ ساعة", "Order 48 h ahead"),
      "صورة الحملة": L("قطعية ريش على لوح خشب", "A rib cut on a wooden board"),
      "خصم": L("من", "From"),
      "٣٠٪": L("٢٤٠٠", "2,400"),
      "لفترة محدودة": L("ج.م", "EGP"),
      "الموسم الجديد وصل": L("من مزرعتنا لتلاجتك", "From our farm to your fridge"),
      "قطع خفيفة بخامات طبيعية، مقاسات كاملة وتبديل مجاني خلال ١٤ يومًا.": L(
        "بيتقطع بالطلب كل يوم الصبح وبيوصل متلج في نفس اليوم.",
        "Cut to order every morning, delivered cold within the day.",
      ),
      "اكتشف المجموعة": L("تسوق البوكسات", "Shop boxes"),
    },
    links: { "/products": search("بوكس") },
  }),
  lib("products-bento", {
    text: {
      "الأكثر طلبًا": L("الأكتر طلباً", "Most ordered"),
      "الكل بيسأل عليهم": L("الأسبوع ده", "This week"),
    },
    links: { "/products": BEST },
  }),
  // The design's "Price drop band" (bundle-price-drop) lists its pieces without product links,
  // which every template section with products must have; the "Plus row" bundle shows the same offer.
  lib("bundle-plus", {
    text: {
      "باقة": L("باكدج الشوي", "Grill pack"),
      "اشتريهم مع بعض ووفّر": L("٣ قطع مع بعض بخصم ١٢٪", "Three pieces together, 12% off"),
      "سعر الباقة": L("سعر الباكدج", "Pack price"),
      "١٬٢٧٠ ج.م": L("١٬١١٠ ج.م", "EGP 1,110"),
      "بدل ١٬٤٩٠ ج.م": L("بدل ١٬٢٦٠ ج.م", "Instead of EGP 1,260"),
      "وفّر ٢٢٠ ج.م": L("وفّر ١٥٠ ج.م", "Save EGP 150"),
      "اطلب الباقة": L("خد باكدج الشوي", "Get the grill pack"),
    },
    links: { "/products": search("شوي") },
    lists: [{ source: "best-sellers" }],
  }),
  lib("pay-zones", {
    text: {
      "التوصيل": L("توصيل مبرد", "Cold chain"),
      "بنوصل لكل مصر": L("توصيل مبرد", "Cold-chain delivery"),
      "المدة والمصاريف حسب محافظتك.": L("عربيات مبردة من المحل لباب بيتك.", "Chilled vans from our shop to your door."),
      "توصيل مجاني للطلبات فوق ١٬٥٠٠ ج.م": L("توصيل مجاني للطلبات فوق ١٬٠٠٠ ج.م", "Free delivery on orders over EGP 1,000"),
      "القاهرة والجيزة": L("وسط القاهرة", "Downtown Cairo"),
      "١–٢ يوم": L("نفس اليوم", "Same day"),
      "٥٠ ج.م": L("٤٠ ج.م", "EGP 40"),
      "الإسكندرية والدلتا": L("الجيزة والدقي", "Giza & Dokki"),
      "مدن القناة": L("مدينة نصر ومصر الجديدة", "Nasr City & Heliopolis"),
      "٢–٣ أيام": L("نفس اليوم", "Same day"),
      "٦٥ ج.م": L("٤٠ ج.م", "EGP 40"),
      "الصعيد": L("٦ أكتوبر والشيخ زايد", "6th of October & Sheikh Zayed"),
      "٣–٥ أيام": L("نفس اليوم", "Same day"),
      "٨٠ ج.م": L("٥٥ ج.م", "EGP 55"),
      "البحر الأحمر وسيناء": L("العاصمة الجديدة", "New Capital"),
      "٤–٦ أيام": L("تاني يوم", "Next day"),
      "٩٥ ج.م": L("٧٠ ج.م", "EGP 70"),
    },
  }),
  lib("pay-open-box", {
    text: {
      "افتح الطلب قبل ما تدفع": L("شوف اللحمة قبل ما تدفع", "See the meat before you pay"),
      "بنكلمك قبلها بساعة.": L("بنكلمك قبلها بساعة، والطلب في شنطة مبردة.", "We call an hour before; your order comes in a cold bag."),
      "جرّب المنتج قدام المندوب.": L("شوف اللون والقطعية قدام المندوب.", "Check the colour and the cut in front of the courier."),
    },
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("الزباين", "Regulars"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "بوكس العيد وصل متلج ومتقطع زي ما طلبت بالظبط.",
        "The Eid box arrived chilled and cut exactly as I asked.",
      ),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("الكفتة متتبلة حلو ومش محتاجة أي حاجة.", "The kofta is seasoned just right and needs nothing else."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "طلبت قطعية مخصوص للشوي والجزار نصحني بالأحسن.",
        "I asked for a special grilling cut and the butcher suggested a better one.",
      ),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("أول مرة أطلب لحمة أونلاين وأطمن عليها.", "The first time I have trusted meat ordered online."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("اللحمة بلدي فعلاً وأسعارها أحسن من المحلات.", "Truly local beef, and cheaper than the shops."),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("فتحت الشنطة قدام المندوب ولقيت كل حاجة سليمة.", "I opened the bag in front of the courier and everything was right."),
      "المنصورة": L("مدينة نصر", "Nasr City"),
      "الإسكندرية": L("الدقي", "Dokki"),
      "أسيوط": L("المعادي", "Maadi"),
      "طنطا": L("الشيخ زايد", "Sheikh Zayed"),
    },
    links: { "/products": RATED },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن الجزار", "About El Gazzar"), L("مزرعة وجزارة من ١٩٨٨.", "A farm and butcher’s since 1988.")),
  aboutStory(lib, {
    photo: PHOTOS.rawCutsWide,
    alt: L("قطعيات لحمة طازة على لوح", "Fresh cuts of meat on a board"),
    eyebrow: L("من المزرعة", "From the farm"),
    title: L("بنربي ونقطع ونوصل بنفسنا", "We raise, cut and deliver ourselves"),
    text: L("عجولنا بتتربى في مزرعتنا في المنوفية على علف طبيعي، وبتتدبح وتتقطع في المحل كل يوم الصبح.", "Our cattle are raised on natural feed at our farm in Menoufia, then cut at the shop every morning."),
    more: L("وكل طلب بيخرج في شنطة مبردة لحد باب بيتك.", "And every order leaves in a chilled bag, all the way to your door."),
    button: L("تسوق البوكسات", "Shop boxes"),
    href: search("بوكس"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("قطعيات طازة من مزرعتنا، بتوصل متلجة.", "Fresh cuts from our farm, delivered cold."),
  categories: [
    ["beef", "لحمة بلدي", "Beef", PHOTOS.steakCut],
    ["grill", "مشويات", "Grill", PHOTOS.koftaGrill],
    ["boxes", "بوكسات", "Boxes", PHOTOS.rawCuts],
  ],
  products: [
    ["family-meat-box", "boxes", "بوكس لحمة العيلة ٥ كيلو", "Family Meat Box, 5 kg", PHOTOS.rawCuts, 2400, { isFeatured: true, rating: 4.8, sold90: 120 }],
    ["kofta-1kg", "grill", "كفتة ١ كيلو", "Kofta Mix, 1 kg", PHOTOS.koftaGrill, 420, { sold90: 210 }],
    ["minced-beef-1kg", "beef", "لحمة مفرومة ١ كيلو", "Minced Beef, 1 kg", PHOTOS.minced, 380, { sold90: 200 }],
    ["kofta-plate", "grill", "كفتة مشوية جاهزة", "Ready Grilled Kofta", PHOTOS.koftaPlate, 460, { compareAtPrice: 520, sold90: 190 }],
    ["rib-roast", "beef", "ريش بالعضم", "Bone-In Rib Roast", PHOTOS.ribRoast, 1350, { rating: 4.9, sold90: 44 }],
    ["steak-cut", "beef", "ستيك بلدي ١ كيلو", "Local Steak, 1 kg", PHOTOS.steakCut, 520, { sold90: 90 }],
    ["lamb-chops", "beef", "ريش ضاني ١ كيلو", "Lamb Chops, 1 kg", PHOTOS.lambChops, 640, { sold90: 66 }],
    ["beef-sausage", "grill", "سجق بلدي ١ كيلو", "Beef Sausage, 1 kg", PHOTOS.sausages, 340, { sold90: 110 }],
    ["pot-roast-box", "boxes", "بوكس الروستو", "Pot Roast Box", PHOTOS.potRoast, 900, { sold90: 38 }],
    ["grill-steak-box", "boxes", "بوكس الشوي", "Grill Box", PHOTOS.grilledSteak, 1500, { inStock: false, sold90: 30 }],
    ["marinated-chicken", "grill", "فراخ متتبلة للشوي", "Marinated Chicken", PHOTOS.chicken, 260, { sold90: 80 }],
  ],
});

export const LAHMA = libraryTemplate({
  key: LAHMA_KEY,
  version: 1,
  name: L("لحمة", "Lahma"),
  description: L(
    "جزارة وبوكسات لحوم: بوستر بوكسات العيد، قطعيات الأسبوع، باكدج الشوي، توصيل مبرد وافتح قبل ما تدفع. أربع صفحات جاهزة.",
    "Butcher and meat boxes: Eid box poster, this week’s cuts, the grill pack, cold-chain delivery and open before you pay. Four ready pages.",
  ),
  category: "food",
  sortOrder: 710,
  palette: ["#faf7f3", "#efe6dc", "#f4c95d", "#9b1c1c"],
  colors: {
    primary: "#9b1c1c",
    secondary: "#efe6dc",
    background: "#faf7f3",
    foreground: "#241510",
    muted: "#665247",
    border: "#e2d5c6",
    accent: "#f4c95d",
  },
  fonts: { heading: "Changa", body: "Cairo" },
  radius: 6,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن الجزار", "About"), seo: { title: L("عن الجزار", "About El Gazzar") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("المحل مفتوح كل يوم من ٧ الصبح لـ ١١ بالليل.", "The shop is open daily from 7 am to 11 pm."),
        heading: L("اطلب قطعية مخصوص", "Ask for a special cut"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("القطعيات والتوصيل المبرد والدفع.", "Cuts, cold-chain delivery and payment."),
        question: L("ينفع أطلب تقطيع معين؟", "Can I ask for a specific cut?"),
        answer: L("أيوه، اكتب طلبك في الملاحظات أو ابعتلنا على واتساب قبلها بيوم.", "Yes, write it in the order notes or message us on WhatsApp a day ahead."),
      }),
    },
  ],
  demo: DEMO,
});
