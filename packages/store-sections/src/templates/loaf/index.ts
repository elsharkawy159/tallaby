/**
 * Loaf (template 19, sourdough bakery and subscriptions; Claude Design
 * "Storefront Templates"): warm flour paper, a dark crust brown for
 * actions and a golden highlight, Lalezar display type over Tajawal and
 * round 24px corners. A bakery that sells a weekly loaf: bread on a big
 * word, flour-water-salt, today's shelf, the subscription, regulars and
 * FAQs. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): sourdough loaves,
 * croissants and buns. No people, hands or brand marks.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const LOAF_KEY = "loaf";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(LOAF_KEY, getDesign(id)!, { corners: 24, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  sourdough: pexels(30890566, 900),
  sourdoughWide: pexels(30890566, 1600),
  scored: pexels(27418961, 900),
  rustic: pexels(28354523, 900),
  loavesBuns: pexels(8633662, 900),
  croissants: pexels(20002837, 900),
  croissantCoffee: pexels(34800842, 900),
  briocheBoard: pexels(20200307, 900),
  sesameBuns: pexels(38433899, 900),
};

const NAME = L("لوف آند كو", "Loaf & Co.");

const header = lib("header-centered", {
  text: {
    "المتجر": L("اطلب", "Order"),
    "العروض": L("الأكثر طلباً", "Most ordered"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨": L("اشتراكات ساوردو من مصر الجديدة", "Sourdough subscriptions from Heliopolis"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("المخبز", "The bakery"),
  },
  links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("أخبار العيش مرة في الأسبوع", "Bread news, once a week"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("العيش الجديد وقائمة مخبوزات الويك إند.", "New loaves and the weekend pastry list."),
    "م": L("ل", "L"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ لوف آند كو. كل الحقوق محفوظة.", "© 2026 Loaf & Co. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("المخبز", "The bakery"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-big-word", { text: { "جديد": L("عيش", "BREAD"), "اطلبها": L("اطلب الرغيف", "Order the loaf") } }),
  lib("categories-circles", { text: { "بتدوّر على إيه؟": L("طالع من الفرن", "Out of the oven") } }),
  lib("products-shelf", {
    text: {
      "تسوّق حسب مزاجك": L("طازة النهارده", "Fresh today"),
      "وصل جديد": L("جديد", "New"),
      "الأكثر مبيعًا": L("العيش", "Bread"),
      "عليه خصم": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [NEW, BEST, RATED, SHOP] },
  }),
  lib("features-checklist", {
    person: [undefined, undefined, undefined, undefined, undefined, PHOTOS.scored],
    text: {
      "فريق يجهز الطلبات": L("رغيف ساوردو على كتان", "Sourdough on linen"),
      "كيف نعمل": L("الاشتراكات", "Subscriptions"),
      "كل طلب يُراجع مرتين": L("عيش طازة كل جمعة", "Fresh bread every Friday"),
      "قبل أن يخرج من المخزن نراجع المنتج والتغليف والفاتورة.": L("اختار رغيفك مرة وإحنا نجيبه كل أسبوع.", "Pick your loaf once and we bring it every week."),
      "كل منتج يُفحص قبل الشحن": L("وقّف أو فوّت أي أسبوع", "Pause or skip any week"),
      "تغليف محكم ومبطّن": L("يوصل قبل ٩ الصبح", "Delivered before 9am"),
      "فاتورة وضمان داخل العلبة": L("غيّر الرغيف في أي وقت", "Change your loaf anytime"),
      "رقم تتبع على واتساب": L("من ٣٨٠ ج.م في الشهر", "From EGP 380 a month"),
      "اعرف أكثر": L("اشترك", "Subscribe"),
    },
    links: { "/about": SHOP },
  }),
  lib("text-centered", {
    text: {
      "ملاحظة": L("من ٢٠١٨", "Since 2018"),
      "مواعيد شهر رمضان": L("دقيق ومية وملح ويومين", "Flour, water, salt and two days"),
      "طوال الشهر نعمل من ٨ مساءً حتى ٢ صباحًا، والطلبات أونلاين مستمرة كالمعتاد.": L(
        "من غير محسنات ولا اختصارات. كل رغيف بيتخمّر ٤٨ ساعة وبيتخبز قبل الشروق.",
        "No improvers, no shortcuts. Every loaf ferments for 48 hours and is baked before sunrise.",
      ),
      "تسوّق الآن": L("اطلب دلوقتي", "Order now"),
    },
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("من زباينا", "From our regulars"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L("ساوردو الجمعة بقى طقس عيلة.", "Friday sourdough is now a family ritual."),
      "م": L("ه", "H"),
      "مريم أ.": L("هبة م.", "Heba M."),
      "القاهرة": L("مصر الجديدة", "Heliopolis"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("الكرواسون أحلى من باريس بجد.", "The croissants are better than in Paris, honestly."),
      "ي": L("ع", "A"),
      "يوسف م.": L("عمرو س.", "Amr S."),
      "المنصورة": L("مدينة نصر", "Nasr City"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("بحب الشوفان. نفسي التوصيل يبقى أبدر.", "Love the rye. The delivery window could be earlier."),
      "ع": L("د", "D"),
      "عمر ك.": L("داليا ك.", "Dalia K."),
      "الإسكندرية": L("القاهرة", "Cairo"),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("الرغيف بيوصل سخن لسه، والريحة بتملى البيت.", "The loaf still arrives warm and fills the house with its smell."),
      "س": L("ن", "N"),
      "سلمى ر.": L("نهى ر.", "Noha R."),
      "أسيوط": L("الكوربة", "Korba"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("البريوش طري جداً والولاد بيحبوه.", "The brioche is so soft; the kids love it."),
      "ن": L("م", "M"),
      "نور ح.": L("مي ح.", "Mai H."),
      "الجيزة": L("مصر الجديدة", "Heliopolis"),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("الاشتراك مريح، بوقّفه لما بسافر.", "The subscription is easy; I pause it when I travel."),
      "ك": L("ط", "T"),
      "كريم ع.": L("طارق ع.", "Tarek A."),
      "طنطا": L("الكوربة", "Korba"),
      "كل الآراء": L("اطلب دلوقتي", "Order now"),
    },
    links: { "/products": SHOP },
  }),
  lib("faq-columns", {
    as: "home-faq",
    text: {
      "أسئلة شائعة": L("حاجات تهمك", "Good to know"),
      "كم يستغرق التوصيل؟": L("العيش بيوصل إمتى؟", "When does the bread arrive?"),
      "القاهرة والجيزة من يوم إلى يومين، وباقي المحافظات من ٢ إلى ٦ أيام.": L(
        "بنخبز قبل الشروق ونوصّل من ٧ لـ ٩ الصبح في مصر الجديدة ومدينة نصر.",
        "We bake before sunrise and deliver from 7 to 9am in Heliopolis and Nasr City.",
      ),
      "ما سياسة الاسترجاع؟": L("أوقف الاشتراك إزاي؟", "How do I pause my subscription?"),
      "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": L(
        "ابعتلنا قبل الأربع بالليل وإحنا نوقّف أسبوع الجمعة اللي جاية.",
        "Message us before Wednesday night and we pause the coming Friday.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("المخبز", "The bakery"), L("مخبز ساوردو صغير في الكوربة.", "A small sourdough bakery in Korba.")),
  aboutStory(lib, {
    photo: PHOTOS.loavesBuns,
    alt: L("أرغفة ساوردو وعيش طازة", "Sourdough loaves and fresh rolls"),
    eyebrow: L("من ٢٠١٨", "Since 2018"),
    title: L("يومين لكل رغيف", "Two days for every loaf"),
    text: L("بنعجن بالليل ونسيب العجينة تتخمّر ٤٨ ساعة، وبنخبز قبل الشروق عشان يوصلك سخن.", "We mix at night, let the dough ferment for 48 hours and bake before sunrise so it reaches you warm."),
    more: L("دقيق ومية وملح، ومفيش أي حاجة تانية.", "Flour, water and salt, and nothing else."),
    button: L("اطلب دلوقتي", "Order now"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("اشتراكات ساوردو، متخبزة في مصر الجديدة.", "Sourdough subscriptions, baked in Heliopolis."),
  categories: [
    ["bread", "عيش", "Bread", PHOTOS.rustic],
    ["pastry", "مخبوزات", "Pastry", PHOTOS.croissants],
    ["buns", "بريوش وعيش صغير", "Brioche & rolls", PHOTOS.sesameBuns],
  ],
  products: [
    // The first featured product fills hero-big-word: a wide landscape photo (template-rules, owner 2026-10-27).
    ["country-sourdough", "bread", "ساوردو بلدي", "Country Sourdough", PHOTOS.sourdoughWide, 120, { isFeatured: true, rating: 4.9, sold90: 640 }],
    ["scored-wheat-loaf", "bread", "رغيف قمح منقوش", "Scored Wheat Loaf", PHOTOS.scored, 140, { sold90: 60 }],
    ["rustic-white", "bread", "رغيف أبيض ريفي", "Rustic White Loaf", PHOTOS.rustic, 110, { sold90: 150 }],
    ["weekly-loaf-subscription", "bread", "اشتراك رغيف أسبوعي", "Weekly Loaf Subscription", PHOTOS.loavesBuns, 380, { isFeatured: true, sold90: 110 }],
    ["butter-croissant", "pastry", "كرواسون زبدة", "Butter Croissant", PHOTOS.croissants, 45, { rating: 4.9, sold90: 520 }],
    ["croissant-breakfast", "pastry", "فطار كرواسون وقهوة", "Croissant Breakfast", PHOTOS.croissantCoffee, 95, { sold90: 90 }],
    ["brioche-box", "buns", "بوكس بريوش", "Brioche Box", PHOTOS.briocheBoard, 180, { compareAtPrice: 210, sold90: 90 }],
    ["sesame-buns", "buns", "عيش سمسم", "Sesame Buns, 6", PHOTOS.sesameBuns, 75, { inStock: false, sold90: 70 }],
  ],
});

export const LOAF = libraryTemplate({
  key: LOAF_KEY,
  version: 4,
  changelog: "Loaf v4: categories, section order, wide hero photo",
  name: L("لوف", "Loaf"),
  description: L(
    "مخبز واشتراكات ساوردو: كلمة كبيرة، رف طازة النهارده واشتراك أسبوعي. أربع صفحات جاهزة.",
    "Sourdough bakery and subscriptions: a big word, today’s shelf and a weekly loaf. Four ready pages.",
  ),
  category: "food",
  sortOrder: 190,
  palette: ["#fff6ea", "#f4e3c8", "#f2b44a", "#3b2416"],
  colors: {
    primary: "#3b2416",
    secondary: "#f4e3c8",
    background: "#fff6ea",
    foreground: "#3b2416",
    muted: "#6e5847",
    border: "#ecd8bb",
    accent: "#f2b44a",
  },
  fonts: { heading: "Lalezar", body: "Tajawal" },
  radius: 24,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("المخبز", "The bakery"), seo: { title: L("المخبز", "The bakery") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("٥ شارع بغداد، الكوربة، مصر الجديدة.", "5 Baghdad St, Korba, Heliopolis."),
        heading: L("عن اشتراك أو طلب كبير", "About a subscription or a large order"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: [pageHeader(lib, "faq-header", L("الأسئلة الشائعة", "FAQ"), L("الاشتراكات والتوصيل والعيش.", "Subscriptions, delivery and bread.")), lib("faq-numbered", {})],
    },
  ],
  demo: DEMO,
  productPage: { surface: "shelf", thumbs: "bottom", band: "brand", copy: { back: L("رجوع للفرن", "Back to the bakery"), reviews: L("اللي ذاقوه قالوا", "From our regulars"), related: L("من رف النهارده", "From today's shelf") } },
});
