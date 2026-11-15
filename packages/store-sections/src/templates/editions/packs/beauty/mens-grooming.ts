/**
 * The men's grooming pack (niche editions, ROADMAP F-90): "Usta Barber", a
 * Heliopolis barbershop that sells the kit it uses: shaving, beard care,
 * clippers and trimmers, and hair styling. Data only; `barber` draws it.
 *
 * Photos: generated from `docs/systems/editions-photos.md` (received
 * 2026-11-15, checked by eye: plain unlabelled tins and bottles, unbranded
 * tools, no people, hands, lettering or logos), in the public
 * `library-media` bucket, `editions/mens-grooming/`: twelve
 * white-background packshots named by slug and eight scenes as
 * `scene-<slot>`.
 *
 * Look: `barber`, the niche's template (one template per niche). Its home
 * shows a grid of the newest products and the chair price menu
 * (`custom.service-*`); no category rows, so three products per category
 * are enough. No `reviews`: a pack holds no invented buyer quotes, and
 * without them `barber` leaves its messages section out.
 */
import { L } from "../../../../designs/_kit";
import { demoStore } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "mens-grooming";
const P = (slug: string) => editionPhoto(NICHE, slug);
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

export const MENS_GROOMING: Edition = {
  niche: NICHE,
  looks: ["barber"],
  priceBand: { min: 100, max: 2500 },
  // Square packshots on pure white: a square white stage shows each tool whole.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("أسطى باربر", "Usta Barber"),
    description: L("محل حلاقة في مصر الجديدة، وعدة العناية اللي بنستعملها توصلك البيت.", "A Heliopolis barbershop, and the grooming kit we use, delivered to your home."),
    categories: [
      ["shaving", "الحلاقة", "Shaving", TILES[0]!],
      ["beard", "الدقن", "Beard care", TILES[1]!],
      ["clippers", "ماكينات وتريمر", "Clippers & trimmers", TILES[2]!],
      ["styling", "تصفيف الشعر", "Hair styling", TILES[3]!],
    ],
    // Newest first: `barber`'s grid shows the newest.
    products: [
      ["beard-oil-dropper", "beard", "زيت دقن", "Beard Oil", P("beard-oil-dropper"), 280, { isFeatured: true, rating: 4.8, sold90: 236 }],
      ["cordless-hair-clipper", "clippers", "ماكينة حلاقة شعر لاسلكي", "Cordless Hair Clipper", P("cordless-hair-clipper"), 1650, { isFeatured: true, rating: 4.7, sold90: 142 }],
      ["chrome-safety-razor", "shaving", "موس أمان كروم", "Chrome Safety Razor", P("chrome-safety-razor"), 450, { rating: 4.8, sold90: 118 }],
      ["matte-hair-clay-tin", "styling", "كلاي شعر مطفي", "Matte Hair Clay", P("matte-hair-clay-tin"), 220, { rating: 4.6, sold90: 187 }],
      ["beard-balm-tin", "beard", "بلسم دقن", "Beard Balm", P("beard-balm-tin"), 240, { rating: 4.7, sold90: 154 }],
      ["foil-shaver", "clippers", "ماكينة حلاقة دقن", "Foil Shaver", P("foil-shaver"), 1250, { rating: 4.5, sold90: 76 }],
      ["shaving-brush", "shaving", "فرشاة حلاقة بيد خشب", "Wooden Shaving Brush", P("shaving-brush"), 380, { rating: 4.7, sold90: 91 }],
      ["pomade-jar", "styling", "بوماد شعر لامع", "Shine Pomade", P("pomade-jar"), 210, { rating: 4.5, sold90: 132 }],
      ["beard-comb-wood", "beard", "مشط دقن خشب", "Wooden Beard Comb", P("beard-comb-wood"), 130, { rating: 4.8, sold90: 168 }],
      ["nose-ear-trimmer", "clippers", "تريمر للأنف والودن", "Nose and Ear Trimmer", P("nose-ear-trimmer"), 420, { rating: 4.4, sold90: 64 }],
      ["shaving-cream-jar", "shaving", "كريم حلاقة", "Shaving Cream", P("shaving-cream-jar"), 190, { rating: 4.6, sold90: 143 }],
      ["barber-comb-set", "styling", "طقم أمشاط باربر", "Barber Comb Set", P("barber-comb-set"), 150, { compareAtPrice: 180, rating: 4.6, sold90: 97 }],
    ],
  }),
  photos: {
    hero: { wide: scene("hero-wide"), tall: scene("hero-tall") },
    tiles: TILES,
    // Drawn by no look today (`barber` has no banner).
    banner: scene("banner"),
    // `barber`'s about page.
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("الدفع عند الاستلام", "Cash on delivery"),
      L("احجز الكرسي على واتساب", "Book the chair on WhatsApp"),
    ],
    labels: { search: L("دوّر على زيت دقن، ماكينة، كلاي…", "Search beard oil, clippers, clay…") },
    hero: {
      alt: L("زجاجة زيت دقن على صينية جلد هافان قدام حيطة رمادي غامق", "A beard oil bottle on a cognac leather tray against a charcoal wall"),
      eyebrow: L("محل وكرسي", "Shop and chair"),
      title: L("عدة الباربر في بيتك", "The barber's kit at home"),
      line: L("زيت الدقن والموس والماكينة اللي بنستعملها كل يوم على الكرسي.", "The beard oil, razor and clippers we use in the chair every day."),
      cta: L("تسوق العدة", "Shop the kit"),
    },
    categories: { title: L("دقن ولا حلاقة؟", "Beard or shave?") },
    products: {
      primary: {
        title: L("وصل حديثاً", "Just in"),
        line: L("أحدث اللي نزل الرف في المحل.", "The newest on the shop's shelf."),
      },
    },
    story: {
      alt: L("محل حلاقة فاضي فيه كرسي جلد وصينية أدوات كروم", "An empty barbershop with a leather chair and a tray of chrome tools"),
      eyebrow: L("مصر الجديدة", "Heliopolis"),
      title: L("من الكرسي للرف", "From the chair to the shelf"),
      text: L("كل اللي بنبيعه بنستعمله الأول على الكرسي.", "Everything we sell, we use in the chair first."),
      cta: L("تسوق العدة", "Shop the kit"),
    },
    trust: [
      { title: L("توصيل لكل مصر", "Delivery across Egypt"), line: L("لحد باب البيت", "To your door") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفع لما الطلب يوصل", "Pay when your order arrives") },
      { title: L("مجرّب على الكرسي", "Tested in the chair"), line: L("كل منتج بنستعمله الأول", "We use every product first") },
      { title: L("نصيحة الباربر", "A barber's advice"), line: L("اسأل على واتساب قبل ما تشتري", "Ask on WhatsApp before you buy") },
    ],
    newsletter: {
      title: L("نصايح الباربر", "Barber's tips"),
      line: L("رسالة كل شهر فيها نصيحة للدقن والشعر والجديد على الرف.", "A monthly letter with a beard and hair tip and what is new on the shelf."),
      note: L("بدون رسائل مزعجة. تقدر تلغي في أي وقت.", "No spam. Unsubscribe any time."),
    },
    footer: { line: L("شيك كل يوم", "Sharp, every day") },
    about: {
      line: L("محل حلاقة في مصر الجديدة، وعدته في بيتك.", "A barbershop in Heliopolis, with its kit at your home."),
      alt: L("محل حلاقة فاضي فيه كرسي جلد وصينية أدوات كروم", "An empty barbershop with a leather chair and a tray of chrome tools"),
      eyebrow: L("مصر الجديدة", "Heliopolis"),
      title: L("من الكرسي للرف", "From the chair to the shelf"),
      text: L(
        "الزباين كانوا بيسألوا كل يوم عن الزيت والموس اللي بنستعملهم. فبقينا نبيعهم في المحل وأونلاين.",
        "Customers asked every day about the oil and razor we used. So we started selling them in the shop and online.",
      ),
      more: L("وكل منتج بيتجرب على الكرسي الأول قبل ما ينزل الرف.", "And every product is tested in the chair before it reaches the shelf."),
      cta: L("تسوق العدة", "Shop the kit"),
    },
    contact: {
      title: L("تواصل واحجز", "Contact and book"),
      line: L("اسأل عن منتج أو احجز معاد على الكرسي.", "Ask about a product or book a time in the chair."),
      heading: L("اسأل أو احجز معاد", "Ask or book a time"),
    },
    faq: {
      line: L("الحجز والمنتجات والتوصيل.", "Booking, products and delivery."),
      question: L("الماكينة تنفع للشعر والدقن؟", "Does the clipper work for hair and beard?"),
      answer: L(
        "أيوه، معاها أمشاط بأطوال مختلفة للشعر والدقن، والطول مكتوب على كل مشط. ولو محتار ابعتلنا ونقولك تبدأ بأنهي.",
        "Yes, it comes with guards of different lengths for hair and beard, each marked with its length. If you are unsure, message us and we tell you which to start with.",
      ),
    },
    custom: {
      // `barber`: the store's short name inside "About …".
      "store-short": L("أسطى", "Usta"),
      // `barber`: the hero's second button (to the contact page) and the footer's sign-off button.
      "hero-cta-2": L("احجز حلاقة", "Book a cut"),
      "footer-cta": L("احجز على واتساب", "Book on WhatsApp"),
      // `barber`: the chair price menu, three groups (3, 2 and 2 items).
      "service-title": L("على الكرسي", "In the chair"),
      "service-line": L("الأسعار شاملة الغسيل والتصفيف.", "Prices include wash and styling."),
      "service-1-title": L("الشعر", "Hair"),
      "service-1-1-name": L("قص", "Cut"),
      "service-1-1-price": L("٢٢٠ ج.م", "EGP 220"),
      "service-1-2-name": L("قص وغسيل", "Cut and wash"),
      "service-1-2-price": L("٢٨٠ ج.م", "EGP 280"),
      "service-1-3-name": L("قص أطفال", "Kids' cut"),
      "service-1-3-price": L("١٦٠ ج.م", "EGP 160"),
      "service-2-title": L("الدقن", "Beard"),
      "service-2-1-name": L("تهذيب", "Trim"),
      "service-2-1-price": L("١٣٠ ج.م", "EGP 130"),
      "service-2-2-name": L("حلاقة بالفوطة السخنة", "Hot towel shave"),
      "service-2-2-price": L("٢٠٠ ج.م", "EGP 200"),
      "service-3-title": L("الباكدجات", "Packages"),
      "service-3-1-name": L("قص ودقن", "Cut and beard"),
      "service-3-1-price": L("٣٢٠ ج.م", "EGP 320"),
      "service-3-2-name": L("باكدج العريس", "Groom's package"),
      "service-3-2-price": L("٨٥٠ ج.م", "EGP 850"),
    },
  },
  productPage: { copy: { reviews: L("رأي زباين الكرسي", "From the chair"), related: L("كمّل العدّة", "Complete the kit") } },
};
