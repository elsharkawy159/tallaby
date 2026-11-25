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
    "اشترك ليصلك جديدنا أولًا.": L("اشترك ليصلك جديد منتجات الأطفال.", "Subscribe for new baby products."),
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
      "مجموعة الموسم": L("للمولود والطفل", "For babies and toddlers"),
      "صوت أنقى، كل يوم": L("ملابس وألعاب للمولود", "Clothes and toys for babies"),
      "منتجات مختارة بمواصفات واضحة لكل يوم.": L(
        "ملابس قطنية وألعاب خشبية وبطانيات بمقاسات واضحة.",
        "Cotton clothes, wooden toys and blankets with clear sizes.",
      ),
      "تسوق الآن": L("تسوق للمولود", "Shop newborn"),
      "العروض": L("علب الهدايا", "Gift boxes"),
      "صورة الحملة": L("بطانية أطفال رمادية برسوم أفيال", "A grey baby blanket with elephants"),
    },
    links: { "/products": [search("مولود"), search("بوكس")] },
  }),
  lib("categories-chips", { text: { "عمّ تبحث؟": L("عمّ تبحث؟", "What are you looking for?") } }),
  lib("products-grid", {
    as: "favourites",
    text: { "وصل حديثًا": L("المفضل عند الأهل", "Parents’ favourites"), "أحدث المنتجات في المتجر.": L("المنتجات الأكثر طلبًا.", "The most ordered products.") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("features-icon-cards", {
    text: {
      "لماذا تشتري منا": L("ما يميز منتجاتنا", "What sets our products apart"),
      "تسوّق وأنت مطمئن": L("منتجات مختارة للأطفال", "Products chosen for little ones"),
      "الشحن": L("خامات واضحة", "Clear materials"),
      "تظهر تكلفة الشحن ومدته عند إتمام الطلب": L("الخامة مذكورة في وصف كل منتج.", "Each product lists its material."),
      "الدفع عند الاستلام": L("مقاسات واضحة", "Clear sizes"),
      "أو بطرق الدفع المتاحة عند الطلب": L("المقاس والعمر مذكوران لكل قطعة.", "Size and age listed for every piece."),
      "الاستبدال والاسترجاع": L("تشكيلة متنوعة", "A wide range"),
      "التفاصيل في صفحة السياسات": L("ملابس وألعاب وبطانيات ومستلزمات الغرفة.", "Clothes, toys, blankets and nursery items."),
      "تواصل معنا": L("تواصل معنا", "Contact us"),
      "لأي سؤال عن طلب أو منتج": L("لأي سؤال عن مقاس أو منتج.", "With any question about a size or product."),
    },
  }),
  // v5 (2026-11-25, owner): the store's 1st category as a carousel between the promises and the steps.
  lib("products-category-carousel", { lists: [undefined, { limit: 4 }] }),
  lib("features-steps", {
    text: {
      "الطلب في ٤ خطوات": L("اطلب في ٤ خطوات", "Order in 4 steps"),
      "اختر": L("اختر", "Choose"),
      "أضف ما يعجبك إلى السلة": L("أضف ما تحتاجه إلى السلة.", "Add what you need to the cart."),
      "اطلب": L("اطلب", "Order"),
      "عنوانك ورقم هاتفك فقط": L("أدخل العنوان ورقم الهاتف.", "Enter your address and phone number."),
      "نؤكد": L("تأكيد", "Confirm"),
      "نؤكد طلبك معك": L("يتواصل المتجر معك لتأكيد الطلب.", "The store confirms the order with you."),
      "استلم": L("استلم", "Receive"),
      "يصلك الطلب على عنوانك": L("يصلك الطلب على عنوانك.", "Your order arrives at your address."),
    },
  }),
  lib("testimonials-bento", {
    text: {
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "القطن ناعم ويتحمّل الغسيل المتكرر.",
        "The cotton is soft and holds up to frequent washing.",
      ),
      "م": L("آ", "A"),
      "مريم أ.": L("آية م.", "Aya M."),
      "القاهرة": L("حكايتنا", "Our story"),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L("علبة هدايا المولود مرتبة وقطعها جميلة.", "The newborn gift box is neat and its pieces are lovely."),
      "ع": L("ك", "K"),
      "عمر ك.": L("كريم ن.", "Karim N."),
      "الإسكندرية": L("القاهرة", "Cairo"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("المقاسات أوسع قليلًا، وهذا ما أعجبنا.", "Sizes run a little big, which we liked."),
      "ن": L("د", "D"),
      "نور ح.": L("دعاء ف.", "Doaa F."),
      "الجيزة": L("الإسكندرية", "Alexandria"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن نونو", "About Nono"), L("ملابس وألعاب ومستلزمات للمولود والطفل.", "Clothes, toys and essentials for babies and toddlers.")),
  aboutStory(lib, {
    photo: PHOTOS.nursery,
    alt: L("ركن غرفة أطفال بسلة ومكعبات", "A nursery corner with a basket and blocks"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("منتجات مختارة للأطفال", "Products chosen for little ones"),
    text: L("ملابس قطنية وألعاب خشبية وبطانيات، مع الخامة والمقاس لكل منتج.", "Cotton clothes, wooden toys and blankets, with the material and size of each product."),
    more: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
    button: L("تسوق للمولود", "Shop newborn"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ملابس قطنية وألعاب ومستلزمات للمولود.", "Cotton clothes, toys and essentials for babies."),
  categories: [
    // v5: play and learn first, so the category carousel (the 1st category) shows a full row.
    ["play", "لعب وتعلّم", "Play & learn", PHOTOS.stackBoard],
    ["clothes", "ملابس وبطاطين", "Clothes & blankets", PHOTOS.knits],
    ["toys", "أول ألعاب", "First toys", PHOTOS.stackerGrey],
    ["gifts", "علب الهدايا", "Gift boxes", PHOTOS.plushBasket],
    ["blankets", "بطاطين", "Blankets", PHOTOS.elephantBlanket],
    ["nappies", "حفاضات", "Nappies", PHOTOS.diapers],
    ["music", "ألعاب موسيقية", "Musical toys", PHOTOS.maracas],
    ["nursery", "غرفة الطفل", "Nursery", PHOTOS.nursery],
  ],
  products: [
    ["elephant-blanket", "blankets", "بطانية الأفيال", "Elephant Blanket", PHOTOS.elephantBlanket, 590, { isFeatured: true, rating: 4.9, sold90: 320 }],
    ["knit-set", "clothes", "طقم تريكو قطن", "Cotton Knit Set", PHOTOS.knits, 690, { sold90: 120 }],
    ["cloth-diapers", "nappies", "حفاضات قماش", "Cloth Nappies, 6", PHOTOS.diapers, 450, { sold90: 80 }],
    ["stacking-rings", "toys", "حلقات التركيب", "Stacking Rings", PHOTOS.stackerGrey, 260, { rating: 4.8, sold90: 198 }],
    ["wooden-maracas", "music", "شخاليل خشب", "Wooden Maracas", PHOTOS.maracas, 220, { sold90: 66 }],
    ["shape-sorter", "play", "لعبة الأشكال", "Shape Sorter", PHOTOS.sorter, 320, { sold90: 54 }],
    ["stack-and-sort-board", "play", "لوحة تركيب وفرز", "Stack & Sort Board", PHOTOS.stackBoard, 560, { compareAtPrice: 650, sold90: 54 }],
    ["stacking-tower", "play", "برج تركيب", "Stacking Tower", PHOTOS.stackerGrey, 290, { sold90: 46 }],
    ["rhythm-shakers-set", "play", "طقم شخاليل إيقاع", "Rhythm Shakers Set", PHOTOS.maracas, 340, { sold90: 38 }],
    ["welcome-baby-box", "gifts", "علبة هدايا المولود", "Welcome Baby Box", PHOTOS.plushBasket, 1250, { compareAtPrice: 1450, isFeatured: true, sold90: 88 }],
    ["nursery-basket-set", "nursery", "طقم سلال غرفة الطفل", "Nursery Basket Set", PHOTOS.nursery, 890, { inStock: false, sold90: 20 }],
  ],
});

export const BAMBINO = libraryTemplate({
  key: BAMBINO_KEY,
  version: 5,
  changelog: "Bambino v5: products by category as a carousel on the home",
  name: L("بامبينو", "Bambino"),
  description: L(
    "مستلزمات الأطفال: افتتاحية ناعمة، الطلب في ٤ خطوات وما يميز المنتجات. أربع صفحات جاهزة.",
    "Baby essentials: a soft opening, ordering in four steps and product highlights. Four ready pages.",
  ),
  category: "kids",
  style: ["playful", "warm"],
  sortOrder: 290,
  palette: ["#fbf8f4", "#eef2f6", "#f6c9b8", "#30425a"],
  colors: {
    primary: "#30425a",
    secondary: "#eef2f6",
    background: "#ffffff",
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
        text: L("تواصل معنا لأي سؤال عن منتج أو طلب.", "Contact us with any question about a product or an order."),
        heading: L("اسأل عن مقاس أو منتج", "Ask about a size or a product"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والخامات والطلب.", "Sizes, materials and ordering."),
        question: L("هل المقاسات مطابقة للعمر؟", "Do the sizes match the age?"),
        answer: L("المقاس والعمر مذكوران في وصف كل قطعة. راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.", "Each piece lists its size and age. See the exchange and return policy page."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "shelf", thumbs: "bottom", band: "paper", extras: ["product-perks"], copy: { reviews: L("آراء الأمهات والآباء", "Parents' reviews"), related: L("منتجات أخرى للأطفال", "More for babies") } },
});
