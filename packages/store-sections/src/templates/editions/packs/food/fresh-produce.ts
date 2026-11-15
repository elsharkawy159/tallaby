/**
 * The fresh produce pack (niche editions, ROADMAP F-90): "Ghait", a fruit
 * and vegetable shop of vegetables, fruits, greens and herbs, and boxes and
 * bundles, bought from farmers every dawn and delivered the same day. Data
 * only; `khodar` draws it.
 *
 * Photos: generated from `docs/systems/editions-photos.md` (received
 * 2026-11-15, checked by eye: no people, hands, labels or logos), in the
 * public `library-media` bucket, `editions/fresh-produce/`: twelve
 * white-background packshots named by slug and eight scenes as
 * `scene-<slot>`.
 *
 * Look: `khodar`, the niche's template (one template per niche). Its hero is
 * a search box; the home shows the category tiles, six best sellers in
 * compact rows and the same-day promise (`custom.promise-*`); no category
 * rows, so three products per category are enough. No `reviews`: a pack
 * holds no invented buyer quotes, and without them `khodar` leaves its quote
 * out.
 */
import { L } from "../../../../designs/_kit";
import { demoStore } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "fresh-produce";
const P = (slug: string) => editionPhoto(NICHE, slug);
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

/** Category tiles, 3:4, in the categories' order. */
const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

export const FRESH_PRODUCE: Edition = {
  niche: NICHE,
  looks: ["khodar"],
  priceBand: { min: 10, max: 600 },
  // Square packshots on pure white: a square white stage shows each pile whole.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("غيط", "Ghait"),
    description: L("خضار وفاكهة من الغيط لبابك في نفس اليوم.", "Fruit and vegetables from the field to your door the same day."),
    categories: [
      ["vegetables", "خضار", "Vegetables", TILES[0]!],
      ["fruits", "فاكهة", "Fruits", TILES[1]!],
      ["greens", "ورقيات وأعشاب", "Greens & herbs", TILES[2]!],
      ["boxes", "بوكسات", "Boxes & bundles", TILES[3]!],
    ],
    products: [
      ["ripe-tomatoes", "vegetables", "طماطم (١ كيلو)", "Ripe Tomatoes, 1 kg", P("ripe-tomatoes"), 25, { isFeatured: true, rating: 4.8, sold90: 512 }],
      ["egyptian-mangoes", "fruits", "مانجا مصري (١ كيلو)", "Egyptian Mangoes, 1 kg", P("egyptian-mangoes"), 70, { isFeatured: true, rating: 4.9, sold90: 388 }],
      ["molokhia-leaves-bunch", "greens", "ملوخية خضرا (حزمة)", "Fresh Molokhia, Bunch", P("molokhia-leaves-bunch"), 15, { rating: 4.7, sold90: 341 }],
      ["salad-veg-box", "boxes", "بوكس السلطة", "Salad Box", P("salad-veg-box"), 180, { isFeatured: true, rating: 4.8, sold90: 196 }],
      ["baladi-cucumbers", "vegetables", "خيار بلدي (١ كيلو)", "Baladi Cucumbers, 1 kg", P("baladi-cucumbers"), 20, { rating: 4.7, sold90: 466 }],
      ["fresh-guavas", "fruits", "جوافة (١ كيلو)", "Guavas, 1 kg", P("fresh-guavas"), 35, { rating: 4.6, sold90: 254 }],
      ["parsley-dill-bunch", "greens", "بقدونس وشبت (حزمتين)", "Parsley and Dill, 2 Bunches", P("parsley-dill-bunch"), 12, { rating: 4.7, sold90: 402 }],
      ["fruit-mix-basket", "boxes", "سلة فاكهة مشكلة", "Mixed Fruit Basket", P("fruit-mix-basket"), 350, { rating: 4.8, sold90: 121 }],
      ["green-bell-peppers", "vegetables", "فلفل رومي أخضر (١ كيلو)", "Green Bell Peppers, 1 kg", P("green-bell-peppers"), 30, { rating: 4.6, sold90: 298 }],
      ["navel-oranges", "fruits", "برتقال بسرة (١ كيلو)", "Navel Oranges, 1 kg", P("navel-oranges"), 25, { rating: 4.7, sold90: 333 }],
      ["fresh-mint-bunch", "greens", "نعناع (حزمة)", "Fresh Mint, Bunch", P("fresh-mint-bunch"), 10, { rating: 4.8, sold90: 377 }],
      ["potatoes-onions-pack", "boxes", "شبكة بطاطس وبصل أحمر", "Potatoes and Red Onions Pack", P("potatoes-onions-pack"), 60, { rating: 4.6, sold90: 214 }],
    ],
  }),
  photos: {
    hero: { wide: scene("hero-wide"), tall: scene("hero-tall") },
    tiles: TILES,
    // Drawn by no look today.
    banner: scene("banner"),
    // `khodar`'s about page.
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("نفس اليوم لو طلبت قبل ٢ الضهر", "Same day if you order by 2 pm"),
      L("الدفع عند الاستلام", "Cash on delivery"),
      L("لو حاجة مش طازة نبدّلها", "If anything is not fresh, we replace it"),
    ],
    labels: { search: L("ابحث عن طماطم، مانجا، ملوخية…", "Search tomatoes, mango, molokhia…") },
    nav: [
      { label: L("خضار", "Vegetables"), href: search("كيلو") },
      { label: L("ورقيات", "Greens"), href: search("حزمة") },
      { label: L("بوكسات", "Boxes"), href: search("بوكس") },
      { label: L("فاكهة", "Fruits"), href: search("مانجا") },
    ],
    hero: {
      alt: L("صناديق خضار وفاكهة طازة تحت تندة في السوق", "Crates of fresh vegetables and fruit under a market awning"),
      eyebrow: L("من الغيط النهارده", "From the field today"),
      title: L("محتاج إيه النهارده؟", "What do you need today?"),
      line: L("طماطم، مانجا، ملوخية", "Tomatoes, mango, molokhia"),
      cta: L("تسوق الخضار", "Shop vegetables"),
    },
    categories: { title: L("طازة النهارده", "Fresh today") },
    products: { primary: { title: L("الأكتر طلباً كل يوم", "Most ordered, every day"), line: L("اللي بيخلص الأول كل يوم.", "What sells out first every day.") } },
    story: {
      alt: L("عربية خشب عليها صناديق خضار في غيط أخضر ونخل", "A wooden cart of vegetable crates in a green field with palm trees"),
      eyebrow: L("من الغيط", "From the field"),
      title: L("متقطف امبارح، على بابك النهارده", "Picked yesterday, at your door today"),
      text: L("بنشتري الفجر من المزارعين ونفرز بإيدينا قبل ما نغلف.", "We buy from farmers at dawn and sort by hand before packing."),
      cta: L("تسوق البوكسات", "Shop boxes"),
    },
    trust: [
      { title: L("نفس اليوم", "Same day"), line: L("لو طلبت قبل ٢ الضهر", "If you order by 2 pm") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفع لما الطلب يوصل", "Pay when your order arrives") },
      { title: L("متفرز بالإيد", "Sorted by hand"), line: L("قبل ما يتغلف", "Before it is packed") },
      { title: L("مش طازة؟ نبدّلها", "Not fresh? We replace it"), line: L("صوّرها وابعتهالنا", "Send us a photo") },
    ],
    newsletter: {
      title: L("خضار الموسم أول بأول", "The season's produce as it lands"),
      line: L("رسالة كل أسبوع فيها اللي نزل الموسم ده.", "A weekly letter with what is in season."),
    },
    about: {
      line: L("خضار وفاكهة من الغيط لبابك.", "Fruit and vegetables from the field to your door."),
      alt: L("عربية خشب عليها صناديق خضار في غيط أخضر ونخل", "A wooden cart of vegetable crates in a green field with palm trees"),
      eyebrow: L("من الغيط", "From the field"),
      title: L("متقطف امبارح، على بابك النهارده", "Picked yesterday, at your door today"),
      text: L(
        "بنشتري كل يوم الفجر من مزارعين نعرفهم، ونفرز الخضار والفاكهة بإيدينا قبل ما تتغلف.",
        "We buy every dawn from farmers we know, and sort the fruit and vegetables by hand before packing.",
      ),
      more: L("ولو حاجة وصلت مش طازة، صوّرها وابعتهالنا ونبدّلها.", "And if anything arrives not fresh, send us a photo and we replace it."),
      cta: L("تسوق البوكسات", "Shop boxes"),
    },
    contact: {
      title: L("تواصل", "Contact"),
      line: L("بنرد من ٨ الصبح لـ ١٠ بالليل.", "We reply from 8 am to 10 pm."),
      heading: L("اسأل عن طلب أو بوكس", "Ask about an order or a box"),
    },
    faq: {
      line: L("التوصيل والبوكسات والاستبدال.", "Delivery, boxes and replacements."),
      question: L("لو حاجة وصلت مش طازة؟", "What if something arrives not fresh?"),
      answer: L("صوّرها وابعتهالنا في نفس اليوم ونبدّلها أو نرجعلك تمنها.", "Send us a photo the same day and we replace or refund it."),
    },
    custom: {
      // `khodar`: the header's link to the best sellers.
      "best-label": L("الأكتر طلباً", "Most ordered"),
      // `khodar`: the delivery promise, three steps.
      "promise-title": L("اطلب قبل ٢، يوصلك النهارده", "Order by 2 pm, get it today"),
      "promise-time-1": L("٢:٠٠ م", "2:00 pm"),
      "promise-step-1": L("آخر ميعاد للطلب", "Order cut-off"),
      "promise-time-2": L("٤:٠٠ م", "4:00 pm"),
      "promise-step-2": L("بيتفرز ويتغلف", "Sorted and packed"),
      "promise-time-3": L("٨:٠٠ م", "8:00 pm"),
      "promise-step-3": L("على بابك", "At your door"),
    },
  },
  productPage: { copy: { reviews: L("من زباينّا", "From our regulars"), related: L("يكمّل الطبخة", "Completes the dish") } },
};
