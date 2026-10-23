/**
 * Shanta (template 52, leather bags; Claude Design "Storefront Templates"):
 * warm parchment paper, espresso ink, a saddle brown for actions and an
 * apricot highlight, Readex Pro throughout and round 16px corners. A leather
 * workshop's shop: a bento hero, carried most, a bag-and-wallet set, the top
 * five gifts, the founder's note and questions. Built from section library
 * designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): leather handbags and
 * totes on plain backdrops, card holders and wallets, a market wall of bags
 * and the workbench with tools. No people, no hands and no logos (the
 * design's photos of models were all replaced; bags with an embossed maker
 * name were left out).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const SHANTA_KEY = "shanta";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SHANTA_KEY, getDesign(id)!, { corners: 16, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  bagWall: pexels(31661556),
  petalBag: pexels(4830926, 900),
  flapBag: pexels(4830928, 900),
  cardHolder: pexels(37326694, 900),
  tallTote: pexels(27046147, 900),
  barrelBag: pexels(22434773, 900),
  cocoaSatchel: pexels(22434766, 900),
  domeBag: pexels(22434764, 900),
  envelope: pexels(28028348, 900),
  bifolds: pexels(28028234, 900),
  wallet: pexels(915917, 900),
  workbench: pexels(4452603),
};

const NAME = L("شنطة ليذر", "Shanta Leather");

const header = lib("header-pill", {
  text: {
    "اسم متجرك": NAME,
    "المتجر": L("الشنط", "Bags"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الورشة", "Workshop"),
  },
  links: { "/products": [undefined, BEST], "/blog": "/about" },
});

const footer = lib("footer-wordmark", {
  text: {
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("الورشة", "The workshop"),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L("٠١٠٠ ٢٤٥ ٨٨٢٠", "+20 100 245 8820"),
    "‏hello@store.com": L("‏shanta@shantaleather.eg", "shanta@shantaleather.eg"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ شنطة ليذر. كل الحقوق محفوظة.", "© 2026 Shanta Leather. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const QUESTIONS = {
  "كيف أعرف أن طلبي وصل إليكم؟": L("الجلد طبيعي فعلاً؟", "Is the leather really natural?"),
  "ستظهر لك صفحة تأكيد وتصلك رسالة، ونتصل بك لتأكيد طلبات الدفع عند الاستلام.": L(
    "أيوه، جلد بقري مدبوغ نباتي، ولونه بيغمق ويحلى مع الاستعمال.",
    "Yes, vegetable-tanned cowhide that darkens and gets better with use.",
  ),
  "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("ينفع تكتبوا حروف اسمي؟", "Can you add my initials?"),
  "نعم، حتى يتم شحنه. تواصل معنا بأسرع وقت.": L("أيوه، ببلاش على أي شنطة. اكتبها في الملاحظات وإنت بتطلب.", "Yes, free on any bag. Add them in the order notes."),
  "كم يستغرق التوصيل؟": L("الطلب بياخد قد إيه؟", "How long does an order take?"),
  "القاهرة والجيزة من يوم إلى يومين، وباقي المحافظات من ٢ إلى ٦ أيام.": L(
    "الشنط الجاهزة من ٢ لـ ٤ أيام، واللي عليها حروف بتزيد يومين.",
    "Ready bags take 2 to 4 days; initials add two days.",
  ),
  "هل التوصيل متاح لكل المحافظات؟": L("أنضف الشنطة إزاي؟", "How do I care for the bag?"),
  "نعم، نوصل لكل محافظات مصر.": L("امسحها بقماشة ناشفة، وادهنها بكريم جلد مرة كل كام شهر.", "Wipe it with a dry cloth and use leather cream every few months."),
  "ما طرق الدفع المتاحة؟": L("فيه ضمان على الخياطة؟", "Is the stitching guaranteed?"),
  "الدفع عند الاستلام، والبطاقات، والمحافظ الإلكترونية، وإنستاباي.": L("سنة كاملة. لو فكّت غرزة بنصلحها في الورشة ببلاش.", "For a full year. If a stitch comes loose we fix it at the workshop for free."),
  "ما سياسة الاسترجاع؟": L("ينفع أرجّع الشنطة؟", "Can I return a bag?"),
  "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": L(
    "خلال ١٤ يوم لو مش مستعملة، ما عدا الشنط اللي عليها حروف.",
    "Within 14 days if unused, except bags with initials.",
  ),
} as const;

const home: Design[] = [
  lib("hero-bento", {
    photo: [PHOTOS.bagWall],
    text: {
      "وصل جديد": L("صنع في القاهرة", "Made in Cairo"),
      "صوت أنقى، كل يوم": L("شنطة لكل يوم في الأسبوع", "A bag for every day of the week"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "جلد متقصوص باليد ومتخيط عند عيلتين في باب الشعرية.",
        "Leather cut by hand, stitched by two families in Bab El Shaariya.",
      ),
      "تسوق الآن": L("تسوق الشنط", "Shop bags"),
      "صورة الحملة": L("حيطة شنط جلد بألوان ونقوش مختلفة", "A wall of leather bags in many colours and patterns"),
      "٤٫٨": L("٤٫٩", "4.9"),
      "من ١٢ ألف تقييم": L("من أكتر من ٥٠٠ تقييم", "from 500+ reviews"),
    },
  }),
  lib("products-bento", {
    text: { "الأكثر طلبًا": L("الأكتر طلباً", "Most wanted"), "الكل بيسأل عليهم": L("الأكتر شيلاً", "Carried most") },
    links: { "/products": BEST },
  }),
  lib("bundle-plus", {
    text: {
      "باقة": L("طقم", "Set"),
      "اشتريهم مع بعض ووفّر": L("شنطة وحافظة وتوت", "Bag, card holder and tote"),
      "سعر الباقة": L("سعر الطقم", "Set price"),
      "١٬٢٧٠ ج.م": L("٤٬٢٢٤ ج.م", "EGP 4,224"),
      "بدل ١٬٤٩٠ ج.م": L("بدل ٤٬٨٠٠ ج.م", "Instead of EGP 4,800"),
      "وفّر ٢٢٠ ج.م": L("وفّر ٥٧٦ ج.م", "Save EGP 576"),
      "اطلب الباقة": L("اطلب الطقم", "Get the set"),
    },
    links: { "/products": NEW },
  }),
  lib("products-list", {
    text: {
      "الكتالوج": L("أحسن ٥", "Top 5"),
      "كل الإكسسوارات": L("بيتشتروا كهدايا", "Bought as gifts"),
      "كل اللي تحتاجه في مكان واحد، أصلي وبضمان.": L("أكتر ٥ قطع بتتغلف هدية، وكلها ممكن نكتب عليها الحروف.", "The five pieces most often gift-wrapped, all with free initials."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 5 }],
  }),
  lib("team-founder", {
    text: {
      "عايزين كل حد يشتري من عندنا مرة يرجع تاني من غير ما نفكره.": L(
        "بنعمل شنط أقل عشان نعملها صح. كل شنطة عليها اسم اللي خيطها.",
        "We make fewer bags so we can make them properly. Every one carries the name of the person who stitched it.",
      ),
      "م": L("ر", "R"),
      "منى عادل": L("رنا فؤاد", "Rana Fouad"),
    },
  }),
  lib("faq-columns", { as: "faq-home", text: { "أسئلة شائعة": L("أسئلة", "Questions"), ...QUESTIONS } }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("الورشة", "The workshop"), L("ورشة جلد صغيرة في باب الشعرية من ٢٠١٦.", "A small leather workshop in Bab El Shaariya since 2016.")),
  aboutStory(lib, {
    photo: PHOTOS.workbench,
    alt: L("أدوات تقطيع وخياطة الجلد على ترابيزة الورشة", "Leather cutting and stitching tools on the workbench"),
    eyebrow: L("باب الشعرية", "Bab El Shaariya"),
    title: L("عيلتين وترابيزة واحدة", "Two families, one workbench"),
    text: L("كل شنطة بتتقص باليد وبتتخيط غرزة غرزة، وبنكتب جوّاها اسم اللي عملها.", "Every bag is cut by hand and stitched one stitch at a time, with the maker's name written inside."),
    more: L("وبنصلّح أي غرزة تفك خلال سنة ببلاش.", "And we mend any loose stitch for free within a year."),
    button: L("تسوق الشنط", "Shop bags"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("شنط جلد متقصوصة ومتخيطة في القاهرة.", "Leather bags cut and stitched in Cairo."),
  categories: [
    ["shoulder", "شنط كتف ويد", "Shoulder & top-handle", PHOTOS.flapBag],
    ["totes", "توت", "Totes", PHOTOS.tallTote],
    ["small", "جلديات صغيرة", "Small leather", PHOTOS.envelope],
  ],
  products: [
    ["petal-top-handle-bag", "shoulder", "شنطة بيتال بإيد", "Petal Top-Handle Bag", PHOTOS.petalBag, 1850, { isFeatured: true, rating: 4.9, sold90: 210 }],
    ["card-holder", "small", "حافظة كروت", "Card Holder", PHOTOS.cardHolder, 350, { sold90: 140 }],
    ["tall-zip-tote", "totes", "توت جلد بسوستة", "Tall Zip Tote", PHOTOS.tallTote, 2600, { compareAtPrice: 2950, sold90: 31 }],
    ["mini-barrel-crossbody", "shoulder", "كروس بادي ميني", "Mini Barrel Crossbody", PHOTOS.barrelBag, 1290, { sold90: 44 }],
    ["cocoa-satchel", "shoulder", "شنطة ساتشل بني غامق", "Cocoa Satchel", PHOTOS.cocoaSatchel, 2100, { rating: 4.8, sold90: 96 }],
    ["burgundy-dome-bag", "shoulder", "شنطة نبيتي", "Burgundy Dome Bag", PHOTOS.domeBag, 1950, { sold90: 58 }],
    ["envelope-pouch", "small", "بوك جلد ظرف", "Envelope Pouch", PHOTOS.envelope, 690, { rating: 4.8, sold90: 72 }],
    ["bifold-wallet", "small", "محفظة بطبقتين", "Bifold Wallet", PHOTOS.bifolds, 550, { sold90: 88 }],
    ["distressed-wallet", "small", "محفظة جلد معتّق", "Distressed Leather Wallet", PHOTOS.wallet, 490, { inStock: false, sold90: 26 }],
  ],
});

export const SHANTA = libraryTemplate({
  key: SHANTA_KEY,
  version: 2,
  changelog: "Shanta v2: product page",
  productPage: { gallery: "end", thumbs: "side", band: "shelf", extras: ["product-shipping"], copy: { back: L("رجوع للشنط", "Back to the bags"), reviews: L("رأي اللي شالوها", "From those who carry it"), related: L("يمشي معاها", "Carried together") } },
  name: L("شنطة", "Shanta"),
  description: L(
    "شنط جلد: هيرو بنتو، الأكتر شيلاً، طقم شنطة وحافظة، أحسن ٥ هدايا، كلمة المؤسسة والأسئلة. أربع صفحات جاهزة.",
    "Leather bags: a bento hero, carried most, a bag-and-wallet set, top five gifts, the founder's note and questions. Four ready pages.",
  ),
  category: "shoes-bags",
  sortOrder: 520,
  palette: ["#f6f1ea", "#eadfce", "#f0c9a0", "#8a4b24"],
  colors: {
    primary: "#8a4b24",
    secondary: "#eadfce",
    background: "#f6f1ea",
    foreground: "#2a1f17",
    muted: "#6e5f50",
    border: "#dccdb6",
    accent: "#f0c9a0",
  },
  fonts: { heading: "Readex Pro", body: "Readex Pro" },
  radius: 16,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("الورشة", "Workshop"), seo: { title: L("الورشة", "The workshop") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("الورشة مفتوحة من السبت للخميس، ١١ الصبح لـ ٧ بالليل.", "The workshop is open Saturday to Thursday, 11 am to 7 pm."),
        heading: L("اسأل عن شنطة أو حروف", "Ask about a bag or initials"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الجلد والحروف والتوصيل.", "Leather, initials and delivery."),
        question: L("ينفع أرجّع الشنطة؟", "Can I return a bag?"),
        answer: L("خلال ١٤ يوم لو مش مستعملة، ما عدا الشنط اللي عليها حروف.", "Within 14 days if unused, except bags with initials."),
      }),
    },
  ],
  demo: DEMO,
});
