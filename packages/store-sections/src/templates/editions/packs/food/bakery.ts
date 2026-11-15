/**
 * The bakery pack (niche editions, ROADMAP F-90): "Forn", a neighbourhood
 * bakery of breads, pastries, savoury pies, and biscuits and rusks, baked
 * every morning. Data only; `loaf` draws it.
 *
 * Photos: generated from `docs/systems/editions-photos.md` (received
 * 2026-11-15, checked by eye: no people, hands, labels or logos), in the
 * public `library-media` bucket, `editions/bakery/`: twelve
 * white-background packshots named by slug and eight scenes as
 * `scene-<slot>`.
 *
 * Look: `loaf`, the niche's template (one template per niche). Its hero is
 * one big word with the first featured product, then the category circles,
 * a tabbed shelf, a photo-and-checklist block (`story` and
 * `custom.story-point-*`), a centred note and two questions; no category
 * rows, so three products per category are enough. No `reviews`: a pack
 * holds no invented buyer quotes, and without them `loaf` leaves its wall
 * out. Its about page falls back to the checklist's photo (no `about`).
 */
import { L } from "../../../../designs/_kit";
import { demoStore } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "bakery";
const P = (slug: string) => editionPhoto(NICHE, slug);
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

export const BAKERY: Edition = {
  niche: NICHE,
  looks: ["loaf"],
  priceBand: { min: 15, max: 400 },
  // Square packshots on pure white: a square white stage shows each plate whole.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("فرن", "Forn"),
    description: L("خبز ومعجنات وفطائر وبسكويت.", "Bread, pastries, pies and biscuits."),
    categories: [
      ["breads", "الخبز", "Breads", TILES[0]!],
      ["pastries", "المعجنات", "Pastries", TILES[1]!],
      ["pies", "الفطائر والمحشوات", "Savoury pies", TILES[2]!],
      ["biscuits", "البسكويت والبقسماط", "Biscuits & rusks", TILES[3]!],
    ],
    // The first featured product is the big-word hero's packshot.
    products: [
      ["sourdough-loaf", "breads", "رغيف بالخميرة الطبيعية", "Sourdough Loaf", P("sourdough-loaf"), 95, { isFeatured: true, rating: 4.9, sold90: 284 }],
      ["butter-croissants", "pastries", "٣ كرواسون بالزبدة", "Butter Croissants, 3 Pieces", P("butter-croissants"), 90, { isFeatured: true, rating: 4.8, sold90: 312 }],
      ["feteer-meshaltet", "pies", "فطير مشلتت", "Feteer Meshaltet", P("feteer-meshaltet"), 160, { isFeatured: true, rating: 4.9, sold90: 198 }],
      ["date-qurs", "biscuits", "٤ أقراص بالعجوة", "Date Qurs, 4 Pieces", P("date-qurs"), 60, { rating: 4.7, sold90: 176 }],
      ["aish-baladi-loaves", "breads", "٣ أرغفة خبز بلدي", "Baladi Bread, 3 Loaves", P("aish-baladi-loaves"), 20, { rating: 4.8, sold90: 421 }],
      ["pain-au-chocolat", "pastries", "٢ معجنات بالشوكولاتة", "Pain au Chocolat, 2 Pieces", P("pain-au-chocolat"), 80, { rating: 4.7, sold90: 233 }],
      ["meat-sambousek", "pies", "٦ سمبوسك باللحم", "Meat Sambousek, 6 Pieces", P("meat-sambousek"), 120, { rating: 4.7, sold90: 167 }],
      ["boksomat-rusks", "biscuits", "كيس بقسماط", "Boksomat Rusks Bag", P("boksomat-rusks"), 75, { rating: 4.6, sold90: 154 }],
      ["fino-bread-rolls", "breads", "٤ أرغفة خبز فينو", "Fino Rolls, 4 Pieces", P("fino-bread-rolls"), 30, { rating: 4.6, sold90: 302 }],
      ["cheese-pate", "pastries", "٣ باتيه بالجبن", "Cheese Pâté, 3 Pieces", P("cheese-pate"), 75, { rating: 4.6, sold90: 188 }],
      ["spinach-fatayer", "pies", "٤ فطائر بالسبانخ", "Spinach Fatayer, 4 Pieces", P("spinach-fatayer"), 85, { rating: 4.5, sold90: 121 }],
      ["sesame-ring-biscuits", "biscuits", "كعك بالسمسم", "Sesame Ring Biscuits", P("sesame-ring-biscuits"), 70, { compareAtPrice: 80, rating: 4.6, sold90: 139 }],
    ],
  }),
  photos: {
    hero: { wide: scene("hero-wide"), tall: scene("hero-tall") },
    tiles: TILES,
    // Drawn by no look today.
    banner: scene("banner"),
    // `loaf`'s checklist block on the home page, and its about page.
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("خبز ومعجنات وفطائر", "Bread, pastries and pies"),
      L("صور ومكونات لكل منتج", "Photos and ingredients for every product"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    hero: {
      alt: L("أرغفة خبز بلدي منتفخة في سلة أمام الفرن", "Puffed baladi loaves in a basket by the oven"),
      eyebrow: L("من الفرن", "From the oven"),
      title: L("خبز", "BREAD"),
      line: L("خبز وكرواسون وفطائر من فرننا.", "Bread, croissants and feteer from our oven."),
      cta: L("تسوّق الخبز", "Shop bread"),
    },
    categories: { title: L("من الفرن", "From the oven") },
    products: { primary: { title: L("مخبوزات مختارة", "Selected bakes"), line: L("الجديد والخبز والأعلى تقييمًا.", "New, bread and top rated.") } },
    story: {
      alt: L("فرن طوب مشتعل وعجين يرتاح على طاولة خشبية", "A lit brick oven and dough resting on a wooden table"),
      eyebrow: L("من الفرن", "From the oven"),
      title: L("مخبوزات بمكونات بسيطة", "Bakes with simple ingredients"),
      text: L("نعجن ونخبز الخبز والمعجنات والفطائر، ونذكر مكونات كل منتج في صفحته.", "We knead and bake our bread, pastries and pies, and list each product's ingredients on its page."),
      cta: L("اطلب الآن", "Order now"),
    },
    trust: [
      { title: L("مكونات واضحة", "Clear ingredients"), line: L("في صفحة كل منتج", "On every product page") },
      { title: L("تشكيلة متنوعة", "A full range"), line: L("خبز ومعجنات وفطائر وبسكويت", "Bread, pastries, pies and biscuits") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("أخبار الفرن", "Bakery news"),
      line: L("المخبوزات الجديدة وقائمة نهاية الأسبوع.", "New bakes and the weekend list."),
    },
    about: {
      line: L("فرن صغير للخبز والمعجنات.", "A small bakery for bread and pastries."),
      alt: L("فرن طوب مشتعل وعجين يرتاح على طاولة خشبية", "A lit brick oven and dough resting on a wooden table"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("خبز ومعجنات من فرننا", "Bread and pastries from our oven"),
      text: L(
        "نعجن العجين ونتركه يرتاح قبل الخبز، ونقدّم الخبز والكرواسون والفطائر والبسكويت.",
        "We knead the dough and let it rest before baking, and offer bread, croissants, pies and biscuits.",
      ),
      more: L("ولأي سؤال عن المنتجات، تواصل معنا.", "For any question about our products, contact us."),
      cta: L("اطلب الآن", "Order now"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L("اسألنا عن أي منتج أو طلب.", "Ask us about any product or order."),
      heading: L("عن منتج أو طلب", "About a product or an order"),
    },
    faq: {
      line: L("الطلبات والمخبوزات والمكونات.", "Orders, bakes and ingredients."),
      question: L("متى يصل الطلب؟", "When does my order arrive?"),
      answer: L("تظهر تكلفة الشحن ومدته عند إتمام الطلب.", "Shipping cost and time are shown at checkout."),
    },
    custom: {
      // `loaf`: the header's line under the store name.
      tagline: L("خبز ومعجنات وفطائر", "Bread, pastries and pies"),
      // `loaf`: the header's link to the best sellers, and the about page's name.
      "best-label": L("الأكثر طلباً", "Most ordered"),
      "about-label": L("الفرن", "The bakery"),
      // `loaf`: the shelf's best-sellers tab.
      "shelf-best-label": L("الخبز", "Bread"),
      // `loaf`: the checklist's four points.
      "story-point-1": L("خبز ومعجنات", "Bread and pastries"),
      "story-point-2": L("مكونات مذكورة لكل منتج", "Ingredients listed for every product"),
      "story-point-3": L("فطائر وبسكويت", "Pies and biscuits"),
      "story-point-4": L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
      // `loaf`: the centred note.
      "note-eyebrow": L("المكونات", "Ingredients"),
      "note-title": L("دقيق وماء وملح", "Flour, water and salt"),
      "note-text": L("مكونات كل منتج مذكورة في صفحته.", "Each product's ingredients are on its page."),
      // `loaf`: the home page's two questions.
      "faq-1-question": L("متى يصل الطلب؟", "When does my order arrive?"),
      "faq-1-answer": L("تظهر تكلفة الشحن ومدته عند إتمام الطلب.", "Shipping cost and time are shown at checkout."),
      "faq-2-question": L("هل يمكنني طلب كمية كبيرة؟", "Can I order a large quantity?"),
      "faq-2-answer": L("نعم، تواصل معنا لمعرفة الكميات المتاحة.", "Yes, contact us to check the quantities available."),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "You may also like") } },
};
