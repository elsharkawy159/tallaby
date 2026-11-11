/**
 * Zaki (template 57, smart home and TV; Claude Design "Storefront
 * Templates"): pale green-grey paper, deep green ink, a teal for actions and
 * a warm yellow highlight, Noto Kufi Arabic throughout and 14px corners. An
 * installer's shop: smart TV in an afternoon, the categories, devices we
 * install, installation prices, most installed, extend your warranty and
 * questions.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): wall-mounted TVs in empty
 * living rooms, indoor cameras, a smart plug, a smart home set, routers, a
 * smart speaker, a power bank and a charger. No people, no hands, no logos.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Beit Zaki itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const ZAKI_KEY = "zaki";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ZAKI_KEY, getDesign(id)!, { corners: 14, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  tvConsole: pexels(6020432),
  tvLounge: pexels(39338464),
  tv43: pexels(10078142, 900),
  tv55: pexels(6636297, 900),
  smartKit: pexels(29292011, 900),
  smartPlug: pexels(4148576, 900),
  camera: pexels(33104381, 900),
  panCamera: pexels(28940577, 900),
  router: pexels(29711663, 900),
  speaker: pexels(4132542, 900),
  powerBank: pexels(3921705, 900),
  charger: pexels(35921904, 900),
};

const NAME = L("بيت زكي", "Beit Zaki");

/**
 * Beit Zaki's own content: what the look is built with when no edition is
 * applied (the template `zaki` has always meant). The store name and
 * description and the category list come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header's two trade links: `nav.0` names the whole catalog in one word (its href is "/products"), `nav.1` one part of it.
  nav: [
    { label: L("الأجهزة", "Devices"), href: SHOP },
    { label: L("البيت الذكي", "Smart home"), href: search("ذكي") },
  ],
  // The hero's first button (`cta`) goes to the contact page, so it is a booking or asking action; its second button is `custom.hero-cta-2`.
  hero: {
    alt: L("شاشة على الحيطة فوق ترابيزة خشب", "A wall-mounted TV over a wooden console"),
    eyebrow: L("بنركبهولك", "Installed for you"),
    title: L("تلفزيون سمارت في ساعتين", "Smart TV in an afternoon"),
    line: L("بنركب الشاشة ونظبط الرسيفر وندخلك على تطبيقاتك.", "We mount the screen, set up the box and sign you in to your apps."),
    cta: L("احجز تركيب", "Book installation"),
  },
  categories: { title: L("البيت الذكي", "The smart home") },
  // A grid of four of what `journey.primary` shows (featured by default: the pack needs four featured products).
  products: {
    primary: {
      title: L("أجهزة بنركبها", "Devices we install"),
      line: L("شاشات وكاميرات وبيت ذكي، والتركيب علينا.", "TVs, cameras and smart home, installation included."),
    },
  },
  // The best-sellers rail: `line` is the small label over `title`, two or three words each.
  rows: [{ title: L("اختيارات البيوت", "Homes' favourites"), line: L("الأكتر تركيباً", "Most installed") }],
  // The footer's sign-up line.
  newsletter: { line: L("نصايح للبيت الذكي وعروض التركيب للمشتركين.", "Smart home tips and installation offers for subscribers.") },
  about: {
    line: L("رسيفرات وحوامل وبيت ذكي، بنركبهالك.", "TV boxes, mounts and smart home, installed for you."),
    alt: L("أوضة معيشة فيها شاشة على الحيطة وسماعات", "A living room with a wall-mounted TV and speakers"),
    eyebrow: L("مدينة نصر", "Nasr City"),
    title: L("الجهاز لوحده مش كفاية", "A device alone is not enough"),
    text: L("بدأنا فنيين تركيب، وكل يوم نلاقي ناس اشترت جهاز حلو ومحدش ظبطهولهم.", "We started as installers, and every day we met people with a great device nobody set up for them."),
    more: L("فبقينا نبيع الجهاز ونركبه ونفضل معاك بالضمان.", "So now we sell the device, install it and stay with you on warranty."),
    // Goes to the contact page: a booking or asking action.
    cta: L("احجز فني", "Book a technician"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("تركيب مجاني في القاهرة والجيزة.", "Free installation in Cairo and Giza."),
    heading: L("اسأل عن تركيب أو جهاز", "Ask about installation or a device"),
  },
  faq: {
    line: L("التركيب والضمان والتوصيل.", "Installation, warranty and delivery."),
    question: L("الضمان بيغطي التركيب؟", "Does the warranty cover installation?"),
    answer: L("أيوه، لو الحامل وقع أو السلك فك خلال سنة بنرجعلك ببلاش.", "Yes, if the mount slips or a cable comes loose within a year we come back for free."),
  },
  custom: {
    // The store's short name: its first letter is the header's logo mark.
    "store-short": L("زكي", "Zaki"),
    // The hero's second button, to the whole catalog.
    "hero-cta-2": L("تسوق الأجهزة", "Shop devices"),
    // The price menu of the store's services: a title, a note under it, then three groups. Prices as the store really charges them.
    "service-menu-title": L("أسعار التركيب", "Installation prices"),
    "service-menu-line": L("مجاناً مع أي رسيفر أو حامل فوق ٦٠٠ ج.م.", "Free with any TV box or mount over EGP 600."),
    // Group 1: its name in one word, then three services (two to five words) with a price each.
    "service-menu-1": L("التركيب", "Mounting"),
    "service-menu-1-1": L("لحد ٥٥ بوصة", "Up to 55 inch"),
    "service-menu-1-1-price": L("٣٥٠ ج.م", "EGP 350"),
    "service-menu-1-2": L("٦٥ بوصة وأكتر", "65 inch and up"),
    "service-menu-1-2-price": L("٥٠٠ ج.م", "EGP 500"),
    "service-menu-1-3": L("إخفاء السلك في الحيطة", "Cable hidden in the wall"),
    "service-menu-1-3-price": L("٢٥٠ ج.م", "EGP 250"),
    // Group 2: two services.
    "service-menu-2": L("الظبط", "Setup"),
    "service-menu-2-1": L("رسيفر", "TV box"),
    "service-menu-2-1-price": L("١٥٠ ج.م", "EGP 150"),
    "service-menu-2-2": L("ساوند بار", "Sound bar"),
    "service-menu-2-2-price": L("٢٠٠ ج.م", "EGP 200"),
    // Group 3: two services.
    "service-menu-3": L("البيت الذكي", "Smart home"),
    "service-menu-3-1": L("كاميرا مراقبة", "Security camera"),
    "service-menu-3-1-price": L("٢٠٠ ج.م", "EGP 200"),
    "service-menu-3-2": L("فيشة أو لمبة ذكية", "Smart plug or bulb"),
    "service-menu-3-2-price": L("٥٠ ج.م", "EGP 50"),
    // Three warranty plans (1, 2 and 3 years; their names and prices are the design's): the title, then what a plan covers. 1 and 2 are in the 1- and 2-year plans, 3 only in the 2-year plan, 4 only in the 3-year plan.
    "service-plans-title": L("مد الضمان", "Extend your warranty"),
    "service-plans-1": L("تصليح أو تغيير", "Repair or replace"),
    "service-plans-2": L("زيارة في البيت", "Home visit"),
    "service-plans-3": L("رسيفر بديل وقت التصليح", "Loan box during repair"),
    "service-plans-4": L("حادثة واحدة", "One accident"),
    // The home page's five questions, in order; the fifth is about paying.
    "faq-1-question": L("التركيب مجاني فعلاً؟", "Is installation really free?"),
    "faq-1-answer": L(
      "أيوه في القاهرة والجيزة مع أي رسيفر أو حامل فوق ٦٠٠ ج.م، وغير كده حسب قايمة الأسعار.",
      "Yes in Cairo and Giza with any TV box or mount over EGP 600; otherwise see the price list.",
    ),
    "faq-2-question": L("الفني بيجيب معاه الحامل؟", "Does the technician bring the mount?"),
    "faq-2-answer": L("لو طلبته معانا أيوه، ولو عندك حامل بنركبه برضه.", "If you ordered it from us, yes; if you have your own, we fit that too."),
    "faq-3-question": L("التركيب بياخد قد إيه؟", "How long does a visit take?"),
    "faq-3-answer": L(
      "حوالي ساعة للشاشة والرسيفر، وبنمشي بعد ما نتأكد إن كل التطبيقات شغالة.",
      "About an hour for the screen and box, and we leave only once every app works.",
    ),
    "faq-4-question": L("بتركبوا على أي حيطة؟", "Can you mount on any wall?"),
    "faq-4-answer": L("أيوه، طوب أو خرسانة أو جبس، وبنخبّي السلك.", "Yes, brick, concrete or plasterboard, and we hide the cable."),
    "faq-5-question": L("بتدفع إمتى؟", "When do I pay?"),
    "faq-5-answer": L(
      "بعد ما الفني يخلص وتتأكد إن كل حاجة شغالة، كاش أو كارت أو إنستاباي.",
      "After the technician finishes and you check everything works: cash, card or InstaPay.",
    ),
  },
  photos: {
    // The hero's photo half: drawn square on desktop and landscape on phones, both cropped from the centre of the 16:9 photo.
    hero: { wide: PHOTOS.tvConsole },
    // The about page's photo (4:5).
    story: PHOTOS.tvLounge,
  },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (FAQ, All categories, Top rated, Questions) and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);
  const x = (key: string) => c.custom[key]!;

  const header = lib("header-line", {
    text: {
      "م": initialOf(x("store-short")),
      "اسم متجرك": name,
      "المتجر": c.nav[0]!.label,
      "العروض": c.nav[1]!.label,
      "المدونة": L("الأسئلة", "FAQ"),
      "من نحن": L(aboutName.ar, "About"),
    },
    links: { "/products": [c.nav[0]!.href, c.nav[1]!.href, undefined, c.nav[0]!.href, c.nav[1]!.href], "/blog": "/faq" },
  });

  const footer = lib("footer-panel", {
    text: {
      "اسم متجرك": name,
      "اشترك وخد العروض قبل أي حد.": c.newsletter.line,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "العروض": L("الأعلى تقييماً", "Top rated"),
      "من نحن": aboutName,
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  const home: Design[] = [
    lib("hero-halves", {
      photo: [undefined, c.photos.hero.wide],
      text: {
        "كوليكشن الموسم": c.hero.eyebrow,
        "صوت أنقى، كل يوم": c.hero.title,
        "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": c.hero.line,
        "تسوق الآن": c.hero.cta,
        "العروض": x("hero-cta-2"),
        "صورة الحملة": c.hero.alt,
      },
      links: { "/products": ["/contact", SHOP] },
    }),
    lib("categories-feature-list", {
      text: { "الأقسام": c.categories.title, "كل الأقسام": L("كل الأقسام", "All categories") },
    }),
    lib("products-grid", {
      text: {
        "وصل حديثًا": c.products.primary.title,
        "أحدث المنتجات اللي نزلت المتجر.": c.products.primary.line,
      },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary, limit: 4 }],
    }),
    lib("service-price-menu", {
      text: {
        "أسعار الخدمات": x("service-menu-title"),
        "الأسعار شاملة قطع الغيار الأصلية والضمان.": x("service-menu-line"),
        "الموبايل": x("service-menu-1"),
        "تغيير بطارية": x("service-menu-1-1"),
        "٦٥٠ ج.م": x("service-menu-1-1-price"),
        "تغيير شاشة": x("service-menu-1-2"),
        "٢٤٠٠ ج.م": x("service-menu-1-2-price"),
        "سوكت الشحن": x("service-menu-1-3"),
        "٤٥٠ ج.م": x("service-menu-1-3-price"),
        "الشاشات والبيت": x("service-menu-2"),
        "تركيب حائط": x("service-menu-2-1"),
        "٣٥٠ ج.م": x("service-menu-2-1-price"),
        "ضبط رسيفر": x("service-menu-2-2"),
        "١٥٠ ج.م": x("service-menu-2-2-price"),
        "السماعات": x("service-menu-3"),
        "تغيير وسايد": x("service-menu-3-1"),
        "١٢٠ ج.م": x("service-menu-3-1-price"),
        "تنظيف وفحص": x("service-menu-3-2"),
        "٨٠ ج.م": x("service-menu-3-2-price"),
      },
    }),
    lib("products-rail", {
      text: { "بيحبوها": c.rows[0]!.line, "الأكثر مبيعًا": c.rows[0]!.title },
      links: { "/products": BEST },
    }),
    lib("service-plans", {
      text: {
        "احمي جهازك أكتر": x("service-plans-title"),
        "إصلاح الأعطال": x("service-plans-1"),
        "فني في البيت": x("service-plans-2"),
        "جهاز بديل وقت الصيانة": x("service-plans-3"),
        "كسر الشاشة مرة واحدة": x("service-plans-4"),
      },
    }),
    lib("faq-columns", {
      as: "faq-home",
      text: {
        "أسئلة شائعة": L("أسئلة", "Questions"),
        "كيف أعرف أن طلبي وصل إليكم؟": x("faq-1-question"),
        "ستظهر لك صفحة تأكيد وتصلك رسالة، ونتصل بك لتأكيد طلبات الدفع عند الاستلام.": x("faq-1-answer"),
        "هل يمكنني تعديل طلبي أو إلغاؤه؟": x("faq-2-question"),
        "نعم، حتى يتم شحنه. تواصل معنا بأسرع وقت.": x("faq-2-answer"),
        "كم يستغرق التوصيل؟": x("faq-3-question"),
        "القاهرة والجيزة من يوم إلى يومين، وباقي المحافظات من ٢ إلى ٦ أيام.": x("faq-3-answer"),
        "هل التوصيل متاح لكل المحافظات؟": x("faq-4-question"),
        "نعم، نوصل لكل محافظات مصر.": x("faq-4-answer"),
        "ما طرق الدفع المتاحة؟": x("faq-5-question"),
        "الدفع عند الاستلام، والبطاقات، والمحافظ الإلكترونية، وإنستاباي.": x("faq-5-answer"),
      },
    }),
  ];

  const about: Design[] = [
    pageHeader(lib, "about-header", aboutName, c.about.line),
    aboutStory(lib, {
      photo: c.photos.story,
      alt: c.about.alt,
      eyebrow: c.about.eyebrow,
      title: c.about.title,
      text: c.about.text,
      more: c.about.more,
      button: c.about.cta,
      href: "/contact",
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      { slug: "about", name: L(aboutName.ar, "About"), seo: { title: aboutName }, sections: about },
      {
        slug: "contact",
        name: L("تواصل", "Contact"),
        seo: { title: L("تواصل", "Contact") },
        sections: contactPage(lib, { title: c.contact.title, text: c.contact.line, heading: c.contact.heading }),
      },
      {
        slug: "faq",
        name: L("الأسئلة الشائعة", "FAQ"),
        seo: { title: L("الأسئلة الشائعة", "FAQ") },
        sections: faqPage(lib, { text: c.faq.line, question: c.faq.question, answer: c.faq.answer }),
      },
    ],
  };
}

const DEMO = demoStore({
  name: NAME,
  description: L("رسيفرات وحوامل وبيت ذكي، بنركبهالك.", "TV boxes, mounts and smart home, installed for you."),
  categories: [
    ["tv", "التلفزيون", "TV", PHOTOS.tv43],
    ["smart", "البيت الذكي", "Smart home", PHOTOS.smartKit],
    ["wifi", "الواي فاي", "Wi-Fi", PHOTOS.router],
    ["power", "الطاقة", "Power", PHOTOS.powerBank],
    ["cameras", "الكاميرات", "Cameras", PHOTOS.camera],
    ["audio", "الصوت", "Audio", PHOTOS.speaker],
    ["chargers", "الشواحن", "Chargers", PHOTOS.charger],
  ],
  products: [
    ["smart-tv-43", "tv", "شاشة سمارت ٤٣ بوصة", "43-inch Smart TV", PHOTOS.tv43, 11900, { isFeatured: true, rating: 4.6, sold90: 60 }],
    ["smart-tv-55", "tv", "شاشة سمارت ٥٥ بوصة", "55-inch Smart TV", PHOTOS.tv55, 18900, { isFeatured: true, compareAtPrice: 20500, sold90: 34 }],
    ["smart-home-kit", "smart", "باكدج البيت الذكي", "Smart Home Starter Kit", PHOTOS.smartKit, 2450, { isFeatured: true, sold90: 48 }],
    ["wifi-smart-plug", "smart", "فيشة ذكية واي فاي", "Wi-Fi Smart Plug", PHOTOS.smartPlug, 390, { sold90: 150 }],
    ["indoor-camera", "cameras", "كاميرا داخلية واي فاي", "Indoor Wi-Fi Camera", PHOTOS.camera, 990, { rating: 4.7, sold90: 90 }],
    ["pan-camera-360", "cameras", "كاميرا بتلف ٣٦٠°", "360° Pan Camera", PHOTOS.panCamera, 1290, { compareAtPrice: 1450, sold90: 70 }],
    ["wifi-6-router", "wifi", "راوتر واي فاي 6", "Wi-Fi 6 Router", PHOTOS.router, 2100, { isFeatured: true, sold90: 55 }],
    ["mini-smart-speaker", "audio", "سبيكر ذكي ميني", "Mini Smart Speaker", PHOTOS.speaker, 1450, { inStock: false, sold90: 20 }],
    ["maggo-10k-power-bank", "power", "باور بانك ماج 10K", "MagGo 10K Power Bank", PHOTOS.powerBank, 1835, { sold90: 40 }],
    ["dual-usb-c-charger", "chargers", "شاحن USB-C مزدوج", "Dual USB-C Charger", PHOTOS.charger, 390, { compareAtPrice: 460, sold90: 210 }],
  ],
});

export const ZAKI = editionTemplate({
  key: ZAKI_KEY,
  version: 4,
  changelog: "Zaki v4: categories, section order, trimmed service blocks",
  productPage: { thumbs: "bottom", band: "paper", extras: ["product-perks"], copy: { reviews: L("رأي اللي ركّبوا عندنا", "From homes we installed"), related: L("أجهزة تكمّل بيتك", "More for your smart home") } },
  name: L("زكي", "Zaki"),
  description: L(
    "البيت الذكي والتلفزيون مع التركيب: أجهزة بنركبها، أسعار التركيب ومد الضمان. أربع صفحات جاهزة.",
    "Smart home and TV with installation: devices we install, installation prices and extended warranty. Four ready pages.",
  ),
  category: "electronics",
  style: ["minimal"],
  sortOrder: 570,
  palette: ["#f5f7f6", "#e3ebe7", "#fcd34d", "#0f766e"],
  colors: {
    primary: "#0f766e",
    secondary: "#e3ebe7",
    background: "#ffffff",
    foreground: "#13221c",
    muted: "#4d5c55",
    border: "#d3ddd8",
    accent: "#fcd34d",
  },
  fonts: { heading: "Noto Kufi Arabic", body: "Noto Kufi Arabic" },
  radius: 14,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "nav.0",
    "nav.1",
    "hero",
    "categories.title",
    "products.primary.title",
    "products.primary.line",
    "rows.0.title",
    "rows.0.line",
    "newsletter.line",
    "about",
    "contact",
    "faq",
    "custom.store-short",
    "custom.hero-cta-2",
    "custom.service-menu-title",
    "custom.service-menu-line",
    "custom.service-menu-1",
    "custom.service-menu-1-1",
    "custom.service-menu-1-1-price",
    "custom.service-menu-1-2",
    "custom.service-menu-1-2-price",
    "custom.service-menu-1-3",
    "custom.service-menu-1-3-price",
    "custom.service-menu-2",
    "custom.service-menu-2-1",
    "custom.service-menu-2-1-price",
    "custom.service-menu-2-2",
    "custom.service-menu-2-2-price",
    "custom.service-menu-3",
    "custom.service-menu-3-1",
    "custom.service-menu-3-1-price",
    "custom.service-menu-3-2",
    "custom.service-menu-3-2-price",
    "custom.service-plans-title",
    "custom.service-plans-1",
    "custom.service-plans-2",
    "custom.service-plans-3",
    "custom.service-plans-4",
    "custom.faq-1-question",
    "custom.faq-1-answer",
    "custom.faq-2-question",
    "custom.faq-2-answer",
    "custom.faq-3-question",
    "custom.faq-3-answer",
    "custom.faq-4-question",
    "custom.faq-4-answer",
    "custom.faq-5-question",
    "custom.faq-5-answer",
    "photos.hero.wide",
    "photos.story",
  ],
  // Four featured products in the grid; the rail is always the best sellers. No category rows.
  journey: { primary: "featured", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
