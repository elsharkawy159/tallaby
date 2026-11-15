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
    description: L("لحمة بلدي وفراخ بتتقطع بالطلب وتوصل متلجة.", "Local meat and poultry cut to order and delivered chilled."),
    categories: [
      ["beef", "لحمة بقري", "Beef & veal", TILES[0]!],
      ["lamb", "ضاني", "Lamb", TILES[1]!],
      ["poultry", "فراخ", "Poultry", TILES[2]!],
      ["ready", "جاهز للطبخ", "Ready to cook", TILES[3]!],
    ],
    products: [
      ["beef-ribeye-steaks", "beef", "ستيك ريب آي (٢ قطعة)", "Ribeye Steaks, 2 Pieces", P("beef-ribeye-steaks"), 650, { isFeatured: true, rating: 4.9, sold90: 142 }],
      ["lamb-chops", "lamb", "ريش ضاني (١ كيلو)", "Lamb Chops, 1 kg", P("lamb-chops"), 980, { isFeatured: true, rating: 4.8, sold90: 118 }],
      ["whole-chicken", "poultry", "فرخة كاملة", "Whole Chicken", P("whole-chicken"), 210, { rating: 4.7, sold90: 356 }],
      ["raw-kofta-skewers", "ready", "كفتة على سيخ (١ كيلو)", "Kofta Skewers, 1 kg", P("raw-kofta-skewers"), 480, { isFeatured: true, rating: 4.8, sold90: 233 }],
      ["beef-cubes", "beef", "لحمة مكعبات (١ كيلو)", "Beef Cubes, 1 kg", P("beef-cubes"), 460, { rating: 4.7, sold90: 287 }],
      ["lamb-leg", "lamb", "فخدة ضاني", "Leg of Lamb", P("lamb-leg"), 1650, { rating: 4.8, sold90: 64 }],
      ["chicken-breast-fillets", "poultry", "صدور فراخ فيليه (١ كيلو)", "Chicken Breast Fillets, 1 kg", P("chicken-breast-fillets"), 260, { rating: 4.7, sold90: 312 }],
      ["sogo-sausages", "ready", "سجق بلدي (١ كيلو)", "Egyptian Sausage, 1 kg", P("sogo-sausages"), 420, { rating: 4.6, sold90: 176 }],
      ["minced-beef", "beef", "لحمة مفرومة (١ كيلو)", "Minced Beef, 1 kg", P("minced-beef"), 440, { rating: 4.7, sold90: 341 }],
      ["lamb-shoulder-cubes", "lamb", "كتف ضاني بالعضم (١ كيلو)", "Lamb Shoulder on the Bone, 1 kg", P("lamb-shoulder-cubes"), 820, { rating: 4.6, sold90: 89 }],
      ["chicken-thighs", "poultry", "أوراك فراخ (١ كيلو)", "Chicken Thighs, 1 kg", P("chicken-thighs"), 190, { rating: 4.6, sold90: 254 }],
      ["marinated-shish-tawook", "ready", "شيش طاووق متتبل (١ كيلو)", "Marinated Shish Tawook, 1 kg", P("marinated-shish-tawook"), 340, { compareAtPrice: 380, rating: 4.7, sold90: 198 }],
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
      L("بيتقطع بالطلب كل يوم", "Cut to order every day"),
      L("توصيل مبرد", "Chilled delivery"),
      L("الدفع عند الاستلام", "Cash on delivery"),
    ],
    labels: { search: L("ابحث عن ريش، كفتة، فراخ…", "Search chops, kofta, chicken…") },
    // Only `nav.0.href` is read by `lahma`: where the hero's and the about page's buttons go.
    nav: [{ label: L("الجاهز للطبخ", "Ready to cook"), href: search("كيلو") }],
    hero: {
      alt: L("ستيكين ريب آي على لوح حجر جنب روزماري وتوم", "Two ribeye steaks on a slate board with rosemary and garlic"),
      eyebrow: L("لحمة بلدي", "Local meat"),
      title: L("متقطع بالطلب، واصل متلج", "Cut to order, delivered chilled"),
      line: L("بنقطع الصبح ونوصّل في شنط مبردة في نفس اليوم.", "We cut in the morning and deliver in chilled bags the same day."),
      cta: L("تسوق اللحمة", "Shop meat"),
    },
    categories: { title: L("هتطبخ إيه النهارده؟", "What are you cooking today?") },
    products: { primary: { eyebrow: L("الأكتر طلباً", "Most ordered"), title: L("الأسبوع ده", "This week"), line: L("القطعيات اللي بتخلص الأول.", "The cuts that sell out first.") } },
    story: {
      alt: L("جزارة نضيفة فيها قرمة خشب وسكاكين على الحيطة", "A clean butcher's shop with a wooden block and knives on the wall"),
      eyebrow: L("من المحل", "From the shop"),
      title: L("بنقطع قدامك", "We cut it for you"),
      text: L("كل قطعية بتتقطع بالطلب، وبتوصلك متلجة في نفس اليوم.", "Every cut is made to order and reaches you chilled the same day."),
      cta: L("تسوق اللحمة", "Shop meat"),
    },
    trust: [
      { title: L("بالطلب", "Cut to order"), line: L("كل يوم الصبح", "Every morning") },
      { title: L("توصيل مبرد", "Chilled delivery"), line: L("في شنط مبردة", "In chilled bags") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفع لما الطلب يوصل", "Pay when your order arrives") },
      { title: L("تقطيع على مزاجك", "Cut your way"), line: L("اكتب طلبك في الملاحظات", "Write it in the order notes") },
    ],
    newsletter: {
      title: L("وصفات الأسبوع", "This week's recipes"),
      line: L("رسالة كل أسبوع فيها وصفة والقطعية المناسبة ليها.", "A weekly letter with a recipe and the right cut for it."),
    },
    footer: { line: L("بيتقطع طازة كل يوم الصبح", "Cut fresh, every morning") },
    about: {
      line: L("جزارة بتقطع بالطلب كل يوم.", "A butcher's that cuts to order every day."),
      alt: L("جزارة نضيفة فيها قرمة خشب وسكاكين على الحيطة", "A clean butcher's shop with a wooden block and knives on the wall"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("لحمة بلدي متقطعة بالطلب", "Local meat cut to order"),
      text: L(
        "بنختار اللحمة والفراخ كل يوم الصبح، وبنقطع كل طلب على مزاجك، وبنغلفه في شنطة مبردة لحد باب بيتك.",
        "We choose the meat and poultry every morning, cut each order the way you like and pack it in a chilled bag all the way to your door.",
      ),
      more: L("ولو عايز تقطيع معيّن، اكتبه في ملاحظات الطلب.", "And if you want a specific cut, write it in the order notes."),
      cta: L("تسوق اللحمة", "Shop meat"),
    },
    contact: {
      title: L("تواصل", "Contact"),
      line: L("اسأل عن قطعية أو كمية لعزومة.", "Ask about a cut or a quantity for a gathering."),
      heading: L("اطلب قطعية مخصوص", "Ask for a special cut"),
    },
    faq: {
      line: L("القطعيات والتوصيل المبرد والدفع.", "Cuts, chilled delivery and payment."),
      question: L("ينفع أطلب تقطيع معين؟", "Can I ask for a specific cut?"),
      answer: L("أيوه، اكتب طلبك في الملاحظات أو ابعتلنا على واتساب قبلها بيوم.", "Yes, write it in the order notes or message us on WhatsApp a day ahead."),
    },
    custom: {
      // `lahma`: the footer's sign-off button.
      "footer-cta": L("اطلب على واتساب", "Order on WhatsApp"),
      // `lahma`: the hero's small line and its round sticker (a price point, not an offer).
      "hero-note": L("بيتقطع الصبح", "Cut this morning"),
      "hero-sticker-1": L("من", "From"),
      "hero-sticker-2": L("١٩٠", "190"),
      "hero-sticker-3": L("ج.م", "EGP"),
      // `lahma`: the chilled delivery zones.
      "zones-eyebrow": L("توصيل مبرد", "Chilled delivery"),
      "zones-title": L("بيوصل متلج", "It arrives chilled"),
      "zones-line": L("شنط مبردة من المحل لباب بيتك.", "Chilled bags from our shop to your door."),
      "zones-note": L("المصاريف والمدة حسب منطقتك", "Fee and time depend on your area"),
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
      "zone-5-time": L("تاني يوم", "Next day"),
      "zone-5-price": L("٧٠ ج.م", "EGP 70"),
    },
  },
  productPage: { copy: { reviews: L("رأي الزباين", "From our regulars"), related: L("يكمّل العزومة", "Completes the meal") } },
};
