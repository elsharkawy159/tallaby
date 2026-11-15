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
    description: L("كنك ومطاحن ومكن إسبريسو وأدوات قهوة لفنجان الصبح.", "Coffee pots, grinders, espresso machines and tools for your morning cup."),
    categories: [
      ["turkish", "القهوة التركي", "Turkish coffee", TILES[0]!],
      ["brewers", "أدوات التقطير", "Pour-over & brewers", TILES[1]!],
      ["espresso", "إسبريسو ومكن", "Espresso & machines", TILES[2]!],
      ["grinders", "مطاحن وأدوات", "Grinders & tools", TILES[3]!],
    ],
    // The first featured product is the big-word hero's packshot.
    products: [
      ["copper-kanaka", "turkish", "كنكة نحاس مطروق", "Hammered Copper Cezve", P("copper-kanaka"), 450, { isFeatured: true, rating: 4.9, sold90: 214 }],
      ["black-espresso-machine", "espresso", "ماكينة إسبريسو سودا", "Black Espresso Machine", P("black-espresso-machine"), 8900, { isFeatured: true, rating: 4.7, sold90: 46 }],
      ["ceramic-v-dripper", "brewers", "دريبر سيراميك بإبريق زجاج", "Ceramic Dripper with Glass Server", P("ceramic-v-dripper"), 650, { isFeatured: true, rating: 4.7, sold90: 103 }],
      ["burr-coffee-grinder-black", "grinders", "مطحنة بن كهربا", "Electric Burr Grinder", P("burr-coffee-grinder-black"), 2650, { rating: 4.6, sold90: 64 }],
      ["steel-kanaka-set", "turkish", "طقم ٣ كنك ستانلس", "Steel Cezve Set of 3", P("steel-kanaka-set"), 520, { rating: 4.6, sold90: 132 }],
      ["capsule-coffee-machine", "espresso", "ماكينة قهوة كبسولات", "Capsule Coffee Machine", P("capsule-coffee-machine"), 3900, { rating: 4.5, sold90: 58 }],
      ["glass-french-press", "brewers", "فرنش برس زجاج", "Glass French Press", P("glass-french-press"), 590, { rating: 4.7, sold90: 121 }],
      ["coffee-scale-off", "grinders", "ميزان قهوة", "Coffee Scale", P("coffee-scale-off"), 750, { rating: 4.6, sold90: 77 }],
      ["brass-hand-grinder", "turkish", "مطحنة بن نحاس يدوي", "Brass Hand Grinder", P("brass-hand-grinder"), 980, { rating: 4.8, sold90: 88 }],
      ["steel-portafilter", "espresso", "بورتافلتر ستانلس بيد خشب", "Steel Portafilter with Wooden Handle", P("steel-portafilter"), 690, { rating: 4.5, sold90: 39 }],
      ["steel-moka-pot", "brewers", "موكا ستانلس", "Steel Moka Pot", P("steel-moka-pot"), 620, { rating: 4.8, sold90: 156 }],
      ["espresso-tamper", "grinders", "تامبر إسبريسو بيد جوز", "Espresso Tamper with Walnut Handle", P("espresso-tamper"), 420, { compareAtPrice: 490, rating: 4.6, sold90: 52 }],
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
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("الدفع عند الاستلام", "Cash on delivery"),
      L("بنطحنلك البن على طريقتك", "We grind your beans your way"),
    ],
    hero: {
      alt: L("كنكة نحاس فيها قهوة بوش جنب فنجان على صينية نحاس", "A copper cezve of foamy coffee beside a cup on a brass tray"),
      eyebrow: L("أدوات القهوة", "Coffee gear"),
      title: L("قهوة", "COFFEE"),
      line: L("كنك ومطاحن ومكن إسبريسو لفنجان الصبح.", "Cezves, grinders and espresso machines for your morning cup."),
      cta: L("تسوق الأدوات", "Shop the gear"),
    },
    categories: { title: L("تصفح", "Browse") },
    products: {
      primary: {
        title: L("ابدأ قهوة البيت", "Start your home coffee"),
        line: L("كنك ومطاحن ودريبر تحت ١٠٠٠ ج.م.", "Cezves, grinders and drippers under EGP 1,000."),
      },
    },
    story: {
      alt: L("ترابيزة شغل فيها شوال بن أخضر ومطحنة يدوي وأدوات تقطير", "A workbench with a sack of green beans, a hand grinder and brewing tools"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("فنجان الصبح يستاهل", "Your morning cup deserves it"),
      text: L("بنجمع أدوات القهوة اللي بنستعملها في البيت.", "We gather the coffee tools we use at home."),
      cta: L("تسوق الأدوات", "Shop the gear"),
    },
    trust: [
      { title: L("توصيل لكل مصر", "Delivery across Egypt"), line: L("لحد باب البيت", "To your door") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفع لما الطلب يوصل", "Pay when your order arrives") },
      { title: L("نصيحة قبل الشراء", "Advice before you buy"), line: L("موكا ولا دريب؟ اسألنا", "Moka or drip? Ask us") },
      { title: L("استبدال سهل", "Easy exchange"), line: L("خلال ١٤ يوم", "Within 14 days") },
    ],
    newsletter: {
      title: L("نصايح قهوة البيت", "Home coffee tips"),
      line: L("رسالة كل شهر فيها طريقة تحضير والجديد في المحل.", "A monthly letter with a brewing method and what is new in the shop."),
    },
    about: {
      line: L("كنك ومطاحن ومكن إسبريسو لفنجان الصبح.", "Cezves, grinders and espresso machines for your morning cup."),
      alt: L("ترابيزة شغل فيها شوال بن أخضر ومطحنة يدوي وأدوات تقطير", "A workbench with a sack of green beans, a hand grinder and brewing tools"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("من الكنكة للإسبريسو", "From the cezve to espresso"),
      text: L(
        "بنجمع أدوات قهوة بنستعملها في البيت: كنك نحاس ومطاحن يدوي ودريبر ومكن إسبريسو صغيرة، وبنجرب كل أداة قبل ما تنزل.",
        "We gather the coffee tools we use at home: copper cezves, hand grinders, drippers and compact espresso machines, and try every one before we list it.",
      ),
      more: L("ولو محتار تبدأ بإيه، ابعتلنا وإحنا نقولك.", "If you are unsure where to start, message us and we tell you."),
      cta: L("تسوق الأدوات", "Shop the gear"),
    },
    contact: {
      title: L("تواصل", "Contact"),
      line: L("محتار تختار موكا ولا دريب ولا إسبريسو؟ ابعتلنا.", "Not sure between moka, drip and espresso? Ask us."),
      heading: L("عن أداة أو طلب", "About a tool or an order"),
    },
    faq: {
      line: L("الأدوات والتحضير والتوصيل.", "Gear, brewing and delivery."),
      question: L("أبدأ بإيه لو أول مرة؟", "Where do I start?"),
      answer: L(
        "لو بتحب القهوة التركي ابدأ بكنكة ومطحنة يدوي، ولو بتحب القهوة الخفيفة ابدأ بدريبر وميزان.",
        "If you like Turkish coffee, start with a cezve and a hand grinder; if you like lighter coffee, start with a dripper and a scale.",
      ),
    },
    custom: {
      // `qahwa`: the header's links to the whole catalog and to the best sellers.
      "shop-all": L("كل الأدوات", "All gear"),
      "best-label": L("الأكثر طلباً", "Most ordered"),
    },
  },
  productPage: { copy: { reviews: L("رأي اللي حضّروا بيها", "From people who brew with it"), related: L("يكمّل ركن القهوة", "Completes the coffee corner") } },
};
