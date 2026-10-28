/**
 * Mafrash (template 79, bedding and textiles; Claude Design "Storefront
 * Templates"): warm white paper, a calm denim blue for actions and a pale sky
 * highlight, Noto Kufi Arabic throughout and 14px corners. A bedding shop
 * that lets you sleep on it first: the 30-night trial, the bed set bundle,
 * why Egyptian cotton, new colours, share a good night and reviews from
 * people who slept on it. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): made and unmade beds,
 * linen sets, folded duvets, knitted throws and cushions. No people, no
 * hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const MAFRASH_KEY = "mafrash";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(MAFRASH_KEY, getDesign(id)!, { corners: 14, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  leafBedroom: pexels(5152681),
  unmadeLinen: pexels(3847588, 900),
  blanketStool: pexels(5881237, 900),
  sofaCushions: pexels(4846450, 900),
  basketThrow: pexels(5789581),
  cottonSheets: pexels(3755590, 900),
  waffleThrow: pexels(4577654, 900),
  velvetCushions: pexels(4271665, 900),
  duvetCover: pexels(189293, 900),
  folded: pexels(3872927, 900),
  greyLinen: pexels(7445081, 900),
  beigeLinen: pexels(27439405, 900),
  oliveLinen: pexels(20801059, 900),
  gingham: pexels(7765000, 900),
  chunkyKnit: pexels(10321569, 900),
  redKnit: pexels(3996529, 900),
  blushPillow: pexels(18501199, 900),
};

const NAME = L("مفرش هوم", "Mafrash Home");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("جرّب ٣٠ ليلة · استرجاع ببلاش على المفارش", "Try for 30 nights · Free returns on bedding"),
    "الدفع عند الاستلام": L("الدفع عند الاستلام", "Cash on delivery"),
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "المتجر": L("المفارش", "Bedding"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("عن مفرش", "About"),
  },
  links: { "/products": [search("طقم"), BEST, undefined, search("طقم"), BEST], "/blog": "/faq" },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("ألوان جديدة كل موسم", "New colours every season"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("اعرف الألوان الجديدة قبل الكل، ونصايح غسيل القطن.", "Hear about new colours first, plus cotton washing tips."),
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ مفرش هوم. كل الحقوق محفوظة.", "© 2026 Mafrash Home. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.leafBedroom],
    text: {
      "كوليكشن الموسم": L("تجربة ٣٠ ليلة", "30-night trial"),
      "صوت أنقى، كل يوم": L("نام عليها الأول", "Sleep on it first"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "لو ما حبيتش الملايات بعد ٣٠ ليلة، بنرجّعها ببلاش.",
        "If you do not love the sheets after 30 nights, we collect them for free.",
      ),
      "تسوق الآن": L("تسوق المفارش", "Shop bedding"),
      "العروض": L("الأكثر مبيعاً", "Best sellers"),
      "صورة الحملة": L("سرير بمفرش ورق شجر جنب كومودينو وورد", "A bed with leaf-print bedding beside a nightstand with flowers"),
    },
    links: { "/products": [search("طقم"), BEST] },
  }),
  lib("categories-captioned", { text: { "اكتشف الأقسام": L("جهّز سريرك", "Make your bed"), "كل الأقسام": L("كل المفروشات", "All bedding") } }),
  lib("products-rail", {
    text: { "بيحبوها": L("وصل جديد", "New in"), "الأكثر مبيعًا": L("ألوان جديدة", "New colours") },
    links: { "/products": NEW },
    lists: [{ source: "newest", limit: 8 }],
  }),
  lib("features-ruled", {
    text: {
      "توصيل سريع": L("قطن مصري", "Egyptian cotton"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("قطن جيزة طويل التيلة", "Long-staple Giza cotton"),
      "الدفع عند الاستلام": L("مغسول", "Pre-washed"),
      "أو ادفع بالبطاقة والمحفظة": L("ناعم من أول ليلة", "Soft from the first night"),
      "استرجاع سهل": L("٣٠ ليلة", "30 nights"),
      "١٤ يومًا لتغيّر رأيك": L("استرجاع ببلاش على المفارش", "Free returns on bedding"),
      "دعم على واتساب": L("الدفع عند الاستلام", "Cash on delivery"),
      "أشخاص حقيقيون طوال الأسبوع": L("أو بالبطاقة والمحفظة", "Or by card and wallet"),
    },
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("ناموا عليها", "Slept on it"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الملايات ناعمة من أول غسلة وما كرمشتش زي اللي كانت عندي.",
        "The sheets were soft from the first wash and do not crease like my old ones.",
      ),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("تاني طقم أطلبه، المرة دي الكتان البيج.", "My second set; this time the beige linen."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "طلبت مقاس غلط، جم أخدوه وبعتولي الصح في يومين.",
        "I ordered the wrong size; they collected it and sent the right one in two days.",
      ),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("البطانية الوافل خفيفة ومناسبة للصيف بالظبط.", "The waffle throw is light and just right for summer."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("جربتها ٣٠ ليلة وما رجعتهاش طبعاً.", "I tried them for 30 nights and of course kept them."),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("ساعدوني أختار اللون اللي يمشي مع الحيطة.", "They helped me pick a colour that suits the wall."),
      "كل الآراء": L("تسوق المفارش", "Shop bedding"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن مفرش", "About Mafrash"), L("ملايات قطن مصري، مغسولة وناعمة.", "Egyptian cotton sheets, washed soft.")),
  aboutStory(lib, {
    photo: PHOTOS.basketThrow,
    alt: L("بطانية تريكو في سبت خوص", "A knitted throw in a wicker basket"),
    eyebrow: L("من المحلة", "From El Mahalla"),
    title: L("قطن جيزة من المصنع لسريرك", "Giza cotton from the mill to your bed"),
    text: L("بننسج ملاياتنا من قطن جيزة طويل التيلة في المحلة، وبنغسلها قبل ما تتغلف عشان تبقى ناعمة من أول ليلة.", "We weave our sheets from long-staple Giza cotton in El Mahalla and wash them before packing, so they are soft from the first night."),
    more: L("وعندك ٣٠ ليلة تجربها قبل ما تقرر.", "And you have 30 nights to try them before you decide."),
    button: L("تسوق المفارش", "Shop bedding"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ملايات قطن مصري، مغسولة وناعمة.", "Egyptian cotton sheets, washed soft."),
  categories: [
    ["bedding", "مفارش", "Bedding", PHOTOS.unmadeLinen],
    ["throws", "بطاطين", "Throws", PHOTOS.blanketStool],
    ["cushions", "مخدات", "Cushions", PHOTOS.sofaCushions],
    ["sheets", "ملايات", "Sheets", PHOTOS.cottonSheets],
    ["duvets", "لحف وكفرات", "Duvets & covers", PHOTOS.duvetCover],
  ],
  products: [
    ["cotton-sheet-set", "sheets", "طقم ملايات قطن", "Cotton Sheet Set", PHOTOS.cottonSheets, 1450, { isFeatured: true, rating: 4.8, sold90: 210 }],
    ["waffle-knit-throw", "throws", "بطانية وافل", "Waffle Knit Throw", PHOTOS.waffleThrow, 890, { rating: 4.7, sold90: 96 }],
    ["velvet-cushion-pair", "cushions", "مخدتين قطيفة", "Velvet Cushion Pair", PHOTOS.velvetCushions, 650, { sold90: 120 }],
    ["beige-linen-set", "bedding", "طقم كتان بيج", "Beige Linen Set", PHOTOS.beigeLinen, 1750, { sold90: 48 }],
    ["olive-linen-set", "bedding", "طقم كتان زيتي", "Olive Linen Set", PHOTOS.oliveLinen, 1750, { sold90: 31 }],
    ["grey-linen-set", "bedding", "طقم كتان رمادي", "Grey Linen Set", PHOTOS.greyLinen, 1890, { sold90: 40 }],
    ["gingham-bedding", "sheets", "طقم ملايات كاروهات", "Gingham Sheet Set", PHOTOS.gingham, 1290, { sold90: 27 }],
    ["duvet-cover", "duvets", "كفر لحاف", "Duvet Cover", PHOTOS.duvetCover, 1190, { compareAtPrice: 1390, sold90: 41 }],
    ["light-duvet", "duvets", "لحاف خفيف", "Light Duvet", PHOTOS.folded, 1690, { inStock: false, sold90: 22 }],
    ["chunky-knit-blanket", "throws", "بطانية تريكو تقيلة", "Chunky Knit Blanket", PHOTOS.chunkyKnit, 1150, { isFeatured: true, sold90: 35 }],
    ["red-knit-throw", "throws", "بطانية تريكو حمرا", "Red Knit Throw", PHOTOS.redKnit, 950, { compareAtPrice: 1100, sold90: 19 }],
    ["blush-pillow", "cushions", "مخدة بينك فاتح", "Blush Pillow", PHOTOS.blushPillow, 390, { sold90: 64 }],
  ],
});

export const MAFRASH = libraryTemplate({
  key: MAFRASH_KEY,
  version: 3,
  changelog: "Mafrash v3: categories, section order",
  productPage: { thumbs: "side", band: "paper", extras: ["product-perks"], copy: { reviews: L("رأي اللي نام عليها", "From people who slept on it"), related: L("يكمّل السرير", "Finish the bed") } },
  name: L("مفرش", "Mafrash"),
  description: L(
    "مفارش وملايات: تجربة ٣٠ ليلة، طقم السرير، قطن مصري، ألوان جديدة وشارك نومة حلوة. أربع صفحات جاهزة.",
    "Bedding and textiles: a 30-night trial, the bed set, Egyptian cotton, new colours and share a good night. Four ready pages.",
  ),
  category: "home",
  sortOrder: 790,
  palette: ["#fbfaf8", "#efece6", "#dbe7f5", "#4a6fa5"],
  colors: {
    primary: "#4a6fa5",
    secondary: "#efece6",
    background: "#fbfaf8",
    foreground: "#1f2328",
    muted: "#5b6168",
    border: "#e2ded5",
    accent: "#dbe7f5",
  },
  fonts: { heading: "Noto Kufi Arabic", body: "Noto Kufi Arabic" },
  radius: 14,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن مفرش", "About"), seo: { title: L("عن مفرش", "About Mafrash") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("اسألنا عن المقاسات والألوان والتجربة.", "Ask us about sizes, colours and the trial."),
        heading: L("اسأل عن مقاس سريرك", "Ask about your bed size"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والغسيل وتجربة ٣٠ ليلة.", "Sizes, washing and the 30-night trial."),
        question: L("تجربة الـ٣٠ ليلة بتشتغل إزاي؟", "How does the 30-night trial work?"),
        answer: L("نام على المفارش ٣٠ ليلة، ولو ما حبيتهاش اطلب استرجاع وبنيجي ناخدها ببلاش.", "Sleep on the bedding for 30 nights; if you do not love it, request a return and we collect it free."),
      }),
    },
  ],
  demo: DEMO,
});
