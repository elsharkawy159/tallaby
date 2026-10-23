/**
 * Rep (template 46, home training club; Claude Design "Storefront
 * Templates"): chalk paper, black for actions and a lime highlight, Changa
 * headings over Cairo and square corners. Gear picked by coaches: shop by
 * goal, a starter kit, band sets for friends, the four coaches, the club in
 * numbers, train with a friend and members' messages. Built from section
 * library designs (`fromLibrary`).
 *
 * Rewards have no library designs yet: "Refer a friend" uses the reward
 * card (`popup-reward`) with the REP100 code as copy. Coach calls are booked
 * over WhatsApp; there is no booking in checkout. The kit total is typed
 * copy for the three newest products; the coaches show initials.
 *
 * Photos: Pexels, each checked by eye (2026-10-23): a training flat lay
 * (mat, dumbbells, bands, a top and trainers laid flat), hex dumbbells,
 * resistance bands with small dumbbells, a mat and trainers on grass, a
 * smartwatch, earbuds on marble, kettlebells, a jump rope with a bottle and
 * an empty home gym. The design's photo of legs beside a mat and its two
 * local product renders were replaced. No people, no hands or feet, no
 * logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const REP_KEY = "rep";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(REP_KEY, getDesign(id)!, { corners: 0, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;
const KITS = search("باكدج");

const PHOTOS = {
  flatLay: pexels(3927387),
  flatLaySmall: pexels(3927387, 900),
  hexDumbbells: pexels(29224210, 900),
  bands: pexels(16695681, 900),
  mat: pexels(7880203, 900),
  watch: pexels(13007642, 900),
  buds: pexels(3921817, 900),
  kettlebells: pexels(13863727, 900),
  rope: pexels(8032842, 900),
  homeGym: pexels(27195989),
};

const NAME = L("ريب كلوب", "Rep Club");

const header = lib("header-chips", {
  text: { "م": L("ر", "R"), "اسم متجرك": NAME, "ابحث عن منتج…": L("ابحث عن دمبل، حبل مقاومة، مات…", "Search dumbbells, bands, mats…") },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("عدّة كمان", "One more rep"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ ريب كلوب. كل الحقوق محفوظة.", "© 2026 Rep Club. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.flatLay],
    text: {
      "كوليكشن الموسم": L("اتمرن في البيت", "Train at home"),
      "صوت أنقى، كل يوم": L("الأدوات اللي الكوتش هيختارها", "Gear your coach would pick"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "قولنا هدفك، وخد باكدج ومكالمة ١٥ دقيقة ببلاش تخطط بيها أول شهر.",
        "Tell us your goal, get a kit and a free 15-minute call to plan your first month.",
      ),
      "تسوق الآن": L("تسوق الباكدجات", "Shop kits"),
      "العروض": L("اسأل كوتش", "Ask a coach"),
      "صورة الحملة": L("مات ودمبل وحبال مقاومة على الأرض", "A mat, dumbbells and bands on the floor"),
    },
    links: { "/products": [KITS, "/contact"] },
  }),
  lib("finder-use", {
    text: {
      "ساعدني أختار": L("هدفك", "Your goal"),
      "هتستخدمها في إيه؟": L("بتتمرن عشان إيه؟", "What are you training for?"),
      "اختار استخدامك ونوديك على المنتجات المناسبة ليه.": L("اختار هدفك ونوريك الأدوات اللي الكوتشات بيرشحوها.", "Pick a goal and we will show you the gear our coaches suggest."),
      "المشاوير": L("أخس", "Lose weight"),
      "الرياضة": L("أقوى", "Build strength"),
      "المكالمات": L("٢٠ دقيقة في اليوم", "20 minutes a day"),
      "الشغل من البيت": L("لسه ببدأ", "Just starting"),
      "الأكثر طلبًا دلوقتي": L("الكوتشات بيرشحوا", "Coaches recommend"),
    },
    links: { "/products": [search("مات"), search("دمبل"), search("حبال"), KITS] },
  }),
  lib("bundle-poster", {
    text: {
      "طقم المشاوير": L("باكدج البداية", "Starter kit"),
      "كل اللي تحتاجه في الطريق": L("كل اللي تحتاجه لأول شهر", "Everything for your first month"),
      "١٬٢٧٠ ج.م": L("١٬٣٧٧ ج.م", "EGP 1,377"),
      "بدل ١٬٤٩٠ ج.م": L("بدل ١٬٦٢٠ ج.م", "Was EGP 1,620"),
      "اشتري الطقم": L("خد الباكدج", "Get the kit"),
    },
    links: { "/products": NEW },
  }),
  lib("bundle-quantity", {
    text: {
      "وفّر مع الكمية": L("اتمرنوا مع بعض", "Train together"),
      "قطعة واحدة": L("طقم واحد", "1 set"),
      "قطعتين": L("طقمين", "2 sets"),
      "على القطعة التانية": L("على الطقم التاني", "On the second set"),
      "٣ قطع": L("٣ أطقم", "3 sets"),
      "اختار عدد القطع من السلة.": L("اختار عدد الأطقم من السلة، ليك ولصحابك.", "Choose how many sets in your cart, for you and your friends."),
    },
  }),
  lib("team-grid", {
    text: {
      "الفريق": L("الكوتشات", "Coaches"),
      "الناس اللي ورا المحل": L("الكوتشات اللي بيختاروا أدواتنا", "The coaches who pick our gear"),
      "م": L("ي", "Y"),
      "منى عادل": L("يوسف عادل", "Youssef Adel"),
      "المؤسسة": L("كوتش قوة", "Strength coach"),
      "ك": L("ن", "N"),
      "كريم سامي": L("ندى سمير", "Nada Samir"),
      "المشتريات": L("مرونة ويوجا", "Mobility and yoga"),
      "ي": L("ع", "O"),
      "ياسمين فؤاد": L("عمر فتحي", "Omar Fathy"),
      "خدمة العملاء": L("كوتش جري", "Running coach"),
      "ع": L("ل", "L"),
      "عمر حسن": L("ليلى حسن", "Laila Hassan"),
      "التوصيل": L("تغذية", "Nutrition"),
    },
  }),
  lib("team-numbers", {
    text: {
      "٧ سنين في أرقام": L("ريب كلوب لحد دلوقتي", "Rep Club so far"),
      "٥٠ ألف": L("٨٤٠٠", "8,400"),
      "عميل رجعلنا تاني": L("جيم بيت اتجهز", "home gyms set up"),
      "٢٧": L("٣١٠٠", "3,100"),
      "محافظة بنوصلها": L("مكالمة كوتش السنة دي", "coach calls this year"),
    },
  }),
  lib("popup-reward", {
    name: L("اتمرن مع صاحبك", "Refer a friend"),
    text: {
      "جرّب حظك": L("اتمرن مع صاحبك", "Train with a friend"),
      "المرة دي كسبت، وده كودك.": L(
        "صاحبك ياخد خصم ١٠٠ ج.م على طلب فوق ٨٠٠، وانت تاخد ١٠٠ ج.م لما يطلب.",
        "Your friend gets EGP 100 off an order over EGP 800, and you get EGP 100 when they order.",
      ),
      "كسبت": L("لصاحبك", "For your friend"),
      "شحن مجاني": L("خصم ١٠٠ ج.م", "EGP 100 off"),
      "الكود: FREESHIP": L("الكود: REP100", "Code: REP100"),
      "استخدمه دلوقتي": L("تسوقوا سوا", "Shop together"),
    },
    links: { "/products": KITS },
  }),
  lib("testimonials-chat", {
    text: {
      "من الواتساب": L("الآراء", "Reviews"),
      "رسايل بتفرّحنا": L("رسايل من الأعضاء", "Messages from members"),
      "مريم أ.": L("خالد ب.", "Khaled B."),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "مكالمة الكوتش ظبطتلي أول ٤ أسابيع. نزلت ٥ كيلو.",
        "The coach call set my first four weeks. Down 5 kg.",
      ),
      "ده يسعدنا جدًا، شكرًا ليكي!": L("عاش يا بطل، كمّل!", "Great work, keep going!"),
      "عمر ك.": L("منة س.", "Menna S."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "اشتريت ٣ أطقم حبال ليا ولإخواتي ووفرت ١٨٪.",
        "Bought three band sets for me and my sisters and saved 18%.",
      ),
      "يوسف م.": L("علي ح.", "Ali H."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("دمبل جامد. التوصيل لإسكندرية أخد ٣ أيام.", "Solid dumbbells. Delivery to Alex took three days."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن ريب كلوب", "About Rep Club"), L("أدوات تمرين بيت بيختارها ٤ كوتشات في الشيخ زايد.", "Home training gear chosen by four coaches in Sheikh Zayed.")),
  aboutStory(lib, {
    photo: PHOTOS.homeGym,
    alt: L("أوضة جيم في البيت فيها عجلة ومات وكور", "A home gym room with a bike, mats and balls"),
    eyebrow: L("الشيخ زايد", "Sheikh Zayed"),
    title: L("جيم في البيت، بخطة كوتش", "A home gym with a coach’s plan"),
    text: L("٤ كوتشات بيجربوا كل أداة قبل ما تنزل المتجر، وبيختاروا الباكدجات حسب الهدف.", "Four coaches try every piece before it reaches the shop and build the kits around your goal."),
    more: L("ومع كل باكدج مكالمة ١٥ دقيقة على واتساب تخطط بيها أول شهر.", "And every kit comes with a 15-minute WhatsApp call to plan your first month."),
    button: L("تسوق الباكدجات", "Shop kits"),
    href: KITS,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أدوات تمرين البيت، بيختارها كوتشات.", "Home training gear, picked by coaches."),
  categories: [
    ["kits", "باكدجات", "Kits", PHOTOS.flatLaySmall],
    ["weights", "أوزان", "Weights", PHOTOS.hexDumbbells],
    ["mats", "مات", "Mats", PHOTOS.mat],
    ["tech", "ساعات وسماعات", "Watches & audio", PHOTOS.watch],
  ],
  products: [
    ["resistance-band-set", "kits", "طقم حبال مقاومة", "Resistance Band Set", PHOTOS.bands, 390, { rating: 4.8, sold90: 210 }],
    ["thick-training-mat", "mats", "مات تمرين سميك", "Thick Training Mat", PHOTOS.mat, 690, { sold90: 120 }],
    ["neckband-sport-earphones", "tech", "سماعة سبورت لاسلكي", "Wireless Sport Earphones", PHOTOS.buds, 540, { compareAtPrice: 690, sold90: 77 }],
    ["home-strength-kit", "kits", "باكدج قوة البيت", "Home Strength Kit", PHOTOS.flatLaySmall, 2450, { compareAtPrice: 2800, isFeatured: true, rating: 4.8, sold90: 142 }],
    ["hex-dumbbell-pair-10kg", "weights", "جوز دمبل هكس ١٠ كيلو", "Hex Dumbbell Pair 10 kg", PHOTOS.hexDumbbells, 1350, { sold90: 98 }],
    ["pulse-sport-watch", "tech", "ساعة بالس سبورت", "Pulse Sport Watch", PHOTOS.watch, 1450, { sold90: 44 }],
    ["kettlebell-pair-8kg", "weights", "جوز كيتل بيل ٨ كيلو", "Kettlebell Pair 8 kg", PHOTOS.kettlebells, 1100, { sold90: 52 }],
    ["speed-jump-rope", "kits", "حبل نط سريع", "Speed Jump Rope", PHOTOS.rope, 260, { inStock: false, sold90: 40 }],
  ],
});

export const REP = libraryTemplate({
  key: REP_KEY,
  version: 2,
  changelog: "Rep v2: product page",
  productPage: { surface: "flat", thumbs: "bottom", headingCase: "upper", band: "brand", extras: ["product-perks"], copy: { back: L("رجوع للمعدات", "Back to the gear"), reviews: L("رسايل الأعضاء", "Members' messages"), related: L("معدات تكمّل تمرينك", "Gear to complete your training") } },
  name: L("ريب", "Rep"),
  description: L(
    "نادي تمرين البيت: حسب الهدف، باكدج البداية، أطقم للصحاب، الكوتشات، الأرقام، اتمرن مع صاحبك ورسايل الأعضاء. أربع صفحات جاهزة.",
    "Home training club: shop by goal, a starter kit, sets for friends, the coaches, the numbers, train with a friend and members’ messages. Four ready pages.",
  ),
  category: "sports",
  sortOrder: 460,
  palette: ["#f2f3f1", "#e2e5df", "#c6f432", "#111111"],
  colors: {
    primary: "#111111",
    secondary: "#e2e5df",
    background: "#f2f3f1",
    foreground: "#111111",
    muted: "#55594f",
    border: "#d3d7cf",
    accent: "#c6f432",
  },
  fonts: { heading: "Changa", body: "Cairo" },
  radius: 0,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن ريب كلوب", "About"), seo: { title: L("عن ريب كلوب", "About Rep Club") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("الشيخ زايد، الجيزة.", "Sheikh Zayed, Giza."),
        heading: L("احجز مكالمة كوتش أو اسأل عن باكدج", "Book a coach call or ask about a kit"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الباكدجات ومكالمة الكوتش والتوصيل.", "Kits, coach calls and delivery."),
        question: L("مكالمة الكوتش بتتحجز إزاي؟", "How do I book the coach call?"),
        answer: L("بعد ما الباكدج يوصل، ابعتلنا رقم الطلب على واتساب ونحددلك معاد.", "Once your kit arrives, send us the order number on WhatsApp and we set a time."),
      }),
    },
  ],
  demo: DEMO,
});
