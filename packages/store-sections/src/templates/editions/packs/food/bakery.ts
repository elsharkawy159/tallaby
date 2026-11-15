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
    description: L("عيش ومخبوزات وفطير بيتخبزوا كل يوم الصبح.", "Bread, pastries and pies baked every morning."),
    categories: [
      ["breads", "العيش", "Breads", TILES[0]!],
      ["pastries", "المعجنات", "Pastries", TILES[1]!],
      ["pies", "الفطير والمحشي", "Savoury pies", TILES[2]!],
      ["biscuits", "البسكويت والبقسماط", "Biscuits & rusks", TILES[3]!],
    ],
    // The first featured product is the big-word hero's packshot.
    products: [
      ["sourdough-loaf", "breads", "رغيف ساوردو", "Sourdough Loaf", P("sourdough-loaf"), 95, { isFeatured: true, rating: 4.9, sold90: 284 }],
      ["butter-croissants", "pastries", "٣ كرواسون زبدة", "Butter Croissants, 3 Pieces", P("butter-croissants"), 90, { isFeatured: true, rating: 4.8, sold90: 312 }],
      ["feteer-meshaltet", "pies", "فطير مشلتت", "Feteer Meshaltet", P("feteer-meshaltet"), 160, { isFeatured: true, rating: 4.9, sold90: 198 }],
      ["date-qurs", "biscuits", "٤ أقراص بالعجوة", "Date Qurs, 4 Pieces", P("date-qurs"), 60, { rating: 4.7, sold90: 176 }],
      ["aish-baladi-loaves", "breads", "٣ أرغفة عيش بلدي", "Baladi Bread, 3 Loaves", P("aish-baladi-loaves"), 20, { rating: 4.8, sold90: 421 }],
      ["pain-au-chocolat", "pastries", "٢ بان أو شوكولا", "Pain au Chocolat, 2 Pieces", P("pain-au-chocolat"), 80, { rating: 4.7, sold90: 233 }],
      ["meat-sambousek", "pies", "٦ سمبوسك لحمة", "Meat Sambousek, 6 Pieces", P("meat-sambousek"), 120, { rating: 4.7, sold90: 167 }],
      ["boksomat-rusks", "biscuits", "كيس بقسماط", "Boksomat Rusks Bag", P("boksomat-rusks"), 75, { rating: 4.6, sold90: 154 }],
      ["fino-bread-rolls", "breads", "٤ عيش فينو", "Fino Rolls, 4 Pieces", P("fino-bread-rolls"), 30, { rating: 4.6, sold90: 302 }],
      ["cheese-pate", "pastries", "٣ باتيه بالجبنة", "Cheese Pâté, 3 Pieces", P("cheese-pate"), 75, { rating: 4.6, sold90: 188 }],
      ["spinach-fatayer", "pies", "٤ فطاير سبانخ", "Spinach Fatayer, 4 Pieces", P("spinach-fatayer"), 85, { rating: 4.5, sold90: 121 }],
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
      L("بيتخبز كل يوم الصبح", "Baked every morning"),
      L("الدفع عند الاستلام", "Cash on delivery"),
      L("التوصيل قبل الضهر", "Delivered before noon"),
    ],
    hero: {
      alt: L("أرغفة عيش بلدي منفوخة في سبت قدام الفرن", "Puffed baladi loaves in a basket by the oven"),
      eyebrow: L("طالع من الفرن", "Out of the oven"),
      title: L("عيش", "BREAD"),
      line: L("عيش وكرواسون وفطير بيتخبزوا كل يوم الصبح.", "Bread, croissants and feteer baked every morning."),
      cta: L("اطلب الرغيف", "Order the loaf"),
    },
    categories: { title: L("طالع من الفرن", "Out of the oven") },
    products: { primary: { title: L("طازة النهارده", "Fresh today"), line: L("الجديد والعيش والأعلى تقييماً.", "New, bread and top rated.") } },
    story: {
      alt: L("فرن طوب مولّع وعجين بيرتاح على ترابيزة خشب", "A lit brick oven and dough resting on a wooden table"),
      eyebrow: L("كل يوم الصبح", "Every morning"),
      title: L("من الفرن لبابك", "From our oven to your door"),
      text: L("بنعجن بالليل ونخبز الفجر، والطلب يوصلك وهو لسه طازة.", "We knead at night and bake at dawn, so your order arrives fresh."),
      cta: L("اطلب دلوقتي", "Order now"),
    },
    trust: [
      { title: L("طازة كل يوم", "Fresh every day"), line: L("بيتخبز الفجر", "Baked at dawn") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفع لما الطلب يوصل", "Pay when your order arrives") },
      { title: L("توصيل الصبح", "Morning delivery"), line: L("قبل الضهر", "Before noon") },
      { title: L("طلبات كبيرة", "Large orders"), line: L("للعزايم والمناسبات", "For gatherings and occasions") },
    ],
    newsletter: {
      title: L("أخبار الفرن كل أسبوع", "Bakery news every week"),
      line: L("المخبوزات الجديدة وقائمة الويك إند.", "New bakes and the weekend list."),
    },
    about: {
      line: L("فرن صغير بيخبز كل يوم الصبح.", "A small bakery that bakes every morning."),
      alt: L("فرن طوب مولّع وعجين بيرتاح على ترابيزة خشب", "A lit brick oven and dough resting on a wooden table"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("بنخبز قبل ما الحي يصحى", "We bake before the street wakes"),
      text: L(
        "بنعجن بالليل ونسيب العجين يرتاح، وبنخبز الفجر عشان العيش والكرواسون والفطير يوصلوك طازة.",
        "We knead at night, let the dough rest and bake at dawn, so the bread, croissants and feteer reach you fresh.",
      ),
      more: L("ولو عندك عزومة، كلمنا قبلها بيوم.", "And if you are hosting, call us a day ahead."),
      cta: L("اطلب دلوقتي", "Order now"),
    },
    contact: {
      title: L("تواصل", "Contact"),
      line: L("للطلبات الكبيرة والمناسبات كلمنا قبلها بيوم.", "For large orders and occasions, call us a day ahead."),
      heading: L("عن طلب أو مناسبة", "About an order or an occasion"),
    },
    faq: {
      line: L("الطلبات والتوصيل والمخبوزات.", "Orders, delivery and bakes."),
      question: L("العيش بيوصل إمتى؟", "When does the bread arrive?"),
      answer: L("بنخبز الفجر وبنوصّل من ٨ لـ ١٢ الضهر.", "We bake at dawn and deliver from 8 am to noon."),
    },
    custom: {
      // `loaf`: the header's line under the store name.
      tagline: L("عيش ومخبوزات كل يوم الصبح", "Bread and bakes every morning"),
      // `loaf`: the header's link to the best sellers, and the about page's name.
      "best-label": L("الأكثر طلباً", "Most ordered"),
      "about-label": L("الفرن", "The bakery"),
      // `loaf`: the shelf's best-sellers tab.
      "shelf-best-label": L("العيش", "Bread"),
      // `loaf`: the checklist's four points.
      "story-point-1": L("بيتخبز كل يوم الفجر", "Baked fresh at dawn"),
      "story-point-2": L("يوصل قبل الضهر", "Delivered before noon"),
      "story-point-3": L("طلبات للعزايم", "Orders for gatherings"),
      "story-point-4": L("من غير مواد حافظة", "No preservatives"),
      // `loaf`: the centred note.
      "note-eyebrow": L("كل يوم", "Every day"),
      "note-title": L("دقيق ومية وملح وفرن سخن", "Flour, water, salt and a hot oven"),
      "note-text": L("من غير مواد حافظة ولا محسنات. كل حاجة بتتخبز في نفس اليوم.", "No preservatives or improvers. Everything is baked the same day."),
      // `loaf`: the home page's two questions.
      "faq-1-question": L("العيش بيوصل إمتى؟", "When does the bread arrive?"),
      "faq-1-answer": L("بنخبز الفجر وبنوصّل من ٨ لـ ١٢ الضهر.", "We bake at dawn and deliver from 8 am to noon."),
      "faq-2-question": L("ينفع أطلب كمية لعزومة؟", "Can I order a large quantity?"),
      "faq-2-answer": L("أيوه، كلمنا قبلها بيوم ونجهّز الكمية اللي محتاجها.", "Yes, call us a day ahead and we prepare the quantity you need."),
    },
  },
  productPage: { copy: { reviews: L("اللي ذاقوه قالوا", "From our regulars"), related: L("من رف النهارده", "From today's shelf") } },
};
