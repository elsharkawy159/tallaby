/**
 * The coffee gear pack (niche editions, ROADMAP F-90): "Fingan", a coffee
 * gear shop of Turkish coffee pots and grinders, pour-over brewers,
 * espresso machines and tools. Data only; `qahwa` draws it.
 *
 * Photos: generated from `docs/systems/editions-photos.md` (received
 * 2026-11-15, checked by eye: unbranded machines, no people, hands, labels
 * or logos), in the public `library-media` bucket, `editions/coffee-gear/`:
 * twelve white-background packshots named by slug and eight scenes as
 * `scene-<slot>`.
 *
 * Look: `qahwa`, the niche's template (one template per niche). Its hero is
 * one big word with the first featured product, then the category chips and
 * a rail of products beside a panel; no category rows, so three products per
 * category are enough. No `reviews`: a pack holds no invented buyer quotes or
 * ratings, and without them `qahwa` leaves its reviews out.
 */
import { L } from "../../../../designs/_kit";
import { demoStore } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "coffee-gear";
const P = (slug: string) => editionPhoto(NICHE, slug);
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

export const COFFEE_GEAR: Edition = {
  niche: NICHE,
  looks: ["qahwa"],
  priceBand: { min: 200, max: 12000 },
  // Square packshots on pure white: a square white stage shows each tool whole.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("فنجان", "Fingan"),
    description: L("كنك ومطاحن وماكينات إسبريسو وأدوات قهوة.", "Coffee pots, grinders, espresso machines and coffee tools."),
    categories: [
      ["turkish", "القهوة التركية", "Turkish coffee", TILES[0]!],
      ["brewers", "أدوات التقطير", "Pour-over & brewers", TILES[1]!],
      ["espresso", "الإسبريسو والماكينات", "Espresso & machines", TILES[2]!],
      ["grinders", "مطاحن وأدوات", "Grinders & tools", TILES[3]!],
    ],
    // The first featured product is the big-word hero's packshot.
    products: [
      ["copper-kanaka", "turkish", "كنكة نحاس مطروق", "Hammered Copper Cezve", P("copper-kanaka"), 450, { isFeatured: true, rating: 4.9, sold90: 214 }],
      ["black-espresso-machine", "espresso", "ماكينة إسبريسو سوداء", "Black Espresso Machine", P("black-espresso-machine"), 8900, { isFeatured: true, rating: 4.7, sold90: 46 }],
      ["ceramic-v-dripper", "brewers", "قمع تقطير سيراميك بإبريق زجاجي", "Ceramic Dripper with Glass Server", P("ceramic-v-dripper"), 650, { isFeatured: true, rating: 4.7, sold90: 103 }],
      ["burr-coffee-grinder-black", "grinders", "مطحنة بن كهربائية", "Electric Burr Grinder", P("burr-coffee-grinder-black"), 2650, { rating: 4.6, sold90: 64 }],
      ["steel-kanaka-set", "turkish", "طقم ٣ كنك ستانلس", "Steel Cezve Set of 3", P("steel-kanaka-set"), 520, { rating: 4.6, sold90: 132 }],
      ["capsule-coffee-machine", "espresso", "ماكينة قهوة كبسولات", "Capsule Coffee Machine", P("capsule-coffee-machine"), 3900, { rating: 4.5, sold90: 58 }],
      ["glass-french-press", "brewers", "مكبس قهوة فرنسي زجاجي", "Glass French Press", P("glass-french-press"), 590, { rating: 4.7, sold90: 121 }],
      ["coffee-scale-off", "grinders", "ميزان قهوة", "Coffee Scale", P("coffee-scale-off"), 750, { rating: 4.6, sold90: 77 }],
      ["brass-hand-grinder", "turkish", "مطحنة بن نحاسية يدوية", "Brass Hand Grinder", P("brass-hand-grinder"), 980, { rating: 4.8, sold90: 88 }],
      ["steel-portafilter", "espresso", "حامل فلتر ستانلس بمقبض خشبي", "Steel Portafilter with Wooden Handle", P("steel-portafilter"), 690, { rating: 4.5, sold90: 39 }],
      ["steel-moka-pot", "brewers", "إبريق موكا ستانلس", "Steel Moka Pot", P("steel-moka-pot"), 620, { rating: 4.8, sold90: 156 }],
      ["espresso-tamper", "grinders", "مكبس إسبريسو بمقبض من خشب الجوز", "Espresso Tamper with Walnut Handle", P("espresso-tamper"), 420, { compareAtPrice: 490, rating: 4.6, sold90: 52 }],
    ],
  }),
  photos: {
    hero: { wide: scene("hero-wide"), tall: scene("hero-tall") },
    tiles: TILES,
    // Drawn by no look today.
    banner: scene("banner"),
    // `qahwa`'s about page.
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("كنك ومطاحن وماكينات إسبريسو", "Cezves, grinders and espresso machines"),
      L("صور ومواصفات لكل منتج", "Photos and specs for every product"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    hero: {
      alt: L("كنكة نحاسية فيها قهوة بالوش بجوار فنجان على صينية نحاسية", "A copper cezve of foamy coffee beside a cup on a brass tray"),
      eyebrow: L("أدوات القهوة", "Coffee gear"),
      title: L("قهوة", "COFFEE"),
      line: L("كنك ومطاحن وماكينات إسبريسو لفنجان الصباح.", "Cezves, grinders and espresso machines for your morning cup."),
      cta: L("تسوّق الأدوات", "Shop the gear"),
    },
    categories: { title: L("تصفح", "Browse") },
    products: {
      primary: {
        title: L("ابدأ قهوة البيت", "Start your home coffee"),
        line: L("كنك ومطاحن وأقماع تقطير بأقل من ١٠٠٠ ج.م.", "Cezves, grinders and drippers under EGP 1,000."),
      },
    },
    story: {
      alt: L("طاولة عمل عليها جوال بن أخضر ومطحنة يدوية وأدوات تقطير", "A workbench with a sack of green beans, a hand grinder and brewing tools"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("أدوات لكل طريقة تحضير", "Tools for every brewing method"),
      text: L("نختار أدوات القهوة لكل طريقة تحضير، من الكنكة حتى الإسبريسو.", "We choose coffee tools for every brewing method, from the cezve to espresso."),
      cta: L("تسوّق الأدوات", "Shop the gear"),
    },
    trust: [
      { title: L("صور ومواصفات", "Photos and specs"), line: L("لكل منتج", "For every product") },
      { title: L("تشكيلة متنوعة", "A full range"), line: L("تركي وتقطير وإسبريسو", "Turkish, pour-over and espresso") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("نصائح تحضير القهوة", "Coffee brewing tips"),
      line: L("رسالة شهرية فيها طريقة تحضير وأحدث المنتجات.", "A monthly letter with a brewing method and our newest products."),
    },
    about: {
      line: L("كنك ومطاحن وماكينات إسبريسو لفنجان الصباح.", "Cezves, grinders and espresso machines for your morning cup."),
      alt: L("طاولة عمل عليها جوال بن أخضر ومطحنة يدوية وأدوات تقطير", "A workbench with a sack of green beans, a hand grinder and brewing tools"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("من الكنكة للإسبريسو", "From the cezve to espresso"),
      text: L(
        "نختار أدوات القهوة: كنك نحاسية ومطاحن يدوية وأقماع تقطير وماكينات إسبريسو صغيرة، ونذكر مواصفات كل أداة في صفحتها.",
        "We choose coffee tools: copper cezves, hand grinders, drippers and compact espresso machines, with each tool's specs on its page.",
      ),
      more: L("ولأي سؤال عن اختيار الأدوات، تواصل معنا.", "For any question about choosing gear, contact us."),
      cta: L("تسوّق الأدوات", "Shop the gear"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L("تحتار بين الموكا والتقطير والإسبريسو؟ اسألنا.", "Not sure between moka, drip and espresso? Ask us."),
      heading: L("عن أداة أو طلب", "About a tool or an order"),
    },
    faq: {
      line: L("الأدوات والتحضير وطريقة الطلب.", "Gear, brewing and ordering."),
      question: L("بماذا أبدأ؟", "Where do I start?"),
      answer: L(
        "إذا كنت تفضّل القهوة التركية فابدأ بكنكة ومطحنة يدوية، وإذا كنت تفضّل القهوة الخفيفة فابدأ بقمع تقطير وميزان.",
        "If you like Turkish coffee, start with a cezve and a hand grinder; if you like lighter coffee, start with a dripper and a scale.",
      ),
    },
    custom: {
      // `qahwa`: the header's links to the whole catalog and to the best sellers.
      "shop-all": L("كل الأدوات", "All gear"),
      "best-label": L("الأكثر طلباً", "Most ordered"),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("يكمل ركن القهوة", "Completes the coffee corner") } },
};
