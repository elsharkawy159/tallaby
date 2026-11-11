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

const TILES = [pexels(36367487, 1200), pexels(20591024, 1200), pexels(31551512, 1200), pexels(4830929, 1200)];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@lamaa.example";

export const HANDBAGS: Edition = {
  niche: NICHE,
  looks: ["shanta", "fashion-luxe"],
  priceBand: { min: 450, max: 3500 },
  // The packshots are square on pure white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("لمعة", "Lamaa"),
    description: L(
      "شنط توت وكروس وكلاتش وشنط كتف: شنطة لكل ساعة في يومك، من الشغل الصبح لحد السهرة.",
      "Totes, crossbody bags, clutches and shoulder bags: a bag for every hour of your day, from work in the morning to a night out.",
    ),
    categories: [
      ["totes", "شنط توت", "Totes", TILES[0]!],
      ["crossbody", "شنط كروس", "Crossbody bags", TILES[1]!],
      ["clutches-evening", "كلاتش وشنط سهرة", "Clutches & evening", TILES[2]!],
      ["shoulder-bags", "شنط كتف", "Shoulder bags", TILES[3]!],
    ],
    // Newest first. The first three are the shop-the-look dots: the camel crossbody, the white mini crossbody, the olive saddle bag.
    products: [
      ["camel-crossbody-bag", "crossbody", "شنطة كروس جلد صناعي جملي", "Camel Faux Leather Crossbody Bag", P("camel-crossbody-bag"), 790, { isFeatured: true, rating: 4.8, sold90: 236 }],
      ["white-mini-crossbody", "crossbody", "شنطة كروس ميني بيضا", "White Mini Crossbody Bag", P("white-mini-crossbody"), 690, { rating: 4.7, sold90: 198 }],
      ["olive-saddle-bag", "crossbody", "شنطة سادل زيتي جلد صناعي", "Olive Faux Leather Saddle Bag", P("olive-saddle-bag"), 850, { compareAtPrice: 990, rating: 4.6, sold90: 117 }],
      // The rest, mixed so a row of the newest shows every category.
      ["black-leather-tote", "totes", "شنطة توت جلد طبيعي سودا", "Black Genuine Leather Tote", P("black-leather-tote"), 3200, { isFeatured: true, rating: 4.9, sold90: 64 }],
      ["gold-evening-clutch", "clutches-evening", "كلاتش سهرة دهبي", "Gold Evening Clutch", P("gold-evening-clutch"), 750, { isFeatured: true, rating: 4.7, sold90: 152 }],
      ["black-shoulder-bag", "shoulder-bags", "شنطة كتف سودا جلد صناعي", "Black Faux Leather Shoulder Bag", P("black-shoulder-bag"), 990, { rating: 4.7, sold90: 211 }],
      ["beige-canvas-tote", "totes", "شنطة توت كانفاس بيج", "Beige Canvas Tote", P("beige-canvas-tote"), 650, { rating: 4.6, sold90: 274 }],
      ["black-crossbody-bag", "crossbody", "شنطة كروس سودا بسلسلة", "Black Crossbody Bag with Chain Strap", P("black-crossbody-bag"), 890, { isFeatured: true, rating: 4.8, sold90: 263 }],
      ["black-satin-clutch", "clutches-evening", "كلاتش ساتان أسود", "Black Satin Clutch", P("black-satin-clutch"), 620, { rating: 4.6, sold90: 139 }],
      ["brown-hobo-bag", "shoulder-bags", "شنطة هوبو جلد طبيعي بني", "Brown Genuine Leather Hobo Bag", P("brown-hobo-bag"), 2650, { rating: 4.8, sold90: 58 }],
      ["tan-leather-tote", "totes", "شنطة توت جلد طبيعي هافان", "Tan Genuine Leather Tote", P("tan-leather-tote"), 2950, { compareAtPrice: 3400, rating: 4.8, sold90: 71 }],
      ["pearl-beaded-clutch", "clutches-evening", "كلاتش مطرّز بلولي صناعي", "Faux Pearl Beaded Clutch", P("pearl-beaded-clutch"), 980, { rating: 4.8, sold90: 96 }],
      ["burgundy-baguette-bag", "shoulder-bags", "شنطة باجيت نبيتي جلد صناعي", "Burgundy Faux Leather Baguette Bag", P("burgundy-baguette-bag"), 870, { compareAtPrice: 1050, rating: 4.6, sold90: 124 }],
      ["woven-straw-tote", "totes", "شنطة توت خوص", "Woven Straw Tote", P("woven-straw-tote"), 480, { rating: 4.5, sold90: 182 }],
      ["silver-chain-mini-bag", "clutches-evening", "شنطة ميني فضي بسلسلة", "Silver Mini Bag with Chain", P("silver-chain-mini-bag"), 820, { rating: 4.6, sold90: 108 }],
      ["cream-quilted-bag", "shoulder-bags", "شنطة كتف كابتونيه كريمي", "Cream Quilted Shoulder Bag", P("cream-quilted-bag"), 1150, { rating: 4.7, sold90: 143 }],
    ],
  }),
  photos: {
    hero: { wide: pexels(5706271, 1920), tall: pexels(5706272, 1200) },
    tiles: TILES,
    banner: pexels(5698420, 2000),
    story: pexels(12105084, 1200),
    // `shanta`: one bag with four note dots (not shop the look), in percent from the photo's left and top on its 4:5 crop: the handles, the zip and pockets, the hardware, the size.
    look: {
      src: pexels(22434764, 1400),
      dots: [
        { x: 63, y: 31 },
        { x: 75, y: 47 },
        { x: 71, y: 74 },
        { x: 42, y: 66 },
      ],
    },
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("ادفعي عند الاستلام", "Pay on delivery"),
      L("استبدال خلال ١٤ يوم", "Exchange within 14 days"),
    ],
    labels: { about: L("حكايتنا", "Our story"), search: L("ابحثي عن شنطة", "Search bags") },
    hero: {
      alt: L("شنطة جلد هافان بإيد قصيرة على قاعدة بيضا جنب سعف نخل ناشف في فازة بيج", "A cognac top-handle bag on a white plinth beside dried palm leaves in a beige vase"),
      eyebrow: L("من الصبح لآخر الليل", "From morning to late night"),
      title: L("شنطة لكل ساعة في يومك", "A bag for every hour"),
      line: L(
        "توت للشغل، كروس للمشاوير، وكلاتش للسهرة. اختاري على حسب يومك، مش على حسب الموضة.",
        "A tote for work, a crossbody for errands and a clutch for the evening. Choose by your day, not by the trend.",
      ),
      cta: L("تسوّقي الشنط", "Shop the bags"),
    },
    categories: { title: L("هتشيلي إيه النهارده؟", "What are you carrying today?") },
    products: {
      primary: {
        title: L("الشنط الأكثر طلبًا", "Most-ordered bags"),
        line: L("الموديلات اللي عميلاتنا بيرجعوا يطلبوها بلون تاني.", "The styles our customers come back for in another colour."),
      },
    },
    story: {
      alt: L("جلد غامق بخياطة مزدوجة كريمي وحلقة معدن، قريب أوي", "Dark leather with cream double stitching and a steel ring, up close"),
      eyebrow: L("الخياطة بتتكلم", "The stitching tells you"),
      title: L("شنطة تستحمل شيل كل يوم", "Made to be carried daily"),
      text: L(
        "بنكتب خامة كل شنطة بصراحة في صفحتها: جلد طبيعي، جلد صناعي، كانفاس، خوص أو ساتان، ومعاها المقاسات بالسنتيمتر وطول الحزام.",
        "Every page names the material honestly: genuine leather, faux leather, canvas, straw or satin, with the size in centimetres and the strap length.",
      ),
      cta: L("شوفي الجديد", "See what is new"),
    },
    // `shanta`: the heading over the anatomy photo (its notes are `custom.anatomy-N-*`).
    look: {
      alt: L("شنطة يد نبيتي بإيدين وحلقات ورجول دهبي على خلفية فاتحة", "A burgundy top-handle bag with gold rings and feet on a pale backdrop"),
      eyebrow: L("قبل ما تختاري", "Before you choose"),
      title: L("اعرفي الشنطة من جوه وبره", "Know the bag inside and out"),
      text: L("دوسي على أي نقطة في الصورة وشوفي تفصيلة الجزء ده.", "Tap a dot on the photo to see that part up close."),
    },
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("بنوصّل لكل محافظات مصر", "We deliver to every governorate") },
      { title: L("استبدال سهل", "Easy exchange"), line: L("خلال ١٤ يوم من الاستلام", "Within 14 days of delivery") },
      { title: L("صور ومقاسات حقيقية", "Real photos and sizes"), line: L("اطلبي صورة الشنطة من جوه على واتساب", "Ask for a photo of the inside on WhatsApp") },
      { title: L("ادفعي عند الاستلام", "Pay on delivery"), line: L("كاش مع المندوب", "Cash to the courier") },
    ],
    newsletter: {
      title: L("اعرفي الموديلات الجديدة أول واحدة", "Hear about new styles first"),
      line: L("رسالة لما ينزل موديل جديد، مش أكتر.", "One letter when a new style arrives, nothing more."),
    },
    footer: { line: L("من الشغل الصبح لحد السهرة", "From work to a night out") },
    about: {
      line: L("شنط لكل ساعة في اليوم.", "Bags for every hour of the day."),
      alt: L("جلد غامق بخياطة مزدوجة كريمي وحلقة معدن، قريب أوي", "Dark leather with cream double stitching and a steel ring, up close"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("شنط قليلة، بتشيل يومك كله", "A few bags that carry your whole day"),
      text: L(
        "لمعة بدأت من شنطة واحدة كانت بتتنقل من الشغل للمشوار للعزومة ومش مناسبة لأي حاجة فيهم. فاخترنا أربع عائلات بس: توت وكروس وكلاتش وشنط كتف، وكل موديل بنجرّب سوستته وحزامه قبل ما يتعرض.",
        "Lamaa began with one bag that went from work to errands to dinner and suited none of them. So we kept four families only, totes, crossbody bags, clutches and shoulder bags, and we try the zip and strap of every style before it is listed.",
      ),
      more: L("ولو الشنطة ماعجبتكيش لما توصل، بنبدّلها خلال ١٤ يوم.", "And if the bag is not right when it arrives, we exchange it within 14 days."),
      cta: L("تسوّقي الأكثر طلبًا", "Shop best sellers"),
    },
    contact: {
      title: L("كلّمينا", "Talk to us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("محتارة الشنطة تساع إيه؟ اسألينا", "Not sure what a bag holds? Ask us"),
    },
    faq: {
      line: L("الخامات والمقاسات والتوصيل.", "Materials, sizes and delivery."),
      question: L("أعرف منين الشنطة هتساع حاجتي؟", "How do I know a bag fits my things?"),
      answer: L(
        "مقاس كل شنطة مكتوب في صفحتها بالسنتيمتر، ومعاه طول الحزام وعدد الجيوب. ولو عايزة تتأكدي، ابعتيلنا على واتساب ونقولك تساع موبايل كبير ولا تابلت ولا لاب توب.",
        "Each page lists the bag's size in centimetres, the strap length and the number of pockets. To be sure, message us on WhatsApp and we will tell you whether it takes a large phone, a tablet or a laptop.",
      ),
    },
    custom: {
      // fashion-luxe: the link to the whole catalog, and the noun after a category tile's count.
      "shop-all": L("كل الشنط", "All bags"),
      "products-noun": L("شنط", "bags"),
      // `shanta`: the story's second paragraph, and the promises' heading.
      "story-more": L("ولو محتارة في المقاس، ابعتيلنا ونقولك الشنطة تساع إيه بالظبط.", "Unsure about the size? Message us and we will tell you exactly what the bag holds."),
      "trust-title": L("قبل ما تطلبي", "Before you order"),
      // `shanta`: the four anatomy notes, in the order of `photos.look.dots` (a title of one or two words, one line each).
      "anatomy-1-title": L("الإيدين", "The handles"),
      "anatomy-1-line": L("إيدين مزدوجين ارتفاعهم ١٢ سم: تتشال في الإيد أو على الدراع.", "Two handles with a 12 cm drop, for the hand or the crook of the arm."),
      "anatomy-2-title": L("السوستة والجيوب", "Zip and pockets"),
      "anatomy-2-line": L("سوستة على الوش كله، وجوه جيب بسوستة وجيبين للموبايل والكروت.", "A zip all round the top; inside, one zip pocket and two slip pockets for a phone and cards."),
      "anatomy-3-title": L("المعادن", "The hardware"),
      "anatomy-3-line": L("حلقات دهبي للإيدين، ورجول معدن بتحمي القاعدة من الأرض.", "Gold-tone rings for the handles, and metal feet that keep the base off the floor."),
      "anatomy-4-title": L("المقاس", "The size"),
      "anatomy-4-line": L("٣٠ × ٢٣ × ١٢ سم: تساع موبايل كبير ومحفظة ونضارة.", "30 × 23 × 12 cm: takes a large phone, a wallet and sunglasses."),
    },
  },
  productPage: { copy: { reviews: L("آراء عميلاتنا", "What our customers say"), related: L("شنط ممكن تعجبك", "Bags you may like") } },
  perLook: {
    // fashion-luxe keeps its wide hero and its shop the look until the shoes-and-bags switch takes it off: the dots are the
    // demo's three newest products (the camel crossbody on the cognac barrel bag, the white mini crossbody on the cream pouch,
    // the olive saddle bag on the olive case).
    "fashion-luxe": {
      photos: { look: { src: pexels(9595079, 1400), dots: [{ x: 57, y: 42 }, { x: 52, y: 55 }, { x: 40, y: 69 }] } },
      copy: {
        hero: { alt: L("شنطتين جلد هافان بإيد قصيرة على قاعدة بيضا جنب سعف نخل ناشف في فازة بيج", "Two cognac top-handle bags on a white plinth beside dried palm leaves in a beige vase") },
        look: {
          alt: L("تلات شنط صغيرة فوق بعض على دولاب معدن: هافان وكريمي وزيتي", "Three small bags stacked on a metal cabinet: cognac, cream and olive"),
          eyebrow: L("ألوان الخريف", "Autumn colours"),
          title: L("هافان وكريمي وزيتي", "Cognac, cream and olive"),
          text: L("دوسي على أي نقطة في الصورة وشوفي أقرب شنطة ليها من تشكيلتنا.", "Tap a dot on the photo to see the closest bag from our range."),
        },
      },
    },
  },
};
