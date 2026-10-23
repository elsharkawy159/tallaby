/**
 * Ghorza (template 48, ready-to-wear with a tailoring studio; Claude Design
 * "Storefront Templates"): stone paper, an aubergine for actions and a
 * camel highlight, Noto Naskh Arabic headings over Noto Sans Arabic and
 * square corners. A label that alters before it ships: new in at the
 * studio, an Eid look in three pieces, alteration prices, a studio fitting,
 * the tailors, what we promise and a gift fitting. Built from section
 * library designs (`fromLibrary`).
 *
 * Rewards have no library designs yet: "Gift card" uses the coupon card
 * (`promo-coupon`); gift cards are requested from the contact page (no
 * gift-card balance at checkout). Alterations are not a product option: the
 * customer books a fitting or writes measurements in the order note. The
 * look total is typed copy for the three newest products; the tailors show
 * initials. The price menu has a third trouser line (the library's first
 * group has three rows).
 *
 * Photos: Pexels, each checked by eye (2026-10-23): linen jackets and shirts
 * on a rail, a charcoal linen jacket on a hanger, a linen overshirt on a
 * branch, folded tees, a knit vest on a hanger, a floral dress hanging on a
 * door, a slip dress on a rail, folded knits, a leather top-handle bag, a
 * leather messenger and a cutting mat with tools. The design's photos of
 * models and its bag beside a branded perfume were replaced. No people, no
 * hands, no mannequins and no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const GHORZA_KEY = "ghorza";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(GHORZA_KEY, getDesign(id)!, { corners: 0, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;
const DRESSES = search("فستان");

const PHOTOS = {
  linenRail: pexels(6461477),
  charcoalJacket: pexels(6461394, 900),
  overshirt: pexels(22441297, 900),
  foldedTees: pexels(34156907, 900),
  knitVest: pexels(2850487, 900),
  floralDress: pexels(31683080, 900),
  slipDress: pexels(18984479, 900),
  foldedKnits: pexels(9603625, 900),
  topHandleBag: pexels(4830926, 900),
  messenger: pexels(1152077, 900),
  workbench: pexels(4452603),
};

const NAME = L("غُرزة أتيليه", "Ghorza Atelier");

const header = lib("header-centered", {
  text: {
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨": L("لبس جاهز، بيتظبط على مقاسك", "Ready-to-wear, altered to fit you"),
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("فساتين", "Dresses"),
    "المدونة": L("الأسئلة", "FAQ"),
    "تواصل معنا": L("الستوديو", "Studio"),
  },
  links: { "/products": [undefined, DRESSES, undefined, undefined, DRESSES], "/blog": "/faq" },
});

const footer = lib("footer-links", {
  text: {
    "م": L("غ", "G"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ غُرزة أتيليه. كل الحقوق محفوظة.", "© 2026 Ghorza Atelier. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.linenRail],
    text: {
      "كوليكشن الموسم": L("خريف ٢٠٢٦", "Autumn 2026"),
      "صوت أنقى، كل يوم": L("جاهز، ومتظبط على مقاسك", "Ready to wear, cut to fit"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "كل قطعة ممكن تتقصر أو تتضيق أو تتوسع عند الترزية قبل ما تتشحن.",
        "Every piece can be hemmed, taken in or let out by our tailors before it ships.",
      ),
      "تسوق الآن": L("تسوق الكوليكشن", "Shop the collection"),
      "العروض": L("احجز قياس", "Book a fitting"),
      "صورة الحملة": L("جواكت وقمصان كتان على راك", "Linen jackets and shirts on a rail"),
    },
    links: { "/products": [SHOP, "/contact"] },
  }),
  lib("products-rail", {
    text: { "بيحبوها": L("وصل جديد", "New in"), "الأكثر مبيعًا": L("الأسبوع ده في الستوديو", "This week at the studio") },
    links: { "/products": NEW },
    lists: [{ source: "newest", limit: 7 }],
  }),
  lib("bundle-poster", {
    text: {
      "طقم المشاوير": L("لبس العيد", "Eid outfit"),
      "كل اللي تحتاجه في الطريق": L("لوك واحد، ٣ قطع", "One look, three pieces"),
      "١٬٢٧٠ ج.م": L("٤٬٠٤٨ ج.م", "EGP 4,048"),
      "بدل ١٬٤٩٠ ج.م": L("بدل ٤٬٦٠٠ ج.م", "Was EGP 4,600"),
      "اشتري الطقم": L("خد اللوك", "Get the look"),
      "خصم ١٥٪": L("خصم ١٢٪", "12% off"),
    },
    links: { "/products": NEW },
  }),
  lib("service-price-menu", {
    text: {
      "أسعار الخدمات": L("أسعار التظبيط", "Alteration prices"),
      "الأسعار شاملة قطع الغيار الأصلية والضمان.": L("التقصير مجاني على أي حاجة تشتريها مننا.", "Free hemming on anything you buy from us."),
      "الموبايل": L("البنطلونات", "Trousers"),
      "تغيير بطارية": L("تقصير", "Hem"),
      "٦٥٠ ج.م": L("٨٠ ج.م", "EGP 80"),
      "تغيير شاشة": L("تضييق وسط", "Take in waist"),
      "٢٤٠٠ ج.م": L("١٥٠ ج.م", "EGP 150"),
      "سوكت الشحن": L("تضييق رجل", "Taper legs"),
      "٤٥٠ ج.م": L("١٢٠ ج.م", "EGP 120"),
      "الشاشات والبيت": L("الجواكت", "Jackets"),
      "تركيب حائط": L("تقصير أكمام", "Shorten sleeves"),
      "٣٥٠ ج.م": L("١٨٠ ج.م", "EGP 180"),
      "ضبط رسيفر": L("تضييق جناب", "Take in sides"),
      "١٥٠ ج.م": L("٢٢٠ ج.م", "EGP 220"),
      "السماعات": L("الفساتين", "Dresses"),
      "تغيير وسايد": L("تقصير", "Hem"),
      "تنظيف وفحص": L("تظبيط حمالات", "Adjust straps"),
      "٨٠ ج.م": L("٩٠ ج.م", "EGP 90"),
    },
  }),
  lib("service-booking", {
    text: {
      "احجز معاد الفني": L("احجز قياس", "Book a fitting"),
      "تركيب شاشة · حوالي ساعة": L("قياس في ستوديو الزمالك · حوالي نص ساعة", "Studio fitting in Zamalek · about 30 minutes"),
      "مواعيد الزيارات": L("مواعيد الستوديو", "Studio times"),
      "١٠ ص": L("١١ ص", "11 am"),
      "١٢ الضهر": L("١ الضهر", "1 pm"),
      "٢ م": L("٣ م", "3 pm"),
      "٤ م": L("٥ م", "5 pm"),
      "٦ م": L("٧ م", "7 pm"),
      "٨ م": L("٩ م", "9 pm"),
    },
  }),
  lib("team-grid", {
    text: {
      "الفريق": L("الستوديو", "The studio"),
      "الناس اللي ورا المحل": L("الترزية ورا كل غرزة", "The tailors behind every hem"),
      "م": L("س", "S"),
      "منى عادل": L("عم سعيد", "Am Said"),
      "المؤسسة": L("كبير الترزية، ٣٤ سنة", "Head tailor, 34 years"),
      "ك": L("ر", "R"),
      "كريم سامي": L("رشا نبيل", "Rasha Nabil"),
      "المشتريات": L("باترونيست", "Pattern cutter"),
      "ي": L("م", "M"),
      "ياسمين فؤاد": L("مينا فوزي", "Mina Fawzy"),
      "خدمة العملاء": L("القياس", "Fitting"),
      "ع": L("ه", "H"),
      "عمر حسن": L("هنا عزت", "Hana Ezzat"),
      "التوصيل": L("المؤسسة", "Founder"),
    },
  }),
  lib("team-values", {
    text: {
      "بنشتغل إزاي": L("بنوعد بإيه", "What we promise"),
      "أصلي": L("المقاس", "Fit"),
      "كل منتج من الوكيل أو المستورد الرسمي، ومعاه ضمان.": L("التظبيط قبل ما تخرج من الستوديو، مش بعد.", "Alterations before it leaves the studio, not after."),
      "واضح": L("القماش", "Fabric"),
      "السعر اللي تشوفه هو اللي تدفعه، من غير مصاريف مخفية.": L(
        "قطن مصري وكريب وصوف نقدر نقولك جاي من أنهي مصنع.",
        "Egyptian cotton, crepe and wool we can name the mill for.",
      ),
      "قريب": L("الوقت", "Time"),
      "بنرد على واتساب في أقل من ساعة، حتى يوم الجمعة.": L("القطع المتظبطة بتتشحن خلال ٣ أيام.", "Altered pieces ship within three days."),
    },
  }),
  lib("promo-coupon", {
    name: L("اهدي قياس", "Gift a fitting"),
    text: {
      "٢٠٪": L("١٠٠٠", "1,000"),
      "خصم": L("ج.م", "EGP"),
      "خصم على أول طلب لك": L("اهدي قياس", "Gift a fitting"),
      "للطلبات فوق ٨٠٠ ج.م · حتى ٣٠ نوفمبر": L(
        "كارت هدية بـ ٥٠٠ أو ١٠٠٠ أو ٢٠٠٠ أو ٣٥٠٠ ج.م، على أي قطعة أو تظبيط في الستوديو.",
        "A gift card for EGP 500, 1,000, 2,000 or 3,500, good for any piece or alteration at the studio.",
      ),
      "الكود: WELCOME20": L("اطلبه من صفحة التواصل", "Order it from the contact page"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن غُرزة أتيليه", "About Ghorza Atelier"), L("براند لبس جاهز معاه ستوديو ترزية في الزمالك.", "A ready-to-wear label with a tailoring studio in Zamalek.")),
  aboutStory(lib, {
    photo: PHOTOS.workbench,
    alt: L("ترابيزة قص عليها عدة وقطع جلد", "A cutting mat with tools and leather pieces"),
    eyebrow: L("الزمالك", "Zamalek"),
    title: L("جاهز، بس على مقاسك", "Ready-made, but made to fit"),
    text: L("كل قطعة بتعدي على الترزية قبل ما تتشحن: تقصير أو تضييق أو توسيع.", "Every piece passes through the tailors before it ships: hemmed, taken in or let out."),
    more: L("والتقصير مجاني على أي حاجة تشتريها مننا.", "And hemming is free on anything you buy from us."),
    button: L("تسوق الكوليكشن", "Shop the collection"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("لبس جاهز، بيتظبط على مقاسك.", "Ready-to-wear, altered to fit you."),
  categories: [
    ["suits", "بدل وأطقم", "Suits & sets", PHOTOS.charcoalJacket],
    ["dresses", "فساتين", "Dresses", PHOTOS.floralDress],
    ["jackets", "جواكت", "Jackets", PHOTOS.overshirt],
    ["basics", "أساسيات", "Basics", PHOTOS.foldedTees],
    ["bags", "شنط", "Bags", PHOTOS.topHandleBag],
  ],
  products: [
    ["linen-overshirt", "jackets", "أوفرشيرت كتان", "Linen Overshirt", PHOTOS.overshirt, 2200, { sold90: 51 }],
    ["heavy-cotton-tee", "basics", "تيشيرت قطن تقيل", "Heavy Cotton Tee", PHOTOS.foldedTees, 550, { sold90: 140 }],
    ["top-handle-leather-bag", "bags", "شنطة جلد بيد", "Top-Handle Leather Bag", PHOTOS.topHandleBag, 1850, { isFeatured: true, sold90: 47 }],
    ["charcoal-linen-suit", "suits", "بدلة كتان فحمي", "Charcoal Linen Suit", PHOTOS.charcoalJacket, 3900, { isFeatured: true, rating: 4.8, sold90: 86 }],
    ["floral-midi-dress", "dresses", "فستان ميدي مشجر", "Floral Midi Dress", PHOTOS.floralDress, 2400, { sold90: 64 }],
    ["knit-vest", "basics", "فيست تريكو", "Knit Vest", PHOTOS.knitVest, 950, { compareAtPrice: 1150, sold90: 33 }],
    ["leather-messenger", "bags", "شنطة ماسنجر جلد", "Leather Messenger", PHOTOS.messenger, 2100, { sold90: 22 }],
    ["printed-slip-dress", "dresses", "فستان سليب مطبوع", "Printed Slip Dress", PHOTOS.slipDress, 1900, { sold90: 38 }],
    ["merino-knit-jumper", "basics", "بلوفر ميرينو", "Merino Knit Jumper", PHOTOS.foldedKnits, 1250, { inStock: false, sold90: 20 }],
  ],
});

export const GHORZA = libraryTemplate({
  key: GHORZA_KEY,
  version: 2,
  changelog: "Ghorza v2: product page",
  productPage: { surface: "flat", thumbs: "side", button: "outline", tracking: 0.06, band: "shelf", extras: ["product-perks"], copy: { back: L("رجوع للتشكيلة", "Back to the collection"), reviews: L("رأي اللي لبسوا غُرزة", "Worn and reviewed"), related: L("كمّل اللوك", "Complete the look") } },
  name: L("غُرزة", "Ghorza"),
  description: L(
    "لبس جاهز وستوديو ترزية: الجديد، لوك العيد، أسعار التظبيط، حجز قياس، الترزية، وعودنا وكارت هدية. أربع صفحات جاهزة.",
    "Ready-to-wear with a tailoring studio: new in, an Eid look, alteration prices, a fitting booking, the tailors, our promises and a gift card. Four ready pages.",
  ),
  category: "fashion",
  sortOrder: 480,
  palette: ["#f6f3ef", "#e9e2d9", "#e8c9a0", "#3d2c5c"],
  colors: {
    primary: "#3d2c5c",
    secondary: "#e9e2d9",
    background: "#f6f3ef",
    foreground: "#1d1724",
    muted: "#5f5866",
    border: "#ddd5cb",
    accent: "#e8c9a0",
  },
  fonts: { heading: "Noto Naskh Arabic", body: "Noto Sans Arabic" },
  radius: 0,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن غُرزة", "About"), seo: { title: L("عن غُرزة أتيليه", "About Ghorza Atelier") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("الستوديو", "The studio"),
        text: L("شارع ٢٦ يوليو، الزمالك. القياس بالحجز.", "26th of July St, Zamalek. Fittings by appointment."),
        heading: L("احجز قياس أو ابعت مقاساتك", "Book a fitting or send your measurements"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التظبيط والقياس والشحن.", "Alterations, fittings and shipping."),
        question: L("أطلب تظبيط إزاي أونلاين؟", "How do I ask for an alteration online?"),
        answer: L("اكتب مقاساتك في ملاحظة الطلب، أو احجز قياس في الستوديو.", "Write your measurements in the order note, or book a fitting at the studio."),
      }),
    },
  ],
  demo: DEMO,
});
