/**
 * The handbags edition (niche editions, ROADMAP F-90): a women's handbag
 * shop, "Lamaa" (Arabic for a shine). Sixteen bags in four categories of
 * four (totes, crossbody, clutches and evening, shoulder bags: one full row
 * of four on every category row), white-background packshots
 * (`editionPhoto`, square). The shop is told by the hour of the day: a tote
 * for the morning, a crossbody for the errands, a clutch for the night. Data
 * only. No React here.
 *
 * Materials, kept the same everywhere: the black and tan totes and the brown
 * hobo are genuine leather; the other leather-look bags are faux leather; the
 * beige tote is cotton canvas, the straw tote is woven palm straw, the black
 * clutch is satin, the pearl clutch is beaded with faux pearls.
 *
 * Generated photos (2026-11-15, `docs/systems/editions-photos.md`, checked
 * by eye; `scene()` below) replace every Pexels photo `shanta` draws.
 * The Pexels notes below describe the photos they replaced and the ones
 * no look draws, which stay.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px (2026-11-11),
 * the small marks at 3000px: bags on plinths, shelves, pegs and cabinets; no
 * people or hands, no logos or readable lettering, none used by a template
 * or another pack, none twice.
 * Hero 5706271 (wide: two cognac top-handle bags on a white plinth beside
 * dried palm leaves in a beige vase) and 5706272 (tall: one cognac bag on a
 * plinth, the same shoot). Tiles: totes 36367487 (a taupe pebbled tote with
 * brown straps on a pale blue canvas tote), crossbody 20591024 (a black
 * quilted bag with a gold chain strap on a dark ground), clutches and evening
 * 31551512 (a beaded bag with mother-of-pearl stones, a disco ball and dried
 * flowers behind), shoulder bags 4830929 (a teal and a cognac top-handle bag
 * among plants; plain clasps). Banner 5698420 (a round straw bag and a felt
 * hat on a grey peg rail). Story / about 12105084 (dark leather, cream
 * double stitching and a steel D-ring, up close). Shop the look (`fashion-luxe`, through `perLook`) 9595079:
 * three small bags stacked on a grey mesh cabinet, a cognac barrel bag on a
 * cream square pouch on an olive zip case (a blind, unreadable deboss on the
 * olive lid, checked at 3000px); the dots are the demo's three newest
 * products, the closest pieces of the range (the camel crossbody on the
 * cognac bag, the white mini crossbody on the cream pouch, the olive saddle
 * bag on the olive case), so those three stay first in `products`.
 *
 * Left out after the check: 14806252 (a designer clasp logo), 27850567
 * (a brand patch), 12741292 and 13042065 (designer logos and charms),
 * 6045197 (an embossed logo and a brand name), 9595294 (lettering on the
 * bag's side), 22432981 (an embossed letter logo), 31867644 (an embossed
 * brand name), 5717972, 8396720 and 15577055 (hands). Already used by a
 * template or pack: 9327162, 1358840, 28387111, 4627902, 22432991,
 * 22434775, 22432989, 28028348, 32498616, 15432831, 8335273, 7953286,
 * 35324419.
 *
 * No buyer quotes (`reviews`): a pack holds no invented reviews.
 *
 * No hero video: none found without people or hands, so fashion-luxe shows
 * the poster.
 *
 * Looks: `shanta` (the niche's template, one template per niche; it shows
 * the pack itself and is its own content), then `fashion-luxe` until the
 * shoes-and-bags switch takes it off. On `shanta`, `photos.look` and
 * `look` are the anatomy (one bag with four note dots, its notes
 * `custom.anatomy-N-*`): 22434764, a burgundy dome bag with gold rings and
 * feet on a pale backdrop (checked at 3000px, no lettering; freed from
 * shanta v3's demo, used nowhere else); 22434766 was left out (a blind
 * deboss on the front). `fashion-luxe` keeps its shop the look (9595079 and
 * its dots) through `perLook`. The hero on `shanta` is the tall photo
 * (5706272) beside the copy; the story is the leather-and-D-ring close-up.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, handle, pexels, phone } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "handbags";
const P = (slug: string) => editionPhoto(NICHE, slug);
/** Generated scenes (2026-11-15, docs/systems/editions-photos.md, checked by eye), same bucket: `scene-<slot>`. */
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@lamaa.example";

export const HANDBAGS: Edition = {
  niche: NICHE,
  looks: ["shanta"],
  priceBand: { min: 450, max: 3500 },
  // The packshots are square on pure white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("لمعة", "Lamaa"),
    description: L(
      "حقائب يد كبيرة وحقائب جانبية وحقائب سهرة وحقائب كتف.",
      "Totes, crossbody bags, clutches and shoulder bags.",
    ),
    categories: [
      ["totes", "حقائب يد كبيرة", "Totes", TILES[0]!],
      ["crossbody", "حقائب جانبية", "Crossbody bags", TILES[1]!],
      ["clutches-evening", "حقائب سهرة صغيرة", "Clutches & evening", TILES[2]!],
      ["shoulder-bags", "حقائب كتف", "Shoulder bags", TILES[3]!],
    ],
    // Newest first. The first three are the shop-the-look dots: the camel crossbody, the white mini crossbody, the olive saddle bag.
    products: [
      ["camel-crossbody-bag", "crossbody", "حقيبة جانبية من الجلد الصناعي بلون الجمل", "Camel Faux Leather Crossbody Bag", P("camel-crossbody-bag"), 790, { isFeatured: true, rating: 4.8, sold90: 236 }],
      ["white-mini-crossbody", "crossbody", "حقيبة جانبية صغيرة بيضاء", "White Mini Crossbody Bag", P("white-mini-crossbody"), 690, { rating: 4.7, sold90: 198 }],
      ["olive-saddle-bag", "crossbody", "حقيبة سرج زيتية من الجلد الصناعي", "Olive Faux Leather Saddle Bag", P("olive-saddle-bag"), 850, { compareAtPrice: 990, rating: 4.6, sold90: 117 }],
      // The rest, mixed so a row of the newest shows every category.
      ["black-leather-tote", "totes", "حقيبة يد كبيرة من الجلد الطبيعي سوداء", "Black Genuine Leather Tote", P("black-leather-tote"), 3200, { isFeatured: true, rating: 4.9, sold90: 64 }],
      ["gold-evening-clutch", "clutches-evening", "حقيبة سهرة ذهبية", "Gold Evening Clutch", P("gold-evening-clutch"), 750, { isFeatured: true, rating: 4.7, sold90: 152 }],
      ["black-shoulder-bag", "shoulder-bags", "حقيبة كتف سوداء من الجلد الصناعي", "Black Faux Leather Shoulder Bag", P("black-shoulder-bag"), 990, { rating: 4.7, sold90: 211 }],
      ["beige-canvas-tote", "totes", "حقيبة يد كبيرة من القماش بيج", "Beige Canvas Tote", P("beige-canvas-tote"), 650, { rating: 4.6, sold90: 274 }],
      ["black-crossbody-bag", "crossbody", "حقيبة جانبية سوداء بسلسلة", "Black Crossbody Bag with Chain Strap", P("black-crossbody-bag"), 890, { isFeatured: true, rating: 4.8, sold90: 263 }],
      ["black-satin-clutch", "clutches-evening", "حقيبة سهرة ساتان سوداء", "Black Satin Clutch", P("black-satin-clutch"), 620, { rating: 4.6, sold90: 139 }],
      ["brown-hobo-bag", "shoulder-bags", "حقيبة كتف هلالية من الجلد الطبيعي بنية", "Brown Genuine Leather Hobo Bag", P("brown-hobo-bag"), 2650, { rating: 4.8, sold90: 58 }],
      ["tan-leather-tote", "totes", "حقيبة يد كبيرة من الجلد الطبيعي بني فاتح", "Tan Genuine Leather Tote", P("tan-leather-tote"), 2950, { compareAtPrice: 3400, rating: 4.8, sold90: 71 }],
      ["pearl-beaded-clutch", "clutches-evening", "حقيبة سهرة مطرّزة بلؤلؤ صناعي", "Faux Pearl Beaded Clutch", P("pearl-beaded-clutch"), 980, { rating: 4.8, sold90: 96 }],
      ["burgundy-baguette-bag", "shoulder-bags", "حقيبة كتف مستطيلة خمرية من الجلد الصناعي", "Burgundy Faux Leather Baguette Bag", P("burgundy-baguette-bag"), 870, { compareAtPrice: 1050, rating: 4.6, sold90: 124 }],
      ["woven-straw-tote", "totes", "حقيبة يد كبيرة من الخوص", "Woven Straw Tote", P("woven-straw-tote"), 480, { rating: 4.5, sold90: 182 }],
      ["silver-chain-mini-bag", "clutches-evening", "حقيبة صغيرة فضية بسلسلة", "Silver Mini Bag with Chain", P("silver-chain-mini-bag"), 820, { rating: 4.6, sold90: 108 }],
      ["cream-quilted-bag", "shoulder-bags", "حقيبة كتف مبطّنة كريمية", "Cream Quilted Shoulder Bag", P("cream-quilted-bag"), 1150, { rating: 4.7, sold90: 143 }],
    ],
  }),
  photos: {
    // The wide hero is drawn by no look (Pexels).
    hero: { wide: pexels(5706271, 1920), tall: scene("hero-tall") },
    tiles: TILES,
    banner: pexels(5698420, 2000),
    story: scene("story"),
    // `shanta`: one bag with four note dots (not shop the look), in percent from the photo's left and top on its 4:5 crop: the handles, the zip and pockets, the hardware, the size.
    look: {
      src: scene("anatomy"),
      dots: [
        { x: 63, y: 31 },
        { x: 75, y: 47 },
        { x: 33, y: 49 }, // the gold ring fitting at the left handle's base
        { x: 42, y: 66 },
      ],
    },
  },
  copy: {
    announcement: [
      L("حقائب يد وكتف وسهرة", "Totes, shoulder bags and clutches"),
      L("المقاسات والخامات واضحة لكل حقيبة", "Clear sizes and materials for every bag"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { about: L("حكايتنا", "Our story"), search: L("ابحث عن حقيبة", "Search bags") },
    hero: {
      alt: L("حقيبة جلدية بنية بمقبض قصير على قاعدة بيضاء بجوار سعف نخل مجفف في فازة بيج", "A cognac top-handle bag on a white plinth beside dried palm leaves in a beige vase"),
      eyebrow: L("حقائب لكل استخدام", "Bags for every use"),
      title: L("حقيبة لكل مناسبة", "A bag for every occasion"),
      line: L(
        "حقائب يد للعمل، وحقائب جانبية للتنقل، وحقائب سهرة للمناسبات.",
        "Totes for work, crossbody bags for errands and clutches for the evening.",
      ),
      cta: L("تسوّق الحقائب", "Shop the bags"),
    },
    categories: { title: L("تسوّق حسب النوع", "Shop by type") },
    products: {
      primary: {
        title: L("الحقائب الأكثر طلبًا", "Most-ordered bags"),
        line: L("تشكيلة مختارة من الحقائب.", "A selection of our bags."),
      },
    },
    story: {
      alt: L("جلد بلون الجمل بخياطة مزدوجة كريمية وحلقة نحاسية عن قرب", "Camel leather with cream double stitching and a brass D-ring, up close"),
      eyebrow: L("التفاصيل", "The details"),
      title: L("خامات ومقاسات واضحة", "Clear materials and sizes"),
      text: L(
        "نذكر خامة كل حقيبة في صفحتها: جلد طبيعي أو صناعي أو قماش أو خوص أو ساتان، مع المقاسات بالسنتيمتر وطول الحزام.",
        "Every page names the material: genuine leather, faux leather, canvas, straw or satin, with the size in centimetres and the strap length.",
      ),
      cta: L("تصفّح الجديد", "See what is new"),
    },
    // `shanta`: the heading over the anatomy photo (its notes are `custom.anatomy-N-*`).
    look: {
      alt: L("حقيبة يد خمرية بمقبضين وحلقات وأرجل ذهبية على خلفية خضراء فاتحة", "A burgundy top-handle bag with gold rings and feet on a sage backdrop"),
      eyebrow: L("قبل الاختيار", "Before you choose"),
      title: L("تعرّف على الحقيبة من الداخل والخارج", "Know the bag inside and out"),
      text: L("اضغط على أي نقطة في الصورة لترى تفاصيل هذا الجزء.", "Tap a dot on the photo to see that part up close."),
    },
    trust: [
      { title: L("مقاسات واضحة", "Clear sizes"), line: L("المقاسات وطول الحزام لكل حقيبة", "Size and strap length for every bag") },
      { title: L("خامات مذكورة", "Materials listed"), line: L("الخامة في صفحة كل حقيبة", "Material on every bag's page") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("تعرّف على الموديلات الجديدة أولًا", "Hear about new styles first"),
      line: L("رسالة عند وصول موديل جديد فقط.", "One letter when a new style arrives, nothing more."),
    },
    footer: { line: L("حقائب للعمل والسهرة", "Bags for work and evenings") },
    about: {
      line: L("حقائب لكل مناسبة.", "Bags for every occasion."),
      alt: L("جلد بلون الجمل بخياطة مزدوجة كريمية وحلقة نحاسية عن قرب", "Camel leather with cream double stitching and a brass D-ring, up close"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("أربعة أنواع من الحقائب", "Four kinds of bags"),
      text: L(
        "لمعة متجر للحقائب: حقائب يد كبيرة وحقائب جانبية وحقائب سهرة وحقائب كتف. نذكر خامة كل حقيبة ومقاساتها في صفحتها.",
        "Lamaa sells bags: totes, crossbody bags, clutches and shoulder bags. Each bag's page lists its material and size.",
      ),
      more: L("ولأي سؤال عن المقاس أو الخامة، تواصل معنا.", "For any question about size or material, contact us."),
      cta: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("لديك سؤال عن سعة الحقيبة؟ اسألنا", "A question about what a bag holds? Ask us"),
    },
    faq: {
      line: L("الخامات والمقاسات وطريقة الطلب.", "Materials, sizes and ordering."),
      question: L("كيف أعرف سعة الحقيبة؟", "How do I know what a bag holds?"),
      answer: L(
        "مقاس كل حقيبة مذكور في صفحتها بالسنتيمتر، مع طول الحزام وعدد الجيوب. ولأي سؤال، تواصل معنا.",
        "Each page lists the bag's size in centimetres, the strap length and the number of pockets. For any question, contact us.",
      ),
    },
    custom: {
      // fashion-luxe: the link to the whole catalog, and the noun after a category tile's count.
      "shop-all": L("كل الحقائب", "All bags"),
      "products-noun": L("حقائب", "bags"),
      // `shanta`: the story's second paragraph, and the promises' heading.
      "story-more": L("ولأي سؤال عن المقاس، تواصل معنا.", "For any question about size, contact us."),
      "trust-title": L("قبل الطلب", "Before you order"),
      // `shanta`: the four anatomy notes, in the order of `photos.look.dots` (a title of one or two words, one line each).
      "anatomy-1-title": L("المقابض", "The handles"),
      "anatomy-1-line": L("مقبضان مزدوجان بارتفاع ١٢ سم.", "Two handles with a 12 cm drop."),
      "anatomy-2-title": L("السحّاب والجيوب", "Zip and pockets"),
      "anatomy-2-line": L("سحّاب على طول الفتحة، وفي الداخل جيب بسحّاب وجيبان للهاتف والبطاقات.", "A zip all round the top; inside, one zip pocket and two slip pockets for a phone and cards."),
      "anatomy-3-title": L("المعادن", "The hardware"),
      "anatomy-3-line": L("حلقات ذهبية للمقابض، وأرجل معدنية تحمي القاعدة.", "Gold-tone rings for the handles, and metal feet that protect the base."),
      "anatomy-4-title": L("المقاس", "The size"),
      "anatomy-4-line": L("٣٠ × ٢٣ × ١٢ سم: تتسع لهاتف كبير ومحفظة ونظارة.", "30 × 23 × 12 cm: takes a large phone, a wallet and sunglasses."),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "What our customers say"), related: L("حقائب قد تعجبك", "Bags you may like") } },
};
