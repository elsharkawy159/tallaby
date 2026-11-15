/**
 * The meat and poultry pack (niche editions, ROADMAP F-90): "El Kassab", a
 * butcher's of beef and veal, lamb, poultry and ready-to-cook kofta,
 * sausages and shish tawook, cut to order and delivered chilled. Data only;
 * `lahma` draws it.
 *
 * Photos: generated from `docs/systems/editions-photos.md` (received
 * 2026-11-15, checked by eye: no people, hands, labels or logos), in the
 * public `library-media` bucket, `editions/meat-poultry/`: twelve
 * white-background packshots named by slug and eight scenes as
 * `scene-<slot>`.
 *
 * Look: `lahma`, the niche's template (one template per niche). Its poster
 * hero carries a small note and a round price sticker (`custom.hero-*`, a
 * price point, not an offer); the home shows the category circles, a bento
 * block and the cold-chain delivery zones (`custom.zone*`); no category
 * rows, so three products per category are enough. No `reviews`: a pack
 * holds no invented buyer quotes, and without them `lahma` leaves its wall
 * out.
 */
import { L } from "../../../../designs/_kit";
import { demoStore } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "meat-poultry";
const P = (slug: string) => editionPhoto(NICHE, slug);
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

/** Category tiles, 3:4, in the categories' order. */
const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

export const MEAT_POULTRY: Edition = {
  niche: NICHE,
  looks: ["lahma"],
  priceBand: { min: 80, max: 2500 },
  // Square packshots on pure white: a square white stage shows each tray whole.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("القصّاب", "El Kassab"),
    description: L("لحوم بلدي ودواجن وقطعيات جاهزة للطبخ.", "Local meat, poultry and ready-to-cook cuts."),
    categories: [
      ["beef", "لحم بقري", "Beef & veal", TILES[0]!],
      ["lamb", "لحم ضأن", "Lamb", TILES[1]!],
      ["poultry", "دواجن", "Poultry", TILES[2]!],
      ["ready", "جاهز للطبخ", "Ready to cook", TILES[3]!],
    ],
    products: [
      ["beef-ribeye-steaks", "beef", "ستيك ريب آي (٢ قطعة)", "Ribeye Steaks, 2 Pieces", P("beef-ribeye-steaks"), 650, { isFeatured: true, rating: 4.9, sold90: 142 }],
      ["lamb-chops", "lamb", "ريش ضأن (١ كيلو)", "Lamb Chops, 1 kg", P("lamb-chops"), 980, { isFeatured: true, rating: 4.8, sold90: 118 }],
      ["whole-chicken", "poultry", "دجاجة كاملة", "Whole Chicken", P("whole-chicken"), 210, { rating: 4.7, sold90: 356 }],
      ["raw-kofta-skewers", "ready", "كفتة على أسياخ (١ كيلو)", "Kofta Skewers, 1 kg", P("raw-kofta-skewers"), 480, { isFeatured: true, rating: 4.8, sold90: 233 }],
      ["beef-cubes", "beef", "لحم مكعبات (١ كيلو)", "Beef Cubes, 1 kg", P("beef-cubes"), 460, { rating: 4.7, sold90: 287 }],
      ["lamb-leg", "lamb", "فخذ ضأن", "Leg of Lamb", P("lamb-leg"), 1650, { rating: 4.8, sold90: 64 }],
      ["chicken-breast-fillets", "poultry", "صدور دجاج فيليه (١ كيلو)", "Chicken Breast Fillets, 1 kg", P("chicken-breast-fillets"), 260, { rating: 4.7, sold90: 312 }],
      ["sogo-sausages", "ready", "سجق بلدي (١ كيلو)", "Egyptian Sausage, 1 kg", P("sogo-sausages"), 420, { rating: 4.6, sold90: 176 }],
      ["minced-beef", "beef", "لحم مفروم (١ كيلو)", "Minced Beef, 1 kg", P("minced-beef"), 440, { rating: 4.7, sold90: 341 }],
      ["lamb-shoulder-cubes", "lamb", "كتف ضأن بالعظم (١ كيلو)", "Lamb Shoulder on the Bone, 1 kg", P("lamb-shoulder-cubes"), 820, { rating: 4.6, sold90: 89 }],
      ["chicken-thighs", "poultry", "أوراك دجاج (١ كيلو)", "Chicken Thighs, 1 kg", P("chicken-thighs"), 190, { rating: 4.6, sold90: 254 }],
      ["marinated-shish-tawook", "ready", "شيش طاووق متبّل (١ كيلو)", "Marinated Shish Tawook, 1 kg", P("marinated-shish-tawook"), 340, { compareAtPrice: 380, rating: 4.7, sold90: 198 }],
    ],
  }),
  photos: {
    // `lahma`'s poster hero.
    hero: { wide: scene("hero-wide"), tall: scene("hero-tall") },
    tiles: TILES,
    // Drawn by no look today.
    banner: scene("banner"),
    // `lahma`'s about page.
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("لحوم ودواجن وقطعيات جاهزة", "Meat, poultry and ready-to-cook cuts"),
      L("الوزن والسعر واضحان لكل قطعية", "Clear weight and price for every cut"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { search: L("ابحث عن ريش، كفتة، دجاج…", "Search chops, kofta, chicken…") },
    // Only `nav.0.href` is read by `lahma`: where the hero's and the about page's buttons go.
    nav: [{ label: L("الجاهز للطبخ", "Ready to cook"), href: search("كيلو") }],
    hero: {
      alt: L("قطعتا ستيك ريب آي على لوح حجري بجوار إكليل الجبل والثوم", "Two ribeye steaks on a slate board with rosemary and garlic"),
      eyebrow: L("لحوم بلدي", "Local meat"),
      title: L("لحوم ودواجن وقطعيات مختارة", "Meat, poultry and chosen cuts"),
      line: L("لحم بقري وضأن ودواجن وقطعيات جاهزة للطبخ.", "Beef, lamb, poultry and ready-to-cook cuts."),
      cta: L("تسوّق اللحوم", "Shop meat"),
    },
    categories: { title: L("ماذا ستطبخ اليوم؟", "What are you cooking today?") },
    products: { primary: { eyebrow: L("الأكثر طلبًا", "Most ordered"), title: L("اختيارات الأسبوع", "This week"), line: L("القطعيات الأكثر طلبًا.", "Our most-ordered cuts.") } },
    story: {
      alt: L("ملحمة نظيفة فيها قرمة خشبية وسكاكين على الجدار", "A clean butcher's shop with a wooden block and knives on the wall"),
      eyebrow: L("من الملحمة", "From the shop"),
      title: L("قطعيات مختارة", "Chosen cuts"),
      text: L("نذكر وزن كل قطعية وطريقة تقطيعها في صفحتها.", "Each cut's weight and how it is cut are on its page."),
      cta: L("تسوّق اللحوم", "Shop meat"),
    },
    trust: [
      { title: L("الوزن واضح", "Clear weights"), line: L("لكل قطعية وزنها وسعرها", "Weight and price for every cut") },
      { title: L("تشكيلة متنوعة", "A full range"), line: L("لحم بقري وضأن ودواجن", "Beef, lamb and poultry") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("وصفات الأسبوع", "This week's recipes"),
      line: L("رسالة أسبوعية فيها وصفة والقطعية المناسبة لها.", "A weekly letter with a recipe and the right cut for it."),
    },
    footer: { line: L("لحوم ودواجن وقطعيات مختارة", "Meat, poultry and chosen cuts") },
    about: {
      line: L("ملحمة للحوم البلدي والدواجن.", "A butcher's for local meat and poultry."),
      alt: L("ملحمة نظيفة فيها قرمة خشبية وسكاكين على الجدار", "A clean butcher's shop with a wooden block and knives on the wall"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("لحوم بلدي وقطعيات مختارة", "Local meat and chosen cuts"),
      text: L(
        "نقدّم لحمًا بقريًا وضأنًا ودواجن وقطعيات جاهزة للطبخ، ونذكر وزن كل قطعية وسعرها في صفحتها.",
        "We offer beef, lamb, poultry and ready-to-cook cuts, with each cut's weight and price on its page.",
      ),
      more: L("ولأي سؤال عن القطعيات، تواصل معنا.", "For any question about our cuts, contact us."),
      cta: L("تسوّق اللحوم", "Shop meat"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L("اسأل عن أي قطعية أو كمية.", "Ask about any cut or quantity."),
      heading: L("اسأل عن قطعية", "Ask about a cut"),
    },
    faq: {
      line: L("القطعيات والأوزان وطريقة الطلب.", "Cuts, weights and ordering."),
      question: L("كيف أعرف وزن القطعية؟", "How do I know a cut's weight?"),
      answer: L("وزن كل قطعية مذكور في صفحتها، وقد يختلف قليلًا من قطعة لأخرى.", "Each cut's weight is on its page, and it may vary slightly from piece to piece."),
    },
    custom: {
      // `lahma`: the footer's sign-off button.
      "footer-cta": L("تواصل معنا", "Contact us"),
      // `lahma`: the hero's small line and its round sticker (a price point, not an offer).
      "hero-note": L("لحوم بلدي", "Local meat"),
      "hero-sticker-1": L("من", "From"),
      "hero-sticker-2": L("١٩٠", "190"),
      "hero-sticker-3": L("ج.م", "EGP"),
      // `lahma`: the chilled delivery zones.
      "zones-eyebrow": L("توصيل مبرد", "Chilled delivery"),
      "zones-title": L("يصل مبردًا", "It arrives chilled"),
      "zones-line": L("حقائب مبردة من المتجر حتى عنوانك.", "Chilled bags from our shop to your address."),
      "zones-note": L("التكلفة والمدة حسب منطقتك", "Fee and time depend on your area"),
      "zone-1-name": L("وسط القاهرة", "Downtown Cairo"),
      "zone-1-time": L("نفس اليوم", "Same day"),
      "zone-1-price": L("٤٠ ج.م", "EGP 40"),
      "zone-2-name": L("الجيزة والدقي", "Giza & Dokki"),
      "zone-3-name": L("مدينة نصر ومصر الجديدة", "Nasr City & Heliopolis"),
      "zone-3-time": L("نفس اليوم", "Same day"),
      "zone-3-price": L("٤٠ ج.م", "EGP 40"),
      "zone-4-name": L("٦ أكتوبر والشيخ زايد", "6th of October & Sheikh Zayed"),
      "zone-4-time": L("نفس اليوم", "Same day"),
      "zone-4-price": L("٥٥ ج.م", "EGP 55"),
      "zone-5-name": L("العاصمة الجديدة", "New Capital"),
      "zone-5-time": L("اليوم التالي", "Next day"),
      "zone-5-price": L("٧٠ ج.م", "EGP 70"),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("يكمل الوجبة", "Completes the meal") } },
};
