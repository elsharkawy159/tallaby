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
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Tanzim Home itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

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

/**
 * Tanzim Home's own content: what the look is built with when no edition is
 * applied (the template `tanzim` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header search placeholder: three things a buyer types.
  labels: { search: L("ابحث عن برطمان، سلة، رف…", "Search jars, baskets, shelves…") },
  // Only `nav.0.href` is read: where the hero's and the about page's buttons go (the store's main category).
  nav: [{ label: L("برطمانات", "Jars"), href: search("برطمان") }],
  hero: {
    alt: L("دولاب مطبخ فيه برطمانات حبوب مترتبة", "A kitchen cupboard with neatly lined jars of grains"),
    eyebrow: L("تنظيم النملية", "Pantry reset"),
    title: L("مكان لكل حاجة", "A place for everything"),
    line: L("برطمانات محكمة وسلال وعلب رفوف. باقات على مقاس المطبخ المصري.", "Airtight jars, baskets and shelf boxes. Bundles sized for Egyptian kitchens."),
    // Goes to `nav.0.href`; the second button is `custom.best-label` (the best sellers).
    cta: L("جهّز نمليتك", "Build your pantry"),
  },
  categories: { title: L("هتنظم إيه النهارده؟", "What are you organising today?") },
  // Six compact rows of what `journey.primary` shows: the title must say the same.
  products: { primary: { title: L("الأكتر إعادة طلب", "Most reordered") } },
  // The footer's sign-up: a title and one line.
  newsletter: {
    title: L("أفكار تنظيم على إيميلك", "Organising ideas in your inbox"),
    line: L("فكرة تنظيم وعرض كل أسبوع.", "One organising idea and one offer every week."),
  },
  about: {
    line: L("برطمانات وعلب ورفوف لمطبخ أهدى.", "Jars, boxes and shelves for a calmer kitchen."),
    alt: L("سلة خوص ومجات بيضا على رف", "A woven basket and white mugs on a shelf"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("بدأنا بنملية واحدة", "It started with one pantry"),
    text: L(
      "رتبنا نمليتنا وصورناها، والناس فضلت تسأل جبنا البرطمانات منين. فعملنا أطقم على مقاس دواليب المطبخ المصري.",
      "We sorted our own pantry, shared a photo and everyone asked where the jars came from. So we made kits sized for Egyptian kitchen cupboards.",
    ),
    more: L("والتوصيل تاني يوم في القاهرة والجيزة.", "With next-day delivery in Cairo and Giza."),
    // Goes to `nav.0.href`.
    cta: L("جهّز نمليتك", "Build your pantry"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("ابعتلنا صورة دولابك ومقاسه ونقترح عليك طقم.", "Send us a photo and the size of your cupboard and we suggest a kit."),
    heading: L("عن مقاس أو طقم", "About a size or a kit"),
  },
  faq: {
    line: L("الأطقم والمقاسات والتوصيل.", "Kits, sizes and delivery."),
    question: L("ينفع أرجّع جزء من الطقم؟", "Can I return part of a kit?"),
    answer: L("أيوه، خلال ١٤ يوم، وبنرجّعلك تمن القطعة بسعر الطقم.", "Yes, within 14 days; we refund the piece at its kit price."),
  },
  custom: {
    // The label of the hero's second button (the best sellers), two words.
    "best-label": L("الأكتر طلباً", "Most ordered"),
    // The home page's six questions, in two columns: each a short question and a one-line answer.
    "faq-1-question": L("البرطمانات محكمة فعلاً؟", "Are the jars really airtight?"),
    "faq-1-answer": L("أيوه، الغطا فيه جلدة سيليكون والبن والسكر بيفضلوا ناشفين.", "Yes, each lid has a silicone seal, so coffee and sugar stay dry."),
    "faq-2-question": L("ينفع أغير برطمانات الطقم؟", "Can I swap the jars in a kit?"),
    "faq-2-answer": L("أيوه، كلمنا قبل الشحن ونبدّل المقاسات.", "Yes, message us before it ships and we change the sizes."),
    "faq-3-question": L("التوصيل بياخد قد إيه؟", "How long does delivery take?"),
    "faq-3-answer": L("القاهرة والجيزة تاني يوم، وباقي المحافظات من ٢ لـ ٥ أيام.", "Cairo and Giza next day, other governorates in 2 to 5 days."),
    "faq-4-question": L("الزجاج بيوصل سليم؟", "Does the glass arrive safely?"),
    "faq-4-answer": L("كل برطمان متغلف لوحده، ولو اتكسر حاجة بنبدّلها.", "Every jar is wrapped on its own, and we replace anything broken."),
    "faq-5-question": L("بتعملوا مقاسات للدولاب؟", "Do you size baskets for my cupboard?"),
    "faq-5-answer": L("ابعتلنا مقاس الرف ونقولك أنهي سلال تدخل.", "Send us your shelf size and we tell you which baskets fit."),
    "faq-6-question": L("ينفع أرجّع؟", "Can I return things?"),
    "faq-6-answer": L("أيوه، خلال ١٤ يوم لو المنتج متستعملش.", "Yes, within 14 days if it is unused."),
  },
  // hero.tall: the split hero's photo (square on desktop, so the subject sits in the middle); story: the about page (4:5).
  photos: { hero: { tall: PHOTOS.jarCupboard }, story: PHOTOS.basketMugs },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (Top rated, Questions), the delivery days and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const initial = initialOf(name);
  const x = c.custom;
  const main = c.nav[0]!.href;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);

  const header = lib("header-chips", {
    text: { "م": initial, "اسم متجرك": name, "ابحث عن منتج…": c.labels.search },
  });

  const footer = lib("footer-signup", {
    text: {
      "اشترك في النشرة": c.newsletter.title,
      "عروض ومنتجات جديدة، مرة في الأسبوع.": c.newsletter.line,
      "م": initial,
      "اسم متجرك": name,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  const home: Design[] = [
    lib("hero-halves", {
      photo: [undefined, c.photos.hero.tall],
      text: {
        "كوليكشن الموسم": c.hero.eyebrow,
        "صوت أنقى، كل يوم": c.hero.title,
        "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": c.hero.line,
        "تسوق الآن": c.hero.cta,
        "العروض": x["best-label"]!,
        "صورة الحملة": c.hero.alt,
      },
      links: { "/products": [main, BEST] },
    }),
    lib("categories-chips", { text: { "إيه اللي في بالك؟": c.categories.title } }),
    lib("products-rows", {
      text: { "إكسسوارات بسعر حلو": c.products.primary.title },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary, limit: 6 }],
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
        "كيف أعرف أن طلبي وصل إليكم؟": x["faq-1-question"]!,
        "ستظهر لك صفحة تأكيد وتصلك رسالة، ونتصل بك لتأكيد طلبات الدفع عند الاستلام.": x["faq-1-answer"]!,
        "هل يمكنني تعديل طلبي أو إلغاؤه؟": x["faq-2-question"]!,
        "نعم، حتى يتم شحنه. تواصل معنا بأسرع وقت.": x["faq-2-answer"]!,
        "كم يستغرق التوصيل؟": x["faq-3-question"]!,
        "القاهرة والجيزة من يوم إلى يومين، وباقي المحافظات من ٢ إلى ٦ أيام.": x["faq-3-answer"]!,
        "هل التوصيل متاح لكل المحافظات؟": x["faq-4-question"]!,
        "نعم، نوصل لكل محافظات مصر.": x["faq-4-answer"]!,
        "ما طرق الدفع المتاحة؟": x["faq-5-question"]!,
        "الدفع عند الاستلام، والبطاقات، والمحافظ الإلكترونية، وإنستاباي.": x["faq-5-answer"]!,
        "ما سياسة الاسترجاع؟": x["faq-6-question"]!,
        "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": x["faq-6-answer"]!,
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
      href: main,
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      { slug: "about", name: L("عننا", "About"), seo: { title: aboutName }, sections: about },
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
  description: L("برطمانات وعلب ورفوف لمطبخ أهدى.", "Jars, boxes and shelves for a calmer kitchen."),
  categories: [
    ["jars", "برطمانات وعلب", "Jars & boxes", PHOTOS.pantryNook],
    ["baskets", "سلال", "Baskets", PHOTOS.basketPair],
    ["shelves", "رفوف", "Shelves", PHOTOS.whiteShelf],
    ["containers", "علب حفظ", "Containers", PHOTOS.orangeLids],
    ["clip-jars", "برطمانات بمشبك", "Clip-top jars", PHOTOS.clipJars],
    ["cupboard", "الدولاب", "Cupboard", PHOTOS.cabinetJars],
    ["pantry", "النملية", "Pantry", PHOTOS.snackJars],
    ["bathroom", "الحمام", "Bathroom", PHOTOS.bathShelf],
  ],
  products: [
    ["airtight-jar-set", "jars", "٦ برطمانات بغطا محكم", "Airtight Jar Set of 6", PHOTOS.canisters, 560, { isFeatured: true, rating: 4.8, sold90: 210 }],
    ["woven-basket-pair", "baskets", "سلتين خوص للرف", "Woven Shelf Basket Pair", PHOTOS.basketPair, 480, { sold90: 120 }],
    ["clip-jar-trio", "clip-jars", "٣ برطمانات بمشبك", "Clip-Top Jar Trio", PHOTOS.clipJars, 390, { sold90: 150 }],
    ["orange-lid-containers", "containers", "١٢ علبة حفظ بغطا برتقالي", "Orange-Lid Containers, 12 pcs", PHOTOS.orangeLids, 720, { compareAtPrice: 850, sold90: 96 }],
    ["cupboard-jar-set", "cupboard", "طقم برطمانات للدولاب ١٠ قطع", "Cupboard Jar Set of 10", PHOTOS.cabinetJars, 890, { isFeatured: true, sold90: 74 }],
    ["lined-baskets", "baskets", "سلال خوص ببطانة قماش", "Cloth-Lined Wicker Baskets", PHOTOS.linedBaskets, 650, { sold90: 58 }],
    ["cupboard-basket-set", "baskets", "طقم سلال للدولاب ٤ قطع", "Cupboard Basket Set of 4", PHOTOS.cupboardBaskets, 980, { rating: 4.9, sold90: 44 }],
    ["three-tier-shelf", "shelves", "رف أبيض ٣ أدوار", "White Three-Tier Shelf", PHOTOS.whiteShelf, 1450, { sold90: 31 }],
    ["bathroom-shelf", "bathroom", "رف حمام بسلال", "Bathroom Shelf with Baskets", PHOTOS.bathShelf, 1650, { inStock: false, sold90: 19 }],
    ["glass-jar-mix", "jars", "برطمانات إزاز مشكلة", "Mixed Glass Jars", PHOTOS.jarMix, 540, { sold90: 88 }],
    ["snack-jars", "pantry", "برطمانات سناكس ٤ قطع", "Snack Jars, Set of 4", PHOTOS.snackJars, 420, { compareAtPrice: 480, sold90: 102 }],
  ],
});

export const TANZIM = editionTemplate({
  key: TANZIM_KEY,
  version: 3,
  changelog: "Tanzim v3: categories, section order",
  productPage: { thumbs: "side", band: "shelf", extras: ["product-shipping"], copy: { reviews: L("رأي اللي نظّموا", "From tidy homes"), related: L("الأكتر إعادة طلب", "Most reordered") } },
  name: L("تنظيم", "Tanzim"),
  description: L(
    "تنظيم البيت: الأكتر إعادة طلب ومواعيد التوصيل. أربع صفحات جاهزة.",
    "Home organisation: most reordered and delivery days. Four ready pages.",
  ),
  category: "home",
  style: ["minimal"],
  sortOrder: 680,
  palette: ["#fafafa", "#eef0f3", "#bae6fd", "#0ea5e9"],
  colors: {
    primary: "#0ea5e9",
    secondary: "#eef0f3",
    background: "#ffffff",
    foreground: "#1c2430",
    muted: "#566070",
    border: "#dfe3e8",
    accent: "#bae6fd",
  },
  fonts: { heading: "Alexandria", body: "Alexandria" },
  radius: 16,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "labels.search",
    "nav.0.href",
    "hero",
    "categories.title",
    "products.primary.title",
    "newsletter.title",
    "newsletter.line",
    "about",
    "contact",
    "faq",
    "photos.hero.tall",
    "photos.story",
    "custom.best-label",
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
    "custom.faq-6-question",
    "custom.faq-6-answer",
  ],
  // Six best sellers in compact rows; no category rows.
  optional: [],
  journey: { primary: "best-sellers", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
