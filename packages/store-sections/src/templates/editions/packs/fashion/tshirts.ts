/**
 * The t-shirts edition (niche editions pilot, ROADMAP F-90): a cotton tee
 * shop, "Noss Kom" (Egyptian for "short sleeve"). Sixteen tees in four
 * categories of four (basics, oversized, stripes and prints, polos),
 * white-background flat lays (`editionPhoto`, square). Data only. No React
 * here.
 *
 * Art-directed photos: Pexels, checked 2026-11-11: bright and casual; tees on
 * rails and hangers, a striped weave, cotton; no people, no logos, none used
 * by a template or another pack.
 * Hero 40450765 (wide: tees in many colours on a rail) and 7857552 (tall:
 * bright tees on wooden hangers). Tiles: basics 7319172 (a white tee on a
 * hanger in a shop), oversized 37704842 (a loose cream tee in a patch of
 * sunlight; its neck label and hem tag are too small to read), stripes and
 * prints 7640756 (a blue and white striped weave), polos 28460164 (a pile of
 * tipped polo collars). Banner 2112648 (white tees on black hangers). Story /
 * about 9702241 (a cotton branch on white). Shop the look 38928670: polos in
 * many colours fanned out on wooden hangers over a straw mat; the dots are
 * the burgundy polo in front, a white one and the navy one at the back, the
 * demo's three newest products, so those three stay first in `products`
 * (the front polo's neck label reads "M": see the pilot report).
 * Streetwear's lookbook (square crops): 8146450, 12039633, 9940948,
 * 13924869, 4440651.
 *
 * No buyer quotes (`reviews`): a pack holds no invented reviews, so
 * streetwear's about page is built without that section.
 *
 * No hero video: none found without people, so the looks show the poster.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, handle, pexels, phone } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "tshirts";
const P = (slug: string) => editionPhoto(NICHE, slug);

const TILES = [pexels(7319172, 1200), pexels(37704842, 1200), pexels(7640756, 1200), pexels(28460164, 1200)];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@nosskom.example";
const HANDLE = handle("@nosskom");

export const TSHIRTS: Edition = {
  niche: NICHE,
  looks: ["streetwear", "fashion-luxe"],
  priceBand: { min: 150, max: 900 },
  // The flat lays are square on white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("نص كم", "Noss Kom"),
    description: L("تيشيرتات قطن بيسك وأوفر سايز ومقلّمة وبولو، لكل يوم.", "Cotton tees for every day: basics, oversized, stripes and polos."),
    categories: [
      ["basic", "بيسك", "Basics", TILES[0]!],
      ["oversized", "أوفر سايز", "Oversized", TILES[1]!],
      ["patterned", "مقلّم ومنقوش", "Stripes & prints", TILES[2]!],
      ["polo", "بولو", "Polos", TILES[3]!],
    ],
    // Newest first. The first three are the shop-the-look dots: the burgundy, the white and the navy polo.
    products: [
      ["burgundy-tipped-polo", "polo", "بولو نبيتي بخط أبيض", "Burgundy Tipped Polo", P("burgundy-tipped-polo"), 520, { rating: 4.7, sold90: 118 }],
      ["white-pique-polo", "polo", "بولو بيكيه أبيض", "White Pique Polo", P("white-pique-polo"), 490, { rating: 4.6, sold90: 157 }],
      ["navy-pique-polo", "polo", "بولو بيكيه كحلي", "Navy Pique Polo", P("navy-pique-polo"), 480, { rating: 4.8, sold90: 203 }],
      // The rest, mixed so a row of the newest shows every category.
      ["navy-white-striped-tshirt", "patterned", "تيشيرت مقلّم كحلي وأبيض", "Navy and White Striped Tee", P("navy-white-striped-tshirt"), 350, { rating: 4.7, sold90: 198 }],
      ["washed-black-oversized-tshirt", "oversized", "تيشيرت أوفر سايز أسود مغسول", "Washed Black Oversized Tee", P("washed-black-oversized-tshirt"), 420, { isFeatured: true, rating: 4.9, sold90: 276 }],
      ["white-basic-cotton-tshirt", "basic", "تيشيرت بيسك قطن أبيض", "White Basic Cotton Tee", P("white-basic-cotton-tshirt"), 280, { isFeatured: true, rating: 4.8, sold90: 412 }],
      ["blue-tie-dye-tshirt", "patterned", "تيشيرت تاي داي أزرق", "Blue Tie-Dye Tee", P("blue-tie-dye-tshirt"), 380, { rating: 4.4, sold90: 112 }],
      ["sand-beige-oversized-tshirt", "oversized", "تيشيرت أوفر سايز بيج", "Sand Beige Oversized Tee", P("sand-beige-oversized-tshirt"), 420, { rating: 4.6, sold90: 164 }],
      ["black-basic-cotton-tshirt", "basic", "تيشيرت بيسك قطن أسود", "Black Basic Cotton Tee", P("black-basic-cotton-tshirt"), 280, { rating: 4.7, sold90: 388 }],
      ["forest-green-pique-polo", "polo", "بولو بيكيه أخضر غامق", "Forest Green Pique Polo", P("forest-green-pique-polo"), 490, { rating: 4.6, sold90: 132 }],
      ["black-chest-stripe-tshirt", "patterned", "تيشيرت أسود بخط أبيض على الصدر", "Black Tee with a White Chest Stripe", P("black-chest-stripe-tshirt"), 360, { rating: 4.5, sold90: 126 }],
      ["brown-oversized-tshirt", "oversized", "تيشيرت أوفر سايز بني", "Chocolate Brown Oversized Tee", P("brown-oversized-tshirt"), 430, { rating: 4.7, sold90: 151 }],
      ["dusty-blue-basic-tshirt", "basic", "تيشيرت بيسك قطن أزرق هادي", "Dusty Blue Basic Cotton Tee", P("dusty-blue-basic-tshirt"), 290, { rating: 4.6, sold90: 208 }],
      ["green-white-colour-block-tshirt", "patterned", "تيشيرت كلر بلوك أخضر وأبيض", "Green and White Colour-Block Tee", P("green-white-colour-block-tshirt"), 390, { rating: 4.5, sold90: 87 }],
      ["olive-oversized-tshirt", "oversized", "تيشيرت أوفر سايز زيتي", "Olive Oversized Tee", P("olive-oversized-tshirt"), 430, { rating: 4.5, sold90: 139 }],
      ["grey-melange-basic-tshirt", "basic", "تيشيرت بيسك رمادي ميلانج", "Grey Melange Basic Tee", P("grey-melange-basic-tshirt"), 290, { rating: 4.6, sold90: 231 }],
    ],
  }),
  photos: {
    hero: { wide: pexels(40450765, 1920), tall: pexels(7857552, 1200) },
    tiles: TILES,
    banner: pexels(2112648, 2000),
    story: pexels(9702241, 1200),
    // The dots, in percent from the photo's left and top: the burgundy, the white and the navy polo.
    look: {
      src: pexels(38928670, 1400),
      dots: [
        { x: 30, y: 82 },
        { x: 62, y: 43 },
        { x: 70, y: 24 },
      ],
    },
    // Streetwear's lookbook, square: one large photo, then four small ones.
    custom: {
      "lookbook-1": pexels(8146450, 1200),
      "lookbook-2": pexels(12039633, 900),
      "lookbook-3": pexels(9940948, 900),
      "lookbook-4": pexels(13924869, 900),
      "lookbook-5": pexels(4440651, 900),
    },
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("ادفع عند الاستلام", "Pay on delivery"),
      L("استبدال المقاس خلال ١٤ يوم", "Size exchange within 14 days"),
    ],
    labels: { about: L("حكايتنا", "Our story"), search: L("دوّر على تيشيرت", "Search the tees") },
    hero: {
      alt: L("تيشيرتات قطن بألوان كتير على شماعة", "Cotton tees in many colours on a rail"),
      eyebrow: L("تشكيلة الموسم", "This season's range"),
      title: L("تيشيرت قطن يعيش معاك", "Cotton tees made to last"),
      line: L("بيسك وأوفر سايز ومقلّم وبولو، بقطن مريح لكل يوم.", "Basics, oversized, stripes and polos, in comfortable cotton for every day."),
      cta: L("تسوّق التيشيرتات", "Shop the tees"),
    },
    categories: { title: L("اختار القَصّة", "Pick your fit") },
    products: {
      primary: {
        // Streetwear: the eyebrow is also the footer's link to the newest products.
        eyebrow: L("وصل حديثًا", "New in"),
        title: L("أحدث التيشيرتات", "The newest tees"),
        line: L("آخر الموديلات اللي نزلت عندنا.", "The latest styles to arrive."),
      },
    },
    story: {
      alt: L("تيشيرتات بيضا على شماعات سودا", "White tees on black hangers"),
      eyebrow: L("الخامة أول حاجة", "Fabric comes first"),
      title: L("قطن تحسّه من أول لبسة", "Cotton you feel from the first wear"),
      text: L(
        "بنكتب خامة كل تيشيرت ومقاساته بالسنتيمتر في صفحته، عشان تختار وإنت مطمّن.",
        "Each tee's page lists its fabric and its measurements in centimetres, so you can choose with confidence.",
      ),
      cta: L("اعرف حكايتنا", "Read our story"),
    },
    // Streetwear's bento of best sellers.
    rows: [{ title: L("الأكثر طلبًا", "Most ordered") }],
    look: {
      alt: L("تيشيرتات بولو بألوان كتير على شماعات خشب فوق حصيرة قش", "Polo shirts in many colours on wooden hangers over a straw mat"),
      eyebrow: L("ركن البولو", "The polo corner"),
      title: L("بولو بيكيه بتلات ألوان", "Pique polos in three colours"),
      text: L("دوس على أي نقطة في الصورة وشوف أقرب بولو ليها من تشكيلتنا.", "Tap a dot on the photo to see the closest polo from our range."),
    },
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("بنوصّل لكل محافظات مصر", "We deliver to every governorate") },
      { title: L("استبدال المقاس", "Size exchange"), line: L("خلال ١٤ يوم من الاستلام", "Within 14 days of delivery") },
      { title: L("مساعدة في المقاس", "Help with sizing"), line: L("ابعتلنا طولك ووزنك على واتساب", "Send us your height and weight on WhatsApp") },
      { title: L("ادفع عند الاستلام", "Pay on delivery"), line: L("كاش مع المندوب", "Cash to the courier") },
    ],
    newsletter: {
      title: L("اعرف الموديلات الجديدة أول واحد", "Hear about new styles first"),
      line: L("رسالة لما تنزل تشكيلة جديدة، مش أكتر.", "One letter when a new range arrives, nothing more."),
    },
    // Streetwear's large sign-off line.
    footer: { line: L("البس اللي يريّحك", "Wear what feels right") },
    about: {
      line: L("تيشيرتات قطن لكل يوم، مختارة بعناية.", "Cotton tees for every day, chosen with care."),
      alt: L("فرع قطن على خلفية بيضا", "A cotton branch on a white background"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("خامة كويسة وقصّة مظبوطة", "Good fabric, the right cut"),
      text: L(
        "نص كم بدأ من سؤال بسيط: ليه صعب تلاقي تيشيرت قطن كويس بقصّة مظبوطة؟ فبنختار كل موديل على حسب خامته وقصّته، وبنراجع مقاساته قبل ما ينزل.",
        "Noss Kom began with a simple question: why is a good cotton tee with the right cut so hard to find? So we choose every style for its fabric and its cut, and check its sizing before it is listed.",
      ),
      more: L("ولو المقاس مش مظبوط عليك، بنبدّله خلال ١٤ يوم.", "And if the size is not right, we exchange it within 14 days."),
      cta: L("تسوّق التيشيرتات", "Shop the tees"),
    },
    contact: {
      title: L("كلّمنا", "Talk to us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("محتاج مساعدة في المقاس؟ اسألنا", "Need help with sizing? Ask us"),
    },
    faq: {
      line: L("المقاسات والتوصيل والاستبدال.", "Sizing, delivery and exchanges."),
      question: L("إزاي أعرف مقاسي؟", "How do I find my size?"),
      answer: L(
        "مقاسات كل تيشيرت مكتوبة في صفحته بالسنتيمتر. قيس تيشيرت مريح عندك وقارن، ولو بين مقاسين ابعتلنا ونقولك الأنسب.",
        "Each tee lists its measurements in centimetres on its page. Measure a tee that fits you well and compare; if you are between two sizes, write to us and we will tell you which fits.",
      ),
    },
    // Streetwear's own sections.
    custom: {
      // Fashion-luxe: the link to the whole catalog, and the noun after a category's product count.
      "shop-all": L("كل التيشيرتات", "All tees"),
      "products-noun": L("تيشيرتات", "tees"),
      "store-short": L("نص كم", "Noss Kom"),
      "hero-note": L("بيسك · أوفر سايز · بولو", "Basics · Oversized · Polos"),
      // The hero's round sticker: a fabric fact, not an offer. Demo value: a seller writes their own fabric.
      "hero-sticker-1": L("قطن", "Pure"),
      "hero-sticker-2": L("١٠٠٪", "100%"),
      "hero-sticker-3": L("خالص", "cotton"),
      "banner-alt": L("تيشيرتات بيضا على شماعات سودا", "White tees on black hangers"),
      "banner-title": L("تيشيرتات", "Tees"),
      "banner-line": L("قطن مريح بقصّة بيسك أو أوفر سايز.", "Comfortable cotton, in a regular or an oversized cut."),
      "craft-statement": L("تيشيرت واحد مظبوط أحسن من عشرة في الدولاب.", "One tee that fits beats ten in the drawer."),
      "craft-statement-cta": L("كل التيشيرتات", "Shop the tees"),
      // Demo handle: the seller's own replaces it.
      "lookbook-handle": L(HANDLE, HANDLE),
      "lookbook-line": L("صور جديدة مع كل تشكيلة", "New photos with every range"),
    },
  },
  // Both looks show the newest products in their main section (one title for both).
  journey: { primary: "newest" },
  productPage: { copy: { reviews: L("آراء اللي لبسوه", "From people who wear it"), related: L("تيشيرتات ممكن تعجبك", "Tees you may like") } },
  // Fashion-luxe's own shop (owner, 2026-11-11: two looks of one niche must not look duplicated): "Kheit", quiet
  // colours and the right cut, best sellers first. Same tees and prices; its own copy, photos and journey. The
  // shop-the-look photo (polos, dots on the three newest) stays the pack's: only this look shows it.
  perLook: {
    "fashion-luxe": {
      store: {
        name: L("خيط", "Kheit"),
        description: L("تيشيرتات قطن بألوان هادية وقصّات مظبوطة.", "Cotton tees in quiet colours and well-judged cuts."),
      },
      copy: {
        announcement: [
          L("ألوان هادية تتنسّق مع بعض", "Quiet colours that go together"),
          L("التوصيل لكل محافظات مصر", "Delivery to every governorate"),
          L("تبديل المقاس خلال ١٤ يوم", "Size swaps within 14 days"),
        ],
        labels: { about: L("عن خيط", "About Kheit") },
        hero: {
          alt: L("تيشيرتات أبيض وبيج ولبني ورمادي على شماعات خشب", "White, beige, pale blue and grey tees on wooden hangers"),
          eyebrow: L("الأساسيات", "The essentials"),
          title: L("تيشيرت هادي، قصّة مظبوطة", "Quiet tees, the right cut"),
          line: L(
            "بيسك وأوفر سايز ومقلّم وبولو، بألوان تتلبس مع بعض من غير تفكير.",
            "Basics, oversized, stripes and polos, in colours that go together without a second thought.",
          ),
          cta: L("شوف التشكيلة", "See the range"),
        },
        categories: { title: L("أربع قصّات، دولاب كامل", "Four cuts, one wardrobe") },
        products: {
          primary: {
            title: L("اللي بيرجعوا يطلبوه", "The ones people reorder"),
            line: L("التيشيرتات اللي عملاءنا بيطلبوها تاني بلون مختلف.", "The tees our customers come back for in another colour."),
          },
        },
        // The two-tone band (a long rail of tees); its button goes to the about page.
        story: {
          alt: L("رف طويل عليه تيشيرتات أبيض وأسود ومقلّم على شماعات خشب", "A long rail of white, black and striped tees on wooden hangers"),
          eyebrow: L("قليل بس مظبوط", "Fewer, better"),
          title: L("تيشيرت تلبسه سنين", "A tee you wear for years"),
          text: L(
            "بنختار قطن ما يتمطّش من أول غسلة، وبنكتب مقاسات كل تيشيرت بالسنتيمتر في صفحته.",
            "We choose cotton that keeps its shape after the first wash, and list every tee's measurements in centimetres on its page.",
          ),
          cta: L("اعرف أكتر عننا", "More about us"),
        },
        look: {
          eyebrow: L("ركن البولو", "The polo rail"),
          title: L("بولو لكل يوم في الأسبوع", "A polo for every day of the week"),
          text: L("دوس على أي نقطة وشوف البولو اللي يشبهها من التشكيلة.", "Tap a dot to see the polo from the range that matches it."),
        },
        trust: [
          { title: L("مقاسات بالسنتيمتر", "Measured in centimetres"), line: L("كل تيشيرت ومقاساته في صفحته", "Every tee lists its measurements") },
          { title: L("تبديل المقاس", "Size swaps"), line: L("خلال ١٤ يوم من الاستلام", "Within 14 days of delivery") },
          { title: L("نساعدك تختار القصّة", "Help choosing a cut"), line: L("ابعت طولك ووزنك على واتساب", "Send your height and weight on WhatsApp") },
          { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("كاش مع المندوب", "Cash to the courier") },
        ],
        newsletter: {
          title: L("لون جديد؟ هتعرف الأول", "A new colour? You hear first"),
          line: L("رسالة لما ينزل لون أو قصّة جديدة، بس كده.", "One letter when a new colour or cut arrives, that is all."),
        },
        footer: { line: L("خيط: تيشيرتات قطن بألوان هادية.", "Kheit: cotton tees in quiet colours.") },
        about: {
          line: L("تيشيرتات قطن بألوان هادية وقصّات مظبوطة.", "Cotton tees in quiet colours and well-judged cuts."),
          alt: L("رف أخضر عليه تيشيرتات وقمصان وجنبه سلّم خشب", "A green rack of tees and shirts beside a wooden ladder"),
          eyebrow: L("عن خيط", "About Kheit"),
          title: L("التيشيرت أساس اللبس", "The tee holds the outfit together"),
          text: L(
            "خيط بدأ من درج مليان تيشيرتات مش بنلبسها. فقرّرنا نبيع ألوان قليلة هادية تتنسّق مع بعض، وقصّات اتجرّبت على أطوال وأوزان مختلفة قبل ما تنزل.",
            "Kheit began with a drawer full of tees we never wore. So we sell a few quiet colours that go together, in cuts tried on different heights and builds before they are listed.",
          ),
          more: L("ولو المقاس مش مظبوط عليك، بنبدّله خلال ١٤ يوم.", "And if the size is not right, we exchange it within 14 days."),
          cta: L("شوف التشكيلة", "See the range"),
        },
        contact: {
          title: L("كلّمنا", "Talk to us"),
          line: L(`الجيزة، مصر، ${PHONE_AR}، ${handle("hello@kheit.example")}`, `Giza, Egypt | ${PHONE_EN} | hello@kheit.example`),
          heading: L("مش متأكد من القصّة؟ اسألنا", "Not sure which cut? Ask us"),
        },
        faq: {
          line: L("القصّات والمقاسات والتوصيل.", "Cuts, sizes and delivery."),
          question: L("إيه الفرق بين البيسك والأوفر سايز؟", "What is the difference between basic and oversized?"),
          answer: L(
            "البيسك على مقاسك بالظبط، والأوفر سايز أعرض في الصدر وكتفه نازل. خد مقاسك العادي لو عايزه واسع، أو مقاس أصغر لو عايزه أقرب للجسم.",
            "A basic follows your size; an oversized tee is wider in the chest with a dropped shoulder. Take your usual size for a loose fit, or one size down for a closer one.",
          ),
        },
      },
      // Pexels, checked by eye 2026-11-11 (no people, no readable labels): neutral rails, sand, rose and stripes.
      photos: {
        hero: { wide: pexels(3735641, 1920), tall: pexels(6347890, 1200) },
        tiles: [pexels(11671275, 1200), pexels(9558761, 1200), pexels(40239456, 1200), pexels(6461395, 1200)],
        banner: pexels(5864266, 2000),
        story: pexels(10557056, 1200),
      },
      // Best sellers in the grid (streetwear shows the newest), then basics and oversized as rows.
      journey: { primary: "best-sellers", rows: [1, 2] },
    },
  },
};
