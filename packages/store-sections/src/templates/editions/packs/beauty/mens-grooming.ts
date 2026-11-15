/**
 * The men's grooming pack (niche editions, ROADMAP F-90): "Usta", a shop
 * for men's grooming tools: shaving, beard care,
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
 * shows a grid of the newest products and the price menu
 * (`custom.service-*`, filled with seven of the shop's own products and
 * their catalog prices, no chair services); no category rows, so three products per category
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
    name: L("أسطى", "Usta"),
    description: L("متجر لأدوات الحلاقة والعناية باللحية والشعر للرجال.", "Shaving, beard and hair care tools for men."),
    categories: [
      ["shaving", "الحلاقة", "Shaving", TILES[0]!],
      ["beard", "اللحية", "Beard care", TILES[1]!],
      ["clippers", "ماكينات الحلاقة والتشذيب", "Clippers & trimmers", TILES[2]!],
      ["styling", "تصفيف الشعر", "Hair styling", TILES[3]!],
    ],
    // Newest first: `barber`'s grid shows the newest.
    products: [
      ["beard-oil-dropper", "beard", "زيت لحية", "Beard Oil", P("beard-oil-dropper"), 280, { isFeatured: true, rating: 4.8, sold90: 236 }],
      ["cordless-hair-clipper", "clippers", "ماكينة حلاقة شعر لاسلكية", "Cordless Hair Clipper", P("cordless-hair-clipper"), 1650, { isFeatured: true, rating: 4.7, sold90: 142 }],
      ["chrome-safety-razor", "shaving", "موس أمان كروم", "Chrome Safety Razor", P("chrome-safety-razor"), 450, { rating: 4.8, sold90: 118 }],
      ["matte-hair-clay-tin", "styling", "صلصال تصفيف شعر مطفي", "Matte Hair Clay", P("matte-hair-clay-tin"), 220, { rating: 4.6, sold90: 187 }],
      ["beard-balm-tin", "beard", "بلسم لحية", "Beard Balm", P("beard-balm-tin"), 240, { rating: 4.7, sold90: 154 }],
      ["foil-shaver", "clippers", "ماكينة حلاقة للوجه", "Foil Shaver", P("foil-shaver"), 1250, { rating: 4.5, sold90: 76 }],
      ["shaving-brush", "shaving", "فرشاة حلاقة بمقبض خشبي", "Wooden Shaving Brush", P("shaving-brush"), 380, { rating: 4.7, sold90: 91 }],
      ["pomade-jar", "styling", "بوماد شعر لامع", "Shine Pomade", P("pomade-jar"), 210, { rating: 4.5, sold90: 132 }],
      ["beard-comb-wood", "beard", "مشط لحية خشبي", "Wooden Beard Comb", P("beard-comb-wood"), 130, { rating: 4.8, sold90: 168 }],
      ["nose-ear-trimmer", "clippers", "ماكينة تشذيب للأنف والأذن", "Nose and Ear Trimmer", P("nose-ear-trimmer"), 420, { rating: 4.4, sold90: 64 }],
      ["shaving-cream-jar", "shaving", "كريم حلاقة", "Shaving Cream", P("shaving-cream-jar"), 190, { rating: 4.6, sold90: 143 }],
      ["barber-comb-set", "styling", "طقم أمشاط حلاقة", "Barber Comb Set", P("barber-comb-set"), 150, { compareAtPrice: 180, rating: 4.6, sold90: 97 }],
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
      L("أدوات حلاقة ولحية وعناية بالشعر", "Shaving, beard and hair care tools"),
      L("صور ومواصفات لكل منتج", "Photos and specs for every product"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { search: L("ابحث عن زيت لحية، ماكينة، صلصال…", "Search beard oil, clippers, clay…") },
    hero: {
      alt: L("زجاجة زيت لحية على صينية جلدية بنية أمام جدار رمادي داكن", "A beard oil bottle on a cognac leather tray against a charcoal wall"),
      eyebrow: L("العناية بالرجل", "Men's grooming"),
      title: L("أدوات الحلاقة والعناية للرجال", "Shaving and grooming tools for men"),
      line: L("زيوت اللحية وأمواس الحلاقة وماكينات القص ومنتجات تصفيف الشعر.", "Beard oils, razors, clippers and hair styling products."),
      cta: L("تسوّق الأدوات", "Shop the tools"),
    },
    categories: { title: L("تسوّق حسب القسم", "Shop by category") },
    products: {
      primary: {
        title: L("وصل حديثاً", "Just in"),
        line: L("أحدث المنتجات في المتجر.", "The newest products in the store."),
      },
    },
    story: {
      alt: L("كرسي حلاقة جلدي وصينية أدوات كروم", "A leather barber chair and a tray of chrome tools"),
      eyebrow: L("أدوات الحلاقة", "Grooming tools"),
      title: L("أدوات مختارة للحلاقة", "Chosen grooming tools"),
      text: L("نختار أدوات الحلاقة ومنتجات اللحية والشعر بعناية، ونذكر مواصفات كل منتج.", "We choose shaving tools and beard and hair products with care, and list every product's specs."),
      cta: L("تسوّق الأدوات", "Shop the tools"),
    },
    trust: [
      { title: L("مواصفات واضحة", "Clear specs"), line: L("صور ومواصفات لكل منتج", "Photos and specs for every product") },
      { title: L("تشكيلة متنوعة", "A full range"), line: L("للحلاقة واللحية والشعر", "For shaving, beard and hair") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("نصائح العناية", "Grooming tips"),
      line: L("رسالة شهرية فيها نصيحة للحية والشعر وأحدث المنتجات.", "A monthly letter with a beard and hair tip and our newest products."),
      note: L("بدون رسائل مزعجة. تقدر تلغي في أي وقت.", "No spam. Unsubscribe any time."),
    },
    footer: { line: L("منتجات الحلاقة والعناية للرجال", "Shaving and grooming products for men") },
    about: {
      line: L("متجر لأدوات الحلاقة والعناية بالرجل.", "A shop for shaving and men's grooming tools."),
      alt: L("كرسي حلاقة جلدي وصينية أدوات كروم", "A leather barber chair and a tray of chrome tools"),
      eyebrow: L("أدوات الحلاقة", "Grooming tools"),
      title: L("أدوات مختارة للحلاقة", "Chosen grooming tools"),
      text: L(
        "نقدّم أدوات الحلاقة ومنتجات العناية باللحية والشعر، من الأمواس والماكينات حتى الزيوت ومنتجات التصفيف.",
        "We offer shaving tools and beard and hair care products, from razors and clippers to oils and styling products.",
      ),
      more: L("ونذكر طريقة استخدام كل منتج في صفحته.", "And each product's page explains how to use it."),
      cta: L("تسوّق الأدوات", "Shop the tools"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L("اسأل عن أي منتج أو طريقة استخدامه.", "Ask about any product or how to use it."),
      heading: L("اسأل عن منتج", "Ask about a product"),
    },
    faq: {
      line: L("المنتجات وطريقة الاستخدام والطلب.", "Products, use and ordering."),
      question: L("هل تصلح الماكينة للشعر واللحية؟", "Does the clipper work for hair and beard?"),
      answer: L(
        "نعم، معها أمشاط بأطوال مختلفة للشعر واللحية، والطول مكتوب على كل مشط. وإذا احترت، تواصل معنا لنساعدك في الاختيار.",
        "Yes, it comes with guards of different lengths for hair and beard, each marked with its length. If you are unsure, contact us and we will help you choose.",
      ),
    },
    custom: {
      // `barber`: the store's short name inside "About …".
      "store-short": L("أسطى", "Usta"),
      // `barber`: the hero's second button (to the contact page) and the footer's sign-off button.
      "hero-cta-2": L("تواصل معنا", "Contact us"),
      "footer-cta": L("تواصل معنا", "Contact us"),
      // `barber`: the chair price menu, three groups (3, 2 and 2 items).
      "service-title": L("منتجات مختارة", "Chosen products"),
      "service-line": L("أسعار بعض المنتجات بالجنيه.", "Prices of some of our products."),
      "service-1-title": L("الشعر", "Hair"),
      "service-1-1-name": L("ماكينة حلاقة شعر لاسلكية", "Cordless hair clipper"),
      "service-1-1-price": L("١٦٥٠ ج.م", "EGP 1650"),
      "service-1-2-name": L("صلصال تصفيف شعر مطفي", "Matte hair clay"),
      "service-1-2-price": L("٢٢٠ ج.م", "EGP 220"),
      "service-1-3-name": L("بوماد شعر لامع", "Shine pomade"),
      "service-1-3-price": L("٢١٠ ج.م", "EGP 210"),
      "service-2-title": L("اللحية", "Beard"),
      "service-2-1-name": L("زيت لحية", "Beard oil"),
      "service-2-1-price": L("٢٨٠ ج.م", "EGP 280"),
      "service-2-2-name": L("بلسم لحية", "Beard balm"),
      "service-2-2-price": L("٢٤٠ ج.م", "EGP 240"),
      "service-3-title": L("الحلاقة", "Shaving"),
      "service-3-1-name": L("موس أمان كروم", "Chrome safety razor"),
      "service-3-1-price": L("٤٥٠ ج.م", "EGP 450"),
      "service-3-2-name": L("كريم حلاقة", "Shaving cream"),
      "service-3-2-price": L("١٩٠ ج.م", "EGP 190"),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("منتجات مكمّلة", "Complete the kit") } },
};
