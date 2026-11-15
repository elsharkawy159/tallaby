/**
 * The cookware pack (niche editions, ROADMAP F-90): "Hella", a cookware shop
 * of pots and sets, pans, ovenware and tagines, and utensils and knives for
 * everyday Egyptian cooking. Data only; `matbakh` draws it.
 *
 * Photos: generated from `docs/systems/editions-photos.md` (received
 * 2026-11-15, checked by eye: no people, hands, labels or logos), in the
 * public `library-media` bucket, `editions/cookware/`: twelve
 * white-background packshots named by slug and eight scenes as
 * `scene-<slot>`.
 *
 * Look: `matbakh`, the niche's template (one template per niche). Its home
 * shows the four categories as photo tiles (one `nav` link each, in the
 * categories' order), a tabbed block, a budget block, the open-box steps and
 * four promises; no category rows, so three products per category are
 * enough.
 */
import { L } from "../../../../designs/_kit";
import { demoStore } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "cookware";
const P = (slug: string) => editionPhoto(NICHE, slug);
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

/** Category tiles, 3:4, in the categories' order. */
const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

export const COOKWARE: Edition = {
  niche: NICHE,
  looks: ["matbakh"],
  priceBand: { min: 150, max: 4000 },
  // Square packshots on pure white: a square white stage shows each piece whole.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("حِلّة", "Hella"),
    description: L("حلل وطاسات وصواني وأدوات مطبخ تتحمّل الاستخدام اليومي.", "Pots, pans, trays and kitchen tools made for everyday use."),
    categories: [
      ["pots", "حلل وأطقم", "Pots & sets", TILES[0]!],
      ["pans", "طاسات", "Pans", TILES[1]!],
      ["ovenware", "صواني وطواجن", "Ovenware & tagines", TILES[2]!],
      ["utensils", "أدوات وسكاكين", "Utensils & knives", TILES[3]!],
    ],
    products: [
      ["granite-pot-set", "pots", "طقم ٣ حلل جرانيت بأغطية زجاجية", "Granite Pot Set of 3", P("granite-pot-set"), 2650, { isFeatured: true, rating: 4.8, sold90: 168 }],
      ["granite-frying-pan", "pans", "طاسة جرانيت", "Granite Frying Pan", P("granite-frying-pan"), 690, { isFeatured: true, rating: 4.7, sold90: 241 }],
      ["clay-tagine-pot", "ovenware", "طاجن فخار", "Clay Tagine", P("clay-tagine-pot"), 280, { rating: 4.8, sold90: 197 }],
      ["olive-wood-utensils", "utensils", "طقم ٤ ملاعق من خشب الزيتون", "Olive Wood Utensils, Set of 4", P("olive-wood-utensils"), 420, { rating: 4.7, sold90: 156 }],
      ["cream-granite-casserole", "pots", "حلة جرانيت كريمية", "Cream Granite Casserole", P("cream-granite-casserole"), 950, { rating: 4.6, sold90: 132 }],
      ["cast-iron-skillet", "pans", "طاسة حديد زهر", "Cast Iron Skillet", P("cast-iron-skillet"), 890, { rating: 4.8, sold90: 118 }],
      ["round-oven-tray-sinia", "ovenware", "صينية فرن ألومنيوم دائرية", "Round Aluminium Oven Tray", P("round-oven-tray-sinia"), 240, { rating: 4.6, sold90: 226 }],
      ["silicone-utensil-set", "utensils", "طقم أدوات سيليكون بحامل", "Silicone Utensil Set with Holder", P("silicone-utensil-set"), 480, { rating: 4.5, sold90: 143 }],
      ["stainless-stock-pot", "pots", "حلة ستانلس كبيرة", "Stainless Steel Stock Pot", P("stainless-stock-pot"), 1350, { rating: 4.7, sold90: 87 }],
      ["copper-saute-pan", "pans", "طاسة نحاس", "Copper Sauté Pan", P("copper-saute-pan"), 2200, { rating: 4.8, sold90: 46 }],
      ["enamel-baking-tray", "ovenware", "صينية مطلية بالمينا كريمية", "Cream Enamel Baking Tray", P("enamel-baking-tray"), 560, { rating: 4.6, sold90: 94 }],
      ["chef-knife-block", "utensils", "طقم ٥ سكاكين بقاعدة خشبية", "Knife Block with 5 Knives", P("chef-knife-block"), 1450, { compareAtPrice: 1650, rating: 4.7, sold90: 71 }],
    ],
  }),
  photos: {
    hero: { wide: scene("hero-wide"), tall: scene("hero-tall") },
    tiles: TILES,
    // Drawn by no look today (`matbakh`'s hero is a search box).
    banner: scene("banner"),
    // `matbakh`'s about page.
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("حلل وطاسات وصواني وأدوات مطبخ", "Pots, pans, trays and kitchen tools"),
      L("صور ومواصفات لكل منتج", "Photos and specs for every product"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { search: L("ابحث عن حلة، طاسة، صينية…", "Search pots, pans, trays…") },
    nav: [
      { label: L("الحلل", "Pots"), href: search("حلة") },
      { label: L("الطاسات", "Pans"), href: search("طاسة") },
      { label: L("الصواني", "Trays"), href: search("صينية") },
      { label: L("الأدوات", "Utensils"), href: search("طقم") },
    ],
    hero: {
      alt: L("طاجن فخار على لوح من خشب الزيتون بجوار طماطم وأعشاب", "A clay tagine on an olive wood board beside tomatoes and herbs"),
      eyebrow: L("أدوات الطبخ", "Cookware"),
      title: L("ماذا ستطبخ اليوم؟", "What are you cooking?"),
      line: L("حلة، طاسة، صينية، طاجن", "Pot, pan, tray, tagine"),
      cta: L("تسوّق كل المنتجات", "Shop everything"),
    },
    categories: { title: L("الأقسام", "Departments") },
    products: { primary: { title: L("اختيارات الأسبوع", "This week"), line: L("الجديد والأكثر مبيعاً والأقل سعراً.", "New in, best sellers and lowest price.") } },
    story: {
      alt: L("ورشة نحاس قديمة في القاهرة فيها حلل على الرفوف وسندان", "An old Cairo copper workshop with pots on shelves and an anvil"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("أدوات مطبخ تتحمّل الاستخدام اليومي", "Kitchen tools made for everyday use"),
      text: L("نختار الحلل والطاسات بخامات تتحمّل الاستخدام اليومي، ونذكر خامة كل قطعة ومقاسها.", "We pick pots and pans made for everyday use, and list each piece's material and size."),
      cta: L("تسوّق الأكثر مبيعًا", "Shop best sellers"),
    },
    trust: [
      { title: L("صور ومواصفات", "Photos and specs"), line: L("لكل منتج.", "For every product.") },
      { title: L("خامات مذكورة", "Materials listed"), line: L("لكل قطعة خامتها ومقاسها.", "Material and size for every piece.") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك.", "Order easily from your phone.") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال.", "Contact us with any question.") },
    ],
    newsletter: {
      title: L("وصفات وأدوات جديدة", "Recipes and new tools"),
      line: L("رسالة كل أسبوعين فيها وصفة وأحدث المنتجات.", "A letter every two weeks with a recipe and our newest products."),
    },
    about: {
      line: L("حلل وطاسات وأدوات مطبخ بأسعار مناسبة.", "Pots, pans and kitchen tools at fair prices."),
      alt: L("ورشة نحاس قديمة في القاهرة فيها حلل على الرفوف وسندان", "An old Cairo copper workshop with pots on shelves and an anvil"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("أدوات الطبخ اليومي", "Tools for everyday cooking"),
      text: L(
        "نختار الحلل والطاسات والصواني التي تتحمّل حرارة الموقد والفرن والغسل، ونذكر خامة كل قطعة وطريقة العناية بها.",
        "We pick pots, pans and trays that stand up to the hob, the oven and washing, and list each piece's material and care.",
      ),
      more: L("ولأي سؤال عن المقاسات أو الخامات، تواصل معنا.", "For any question about sizes or materials, contact us."),
      cta: L("تسوّق الأكثر مبيعًا", "Shop best sellers"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L("اسألنا عن مقاس الحلة أو نوع الطاسة المناسبة للموقد لديك.", "Ask us about pot sizes or which pan suits your hob."),
      heading: L("عن طلب أو منتج", "About an order or a product"),
    },
    faq: {
      line: L("الخامات والمقاسات وطريقة الطلب.", "Materials, sizes and ordering."),
      question: L("هل يصلح الجرانيت للموقد والفرن؟", "Does granite work on the hob and in the oven?"),
      answer: L(
        "نعم للموقد، وفي الفرن حتى ٢٢٠ درجة دون الغطاء الزجاجي. واغسله بإسفنجة ناعمة للحفاظ على الطبقة.",
        "Yes on the hob, and in the oven up to 220 degrees without the glass lid. Wash it with a soft sponge so the coating lasts.",
      ),
    },
    custom: {
      // `matbakh`: the category tiles' line.
      "categories-line": L("من الحلل والصواني حتى أدوات التحضير.", "From the pot to the tray to the prep tools."),
      // `matbakh`: the budget block.
      "budget-title": L("مطبخ كامل حسب ميزانيتك", "A full kitchen on your budget"),
      "budget-line": L(
        "رتّبنا لك الأدوات من الأقل سعرًا. تريد الأطقم الكبيرة أولًا؟ اختر من الأزرار.",
        "Tools sorted from the lowest price. Want the big sets first? Use the buttons.",
      ),
      // `matbakh`: the open-box steps.
      "open-box-1": L("نتصل بك قبل الوصول بساعة.", "We call an hour ahead so you are home."),
      "open-box-2": L("افتح العلبة وتأكد من سلامة كل قطعة.", "Open the box and check every piece."),
      "open-box-3": L("إذا وجدت قطعة مكسورة، أعدها للمندوب دون أن تدفع شيئًا.", "If anything is broken, hand it back and pay nothing."),
      // `matbakh`: the promises' heading.
      "trust-title": L("سهل وآمن وفي موعده", "Simple, safe, on time"),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("يكمل المطبخ", "Completes the kitchen") } },
};
