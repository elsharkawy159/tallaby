/**
 * A fixture pack for tests (niche editions, ROADMAP F-90): a t-shirt shop on
 * `fashion-luxe`, with that template's own Pexels photos. It is never
 * registered in `EDITIONS`; tests pass it to the functions that take packs,
 * or mock the registry with it. No React here.
 */
import { L } from "../../designs/_kit";
import { demoStore, pexels, pexelsVideo, pexelsVideoPoster } from "../library-template";
import type { Edition } from "./types";


const P = (id: number) => pexels(id, 800);
const TILES = [pexels(5706275, 1200), pexels(10838789, 1200), pexels(6044143, 1200), pexels(5706269, 1200)];

/** A t-shirt shop, with `fashion-luxe`'s own photos. Test only: never registered. */
export const TSHIRTS: Edition = {
  niche: "tshirts",
  looks: ["fashion-luxe"],
  priceBand: { min: 200, max: 6000 },
  productStage: { ratio: "4:5", fit: "contain" },
  demo: demoStore({
    name: L("قطنة", "Qotna"),
    description: L("تيشيرتات قطن مصري تقيل، بتتطبع في القاهرة.", "Heavy Egyptian cotton tees, printed in Cairo."),
    categories: [
      ["plain", "تيشيرتات سادة", "Plain tees", TILES[0]!],
      ["shirts", "قمصان وبولو", "Shirts & polos", TILES[1]!],
      ["sweats", "سويت شيرت وتريكو", "Sweatshirts & knits", TILES[2]!],
      ["totes", "شنط وإكسسوارات", "Bags & extras", TILES[3]!],
    ],
    products: [
      ["white-heavy-tee", "plain", "تيشيرت أبيض قطن تقيل", "White Heavyweight Tee", P(12025472), 450, { isFeatured: true, sold90: 90 }],
      ["cable-crew", "sweats", "سويت شيرت ضفاير", "Cable Crew Sweatshirt", P(5704187), 1450, { sold90: 40 }],
      ["canvas-tote", "totes", "شنطة توت بيج", "Beige Tote", P(36365228), 650, { sold90: 35 }],
      ["black-heavy-tee", "plain", "تيشيرت أسود قطن تقيل", "Black Heavyweight Tee", P(8532616), 450, { sold90: 80 }],
      ["fitted-white-tee", "plain", "تيشيرت أبيض مظبوط", "Fitted White Tee", P(11671964), 420, { sold90: 30 }],
      ["striped-tee", "plain", "تيشيرت مقلم", "Striped Tee", P(13181673), 480, { sold90: 28 }],
      ["check-shirt", "shirts", "قميص كاروه كحلي", "Navy Check Shirt", P(28297697), 890, { sold90: 26 }],
      ["zip-polo", "shirts", "بولو بسوستة", "Zip Polo", P(20763273), 950, { sold90: 24 }],
      ["cream-overshirt", "shirts", "أوفر شيرت كريمي", "Cream Overshirt", P(4641824), 1650, { sold90: 22 }],
      ["grey-shirt-jacket", "shirts", "جاكيت قميص رمادي", "Grey Shirt-Jacket", P(13094187), 1750, { sold90: 20 }],
      ["navy-stripe-crew", "sweats", "سويت شيرت مقلم كحلي", "Navy Stripe Crew", P(45982), 1350, { sold90: 18 }],
      ["soft-cardigan", "sweats", "كارديجان ناعم", "Soft Cardigan", P(9603627), 1550, { sold90: 16 }],
      ["ribbed-cardigan", "sweats", "كارديجان ريب", "Ribbed Cardigan", P(9603630), 1500, { sold90: 14 }],
      ["pink-tote", "totes", "شنطة يد وردي", "Pink Tote", P(22432987), 750, { sold90: 12 }],
      ["burgundy-tote", "totes", "شنطة يد نبيتي", "Burgundy Tote", P(22432992), 750, { sold90: 11 }],
      ["floral-bag", "totes", "شنطة مطرزة بالورد", "Floral Embroidered Bag", P(26610519), 900, { sold90: 10 }],
    ],
  }),
  photos: {
    hero: { wide: pexelsVideoPoster(8580858), tall: pexels(27609337, 1200), video: pexelsVideo(8580858, "8580858-hd_1920_1080_30fps.mp4") },
    tiles: TILES,
    banner: pexels(6461507, 1600),
    story: pexels(7147454, 1200),
    look: {
      src: pexels(14577586, 1400),
      dots: [
        { x: 30, y: 40 },
        { x: 55, y: 30 },
        { x: 20, y: 70 },
      ],
    },
  },
  copy: {
    announcement: [L("توصيل لكل محافظات مصر", "Delivery across Egypt"), L("ادفع عند الاستلام", "Pay on delivery"), L("بدّل المقاس خلال ١٤ يوم", "Swap your size within 14 days")],
    labels: { about: L("حكايتنا", "Our story") },
    hero: {
      alt: L("تيشيرتات قطن متعلقة على شماعة", "Cotton tees on a rail"),
      eyebrow: L("دروب الصيف", "The summer drop"),
      title: L("تيشيرت يعيش معاك سنين", "Tees that last for years"),
      line: L("قطن مصري ٢٤٠ جرام، وطباعة ما بتبهتش.", "240 g Egyptian cotton, and prints that do not fade."),
      cta: L("تسوّق التيشيرتات", "Shop the tees"),
    },
    categories: { title: L("اختار القَصّة", "Pick your fit") },
    products: { primary: { title: L("التيشيرتات الأكثر طلبًا", "Best-selling tees"), line: L("اللي الناس بتطلبه تاني وتالت.", "The ones people order again and again.") } },
    story: {
      alt: L("مقص وبكر خيط على ترابيزة القص", "Scissors and thread on the cutting table"),
      eyebrow: L("مطبوع في القاهرة", "Printed in Cairo"),
      title: L("القطن أول حاجة", "Cotton comes first"),
      text: L("بنختار القطن وبنغسله قبل القص، عشان التيشيرت ما يصغرش.", "We pick the cotton and wash it before cutting, so a tee never shrinks."),
      cta: L("اعرف حكايتنا", "Read our story"),
    },
    look: {
      alt: L("تيشيرت وسويت شيرت وشنطة على رخام أبيض", "A tee, a sweatshirt and a tote laid on white marble"),
      eyebrow: L("لبس الأسبوع", "This week's outfit"),
      title: L("تلات قطع ليوم كامل", "Three pieces for a whole day"),
      text: L("دوس على أي نقطة في الصورة وشوف القطعة.", "Tap a dot on the photo to see the piece."),
    },
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("من يوم إلى ٤ أيام", "1 to 4 days") },
      { title: L("بدّل المقاس", "Swap your size"), line: L("خلال ١٤ يوم من الاستلام", "Within 14 days of delivery") },
      { title: L("قطن مغسول", "Pre-washed cotton"), line: L("المقاس ثابت بعد الغسيل", "The size holds after washing") },
      { title: L("ادفع عند الاستلام", "Pay on delivery"), line: L("كاش مع المندوب", "Cash to the courier") },
    ],
    newsletter: { title: L("اعرف الدروب الجديد أول واحد", "Hear about each drop first"), line: L("رسالة واحدة مع كل دروب.", "One letter with every drop.") },
    about: {
      line: L("تيشيرتات قطن تقيل، من القاهرة.", "Heavyweight cotton tees, from Cairo."),
      alt: L("ماكينة خياطة جنب جدار أبيض", "A sewing machine by a white wall"),
      eyebrow: L("الورشة", "The workshop"),
      title: L("موديلات قليلة، معمولة صح", "Few styles, made right"),
      text: L("بنعمل دروب صغير كل شهرين، وكل تيشيرت بيتراجع قبل التغليف.", "We make one small drop every two months, and every tee is checked before it is packed."),
      more: L("ولو المقاس مش مظبوط بنبدّله من غير أسئلة.", "And if the size is wrong we swap it, no questions asked."),
      cta: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
    },
    contact: {
      title: L("كلّمنا", "Talk to us"),
      line: L("ابعتلنا طولك ووزنك ونقولك المقاس المناسب.", "Send us your height and weight and we tell you your size."),
      heading: L("اسأل عن المقاس", "Ask about sizing"),
    },
    faq: {
      line: L("المقاسات والغسيل والاستبدال.", "Sizing, washing and swaps."),
      question: L("التيشيرت بيصغر بعد الغسيل؟", "Does a tee shrink in the wash?"),
      answer: L("لأ، القطن مغسول قبل القص. اغسله على ٣٠ درجة.", "No, the cotton is washed before it is cut. Wash it at 30 degrees."),
    },
  },
  productPage: { copy: { reviews: L("رأي اللي لبسوه", "From people who wear it") } },
};
