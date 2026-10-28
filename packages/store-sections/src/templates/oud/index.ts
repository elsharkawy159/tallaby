/**
 * Oud (template 62, perfume house; Claude Design "Storefront Templates"):
 * warm parchment paper, a deep oud brown for actions and an antique gold
 * highlight, Aref Ruqaa headings over Noto Kufi Arabic and sharp 2px
 * corners. Three generations of perfumers in Khan El Khalili: a split-screen
 * welcome, the house favourites as a numbered list, the family story, gifts
 * by person, a perfume gift card and the two shops. Built from section
 * library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): unlabelled perfume
 * bottles, a tiny bottle with a shell, brass incense burners and resin. No
 * people, no hands and no perfume brand names.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const OUD_KEY = "oud";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(OUD_KEY, getDesign(id)!, { corners: 2, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  royalOud: pexels(4735929, 900),
  royalOudHero: pexels(4735929),
  whiteMusk: pexels(16266295, 900),
  discovery: pexels(4735908, 900),
  oudAmber: pexels(15574229, 900),
  weddingTrio: pexels(264819, 900),
  amberRose: pexels(32645088, 900),
  bakhour: pexels(40403135, 900),
  mabkhara: pexels(774378, 900),
  burnerStory: pexels(40403138, 1200),
  silverBurner: pexels(9653413),
};

const NAME = L("بيت العود", "Beit El Oud");

const header = lib("header-centered", {
  text: {
    "المتجر": L("الروايح", "Scents"),
    "العروض": L("الأكثر اختياراً", "Favourites"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨": L("عطارين في خان الخليلي من ١٩٦١", "Perfumers in Khan El Khalili since 1961"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("حكايتنا", "Our story"),
  },
  links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-centered", {
  text: {
    "م": L("ع", "O"),
    "اسم متجرك": NAME,
    "مختارات بعناية منذ ٢٠١٨، لكل بيت في مصر.": L("عود ومسك بيتخلطوا في خان الخليلي.", "Oud and musk blended in Khan El Khalili."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ بيت العود. كل الحقوق محفوظة.", "© 2026 Beit El Oud. All rights reserved."),
  },
});

const MAPS = "https://maps.google.com/";

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.royalOudHero],
    text: {
      "كوليكشن الموسم": L("من ١٩٦١", "Since 1961"),
      "صوت أنقى، كل يوم": L("بيتخلط باليد، إزازة إزازة", "Blended by hand, one bottle at a time"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L("٣ أجيال من العطارين في خان الخليلي.", "Three generations of perfumers in Khan El Khalili."),
      "تسوق الآن": L("اكتشف الروايح", "Discover the scents"),
      "العروض": L("أطقم الهدايا", "Gift sets"),
      "صورة الحملة": L("إزازة عطر بغطا خشب", "A perfume bottle with a wooden cap"),
    },
    links: { "/products": [SHOP, search("طقم")] },
  }),
  lib("categories-big-type", {}),
  lib("products-list", {
    text: {
      "الكتالوج": L("الأكتر اختياراً", "Most chosen"),
      "كل الإكسسوارات": L("المفضلة عندنا", "The house favourites"),
      "كل اللي تحتاجه في مكان واحد، أصلي وبضمان.": L("الروايح اللي زباينّا بيرجعولها كل سنة.", "The scents our customers come back to every year."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 6 }],
  }),
  lib("team-story", {
    photo: [PHOTOS.burnerStory],
    text: {
      "قصتنا": L("حكايتنا", "Our story"),
      "بدأنا من أوضة في الدقي بعشر سماعات وموبايل واحد.": L("جدي خلط أول عود في محل عرضه مترين.", "My grandfather mixed his first oud in a shop two metres wide."),
      "صورة من المتجر": L("مبخرة نحاس فيها بخور", "A brass burner with incense resin"),
      "كنا بنبيع لأصحابنا على واتساب، وكل طلب كنا بنوصله بنفسنا. النهارده بقينا فريق من ١٢ شخص وبنوصل لكل محافظات مصر.": L(
        "لسه بنوزن كل نقطة بإيدينا، والعود بيستنى سنة كاملة قبل ما يتعبى.",
        "We still weigh every drop by hand and age our oud for a full year before it is bottled.",
      ),
      "لسه بنختار كل منتج بإيدينا، ولسه بنرد على كل رسالة.": L("والمحل لسه في نفس الحارة، بس بقى عندنا فرع في الزمالك.", "The shop is still in the same alley, and now there is a branch in Zamalek too."),
      "— منى، المؤسسة": L("— حسن، الجيل التالت", "— Hassan, third generation"),
    },
  }),
  lib("team-branches", {
    text: {
      "الفروع": L("محلاتنا", "Our shops"),
      "زورنا": L("شمّه بنفسك", "Smell it in person"),
      "فرع الدقي": L("خان الخليلي", "Khan El Khalili"),
      "٢٤ شارع التحرير، الدقي": L("شارع المعز، خان الخليلي", "El Moez St, Khan El Khalili"),
      "يوميًا من ١٢ الضهر لـ ١١ م": L("يومياً من ١١ الصبح لـ ١١ بالليل", "Daily, 11 am – 11 pm"),
      "فرع مدينة نصر": L("الزمالك", "Zamalek"),
      "سيتي ستارز، الدور الأول": L("شارع البرازيل، الزمالك", "Brazil St, Zamalek"),
      "يوميًا من ١٠ ص لـ ١٠ م": L("يومياً من ١٢ الضهر لـ ١٠ بالليل", "Daily, 12 pm – 10 pm"),
      "فرع المعادي": L("مصر الجديدة", "Heliopolis"),
      "شارع ٩، المعادي": L("شارع الكوربة، مصر الجديدة", "El Korba St, Heliopolis"),
      "السبت – الخميس، ١٢ – ١٠ م": L("السبت – الخميس، ١ – ١٠ م", "Sat – Thu, 1 – 10 pm"),
    },
    links: { "https://maps.google.com": MAPS },
  }),
  lib("testimonials-quote", {
    text: {
      "آراء العملاء": L("من عملاء البيت", "From our patrons"),
      "«من أحسن تجارب الشراء أونلاين. الطلب وصل بسرعة، والتغليف شيك، والمنتج أحلى من الصور.»": L(
        "«العود الملكي بيفضل على الهدوم لتاني يوم، وعلبة الهدية كانت تحفة.»",
        "«The Royal Oud stays on my clothes until the next day, and the gift box was beautiful.»",
      ),
      "مريم أ.": L("هالة ف.", "Hala F."),
      "القاهرة": L("مصر الجديدة", "Heliopolis"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("حكايتنا", "Our story"), L("بيت عطور عائلي في خان الخليلي من ١٩٦١.", "A family perfume house in Khan El Khalili since 1961.")),
  aboutStory(lib, {
    photo: PHOTOS.silverBurner,
    alt: L("مبخرة فضة طالع منها دخان", "A silver burner with rising smoke"),
    eyebrow: L("خان الخليلي", "Khan El Khalili"),
    title: L("٣ أجيال، نفس الميزان", "Three generations, one scale"),
    text: L("جدي فتح المحل سنة ١٩٦١، وأبويا علّمني أوزن العود قبل ما أتعلم أكتب.", "My grandfather opened the shop in 1961, and my father taught me to weigh oud before I could write."),
    more: L("ولسه كل إزازة بتتخلط قدامك لو حبيت تستنى.", "And every bottle is still blended in front of you if you care to wait."),
    button: L("اكتشف الروايح", "Discover the scents"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("عود ومسك بيتخلطوا في خان الخليلي.", "Oud and musk blended in Khan El Khalili."),
  categories: [
    ["oud", "عود", "Oud", PHOTOS.royalOud],
    ["musk", "مسك", "Musk", PHOTOS.whiteMusk],
    ["bakhour", "بخور ومباخر", "Bakhour & burners", PHOTOS.bakhour],
    ["gifts", "أطقم هدايا", "Gift sets", PHOTOS.weddingTrio],
    ["samples", "عينات", "Samples", PHOTOS.discovery],
    ["blends", "خلطات", "Blends", PHOTOS.oudAmber],
  ],
  products: [
    ["royal-oud-50", "oud", "عود ملكي ٥٠ مل", "Royal Oud, 50 ml", PHOTOS.royalOud, 2400, { isFeatured: true, rating: 4.9, sold90: 96 }],
    ["white-musk-30", "musk", "مسك أبيض ٣٠ مل", "White Musk, 30 ml", PHOTOS.whiteMusk, 890, { rating: 4.8, sold90: 140 }],
    ["discovery-set", "samples", "طقم تجربة", "Discovery Set", PHOTOS.discovery, 650, { rating: 4.8, sold90: 210 }],
    ["oud-amber-100", "blends", "عود وعنبر ١٠٠ مل", "Oud & Amber, 100 ml", PHOTOS.oudAmber, 3900, { compareAtPrice: 4400, sold90: 41 }],
    ["wedding-gift-box", "gifts", "بوكس هدية فرح", "Wedding Gift Box", PHOTOS.weddingTrio, 4800, { isFeatured: true, sold90: 28 }],
    ["amber-rose-50", "musk", "مسك وورد ٥٠ مل", "Musk & Rose, 50 ml", PHOTOS.amberRose, 1250, { sold90: 66 }],
    ["cambodian-bakhour", "bakhour", "بخور عود كمبودي", "Cambodian Oud Bakhour", PHOTOS.bakhour, 450, { rating: 4.9, sold90: 120 }],
    ["brass-mabkhara", "bakhour", "مبخرة نحاس", "Brass Incense Burner", PHOTOS.mabkhara, 980, { compareAtPrice: 1150, sold90: 34 }],
  ],
});

export const OUD = libraryTemplate({
  key: OUD_KEY,
  version: 3,
  changelog: "Oud v3: categories, a closing review, section order",
  productPage: { surface: "flat", thumbs: "side", gallery: "end", button: "outline", band: "shelf", extras: ["product-shipping"], copy: { reviews: L("رأي أهل العطر", "From those who wear it"), related: L("عطور من الدار", "More from the house") } },
  name: L("عود", "Oud"),
  description: L(
    "بيت عطور: المفضلة عندنا، حكاية العيلة، هدايا لكل حد، كارت هدية والفروع. أربع صفحات جاهزة.",
    "A perfume house: house favourites, the family story, gifts by person, a gift card and the shops. Four ready pages.",
  ),
  category: "beauty",
  sortOrder: 620,
  palette: ["#f5efe6", "#e8dcc8", "#c9a96e", "#5a2d1a"],
  colors: {
    primary: "#5a2d1a",
    secondary: "#e8dcc8",
    background: "#f5efe6",
    foreground: "#24130f",
    muted: "#6a564a",
    border: "#d9c9ae",
    accent: "#c9a96e",
  },
  fonts: { heading: "Aref Ruqaa", body: "Noto Kufi Arabic" },
  radius: 2,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("حكايتنا", "About"), seo: { title: L("حكايتنا", "Our story") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("شارع المعز، خان الخليلي، القاهرة.", "El Moez St, Khan El Khalili, Cairo."),
        heading: L("اسأل عن ريحة أو هدية", "Ask about a scent or a gift"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الروايح والهدايا والتوصيل.", "Scents, gifts and delivery."),
        question: L("ينفع أجرّب الريحة قبل ما أشتري؟", "Can I try a scent before buying?"),
        answer: L("أيوه، اطلب طقم التجربة أو عدّي على أي فرع، وبنبعت عينة مجانية مع كل إزازة.", "Yes, order the discovery set or visit a shop; every bottle also comes with a free sample."),
      }),
    },
  ],
  demo: DEMO,
});
