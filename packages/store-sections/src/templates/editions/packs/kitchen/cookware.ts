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
    description: L("حلل وطاسات وصواني وأدوات مطبخ بتستحمل الطبخ كل يوم.", "Pots, pans, trays and utensils that stand up to everyday cooking."),
    categories: [
      ["pots", "حلل وأطقم", "Pots & sets", TILES[0]!],
      ["pans", "طاسات", "Pans", TILES[1]!],
      ["ovenware", "صواني وطواجن", "Ovenware & tagines", TILES[2]!],
      ["utensils", "أدوات وسكاكين", "Utensils & knives", TILES[3]!],
    ],
    products: [
      ["granite-pot-set", "pots", "طقم ٣ حلل جرانيت بغطا زجاج", "Granite Pot Set of 3", P("granite-pot-set"), 2650, { isFeatured: true, rating: 4.8, sold90: 168 }],
      ["granite-frying-pan", "pans", "طاسة جرانيت", "Granite Frying Pan", P("granite-frying-pan"), 690, { isFeatured: true, rating: 4.7, sold90: 241 }],
      ["clay-tagine-pot", "ovenware", "طاجن فخار", "Clay Tagine", P("clay-tagine-pot"), 280, { rating: 4.8, sold90: 197 }],
      ["olive-wood-utensils", "utensils", "طقم ٤ معالق خشب زيتون", "Olive Wood Utensils, Set of 4", P("olive-wood-utensils"), 420, { rating: 4.7, sold90: 156 }],
      ["cream-granite-casserole", "pots", "حلة جرانيت كريمي", "Cream Granite Casserole", P("cream-granite-casserole"), 950, { rating: 4.6, sold90: 132 }],
      ["cast-iron-skillet", "pans", "طاسة حديد زهر", "Cast Iron Skillet", P("cast-iron-skillet"), 890, { rating: 4.8, sold90: 118 }],
      ["round-oven-tray-sinia", "ovenware", "صينية فرن ألومنيوم مدوّرة", "Round Aluminium Oven Tray", P("round-oven-tray-sinia"), 240, { rating: 4.6, sold90: 226 }],
      ["silicone-utensil-set", "utensils", "طقم أدوات سيليكون بحامل", "Silicone Utensil Set with Holder", P("silicone-utensil-set"), 480, { rating: 4.5, sold90: 143 }],
      ["stainless-stock-pot", "pots", "حلة ستانلس كبيرة", "Stainless Steel Stock Pot", P("stainless-stock-pot"), 1350, { rating: 4.7, sold90: 87 }],
      ["copper-saute-pan", "pans", "طاسة نحاس", "Copper Sauté Pan", P("copper-saute-pan"), 2200, { rating: 4.8, sold90: 46 }],
      ["enamel-baking-tray", "ovenware", "صينية إينامل كريمي", "Cream Enamel Baking Tray", P("enamel-baking-tray"), 560, { rating: 4.6, sold90: 94 }],
      ["chef-knife-block", "utensils", "طقم ٥ سكاكين بقاعدة خشب", "Knife Block with 5 Knives", P("chef-knife-block"), 1450, { compareAtPrice: 1650, rating: 4.7, sold90: 71 }],
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
      L("توصيل لكل المحافظات · افتح قبل ما تدفع", "Delivery across Egypt · Open before you pay"),
      L("الدفع عند الاستلام", "Cash on delivery"),
      L("استرجاع خلال ١٤ يوم", "14-day returns"),
    ],
    labels: { search: L("ابحث عن حلة، طاسة، صينية…", "Search pots, pans, trays…") },
    nav: [
      { label: L("الحلل", "Pots"), href: search("حلة") },
      { label: L("الطاسات", "Pans"), href: search("طاسة") },
      { label: L("الصواني", "Trays"), href: search("صينية") },
      { label: L("الأدوات", "Utensils"), href: search("طقم") },
    ],
    hero: {
      alt: L("طاجن فخار على لوح خشب زيتون جنب طماطم وأعشاب", "A clay tagine on an olive wood board beside tomatoes and herbs"),
      eyebrow: L("أدوات الطبخ", "Cookware"),
      title: L("بتطبخ إيه النهارده؟", "What are you cooking?"),
      line: L("حلة، طاسة، صينية، طاجن", "Pot, pan, tray, tagine"),
      cta: L("تسوق كل المنتجات", "Shop everything"),
    },
    categories: { title: L("الأقسام", "Departments") },
    products: { primary: { title: L("الأسبوع ده", "This week"), line: L("الجديد والأكثر مبيعاً والأقل سعراً.", "New in, best sellers and lowest price.") } },
    story: {
      alt: L("ورشة نحاس قديمة في القاهرة فيها حلل على الرفوف وسندان", "An old Cairo copper workshop with pots on shelves and an anvil"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("أدوات بتعيش في المطبخ", "Tools that last in the kitchen"),
      text: L("بنختار الحلل والطاسات اللي بتستحمل الطبخ كل يوم، وبنجربها في مطبخنا الأول.", "We pick pots and pans that stand up to everyday cooking, and try them in our kitchen first."),
      cta: L("تسوق الأكثر مبيعاً", "Shop best sellers"),
    },
    trust: [
      { title: L("توصيل ٢–٤ أيام", "2–4 day delivery"), line: L("لكل المحافظات.", "To every governorate.") },
      { title: L("ادفع عند الاستلام", "Pay at the door"), line: L("كاش أو كارت لما يوصل.", "Cash or card when it arrives.") },
      { title: L("استرجاع ١٤ يوم", "14-day returns"), line: L("المقفول بيرجع من غير أسئلة.", "Unopened items, no questions.") },
      { title: L("تغليف بعناية", "Packed with care"), line: L("كل قطعة متغلفة لوحدها.", "Every piece wrapped on its own.") },
    ],
    newsletter: {
      title: L("وصفات وأدوات جديدة", "Recipes and new tools"),
      line: L("رسالة كل أسبوعين فيها وصفة والجديد في المحل.", "A letter every two weeks with a recipe and what is new in the shop."),
    },
    about: {
      line: L("حلل وطاسات وأدوات مطبخ بسعر معقول.", "Pots, pans and kitchen tools at fair prices."),
      alt: L("ورشة نحاس قديمة في القاهرة فيها حلل على الرفوف وسندان", "An old Cairo copper workshop with pots on shelves and an anvil"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("الأدوات اللي بتطبخ بيها كل يوم", "The tools you cook with every day"),
      text: L(
        "بنختار الحلل والطاسات والصواني اللي بتستحمل نار البوتاجاز والفرن والغسيل، وبنجرب كل قطعة في مطبخنا قبل ما تنزل.",
        "We pick pots, pans and trays that stand up to the hob, the oven and the washing-up, and try every piece in our kitchen first.",
      ),
      more: L("والتوصيل لكل المحافظات، وتفتح الطلب قبل ما تدفع.", "We deliver to every governorate, and you open your order before you pay."),
      cta: L("تسوق الأكثر مبيعاً", "Shop best sellers"),
    },
    contact: {
      title: L("تواصل", "Contact"),
      line: L("اسألنا عن مقاس الحلة أو نوع الطاسة المناسبة للبوتاجاز بتاعك.", "Ask us about pot sizes or which pan suits your hob."),
      heading: L("عن طلب أو منتج", "About an order or a product"),
    },
    faq: {
      line: L("الخامات والتوصيل والاسترجاع.", "Materials, delivery and returns."),
      question: L("الجرانيت ينفع على البوتاجاز والفرن؟", "Does granite work on the hob and in the oven?"),
      answer: L(
        "أيوه على البوتاجاز، وفي الفرن لحد ٢٢٠ درجة من غير الغطا الزجاج. واغسله بإسفنجة ناعمة عشان الطبقة تعيش.",
        "Yes on the hob, and in the oven up to 220 degrees without the glass lid. Wash it with a soft sponge so the coating lasts.",
      ),
    },
    custom: {
      // `matbakh`: the category tiles' line.
      "categories-line": L("من الحلة للصينية لأدوات التحضير.", "From the pot to the tray to the prep tools."),
      // `matbakh`: the budget block.
      "budget-title": L("مطبخ كامل على قد ميزانيتك", "A full kitchen on your budget"),
      "budget-line": L(
        "رتبنالك الأدوات من الأرخص. عايز الأطقم الكبيرة الأول؟ اختار من الزراير.",
        "Tools sorted from the lowest price. Want the big sets first? Use the buttons.",
      ),
      // `matbakh`: the open-box steps.
      "open-box-1": L("بنكلمك قبلها بساعة عشان تكون موجود.", "We call an hour ahead so you are home."),
      "open-box-2": L("افتح العلبة واتأكد إن كل قطعة سليمة.", "Open the box and check every piece."),
      "open-box-3": L("لو فيه حاجة مكسورة رجّعها للمندوب ومتدفعش حاجة.", "If anything is broken, hand it back and pay nothing."),
      // `matbakh`: the promises' heading.
      "trust-title": L("سهل وآمن وفي ميعاده", "Simple, safe, on time"),
    },
  },
  productPage: { copy: { reviews: L("رأي اللي طبخوا بيها", "From people who cook with it"), related: L("يكمّل المطبخ", "Completes the kitchen") } },
};
