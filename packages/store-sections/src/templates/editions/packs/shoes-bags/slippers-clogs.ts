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

/**
 * Tasfya's hero: the pool deck, cropped 21:9 and zoomed 1.4× around the pair
 * (the right of the photo, its lower half), so the flip-flops read at desktop
 * width and the headline still fits the first screen; phones show a 16:9 cut
 * of it, which keeps the pair whole.
 */
const POOL_DECK = "https://images.pexels.com/photos/9308418/pexels-photo-9308418.jpeg?auto=compress&cs=tinysrgb&fit=crop&crop=focalpoint&fp-x=0.65&fp-y=0.72&fp-z=1.4&w=1920&h=823";

/** Every pair's sizes, as chips on its product page (the story and about page promise 36 to 45 on every page). */
const SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45].map((size) => L(size.toLocaleString("ar-EG"), String(size)));

/** Each pair's product page description (preview only), by slug. */
const DESCRIPTIONS: Readonly<Record<string, Localized>> = {
  "sage-green-clog": L(
    "كلوج كاوتش خفيف بلون أخضر زيتوني فاتح، بفتحات تهوية وسير ورا الكعب بيتقلب لقدّام. بيستحمل المية ويتغسل بالمية والصابون.",
    "A light rubber clog in pale sage, with air holes and a heel strap that flips forward. It takes the water and washes clean with soap.",
  ),
  "beige-cushion-slide": L(
    "سلايد بيج بنعل طري تخين، قطعة واحدة كاوتش من غير خياطة. للبيت والبحر والمشوار القريب.",
    "A beige slide on a thick soft sole, one piece of rubber with no seams. For home, the beach and short trips out.",
  ),
  "white-platform-flip-flops": L(
    "شبشب صباع أبيض بنعل عالي خفيف، وسير طري ما بيجرحش بين الصوابع.",
    "White flip-flops on a light raised sole, with a soft strap that does not rub between the toes.",
  ),
  "grey-fluffy-home-slippers": L(
    "شبشب بيتي مفتوح من فرو رمادي ناعم، بنعل ما بيزحلقش على السيراميك. لليالي البرد.",
    "Open home slippers in soft grey fur, on a sole that holds on tiles. For cold evenings.",
  ),
  "white-classic-clog": L(
    "الكلوج الكلاسيك بالأبيض: كاوتش خفيف بفتحات تهوية وسير كعب بيتقلب. بيتلبس على البحر وفي البيت.",
    "The classic clog in white: light rubber, air holes and a heel strap that flips. Worn at the beach and at home.",
  ),
  "black-rubber-slide": L(
    "سلايد كاوتش أسود بسير عريض ونعل محزّز. بيستحمل المية، للبيسين والحمّام والجيم.",
    "A black rubber slide with a wide strap and a ridged sole. It takes the water: for the pool, the shower and the gym.",
  ),
  "navy-rubber-flip-flops": L(
    "شبشب صباع كاوتش كحلي خفيف، لرملة البحر والبيسين. بيتغسل بالمية وبينشف بسرعة.",
    "Light navy rubber flip-flops for the sand and the pool. Rinse them with water and they dry fast.",
  ),
  "pink-fur-slides": L(
    "شبشب فرو بمبي مفتوح من قدّام، بنعل طري ما بيعملش صوت على الأرض.",
    "Pink fur slides, open at the toe, on a soft sole that stays quiet on the floor.",
  ),
  "black-classic-clog": L(
    "الكلوج الكلاسيك بالأسود: كاوتش خفيف بفتحات تهوية وسير كعب بيتقلب. ما بيبانش عليه التراب.",
    "The classic clog in black: light rubber, air holes and a heel strap that flips. It hides the dust.",
  ),
  "white-two-strap-slide": L(
    "سلايد أبيض بسيرين ونعل طري مريح للمشي. للبحر والمشاوير الخفيفة.",
    "A white slide with two straps and a soft sole made for walking. For the beach and light errands.",
  ),
  "black-flip-flops": L("شبشب صباع أسود بسيط، كاوتش خفيف للبحر والبيت.", "Plain black flip-flops in light rubber, for the beach and the house."),
  "navy-knit-home-slippers": L(
    "شبشب بيتي تريكو كحلي، بيدفّي رجلك وبيتغسل في الغسالة على البرنامج الهادي.",
    "Navy knit home slippers that keep your feet warm and go in the washer on a gentle cycle.",
  ),
  "pink-platform-clog": L(
    "كلوج بمبي بنعل عالي: كاوتش خفيف بفتحات تهوية وسير كعب. بيطوّلك شوية من غير ما يتقل.",
    "A pink clog on a platform sole: light rubber, air holes and a heel strap. A little extra height without the weight.",
  ),
  "brown-buckle-cork-slide": L(
    "سلايد بنعل فلّين وسيرين جلد بني بتوك بتتظبط على رجلك. النعل بياخد شكل رجلك مع اللبس.",
    "A cork-sole slide with two brown leather straps and buckles you set to your foot. The footbed shapes to you as you wear it.",
  ),
  "tan-leather-flip-flops": L(
    "شبشب صباع جلد هافان بنعل جلد، للصيف والسهرات الخفيفة. الجلد بيغمق ويحلو مع الوقت.",
    "Tan leather flip-flops on a leather sole, for summer days and easy evenings. The leather darkens and gets better with time.",
  ),
  "beige-closed-toe-slippers": L(
    "شبشب بيتي مقفول بيج، ببطانة ناعمة ونعل ما بيزحلقش. بيدفّي رجلك في الشتا.",
    "Closed-toe home slippers in beige, with a soft lining and a sole that holds on tiles. Warm feet all winter.",
  ),
};

/** The demo with each pair's product page: its description and its sizes (preview only). */
const withProductPages = (demo: TemplateDemo): TemplateDemo => ({
  ...demo,
  products: demo.products.map((p) => ({ ...p, ...(DESCRIPTIONS[p.slug] && { description: DESCRIPTIONS[p.slug] }), variants: SIZES })),
});

/** A catalog search for a word in the products' names. */
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const TILES = [pexels(8801134, 1200), pexels(13836590, 1200), pexels(27719438, 1200), pexels(12969102, 1200)];

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
      "كلوج وسلايد وشباشب صباع وشباشب بيتي، للبحر والشارع والبيت.",
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
      ["white-platform-flip-flops", "flip-flops", "شبشب صباع أبيض بنعل عالي", "White Platform Flip-Flops", P("white-platform-flip-flops"), 340, { rating: 4.6, sold90: 148 }],
      ["grey-fluffy-home-slippers", "home-slippers", "شبشب بيتي فرو رمادي", "Grey Fluffy Home Slippers", P("grey-fluffy-home-slippers"), 320, { rating: 4.8, sold90: 237 }],
      ["white-classic-clog", "clogs", "كلوج كلاسيك أبيض", "White Classic Clog", P("white-classic-clog"), 650, { compareAtPrice: 750, rating: 4.7, sold90: 302 }],
      ["black-rubber-slide", "slides", "سلايد كاوتش أسود", "Black Rubber Slide", P("black-rubber-slide"), 280, { rating: 4.6, sold90: 341 }],
      ["navy-rubber-flip-flops", "flip-flops", "شبشب صباع كاوتش كحلي", "Navy Rubber Flip-Flops", P("navy-rubber-flip-flops"), 180, { rating: 4.5, sold90: 389 }],
      ["pink-fur-slides", "home-slippers", "شبشب فرو بمبي مفتوح", "Pink Fur Slides", P("pink-fur-slides"), 350, { rating: 4.7, sold90: 176 }],
      ["black-classic-clog", "clogs", "كلوج كلاسيك أسود", "Black Classic Clog", P("black-classic-clog"), 650, { rating: 4.8, sold90: 268 }],
      ["white-two-strap-slide", "slides", "سلايد أبيض بسيرين", "White Two-Strap Slide", P("white-two-strap-slide"), 380, { rating: 4.5, sold90: 132 }],
      ["black-flip-flops", "flip-flops", "شبشب صباع أسود", "Black Flip-Flops", P("black-flip-flops"), 160, { rating: 4.6, sold90: 412 }],
      ["navy-knit-home-slippers", "home-slippers", "شبشب بيتي تريكو كحلي", "Navy Knit Home Slippers", P("navy-knit-home-slippers"), 290, { rating: 4.6, sold90: 154 }],
      ["pink-platform-clog", "clogs", "كلوج بمبي بنعل عالي", "Pink Platform Clog", P("pink-platform-clog"), 850, { isFeatured: true, rating: 4.7, sold90: 121 }],
      ["brown-buckle-cork-slide", "slides", "سلايد فلّين بني بتوكتين", "Brown Buckle Cork Slide", P("brown-buckle-cork-slide"), 950, { isFeatured: true, compareAtPrice: 1100, rating: 4.8, sold90: 97 }],
      ["tan-leather-flip-flops", "flip-flops", "شبشب صباع جلد هافان", "Tan Leather Flip-Flops", P("tan-leather-flip-flops"), 590, { isFeatured: true, rating: 4.7, sold90: 88 }],
      ["beige-closed-toe-slippers", "home-slippers", "شبشب بيتي مقفول بيج", "Beige Closed-Toe Slippers", P("beige-closed-toe-slippers"), 380, { rating: 4.6, sold90: 143 }],
    ],
  })),
  photos: {
    hero: { wide: POOL_DECK, tall: pexels(4996974, 1200) },
    tiles: TILES,
    banner: pexels(18674213, 2000),
    story: pexels(34667259, 1200),
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
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("ادفع عند الاستلام", "Pay on delivery"),
      L("استبدال المقاس خلال ١٤ يوم", "Size exchange within 14 days"),
    ],
    labels: { about: L("حكايتنا", "Our story"), search: L("دوّر على كلوج، سلايد، شبشب…", "Search clogs, slides, slippers…") },
    hero: {
      alt: L("شبشب صباع كحلي منقّط على أرضية حمام سباحة جنب المية", "Blue polka-dot flip-flops on a pool deck beside the water"),
      eyebrow: L("تشكيلة الصيف", "The summer range"),
      title: L("صيف خفيف وبيت مريح", "Light summers, comfy homes"),
      line: L(
        "كلوج وسلايد للشارع والبحر، وشباشب بيتي طرية لآخر اليوم، بمقاسات من ٣٦ لـ ٤٥.",
        "Clogs and slides for the street and the beach, and soft home slippers for the end of the day, in sizes 36 to 45.",
      ),
      cta: L("تسوّق الشباشب", "Shop the pairs"),
    },
    categories: { title: L("لكل مشوار شبشب", "A pair for every outing") },
    // Tasfya: where the pair is worn, each place a search of its category's word (flip-flops, slides, clogs, home slippers).
    finder: {
      title: L("هتلبسه فين؟", "Where will you wear them?"),
      line: L("اختار المكان ونوريك الشباشب اللي تناسبه.", "Pick the place and we show you the pairs made for it."),
      options: [
        { label: L("على البحر", "On the beach"), href: search("صباع") },
        { label: L("في البيسين والحمّام", "By the pool and in the shower"), href: search("سلايد") },
        { label: L("في المشاوير والجنينة", "On errands and in the garden"), href: search("كلوج") },
        { label: L("جوّه البيت", "Around the house"), href: search("بيتي") },
      ],
    },
    products: {
      primary: {
        // Streetwear: the eyebrow is also the footer's link to the newest products.
        eyebrow: L("وصل حديثًا", "New in"),
        title: L("أحدث الموديلات", "The newest pairs"),
        line: L("آخر الكلوج والسلايد والشباشب اللي نزلت عندنا.", "The latest clogs, slides and slippers to arrive."),
      },
    },
    story: {
      alt: L("شبشب بيتي أبيض جنب دوّاسة خوص على أرضية فاتحة", "White home slippers by a woven mat on a light floor"),
      eyebrow: L("الراحة أول حاجة", "Comfort comes first"),
      title: L("من باب البيت لرملة البحر", "From the front door to the beach"),
      text: L(
        "بنختار كل شبشب على حسب نعله وخامته: كاوتش يستحمل المية، وفرو وتريكو يدفّوا رجلك في البيت. والمقاسات مكتوبة في صفحة كل موديل.",
        "We choose every pair for its sole and its material: rubber that takes the water, fur and knit that keep you warm at home. Each style's page lists its sizes.",
      ),
      cta: L("اعرف حكايتنا", "Read our story"),
    },
    // Streetwear's bento and zay's carousel of best sellers.
    rows: [{ title: L("الأكثر طلبًا", "Most ordered") }],
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("بنوصّل لكل محافظات مصر", "We deliver to every governorate") },
      { title: L("استبدال المقاس", "Size exchange"), line: L("خلال ١٤ يوم من الاستلام", "Within 14 days of delivery") },
      { title: L("مساعدة في المقاس", "Help with sizing"), line: L("ابعتلنا طول رجلك بالسنتيمتر على واتساب", "Send us your foot length in centimetres on WhatsApp") },
      { title: L("ادفع عند الاستلام", "Pay on delivery"), line: L("كاش مع المندوب", "Cash to the courier") },
    ],
    newsletter: {
      title: L("اعرف الموديلات الجديدة أول واحد", "Hear about new styles first"),
      line: L("رسالة لما تنزل تشكيلة جديدة، مش أكتر.", "One letter when a new range arrives, nothing more."),
    },
    // Streetwear's and zay's large sign-off line.
    footer: { line: L("خفّف رجلك", "Go easy on your feet") },
    about: {
      line: L("شباشب للصيف والبيت، مختارة على الراحة.", "Pairs for summer and home, chosen for comfort."),
      alt: L("شبشب بيتي أبيض جنب دوّاسة خوص على أرضية فاتحة", "White home slippers by a woven mat on a light floor"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("شبشب مريح مش رفاهية", "A comfortable pair is a must"),
      text: L(
        "زنّوبة بدأت من حاجة بسيطة: الشبشب اللي بنلبسه أكتر من أي جزمة لازم يكون مريح ويعيش. فبنختار كل موديل على حسب نعله وخامته، وبنكتب مقاساته من ٣٦ لـ ٤٥ في صفحته.",
        "Zannouba began with a simple thought: the pair you wear more than any shoe should be comfortable and last. So we choose every style for its sole and its material, and list its sizes from 36 to 45 on its page.",
      ),
      more: L("ولو المقاس مش مظبوط عليك، بنبدّله خلال ١٤ يوم.", "And if the size is not right, we exchange it within 14 days."),
      cta: L("تسوّق الشباشب", "Shop the pairs"),
    },
    contact: {
      title: L("كلّمنا", "Talk to us"),
      line: L(`الإسكندرية، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Alexandria, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("محتار بين مقاسين؟ اسألنا", "Between two sizes? Ask us"),
    },
    faq: {
      line: L("المقاسات والتوصيل والاستبدال.", "Sizes, delivery and exchanges."),
      question: L("أختار مقاسي إزاي؟", "How do I pick my size?"),
      answer: L(
        "اختار نفس مقاس جزمتك. الكلوج واسع شوية، فلو بين مقاسين خد الأصغر، ولو محتار ابعتلنا طول رجلك ونقولك الأنسب.",
        "Pick your usual shoe size. Clogs fit a little roomy, so if you are between two sizes take the smaller one; if you are unsure, send us your foot length and we will tell you which fits.",
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
      "hero-sticker-3": L("للكل", "for all"),
      "banner-alt": L("فوط بحر مخططة بمبي وأخضر على الرملة", "Pink and green striped beach towels on the sand"),
      "banner-title": L("على البحر", "Beach days"),
      "banner-line": L("سلايد وشباشب صباع كاوتش تستحمل الرملة والمية.", "Rubber slides and flip-flops that take the sand and the water."),
      "craft-statement": L("شبشب واحد مريح أحسن من خمسة على الجزّامة.", "One comfortable pair beats five by the door."),
      "craft-statement-cta": L("كل الشباشب", "Shop all pairs"),
      // Tasfya: the header's link to the whole catalog.
      "shop-all": L("كل الشباشب", "All pairs"),
      // Demo handle: the seller's own replaces it.
      "lookbook-handle": L(HANDLE, HANDLE),
      "lookbook-line": L("صور جديدة كل صيف", "New photos every summer"),
      // Zay's hero captions, numbered under the collage photos.
      "hero-piece-1": L("للبيت", "At home"),
      "hero-piece-2": L("دافي", "Cosy"),
      "hero-piece-3": L("صباح هادي", "Slow mornings"),
      // Zay's comparison: rows 1 and 3 are ticked for the store only, row 2 for both.
      "compare-row-1": L("مقاسات من ٣٦ لـ ٤٥ مكتوبة لكل موديل", "Sizes 36 to 45 listed for every style"),
      "compare-row-2": L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      "compare-row-3": L("استبدال المقاس خلال ١٤ يوم", "Size exchange within 14 days"),
    },
  },
  // Streetwear's rail shows the newest products (zay's shelf has its own tabs).
  journey: { primary: "newest" },
  productPage: {
    copy: {
      reviews: L("آراء اللي لبسوه", "From people who wear them"),
      related: L("موديلات ممكن تعجبك", "Pairs you may like"),
      // The product page's four tiles (`product-perks`) say what the home's promises say: size exchange and cash, not the library's returns and card.
      perks: [
        { icon: "truck", title: L("توصيل لحد الباب", "Delivered to your door"), text: L("لكل محافظات مصر", "To every governorate") },
        { icon: "rotate", title: L("استبدال المقاس", "Size exchange"), text: L("خلال ١٤ يوم من الاستلام", "Within 14 days of delivery") },
        { icon: "chat", title: L("مساعدة في المقاس", "Help with sizing"), text: L("ابعتلنا طول رجلك على واتساب", "Send us your foot length on WhatsApp") },
        { icon: "package", title: L("ادفع عند الاستلام", "Pay on delivery"), text: L("كاش مع المندوب", "Cash to the courier") },
      ],
    },
  },
};
