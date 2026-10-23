/**
 * Bashra (template 40, skincare by concern with rewards; Claude Design
 * "Storefront Templates"): warm blush paper, a peach highlight and a deep
 * rose for actions, Noto Naskh Arabic headings on Almarai and 18px corners.
 * A small skincare shop: a routine-finder hero, shop by skin need, our pick
 * with three reasons, a soap trio by quantity, how points work, the member
 * tiers, refer a friend and member reviews. Built from section library
 * designs (`fromLibrary`).
 *
 * Rewards have no library designs yet: "How points work" uses the numbered
 * steps (`text-steps`), "Tier ladder" the spend tiers (`promo-tiers`) with
 * the tiers' points as copy, and "Refer a friend" the reward popup
 * (`popup-reward`) with the BASHRA100 code. There is no points ledger, and
 * quantity savings are not applied at checkout (the cart charges the unit
 * price). The hero's "Find my routine" anchor goes to the contact page.
 *
 * Photos: Pexels, each checked by eye (2026-10-23): amber bottles on a
 * wooden tray, two dropper bottles, a white dropper bottle on marble, three
 * soap bars, a pump bottle on a bath stool, an amber bottle with a dry
 * brush, a whipped cream jar with leaves, a gua sha stone with blank
 * serums and a row of handmade soap bars. No people, no hands and no
 * brand labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const BASHRA_KEY = "bashra";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(BASHRA_KEY, getDesign(id)!, { corners: 18, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  ritualTray: pexels(7795790),
  ritualSet: pexels(7795790, 900),
  faceOil: pexels(12146904, 900),
  toner: pexels(4735943, 900),
  soapTrio: pexels(6690863, 900),
  bodyOil: pexels(6811698, 900),
  hairOil: pexels(7796159, 900),
  faceCream: pexels(6690234, 900),
  guaSha: pexels(8102128, 900),
  soapRow: pexels(6621467, 900),
  soapRowWide: pexels(6621467),
};

const NAME = L("بشرة", "Bashra");

const header = lib("header-pill", {
  text: {
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("الوش", "Face"),
    "المدونة": L("الشعر", "Hair"),
  },
  links: { "/products": [SHOP, search("وش")], "/blog": search("شعر") },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("نصايح للبشرة، مرة في الشهر", "Skin notes, once a month"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("روتين، منتجات جديدة وعروض الأعضاء.", "Routines, new arrivals and member offers."),
    "م": L("ب", "B"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ بشرة. كل الحقوق محفوظة.", "© 2026 Bashra. All rights reserved."),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.ritualTray],
    text: {
      "كوليكشن الموسم": L("طقم الروتين الجديد", "New ritual set"),
      "صوت أنقى، كل يوم": L("عناية متختارة لبشرتك", "Skincare picked for your skin"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "قولينا بشرتك محتاجة إيه وإحنا نرشحلك ٣ منتجات، مش ٣٠.",
        "Tell us what your skin needs and we will match you to three products, not thirty.",
      ),
      "تسوق الآن": L("لاقي روتيني", "Find my routine"),
      "العروض": L("كل المنتجات", "Shop all"),
      "صورة الحملة": L("قزايز كهرمان على صينية خشب", "Amber bottles on a wooden tray"),
    },
    links: { "/products": ["/contact", SHOP] },
  }),
  lib("finder-use", {
    text: {
      "هتستخدمها في إيه؟": L("بشرتك محتاجة إيه؟", "What does your skin need?"),
      "اختار استخدامك ونوديك على المنتجات المناسبة ليه.": L("اختاري اللي بشرتك محتاجاه ونوديكي على المنتجات المناسبة.", "Pick what your skin needs and we will show you what suits it."),
      "المشاوير": L("بشرة جافة", "Dry skin"),
      "الرياضة": L("نضارة", "Glow"),
      "المكالمات": L("حساسة", "Sensitive"),
      "الشغل من البيت": L("الشعر", "Hair"),
    },
    links: { "/products": [search("زيت"), search("طقم"), search("تونر"), search("شعر")] },
  }),
  lib("finder-pick", {
    text: {
      "لو هتشتري واحدة بس": L("لو هتشتري حاجة واحدة", "If you buy just one"),
      "أحسن عزل ضوضاء في الفئة": L("بيغطي الوش والجسم في ٤ خطوات", "Covers face and body in four steps"),
      "بطارية ٣٠ ساعة": L("بيوفرلك ٢٣٠ ج.م عن القطع لوحدها", "Saves EGP 230 against single items"),
      "ضمان سنتين": L("جاي في علبة هدية", "Comes in a gift box"),
      "أوفر اختيار": L("ابدأي بده", "Start here"),
      "الأفخم": L("الألطف", "Gentlest"),
    },
    lists: [{ source: "featured" }],
  }),
  lib("bundle-quantity", {
    text: {
      "وفّر مع الكمية": L("خزّني ووفّري", "Stock up and save"),
      "قطعة واحدة": L("علبة واحدة", "One box"),
      "قطعتين": L("علبتين", "Two boxes"),
      "على القطعة التانية": L("على العلبتين", "On both boxes"),
      "٣ قطع": L("٤ علب", "Four boxes"),
      "وفّر ١٨٪": L("وفّر ٢٠٪", "Save 20%"),
      "اختار عدد القطع من السلة.": L("اختاري عدد العلب من السلة.", "Choose how many boxes in the cart."),
    },
  }),
  lib("text-steps", {
    name: L("النقط بتشتغل إزاي", "How points work"),
    text: {
      "إزاي ترجّع منتج": L("كل جنيه بيرجعلك", "Every pound comes back to you"),
      "ابعتلنا على واتساب": L("اكسبي ١ نقطة", "Earn 1 point"),
      "خلال ١٤ يوم من الاستلام مع رقم الطلب.": L("على كل ١٠ ج.م بتشتري بيها.", "For every EGP 10 you spend."),
      "جهّز المنتج": L("استبدلي ١٠٠ نقطة", "Redeem 100 points"),
      "في علبته الأصلية بكل الإكسسوارات.": L("بخصم ١٠ ج.م على أي طلب.", "For EGP 10 off any order."),
      "المندوب يستلم": L("اطلعي لفوق", "Level up"),
      "خلال يومين شغل من عنوانك.": L("٣ مستويات، كل مستوى بنقط أكتر وعينات مجانية.", "Three levels, each with more points and free samples."),
      "فلوسك ترجع": L("هاتي صاحبتك", "Bring a friend"),
      "بنفس طريقة الدفع خلال ٥ أيام.": L("١٠٠٠ نقطة ليكي لما تطلب أول مرة.", "1,000 points for you when she first orders."),
    },
  }),
  lib("promo-tiers", {
    name: L("مستويات العضوية", "Member tiers"),
    text: {
      "عرض الشهر": L("مكافآت بشرة", "Bashra rewards"),
      "كل ما تزود، توفّر أكتر": L("روز، عنبر، عود", "Rose, Amber, Oud"),
      "لما تشتري بـ": L("من", "From"),
      "١٠٠٠ ج.م": L("٠ نقطة", "0 pts"),
      "١٠٠ ج.م": L("روز", "Rose"),
      "خصم على الفاتورة": L("نقط أكتر وعينات كل ما تطلعي", "More points and samples as you go up"),
      "الأكثر استخدامًا": L("انتي هنا: ١٢٤٠ نقطة", "You are here: 1,240 pts"),
      "٢٠٠٠ ج.م": L("١٠٠٠ نقطة", "1,000 pts"),
      "٢٥٠ ج.م": L("عنبر", "Amber"),
      "٣٥٠٠ ج.م": L("٣٠٠٠ نقطة", "3,000 pts"),
      "٥٠٠ ج.م": L("عود", "Oud"),
    },
  }),
  lib("popup-reward", {
    as: "refer-friend",
    name: L("ادعي صاحبتك", "Refer a friend"),
    text: {
      "جرّب حظك": L("ادّي ١٠٠ وخدي ١٠٠", "Give EGP 100, get EGP 100"),
      "المرة دي كسبت، وده كودك.": L(
        "صاحبتك تاخد خصم ١٠٠ ج.م على أول طلب فوق ٥٠٠، وانتي تاخدي ١٠٠٠ نقطة لما تطلب.",
        "Your friend gets EGP 100 off a first order over EGP 500, and you get 1,000 points when she orders.",
      ),
      "كسبت": L("لصاحبتك", "For your friend"),
      "شحن مجاني": L("خصم ١٠٠ ج.م", "EGP 100 off"),
      "الكود: FREESHIP": L("الكود: BASHRA100", "Code: BASHRA100"),
      "استخدمه دلوقتي": L("تسوقي دلوقتي", "Shop now"),
    },
  }),
  lib("testimonials-ruled", {
    text: {
      "آراء العملاء": L("الآراء", "Reviews"),
      "قالوا عننا": L("من أعضائنا", "From our members"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الاختيار حسب البشرة وداني للتونر والاحمرار هدي في أسبوعين.",
        "Choosing by skin type led me to the toner, and my redness calmed in two weeks.",
      ),
      "م": L("ن", "N"),
      "مريم أ.": L("نور ع.", "Nour A."),
      "القاهرة": L("المعادي", "Maadi"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("دفعت آخر طلب بالنقط بس.", "I paid for my last order with points alone."),
      "ع": L("ي", "Y"),
      "عمر ك.": L("ياسمين ك.", "Yasmine K."),
      "الإسكندرية": L("الزمالك", "Zamalek"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("زيوت حلوة جدًا. نفسي الإزازة تبقى أكبر.", "Lovely oils. I wish the bottles were bigger."),
      "ن": L("ر", "R"),
      "نور ح.": L("رنا س.", "Rana S."),
      "الجيزة": L("٦ أكتوبر", "6th of October"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن بشرة", "About Bashra"), L("محل عناية صغير في المعادي بيختار المنتج حسب نوع البشرة.", "A small skincare shop in Maadi that matches products to skin types.")),
  aboutStory(lib, {
    photo: PHOTOS.soapRowWide,
    alt: L("صف صابون هاند ميد على رخام", "A row of handmade soap bars on marble"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("٣ منتجات، مش ٣٠", "Three products, not thirty"),
    text: L("بدأنا عشان الرفوف مليانة وكل بشرة محتاجة حاجة مختلفة. بنسألك عن بشرتك الأول، وبعدين نرشح.", "We started because shelves are crowded and every skin needs something different. We ask about your skin first, then suggest."),
    more: L("وكل طلب بيكسبك نقط تصرفيها على طلبك الجاي.", "And every order earns points you spend on the next one."),
    button: L("كل المنتجات", "Shop all"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("عناية متختارة لبشرتك، مش للرف.", "Skincare picked for your skin, not for the shelf."),
  categories: [
    ["face", "الوش", "Face", PHOTOS.faceOil],
    ["body", "الجسم", "Body", PHOTOS.soapTrio],
    ["hair", "الشعر", "Hair", PHOTOS.hairOil],
    ["sets", "أطقم", "Sets", PHOTOS.ritualSet],
  ],
  products: [
    ["olive-oil-soap-trio", "body", "٣ صابون زيت زيتون", "Olive Oil Soap Trio", PHOTOS.soapTrio, 240, { sold90: 210 }],
    ["prickly-pear-face-oil", "face", "زيت التين الشوكي للوش", "Prickly Pear Face Oil", PHOTOS.faceOil, 690, { rating: 4.8, sold90: 164 }],
    ["rose-water-toner", "face", "تونر ماء الورد", "Rose Water Toner", PHOTOS.toner, 320, { sold90: 120 }],
    ["sesame-body-oil", "body", "زيت سمسم للجسم", "Sesame Body Oil", PHOTOS.bodyOil, 380, { sold90: 48 }],
    ["rosemary-hair-oil", "hair", "زيت روزماري للشعر", "Rosemary Hair Oil", PHOTOS.hairOil, 290, { compareAtPrice: 340, sold90: 188 }],
    ["full-ritual-set", "sets", "طقم الروتين الكامل", "Full Ritual Set", PHOTOS.ritualSet, 1290, { compareAtPrice: 1520, isFeatured: true, sold90: 62 }],
    ["whipped-face-cream", "face", "كريم وش مخفوق", "Whipped Face Cream", PHOTOS.faceCream, 450, { sold90: 70 }],
    ["gua-sha-serum-set", "sets", "طقم جواشا وسيروم", "Gua Sha and Serum Set", PHOTOS.guaSha, 780, { sold90: 35 }],
    ["handmade-soap-bars", "body", "٧ صابونات هاند ميد", "Seven Handmade Soap Bars", PHOTOS.soapRow, 320, { sold90: 90 }],
  ],
});

export const BASHRA = libraryTemplate({
  key: BASHRA_KEY,
  version: 1,
  name: L("بشرة", "Bashra"),
  description: L(
    "عناية حسب نوع البشرة ومكافآت: لاقي روتينك، اختيارنا، خزّني ووفّري، النقط والمستويات، ادعي صاحبتك وآراء الأعضاء. أربع صفحات جاهزة.",
    "Skincare by concern, with rewards: find your routine, our pick, stock up and save, points and tiers, refer a friend and member reviews. Four ready pages.",
  ),
  category: "beauty",
  sortOrder: 400,
  palette: ["#fbf6f2", "#f3e4dc", "#f6c9b8", "#9c3d54"],
  colors: {
    primary: "#9c3d54",
    secondary: "#f3e4dc",
    background: "#fbf6f2",
    foreground: "#2e1a20",
    muted: "#6b555b",
    border: "#ead8d0",
    accent: "#f6c9b8",
  },
  fonts: { heading: "Noto Naskh Arabic", body: "Almarai" },
  radius: 18,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن بشرة", "About"), seo: { title: L("عن بشرة", "About Bashra") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("شارع ٢٣٣، دجلة، المعادي.", "Road 233, Degla, Maadi."),
        heading: L("قوليلنا بشرتك محتاجة إيه", "Tell us what your skin needs"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الطلبات والنقط والمستويات.", "Orders, points and tiers."),
        question: L("أصرف نقطي إزاي؟", "How do I spend my points?"),
        answer: L("كل ١٠٠ نقطة بخصم ١٠ ج.م. ابعتيلنا على واتساب قبل ما تطلبي ونضيف الخصم.", "Every 100 points take EGP 10 off. Message us on WhatsApp before you order and we add the discount."),
      }),
    },
  ],
  demo: DEMO,
});
