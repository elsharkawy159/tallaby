/**
 * The tableware pack (niche editions, ROADMAP F-90): "Lamma", a tableware
 * shop of dinnerware, glassware and mugs, tea and coffee sets, and cutlery
 * and serving pieces for family gatherings. Data only; `sufra` draws it.
 *
 * Photos: generated from `docs/systems/editions-photos.md` (received
 * 2026-11-15, checked by eye: no people, hands, labels or logos), in the
 * public `library-media` bucket, `editions/tableware/`: twelve
 * white-background packshots named by slug and eight scenes as
 * `scene-<slot>`.
 *
 * Look: `sufra`, the niche's template (one template per niche). Its home
 * shows a full-bleed hero, the category tiles, the featured products, the
 * open-box and budget blocks and the delivery questions; no category rows,
 * so three products per category are enough.
 */
import { L } from "../../../../designs/_kit";
import { demoStore } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "tableware";
const P = (slug: string) => editionPhoto(NICHE, slug);
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

/** Category tiles, 3:4, in the categories' order. */
const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

export const TABLEWARE: Edition = {
  niche: NICHE,
  looks: ["sufra"],
  priceBand: { min: 150, max: 4000 },
  // Square packshots on pure white: a square white stage shows each set whole.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("لمّة", "Lamma"),
    description: L("أطباق وكوبايات وأطقم شاي لسفرة العيلة.", "Plates, glasses and tea sets for the family table."),
    categories: [
      ["dinnerware", "أطباق", "Dinnerware", TILES[0]!],
      ["glassware", "كوبايات ومجات", "Glassware & mugs", TILES[1]!],
      ["tea-coffee", "أطقم شاي وقهوة", "Tea & coffee sets", TILES[2]!],
      ["cutlery", "معالق وتقديم", "Cutlery & serving", TILES[3]!],
    ],
    products: [
      ["gold-rim-dinner-set", "dinnerware", "طقم أطباق بحرف دهبي", "Gold Rim Dinner Set", P("gold-rim-dinner-set"), 2450, { isFeatured: true, rating: 4.8, sold90: 132 }],
      ["egyptian-tea-glasses-set", "tea-coffee", "طقم ٦ كوبايات شاي بأطباق", "Tea Glasses with Saucers, Set of 6", P("egyptian-tea-glasses-set"), 390, { isFeatured: true, rating: 4.9, sold90: 268 }],
      ["gold-cutlery-set", "cutlery", "طقم معالق دهبي لفرد", "Gold Cutlery Set for One", P("gold-cutlery-set"), 320, { isFeatured: true, rating: 4.6, sold90: 154 }],
      ["gold-rim-juice-glasses", "glassware", "٤ كوبايات عصير بحرف دهبي", "Gold Rim Juice Glasses, Set of 4", P("gold-rim-juice-glasses"), 450, { isFeatured: true, rating: 4.7, sold90: 176 }],
      ["white-porcelain-dinner-set", "dinnerware", "طقم أطباق بورسلين أبيض", "White Porcelain Dinner Set", P("white-porcelain-dinner-set"), 1650, { rating: 4.7, sold90: 141 }],
      ["porcelain-tea-set", "tea-coffee", "طقم شاي بورسلين بإبريق", "Porcelain Tea Set with Teapot", P("porcelain-tea-set"), 1350, { rating: 4.8, sold90: 98 }],
      ["wooden-serving-board", "cutlery", "لوح تقديم خشب أكاسيا", "Acacia Serving Board", P("wooden-serving-board"), 380, { rating: 4.7, sold90: 121 }],
      ["clear-water-glasses", "glassware", "٦ كوبايات مية شفافة", "Clear Water Glasses, Set of 6", P("clear-water-glasses"), 290, { rating: 4.6, sold90: 213 }],
      ["cobalt-pattern-plates", "dinnerware", "طبقين بنقشة كوبالت", "Cobalt Pattern Plates, Pair", P("cobalt-pattern-plates"), 520, { rating: 4.6, sold90: 87 }],
      ["turkish-coffee-cups-set", "tea-coffee", "طقم ٦ فناجين قهوة بنقشة دهبي", "Turkish Coffee Cups, Set of 6", P("turkish-coffee-cups-set"), 690, { rating: 4.8, sold90: 164 }],
      ["steel-cutlery-set", "cutlery", "طقم معالق ستانلس لفرد", "Brushed Steel Cutlery Set for One", P("steel-cutlery-set"), 220, { rating: 4.5, sold90: 139 }],
      ["ceramic-mug-pair", "glassware", "مجّين سيراميك", "Ceramic Mug Pair", P("ceramic-mug-pair"), 340, { compareAtPrice: 390, rating: 4.6, sold90: 118 }],
    ],
  }),
  photos: {
    // `sufra`'s full-bleed hero.
    hero: { wide: scene("hero-wide"), tall: scene("hero-tall") },
    tiles: TILES,
    // Drawn by no look today.
    banner: scene("banner"),
    // `sufra`'s about page.
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("افتح الطلب قبل ما تدفع", "Open your order before you pay"),
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("كل قطعة متغلفة ضد الكسر", "Every piece packed against breaking"),
    ],
    nav: [
      { label: L("الأطباق", "Dinnerware"), href: search("أطباق") },
      { label: L("أطقم الشاي", "Tea sets"), href: search("شاي") },
    ],
    hero: {
      alt: L("سفرة متجهزة بأطباق بحرف دهبي وكوبايات شاي في نور الغروب", "A table laid with gold-rim plates and tea glasses in sunset light"),
      eyebrow: L("سفرة العيلة", "The family table"),
      title: L("سفرة تلم الكل", "A table for everyone"),
      line: L("أطباق وكوبايات وأطقم شاي تستحمل العزايم والغسيل بعدها.", "Plates, glasses and tea sets that survive the gatherings and the washing-up after."),
      cta: L("تسوق الأطباق", "Shop dinnerware"),
    },
    categories: { title: L("جهّز سفرتك", "Set your table") },
    products: { primary: { eyebrow: L("اختيارنا", "Our pick"), title: L("طقم العزومة", "The gathering set"), line: L("القطع اللي بتجهز سفرة كاملة.", "The pieces that set a whole table.") } },
    story: {
      alt: L("ورشة بورسلين فيها أطباق بيضا على رفوف وألوان كوبالت", "A porcelain workshop with white plates on racks and cobalt paints"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("قطع بتعيش سنين", "Pieces that last for years"),
      text: L("بنختار الأطباق والكوبايات اللي بتستحمل الاستعمال كل يوم.", "We choose plates and glasses that stand up to daily use."),
      cta: L("كل المنتجات", "Shop all"),
    },
    trust: [
      { title: L("افتح قبل ما تدفع", "Open before you pay"), line: L("قدام المندوب", "In front of the courier") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفع لما الطلب يوصل", "Pay when your order arrives") },
      { title: L("تغليف ضد الكسر", "Break-proof packing"), line: L("كل قطعة لوحدها", "Every piece on its own") },
      { title: L("استبدال سهل", "Easy exchange"), line: L("لو فيه قطعة مكسورة", "If a piece arrives broken") },
    ],
    newsletter: {
      title: L("قطع جديدة قبل كل موسم", "New pieces before every season"),
      line: L("إيميل واحد قبل رمضان والأعياد بالأطقم الجديدة.", "One email before Ramadan and the holidays with the new sets."),
    },
    about: {
      line: L("أطباق وكوبايات وأطقم شاي لسفرة العيلة.", "Plates, glasses and tea sets for the family table."),
      alt: L("ورشة بورسلين فيها أطباق بيضا على رفوف وألوان كوبالت", "A porcelain workshop with white plates on racks and cobalt paints"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("سفرة بتلم العيلة", "A table that gathers the family"),
      text: L(
        "بنختار الأطباق والكوبايات وأطقم الشاي اللي بتستحمل عزومة كبيرة والغسيل بعدها، وبألوان تمشي مع بعض.",
        "We choose plates, glasses and tea sets that survive a big gathering and the washing-up after, in colours that go together.",
      ),
      more: L("وبتفتح الطلب قدام المندوب قبل ما تدفع.", "And you open your order in front of the courier before you pay."),
      cta: L("كل المنتجات", "Shop all"),
    },
    contact: {
      title: L("تواصل", "Contact"),
      line: L("اسألنا عن طقم لعدد معيّن أو عن قطعة.", "Ask us about a set for a number of people or a single piece."),
      heading: L("اسأل عن طلبك أو عن قطعة", "Ask about your order or a piece"),
    },
    faq: {
      line: L("التوصيل والدفع والاستبدال.", "Delivery, payment and exchanges."),
      question: L("لو طبق وصل مكسور؟", "What if a plate arrives chipped?"),
      answer: L("افتح العلبة قدام المندوب. لو فيه حاجة مكسورة رجّعها معاه وبنبدلها.", "Open the box in front of the courier. If anything is chipped, send it back with him and we replace it."),
    },
  },
  productPage: { copy: { reviews: L("رأي اللي عزموا بيها", "From people who hosted with it"), related: L("يكمّل السفرة", "Completes the table") } },
};
