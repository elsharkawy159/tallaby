/**
 * Mama (template 87, calm baby essentials; Claude Design "Storefront
 * Templates"): warm off-white paper, a soft sage for actions and a blush
 * highlight, Baloo Bhaijaan 2 throughout and round 22px corners. A quiet
 * baby shop run by two mums: soft, safe, simple, shop by the baby's age,
 * a hospital bag bundle, what we promise, a gift card for a new mum and
 * mums' reviews. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): baby clothes laid flat
 * or on a hanger, a knitted elephant on folded blankets, a stacking toy,
 * wooden animals, a rolled towel, a white cot and wrapped gifts. The
 * design's photos of babies and toddlers were replaced. No people, no
 * hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const MAMA_KEY = "mama";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(MAMA_KEY, getDesign(id)!, { corners: 22, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  cottonSet: pexels(3875082, 900),
  elephant: pexels(4886896),
  elephantSmall: pexels(4886896, 900),
  stacker: pexels(9271761, 900),
  animals: pexels(1319572, 900),
  pyjamas: pexels(4858394, 900),
  onesie: pexels(29015875, 900),
  towel: pexels(2672634, 900),
  cot: pexels(37185810, 900),
  gifts: pexels(1303087, 900),
};

const NAME = L("ماما وأنا", "Mama & Me");
const GIFTS = search("بوكس");

const header = lib("header-line", {
  text: {
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "المتجر": L("تسوقي", "Shop"),
    "العروض": L("بوكسات هدايا", "Gift boxes"),
    "المدونة": L("أسئلة", "FAQ"),
  },
  links: { "/products": [SHOP, GIFTS, undefined, SHOP, GIFTS], "/blog": "/faq" },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك وخد العروض قبل أي حد.": L("نصايح لأول سنة وعروض للماميز، مرة كل أسبوعين.", "First-year tips and offers for mums, every two weeks."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ ماما وأنا. كل الحقوق محفوظة.", "© 2026 Mama & Me. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.elephant],
    text: {
      "كوليكشن الموسم": L("أول سنة", "First year"),
      "صوت أنقى، كل يوم": L("ناعم وآمن وبسيط", "Soft, safe, simple"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L("قطن عضوي ولعب خشب متختارة من ماميتين.", "Organic cotton and wooden toys chosen by two mums."),
      "تسوق الآن": L("تسوقي البيبي", "Shop baby"),
      "العروض": L("بوكسات الهدايا", "Gift boxes"),
      "صورة الحملة": L("فيل تريكو جنب بطاطين متطبقة", "A knitted elephant beside folded blankets"),
    },
    links: { "/products": [SHOP, GIFTS] },
  }),
  lib("categories-photo-tiles", { text: { "تسوّق حسب القسم": L("كل اللي البيبي محتاجه", "Everything baby needs") } }),
  lib("products-grid", {
    text: { "وصل حديثًا": L("هدايا البيبي", "Baby gifts"), "أحدث المنتجات اللي نزلت المتجر.": L("أحدث الهدايا اللي وصلت المحل.", "The newest gifts in the shop.") },
    links: { "/products": NEW },
  }),
  lib("team-values", {
    text: {
      "بنشتغل إزاي": L("بنوعد بإيه", "What we promise"),
      "أصلي": L("عضوي", "Organic"),
      "كل منتج من الوكيل أو المستورد الرسمي، ومعاه ضمان.": L("قطن معتمد في كل حاجة بتلمس بشرة البيبي.", "Certified cotton in everything that touches baby’s skin."),
      "واضح": L("متجرب", "Tested"),
      "السعر اللي تشوفه هو اللي تدفعه، من غير مصاريف مخفية.": L("كل لعبة بتعدي اختبار EN71 للأمان.", "Every toy passes the EN71 safety test."),
      "قريب": L("صريح", "Honest"),
      "بنرد على واتساب في أقل من ساعة، حتى يوم الجمعة.": L("صور حقيقية ومقاسات حقيقية، من غير فلاتر.", "Real photos and real sizes, no filters."),
    },
  }),
  lib("testimonials-ruled", {
    text: {
      "آراء العملاء": L("الآراء", "Reviews"),
      "قالوا عننا": L("من الماميز", "From mums"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "القطن ناعم جداً وما عملش أي حساسية لبنتي من أول غسلة.",
        "The cotton is so soft and gave my daughter no rash from the first wash.",
      ),
      "م": L("ر", "R"),
      "مريم أ.": L("رنا ع.", "Rana A."),
      "القاهرة": L("الشيخ زايد", "Sheikh Zayed"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("جبت بوكس أهلاً بيبي هدية سبوع، وكان متغلف حلو جداً.", "I gave the Welcome Baby box at a baby shower; beautifully wrapped."),
      "ع": L("ه", "H"),
      "عمر ك.": L("هدى م.", "Hoda M."),
      "الإسكندرية": L("سموحة", "Smouha"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("المقاسات مظبوطة زي ما مكتوب بالظبط.", "Sizes are exactly as listed."),
      "ن": L("ل", "L"),
      "نور ح.": L("ليلى ف.", "Laila F."),
      "الجيزة": L("المعادي", "Maadi"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن ماما وأنا", "About Mama & Me"), L("ماميتين بيختاروا أساسيات أول سنة.", "Two mums choosing first-year basics.")),
  aboutStory(lib, {
    photo: PHOTOS.cot,
    alt: L("سرير بيبي أبيض في أوضة هادية", "A white cot in a calm room"),
    eyebrow: L("الشيخ زايد", "Sheikh Zayed"),
    title: L("اللي كنا عايزينه لولادنا", "What we wanted for our own babies"),
    text: L("لما ولدنا ما لقيناش حاجة بسيطة وقطنها نضيف، فبدأنا نختار بنفسنا.", "When our babies came we could not find simple, clean cotton basics, so we started choosing them ourselves."),
    more: L("وكل طلب بيتغلف هدية ببلاش، وتقدري تدفعي عند الاستلام.", "Every order is gift wrapped free, and you can pay at the door."),
    button: L("تسوقي البيبي", "Shop baby"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أساسيات ناعمة لأول سنة.", "Soft basics for the first year."),
  categories: [
    ["clothes", "لبس", "Clothes", PHOTOS.cottonSet],
    ["toys", "أول لعب", "First toys", PHOTOS.stacker],
    ["gifts", "بوكسات هدايا", "Gift boxes", PHOTOS.elephantSmall],
    ["nursery", "أوضة البيبي", "Nursery", PHOTOS.cot],
    ["bath", "حمّام البيبي", "Bath time", PHOTOS.towel],
  ],
  products: [
    ["newborn-cotton-set", "clothes", "طقم قطن لحديثي الولادة", "Newborn Cotton Set", PHOTOS.cottonSet, 590, { isFeatured: true, rating: 4.9, sold90: 210 }],
    ["stacking-rings", "toys", "حلقات التركيب", "Stacking Rings", PHOTOS.stacker, 260, { sold90: 120 }],
    ["welcome-baby-box", "gifts", "بوكس أهلاً بيبي", "Welcome Baby Box", PHOTOS.elephantSmall, 1290, { isFeatured: true, sold90: 96 }],
    ["animal-friends", "toys", "الحيوانات", "Animal Friends", PHOTOS.animals, 390, { compareAtPrice: 450, sold90: 44 }],
    ["pyjamas-and-booties", "clothes", "بيجامة وشبشب قطن", "Cotton Pyjamas & Booties", PHOTOS.pyjamas, 480, { rating: 4.8, sold90: 88 }],
    ["sleepsuit-and-vest", "clothes", "أوفرول وفيست فرو", "Sleepsuit & Fleece Vest", PHOTOS.onesie, 650, { sold90: 52 }],
    ["soft-cotton-towel", "bath", "فوطة قطن ناعمة", "Soft Cotton Towel", PHOTOS.towel, 240, { sold90: 74 }],
    ["white-cot", "nursery", "سرير بيبي أبيض", "White Cot", PHOTOS.cot, 5400, { compareAtPrice: 6200, sold90: 12 }],
    ["gift-wrap-set", "gifts", "طقم تغليف هدايا", "Gift Wrap Set", PHOTOS.gifts, 150, { inStock: false, sold90: 30 }],
  ],
});

export const MAMA = libraryTemplate({
  key: MAMA_KEY,
  version: 3,
  changelog: "Mama v3: categories after the hero",
  productPage: { surface: "shelf", thumbs: "bottom", band: "paper", extras: ["product-shipping"], copy: { reviews: L("رأي الماميز", "Mums' reviews"), related: L("حاجات تانية للبيبي", "More for the baby") } },
  name: L("ماما", "Mama"),
  description: L(
    "مستلزمات بيبي هادية: حسب سن البيبي، شنطة الولادة، وعدنا وكارت هدية لمامي جديدة. أربع صفحات جاهزة.",
    "Calm baby essentials: shop by the baby’s age, a hospital bag, our promise and a gift card for a new mum. Four ready pages.",
  ),
  category: "kids",
  sortOrder: 870,
  palette: ["#fcfaf7", "#f1ede7", "#f6d6c8", "#7a9e9f"],
  colors: {
    primary: "#7a9e9f",
    secondary: "#f1ede7",
    background: "#fcfaf7",
    foreground: "#2a3140",
    muted: "#606878",
    border: "#e5dfd6",
    accent: "#f6d6c8",
  },
  fonts: { heading: "Baloo Bhaijaan 2", body: "Baloo Bhaijaan 2" },
  radius: 22,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن ماما وأنا", "About"), seo: { title: L("عن ماما وأنا", "About Mama & Me") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("بيفرلي هيلز، الشيخ زايد.", "Beverly Hills, Sheikh Zayed."),
        heading: L("اسألينا عن مقاس أو هدية", "Ask us about a size or a gift"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والهدايا والتوصيل.", "Sizes, gifts and delivery."),
        question: L("ينفع أبدّل المقاس؟", "Can I swap a size?"),
        answer: L("أيوه، خلال ١٤ يوم لو القطعة جديدة بالتيكيت.", "Yes, within 14 days if the piece is new with its tag."),
      }),
    },
  ],
  demo: DEMO,
});
