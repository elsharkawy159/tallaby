/**
 * Ahlam (template 90, kids' room decor; Claude Design "Storefront
 * Templates"): soft off-white paper, a terracotta for actions and a warm
 * sand highlight, Tajawal throughout and round 18px corners. A kids' room
 * studio that designs, delivers and sets up: a room they will grow into,
 * book a design visit, pay over 12 months, most chosen, delivery days and
 * questions. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): a bunk bed room, a
 * white cot, a nursery with a wooden cot, a play corner with a canopy, a
 * toy train table, a knit throw on a bed, cushions with a throw, wicker
 * baskets, a wooden village and fairy lights. The design's photo of
 * children playing was replaced. No people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const AHLAM_KEY = "ahlam";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(AHLAM_KEY, getDesign(id)!, { corners: 18, ...patch });

const SHOP = "/products";
const BEDS = `/products?search=${encodeURIComponent("سرير")}`;

const PHOTOS = {
  bunkRoom: pexels(4221413, 900),
  bunkRoomWide: pexels(4221413),
  whiteCot: pexels(37185810, 900),
  nursery: pexels(3958952, 900),
  playCorner: pexels(7055872),
  playCornerSmall: pexels(7055872, 900),
  trainTable: pexels(19734990, 900),
  knitThrow: pexels(4577654, 900),
  cushions: pexels(6633533, 900),
  baskets: pexels(21550127, 900),
  village: pexels(28539322, 900),
  lights: pexels(30427077, 900),
};

const NAME = L("أوض أحلام", "Ahlam Kids Rooms");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("تصميم الأوضة ببلاش مع أي سرير · قسّط على ١٢ شهر", "Free room design with any bed · Pay over 12 months"),
    "الكود: SAVE10": L("توصيل ببلاش فوق ٢٬٠٠٠ ج.م", "Free delivery over EGP 2,000"),
    "م": L("أ", "A"),
    "اسم متجرك": NAME,
    "العروض": L("السراير", "Beds"),
    "المدونة": L("احجز زيارة", "Book a visit"),
  },
  links: { "/products": [SHOP, BEDS, undefined, SHOP, BEDS], "/blog": "/contact" },
});

const footer = lib("footer-centered", {
  text: {
    "م": L("أ", "A"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.": L("أوض أطفال متصممة ومتوصلة ومتركبة، في القاهرة والجيزة.", "Kids’ rooms designed, delivered and set up across Cairo and Giza."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ أوض أحلام. كل الحقوق محفوظة.", "© 2026 Ahlam Kids Rooms. All rights reserved."),
  },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.playCorner],
    text: {
      "كوليكشن الموسم": L("تصميم الأوضة", "Room design"),
      "صوت أنقى، كل يوم": L("أوضة يكبروا فيها", "A room they will grow into"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "سراير وتخزين ومنسوجات متخططة مع بعض. التصميم ببلاش مع أي سرير.",
        "Beds, storage and textiles planned together. Free design with any bed.",
      ),
      "تسوق الآن": L("احجز زيارة تصميم", "Book a design visit"),
      "العروض": L("تسوق السراير", "Shop beds"),
      "صورة الحملة": L("ركن لعب فيه خيمة وترابيزة صغيرة", "A play corner with a canopy and a small table"),
    },
    links: { "/products": ["/contact", BEDS] },
  }),
  lib("service-booking", {
    text: {
      "احجز معاد الفني": L("احجز زيارة تصميم", "Book a design visit"),
      "تركيب شاشة · حوالي ساعة": L("تصميم أوضة الأطفال في البيت · حوالي ساعة", "Kids’ room design at home · about an hour"),
    },
  }),
  lib("pay-installments", {
    text: {
      "١٢": L("٩", "9"),
      "٢٤": L("١٢", "12"),
      "٢٤ شهر": L("١٢ شهر", "12 months"),
      "من غير فوايد ولا مقدم مع شركات التقسيط.": L("على السرير والأوضة كلها، من غير فوايد ولا مقدم.", "On the bed or the whole room, with no interest and no down payment."),
    },
  }),
  lib("products-feature", {
    text: { "اختيارنا ليك": L("الأكتر اختياراً", "Most chosen"), "اختيار الأسبوع": L("الأكثر مبيعاً", "Best seller") },
  }),
  lib("pay-days", {
    text: {
      "هيوصلك إمتى؟": L("هيوصل ويتركب إمتى؟", "When will it arrive and be set up?"),
      "١": L("٣", "3"),
      "يوم": L("أسابيع", "weeks"),
      "القاهرة، الجيزة": L("الأوض بالمقاس", "Made-to-measure rooms"),
      "٢–٣": L("٧", "7"),
      "الإسكندرية، الدلتا، مدن القناة": L("السراير والدواليب الجاهزة", "Ready-made beds and wardrobes"),
      "٤–٦": L("٣", "3"),
      "الصعيد، البحر الأحمر، سيناء": L("التركيب في البيت بعد التوصيل", "Assembly at home after delivery"),
    },
  }),
  lib("faq-columns", {
    as: "faq-home",
    text: {
      "أسئلة شائعة": L("أسئلة", "Questions"),
      "كيف أعرف أن طلبي وصل إليكم؟": L("زيارة التصميم ببلاش؟", "Is the design visit free?"),
      "ستظهر لك صفحة تأكيد وتصلك رسالة، ونتصل بك لتأكيد طلبات الدفع عند الاستلام.": L(
        "أيوه مع أي سرير، ومن غير سرير بـ٥٠٠ ج.م بتتخصم لو طلبت بعدين.",
        "Yes with any bed; without one it is EGP 500, taken off if you order later.",
      ),
      "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("بتيجوا تقيسوا الأوضة؟", "Do you measure the room?"),
      "نعم، حتى يتم شحنه. تواصل معنا بأسرع وقت.": L("أيوه، المصممة بتقيس وبتبعتلك التصميم في ٣ أيام.", "Yes, the designer measures and sends the plan within 3 days."),
      "كم يستغرق التوصيل؟": L("التركيب عليكم؟", "Do you assemble?"),
      "القاهرة والجيزة من يوم إلى يومين، وباقي المحافظات من ٢ إلى ٦ أيام.": L("أيوه، التركيب ببلاش في القاهرة والجيزة.", "Yes, assembly is free in Cairo and Giza."),
      "هل التوصيل متاح لكل المحافظات؟": L("الخشب آمن للأطفال؟", "Is the wood safe for children?"),
      "نعم، نوصل لكل محافظات مصر.": L("كل الدهانات مائية ومن غير رصاص.", "All paints are water-based and lead-free."),
      "ما طرق الدفع المتاحة؟": L("ينفع أقسّط؟", "Can I pay in instalments?"),
      "الدفع عند الاستلام، والبطاقات، والمحافظ الإلكترونية، وإنستاباي.": L("أيوه لحد ١٢ شهر من غير فوايد.", "Yes, up to 12 months with no interest."),
      "ما سياسة الاسترجاع؟": L("السرير بيكبر مع الطفل؟", "Does the bed grow with the child?"),
      "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": L("سراير الأطفال بتتحول لسرير عادي لحد ١٢ سنة.", "Our kids’ beds convert to a standard bed up to age 12."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن أوض أحلام", "About Ahlam"), L("ستوديو أوض أطفال في الشيخ زايد.", "A kids’ room studio in Sheikh Zayed.")),
  aboutStory(lib, {
    photo: PHOTOS.bunkRoomWide,
    alt: L("أوضة أطفال فيها سرير دورين وسجادة مقلمة", "A kids’ room with a bunk bed and a striped rug"),
    eyebrow: L("الشيخ زايد", "Sheikh Zayed"),
    title: L("أوضة واحدة، سنين كتير", "One room, many years"),
    text: L("بنصمم أوضة الطفل كلها مرة واحدة: السرير والتخزين والمنسوجات، عشان تكبر معاه.", "We design the whole room at once, bed, storage and textiles, so it grows with your child."),
    more: L("وبنوصل ونركّب بنفسنا، وتقدر تقسّط على ١٢ شهر.", "We deliver and assemble ourselves, and you can pay over 12 months."),
    button: L("تسوق السراير", "Shop beds"),
    href: BEDS,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أوض أطفال متصممة ومتوصلة ومتركبة.", "Kids’ rooms designed, delivered and set up."),
  categories: [
    ["beds", "سراير", "Beds", PHOTOS.bunkRoom],
    ["play", "لعب", "Play", PHOTOS.playCornerSmall],
    ["textiles", "منسوجات", "Textiles", PHOTOS.knitThrow],
    ["decor", "تخزين وديكور", "Storage & decor", PHOTOS.baskets],
  ],
  products: [
    ["pine-bunk-bed", "beds", "سرير دورين خشب", "Pine Bunk Bed", PHOTOS.bunkRoom, 14500, { isFeatured: true, rating: 4.8, sold90: 44 }],
    ["white-cot-bed", "beds", "سرير بيبي أبيض يتحول", "White Convertible Cot Bed", PHOTOS.whiteCot, 7800, { sold90: 30 }],
    ["walnut-cot", "beds", "سرير بيبي خشب جوز", "Walnut Cot", PHOTOS.nursery, 9800, { compareAtPrice: 11200, sold90: 18 }],
    ["play-corner-set", "play", "طقم ركن اللعب بالخيمة", "Play Corner Set with Canopy", PHOTOS.playCornerSmall, 4200, { isFeatured: true, sold90: 26 }],
    ["train-table", "play", "ترابيزة قطر خشب", "Wooden Train Table", PHOTOS.trainTable, 3600, { rating: 4.9, sold90: 22 }],
    ["knit-throw", "textiles", "بطانية تريكو", "Knit Throw", PHOTOS.knitThrow, 890, { sold90: 30 }],
    ["cushion-pair", "textiles", "مخدتين وشال", "Cushion Pair & Throw", PHOTOS.cushions, 650, { compareAtPrice: 760, sold90: 22 }],
    ["wicker-baskets", "decor", "سبتين خوص بالبطانة", "Lined Wicker Baskets, set of 2", PHOTOS.baskets, 540, { sold90: 48 }],
    ["wooden-village", "decor", "قرية خشب للرف", "Wooden Village Shelf Decor", PHOTOS.village, 380, { sold90: 35 }],
    ["fairy-lights", "decor", "إضاءة نجوم للحيطة", "Fairy Light String", PHOTOS.lights, 290, { inStock: false, sold90: 60 }],
  ],
});

export const AHLAM = libraryTemplate({
  key: AHLAM_KEY,
  version: 1,
  name: L("أحلام", "Ahlam"),
  description: L(
    "ديكور أوضة أطفال: احجز زيارة تصميم، قسّط على ١٢ شهر، الأكتر اختياراً ومواعيد التوصيل. أربع صفحات جاهزة.",
    "Kids’ room decor: book a design visit, pay over 12 months, most chosen and delivery days. Four ready pages.",
  ),
  category: "kids",
  sortOrder: 900,
  palette: ["#fbfaf7", "#eef2f0", "#f2cc8f", "#e07a5f"],
  colors: {
    primary: "#e07a5f",
    secondary: "#eef2f0",
    background: "#fbfaf7",
    foreground: "#1f2d2a",
    muted: "#566663",
    border: "#dde5e1",
    accent: "#f2cc8f",
  },
  fonts: { heading: "Tajawal", body: "Tajawal" },
  radius: 18,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن أوض أحلام", "About"), seo: { title: L("عن أوض أحلام", "About Ahlam Kids Rooms") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("محور ٢٦ يوليو، الشيخ زايد.", "26th of July Axis, Sheikh Zayed."),
        heading: L("احجز زيارة تصميم أو اسأل عن مقاس", "Book a design visit or ask about a size"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التصميم والتقسيط والتركيب.", "Design, instalments and assembly."),
        question: L("ينفع أرجّع حاجة بعد التركيب؟", "Can I return something after assembly?"),
        answer: L("المنسوجات والديكور خلال ١٤ يوم، والقطع بالمقاس مش بترجع.", "Textiles and decor within 14 days; made-to-measure pieces cannot be returned."),
      }),
    },
  ],
  demo: DEMO,
});
