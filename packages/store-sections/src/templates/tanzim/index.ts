/**
 * Tanzim (template 68, home organisation; Claude Design "Storefront
 * Templates"): cool near-white paper, a sky blue for actions and an ice-blue
 * highlight, Alexandria throughout and 16px corners. A pantry-organising
 * shop: a place for everything, the pantry kit, quantity savings, most
 * reordered, delivery days and questions. Built from section library
 * designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): jars in cupboards,
 * canisters, woven baskets on shelves and open shelf units. No people, no
 * hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const TANZIM_KEY = "tanzim";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(TANZIM_KEY, getDesign(id)!, { corners: 16, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  jarCupboard: pexels(8580727),
  canisters: pexels(8580718, 900),
  basketPair: pexels(8581052, 900),
  clipJars: pexels(8287244, 900),
  orangeLids: pexels(8289906, 900),
  cabinetJars: pexels(8580742, 900),
  linedBaskets: pexels(21550127, 900),
  cupboardBaskets: pexels(33784616, 900),
  whiteShelf: pexels(31390646, 900),
  bathShelf: pexels(31390644, 900),
  jarMix: pexels(3847450, 900),
  snackJars: pexels(9475695, 900),
  pantryNook: pexels(4112620, 900),
  basketMugs: pexels(27693159),
};

const NAME = L("تنظيم هوم", "Tanzim Home");

const header = lib("header-chips", {
  text: { "م": L("ت", "T"), "اسم متجرك": NAME, "ابحث عن منتج…": L("ابحث عن برطمان، سلة، رف…", "Search jars, baskets, shelves…") },
});

const footer = lib("footer-signup", {
  text: {
    "اشترك في النشرة": L("أفكار تنظيم على إيميلك", "Organising ideas in your inbox"),
    "عروض ومنتجات جديدة، مرة في الأسبوع.": L("فكرة تنظيم وعرض كل أسبوع.", "One organising idea and one offer every week."),
    "م": L("ت", "T"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ تنظيم هوم. كل الحقوق محفوظة.", "© 2026 Tanzim Home. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.jarCupboard],
    text: {
      "كوليكشن الموسم": L("تنظيم النملية", "Pantry reset"),
      "صوت أنقى، كل يوم": L("مكان لكل حاجة", "A place for everything"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "برطمانات محكمة وسلال وعلب رفوف. باقات على مقاس المطبخ المصري.",
        "Airtight jars, baskets and shelf boxes. Bundles sized for Egyptian kitchens.",
      ),
      "تسوق الآن": L("جهّز نمليتك", "Build your pantry"),
      "العروض": L("الأكتر طلباً", "Most ordered"),
      "صورة الحملة": L("دولاب مطبخ فيه برطمانات حبوب مترتبة", "A kitchen cupboard with neatly lined jars of grains"),
    },
    links: { "/products": [search("برطمان"), BEST] },
  }),
  lib("categories-chips", { text: { "إيه اللي في بالك؟": L("هتنظم إيه النهارده؟", "What are you organising today?") } }),
  lib("products-rows", {
    text: { "إكسسوارات بسعر حلو": L("الأكتر إعادة طلب", "Most reordered") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 6 }],
  }),
  lib("pay-days", {
    text: {
      "القاهرة، الجيزة": L("القاهرة والجيزة، تاني يوم", "Cairo and Giza, next day"),
      "الإسكندرية، الدلتا، مدن القناة": L("إسكندرية والدلتا", "Alexandria and Delta"),
      "٤–٦": L("٤–٥", "4–5"),
      "الصعيد، البحر الأحمر، سيناء": L("الصعيد وسينا", "Upper Egypt and Sinai"),
    },
  }),
  lib("faq-columns", {
    as: "faq-home",
    text: {
      "أسئلة شائعة": L("أسئلة", "Questions"),
      "كيف أعرف أن طلبي وصل إليكم؟": L("البرطمانات محكمة فعلاً؟", "Are the jars really airtight?"),
      "ستظهر لك صفحة تأكيد وتصلك رسالة، ونتصل بك لتأكيد طلبات الدفع عند الاستلام.": L(
        "أيوه، الغطا فيه جلدة سيليكون والبن والسكر بيفضلوا ناشفين.",
        "Yes, each lid has a silicone seal, so coffee and sugar stay dry.",
      ),
      "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("ينفع أغير برطمانات الطقم؟", "Can I swap the jars in a kit?"),
      "نعم، حتى يتم شحنه. تواصل معنا بأسرع وقت.": L("أيوه، كلمنا قبل الشحن ونبدّل المقاسات.", "Yes, message us before it ships and we change the sizes."),
      "كم يستغرق التوصيل؟": L("التوصيل بياخد قد إيه؟", "How long does delivery take?"),
      "القاهرة والجيزة من يوم إلى يومين، وباقي المحافظات من ٢ إلى ٦ أيام.": L(
        "القاهرة والجيزة تاني يوم، وباقي المحافظات من ٢ لـ ٥ أيام.",
        "Cairo and Giza next day, other governorates in 2 to 5 days.",
      ),
      "هل التوصيل متاح لكل المحافظات؟": L("الزجاج بيوصل سليم؟", "Does the glass arrive safely?"),
      "نعم، نوصل لكل محافظات مصر.": L("كل برطمان متغلف لوحده، ولو اتكسر حاجة بنبدّلها.", "Every jar is wrapped on its own, and we replace anything broken."),
      "ما طرق الدفع المتاحة؟": L("بتعملوا مقاسات للدولاب؟", "Do you size baskets for my cupboard?"),
      "الدفع عند الاستلام، والبطاقات، والمحافظ الإلكترونية، وإنستاباي.": L(
        "ابعتلنا مقاس الرف ونقولك أنهي سلال تدخل.",
        "Send us your shelf size and we tell you which baskets fit.",
      ),
      "ما سياسة الاسترجاع؟": L("ينفع أرجّع؟", "Can I return things?"),
      "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": L(
        "أيوه، خلال ١٤ يوم لو المنتج متستعملش.",
        "Yes, within 14 days if it is unused.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن تنظيم هوم", "About Tanzim Home"), L("برطمانات وعلب ورفوف لمطبخ أهدى.", "Jars, boxes and shelves for a calmer kitchen.")),
  aboutStory(lib, {
    photo: PHOTOS.basketMugs,
    alt: L("سلة خوص ومجات بيضا على رف", "A woven basket and white mugs on a shelf"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("بدأنا بنملية واحدة", "It started with one pantry"),
    text: L(
      "رتبنا نمليتنا وصورناها، والناس فضلت تسأل جبنا البرطمانات منين. فعملنا أطقم على مقاس دواليب المطبخ المصري.",
      "We sorted our own pantry, shared a photo and everyone asked where the jars came from. So we made kits sized for Egyptian kitchen cupboards.",
    ),
    more: L("والتوصيل تاني يوم في القاهرة والجيزة.", "With next-day delivery in Cairo and Giza."),
    button: L("جهّز نمليتك", "Build your pantry"),
    href: search("برطمان"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("برطمانات وعلب ورفوف لمطبخ أهدى.", "Jars, boxes and shelves for a calmer kitchen."),
  categories: [
    ["jars", "برطمانات وعلب", "Jars & boxes", PHOTOS.pantryNook],
    ["baskets", "سلال", "Baskets", PHOTOS.basketPair],
    ["shelves", "رفوف", "Shelves", PHOTOS.whiteShelf],
  ],
  products: [
    ["airtight-jar-set", "jars", "٦ برطمانات بغطا محكم", "Airtight Jar Set of 6", PHOTOS.canisters, 560, { isFeatured: true, rating: 4.8, sold90: 210 }],
    ["woven-basket-pair", "baskets", "سلتين خوص للرف", "Woven Shelf Basket Pair", PHOTOS.basketPair, 480, { sold90: 120 }],
    ["clip-jar-trio", "jars", "٣ برطمانات بمشبك", "Clip-Top Jar Trio", PHOTOS.clipJars, 390, { sold90: 150 }],
    ["orange-lid-containers", "jars", "١٢ علبة حفظ بغطا برتقالي", "Orange-Lid Containers, 12 pcs", PHOTOS.orangeLids, 720, { compareAtPrice: 850, sold90: 96 }],
    ["cupboard-jar-set", "jars", "طقم برطمانات للدولاب ١٠ قطع", "Cupboard Jar Set of 10", PHOTOS.cabinetJars, 890, { isFeatured: true, sold90: 74 }],
    ["lined-baskets", "baskets", "سلال خوص ببطانة قماش", "Cloth-Lined Wicker Baskets", PHOTOS.linedBaskets, 650, { sold90: 58 }],
    ["cupboard-basket-set", "baskets", "طقم سلال للدولاب ٤ قطع", "Cupboard Basket Set of 4", PHOTOS.cupboardBaskets, 980, { rating: 4.9, sold90: 44 }],
    ["three-tier-shelf", "shelves", "رف أبيض ٣ أدوار", "White Three-Tier Shelf", PHOTOS.whiteShelf, 1450, { sold90: 31 }],
    ["bathroom-shelf", "shelves", "رف حمام بسلال", "Bathroom Shelf with Baskets", PHOTOS.bathShelf, 1650, { inStock: false, sold90: 19 }],
    ["glass-jar-mix", "jars", "برطمانات إزاز مشكلة", "Mixed Glass Jars", PHOTOS.jarMix, 540, { sold90: 88 }],
    ["snack-jars", "jars", "برطمانات سناكس ٤ قطع", "Snack Jars, Set of 4", PHOTOS.snackJars, 420, { compareAtPrice: 480, sold90: 102 }],
  ],
});

export const TANZIM = libraryTemplate({
  key: TANZIM_KEY,
  version: 3,
  changelog: "Tanzim v3: categories, section order",
  productPage: { thumbs: "side", band: "shelf", extras: ["product-shipping"], copy: { back: L("رجوع للتنظيم", "Back to organising"), reviews: L("رأي اللي نظّموا", "From tidy homes"), related: L("الأكتر إعادة طلب", "Most reordered") } },
  name: L("تنظيم", "Tanzim"),
  description: L(
    "تنظيم البيت: الأكتر إعادة طلب ومواعيد التوصيل. أربع صفحات جاهزة.",
    "Home organisation: most reordered and delivery days. Four ready pages.",
  ),
  category: "kitchen",
  sortOrder: 680,
  palette: ["#fafafa", "#eef0f3", "#bae6fd", "#0ea5e9"],
  colors: {
    primary: "#0ea5e9",
    secondary: "#eef0f3",
    background: "#fafafa",
    foreground: "#1c2430",
    muted: "#566070",
    border: "#dfe3e8",
    accent: "#bae6fd",
  },
  fonts: { heading: "Alexandria", body: "Alexandria" },
  radius: 16,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عننا", "About"), seo: { title: L("عن تنظيم هوم", "About Tanzim Home") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("ابعتلنا صورة دولابك ومقاسه ونقترح عليك طقم.", "Send us a photo and the size of your cupboard and we suggest a kit."),
        heading: L("عن مقاس أو طقم", "About a size or a kit"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الأطقم والمقاسات والتوصيل.", "Kits, sizes and delivery."),
        question: L("ينفع أرجّع جزء من الطقم؟", "Can I return part of a kit?"),
        answer: L("أيوه، خلال ١٤ يوم، وبنرجّعلك تمن القطعة بسعر الطقم.", "Yes, within 14 days; we refund the piece at its kit price."),
      }),
    },
  ],
  demo: DEMO,
});
