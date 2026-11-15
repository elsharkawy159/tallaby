/**
 * The slippers and clogs edition (niche editions, ROADMAP F-90): a summer
 * and home footwear shop, "Zannouba" (Egyptian for a slipper). Sixteen pairs
 * in four categories of four (clogs, slides, flip-flops, home slippers),
 * white-background packshots (`editionPhoto`, square). Data only. No React
 * here.
 *
 * Brand rule (owner): sellers say "كروكس" for any rubber clog, but it is a
 * brand. No product, category or copy here names it: they are clogs (كلوج).
 *
 * Generated photos (2026-11-15, `docs/systems/editions-photos.md`, checked
 * by eye; `scene()` below) replace every Pexels photo `tasfya` draws.
 * The Pexels notes below describe the photos they replaced and the ones
 * no look draws, which stay.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px (2026-11-11):
 * beach sand, towels and home floors; no people, feet or hands, no readable
 * lettering or brand marks, none used by a template or another pack, none
 * twice.
 * Hero 4996730 (wide: a straw hat, zebra flip-flops and a starfish on pale
 * sand) and 4996974 (tall: striped floral flip-flops in beach sand). Tiles:
 * clogs 8801134 (pink clogs on pink, a plain white rivet), slides 13836590
 * (sage slides on dark sand), flip-flops 27719438 (pink jelly flip-flops
 * standing in sand by the sea), home slippers 12969102 (fluffy cross-strap
 * slippers in window light). Banner 18674213 (pink and green striped towels
 * on sand). Story / about 34667259 (white waffle slippers by a woven mat on a
 * light floor). Streetwear's lookbook (square crops): 39245998 (black
 * flip-flops in sand), 35185490 (shell-trimmed flip-flops in sand), 7937991
 * (furry slippers on wood), 8455822 (tropical flip-flops on a beach),
 * 26954799 (white textured slides on sand). Zay's hero collage: 31291725
 * (4:5, rows of navy and olive house slippers on a red mat), 30979945
 * (square, suede slippers on a green sheet), 30979631 (4:3, slippers, coffee
 * and a plant leaf in palm shade).
 *
 * Left out after the check: 39299315 (Havaianas on the footbed), 25038742,
 * 34447681 and 34447683 (Havaianas), 18368104, 18368105, 19826722 and
 * 32396940 (Crocs logos, or a foot), 39048466 (a brand emblem on the rivet),
 * 39864295 (a logo on the heel), 30335806 (script lettering on the
 * footbed), 17033082 (Bata lettering), 1756086 and 27377979 (lettering on
 * the straps), 31504382 and 29546294 (sunscreen brands), 14313221 and
 * 14313232 (VANDALZ), 6852172 (Lacoste), 29320435 ("SLIDE" box), 8223777
 * (a brand mark), 18007777 (DIOR on the hat), 17166366 (lettering on wooden
 * clogs), 37242420 and 37305529 (cartoon character charms), photos with
 * people or feet (18255345, 24509391, 26954372, 34908672 and the clog
 * searches), 18674216 (near copy of 18674213). Already used by a template:
 * 11664691, 9071044.
 *
 * No buyer quotes (`reviews`): a pack holds no invented reviews, so
 * streetwear's about page and zay's home are built without them.
 *
 * No hero video: none found without people or feet.
 *
 * Looks: `tasfya` (the niche's template, one template per niche; it shows
 * the pack itself and is its own content), then `streetwear` and `zay`
 * until the shoes-and-bags switch takes them off. Tasfya's hero is a pool
 * deck: 9308418 (blue polka-dot flip-flops on pale concrete beside the
 * water, checked at 3300px: no lettering on the footbeds, two plain drain
 * covers), served as a 21:9 crop zoomed 1.4× around the pair (2026-11-12
 * QA: the full-width 16:9 crop pushed the headline below the first desktop
 * screen) so the pair reads large and stays in frame on every screen; its
 * `wide` slot is that crop.
 * Streetwear keeps the sand flat lay (4996730) through `perLook`. Tasfya
 * also reads `finder` (where the pair is worn: beach, pool and shower,
 * errands, home, each a search of its category's word) and
 * `custom.shop-all`; its home story sits beside the banner photo.
 * Looked at for tasfya's hero and left out: 8456247 (tropical flip-flops
 * in sand: the pair sits where English copy would go), 29823200 (heeled
 * sandals on a drained mosaic pool), 12932253 (lime clogs by a pool,
 * portrait: does not crop wide, and the heel rivet may carry a brand
 * mark), 33305477 (white flip-flops above a tiled pool, portrait: does not
 * crop wide), 38884670 (yellow slides with a flower decoration).
 */
import { L } from "../../../../designs/_kit";
import { demoStore, handle, pexels, phone } from "../../../library-template";
import type { Localized } from "../../../../core/types";
import type { TemplateDemo } from "../../../types";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "slippers-clogs";
const P = (slug: string) => editionPhoto(NICHE, slug);
/** Generated scenes (2026-11-15, docs/systems/editions-photos.md, checked by eye), same bucket: `scene-<slot>`. */
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

/** Every pair's sizes, as chips on its product page (the story and about page promise 36 to 45 on every page). */
const SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45].map((size) => L(size.toLocaleString("ar-EG"), String(size)));

/** Each pair's product page description (preview only), by slug. */
const DESCRIPTIONS: Readonly<Record<string, Localized>> = {
  "sage-green-clog": L(
    "كلوج مطاطي خفيف بلون أخضر زيتوني فاتح، بفتحات تهوية وسير خلفي يمكن قلبه للأمام. يتحمّل الماء ويُغسل بالماء والصابون.",
    "A light rubber clog in pale sage, with air holes and a back strap that flips forward. It takes the water and washes clean with soap.",
  ),
  "beige-cushion-slide": L(
    "سلايد بيج بنعل سميك وطري، قطعة واحدة من المطاط دون خياطة. للمنزل والشاطئ والمشاوير القريبة.",
    "A beige slide on a thick soft sole, one piece of rubber with no seams. For home, the beach and short trips out.",
  ),
  "white-platform-flip-flops": L(
    "شبشب صباع أبيض بنعل مرتفع خفيف وسير ناعم.",
    "White flip-flops on a light raised sole, with a soft strap.",
  ),
  "grey-fluffy-home-slippers": L(
    "شبشب بيتي مفتوح من الفرو الرمادي الناعم، بنعل مانع للانزلاق على السيراميك. لليالي الباردة.",
    "Open home slippers in soft grey fur, on a sole that holds on tiles. For cold evenings.",
  ),
  "white-classic-clog": L(
    "الكلوج الكلاسيكي باللون الأبيض: مطاط خفيف بفتحات تهوية وسير خلفي قابل للقلب. يُلبس على الشاطئ وفي المنزل.",
    "The classic clog in white: light rubber, air holes and a back strap that flips. Worn at the beach and at home.",
  ),
  "black-rubber-slide": L(
    "سلايد مطاطي أسود بسير عريض ونعل محزّز. يتحمّل الماء، للمسبح والحمّام والنادي الرياضي.",
    "A black rubber slide with a wide strap and a ridged sole. It takes the water: for the pool, the shower and the gym.",
  ),
  "navy-rubber-flip-flops": L(
    "شبشب صباع مطاطي كحلي خفيف، لرمال الشاطئ والمسبح. يُغسل بالماء ويجف بسرعة.",
    "Light navy rubber flip-flops for the sand and the pool. Rinse them with water and they dry fast.",
  ),
  "pink-fur-slides": L(
    "شبشب فرو وردي مفتوح من الأمام، بنعل طري هادئ على الأرض.",
    "Pink fur slides, open at the toe, on a soft sole that stays quiet on the floor.",
  ),
  "black-classic-clog": L(
    "الكلوج الكلاسيكي باللون الأسود: مطاط خفيف بفتحات تهوية وسير خلفي قابل للقلب. لا يظهر عليه الغبار.",
    "The classic clog in black: light rubber, air holes and a back strap that flips. It hides the dust.",
  ),
  "white-two-strap-slide": L(
    "سلايد أبيض بسيرين ونعل طري مريح للمشي. للشاطئ والمشاوير الخفيفة.",
    "A white slide with two straps and a soft sole made for walking. For the beach and light errands.",
  ),
  "black-flip-flops": L("شبشب صباع أسود بسيط من المطاط الخفيف، للشاطئ والمنزل.", "Plain black flip-flops in light rubber, for the beach and the house."),
  "navy-knit-home-slippers": L(
    "شبشب بيتي تريكو كحلي دافئ، يُغسل في الغسالة على البرنامج الهادئ.",
    "Warm navy knit home slippers that go in the washer on a gentle cycle.",
  ),
  "pink-platform-clog": L(
    "كلوج وردي بنعل مرتفع: مطاط خفيف بفتحات تهوية وسير خلفي، بارتفاع إضافي دون وزن زائد.",
    "A pink clog on a platform sole: light rubber, air holes and a back strap. A little extra height without the weight.",
  ),
  "brown-buckle-cork-slide": L(
    "سلايد بنعل من الفلّين وسيرين من الجلد البني بإبزيمين قابلين للضبط.",
    "A cork-sole slide with two brown leather straps and adjustable buckles.",
  ),
  "tan-leather-flip-flops": L(
    "شبشب صباع من الجلد البني الفاتح بنعل جلدي، للصيف والسهرات الخفيفة. ويغمق لون الجلد مع الوقت.",
    "Tan leather flip-flops on a leather sole, for summer days and easy evenings. The leather darkens with time.",
  ),
  "beige-closed-toe-slippers": L(
    "شبشب بيتي مغلق بلون بيج، ببطانة ناعمة ونعل مانع للانزلاق. دافئ في الشتاء.",
    "Closed-toe home slippers in beige, with a soft lining and a sole that holds on tiles. Warm all winter.",
  ),
};

/** The demo with each pair's product page: its description and its sizes (preview only). */
const withProductPages = (demo: TemplateDemo): TemplateDemo => ({
  ...demo,
  products: demo.products.map((p) => ({ ...p, ...(DESCRIPTIONS[p.slug] && { description: DESCRIPTIONS[p.slug] }), variants: SIZES })),
});

/** A catalog search for a word in the products' names. */
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@zannouba.example";
const HANDLE = handle("@zannouba");

export const SLIPPERS_CLOGS: Edition = {
  niche: NICHE,
  looks: ["tasfya"],
  priceBand: { min: 150, max: 1200 },
  // The packshots are square on pure white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: withProductPages(demoStore({
    name: L("زنّوبة", "Zannouba"),
    description: L(
      "كلوج وسلايد وشباشب صباع وشباشب بيتي، للشاطئ والخروج والمنزل.",
      "Clogs, slides, flip-flops and home slippers, for the beach, the street and home.",
    ),
    categories: [
      ["clogs", "كلوج", "Clogs", TILES[0]!],
      ["slides", "سلايد", "Slides", TILES[1]!],
      ["flip-flops", "شباشب صباع", "Flip-flops", TILES[2]!],
      ["home-slippers", "شباشب بيتي", "Home slippers", TILES[3]!],
    ],
    // Newest first, mixed so a row of the newest shows every category. Featured (tasfya's "pick of the week", the newest featured one): three older pairs, so the pick is never one of the four newest beside it.
    products: [
      ["sage-green-clog", "clogs", "كلوج أخضر زيتوني فاتح", "Sage Green Clog", P("sage-green-clog"), 690, { rating: 4.8, sold90: 214 }],
      ["beige-cushion-slide", "slides", "سلايد بيج بنعل طري", "Beige Cushion Slide", P("beige-cushion-slide"), 420, { rating: 4.7, sold90: 263 }],
      ["white-platform-flip-flops", "flip-flops", "شبشب صباع أبيض بنعل مرتفع", "White Platform Flip-Flops", P("white-platform-flip-flops"), 340, { rating: 4.6, sold90: 148 }],
      ["grey-fluffy-home-slippers", "home-slippers", "شبشب بيتي فرو رمادي", "Grey Fluffy Home Slippers", P("grey-fluffy-home-slippers"), 320, { rating: 4.8, sold90: 237 }],
      ["white-classic-clog", "clogs", "كلوج كلاسيكي أبيض", "White Classic Clog", P("white-classic-clog"), 650, { compareAtPrice: 750, rating: 4.7, sold90: 302 }],
      ["black-rubber-slide", "slides", "سلايد مطاطي أسود", "Black Rubber Slide", P("black-rubber-slide"), 280, { rating: 4.6, sold90: 341 }],
      ["navy-rubber-flip-flops", "flip-flops", "شبشب صباع مطاطي كحلي", "Navy Rubber Flip-Flops", P("navy-rubber-flip-flops"), 180, { rating: 4.5, sold90: 389 }],
      ["pink-fur-slides", "home-slippers", "شبشب فرو وردي مفتوح", "Pink Fur Slides", P("pink-fur-slides"), 350, { rating: 4.7, sold90: 176 }],
      ["black-classic-clog", "clogs", "كلوج كلاسيكي أسود", "Black Classic Clog", P("black-classic-clog"), 650, { rating: 4.8, sold90: 268 }],
      ["white-two-strap-slide", "slides", "سلايد أبيض بسيرين", "White Two-Strap Slide", P("white-two-strap-slide"), 380, { rating: 4.5, sold90: 132 }],
      ["black-flip-flops", "flip-flops", "شبشب صباع أسود", "Black Flip-Flops", P("black-flip-flops"), 160, { rating: 4.6, sold90: 412 }],
      ["navy-knit-home-slippers", "home-slippers", "شبشب بيتي تريكو كحلي", "Navy Knit Home Slippers", P("navy-knit-home-slippers"), 290, { rating: 4.6, sold90: 154 }],
      ["pink-platform-clog", "clogs", "كلوج وردي بنعل مرتفع", "Pink Platform Clog", P("pink-platform-clog"), 850, { isFeatured: true, rating: 4.7, sold90: 121 }],
      ["brown-buckle-cork-slide", "slides", "سلايد فلّين بني بإبزيمين", "Brown Buckle Cork Slide", P("brown-buckle-cork-slide"), 950, { isFeatured: true, compareAtPrice: 1100, rating: 4.8, sold90: 97 }],
      ["tan-leather-flip-flops", "flip-flops", "شبشب صباع جلد بني فاتح", "Tan Leather Flip-Flops", P("tan-leather-flip-flops"), 590, { isFeatured: true, rating: 4.7, sold90: 88 }],
      ["beige-closed-toe-slippers", "home-slippers", "شبشب بيتي مغلق بيج", "Beige Closed-Toe Slippers", P("beige-closed-toe-slippers"), 380, { rating: 4.6, sold90: 143 }],
    ],
  })),
  photos: {
    // Tasfya's hero: pink clogs large and centred on the pool deck (16:9; the desktop 21:9 band keeps the pair). The tall one is drawn by no look (Pexels).
    hero: { wide: scene("hero-wide"), tall: pexels(4996974, 1200) },
    tiles: TILES,
    banner: scene("banner"),
    story: scene("story"),
    custom: {
      // Streetwear's lookbook, square: one large photo, then four small ones.
      "lookbook-1": pexels(39245998, 1200),
      "lookbook-2": pexels(35185490, 900),
      "lookbook-3": pexels(7937991, 900),
      "lookbook-4": pexels(8455822, 900),
      "lookbook-5": pexels(26954799, 900),
      // Zay's hero collage: 1 portrait 4:5, 2 square, 3 landscape 4:3, one per caption (`custom.hero-piece-1..3`).
      "hero-piece-1": pexels(31291725, 1200),
      "hero-piece-2": pexels(30979945, 900),
      "hero-piece-3": pexels(30979631, 1400),
    },
  },
  copy: {
    announcement: [
      L("كلوج وسلايد وشباشب", "Clogs, slides and slippers"),
      L("مقاسات من ٣٦ حتى ٤٥", "Sizes 36 to 45"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { about: L("حكايتنا", "Our story"), search: L("ابحث عن كلوج، سلايد، شبشب…", "Search clogs, slides, slippers…") },
    hero: {
      alt: L("كلوج وردي على أرضية بجوار حمام سباحة", "Pink clogs on a pool deck beside the water"),
      eyebrow: L("تشكيلة الصيف", "The summer range"),
      title: L("كلوج وسلايد وشباشب", "Clogs, slides and slippers"),
      line: L(
        "كلوج وسلايد للخروج والشاطئ، وشباشب بيتي طرية، بمقاسات من ٣٦ حتى ٤٥.",
        "Clogs and slides for going out and the beach, and soft home slippers, in sizes 36 to 45.",
      ),
      cta: L("تسوّق الشباشب", "Shop the pairs"),
    },
    categories: { title: L("تسوّق حسب النوع", "Shop by type") },
    // Tasfya: where the pair is worn, each place a search of its category's word (flip-flops, slides, clogs, home slippers).
    finder: {
      title: L("أين ستلبسه؟", "Where will you wear them?"),
      line: L("اختر المكان لترى الشباشب المناسبة له.", "Pick the place and we show you the pairs made for it."),
      options: [
        { label: L("على الشاطئ", "On the beach"), href: search("صباع") },
        { label: L("في المسبح والحمّام", "By the pool and in the shower"), href: search("سلايد") },
        { label: L("في المشاوير والحديقة", "On errands and in the garden"), href: search("كلوج") },
        { label: L("داخل المنزل", "Around the house"), href: search("بيتي") },
      ],
    },
    products: {
      primary: {
        // Streetwear: the eyebrow is also the footer's link to the newest products.
        eyebrow: L("وصل حديثًا", "New in"),
        title: L("أحدث الموديلات", "The newest pairs"),
        line: L("أحدث الكلوج والسلايد والشباشب في المتجر.", "The latest clogs, slides and slippers to arrive."),
      },
    },
    story: {
      alt: L("شبشب بيتي أبيض بجوار دوّاسة خوص على أرضية فاتحة", "White home slippers by a woven mat on a light floor"),
      eyebrow: L("الخامة والنعل", "Sole and material"),
      title: L("للمنزل والشاطئ", "For home and the beach"),
      text: L(
        "نختار كل شبشب حسب نعله وخامته: مطاط يتحمّل الماء، وفرو وتريكو للمنزل. والمقاسات مذكورة في صفحة كل موديل.",
        "We choose every pair for its sole and its material: rubber that takes the water, fur and knit for home. Each style's page lists its sizes.",
      ),
      cta: L("تعرّف علينا", "Our story"),
    },
    // Streetwear's bento and zay's carousel of best sellers.
    rows: [{ title: L("الأكثر طلبًا", "Most ordered") }],
    trust: [
      { title: L("مقاسات واضحة", "Clear sizes"), line: L("مقاسات من ٣٦ حتى ٤٥ لكل موديل", "Sizes 36 to 45 for every style") },
      { title: L("خامات مذكورة", "Materials listed"), line: L("النعل والخامة لكل موديل", "Sole and material for every style") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("تعرّف على الموديلات الجديدة أولًا", "Hear about new styles first"),
      line: L("رسالة عند وصول تشكيلة جديدة فقط.", "One letter when a new range arrives, nothing more."),
    },
    // Streetwear's and zay's large sign-off line.
    footer: { line: L("شباشب للصيف والمنزل", "Pairs for summer and home") },
    about: {
      line: L("شباشب للصيف والمنزل، مختارة بعناية.", "Pairs for summer and home, chosen with care."),
      alt: L("شبشب بيتي أبيض بجوار دوّاسة خوص على أرضية فاتحة", "White home slippers by a woven mat on a light floor"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("شبشب مريح لكل يوم", "A comfortable pair for every day"),
      text: L(
        "زنّوبة متجر للكلوج والسلايد والشباشب. نختار كل موديل حسب نعله وخامته، ونذكر مقاساته من ٣٦ حتى ٤٥ في صفحته.",
        "Zannouba sells clogs, slides and slippers. We choose every style for its sole and its material, and list its sizes from 36 to 45 on its page.",
      ),
      more: L("ولأي سؤال عن المقاس أو الخامة، تواصل معنا.", "For any question about size or material, contact us."),
      cta: L("تسوّق الشباشب", "Shop the pairs"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L(`الإسكندرية، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Alexandria, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("بين مقاسين؟ اسألنا", "Between two sizes? Ask us"),
    },
    faq: {
      line: L("المقاسات والخامات وطريقة الطلب.", "Sizes, materials and ordering."),
      question: L("كيف أختار مقاسي؟", "How do I pick my size?"),
      answer: L(
        "اختر مقاس حذائك المعتاد. الكلوج واسع قليلًا، فإذا كنت بين مقاسين فاختر الأصغر. ولأي سؤال، تواصل معنا.",
        "Pick your usual shoe size. Clogs fit a little roomy, so if you are between two sizes take the smaller one; for any question, contact us.",
      ),
    },
    custom: {
      // Streetwear and zay: the store's short name inside a sentence ("About Zannouba").
      "store-short": L("زنّوبة", "Zannouba"),
      // Streetwear's line beside the hero.
      "hero-note": L("كلوج · سلايد · بيتي", "Clogs · Slides · Home"),
      // Streetwear's round hero sticker: the size range, not an offer.
      "hero-sticker-1": L("مقاسات", "Sizes"),
      "hero-sticker-2": L("٣٦–٤٥", "36–45"),
      "hero-sticker-3": L("للجميع", "for all"),
      "banner-alt": L("شبشب أسود وشبشب صباع أبيض على مناشف شاطئ مخططة على الرمال", "Black slides and white flip-flops on striped beach towels on the sand"),
      "banner-title": L("على الشاطئ", "Beach days"),
      "banner-line": L("سلايد وشباشب صباع مطاطية تتحمّل الرمال والماء.", "Rubber slides and flip-flops that take the sand and the water."),
      "craft-statement": L("شبشب واحد مريح أفضل من خمسة على رف الأحذية.", "One comfortable pair beats five by the door."),
      "craft-statement-cta": L("كل الشباشب", "Shop all pairs"),
      // Tasfya: the header's link to the whole catalog.
      "shop-all": L("كل الشباشب", "All pairs"),
      // Demo handle: the seller's own replaces it.
      "lookbook-handle": L(HANDLE, HANDLE),
      "lookbook-line": L("صور من تشكيلتنا", "Photos from our range"),
      // Zay's hero captions, numbered under the collage photos.
      "hero-piece-1": L("للمنزل", "At home"),
      "hero-piece-2": L("دافئ", "Cosy"),
      "hero-piece-3": L("تريكو وفرو", "Knit and fur"),
      // Zay's comparison: rows 1 and 3 are ticked for the store only, row 2 for both.
      "compare-row-1": L("مقاسات من ٣٦ حتى ٤٥ مذكورة لكل موديل", "Sizes 36 to 45 listed for every style"),
      "compare-row-2": L("صور ومواصفات لكل موديل", "Photos and specs for every style"),
      "compare-row-3": L("النعل والخامة مذكوران لكل موديل", "Sole and material listed for every style"),
    },
  },
  // Streetwear's rail shows the newest products (zay's shelf has its own tabs).
  journey: { primary: "newest" },
  productPage: {
    copy: {
      reviews: L("آراء العملاء", "Customer reviews"),
      related: L("موديلات قد تعجبك", "Pairs you may like"),
      // The product page's four tiles (`product-perks`) say what the home's promises say: size exchange and cash, not the library's returns and card.
      perks: [
        { icon: "truck", title: L("الشحن", "Shipping"), text: L("تظهر تكلفته ومدته عند إتمام الطلب", "Cost and time shown at checkout") },
        { icon: "rotate", title: L("الاستبدال والاسترجاع", "Exchanges and returns"), text: L("راجع صفحة السياسات", "See the policy page") },
        { icon: "chat", title: L("نجيب عن أسئلتك", "Here to help"), text: L("تواصل معنا لأي سؤال", "Contact us with any question") },
        { icon: "package", title: L("طرق الدفع", "Payment methods"), text: L("تظهر عند إتمام الطلب", "Shown at checkout") },
      ],
    },
  },
};
