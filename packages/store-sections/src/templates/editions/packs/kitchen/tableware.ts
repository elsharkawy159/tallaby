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
    description: L("أطباق وأكواب وأطقم شاي وأدوات تقديم.", "Plates, glasses, tea sets and serveware."),
    categories: [
      ["dinnerware", "أطباق", "Dinnerware", TILES[0]!],
      ["glassware", "أكواب ومجات", "Glassware & mugs", TILES[1]!],
      ["tea-coffee", "أطقم شاي وقهوة", "Tea & coffee sets", TILES[2]!],
      ["cutlery", "ملاعق وأدوات تقديم", "Cutlery & serving", TILES[3]!],
    ],
    products: [
      ["gold-rim-dinner-set", "dinnerware", "طقم أطباق بحافة ذهبية", "Gold Rim Dinner Set", P("gold-rim-dinner-set"), 2450, { isFeatured: true, rating: 4.8, sold90: 132 }],
      ["egyptian-tea-glasses-set", "tea-coffee", "طقم ٦ أكواب شاي بأطباق", "Tea Glasses with Saucers, Set of 6", P("egyptian-tea-glasses-set"), 390, { isFeatured: true, rating: 4.9, sold90: 268 }],
      ["gold-cutlery-set", "cutlery", "طقم ملاعق ذهبي لفرد واحد", "Gold Cutlery Set for One", P("gold-cutlery-set"), 320, { isFeatured: true, rating: 4.6, sold90: 154 }],
      ["gold-rim-juice-glasses", "glassware", "٤ أكواب عصير بحافة ذهبية", "Gold Rim Juice Glasses, Set of 4", P("gold-rim-juice-glasses"), 450, { isFeatured: true, rating: 4.7, sold90: 176 }],
      ["white-porcelain-dinner-set", "dinnerware", "طقم أطباق بورسلين أبيض", "White Porcelain Dinner Set", P("white-porcelain-dinner-set"), 1650, { rating: 4.7, sold90: 141 }],
      ["porcelain-tea-set", "tea-coffee", "طقم شاي بورسلين بإبريق", "Porcelain Tea Set with Teapot", P("porcelain-tea-set"), 1350, { rating: 4.8, sold90: 98 }],
      ["wooden-serving-board", "cutlery", "لوح تقديم من خشب الأكاسيا", "Acacia Serving Board", P("wooden-serving-board"), 380, { rating: 4.7, sold90: 121 }],
      ["clear-water-glasses", "glassware", "٦ أكواب ماء شفافة", "Clear Water Glasses, Set of 6", P("clear-water-glasses"), 290, { rating: 4.6, sold90: 213 }],
      ["cobalt-pattern-plates", "dinnerware", "طبقان بنقشة كوبالت", "Cobalt Pattern Plates, Pair", P("cobalt-pattern-plates"), 520, { rating: 4.6, sold90: 87 }],
      ["turkish-coffee-cups-set", "tea-coffee", "طقم ٦ فناجين قهوة بنقشة ذهبية", "Turkish Coffee Cups, Set of 6", P("turkish-coffee-cups-set"), 690, { rating: 4.8, sold90: 164 }],
      ["steel-cutlery-set", "cutlery", "طقم ملاعق ستانلس لفرد واحد", "Brushed Steel Cutlery Set for One", P("steel-cutlery-set"), 220, { rating: 4.5, sold90: 139 }],
      ["ceramic-mug-pair", "glassware", "مجّان من السيراميك", "Ceramic Mug Pair", P("ceramic-mug-pair"), 340, { compareAtPrice: 390, rating: 4.6, sold90: 118 }],
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
      L("أطباق وأكواب وأطقم شاي", "Plates, glasses and tea sets"),
      L("صور ومقاسات لكل قطعة", "Photos and sizes for every piece"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    nav: [
      { label: L("الأطباق", "Dinnerware"), href: search("أطباق") },
      { label: L("أطقم الشاي", "Tea sets"), href: search("شاي") },
    ],
    hero: {
      alt: L("مائدة مجهّزة بأطباق بحافة ذهبية وأكواب شاي في ضوء الغروب", "A table laid with gold-rim plates and tea glasses in sunset light"),
      eyebrow: L("أدوات المائدة", "Tableware"),
      title: L("أدوات مائدة لكل مناسبة", "Tableware for every occasion"),
      line: L("أطباق وأكواب وأطقم شاي بألوان تتناسق معًا.", "Plates, glasses and tea sets in colours that go together."),
      cta: L("تسوّق الأطباق", "Shop dinnerware"),
    },
    categories: { title: L("جهّز مائدتك", "Set your table") },
    products: { primary: { eyebrow: L("اختيارنا", "Our pick"), title: L("طقم المائدة", "The table set"), line: L("قطع تجهّز مائدة كاملة.", "The pieces that set a whole table.") } },
    story: {
      alt: L("ورشة بورسلين فيها أطباق بيضاء على رفوف وألوان كوبالت", "A porcelain workshop with white plates on racks and cobalt paints"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("خامات ومقاسات واضحة", "Clear materials and sizes"),
      text: L("نذكر خامة كل قطعة ومقاسها وطريقة غسلها في صفحتها.", "Each piece's page lists its material, size and washing care."),
      cta: L("كل المنتجات", "Shop all"),
    },
    trust: [
      { title: L("صور ومقاسات", "Photos and sizes"), line: L("لكل قطعة", "For every piece") },
      { title: L("تشكيلة متنوعة", "A full range"), line: L("أطباق وأكواب وأطقم شاي", "Plates, glasses and tea sets") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("قطع جديدة قبل كل موسم", "New pieces before every season"),
      line: L("رسالة واحدة قبل رمضان والأعياد بالأطقم الجديدة.", "One letter before Ramadan and the holidays with the new sets."),
    },
    about: {
      line: L("أطباق وأكواب وأطقم شاي وأدوات تقديم.", "Plates, glasses, tea sets and serveware."),
      alt: L("ورشة بورسلين فيها أطباق بيضاء على رفوف وألوان كوبالت", "A porcelain workshop with white plates on racks and cobalt paints"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("أدوات مائدة تتناسق معًا", "Tableware that goes together"),
      text: L(
        "نختار الأطباق والأكواب وأطقم الشاي بألوان تتناسق معًا، ونذكر خامة كل قطعة وطريقة العناية بها.",
        "We choose plates, glasses and tea sets in colours that go together, and list each piece's material and care.",
      ),
      more: L("ولأي سؤال عن القطع، تواصل معنا.", "For any question about our pieces, contact us."),
      cta: L("كل المنتجات", "Shop all"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L("اسألنا عن طقم لعدد معيّن أو عن قطعة.", "Ask us about a set for a number of people or a single piece."),
      heading: L("اسأل عن طلبك أو عن قطعة", "Ask about your order or a piece"),
    },
    faq: {
      line: L("الخامات والمقاسات وطريقة الطلب.", "Materials, sizes and ordering."),
      question: L("هل تصلح الأطباق لغسالة الأطباق؟", "Are the plates dishwasher-safe?"),
      answer: L("طريقة غسل كل قطعة مذكورة في صفحتها.", "Each piece's washing care is on its page."),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("يكمل المائدة", "Completes the table") } },
};
