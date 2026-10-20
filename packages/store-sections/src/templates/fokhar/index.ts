/**
 * Fokhar (template 66, handmade ceramics; Claude Design "Storefront
 * Templates"): warm clay paper, a terracotta brown for actions and a
 * biscuit highlight, Reem Kufi headings over Almarai text and soft 20px
 * corners. A Fustat pottery: no two plates alike, this week's firing, clay
 * to table, the potters, double-boxed delivery and customers' tables. Built
 * from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): unglazed and glazed
 * plates, mugs, bowls and vases on workshop tables and shelves. No people,
 * no hands, no logos. The potters are shown by initials only.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels } from "../library-template";

export const FOKHAR_KEY = "fokhar";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(FOKHAR_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  mugPair: pexels(7674564, 900),
  mugPairWide: pexels(7674564),
  dinnerSet: pexels(6213678, 900),
  rawPlates: pexels(6611494, 900),
  whitePlates: pexels(6611496, 900),
  bluePlates: pexels(10900768, 900),
  rawCups: pexels(4830752, 900),
  glazeTable: pexels(7375048, 900),
  firedMugs: pexels(6611187, 900),
  glazedMugs: pexels(27682102, 900),
  stonewareMugs: pexels(31452624, 900),
  footedBowl: pexels(14380628, 900),
  bowlVase: pexels(11232062, 900),
  jugShelf: pexels(6692149, 900),
  workshopShelf: pexels(15440777),
  windowsill: pexels(6909856, 900),
  lotusBowls: pexels(29312155, 900),
  whiteTable: pexels(7674562, 900),
  mugPile: pexels(33784550, 900),
  mugTray: pexels(7674544, 900),
};

const NAME = L("فخار الفسطاط", "Fokhar Fustat");

const header = lib("header-line", {
  text: {
    "م": L("ف", "F"),
    "اسم متجرك": NAME,
    "المتجر": L("الخزف", "Ceramics"),
    "العروض": L("حرقة الأسبوع", "This week’s firing"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("الورشة", "The workshop"),
  },
  links: { "/products": [SHOP, NEW, undefined, SHOP, NEW], "/blog": "/faq" },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك وخد العروض قبل أي حد.": L("اشترك وأول ما الفرن يفتح تعرف.", "Subscribe and hear the moment the kiln opens."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("الورشة", "The workshop"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ فخار الفسطاط. كل الحقوق محفوظة.", "© 2026 Fokhar Fustat. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-bento", {
    photo: [PHOTOS.mugPairWide],
    text: {
      "وصل جديد": L("صنع في الفسطاط", "Made in Fustat"),
      "صوت أنقى، كل يوم": L("مفيش طبقين زي بعض", "No two plates alike"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "بيتشكل ويتلون ويتحرق عند ٦ فخرانية في مصر القديمة.",
        "Thrown, glazed and fired by six potters in Old Cairo.",
      ),
      "تسوق الآن": L("تسوق الخزف", "Shop ceramics"),
      "صورة الحملة": L("كوبايات وأطباق خزف مرسومة يدوي", "Hand-painted ceramic mugs and plates"),
      "٤٫٨": L("٤٫٩", "4.9"),
      "من ١٢ ألف تقييم": L("من أكتر من ٢٠٠ تقييم", "from 200+ reviews"),
    },
  }),
  lib("products-bento", {
    text: { "الأكثر طلبًا": L("من الفرن", "From the kiln"), "الكل بيسأل عليهم": L("حرقة الأسبوع", "This week’s firing") },
    links: { "/products": BEST },
  }),
  lib("about-stories", {
    photo: [undefined, PHOTOS.rawPlates, PHOTOS.glazeTable, PHOTOS.firedMugs],
    text: {
      "إزاي بنشتغل": L("بيتعمل إزاي", "How it is made"),
      "من المخزن لإيدك": L("من الطين للسفرة", "Clay to table"),
      "بنختار": L("تشكيل", "Throw"),
      "من موردين معتمدين بس.": L("كل طبق بيتشكل على العجلة.", "Every plate is shaped on the wheel."),
      "بنراجع": L("تلوين", "Glaze"),
      "كل منتج قبل ما يتغلّف.": L("بيتغطس في الألوان باليد.", "Dipped in glaze by hand."),
      "بنوصّل": L("حرق", "Fire"),
      "لحد باب البيت خلال أيام.": L("١٢ ساعة على ١٢٠٠ درجة.", "Twelve hours at 1,200°C."),
    },
  }),
  lib("team-grid", {
    text: {
      "الفريق": L("الفخرانية", "Potters"),
      "الناس اللي ورا المحل": L("الإيدين ورا كل قطعة", "The hands behind every piece"),
      "م": L("ر", "R"),
      "منى عادل": L("عم رجب", "Am Ragab"),
      "المؤسسة": L("العجلة، ٤٠ سنة", "Wheel, 40 years"),
      "ك": L("ن", "N"),
      "كريم سامي": L("نجوى", "Nagwa"),
      "المشتريات": L("الألوان", "Glazes"),
      "ي": L("ه", "H"),
      "ياسمين فؤاد": L("هاني", "Hany"),
      "خدمة العملاء": L("الفرن", "Kiln"),
      "ع": L("س", "S"),
      "عمر حسن": L("سعاد", "Soad"),
      "التوصيل": L("التغليف", "Packing"),
    },
  }),
  lib("pay-promise", {
    text: {
      "اطلب قبل ٢ الضهر، يوصلك بكره": L("متغلف مرتين ومأمّن طول الطريق", "Packed twice, insured all the way"),
      "٢:٠٠ م": L("يوم ١", "Day 1"),
      "بتطلب النهارده": L("بيتغلف في علبتين", "Wrapped and double-boxed"),
      "٦:٠٠ م": L("يوم ٢", "Day 2"),
      "بيتشحن": L("مع المندوب", "With the courier"),
      "بكره": L("يوم ٣", "Day 3"),
      "بيوصلك": L("على سفرتك", "On your table"),
      "مواعيد التوصيل": L("التوصيل والتغليف", "Delivery and packing"),
    },
  }),
  lib("gallery-polaroids", {
    photo: [undefined, undefined, undefined, PHOTOS.windowsill, PHOTOS.lotusBowls, PHOTOS.whiteTable, PHOTOS.mugPile, PHOTOS.mugTray],
    text: {
      "عملاؤنا": L("سفركم", "Your tables"),
      "أرسل لنا صورتك": L("ابعتلنا صورة سفرتك", "Send us your table"),
      "مريم": handle("@nour.cooks"),
      "عمر": handle("@coffee.dokki"),
      "نور": handle("@salma.home"),
      "يوسف": handle("@fridaylunch"),
      "سلمى": handle("@zamalek.table"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن فخار الفسطاط", "About Fokhar Fustat"), L("أطباق وكوبايات متشكلة باليد في الفسطاط.", "Plates and mugs thrown by hand in Fustat.")),
  aboutStory(lib, {
    photo: PHOTOS.workshopShelf,
    alt: L("أواني طين على رف الورشة", "Clay pieces on a workshop shelf"),
    eyebrow: L("مصر القديمة", "Old Cairo"),
    title: L("ورشة واحدة وستة فخرانية", "One workshop, six potters"),
    text: L(
      "بنشتغل الطين في ورشة صغيرة جنب قرية الفخارين، وكل قطعة بتاخد أسبوع من العجلة للفرن.",
      "We work the clay in a small workshop by the potters’ village, and each piece takes a week from wheel to kiln.",
    ),
    more: L("ولأن كل قطعة باليد، مفيش طبقين زي بعض بالظبط.", "And because every piece is handmade, no two plates are exactly alike."),
    button: L("تسوق حرقة الأسبوع", "Shop this week’s firing"),
    href: NEW,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أطباق وكوبايات متشكلة باليد في الفسطاط.", "Plates and mugs thrown by hand in Fustat."),
  categories: [
    ["plates", "أطباق", "Plates", PHOTOS.whitePlates],
    ["mugs", "كوبايات", "Mugs", PHOTOS.glazedMugs],
    ["bowls-vases", "طواجن وفازات", "Bowls & vases", PHOTOS.jugShelf],
  ],
  products: [
    ["stoneware-dinner-set", "plates", "طقم عشا ستون وير لـ٦ أفراد", "Stoneware Dinner Set for Six", PHOTOS.dinnerSet, 2450, { isFeatured: true, rating: 4.8, sold90: 132 }],
    ["hand-painted-mug-pair", "mugs", "كوبايتين مرسومين", "Hand-Painted Mug Pair", PHOTOS.mugPair, 420, { isFeatured: true, rating: 4.9, sold90: 88 }],
    ["white-plate-set", "plates", "طقم أطباق بيضا ٦ قطع", "White Plate Set of 6", PHOTOS.whitePlates, 1250, { sold90: 64 }],
    ["blue-glaze-plates", "plates", "أطباق مزججة أزرق", "Blue-Glaze Plates", PHOTOS.bluePlates, 1450, { compareAtPrice: 1700, sold90: 41 }],
    ["raw-clay-cups", "mugs", "٤ فناجين طين خام", "Raw Clay Cups, Set of 4", PHOTOS.rawCups, 380, { sold90: 70 }],
    ["glazed-mug-set", "mugs", "طقم مجات مزججة", "Glazed Mug Set", PHOTOS.glazedMugs, 640, { rating: 4.8, sold90: 57 }],
    ["stoneware-mugs", "mugs", "مجات ستون وير مدخنة", "Smoked Stoneware Mugs", PHOTOS.stonewareMugs, 520, { sold90: 46 }],
    ["footed-bowl", "bowls-vases", "طبق تقديم برجل", "Footed Serving Bowl", PHOTOS.footedBowl, 560, { sold90: 33 }],
    ["bowl-and-vase", "bowls-vases", "سلطانية وفازة", "Bowl & Vase Pair", PHOTOS.bowlVase, 890, { sold90: 28 }],
    ["clay-jug", "bowls-vases", "قلة طين", "Clay Jug", PHOTOS.jugShelf, 740, { inStock: false, sold90: 19 }],
  ],
});

export const FOKHAR = libraryTemplate({
  key: FOKHAR_KEY,
  version: 1,
  name: L("فخار", "Fokhar"),
  description: L(
    "خزف يدوي: حرقة الأسبوع، من الطين للسفرة، الفخرانية وتغليف في علبتين. أربع صفحات جاهزة.",
    "Handmade ceramics: this week’s firing, clay to table, the potters and double-boxed delivery. Four ready pages.",
  ),
  category: "handmade",
  sortOrder: 660,
  palette: ["#f7f1ea", "#ecdfd0", "#e8b98a", "#a4502a"],
  colors: {
    primary: "#a4502a",
    secondary: "#ecdfd0",
    background: "#f7f1ea",
    foreground: "#2b1d14",
    muted: "#6c5a4c",
    border: "#dfcdb8",
    accent: "#e8b98a",
  },
  fonts: { heading: "Reem Kufi", body: "Almarai" },
  radius: 20,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("الورشة", "The workshop"), seo: { title: L("عن فخار الفسطاط", "About Fokhar Fustat") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("الورشة جنب قرية الفخارين، الفسطاط. الزيارة بميعاد.", "The workshop is by the potters’ village, Fustat. Visits by appointment."),
        heading: L("عن قطعة أو طلب خاص", "About a piece or a special order"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("العناية والتغليف والتوصيل.", "Care, packing and delivery."),
        question: L("الخزف ينفع في الغسالة والميكروويف؟", "Is it dishwasher and microwave safe?"),
        answer: L("أيوه، كل الألوان آمنة على الأكل وبتستحمل الغسالة والميكروويف.", "Yes, every glaze is food safe and handles the dishwasher and microwave."),
      }),
    },
  ],
  demo: DEMO,
});
