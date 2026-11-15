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
 * Generated photos (2026-11-15, `docs/systems/editions-photos.md`, checked
 * by eye; `scene-<slot>` in the same bucket) now replace the Pexels photos
 * `kabl` draws: the four tiles and the story. Still Pexels, drawn by no look:
 * the heroes 5208870 and 6373172 and the banner 1028674.
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
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

/** Category tiles, 3:4, in the categories' order. */
const TILES = [
  scene("tile-1"), // a black GaN charger, a white charger and a car charger in a row on cool grey
  scene("tile-2"), // a black braided, a white and a 3-in-1 cable coiled side by side on navy cloth
  scene("tile-3"), // a black, a white magnetic and a pink power bank stacked on grey stone
  scene("tile-4"), // a phone on a round white pad beside a 3-in-1 stand on a soft-yellow desk
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
      "شواحن وكابلات وباور بانك وشواحن لاسلكية.",
      "Chargers, cables, power banks and wireless chargers.",
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
      ["white-usb-c-to-lightning-cable", "cables", "كابل USB-C إلى Lightning للآيفون أبيض", "White USB-C to Lightning Cable (for iPhone)", shot("white-usb-c-to-lightning-cable"), 220, { rating: 4.6, sold90: 389 }],
      ["white-magnetic-power-bank", "power-banks", "باور بانك مغناطيسي لاسلكي أبيض", "White Magnetic Wireless Power Bank", shot("white-magnetic-power-bank"), 1350, { rating: 4.5, sold90: 96 }],
      ["white-wireless-charging-stand", "wireless", "ستاند شحن لاسلكي أبيض", "White Wireless Charging Stand", shot("white-wireless-charging-stand"), 650, { rating: 4.6, sold90: 112 }],
      ["black-car-charger", "chargers", "شاحن عربية أسود", "Black Car Charger", shot("black-car-charger"), 380, { rating: 4.5, sold90: 205 }],
      ["black-3-in-1-cable", "cables", "كابل ٣ في ١ مضفّر أسود", "Black 3-in-1 Braided Cable", shot("black-3-in-1-cable"), 260, { rating: 4.4, sold90: 176 }],
      ["pink-mini-power-bank", "power-banks", "باور بانك صغير وردي", "Pink Mini Power Bank", shot("pink-mini-power-bank"), 550, { rating: 4.5, sold90: 134 }],
      ["black-magnetic-car-mount", "wireless", "حامل مغناطيسي للعربية بشحن لاسلكي أسود", "Black Magnetic Wireless Car Mount", shot("black-magnetic-car-mount"), 850, { rating: 4.4, sold90: 88 }],
    ],
  }),
  photos: {
    // Not drawn by `kabl` or `volt` (a search hero and a big-word hero); kept for looks added later. A laptop corner, a phone and a charger on beige, open space on the right.
    hero: { wide: pexels(5208870, 1920), tall: pexels(6373172, 1200) },
    tiles: TILES,
    // Two phones charging side by side: the phones and plugs sit in the middle band, so a 21:9 crop keeps them.
    banner: pexels(1028674, 1920),
    // The about page of both looks (4:5): a charger, a braided cable and a power bank on marble.
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("شواحن وكابلات وباور بانك", "Chargers, cables and power banks"),
      L("مواصفات واضحة لكل منتج", "Clear specs for every product"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    // `kabl` and `volt`: the header search placeholder, three things a buyer types.
    labels: { search: L("ابحث عن شاحن ٢٠ وات، كابل USB-C، باور بانك…", "Search 20W charger, USB-C cable, power bank…") },
    // `kabl`: the header's three trade links. The about page's button goes to the first one.
    nav: [
      { label: L("شواحن", "Chargers"), href: search("شاحن") },
      { label: L("كابلات", "Cables"), href: search("كابل") },
      { label: L("باور بانك", "Power banks"), href: search("باور بانك") },
    ],
    hero: {
      alt: L("حاسوب محمول وهاتف وشاحن أبيض بكابله على خلفية بيج", "A laptop, a phone and a white charger with its cable on beige"),
      eyebrow: L("شحن بسهولة", "Charging made simple"),
      // `kabl`: the question over the search box.
      title: L("ماذا يحتاج هاتفك اليوم؟", "What does your phone need today?"),
      // `kabl`: the search box placeholder.
      line: L("اكتب طراز هاتفك أو نوع الشاحن", "Type your phone model or the charger type"),
      cta: L("تسوّق الشواحن", "Shop chargers"),
    },
    // `kabl`: over the photo tiles; `volt`: over the category chips.
    categories: { title: L("اختر ما تحتاجه", "Pick what you need") },
    products: {
      primary: {
        // Both looks: best sellers in compact rows, so the title says so.
        title: L("الأكثر طلبًا", "Most ordered"),
        line: L("الشواحن والكابلات الأكثر طلبًا.", "Our most-ordered chargers and cables."),
      },
    },
    story: {
      alt: L("شاحن أبيض وكابل USB-C مضفّر وباور بانك على رخامة", "A white charger, a braided USB-C cable and a power bank on marble"),
      eyebrow: L("كيف نختار", "How we pick"),
      title: L("مواصفات واضحة", "Clear specs"),
      text: L(
        "نذكر قدرة كل شاحن ونوع منفذه وطول كل كابل في صفحته.",
        "Each charger's wattage and port, and each cable's length, are on its page.",
      ),
      cta: L("من نحن", "About us"),
    },
    trust: [
      { title: L("مواصفات واضحة", "Clear specs"), line: L("القدرة ونوع المنفذ لكل منتج", "Wattage and port for every product") },
      { title: L("تشكيلة متنوعة", "A full range"), line: L("شواحن وكابلات وباور بانك", "Chargers, cables and power banks") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("تعرّف على الجديد أولًا بأول", "Hear about new arrivals"),
      line: L("نراسلك فقط عند وصول شاحن أو كابل جديد.", "We only write when a new charger or cable arrives."),
    },
    // `kabl`: the three contact cards. `points.0` is where the shop is, `points.1` why to come.
    help: {
      title: L("لا تعرف أي شاحن يناسبك؟", "Not sure which charger fits?"),
      line: L("تواصل معنا واذكر طراز هاتفك", "Contact us with your phone model"),
      points: [L("نوع المنفذ وقدرة الشحن في صفحة كل منتج", "Port and wattage on every product page"), L("شواحن USB-C وLightning ولاسلكية", "USB-C, Lightning and wireless chargers")],
    },
    // `kabl`: four tiles of two or three words, each to a catalog search, over a row of the newest products.
    finder: {
      title: L("أين تشحن أكثر؟", "Where do you charge most?"),
      line: L("اختر المكان لترى ما يناسبه.", "Pick the place and we show you what fits it."),
      options: [
        { label: L("في المنزل", "At home"), href: search("شاحن") },
        { label: L("أثناء التنقل", "On the go"), href: search("باور بانك") },
        { label: L("في السيارة", "In the car"), href: search("عربية") },
        { label: L("على المكتب", "At the desk"), href: search("ستاند") },
      ],
    },
    footer: { line: L("شواحن وكابلات وباور بانك.", "Chargers, cables and power banks.") },
    about: {
      line: L("متجر للشواحن والكابلات، نختار كل قطعة بعناية.", "A charging shop that picks every piece with care."),
      alt: L("شاحن أبيض وكابل مضفّر وباور بانك على رخام", "A white charger, a braided cable and a power bank on marble"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("شواحن وكابلات مختارة", "Chosen chargers and cables"),
      text: L(
        "فيشة متجر للشواحن والكابلات والباور بانك والشواحن اللاسلكية، ونذكر مواصفات كل قطعة في صفحتها.",
        "Fisha sells chargers, cables, power banks and wireless chargers, with each piece's specs on its page.",
      ),
      more: L("ولأي سؤال عن التوافق مع هاتفك، تواصل معنا.", "For any question about what works with your phone, contact us."),
      // `kabl`: to the first header link (chargers); `volt`: to the best sellers. Fits both.
      cta: L("ابدأ التسوق", "Start shopping"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L("اسألنا عن الشاحن أو الكابل المناسب لهاتفك.", "Ask us about the right charger or cable for your phone."),
      heading: L("اسأل عن شاحن أو كابل", "Ask about a charger or cable"),
    },
    faq: {
      line: L("التوافق والمواصفات وطريقة الطلب.", "Compatibility, specs and ordering."),
      question: L("كيف أعرف أن الشاحن يناسب هاتفي؟", "How do I know a charger fits my phone?"),
      answer: L(
        "تحقق من نوع المنفذ في هاتفك (USB-C أو Lightning)، وإذا لم تكن متأكدًا تواصل معنا واذكر الطراز.",
        "Check your phone's port (USB-C or Lightning). If you are not sure, contact us with the model.",
      ),
    },
    custom: {
      // `volt`: the hero's giant word behind the first featured product, one short word.
      "hero-word": L("شحن", "CHARGE"),
      // `volt`: the comparison's second row, a promise other shops make too.
      "compare-row-2": L("مواصفات واضحة لكل قطعة", "Clear specs for every piece"),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("يُستخدم معه", "Pairs well with") } },
};
