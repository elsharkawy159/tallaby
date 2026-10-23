/**
 * Hikaya (template 89, a kids' book club; Claude Design "Storefront
 * Templates"): warm cream paper, a story-book purple for actions and an
 * apricot highlight, Baloo Bhaijaan 2 throughout and round 20px corners. A
 * monthly box of Arabic stories: five new stories in one box, what do they
 * love, subscribe for 1, 3 or 6 months, reading points, the books shelf
 * and bedtime reviews. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): picture books on a
 * shelf, a classroom bookcase with book bins, an open book on a tree stump,
 * blank bookmark cards and wooden animals on books. The design's library
 * photo with large cover art was replaced. No people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const HIKAYA_KEY = "hikaya";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(HIKAYA_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  storyShelf: pexels(31024471, 900),
  storyShelfWide: pexels(31024471),
  readers: pexels(8364640, 900),
  usedBooks: pexels(8499579, 900),
  usedBooksWide: pexels(8499579),
  stump: pexels(29342337, 900),
  bookmarks: pexels(5706020, 900),
  animalsOnBooks: pexels(3661201, 900),
  boardShelf: pexels(7703324, 900),
  bookcase: pexels(4887260, 900),
};

const NAME = L("نادي حكاية", "Hikaya Club");

const header = lib("header-pill", {
  text: { "اسم متجرك": NAME, "المتجر": L("كل الكتب", "All books"), "العروض": L("الأكثر مبيعاً", "Best sellers"), "المدونة": L("أسئلة", "FAQ") },
  links: { "/products": [SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("جواب نادي حكاية", "The Hikaya Club letter"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("حواديت البوكس الجاي وكود خصم للمشتركين، مرة في الشهر.", "Next box’s stories and a members’ code, once a month."),
    "م": L("ح", "H"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ نادي حكاية. كل الحقوق محفوظة.", "© 2026 Hikaya Club. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("about-inset", {
    photo: [undefined, undefined, undefined, undefined, undefined, undefined, undefined, PHOTOS.storyShelfWide],
    text: {
      "إزاي بنشتغل": L("الشهر ده", "This month"),
      "كل منتج بيتراجع قبل ما يوصلك": L("٥ حواديت جديدة في بوكس واحد", "Five new stories, one box"),
      "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف.": L("بتختارها مدرّسة وأمينة مكتبة، من ٣ لـ٩ سنين.", "Picked by a teacher and a librarian, for ages 3 to 9."),
      "اعرف أكتر": L("شوف الشهر ده", "See this month"),
      "صورة المتجر": L("كتب أطفال مرصوصة على رف خشب", "Children’s books stacked on a wooden shelf"),
    },
    links: { "/about": search("بوكس") },
  }),
  lib("newsletter-interests", {
    text: {
      "إيه اللي يهمك؟": L("بيحبوا إيه؟", "What do they love?"),
      "هنبعتلك اللي يخصك بس، مرة في الأسبوع.": L("قولنا وبنظبط كل بوكس على ذوقهم.", "Tell us and we tailor every box to them."),
      "وصل حديثًا": L("حيوانات", "Animals"),
      "العروض": L("الفضاء", "Space"),
      "هدايا": L("مضحك", "Funny"),
      "نصايح": L("قبل النوم", "Bedtime"),
    },
  }),
  lib("bundle-quantity", {
    text: {
      "وفّر مع الكمية": L("اشترك", "Subscribe"),
      "قطعة واحدة": L("بوكس شهر", "1 month"),
      "قطعتين": L("٣ شهور", "3 months"),
      "على القطعة التانية": L("على كل بوكس", "on every box"),
      "٣ قطع": L("٦ شهور", "6 months"),
      "على الطلب كله": L("على كل بوكس", "on every box"),
      "اختار عدد القطع من السلة.": L("اختار عدد البوكسات من السلة، وبنبعتلك بوكس كل شهر.", "Pick the number of boxes in the cart; we send one each month."),
    },
  }),
  lib("promo-tiers", {
    name: L("نقط القراية", "Reading points"),
    text: {
      "عرض الشهر": L("نقطة لكل ١٠ ج.م", "1 point per EGP 10"),
      "كل ما تزود، توفّر أكتر": L("كل ما تقروا أكتر، تكسبوا أكتر", "The more you read, the more you earn"),
      "لما تشتري بـ": L("لما تجمع", "Collect"),
      "١٠٠٠ ج.م": L("٣٠٠ نقطة", "300 points"),
      "١٠٠ ج.م": L("فواصل ببلاش", "Free bookmarks"),
      "الأكثر استخدامًا": L("دودة كتب", "Bookworm"),
      "٢٠٠٠ ج.م": L("١٠٠٠ نقطة", "1,000 points"),
      "٢٥٠ ج.م": L("توصيل ببلاش", "Free delivery"),
      "٣٥٠٠ ج.م": L("٣٠٠٠ نقطة", "3,000 points"),
      "٥٠٠ ج.م": L("بوكس ببلاش", "A free box"),
      "خصم على الفاتورة": L("هدية المستوى", "Level reward"),
    },
  }),
  lib("products-shelf", {
    text: { "تسوّق حسب مزاجك": L("الكتب", "Books"), "عليه خصم": L("الأعلى تقييماً", "Top rated") },
    links: { "/products": [NEW, BEST, RATED, SHOP] },
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("اتقرت قبل النوم", "Read at bedtime"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "بنتي بتستنى البوكس كل شهر، وبتختار حدوتة النوم بنفسها.",
        "My daughter waits for the box every month and picks her own bedtime story.",
      ),
      "م": L("ر", "R"),
      "مريم أ.": L("رحاب ع.", "Rehab A."),
      "القاهرة": L("التجمع", "New Cairo"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("الحواديت عربي سهل ورسوماتها حلوة جداً.", "Simple Arabic and lovely illustrations."),
      "ي": L("م", "M"),
      "يوسف م.": L("محمد ي.", "Mohamed Y."),
      "المنصورة": L("المنصورة", "Mansoura"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("قلتلهم ابني بيحب الفضاء، وجه البوكس كله نجوم وكواكب.", "I said my son loves space and the whole box was stars and planets."),
      "ع": L("س", "S"),
      "عمر ك.": L("سارة ك.", "Sara K."),
      "الإسكندرية": L("الإسكندرية", "Alexandria"),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("أحسن من التابلت قبل النوم، بجد.", "Better than a tablet at bedtime, honestly."),
      "س": L("أ", "A"),
      "سلمى ر.": L("أمل ر.", "Amal R."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("جمعنا نقط وخدنا البوكس السابع ببلاش.", "We collected points and got the seventh box free."),
      "ن": L("ط", "T"),
      "نور ح.": L("طارق ح.", "Tarek H."),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("الكتب الكرتون استحملت البيبي وعضّه.", "The board books survived the baby’s teething."),
      "ك": L("ن", "N"),
      "كريم ع.": L("ندى ع.", "Nada A."),
    },
    links: { "/products": RATED },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن نادي حكاية", "About Hikaya Club"), L("نادي كتب أطفال بيبعت حواديت عربي كل شهر.", "A kids’ book club sending Arabic stories every month.")),
  aboutStory(lib, {
    photo: PHOTOS.usedBooksWide,
    alt: L("رف كتب أطفال فيه صناديق ملوّنة", "A children’s bookshelf with coloured bins"),
    eyebrow: L("التجمع الخامس", "New Cairo"),
    title: L("حدوتة كل ليلة", "A story every night"),
    text: L("إحنا مدرّسة وأمينة مكتبة، بنختار ٥ حواديت عربي كل شهر تناسب سن طفلك.", "We are a teacher and a librarian choosing five Arabic stories a month to fit your child’s age."),
    more: L("وكل بوكس بيجمعلك نقط تتبدل بفواصل وتوصيل وبوكسات ببلاش.", "And every box earns points for bookmarks, free delivery and free boxes."),
    button: L("اشترك في البوكس", "Subscribe to the box"),
    href: search("بوكس"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("بوكس حواديت عربي جديد كل شهر.", "A new box of Arabic stories every month."),
  categories: [
    ["stories", "حواديت", "Stories", PHOTOS.storyShelf],
    ["readers", "أول قراية", "First readers", PHOTOS.readers],
    ["board", "كتب كرتون", "Board books", PHOTOS.boardShelf],
  ],
  products: [
    ["bedtime-stories-box", "stories", "بوكس حواديت قبل النوم", "Bedtime Stories Box", PHOTOS.storyShelf, 520, { isFeatured: true, rating: 4.9, sold90: 210 }],
    ["first-readers-set", "readers", "طقم أول قراية", "First Readers Set", PHOTOS.readers, 340, { sold90: 96 }],
    ["board-book-bundle", "board", "باقة كتب كرتون", "Board Book Bundle", PHOTOS.boardShelf, 290, { sold90: 120 }],
    ["story-bin", "stories", "صندوق الحواديت", "Story Bin", PHOTOS.usedBooks, 890, { compareAtPrice: 1050, sold90: 40 }],
    ["animal-stories", "stories", "حواديت الحيوانات", "Animal Stories", PHOTOS.animalsOnBooks, 380, { rating: 4.8, sold90: 74 }],
    ["adventure-novel", "readers", "رواية مغامرات من ٩ سنين", "Adventure Novel, 9+", PHOTOS.stump, 210, { sold90: 36 }],
    ["first-library-shelf", "readers", "مكتبة البيت الأولى، ٢٠ كتاب", "First Home Library, 20 books", PHOTOS.bookcase, 1650, { compareAtPrice: 1900, isFeatured: true, sold90: 18 }],
    ["draw-your-bookmarks", "board", "فواصل ترسمها بنفسك", "Draw-Your-Own Bookmarks", PHOTOS.bookmarks, 60, { inStock: false, sold90: 150 }],
  ],
});

export const HIKAYA = libraryTemplate({
  key: HIKAYA_KEY,
  version: 2,
  changelog: "Hikaya v2: product page",
  productPage: { thumbs: "bottom", band: "brand", copy: { back: L("رجوع للحكايات", "Back to the stories"), reviews: L("آراء قبل النوم", "Bedtime reviews"), related: L("حكايات تانية للقراءة", "More stories to read") } },
  name: L("حكاية", "Hikaya"),
  description: L(
    "نادي كتب أطفال: بوكس الشهر، بيحبوا إيه، الاشتراك، نقط القراية ورف الكتب. أربع صفحات جاهزة.",
    "A kids’ book club: this month’s box, what they love, subscribe, reading points and the shelf. Four ready pages.",
  ),
  category: "books",
  sortOrder: 890,
  palette: ["#fffaf2", "#fdebd0", "#ffb84c", "#6c4ab6"],
  colors: {
    primary: "#6c4ab6",
    secondary: "#fdebd0",
    background: "#fffaf2",
    foreground: "#2b2346",
    muted: "#665d80",
    border: "#f3d9b5",
    accent: "#ffb84c",
  },
  fonts: { heading: "Baloo Bhaijaan 2", body: "Baloo Bhaijaan 2" },
  radius: 20,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن نادي حكاية", "About"), seo: { title: L("عن نادي حكاية", "About Hikaya Club") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("التجمع الخامس، القاهرة الجديدة.", "Fifth Settlement, New Cairo."),
        heading: L("قولنا سن طفلك وبيحب إيه", "Tell us your child’s age and what they love"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("البوكس والنقط والتوصيل.", "The box, points and delivery."),
        question: L("الاشتراك بيتجدد لوحده؟", "Does the subscription renew by itself?"),
        answer: L("لأ، بتدفع عدد البوكسات مقدماً وبنفكرك قبل آخر بوكس.", "No, you pay for the boxes up front and we remind you before the last one."),
      }),
    },
  ],
  demo: DEMO,
});
