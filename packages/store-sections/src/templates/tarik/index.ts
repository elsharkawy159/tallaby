/**
 * Tarik (template 110, car accessories; Claude Design "Storefront
 * Templates"): cool grey paper, a burnt orange for actions and an amber
 * highlight, Cairo headings over IBM Plex Sans Arabic text and 8px corners.
 * A car accessories shop: banners for care, comfort and car tech, shop by
 * area of the car, the comfort set, a tabbed shelf, share and save, and
 * reviews from inside customers' cars. Built from section library designs
 * (`fromLibrary`).
 *
 * The design's "Refer a friend" block has no library design yet: it uses
 * the reward card (`popup-reward`) with the referral copy and code. The
 * shelf's "On sale" tab shows top rated (there is no sale sort). The
 * comfort set is "cover, wheel wrap and lights" (the design's cushion has
 * no photo without a car badge; the product is a leather seat cover).
 *
 * Photos: Pexels, each checked by eye (2026-10-23): wash foam on a car
 * mirror and a window, grey car seats, a phone in a dashboard mount, a red
 * steering-wheel wrap, ambient light around a gear lever, a magnetic vent
 * mount, a striped air freshener, a seat-back organiser, microfiber towels
 * on a trolley, an action camera and an old car cabin with patterned seat
 * covers. Every design photo (five dashboards with car badges, one with a
 * person in the background, and a local mount render) was replaced. No
 * people, no hands, no car badges and no product brands.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const TARIK_KEY = "tarik";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(TARIK_KEY, getDesign(id)!, { corners: 8, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  mirrorFoam: pexels(4870737),
  greySeatsWide: pexels(8886308),
  greySeats: pexels(8886308, 900),
  dashMountWide: pexels(7738878),
  dashMount: pexels(7738878, 900),
  steeringWrap: pexels(38056693, 900),
  ambientGear: pexels(19870007, 900),
  ventMount: pexels(13536013, 900),
  stripeScent: pexels(5158247, 900),
  organizer: pexels(30563011, 900),
  towels: pexels(20051443, 900),
  camera: pexels(2294894, 900),
  windowFoam: pexels(4870739, 900),
  vintageCabin: pexels(33496776),
};

const NAME = L("طريق", "Tarik");

const header = lib("header-chips", {
  text: { "م": L("ط", "T"), "اسم متجرك": NAME, "ابحث عن منتج…": L("ابحث عن كفر، حامل، شاحن…", "Search covers, mounts, chargers…") },
});

const footer = lib("footer-ruled", {
  text: {
    "م": L("ط", "T"),
    "اسم متجرك": NAME,
    "منتجات أصلية بضمان، توصلك لحد البيت.": L("إكسسوارات لكل عربية ولكل مشوار.", "Accessories for every car and every drive."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ طريق. كل الحقوق محفوظة.", "© 2026 Tarik. All rights reserved."),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.mirrorFoam, PHOTOS.greySeatsWide, PHOTOS.dashMountWide],
    text: {
      "وصل حديثًا": L("العناية بالعربية", "Car care"),
      "الموسم الجديد وصل": L("نضافة من جوه وبره", "Clean inside and out"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("شامبو وواكس وفوط مايكروفايبر.", "Shampoo, wax and microfibre cloths."),
      "تسوّق الجديد": L("تسوق عناية", "Shop care"),
      "صورة الحملة الأولى": L("رغوة غسيل على مراية عربية", "Wash foam on a car mirror"),
      "الأكثر مبيعًا": L("الراحة", "Comfort"),
      "المفضّلة عند عملائنا": L("مشاوير طويلة وضهر مرتاح", "Long drives, a rested back"),
      "القطع اللي بترجع لها كل مرة.": L("كفرات كراسي ومخدات مناسبة لمعظم العربيات.", "Seat covers and cushions that fit most cars."),
      "شوف الأكثر مبيعًا": L("تسوق راحة", "Shop comfort"),
      "صورة الحملة الثانية": L("كراسي عربية رمادي من جوه", "Grey car seats from the inside"),
      "عروض الأسبوع": L("تكنولوجيا العربية", "Car tech"),
      "خصومات لفترة محدودة": L("اشحن واعرف طريقك وانت ماشي", "Charge and navigate on the move"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("شواحن وحوامل وكاميرات داش.", "Chargers, mounts and dash cams."),
      "تسوّق العروض": L("تسوق تكنولوجيا", "Shop car tech"),
      "صورة الحملة الثالثة": L("موبايل على حامل في التابلوه", "A phone in a dashboard mount"),
    },
    links: { "/products": [search("عناية"), search("كفر"), search("حامل")] },
  }),
  lib("categories-stories", {
    photo: [
      PHOTOS.greySeats,
      PHOTOS.steeringWrap,
      PHOTOS.ambientGear,
      PHOTOS.ventMount,
      PHOTOS.stripeScent,
      PHOTOS.organizer,
      PHOTOS.towels,
      PHOTOS.camera,
    ],
    text: {
      "الأقسام": L("تسوق بالمكان", "Shop by area"),
      "وصل حديثًا": L("الكراسي", "Seats"),
      "الأكثر مبيعًا": L("الدركسيون", "Steering"),
      "العروض": L("النور", "Lights"),
      "هدايا": L("التابلوه", "Dashboard"),
      "إكسسوارات": L("الريحة", "Scent"),
      "أساسيات": L("التنظيم", "Storage"),
      "مجموعات": L("العناية", "Care"),
      "الموسم الجديد": L("الكاميرات", "Cameras"),
    },
    links: {
      "/products": [
        SHOP,
        search("كفر"),
        search("دركسيون"),
        search("إضاءة"),
        search("حامل"),
        search("معطر"),
        search("منظم"),
        search("عناية"),
        search("كاميرا"),
      ],
    },
  }),
  lib("products-shelf", {
    text: { "تسوّق حسب مزاجك": L("المتجر", "Shop"), "عليه خصم": L("الأعلى تقييمًا", "Top rated") },
    links: { "/products": [NEW, BEST, RATED, SHOP] },
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("جوه عربياتهم", "Inside their cars"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "جت مظبوطة على عربيتي والتركيب كان ببلاش.",
        "Fits my car perfectly and the fitting was free.",
      ),
      "م": L("ش", "S"),
      "مريم أ.": L("شريف ن.", "Sherif N."),
      "القاهرة": L("القطامية", "Katameya"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("الحامل ما اتحركش ولا مرة في المطبات.", "The mount has not moved once on bad roads."),
      "ي": L("م", "M"),
      "يوسف م.": L("محمود س.", "Mahmoud S."),
      "المنصورة": L("المعادي", "Maadi"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L("منتج حلو، التوصيل أخد يومين.", "Good product, delivery took two days."),
      "ع": L("ب", "B"),
      "عمر ك.": L("باسم ع.", "Bassem O."),
      "الإسكندرية": L("الشيخ زايد", "Sheikh Zayed"),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("وصل أسيوط في ٣ أيام، والمعطر ريحته لسه حلوة بعد شهر.", "Reached Assiut in 3 days, and the scent still smells good a month later."),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("جلدة الدركسيون مريحة جدًا في الحر ومبتزحلقش.", "The wheel wrap is comfortable in the heat and never slips."),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("ساعدوني أختار الكفر المناسب لموديل عربيتي.", "They helped me pick the right cover for my car model."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن طريق", "About Tarik"), L("إكسسوارات لكل عربية ولكل مشوار.", "Accessories for every car and every drive.")),
  aboutStory(lib, {
    photo: PHOTOS.vintageCabin,
    alt: L("كابينة عربية قديمة بكفرات كراسي منقوشة", "An old car cabin with patterned seat covers"),
    eyebrow: L("لكل مشوار", "For every drive"),
    title: L("عربيتك بتستاهل", "Your car deserves it"),
    text: L("بنختار إكسسوارات بتناسب معظم العربيات: عناية وراحة وشواحن وحوامل.", "We choose accessories that fit most cars: care, comfort, chargers and mounts."),
    more: L("والتركيب ببلاش في القاهرة، والدفع عند الاستلام.", "With free fitting in Cairo and cash on delivery."),
    button: L("تسوق الإكسسوارات", "Shop accessories"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("إكسسوارات لكل عربية ولكل مشوار.", "Accessories for every car and every drive."),
  categories: [
    ["care", "عناية", "Care", PHOTOS.towels],
    ["comfort", "راحة", "Comfort", PHOTOS.greySeats],
    ["tech", "تكنولوجيا", "Car tech", PHOTOS.camera],
    ["mounts", "حوامل", "Mounts", PHOTOS.ventMount],
    ["wash", "غسيل", "Wash", PHOTOS.windowFoam],
    ["scents", "معطرات", "Air fresheners", PHOTOS.stripeScent],
    ["steering", "دركسيون", "Steering", PHOTOS.steeringWrap],
    ["lighting", "إضاءة", "Lighting", PHOTOS.ambientGear],
  ],
  products: [
    ["interior-detail-kit", "care", "طقم تنظيف داخلي", "Interior Detail Kit", PHOTOS.towels, 890, { isFeatured: true, rating: 4.7, sold90: 160 }],
    ["leather-seat-cover", "comfort", "كفر كرسي جلد", "Leather Seat Cover", PHOTOS.greySeats, 750, { sold90: 88 }],
    ["dash-camera", "tech", "كاميرا تابلوه", "Dash Camera", PHOTOS.camera, 2400, { sold90: 41 }],
    ["leather-steering-cover", "steering", "جلدة دركسيون", "Leather Steering Cover", PHOTOS.steeringWrap, 450, { compareAtPrice: 520, rating: 4.8, sold90: 205 }],
    ["ambient-light-kit", "lighting", "إضاءة داخلية", "Ambient Light Kit", PHOTOS.ambientGear, 980, { sold90: 36 }],
    ["magnetic-vent-mount", "mounts", "حامل مغناطيس للتكييف", "Magnetic Vent Mount", PHOTOS.ventMount, 690, { sold90: 122 }],
    ["dashboard-phone-mount", "mounts", "حامل موبايل للتابلوه", "Dashboard Phone Mount", PHOTOS.dashMount, 450, { sold90: 95 }],
    ["snow-foam-shampoo", "wash", "شامبو رغوة", "Snow Foam Shampoo", PHOTOS.windowFoam, 290, { compareAtPrice: 340, sold90: 140 }],
    ["seat-back-organizer", "comfort", "منظم ظهر الكرسي", "Seat-Back Organiser", PHOTOS.organizer, 520, { sold90: 64 }],
    ["striped-air-freshener", "scents", "معطر مخطط", "Striped Air Freshener", PHOTOS.stripeScent, 120, { inStock: false, sold90: 240 }],
  ],
});

export const TARIK = libraryTemplate({
  key: TARIK_KEY,
  version: 2,
  changelog: "Tarik v2: product page",
  productPage: { thumbs: "side", band: "paper", extras: ["product-perks"], copy: { reviews: L("من جوّا عربياتهم", "From inside their cars"), related: L("إكسسوارات تكمّل العربية", "More for your car") } },
  name: L("طريق", "Tarik"),
  description: L(
    "إكسسوارات العربيات: بانرات متحركة، تسوق بالمكان وآراء العملاء. أربع صفحات جاهزة.",
    "Car accessories: banner carousel, shop by area and reviews. Four ready pages.",
  ),
  category: "auto",
  sortOrder: 1100,
  palette: ["#f3f4f5", "#e3e6e9", "#fbbf24", "#c2410c"],
  colors: {
    primary: "#c2410c",
    secondary: "#e3e6e9",
    background: "#f3f4f5",
    foreground: "#15191d",
    muted: "#5a6168",
    border: "#cfd4d9",
    accent: "#fbbf24",
  },
  fonts: { heading: "Cairo", body: "IBM Plex Sans Arabic" },
  radius: 8,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن طريق", "About"), seo: { title: L("عن طريق", "About Tarik") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("tarik@tarik.eg، التركيب ببلاش في القاهرة.", "tarik@tarik.eg, free fitting in Cairo."),
        heading: L("ابعت موديل العربية وسنتها", "Send your car’s model and year"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والتركيب والتوصيل.", "Fit, fitting and delivery."),
        question: L("هيناسب عربيتي؟", "Will it fit my car?"),
        answer: L("ابعتلنا الموديل والسنة، وبنأكدلك المقاس قبل ما تطلب.", "Send us the model and year and we confirm the fit before you order."),
      }),
    },
  ],
  demo: DEMO,
});
