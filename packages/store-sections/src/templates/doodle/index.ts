/**
 * Doodle (template 30, playful wooden toys; Claude Design "Storefront
 * Templates"): mint paper, a cherry red for actions and a sunny yellow
 * highlight, Lemonada display type over Tajawal and round 24px corners. A
 * bright toy shop: a bento opening, promises, kids' favourites, a coupon,
 * why wood and photo reviews. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): wooden blocks,
 * animals, dinosaurs and vehicles. No children, parents or hands.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const DOODLE_KEY = "doodle";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(DOODLE_KEY, getDesign(id)!, { corners: 24, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  dinoWindow: pexels(3663063),
  numberBlocks: pexels(311268, 900),
  dinoTrio: pexels(3661194, 900),
  trucks: pexels(10831693, 900),
  safari: pexels(3663061, 900),
  blocksPillow: pexels(4964375, 900),
  seaFriends: pexels(3661242, 900),
  xylophone: pexels(6743166, 900),
  cat: pexels(1340376, 900),
  roundBlocks: pexels(6188059, 900),
  greenBlocks: pexels(34817526, 900),
};

const NAME = L("دودل كيدز", "Doodle Kids");

const header = lib("header-chips", {
  text: { "م": L("د", "D"), "اسم متجرك": NAME, "ابحث عن منتج…": L("ابحث عن مكعبات، حيوانات، بازل…", "Search blocks, animals, puzzles…") },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("يلا نلعب!", "Go play!"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ دودل كيدز. كل الحقوق محفوظة.", "© 2026 Doodle Kids. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-bento", {
    photo: [PHOTOS.dinoWindow],
    text: {
      "وصل جديد": L("موسم جديد", "New season"),
      "صوت أنقى، كل يوم": L("لعب بيعيش", "Play that lasts"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L("ألعاب خشب بألوان آمنة، معمولة تتورّث.", "Wooden toys with safe paints, made to be passed down."),
      "تسوق الآن": L("تسوق الألعاب", "Shop toys"),
      "صورة الحملة": L("ديناصورات خشب جنب الشباك", "Wooden dinosaurs by the window"),
      "٤٫٨": L("٤٫٩", "4.9"),
      "من ١٢ ألف تقييم": L("من ٩٠٠ أب وأم", "from 900 parents"),
    },
  }),
  lib("features-classic", {
    text: {
      "توصيل سريع": L("ألوان آمنة", "Safe paints"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("مية ومتختبرة", "Water-based, tested"),
      "الدفع عند الاستلام": L("تغليف هدية", "Gift wrap"),
      "أو ادفع بالبطاقة والمحفظة": L("مجاناً مع كل طلب", "Free with every order"),
      "استرجاع سهل": L("٢–٤ أيام", "2–4 days"),
      "١٤ يومًا لتغيّر رأيك": L("لكل مصر", "Across Egypt"),
      "دعم على واتساب": L("استبدال سهل", "Easy exchange"),
      "أشخاص حقيقيون طوال الأسبوع": L("خلال ١٤ يوم", "Within 14 days"),
    },
  }),
  lib("products-bento", { text: { "الأكثر طلبًا": L("أكثر اختيار", "Top picks"), "الكل بيسأل عليهم": L("المفضلة عند الأطفال", "Kids’ favourites") }, links: { "/products": BEST } }),
  lib("promo-coupon", {
    text: {
      "٢٠٪": L("١٠٠", "100"),
      "خصم": L("ج.م", "EGP"),
      "خصم على أول طلب لك": L("خصم على الطلبات فوق ١٬٠٠٠", "Off orders over EGP 1,000"),
      "للطلبات فوق ٨٠٠ ج.م · حتى ٣٠ نوفمبر": L("استخدمه عند الدفع.", "Use it at checkout."),
      "الكود: WELCOME20": L("الكود: PLAY100", "Code: PLAY100"),
    },
  }),
  lib("about-panel", {
    text: {
      "لماذا بدأنا": L("ليه خشب؟", "Why wood?"),
      "كنا نجرب كل منتج بأنفسنا قبل أن نبيعه، وما زلنا نفعل ذلك مع كل ما يدخل المتجر.": L(
        "لعب الخشب مفتوحة: المكعب ممكن يبقى موبايل أو عربية أو بيت.",
        "Wooden toys are open-ended: a block can be a phone, a car or a house.",
      ),
      "اليوم يعود إلينا آلاف العملاء، وهذا أكبر دليل على أن الطريقة صحيحة.": L(
        "بتعيش سنين وممكن تتورّث للطفل اللي بعده.",
        "They last for years and can be passed to the next child.",
      ),
      "«إن لم نستخدمه نحن، لن نبيعه.»": L("«أحسن لعبة ٩٠٪ طفل و١٠٪ لعبة.»", "“The best toy is 90% child and 10% toy.”"),
    },
  }),
  lib("testimonials-photos", {
    photo: [undefined, undefined, PHOTOS.numberBlocks, PHOTOS.dinoTrio, PHOTOS.trucks, PHOTOS.safari],
    text: {
      "من عملائنا": L("من الأهالي", "From parents"),
      "صورة العميل": L("اللعبة اللي اشتروها", "The toy they bought"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L("المكعبات أكتر لعبة بتتلعب عندنا.", "The blocks are the most-played toy in our house."),
      "م": L("م", "M"),
      "مريم أ.": L("مي ع.", "Mai A."),
      "القاهرة": L("أكتوبر", "October"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("ابني بقى يركب ديناصورات طول اليوم.", "My son builds dinosaurs all day now."),
      "ع": L("ت", "T"),
      "عمر ك.": L("تامر س.", "Tamer S."),
      "الإسكندرية": L("زايد", "Zayed"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("جودة حلوة، العلبة وصلت مخبوطة شوية.", "Great quality; the box arrived a little dented."),
      "ن": L("ر", "R"),
      "نور ح.": L("رشا ن.", "Rasha N."),
      "الجيزة": L("القاهرة", "Cairo"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("الحيوانات مرسومة حلو جداً والبنت بتحكي بيها حكايات.", "The animals are beautifully painted; my daughter tells stories with them."),
      "ي": L("ه", "H"),
      "يوسف م.": L("هبة ل.", "Heba L."),
      "المنصورة": L("الشيخ زايد", "Sheikh Zayed"),
      "اشترى من المتجر": L("اشترى من المتجر", "Verified buyer"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن دودل", "About Doodle"), L("محل ألعاب في مول العرب.", "A toy shop in Mall of Arabia.")),
  aboutStory(lib, {
    photo: PHOTOS.roundBlocks,
    alt: L("مكعبات خشب مدوّرة ملوّنة", "Colourful round wooden blocks"),
    eyebrow: L("مول العرب", "Mall of Arabia"),
    title: L("ألعاب بتكبر مع طفلك", "Toys that grow with your child"),
    text: L("بنختار ألعاب خشب بسيطة تتلعب بأكتر من طريقة، من غير بطاريات.", "We choose simple wooden toys that can be played many ways, with no batteries."),
    more: L("وكود PLAY100 بيخصم ١٠٠ ج.م من الطلبات فوق ١٬٠٠٠.", "And code PLAY100 takes EGP 100 off orders over 1,000."),
    button: L("تسوق الألعاب", "Shop toys"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ألعاب بتكبر مع طفلك.", "Toys that grow with your child."),
  categories: [
    ["blocks", "مكعبات", "Blocks", PHOTOS.numberBlocks],
    ["animals", "حيوانات", "Animals", PHOTOS.safari],
    ["builders", "ديناصورات", "Dinosaurs", PHOTOS.dinoTrio],
    ["vehicles", "عربيات وموسيقى", "Vehicles & music", PHOTOS.trucks],
  ],
  products: [
    ["rainbow-blocks", "blocks", "مكعبات قوس قزح", "Rainbow Number Blocks", PHOTOS.numberBlocks, 650, { isFeatured: true, rating: 4.9, sold90: 330 }],
    ["round-blocks", "blocks", "مكعبات مدوّرة", "Round Blocks", PHOTOS.roundBlocks, 420, { sold90: 90 }],
    ["green-blue-blocks", "blocks", "مكعبات أخضر وأزرق", "Green & Blue Blocks", PHOTOS.greenBlocks, 380, { sold90: 40 }],
    ["safari-friends", "animals", "أصحاب السفاري", "Safari Friends", PHOTOS.safari, 420, { rating: 4.8, sold90: 80 }],
    ["sea-friends", "animals", "أصحاب البحر", "Sea Friends", PHOTOS.seaFriends, 420, { sold90: 40 }],
    ["dino-trio", "builders", "ثلاثي الديناصورات", "Dino Trio", PHOTOS.dinoTrio, 560, { compareAtPrice: 650, sold90: 90 }],
    ["wooden-trucks", "vehicles", "عربيات خشب", "Wooden Trucks", PHOTOS.trucks, 480, { rating: 4.8, sold90: 140 }],
    ["rainbow-xylophone", "vehicles", "إكسيليفون قوس قزح", "Rainbow Xylophone", PHOTOS.xylophone, 390, { sold90: 60 }],
    ["playroom-starter", "blocks", "باقة أوضة اللعب", "Playroom Starter", PHOTOS.blocksPillow, 1450, { isFeatured: true, sold90: 22 }],
    ["pull-along-cat", "animals", "قطة بعصاية", "Pull-along Cat", PHOTOS.cat, 220, { inStock: false, sold90: 30 }],
  ],
});

export const DOODLE = libraryTemplate({
  key: DOODLE_KEY,
  version: 2,
  name: L("دودل", "Doodle"),
  description: L(
    "ألعاب خشب مرحة: افتتاحية بنتو، المفضلة عند الأطفال، كوبون وليه خشب. أربع صفحات جاهزة.",
    "Playful wooden toys: a bento opening, kids’ favourites, a coupon and why wood. Four ready pages.",
  ),
  category: "kids",
  sortOrder: 300,
  palette: ["#f1faee", "#dceee6", "#ffd166", "#d62839"],
  colors: {
    primary: "#d62839",
    secondary: "#dceee6",
    background: "#f1faee",
    foreground: "#1d3557",
    muted: "#4d5f78",
    border: "#cfe3d9",
    accent: "#ffd166",
  },
  fonts: { heading: "Lemonada", body: "Tajawal" },
  radius: 24,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن دودل", "About"), seo: { title: L("عن دودل", "About Doodle") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("مول العرب، ٦ أكتوبر.", "Mall of Arabia, 6th of October."),
        heading: L("محتار في هدية؟", "Not sure which gift?"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الأمان والتغليف والكوبونات.", "Safety, gift wrap and coupons."),
        question: L("كود PLAY100 بيشتغل إزاي؟", "How does code PLAY100 work?"),
        answer: L("اكتبه في صفحة الدفع على أي طلب فوق ١٬٠٠٠ ج.م وهيخصم ١٠٠ ج.م.", "Enter it at checkout on any order over EGP 1,000 to take EGP 100 off."),
      }),
    },
  ],
  demo: DEMO,
});
