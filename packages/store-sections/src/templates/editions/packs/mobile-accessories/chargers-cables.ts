/**
 * The chargers and cables pack (niche editions, ROADMAP F-90): a small
 * charging shop, "Fisha" (Egyptian for a plug), with wall and car chargers,
 * cables, power banks and wireless chargers, sixteen products in four
 * categories of four. Data only; the looks draw it. No React here.
 *
 * Packshots: the generated white-background set in the `library-media`
 * bucket (`editionPhoto("chargers-cables", <slug>)`), square, one each, no
 * brand marks. The Lightning cable is named only for what it fits ("for
 * iPhone"), with no brand names beyond that.
 *
 * Art-directed photos: Pexels, each checked by eye at 900–1500px
 * (2026-11-11): chargers, cables and a power bank on plain surfaces, no
 * people, hands or body parts, no logos or brand lettering, none used by a
 * template or another pack, none twice. Hero 5208870 (wide: a laptop corner,
 * a black phone and a white charger with its cable coiled on beige; only
 * key legends) and 6373172 (tall: a phone with a blank screen on a bamboo
 * stand, a notebook beside it on marble). Tiles: chargers 16886336 (white
 * wall chargers in a power strip, one with its cable; faint embossed marks
 * only), cables 5208819 (two white chargers with coiled cables on beige),
 * power banks 947407 (a black battery with a white cable on red leather),
 * wireless 5083491 (a phone on a round white charging pad; the screen shows a
 * small, faint battery line). Banner 1028674 (two phones charging side by
 * side, white braided cables). Story 3921706 (a white charger, a braided
 * USB-C cable and a grey power bank on marble), for the about page of both
 * looks.
 * Checked and fine but not used: 3921702, 3921712, 4219860, 4097204.
 * Left out after the check: 3921697 (a camera brand on the charger),
 * 30845149, 19495452, 4526406, 39234197, 5948341, 38354917, 10104283,
 * 10104284, 10104285, 10104286, 38354901, 28739307, 21854466, 37421859,
 * 5208781 and 17501811 (brand names or logos on the gear or phone),
 * 5208307 (a logo on the phone), 4004228 (logos on the adapters),
 * 31886525 (lettering on PC power cables), 10736999, 17077380, 7742584,
 * 15921116, 35463920 and 37475677 (screens with readable text or numbers),
 * 9469521 and 32688515 (book titles and brand marks), 19238353 (a hand),
 * 33168016 (a keyboard cable, not this trade), 8101094 (a loose cable on
 * concrete, too bare), 4097206 (fine print on the charger). PNG-only on
 * Pexels (no `.jpeg` file): 7742563, 11031423. Already used by a template:
 * 3921700, 3921628, 3921630, 845239, 4097203, 16886332, 3921708, 3921707,
 * 3921703, 3921718, 12997240, 7688795, 6081231, 3921633, 6726749, 12997239,
 * 914912, 36100789, 1643753, 4219866, 4219862, 4219867, 38649173, 3921695,
 * 5961044, 5083490, 5083410, 7742585, 7742588, 5948344, 5083411, 5208826,
 * 5208832, 34338614, 5208772, 5208777, 37475662.
 *
 * Looks: `kabl`, then `volt`. Neither has category rows; both show the best
 * sellers in compact rows (`kabl` six). Four featured products: `volt`'s
 * hero shows the first featured one (the 65 W charger). No `reviews`: a pack
 * holds no invented buyer quotes, and without them both looks leave their
 * reviews section out. Promises stay generic (no hours, no warranty term).
 */
import { L } from "../../../../designs/_kit";
import { demoStore, pexels } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "chargers-cables";
const shot = (slug: string) => editionPhoto(NICHE, slug);
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

/** Category tiles, 3:4, in the categories' order. */
const TILES = [
  pexels(16886336, 1200), // white wall chargers in a power strip
  pexels(5208819, 1200), // two white chargers with coiled cables on beige
  pexels(947407, 1200), // a black battery with a white cable on red leather
  pexels(5083491, 1200), // a phone on a round white charging pad
];

export const CHARGERS_CABLES: Edition = {
  niche: NICHE,
  looks: ["kabl"],
  priceBand: { min: 150, max: 2000 },
  // Square packshots on pure white: a square white stage shows each piece whole.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("فيشة", "Fisha"),
    description: L(
      "شواحن وكابلات وباور بانك وشواحن لاسلكي، بنختارها عشان تشحن صح.",
      "Chargers, cables, power banks and wireless chargers, picked to charge right.",
    ),
    categories: [
      ["chargers", "شواحن", "Chargers", TILES[0]!],
      ["cables", "كابلات", "Cables", TILES[1]!],
      ["power-banks", "باور بانك", "Power banks", TILES[2]!],
      ["wireless", "شحن لاسلكي", "Wireless charging", TILES[3]!],
    ],
    // Newest first, mixed so a row of the newest shows every category. The first featured product is `volt`'s hero.
    products: [
      ["black-65w-gan-charger", "chargers", "شاحن GaN ٦٥ وات أسود (٢ USB-C و USB-A)", "Black 65W GaN Charger (2× USB-C + USB-A)", shot("black-65w-gan-charger"), 1250, { isFeatured: true, compareAtPrice: 1450, rating: 4.8, sold90: 186 }],
      ["black-braided-usb-c-cable-2m", "cables", "كابل USB-C مضفّر أسود ٢ متر", "Black Braided USB-C Cable, 2 m", shot("black-braided-usb-c-cable-2m"), 280, { isFeatured: true, rating: 4.7, sold90: 342 }],
      ["black-20000mah-power-bank", "power-banks", "باور بانك ٢٠٠٠٠ مللي أمبير أسود", "Black 20000mAh Power Bank", shot("black-20000mah-power-bank"), 1150, { isFeatured: true, compareAtPrice: 1300, rating: 4.7, sold90: 214 }],
      ["black-3-in-1-wireless-stand", "wireless", "ستاند شحن لاسلكي ٣ في ١ أسود", "Black 3-in-1 Wireless Charging Stand", shot("black-3-in-1-wireless-stand"), 1650, { isFeatured: true, rating: 4.6, sold90: 73 }],
      ["white-20w-usb-c-charger", "chargers", "شاحن USB-C سريع ٢٠ وات أبيض", "White 20W USB-C Fast Charger", shot("white-20w-usb-c-charger"), 250, { compareAtPrice: 300, rating: 4.7, sold90: 418 }],
      ["white-usb-c-cable-1m", "cables", "كابل USB-C أبيض ١ متر", "White USB-C Cable, 1 m", shot("white-usb-c-cable-1m"), 150, { rating: 4.5, sold90: 465 }],
      ["white-10000mah-power-bank", "power-banks", "باور بانك ١٠٠٠٠ مللي أمبير أبيض", "White 10000mAh Power Bank", shot("white-10000mah-power-bank"), 750, { rating: 4.6, sold90: 297 }],
      ["white-wireless-charging-pad", "wireless", "شاحن لاسلكي دائري أبيض", "White Wireless Charging Pad", shot("white-wireless-charging-pad"), 450, { rating: 4.5, sold90: 158 }],
      ["white-dual-port-charger", "chargers", "شاحن بمخرجين USB-C و USB-A أبيض", "White Dual-Port Charger (USB-C + USB-A)", shot("white-dual-port-charger"), 450, { rating: 4.6, sold90: 231 }],
      ["white-usb-c-to-lightning-cable", "cables", "كابل USB-C لايتنينج للآيفون أبيض", "White USB-C to Lightning Cable (for iPhone)", shot("white-usb-c-to-lightning-cable"), 220, { rating: 4.6, sold90: 389 }],
      ["white-magnetic-power-bank", "power-banks", "باور بانك مغناطيس لاسلكي أبيض", "White Magnetic Wireless Power Bank", shot("white-magnetic-power-bank"), 1350, { rating: 4.5, sold90: 96 }],
      ["white-wireless-charging-stand", "wireless", "ستاند شحن لاسلكي أبيض", "White Wireless Charging Stand", shot("white-wireless-charging-stand"), 650, { rating: 4.6, sold90: 112 }],
      ["black-car-charger", "chargers", "شاحن عربية أسود", "Black Car Charger", shot("black-car-charger"), 380, { rating: 4.5, sold90: 205 }],
      ["black-3-in-1-cable", "cables", "كابل ٣ في ١ مضفّر أسود", "Black 3-in-1 Braided Cable", shot("black-3-in-1-cable"), 260, { rating: 4.4, sold90: 176 }],
      ["pink-mini-power-bank", "power-banks", "باور بانك ميني بينك", "Pink Mini Power Bank", shot("pink-mini-power-bank"), 550, { rating: 4.5, sold90: 134 }],
      ["black-magnetic-car-mount", "wireless", "حامل مغناطيس للعربية بشحن لاسلكي أسود", "Black Magnetic Wireless Car Mount", shot("black-magnetic-car-mount"), 850, { rating: 4.4, sold90: 88 }],
    ],
  }),
  photos: {
    // Not drawn by `kabl` or `volt` (a search hero and a big-word hero); kept for looks added later. A laptop corner, a phone and a charger on beige, open space on the right.
    hero: { wide: pexels(5208870, 1920), tall: pexels(6373172, 1200) },
    tiles: TILES,
    // Two phones charging side by side: the phones and plugs sit in the middle band, so a 21:9 crop keeps them.
    banner: pexels(1028674, 1920),
    // The about page of both looks (4:5): a charger, a braided cable and a power bank on marble.
    story: pexels(3921706, 1200),
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("الدفع عند الاستلام", "Cash on delivery"),
      L("ابعت موديل موبايلك ونقولك الشاحن المناسب", "Send your phone model and we suggest the right charger"),
    ],
    // `kabl` and `volt`: the header search placeholder, three things a buyer types.
    labels: { search: L("دوّر على شاحن ٢٠ وات، كابل USB-C، باور بانك…", "Search 20W charger, USB-C cable, power bank…") },
    // `kabl`: the header's three trade links. The about page's button goes to the first one.
    nav: [
      { label: L("شواحن", "Chargers"), href: search("شاحن") },
      { label: L("كابلات", "Cables"), href: search("كابل") },
      { label: L("باور بانك", "Power banks"), href: search("باور بانك") },
    ],
    hero: {
      alt: L("لابتوب وموبايل وشاحن أبيض بكابله على خلفية بيج", "A laptop, a phone and a white charger with its cable on beige"),
      eyebrow: L("شحن من غير وجع دماغ", "Charging made simple"),
      // `kabl`: the question over the search box.
      title: L("موبايلك محتاج إيه النهارده؟", "What does your phone need today?"),
      // `kabl`: the search box placeholder.
      line: L("اكتب موديل موبايلك أو نوع الشاحن", "Type your phone model or the charger type"),
      cta: L("تسوّق الشواحن", "Shop chargers"),
    },
    // `kabl`: over the photo tiles; `volt`: over the category chips.
    categories: { title: L("اختار اللي تحتاجه", "Pick what you need") },
    products: {
      primary: {
        // Both looks: best sellers in compact rows, so the title says so.
        title: L("الأكتر طلبًا", "Most ordered"),
        line: L("الشواحن والكابلات اللي الناس بترجع تطلبها تاني.", "The chargers and cables people order again."),
      },
    },
    story: {
      alt: L("شاحن أبيض وكابل USB-C مضفّر وباور بانك على رخامة", "A white charger, a braided USB-C cable and a power bank on marble"),
      eyebrow: L("إزاي بنختار", "How we pick"),
      title: L("بنجرّب قبل ما نبيع", "We test before we sell"),
      text: L(
        "كل شاحن وكابل بنجرّبه على أكتر من موبايل قبل ما يدخل المحل.",
        "We try every charger and cable on more than one phone before it joins the shop.",
      ),
      cta: L("اعرف عننا", "About us"),
    },
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("بنبعت طلبك لأي محافظة", "We send your order to any governorate") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفع لما الطلب يوصلك", "Pay when your order arrives") },
      { title: L("نساعدك تختار", "Help choosing"), line: L("ابعت موديل موبايلك ونرشّحلك", "Send your phone model and we suggest one") },
      { title: L("استبدال سهل", "Easy exchange"), line: L("لو القطعة ما اشتغلتش مع موبايلك", "If the piece does not work with your phone") },
    ],
    newsletter: {
      title: L("اعرف الجديد أول بأول", "Hear about new arrivals"),
      line: L("هنبعتلك لما ينزل شاحن أو كابل جديد بس.", "We only write when a new charger or cable arrives."),
    },
    // `kabl`: the three contact cards. `points.0` is where the shop is, `points.1` why to come.
    help: {
      title: L("مش عارف أنهي شاحن يناسبك؟", "Not sure which charger fits?"),
      line: L("ابعتلنا موديل موبايلك على واتساب", "Send us your phone model on WhatsApp"),
      points: [L("المهندسين، الجيزة", "Mohandessin, Giza"), L("جرّب الشاحن على موبايلك قبل ما تشتري", "Try a charger on your phone before you buy")],
    },
    // `kabl`: four tiles of two or three words, each to a catalog search, over a row of the newest products.
    finder: {
      title: L("بتشحن فين أكتر؟", "Where do you charge most?"),
      line: L("اختار المكان ونوريك اللي يناسبه.", "Pick the place and we show you what fits it."),
      options: [
        { label: L("في البيت", "At home"), href: search("شاحن") },
        { label: L("في المشوار", "On the go"), href: search("باور بانك") },
        { label: L("في العربية", "In the car"), href: search("عربية") },
        { label: L("على المكتب", "At the desk"), href: search("ستاند") },
      ],
    },
    footer: { line: L("شواحن وكابلات تشحن صح.", "Chargers and cables that charge right.") },
    about: {
      line: L("محل شواحن صغير بيختار كل قطعة بيبيعها.", "A small charging shop that picks every piece it sells."),
      alt: L("شاحن أبيض وكابل مضفّر وباور بانك على رخامة", "A white charger, a braided cable and a power bank on marble"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("زهقنا من الشاحن اللي بيبوظ بسرعة", "Tired of chargers that give up fast"),
      text: L(
        "بدأنا لأن كل شوية كان عندنا كابل بيقطع أو شاحن بيسخن. دلوقتي بنجرّب كل حاجة بنفسنا، وبنبيع بس اللي يعجبنا.",
        "We started because a cable kept fraying or a charger kept running hot. Now we try everything ourselves and only sell what we like.",
      ),
      more: L("ولو محتار، ابعتلنا موديل موبايلك ونقولك تاخد إيه.", "Not sure? Send us your phone model and we tell you what to get."),
      // `kabl`: to the first header link (chargers); `volt`: to the best sellers. Fits both.
      cta: L("ابدأ التسوق", "Start shopping"),
    },
    contact: {
      title: L("كلّمنا", "Talk to us"),
      line: L("قولنا موبايلك إيه وبتشحن فين، ونرشّحلك الشاحن أو الكابل المناسب.", "Tell us your phone and where you charge, and we suggest the right charger or cable."),
      heading: L("اسأل عن شاحن أو كابل", "Ask about a charger or cable"),
    },
    faq: {
      line: L("التوافق والتوصيل والاستبدال.", "Compatibility, delivery and exchanges."),
      question: L("إزاي أعرف الشاحن ده يناسب موبايلي؟", "How do I know a charger fits my phone?"),
      answer: L(
        "بص على نوع المدخل في موبايلك (USB-C أو لايتنينج)، ولو مش متأكد ابعتلنا الموديل وإحنا نقولك.",
        "Check your phone's port (USB-C or Lightning). If you are not sure, send us the model and we will tell you.",
      ),
    },
    custom: {
      // `volt`: the hero's giant word behind the first featured product, one short word.
      "hero-word": L("شحن", "CHARGE"),
      // `volt`: the comparison's second row, a promise other shops make too.
      "compare-row-2": L("ضمان على كل قطعة", "A warranty on every piece"),
    },
  },
  productPage: { copy: { reviews: L("رأي اللي جرّبوه", "From people who use it"), related: L("يكمّل معاه", "Pairs well with") } },
};
