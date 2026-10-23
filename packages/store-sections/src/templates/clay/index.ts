/**
 * Clay (template 16, cookware and tableware; Claude Design "Storefront
 * Templates"): warm paper, a burnt copper for actions and an apricot
 * highlight, Reem Kufi headings over Almarai and 8px corners. A
 * craft-and-recipes store: cook-along video, what we check, shop by
 * material, favourites, care steps, your tables and chat answers. Built
 * from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): hammered copper,
 * stoneware, mugs, jars and set tables. No people, hands or brand labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels } from "../library-template";

export const CLAY_KEY = "clay";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(CLAY_KEY, getDesign(id)!, { corners: 8, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  runnerTable: pexels(20428215),
  tableSetting: pexels(5814107, 900),
  mugsEarthy: pexels(28509629, 900),
  copperWall: pexels(32802279, 900),
  colourShelf: pexels(6611423, 900),
  copperPot: pexels(39521, 900),
  copperPans: pexels(37533988, 900),
  copperLids: pexels(10676873, 900),
  bowlsDark: pexels(3847438, 900),
  unglazedMugs: pexels(8063803, 900),
  utensilPot: pexels(30798748, 900),
  pantry: pexels(7262983, 900),
  board: pexels(9725823, 900),
  workshopShelf: pexels(11808240),
};

const NAME = L("نحاس وفخار", "Copper & Clay");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("نحاس مطروق يدوي من خان الخليلي", "Hand-hammered copper from Khan el-Khalili"),
    "الكود: SAVE10": L("الكود: CLAY10", "Code: CLAY10"),
    "م": L("ن", "C"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("عننا", "About"),
  },
  links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-ruled", {
  text: {
    "م": L("ن", "C"),
    "اسم متجرك": NAME,
    "منتجات أصلية بضمان، توصلك لحد البيت.": L("اطبخ على مهل وقدّم بشياكة.", "Cook slowly, serve beautifully."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ نحاس وفخار. كل الحقوق محفوظة.", "© 2026 Copper & Clay. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("video-shop", {
    photo: [undefined, PHOTOS.runnerTable],
    text: {
      "تسوق من الفيديو": L("اطبخ معانا", "Cook along"),
      "كل اللي في الفيديو": L("فطار جمعة على مهل", "A slow Friday breakfast"),
      "فيديو المنتجات": L("فيديو: فطار جمعة على مهل", "Video: a slow Friday breakfast"),
    },
  }),
  lib("features-side-title", {
    text: {
      "ليه الناس بترجع لنا تاني": L("معمول يتستخدم كل يوم", "Made to be used every day"),
      "أربع حاجات بنلتزم بيها في كل طلب.": L("٤ حاجات بنتأكد منها قبل ما أي حاجة تتعرض.", "Four things we check before anything goes on sale."),
      "توصيل سريع": L("تشطيب آمن للأكل", "Food-safe finishes"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("طلاء من غير رصاص وزيت آمن للأكل.", "Lead-free glazes and food-grade oil."),
      "الدفع عند الاستلام": L("تغليف للزجاج", "Packed for glass"),
      "أو ادفع بالبطاقة والمحفظة": L("علبتين لكل قطعة قابلة للكسر.", "Double boxes for every fragile piece."),
      "استرجاع سهل": L("تأمين ضد الكسر", "Breakage cover"),
      "١٤ يومًا لتغيّر رأيك": L("وصلت مكسورة؟ نبدّلها.", "Arrives broken? We replace it."),
      "دعم على واتساب": L("من ٢ لـ ٤ أيام", "2 to 4 days"),
      "أشخاص حقيقيون طوال الأسبوع": L("توصيل لكل مصر.", "Delivered across Egypt."),
    },
  }),
  lib("brands-tiles", {
    name: L("تسوق بالخامة", "Shop by material"),
    text: {
      "تسوّق حسب الماركة": L("تسوق بالخامة", "Shop by material"),
      "كل الماركات": L("كل المنتجات", "All products"),
      "فولتا": L("نحاس", "Copper"),
      "نورو": L("حجري", "Stoneware"),
      "كيان": L("خشب زيتون", "Olive wood"),
      "ساحل": L("فخار", "Clay"),
      "أوربت": L("زجاج", "Glass"),
      "ميزان": L("كتان", "Linen"),
      "لومو": L("بامبو", "Bamboo"),
      "زها": L("رخام", "Marble"),
      "وكيل معتمد": L("خامة طبيعية", "Natural material"),
    },
    links: {
      "/products": [SHOP, search("نحاس"), search("حجري"), search("خشب"), search("فخار"), search("زجاج"), search("كتان"), search("بامبو"), search("رخام")],
    },
  }),
  lib("products-grid", {
    as: "favourites",
    text: { "وصل حديثًا": L("المفضل في المطبخ", "Kitchen favourites"), "أحدث المنتجات اللي نزلت المتجر.": L("أكتر حاجات بتتطلب عندنا.", "What people order from us most.") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("text-steps", {
    text: {
      "إزاي ترجّع منتج": L("العناية بالنحاس والخشب", "Caring for your copper and wood"),
      "ابعتلنا على واتساب": L("اغسل باليد", "Hand wash"),
      "خلال ١٤ يوم من الاستلام مع رقم الطلب.": L("مية دافية وصابون خفيف، ومش في الغسالة.", "Warm water and mild soap, never the dishwasher."),
      "جهّز المنتج": L("نشّف على طول", "Dry at once"),
      "في علبته الأصلية بكل الإكسسوارات.": L("نشّفه على طول عشان الخشب ما ينتفخش.", "Wipe dry so wood does not swell."),
      "المندوب يستلم": L("زيّت كل شهر", "Oil monthly"),
      "خلال يومين شغل من عنوانك.": L("معلقة زيت آمن على الألواح.", "A spoon of food-grade oil on boards."),
      "فلوسك ترجع": L("لمّع النحاس", "Polish copper"),
      "بنفس طريقة الدفع خلال ٥ أيام.": L("ليمون وملح بيرجّعوا اللمعة.", "Lemon and salt bring back the shine."),
    },
  }),
  lib("gallery-polaroids", {
    photo: [undefined, undefined, undefined, PHOTOS.tableSetting, PHOTOS.mugsEarthy, PHOTOS.copperWall, PHOTOS.colourShelf, PHOTOS.bowlsDark],
    text: {
      "عملاؤنا": L("سفرتكم", "Your tables"),
      "أرسل لنا صورتك": L("ابعتلنا صورة سفرتك", "Send us your table"),
      "مريم": handle("@laila.n"),
      "عمر": handle("@hossam"),
      "نور": handle("@nada.e"),
      "يوسف": handle("@mariam"),
      "سلمى": handle("@omar"),
    },
  }),
  lib("faq-chat", {}),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عننا", "About us"), L("محل مطبخ بيشتغل مع ٥ ورش في مصر القديمة.", "A kitchen shop working with five workshops in Old Cairo.")),
  aboutStory(lib, {
    photo: PHOTOS.copperLids,
    alt: L("حلل نحاس مطروق على رف", "Hammered copper pots on a shelf"),
    eyebrow: L("خان الخليلي", "Khan el-Khalili"),
    title: L("نحاس مطروق في ورش بنعرفها", "Copper hammered in workshops we know"),
    text: L("كل حلة نحاس بتتطرق باليد في ورش خان الخليلي، وكل طبق حجري بيتحرق في فرن صغير.", "Every copper pot is hammered by hand in Khan el-Khalili, and every stoneware plate is fired in a small kiln."),
    more: L("ولو قطعة وصلت مكسورة، بنبدّلها.", "And if a piece arrives broken, we replace it."),
    button: L("تسوق كل المنتجات", "Shop all"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("اطبخ على مهل وقدّم بشياكة.", "Cook slowly, serve beautifully."),
  categories: [
    ["cook", "نحاس وطبخ", "Copper & cooking", PHOTOS.copperPot],
    ["serve", "أطباق حجري", "Stoneware", PHOTOS.bowlsDark],
    ["mugs", "مجات وفناجين", "Mugs & cups", PHOTOS.mugsEarthy],
    ["store", "برطمانات وتخزين", "Jars & storage", PHOTOS.pantry],
  ],
  products: [
    ["hammered-copper-pot", "cook", "حلة نحاس مطروق", "Hammered Copper Pot", PHOTOS.copperPot, 1850, { isFeatured: true, rating: 4.9, sold90: 66 }],
    ["copper-casserole-set", "cook", "طقم طواجن نحاس", "Copper Casserole Set", PHOTOS.copperLids, 3200, { compareAtPrice: 3600, sold90: 21 }],
    ["copper-pan-stack", "cook", "طقم طاسات نحاس", "Copper Pan Stack", PHOTOS.copperPans, 2400, { sold90: 18 }],
    ["olive-wood-board", "cook", "لوح خشب زيتون", "Olive Wood Board", PHOTOS.board, 780, { rating: 4.8, sold90: 150 }],
    ["stoneware-dinner-set", "serve", "طقم عشا حجري", "Stoneware Dinner Set", PHOTOS.bowlsDark, 1450, { isFeatured: true, sold90: 96 }],
    ["earthy-mug-pair", "mugs", "زوج مج فخار", "Earthy Mug Pair", PHOTOS.mugsEarthy, 390, { rating: 4.8, sold90: 120 }],
    ["unglazed-mug-set", "mugs", "طقم مجات خام", "Raw Clay Mug Set", PHOTOS.unglazedMugs, 520, { sold90: 44 }],
    ["beech-utensil-set", "cook", "طقم أدوات زان", "Beech Utensil Set", PHOTOS.utensilPot, 320, { compareAtPrice: 390, sold90: 98 }],
    ["pantry-jar-set", "store", "طقم برطمانات مخزن", "Pantry Jar Set", PHOTOS.pantry, 650, { inStock: false, sold90: 212 }],
  ],
});

export const CLAY = libraryTemplate({
  key: CLAY_KEY,
  version: 3,
  changelog: "Clay v3: product page",
  name: L("كلاي", "Clay"),
  description: L(
    "نحاس وفخار: فيديو طبخ، تسوق بالخامة، العناية بالنحاس وسفرة العملاء. أربع صفحات جاهزة.",
    "Copper and clay: a cook-along video, shop by material, copper care and customers' tables. Four ready pages.",
  ),
  category: "kitchen",
  sortOrder: 160,
  palette: ["#faf5ee", "#f0e2d1", "#e9b07a", "#a8572a"],
  colors: {
    primary: "#a8572a",
    secondary: "#f0e2d1",
    background: "#faf5ee",
    foreground: "#3a241a",
    muted: "#6d564a",
    border: "#e6d4bf",
    accent: "#e9b07a",
  },
  fonts: { heading: "Reem Kufi", body: "Almarai" },
  radius: 8,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عننا", "About"), seo: { title: L("عن نحاس وفخار", "About Copper & Clay") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("ورش خان الخليلي، شارع المعز، القاهرة.", "Khan el-Khalili workshops, Al Muizz St, Cairo."),
        heading: L("اسألنا عن النحاس", "Ask us about copper"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("العناية والتغليف والتوصيل.", "Care, packing and delivery."),
        question: L("النحاس آمن للطبخ؟", "Is the copper safe to cook in?"),
        answer: L(
          "كل الحلل مبطّنة بالقصدير من جوه، فآمنة للطبخ. لمّعها من بره بليمون وملح.",
          "Every pot is tin-lined inside, so it is safe to cook in. Polish the outside with lemon and salt.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: { thumbs: "side", band: "shelf", extras: ["product-perks"], copy: { back: L("رجوع للمتجر", "Back to the shop"), reviews: L("الطبخ بيقول إيه", "From the kitchen"), related: L("أدوات من نفس الخامة", "More in the same material") } },
});
