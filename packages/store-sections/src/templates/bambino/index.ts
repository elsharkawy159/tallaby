/**
 * Bambino (template 29, baby essentials; Claude Design "Storefront
 * Templates"): soft paper, a navy for actions and a blush highlight,
 * Baloo Bhaijaan 2 throughout and round 20px corners. A gentle baby shop:
 * a split opening, quick chips, everything for baby, a registry in four
 * steps, parents' favourites, safety promises and reviews. Built from
 * section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): blankets, knits,
 * wooden baby toys and nursery baskets. No babies, parents or hands.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const BAMBINO_KEY = "bambino";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(BAMBINO_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  elephantBlanket: pexels(4887085),
  knits: pexels(28259752, 900),
  diapers: pexels(41165, 900),
  stackerGrey: pexels(9271758, 900),
  maracas: pexels(9271755, 900),
  stackBoard: pexels(6692962, 900),
  plushBasket: pexels(7055945, 900),
  nursery: pexels(4964285, 900),
  sorter: pexels(6693309, 900),
};

const NAME = L("نونو بيبي", "Nono Baby");

const header = lib("header-line", {
  text: {
    "م": L("ن", "N"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("عن نونو", "About"),
  },
  links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-panel", {
  text: {
    "اسم متجرك": NAME,
    "اشترك وخد العروض قبل أي حد.": L("نصايح لأول سنين وعروض للمشتركين.", "Tips for the first years and subscriber offers."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ نونو بيبي. كل الحقوق محفوظة.", "© 2026 Nono Baby. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن نونو", "About Nono"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.elephantBlanket],
    text: {
      "كوليكشن الموسم": L("لأول سنين", "For the first years"),
      "صوت أنقى، كل يوم": L("ناعم وآمن ومصنوع في مصر", "Soft, safe and made in Egypt"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "ملابس قطن أورجانيك وألعاب خشب متختبرة للإيدين الصغيرة.",
        "Organic cotton clothes and wooden toys tested for little hands.",
      ),
      "تسوق الآن": L("تسوق للمولود", "Shop newborn"),
      "العروض": L("بوكسات هدايا", "Gift boxes"),
      "صورة الحملة": L("بطانية بيبي رمادي بأفيال", "A grey baby blanket with elephants"),
    },
    links: { "/products": [search("مولود"), search("بوكس")] },
  }),
  lib("categories-chips", { text: { "إيه اللي في بالك؟": L("بتدوّر على إيه؟", "What are you looking for?") } }),
  lib("products-grid", {
    as: "favourites",
    text: { "وصل حديثًا": L("المفضل عند الأهل", "Parents’ favourites"), "أحدث المنتجات اللي نزلت المتجر.": L("اللي الأهالي بيرجعوا يطلبوه.", "What parents come back for.") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("features-icon-cards", {
    text: {
      "لماذا تشتري منا": L("وعدنا", "Our promise"),
      "تسوّق وأنت مطمئن": L("آمن للصغيرين", "Safe for little ones"),
      "توصيل سريع": L("خامات متختبرة", "Tested materials"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("ألوان وصبغات آمنة.", "Non-toxic paints and dyes."),
      "الدفع عند الاستلام": L("تغليف هدية مجاني", "Free gift wrap"),
      "أو ادفع بالبطاقة والمحفظة": L("ومعاه كارت بخط اليد.", "With a handwritten card."),
      "استرجاع سهل": L("توصيل سريع", "Fast delivery"),
      "١٤ يومًا لتغيّر رأيك": L("من ٢ لـ ٤ أيام لكل مصر.", "2 to 4 days across Egypt."),
      "دعم على واتساب": L("استبدال سهل", "Easy exchange"),
      "أشخاص حقيقيون طوال الأسبوع": L("تبديل المقاس ببلاش خلال ١٤ يوم.", "Sizes swapped free within 14 days."),
    },
  }),
  lib("features-steps", {
    text: {
      "الطلب في ٤ خطوات": L("اعمل قائمة هدايا للبيبي في ٤ خطوات", "Build a baby registry in 4 steps"),
      "اختر": L("اختار", "Pick"),
      "أضف ما يعجبك إلى السلة": L("ضيف اللي محتاجه للمفضلة.", "Add what you need to your wishlist."),
      "اطلب": L("شارك", "Share"),
      "عنوانك ورقم موبايلك فقط": L("ابعت اللينك للعيلة والصحاب.", "Send the link to family and friends."),
      "نؤكد": L("هدية", "Gift"),
      "نتواصل معك على واتساب للتأكيد": L("هما يطلبوا وإحنا نغلّف.", "They order, we wrap."),
      "استلم": L("استلم", "Receive"),
      "وادفع عند الاستلام": L("يوصلوا مع بعض قبل ميعاد الولادة.", "Delivered together, before the due date."),
    },
  }),
  lib("testimonials-bento", {
    text: {
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "القطن ناعم جداً وبيستحمل الغسيل. اشترينا الطقم لـ٣ صحاب لحد دلوقتي.",
        "The cotton is so soft and survives every wash. We have bought the set for three friends now.",
      ),
      "م": L("آ", "A"),
      "مريم أ.": L("آية م.", "Aya M."),
      "القاهرة": L("مصر الجديدة", "Heliopolis"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("بوكس الاستقبال كان أحلى هدية سبوع.", "The welcome box was the best baby-shower gift."),
      "ع": L("ك", "K"),
      "عمر ك.": L("كريم ن.", "Karim N."),
      "الإسكندرية": L("القاهرة", "Cairo"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("المقاسات واسعة شوية، وده عجبنا.", "Sizes run a little big, which we actually liked."),
      "ن": L("د", "D"),
      "نور ح.": L("دعاء ف.", "Doaa F."),
      "الجيزة": L("الإسكندرية", "Alexandria"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن نونو", "About Nono"), L("محل بيبي في مصر الجديدة بدأته اتنين أمهات جداد.", "A baby shop in Heliopolis started by two new mums.")),
  aboutStory(lib, {
    photo: PHOTOS.nursery,
    alt: L("ركن أوضة بيبي بسلة ومكعبات", "A nursery corner with a basket and blocks"),
    eyebrow: L("مصر الجديدة", "Heliopolis"),
    title: L("اللي كنا عايزينه لولادنا", "What we wanted for our own babies"),
    text: L("قطن مصري أورجانيك وألعاب خشب آمنة، اتجربت على ولادنا الأول.", "Organic Egyptian cotton and safe wooden toys, tried on our own children first."),
    more: L("وكل بوكس بيوصل متغلف ومعاه كارت.", "And every box arrives wrapped, with a card."),
    button: L("تسوق للمولود", "Shop newborn"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("قطن ناعم وألعاب آمنة لأول سنين.", "Soft cotton and safe toys for the first years."),
  categories: [
    ["clothes", "ملابس وبطاطين", "Clothes & blankets", PHOTOS.knits],
    ["toys", "أول ألعاب", "First toys", PHOTOS.stackerGrey],
    ["play", "لعب وتعلّم", "Play & learn", PHOTOS.stackBoard],
    ["gifts", "بوكسات هدايا", "Gift boxes", PHOTOS.plushBasket],
    ["blankets", "بطاطين", "Blankets", PHOTOS.elephantBlanket],
    ["nappies", "حفاضات", "Nappies", PHOTOS.diapers],
    ["music", "ألعاب بصوت", "Musical toys", PHOTOS.maracas],
    ["nursery", "أوضة البيبي", "Nursery", PHOTOS.nursery],
  ],
  products: [
    ["elephant-blanket", "blankets", "بطانية الأفيال", "Elephant Blanket", PHOTOS.elephantBlanket, 590, { isFeatured: true, rating: 4.9, sold90: 320 }],
    ["knit-set", "clothes", "طقم تريكو قطن", "Cotton Knit Set", PHOTOS.knits, 690, { sold90: 120 }],
    ["cloth-diapers", "nappies", "حفاضات قماش", "Cloth Nappies, 6", PHOTOS.diapers, 450, { sold90: 80 }],
    ["stacking-rings", "toys", "حلقات التركيب", "Stacking Rings", PHOTOS.stackerGrey, 260, { rating: 4.8, sold90: 198 }],
    ["wooden-maracas", "music", "شخاليل خشب", "Wooden Maracas", PHOTOS.maracas, 220, { sold90: 66 }],
    ["shape-sorter", "play", "لعبة الأشكال", "Shape Sorter", PHOTOS.sorter, 320, { sold90: 54 }],
    ["stack-and-sort-board", "play", "لوحة تركيب وفرز", "Stack & Sort Board", PHOTOS.stackBoard, 560, { compareAtPrice: 650, sold90: 54 }],
    ["welcome-baby-box", "gifts", "بوكس استقبال البيبي", "Welcome Baby Box", PHOTOS.plushBasket, 1250, { compareAtPrice: 1450, isFeatured: true, sold90: 88 }],
    ["nursery-basket-set", "nursery", "سلة أوضة البيبي", "Nursery Basket Set", PHOTOS.nursery, 890, { inStock: false, sold90: 20 }],
  ],
});

export const BAMBINO = libraryTemplate({
  key: BAMBINO_KEY,
  version: 4,
  changelog: "Bambino v4: one categories section, section order",
  name: L("بامبينو", "Bambino"),
  description: L(
    "مستلزمات البيبي: افتتاحية ناعمة، قائمة هدايا في ٤ خطوات ووعود الأمان. أربع صفحات جاهزة.",
    "Baby essentials: a soft opening, a registry in four steps and safety promises. Four ready pages.",
  ),
  category: "kids",
  sortOrder: 290,
  palette: ["#fbf8f4", "#eef2f6", "#f6c9b8", "#30425a"],
  colors: {
    primary: "#30425a",
    secondary: "#eef2f6",
    background: "#fbf8f4",
    foreground: "#30425a",
    muted: "#5e6b7c",
    border: "#e1e6ec",
    accent: "#f6c9b8",
  },
  fonts: { heading: "Baloo Bhaijaan 2", body: "Baloo Bhaijaan 2" },
  radius: 20,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن نونو", "About"), seo: { title: L("عن نونو", "About Nono") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("٩ شارع د. فؤاد محيي الدين، مصر الجديدة.", "9 Dr. Fouad Mohie El Din St, Heliopolis."),
        heading: L("اسألي عن مقاس أو هدية", "Ask about a size or a gift"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والخامات والتوصيل.", "Sizes, materials and delivery."),
        question: L("المقاسات مظبوطة؟", "Do the sizes run true?"),
        answer: L("المقاسات واسعة سنة بسيطة عشان تقعد أطول. ولو مش مناسبة نبدّلها ببلاش خلال ١٤ يوم.", "Sizes run slightly big so they last longer, and we swap them free within 14 days."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "shelf", thumbs: "bottom", band: "paper", extras: ["product-perks"], copy: { reviews: L("آراء الأمهات والآباء", "Parents' reviews"), related: L("محتاجينها لبيبي كمان", "More for baby") } },
});
