/**
 * Pitstop (template 47, mobile car care and fitting; Claude Design
 * "Storefront Templates"): cool paper, a service blue for actions and an
 * amber highlight, Cairo throughout and 8px corners. A wash team that comes
 * to you: services at your door, book a wash, service prices, a care kit
 * between visits, coverage areas and help before you book. Built from
 * section library designs (`fromLibrary`).
 *
 * Services are booked over WhatsApp; they are not products in the cart.
 * The coverage table has five rows where the design lists three (two more
 * Cairo areas), because rows two and three of the library table share
 * their copy.
 *
 * Photos: Pexels, each checked by eye (2026-10-23): wash foam on a mirror
 * and a window, microfiber towels on a wash trolley, grey seats, a red
 * steering-wheel wrap, ambient light around a console, a phone mount on
 * the dashboard, a magnetic vent mount, wash foam on a door and a seat-back
 * organiser. The design's car interiors (all with steering-wheel badges)
 * and its local product render were replaced. No people, no hands, no car
 * badges and no product brands.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const PITSTOP_KEY = "pitstop";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(PITSTOP_KEY, getDesign(id)!, { corners: 8, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  mirrorFoam: pexels(4870737),
  windowFoam: pexels(4870739, 900),
  towels: pexels(20051443, 900),
  towelsWide: pexels(20051443),
  greySeats: pexels(8886308, 900),
  steeringWrap: pexels(38056693, 900),
  ambientConsole: pexels(12369534, 900),
  dashMount: pexels(7738878, 900),
  ventMount: pexels(13536013, 900),
  doorFoam: pexels(4870724, 900),
  organizer: pexels(30563011, 900),
};

const NAME = L("بيت ستوب كير", "Pitstop Care");

const header = lib("header-brand-bar", {
  text: { "م": L("ب", "P"), "اسم متجرك": NAME, "ابحث في المتجر": L("ابحث عن إكسسوار", "Search accessories") },
});

const footer = lib("footer-help", {
  text: {
    "تتبع طلبك": L("احجز خدمة", "Book a service"),
    "برقم الطلب": L("غسيل أو تلميع أو تركيب", "Wash, detail or fitting"),
    "م": L("ب", "P"),
    "اسم متجرك": NAME,
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ بيت ستوب كير. كل الحقوق محفوظة.", "© 2026 Pitstop Care. All rights reserved."),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.mirrorFoam],
    text: {
      "كوليكشن الموسم": L("عناية متنقلة", "Mobile car care"),
      "صوت أنقى، كل يوم": L("عربيتك تتنضف مكان ما ركنتها", "Your car, cleaned where you parked it"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "غسيل وتلميع وتركيب إكسسوارات في البيت أو الشغل. موفر للمية، ومواعيد كل ساعتين.",
        "Wash, detailing and accessory fitting at home or work. Water-saving, two-hour slots.",
      ),
      "تسوق الآن": L("احجز غسيل", "Book a wash"),
      "العروض": L("تسوق الإكسسوارات", "Shop accessories"),
      "صورة الحملة": L("رغوة غسيل على مراية عربية", "Wash foam on a car mirror"),
    },
    links: { "/products": ["/contact", undefined] },
  }),
  lib("service-cards", {
    text: {
      "خدمات بعد البيع": L("بنعمل إيه على بابك", "What we do at your door"),
      "عشان جهازك يفضل شغال زي الجديد.": L("في البيت أو الشغل، بنفس السعر.", "At home or at work, for the same price."),
      "تركيب في البيت": L("غسيل خارجي", "Exterior wash"),
      "نركّب الشاشة أو الرسيفر ونظبط القنوات.": L("غسيل من غير مية وتلميع كاوتش في ٤٠ دقيقة.", "Waterless wash and tyre shine in 40 minutes."),
      "صيانة وإصلاح": L("تنظيف كامل", "Full detail"),
      "تغيير بطارية أو شاشة في نفس اليوم.": L("جوه وبره، والكراسي بالشامبو.", "Inside and out, seats shampooed."),
      "من ١٥٠ ج.م": L("من ٩٥٠ ج.م", "From EGP 950"),
      "استبدل القديم": L("سيراميك", "Ceramic coating"),
      "جيب جهازك القديم وخد خصم على الجديد.": L("حماية للدهان سنتين.", "Two-year protection for the paint."),
      "مجانًا": L("من ٤٥٠٠ ج.م", "From EGP 4,500"),
      "مد الضمان": L("تركيب إكسسوارات", "Accessory fitting"),
      "سنة أو سنتين زيادة على ضمان الوكيل.": L("تركيب مجاني لأي حاجة تشتريها مننا.", "Free fitting for anything you buy from us."),
      "من ١٩٩ ج.م": L("مجاناً", "Free"),
    },
  }),
  lib("service-booking", {
    text: {
      "احجز معاد الفني": L("احجز غسيل", "Book a wash"),
      "تركيب شاشة · حوالي ساعة": L("غسيل خارجي على عنوانك · حوالي ٤٠ دقيقة", "Exterior wash at your address · about 40 minutes"),
      "مواعيد الزيارات": L("المواعيد المتاحة", "Available times"),
      "١٠ ص": L("٨ ص", "8 am"),
      "١٢ الضهر": L("١٠ ص", "10 am"),
      "٢ م": L("١٢ الضهر", "12 pm"),
      "٤ م": L("٢ م", "2 pm"),
      "٦ م": L("٤ م", "4 pm"),
      "٨ م": L("٦ م", "6 pm"),
      "من السبت للخميس": L("كل يوم، والتأكيد على واتساب", "Every day, confirmed on WhatsApp"),
    },
  }),
  lib("service-price-menu", {
    text: {
      "الأسعار شاملة قطع الغيار الأصلية والضمان.": L(
        "نفس السعر في البيت أو الشغل. للملاكي؛ الـSUV زيادة ٢٠٪.",
        "Same price at home or at work. Sedans; SUVs add 20%.",
      ),
      "الموبايل": L("التلميع", "Detailing"),
      "تغيير بطارية": L("تنظيف كامل", "Full detail"),
      "٦٥٠ ج.م": L("٩٥٠ ج.م", "EGP 950"),
      "تغيير شاشة": L("شامبو كراسي", "Seat shampoo"),
      "٢٤٠٠ ج.م": L("٦٠٠ ج.م", "EGP 600"),
      "سوكت الشحن": L("تلميع فوانيس", "Headlight restore"),
      "٤٥٠ ج.م": L("٣٥٠ ج.م", "EGP 350"),
      "الشاشات والبيت": L("الغسيل", "Wash"),
      "تركيب حائط": L("غسيل خارجي", "Exterior wash"),
      "٣٥٠ ج.م": L("٢٥٠ ج.م", "EGP 250"),
      "ضبط رسيفر": L("غسيل وشفط", "Wash and vacuum"),
      "١٥٠ ج.م": L("٤٠٠ ج.م", "EGP 400"),
      "السماعات": L("الحماية", "Protection"),
      "تغيير وسايد": L("سيراميك", "Ceramic coating"),
      "١٢٠ ج.م": L("٤٥٠٠ ج.م", "EGP 4,500"),
      "تنظيف وفحص": L("واكس", "Wax"),
      "٨٠ ج.م": L("٥٠٠ ج.م", "EGP 500"),
    },
  }),
  lib("finder-pick", {
    text: {
      "لو هتشتري واحدة بس": L("خليها نضيفة بين الزيارات", "Keep it clean between visits"),
      "أحسن عزل ضوضاء في الفئة": L("كل اللي يلزم للتابلوه والكراسي", "Everything for the dash and seats"),
      "بطارية ٣٠ ساعة": L("بيتشال في باب العربية", "Fits in the door pocket"),
      "ضمان سنتين": L("الريفيل بيتباع لوحده", "Refills sold separately"),
      "أوفر اختيار": L("تحسين سريع", "Quick upgrade"),
      "الأفخم": L("الأكتر مبيعاً", "Most sold"),
    },
  }),
  lib("pay-zones", {
    text: {
      "التوصيل": L("التغطية", "Coverage"),
      "بنوصل لكل مصر": L("بنيجي لحد فين", "Where we come to you"),
      "المدة والمصاريف حسب محافظتك.": L("معاد الزيارة ومصاريفها حسب منطقتك.", "Visit day and call-out fee by area."),
      "المدة": L("المعاد", "When"),
      "الشحن": L("الزيارة", "Call-out"),
      "القاهرة والجيزة": L("التجمع والقطامية والرحاب", "New Cairo, Katameya, Rehab"),
      "١–٢ يوم": L("نفس اليوم", "Same day"),
      "٥٠ ج.م": L("مجاناً", "Free"),
      "الإسكندرية والدلتا": L("المعادي ومدينة نصر ومصر الجديدة", "Maadi, Nasr City, Heliopolis"),
      "٢–٣ أيام": L("تاني يوم", "Next day"),
      "٦٥ ج.م": L("٥٠ ج.م", "EGP 50"),
      "مدن القناة": L("الزمالك ووسط البلد", "Zamalek, Downtown"),
      "الصعيد": L("الشروق والعبور", "El Shorouk, El Obour"),
      "٣–٥ أيام": L("يومين", "Two days"),
      "٨٠ ج.م": L("٧٥ ج.م", "EGP 75"),
      "البحر الأحمر وسيناء": L("الشيخ زايد وأكتوبر", "Sheikh Zayed, October"),
      "٤–٦ أيام": L("الويك إند", "Weekends"),
      "٩٥ ج.م": L("١٠٠ ج.م", "EGP 100"),
    },
  }),
  lib("service-support", {
    text: {
      "محتاج مساعدة؟": L("عندك سؤال قبل الحجز؟", "Questions before you book?"),
      "من ١٠ ص لـ ١٠ م": L("من ٨ ص لـ ٨ م", "8 am – 8 pm"),
      "زور فرع": L("زورنا", "Visit us"),
      "٣ فروع في القاهرة": L("القطامية، الطريق الدائري", "Katameya, Ring Road"),
      "من غير معاد": L("بميعاد", "By appointment"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن بيت ستوب كير", "About Pitstop Care"), L("فريق عناية عربيات متنقل من القطامية.", "A mobile car care team from Katameya.")),
  aboutStory(lib, {
    photo: PHOTOS.towelsWide,
    alt: L("فوط مايكروفايبر ملونة على ترولي الغسيل", "Colourful microfiber towels on a wash trolley"),
    eyebrow: L("بنيجي لحد عندك", "We come to you"),
    title: L("الجراج بيجيلك", "The garage comes to you"),
    text: L("فريق غسيل وتلميع بيجيلك البيت أو الشغل، بمية قليلة وفوط نضيفة لكل عربية.", "A wash and detailing team comes to your home or work, with little water and clean towels for every car."),
    more: L("وأي إكسسوار تشتريه من المتجر بنركبهولك ببلاش في نفس الزيارة.", "And any accessory you buy from the shop is fitted free on the same visit."),
    button: L("تسوق الإكسسوارات", "Shop accessories"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("غسيل وتلميع وتركيب على باب بيتك.", "Car wash, detailing and fitting at your door."),
  categories: [
    ["care", "عناية وتنظيف", "Care & cleaning", PHOTOS.towels],
    ["comfort", "راحة", "Comfort", PHOTOS.steeringWrap],
    ["tech", "تكنولوجيا العربية", "Car tech", PHOTOS.ambientConsole],
  ],
  products: [
    ["interior-detail-kit", "care", "طقم تنظيف داخلي", "Interior Detail Kit", PHOTOS.towels, 890, { isFeatured: true, rating: 4.7, sold90: 160 }],
    ["grey-seat-covers", "comfort", "كسوة كراسي رمادي", "Grey Seat Covers", PHOTOS.greySeats, 1450, { sold90: 88 }],
    ["dashboard-phone-mount", "tech", "حامل موبايل للتابلوه", "Dashboard Phone Mount", PHOTOS.dashMount, 450, { sold90: 41 }],
    ["steering-wheel-cover", "comfort", "جلدة دركسيون", "Steering Wheel Cover", PHOTOS.steeringWrap, 450, { compareAtPrice: 520, sold90: 205 }],
    ["ambient-light-kit", "tech", "طقم إضاءة داخلية", "Ambient Light Kit", PHOTOS.ambientConsole, 980, { sold90: 36 }],
    ["magnetic-vent-mount", "tech", "حامل مغناطيس للتكييف", "Magnetic Vent Mount", PHOTOS.ventMount, 690, { sold90: 122 }],
    ["wax-car-shampoo", "care", "شامبو عربيات بالشمع", "Wax Car Shampoo", PHOTOS.doorFoam, 290, { rating: 4.8, sold90: 96 }],
    ["snow-foam-wash", "care", "رغوة غسيل سنو فوم", "Snow Foam Wash", PHOTOS.windowFoam, 380, { sold90: 150 }],
    ["seat-back-organizer", "comfort", "منظم ظهر الكرسي", "Seat-Back Organiser", PHOTOS.organizer, 520, { inStock: false, sold90: 30 }],
  ],
});

export const PITSTOP = libraryTemplate({
  key: PITSTOP_KEY,
  version: 2,
  changelog: "Pitstop v2: product page",
  productPage: { surface: "card", thumbs: "bottom", band: "brand", extras: ["product-shipping"], copy: { back: L("رجوع لمستلزمات العربية", "Back to car care"), reviews: L("رأي اللي جرّبوا الغسيل", "What drivers say"), related: L("خليها لامعة بين الزيارات", "Keep it clean between visits") } },
  name: L("بيت ستوب", "Pitstop"),
  description: L(
    "عناية عربيات متنقلة: الخدمات، حجز غسيل، الأسعار، طقم بين الزيارات، مناطق التغطية والدعم. أربع صفحات جاهزة.",
    "Mobile car care: services, book a wash, prices, a kit between visits, coverage areas and support. Four ready pages.",
  ),
  category: "auto",
  sortOrder: 470,
  palette: ["#f3f5f7", "#e1e7ec", "#ffb000", "#0a4d8c"],
  colors: {
    primary: "#0a4d8c",
    secondary: "#e1e7ec",
    background: "#f3f5f7",
    foreground: "#0d1b2a",
    muted: "#4f5d6b",
    border: "#d2dae2",
    accent: "#ffb000",
  },
  fonts: { heading: "Cairo", body: "Cairo" },
  radius: 8,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن بيت ستوب", "About"), seo: { title: L("عن بيت ستوب كير", "About Pitstop Care") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("احجز خدمة", "Book a service"),
        text: L("الطريق الدائري، القطامية. بنأكد كل حجز على واتساب.", "Ring Road, Katameya. Every booking is confirmed on WhatsApp."),
        heading: L("احجز غسيل أو اسأل عن تركيب", "Book a wash or ask about fitting"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الحجز والمية والتركيب.", "Booking, water and fitting."),
        question: L("محتاجين مية أو كهربا؟", "Do you need water or power?"),
        answer: L("لأ، الغسيل من غير مية ومعانا كل حاجة. محتاجين بس مكان العربية.", "No, the wash is waterless and we bring everything. We only need the car’s spot."),
      }),
    },
  ],
  demo: DEMO,
});
