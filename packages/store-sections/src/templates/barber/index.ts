/**
 * Barber (template 64, men's grooming; Claude Design "Storefront
 * Templates"): stone paper, a deep barbershop green for actions and a brass
 * gold highlight, Changa headings over Cairo and tight 4px corners. A Dokki
 * barbershop that also sells its oils: a split-screen welcome, the chair
 * price menu, book your chair, the beard kit, who is cutting and WhatsApp
 * reviews. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): empty barbershop
 * interiors, amber beard oil bottles, a balm jar, razors, brushes and combs
 * on plain surfaces. No people, no hands and no brand labels. The team grid
 * uses initials, not photos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const BARBER_KEY = "barber";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(BARBER_KEY, getDesign(id)!, { corners: 4, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  shopHero: pexels(20785318),
  shopAbout: pexels(1895701),
  cedarOil: pexels(6694147, 900),
  sandalOil: pexels(8709583, 900),
  beardBalm: pexels(27544670, 900),
  shavingSoap: pexels(995300, 900),
  safetyRazor: pexels(15088735, 900),
  brushStand: pexels(9201296, 900),
  aftershave: pexels(8789597, 900),
  beardComb: pexels(15694772, 900),
  razorComb: pexels(9456811, 900),
  barberKit: pexels(36305681, 900),
};

const NAME = L("مكتب باربر", "Maktab Barber");

const header = lib("header-brand-bar", {
  text: {
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "ابحث في المتجر": L("ابحث عن زيت دقن، موس، طقم…", "Search beard oil, razors, kits…"),
  },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("شيك كل يوم", "Sharp, every day"),
    "كلمنا على واتساب": L("احجز على واتساب", "Book on WhatsApp"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ مكتب باربر. كل الحقوق محفوظة.", "© 2026 Maktab Barber. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.shopHero],
    text: {
      "كوليكشن الموسم": L("محل وكرسي", "Shop and chair"),
      "صوت أنقى، كل يوم": L("عدة العناية في البيت، والكرسي لما تحتاجه", "Grooming kit at home, the chair when you need it"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L("الباربرز بتوعنا بيخلطوا الزيوت اللي بيستخدموها كل يوم.", "Our barbers blend the oils they use every day."),
      "تسوق الآن": L("تسوق العناية", "Shop grooming"),
      "العروض": L("احجز حلاقة", "Book a cut"),
      "صورة الحملة": L("كراسي حلاقة جلد في المحل", "Leather barber chairs in the shop"),
    },
    links: { "/products": [SHOP, "/contact"] },
  }),
  lib("service-price-menu", {
    text: {
      "أسعار الخدمات": L("على الكرسي", "In the chair"),
      "الأسعار شاملة قطع الغيار الأصلية والضمان.": L("الأسعار شاملة الغسيل والتصفيف، ومن غير بقشيش.", "Prices include wash and styling, no tips expected."),
      "الموبايل": L("الشعر", "Hair"),
      "تغيير بطارية": L("قص", "Cut"),
      "٦٥٠ ج.م": L("٢٥٠ ج.م", "EGP 250"),
      "تغيير شاشة": L("قص وغسيل", "Cut and wash"),
      "٢٤٠٠ ج.م": L("٣٢٠ ج.م", "EGP 320"),
      "سوكت الشحن": L("قص أطفال", "Kids' cut"),
      "٤٥٠ ج.م": L("١٨٠ ج.م", "EGP 180"),
      "الشاشات والبيت": L("الدقن", "Beard"),
      "تركيب حائط": L("تهذيب", "Trim"),
      "٣٥٠ ج.م": L("١٥٠ ج.م", "EGP 150"),
      "ضبط رسيفر": L("حلاقة بالفوطة السخنة", "Hot towel shave"),
      "١٥٠ ج.م": L("٢٢٠ ج.م", "EGP 220"),
      "السماعات": L("الباكدجات", "Packages"),
      "تغيير وسايد": L("قص ودقن", "Cut and beard"),
      "١٢٠ ج.م": L("٣٥٠ ج.م", "EGP 350"),
      "تنظيف وفحص": L("باكدج العريس", "Groom's package"),
      "٨٠ ج.م": L("٩٥٠ ج.م", "EGP 950"),
    },
  }),
  lib("service-booking", {
    text: {
      "احجز معاد الفني": L("احجز كرسيك", "Book your chair"),
      "تركيب شاشة · حوالي ساعة": L("حلاقة في مكتب، الدقي · ٤٠ دقيقة", "Cut at Maktab, Dokki · 40 minutes"),
      "مواعيد الزيارات": L("المواعيد", "Time slots"),
      "١٠ ص": L("١٢ الضهر", "12 pm"),
      "١٢ الضهر": L("٢ م", "2 pm"),
      "٢ م": L("٤ م", "4 pm"),
      "٤ م": L("٦ م", "6 pm"),
      "٦ م": L("٨ م", "8 pm"),
      "٨ م": L("١٠ م", "10 pm"),
      "من السبت للخميس": L("كل يوم ما عدا الجمعة الصبح", "Every day except Friday morning"),
    },
  }),
  lib("bundle-poster", {
    text: {
      "طقم المشاوير": L("طقم هدية", "Gift kit"),
      "كل اللي تحتاجه في الطريق": L("كل اللي يلزم لدقن شيك", "Everything for a sharp beard"),
      "١٬٢٧٠ ج.م": L("٦٥٥ ج.م", "EGP 655"),
      "بدل ١٬٤٩٠ ج.م": L("بدل ٧٧٠ ج.م", "Instead of EGP 770"),
      "اشتري الطقم": L("خد الطقم", "Get the kit"),
    },
  }),
  lib("team-grid", {
    text: {
      "الفريق": L("الباربرز", "Barbers"),
      "الناس اللي ورا المحل": L("مين بيقص", "Who is cutting"),
      "م": L("ح", "H"),
      "منى عادل": L("حمادة", "Hamada"),
      "المؤسسة": L("كبير الباربرز", "Head barber"),
      "ك": L("ش", "S"),
      "كريم سامي": L("شريف", "Sherif"),
      "المشتريات": L("الفيد", "Fades"),
      "ي": L("م", "M"),
      "ياسمين فؤاد": L("ميدو", "Mido"),
      "خدمة العملاء": L("الدقون", "Beards"),
      "ع": L("ع", "A"),
      "عمر حسن": L("علي", "Aly"),
      "التوصيل": L("الحلاقة بالموس", "Straight razor"),
    },
  }),
  lib("testimonials-chat", {
    text: {
      "من الواتساب": L("الآراء", "Reviews"),
      "رسايل بتفرّحنا": L("الزباين", "Regulars"),
      "مريم أ.": L("أحمد س.", "Ahmed S."),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "زيت السيدار خلّى الدقن طرية من أول أسبوع، وريحته مش تقيلة.",
        "The cedar oil softened my beard in the first week, and the scent is not heavy.",
      ),
      "ده يسعدنا جدًا، شكرًا ليكي!": L("ده يسعدنا يا باشا، مستنينك الخميس!", "Glad to hear it, see you Thursday!"),
      "عمر ك.": L("كريم م.", "Karim M."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("حجزت أونلاين ودخلت الكرسي في معادي بالظبط.", "Booked online and was in the chair right on time."),
      "يوسف م.": L("مصطفى ع.", "Mostafa A."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("الطقم كان هدية لأخويا وعجبه جداً.", "The kit was a gift for my brother and he loved it."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن مكتب", "About Maktab"), L("محل حلاقة في الدقي، وعدته في بيتك.", "A barbershop in Dokki, with its kit at your home.")),
  aboutStory(lib, {
    photo: PHOTOS.shopAbout,
    alt: L("كرسي حلاقة جنب حيطة طوب ونباتات", "A barber chair beside a brick wall and plants"),
    eyebrow: L("الدقي", "Dokki"),
    title: L("من الكرسي للرف", "From the chair to the shelf"),
    text: L("فتحنا المحل سنة ٢٠١٥، والزباين فضلوا يسألوا عن الزيت اللي بنحطه. فبقينا نعبيه.", "We opened in 2015, and customers kept asking about the oil we used. So we started bottling it."),
    more: L("وكل منتج بيتجرب على الكرسي الأول قبل ما يتباع.", "And every product is tested in the chair before it is sold."),
    button: L("تسوق العناية", "Shop grooming"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("زيت دقن، أطقم حلاقة، وكرسي لما تحتاجه.", "Beard oil, shaving kits and a chair when you need it."),
  categories: [
    ["beard", "الدقن", "Beard", PHOTOS.cedarOil],
    ["shave", "الحلاقة", "Shave", PHOTOS.safetyRazor],
    ["kits", "أطقم", "Kits", PHOTOS.barberKit],
  ],
  products: [
    ["cedar-beard-oil", "beard", "زيت دقن سيدار", "Cedar Beard Oil", PHOTOS.cedarOil, 320, { isFeatured: true, rating: 4.8, sold90: 240 }],
    ["beard-balm", "beard", "بلسم دقن", "Beard Balm", PHOTOS.beardBalm, 260, { compareAtPrice: 310, sold90: 88 }],
    ["shaving-soap", "shave", "صابون حلاقة", "Shaving Soap", PHOTOS.shavingSoap, 190, { rating: 4.7, sold90: 130 }],
    ["barber-kit", "kits", "طقم الباربر", "Barber Kit", PHOTOS.barberKit, 1150, { isFeatured: true, rating: 4.9, sold90: 60 }],
    ["sandalwood-beard-oil", "beard", "زيت دقن صندل", "Sandalwood Beard Oil", PHOTOS.sandalOil, 340, { sold90: 72 }],
    ["safety-razor", "shave", "موس أمان", "Safety Razor", PHOTOS.safetyRazor, 450, { sold90: 54 }],
    ["shaving-brush-stand", "kits", "فرشاة حلاقة وستاند", "Shaving Brush & Stand", PHOTOS.brushStand, 690, { compareAtPrice: 820, sold90: 30 }],
    ["cooling-aftershave", "shave", "أفترشيف منعش", "Cooling Aftershave", PHOTOS.aftershave, 280, { sold90: 66 }],
    ["wooden-beard-comb", "beard", "مشط دقن خشب", "Wooden Beard Comb", PHOTOS.beardComb, 120, { sold90: 110 }],
    ["straight-razor-comb", "shave", "موس حلاقة ومشط", "Straight Razor & Comb", PHOTOS.razorComb, 520, { sold90: 22 }],
  ],
});

export const BARBER = libraryTemplate({
  key: BARBER_KEY,
  version: 2,
  changelog: "Barber v2: product page",
  productPage: { surface: "flat", thumbs: "bottom", headingCase: "upper", band: "brand", copy: { back: L("رجوع للمحل", "Back to the shop"), reviews: L("رأي زباين الكرسي", "From the chair"), related: L("كمّل العدّة", "Complete the kit") } },
  name: L("باربر", "Barber"),
  description: L(
    "عناية رجالي: أسعار الكرسي، احجز معاد، طقم الدقن، الباربرز وآراء الزباين. أربع صفحات جاهزة.",
    "Men's grooming: chair prices, booking, the beard kit, the barbers and regulars' reviews. Four ready pages.",
  ),
  category: "beauty",
  sortOrder: 640,
  palette: ["#f2f0eb", "#e2ddd3", "#c9a227", "#1f3d36"],
  colors: {
    primary: "#1f3d36",
    secondary: "#e2ddd3",
    background: "#f2f0eb",
    foreground: "#151515",
    muted: "#57534c",
    border: "#d2cbbd",
    accent: "#c9a227",
  },
  fonts: { heading: "Changa", body: "Cairo" },
  radius: 4,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن مكتب", "About"), seo: { title: L("عن مكتب", "About Maktab") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل واحجز", "Contact and book"),
        text: L("١٢ شارع مصدق، الدقي، الجيزة.", "12 Mosadak St, Dokki, Giza."),
        heading: L("اسأل أو احجز معاد", "Ask or book a time"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الحجز والمنتجات والتوصيل.", "Booking, products and delivery."),
        question: L("لازم أحجز قبلها؟", "Do I need to book ahead?"),
        answer: L("مش لازم، بس الحجز بيضمنلك الكرسي في المعاد. الخميس والجمعة بيبقوا زحمة.", "Not always, but booking guarantees your chair on time. Thursday and Friday get busy."),
      }),
    },
  ],
  demo: DEMO,
});
