/**
 * Élixir (template 11, premium beauty and fragrance; Claude Design
 * "Storefront Templates"): warm parchment, a deep plum for actions and an
 * antique gold highlight, Aref Ruqaa display type over Noto Kufi Arabic
 * and almost square corners. A house-of-fragrance store: the signature
 * scent with its tag, the most chosen, scent notes around the bottle, the
 * house story, collections in big type, a client quote and the perfumer.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): unlabelled perfume
 * bottles, oils, creams and flowers. No people, hands or brand labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const ELIXIR_KEY = "elixir";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ELIXIR_KEY, getDesign(id)!, { corners: 2, ...patch });

const SHOP = "/products";
const BEST = "/products?sort=popularity";

const PHOTOS = {
  ornate: pexels(36389336, 900),
  amberGlow: pexels(37127787, 900),
  amberSquare: pexels(8166566, 900),
  rosePink: pexels(15574229, 900),
  sand: pexels(8361493, 900),
  sandMusk: pexels(8361545, 900),
  blue: pexels(20419734, 900),
  floral: pexels(35237609, 900),
  oils: pexels(6915310, 900),
  cream: pexels(6690232, 900),
  satinLip: pexels(4889718, 900),
  tray: pexels(8624586, 900),
  rosesBottle: pexels(18331626, 900),
};

const NAME = L("عود وورد", "Oud & Rose");

const header = lib("header-centered", {
  text: {
    "المتجر": L("العطور", "Fragrance"),
    "العروض": L("الأكثر اختياراً", "Most chosen"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨": L("عطور وعناية، متركّبة في القاهرة", "Fragrance and care, blended in Cairo"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("الدار", "The house"),
  },
  links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-centered", {
  text: {
    "م": L("ع", "O"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.": L("عيّنات وتغليف هدية مجاناً مع كل طلب.", "Complimentary samples and gift wrap with every order."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ عود وورد. كل الحقوق محفوظة.", "© 2026 Oud & Rose. All rights reserved."),
    "من نحن": L("الدار", "The house"),
  },
});

const home: Design[] = [
  lib("hero-product", {
    photo: [undefined, undefined, undefined, PHOTOS.ornate],
    text: {
      "الأكثر مبيعًا": L("العطر المميز", "Signature scent"),
      "اسم المنتج المميز هنا": L("أو دو بارفان عود نوار", "Oud Noir Eau de Parfum"),
      "٤٫٨ من ١٢٨ تقييم": L("٤٫٩ من ١٨٨ تقييم", "4.9 from 188 reviews"),
      "اكتب هنا ما يميز المنتج في سطرين: الخامة، والمدة، ولماذا سيحبه العميل.": L(
        "عود مدخّن وزعفران وجلد ناعم، متعتّق سنة قبل التركيب.",
        "Smoked oud, saffron and soft leather, aged for a year before blending.",
      ),
      "٤٨ ساعة": L("١٢ ساعة", "12 hours"),
      "توصيل": L("على البشرة", "On skin"),
      "سنتين": L("سنة كاملة", "One year"),
      "ضمان": L("تعتيق", "Aged"),
      "١٤ يومًا": L("مجاناً", "Free"),
      "استرجاع": L("تغليف هدية", "Gift wrap"),
      "اطلب الآن": L("اطلبي الآن", "Order now"),
      "صورة المنتج": L("زجاجة عطر مزخرفة بالدهب", "An ornate perfume bottle with gold detail"),
      "عرض الإطلاق": L("هدية مع كل طلب", "With every order"),
      "خصم ٢٠٪": L("عيّنات مجانية", "Free samples"),
      "لأول ١٠٠ طلب": L("وتغليف هدية", "and gift wrap"),
    },
    links: { "/products": [BEST, BEST] },
  }),
  lib("products-list", {
    text: {
      "الكتالوج": L("المجموعة", "The collection"),
      "كل الإكسسوارات": L("الأكثر اختياراً", "Most chosen"),
      "كل اللي تحتاجه في مكان واحد، أصلي وبضمان.": L("العطور والطقوس اللي عملاءنا بيرجعولها.", "The scents and rituals our clients return to."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 6 }],
  }),
  lib("features-orbit", {
    photo: [undefined, undefined, undefined, undefined, PHOTOS.rosePink],
    text: {
      "ليه هتحبه": L("ورد طائفي: النوتات", "Rose Taifi: the notes"),
      "خامة تعيش": L("الافتتاحية", "Top"),
      "مختارة عشان تستحمل الاستخدام اليومي": L("فلفل وردي وبرغموت", "Pink pepper, bergamot"),
      "خفيف وعملي": L("القلب", "Heart"),
      "سهل تشيله معاك في أي مكان": L("ورد طائفي", "Taif rose"),
      "صورة المنتج": L("زجاجة عطر وردي", "A pink perfume bottle"),
      "ضمان محلي": L("القاعدة", "Base"),
      "بفاتورة رسمية من المتجر": L("مسك أبيض وأرز", "White musk, cedar"),
      "تغليف هدية": L("بيعيش", "Wear"),
      "مجانًا لو طلبت": L("من ٨ لـ ١٠ ساعات", "8 to 10 hours"),
    },
  }),
  lib("about-panel", {
    text: {
      "لماذا بدأنا": L("متركّب على مهل، بكميات صغيرة", "Blended slowly, in small batches"),
      "كنا نجرب كل منتج بأنفسنا قبل أن نبيعه، وما زلنا نفعل ذلك مع كل ما يدخل المتجر.": L(
        "كل عطر بيبدأ بخامات بنختارها بنفسنا، من ورد الطائف لعود كمبوديا.",
        "Every fragrance starts with raw materials we choose ourselves, from Taif roses to Cambodian oud.",
      ),
      "اليوم يعود إلينا آلاف العملاء، وهذا أكبر دليل على أن الطريقة صحيحة.": L(
        "بنركّب كميات ٢٠٠ زجاجة في أتيليه الزمالك ونعتّق كل واحدة قبل التعبئة.",
        "We blend in batches of two hundred bottles in our Zamalek atelier and age each one before it is bottled.",
      ),
      "«إن لم نستخدمه نحن، لن نبيعه.»": L("«العطر لازم يبقى ذكرى، مش إعلان.»", "“A scent should feel like a memory, not a statement.”"),
    },
  }),
  lib("categories-big-type", {}),
  lib("testimonials-spotlight", {
    text: {
      "«من أفضل تجارب الشراء أونلاين. الطلب وصل بسرعة، والتغليف أنيق، والمنتج أفضل من الصور.»": L(
        "«عود نوار أول عود مش بحسه تقيل عليا. الناس بتسأل عليه كل مرة بحطه.»",
        "“Oud Noir is the first oud that does not feel heavy on me. People ask about it every time I wear it.”",
      ),
      "م": L("ن", "N"),
      "مريم أ.": L("نادين س.", "Nadine S."),
    },
  }),
  lib("about-circle", {
    person: [PHOTOS.rosesBottle],
    text: {
      "صورة الفريق": L("ورد وردي جنب زجاجة", "Pink roses beside a glass bottle"),
      "إحنا مين": L("صانعة العطور", "The perfumer"),
      "فريق صغير بيحب اللي بيعمله": L("ليلى فهمي، المؤسسة", "Laila Fahmy, founder"),
      "بنرد على كل رسالة بنفسنا، وبنختار كل منتج كأننا هنستخدمه.": L(
        "ليلى اتدربت في جراس ورجعت تبني دار حوالين الروايح اللي اتربت عليها.",
        "Laila trained in Grasse and came home to build a house around the scents she grew up with.",
      ),
      "قابل الفريق": L("زوري الأتيليه", "Visit the atelier"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("الدار", "The house"), L("عود وورد دار عطور صغيرة في الزمالك.", "Oud & Rose is a small fragrance house in Zamalek.")),
  lib("about-panel", {
    as: "about-story",
    text: {
      "لماذا بدأنا": L("عتّقنا العود سنة قبل ما نركّبه", "We aged the oud for a year before blending"),
      "كنا نجرب كل منتج بأنفسنا قبل أن نبيعه، وما زلنا نفعل ذلك مع كل ما يدخل المتجر.": L(
        "عود نوار اتعمل في ١٨ شهر و٤٠ نسخة، وجربنا النسخة الأخيرة في حر القاهرة صيف كامل.",
        "Oud Noir took eighteen months and forty versions, and we tested the final one through a whole Cairo summer.",
      ),
      "اليوم يعود إلينا آلاف العملاء، وهذا أكبر دليل على أن الطريقة صحيحة.": L(
        "كل زجاجة بتتغلف هدية وبيوصل معاها كارت مكتوب بخط اليد.",
        "Every bottle is gift wrapped and comes with a handwritten card.",
      ),
      "«إن لم نستخدمه نحن، لن نبيعه.»": L("«العطر لازم يبقى ذكرى، مش إعلان.»", "“A scent should feel like a memory, not a statement.”"),
    },
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("عطور وعناية، متركّبة في القاهرة.", "Fragrance and care, blended in Cairo."),
  categories: [
    ["fragrance", "أو دو بارفان", "Eau de parfum", PHOTOS.sand],
    ["oils", "زيوت عطرية", "Perfume oils", PHOTOS.oils],
    ["care", "الوش والجسم", "Face & body", PHOTOS.cream],
    ["colour", "ألوان الشفايف", "Lip colour", PHOTOS.satinLip],
    ["gifts", "بوكسات هدايا", "Gift boxes", PHOTOS.tray],
  ],
  products: [
    ["oud-noir", "fragrance", "أو دو بارفان عود نوار", "Oud Noir Eau de Parfum", PHOTOS.amberSquare, 3200, { isFeatured: true, rating: 4.9, sold90: 188 }],
    ["rose-taifi", "fragrance", "أو دو بارفان ورد طائفي", "Rose Taifi Eau de Parfum", PHOTOS.rosePink, 2900, { isFeatured: true, rating: 4.8, sold90: 124 }],
    ["amber-silk", "fragrance", "عنبر حرير", "Amber Silk", PHOTOS.amberGlow, 2650, { compareAtPrice: 2950, sold90: 66 }],
    ["monochrome-musk", "fragrance", "مسك مونوكروم", "Monochrome Musk", PHOTOS.sandMusk, 2400, { sold90: 31 }],
    ["blue-vetiver", "fragrance", "فيتيفر أزرق", "Blue Vetiver", PHOTOS.blue, 2500, { sold90: 22 }],
    ["iris-bloom", "fragrance", "زهر السوسن", "Iris Bloom", PHOTOS.floral, 2750, { sold90: 18 }],
    ["rose-oud-oil", "oils", "زيت عطري ورد وعود", "Rose & Oud Perfume Oil", PHOTOS.oils, 1450, { rating: 4.9, sold90: 97 }],
    ["velvet-face-cream", "care", "كريم وش فيلفت", "Velvet Face Cream", PHOTOS.cream, 1350, { sold90: 52 }],
    ["satin-lip-rosewood", "colour", "روج ساتان روزوود", "Satin Lip, Rosewood", PHOTOS.satinLip, 650, { sold90: 73 }],
    ["discovery-box", "gifts", "بوكس الاكتشاف", "The Discovery Box", PHOTOS.tray, 1800, { compareAtPrice: 2100, rating: 4.9, sold90: 61 }],
  ],
});

export const ELIXIR = libraryTemplate({
  key: ELIXIR_KEY,
  version: 3,
  changelog: "Élixir v3: product page",
  name: L("إليكسير", "Élixir"),
  description: L(
    "جمال وعطور فاخرة: العطر المميز، النوتات حول الزجاجة وحكاية الدار. أربع صفحات جاهزة.",
    "Premium beauty and fragrance: the signature scent, notes around the bottle and the house story. Four ready pages.",
  ),
  category: "beauty",
  sortOrder: 110,
  palette: ["#f5efe6", "#e6d8c3", "#c9a96e", "#3b1f33"],
  colors: {
    primary: "#3b1f33",
    secondary: "#e6d8c3",
    background: "#f5efe6",
    foreground: "#2a1724",
    muted: "#6a5664",
    border: "#dccbb3",
    accent: "#e2cfa6",
  },
  fonts: { heading: "Aref Ruqaa", body: "Noto Kufi Arabic" },
  radius: 2,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("الدار", "The house"), seo: { title: L("الدار", "The house") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("الأتيليه", "The atelier"),
        text: L("١٢ شارع أبو الفدا، الزمالك، القاهرة.", "12 Abu El Feda St, Zamalek, Cairo."),
        heading: L("اسألي عن عطر أو هدية", "Ask about a scent or a gift"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("العطور والتغليف والتوصيل.", "Fragrance, gift wrap and delivery."),
        question: L("أقدر أجرّب قبل ما أشتري حجم كامل؟", "Can I try before buying a full size?"),
        answer: L(
          "أيوه. بوكس الاكتشاف فيه ٥ عطور ١٠ مل وقسيمة بقيمته على أول حجم كامل.",
          "Yes. The Discovery Box has five 10 ml fragrances and a voucher for its value off your first full size.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: { gallery: "end", thumbs: "side", tracking: 0.06, button: "outline", band: "shelf", copy: { back: L("العودة إلى الدار", "Back to the house"), reviews: L("ما قاله عملاؤنا", "What our clients say"), related: L("عطور من الدار", "From the house") } },
});
