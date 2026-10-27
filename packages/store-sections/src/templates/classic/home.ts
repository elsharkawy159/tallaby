/**
 * Tallaby Classic home page, in the standard order of docs/template-rules.md
 * §2: a hero carousel, categories, best sellers, new arrivals, the trust
 * strip and the newsletter. No offers section: templates promise no discounts
 * (`../no-discounts.ts`; `classicOffers` stays a Classic design a seller can add). Categories and products come from data
 * nodes, so the page shows the store's own catalog; a list with nothing to
 * show hides its section.
 *
 * The template's one signature is the arch: each hero slide frames its photo
 * in a tall white arch beside an amber sun, on its own colour (shelf, brand,
 * amber). Everything after the hero stays quiet: white cards, one radius,
 * pill buttons.
 */
import type { ElementIconName } from "../../elements/registry";
import type { StyleValues } from "../../elements/style";
import { defineDesign, type DesignText, type TreeBuilder } from "../../designs/builder";
import { L, ON_BRAND, ON_BRAND_BODY } from "../../designs/_kit";
import { CLASSIC_PHOTOS } from "./photos";
import { CARD, FLUSH, LINKS, SECTION, pill, productGrid, sectionHead } from "./_shared";

type SlideTone = "shelf" | "brand" | "amber";

/** Per tone: the slide colour, the text colour, the sun colour and the button. */
const TONES: Record<SlideTone, { background: string; ink: StyleValues; body: StyleValues; sun: string; button: "accent" | "solid" | "ink" }> = {
  shelf: { background: "secondary", ink: { color: "foreground" }, body: { color: "foreground", opacity: 80 }, sun: "accent", button: "solid" },
  brand: { background: "primary", ink: ON_BRAND, body: ON_BRAND_BODY, sun: "accent", button: "accent" },
  amber: { background: "accent", ink: { color: "foreground" }, body: { color: "foreground", opacity: 85 }, sun: "primary", button: "ink" },
};

/**
 * One hero slide: a short headline, one line and one button beside the arch.
 * The bottom padding keeps the carousel's dots clear of the button.
 */
function heroSlide(
  t: TreeBuilder,
  index: number,
  o: { tone: SlideTone; title: DesignText; text: DesignText; button: DesignText; href: string; image: string; alt: DesignText },
) {
  const tone = TONES[o.tone];
  const button =
    tone.button === "ink"
      ? pill(t, o.button, o.href, "solid", { style: { background: "foreground", color: "background", borderColor: "foreground", hover: { opacity: 90 } } })
      : pill(t, o.button, o.href, tone.button);
  return t.slide(
    [
      t.grid(
        [
          t.stack(
            [
              t.heading(o.title, index === 0 ? "h1" : "h2", {
                role: "title",
                style: { ...tone.ink, fontSize: "display-lg", fontWeight: "extrabold", lineHeight: "tight", maxWidth: "520px" },
              }),
              t.paragraph(o.text, { role: "subtitle", style: { ...tone.body, fontSize: "lg", maxWidth: "440px" }, mobile: { fontSize: "md" } }),
              t.box([button], { label: L("الزر", "Button"), style: { marginTop: 6 } }),
            ],
            { label: L("النص", "Copy"), style: { gap: 14, alignItems: "start" }, mobile: { order: 2, gap: 10 } },
          ),
          t.box(
            [
              t.box([], {
                label: L("الشمس", "Sun"),
                style: { position: "absolute", insetTop: "4%", insetEnd: "6%", width: "120px", minHeight: 120, radius: 999, background: tone.sun, zIndex: 0 },
                mobile: { width: "64px", minHeight: 64, insetEnd: "18%" },
              }),
              t.row(
                [
                  t.image(o.image, o.alt, {
                    role: "image",
                    style: { aspectRatio: "portrait", objectFit: "cover", width: "100%", maxWidth: "340px", radius: 999, borderWidth: 10, borderColor: "white", background: "surface" },
                    tablet: { maxWidth: "260px" },
                    mobile: { maxWidth: "150px", borderWidth: 6 },
                  }),
                ],
                { label: L("الصورة", "Photo"), style: { justifyContent: "center", wrap: false, position: "relative", zIndex: 1 } },
              ),
            ],
            { label: L("القوس", "Arch"), style: { position: "relative" }, mobile: { order: 1 } },
          ),
        ],
        {
          label: L("المحتوى", "Content"),
          columns: { desktop: 2, mobile: 1 },
          style: { gap: 32, alignItems: "center", paddingTop: 56, paddingBottom: 88, paddingStart: 64, paddingEnd: 64 },
          tablet: { paddingStart: 40, paddingEnd: 40 },
          mobile: { gap: 18, paddingTop: 28, paddingBottom: 76, paddingStart: 22, paddingEnd: 22 },
        },
      ),
    ],
    { label: L("شريحة", "Slide"), style: { background: tone.background, justifyContent: "center", minHeight: 0, gap: 0 } },
  );
}

export const classicHero = defineDesign({
  id: "tallaby-hero",
  version: 2,
  category: "hero",
  subcategory: "carousel",
  name: L("كلاسيك: شرائح الواجهة", "Classic: hero carousel"),
  description: L(
    "ثلاث شرائح بعرض الحاوية بزوايا مدوّرة، كل شريحة بلون وعنوان وزر وصورة داخل قوس أبيض.",
    "Three rounded slides the width of the page container, each with its own colour, a headline, a button and a photo in a white arch.",
  ),
  keywords: ["hero", "carousel", "slider", "classic", "tallaby", "واجهة", "شرائح", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("الواجهة", "Hero"), style: { paddingTop: 16, paddingBottom: 0 }, mobile: { paddingTop: 12, paddingBottom: 0 } }, [
      t.container(
        [
          t.carousel(
            [
              heroSlide(t, 0, {
                tone: "shelf",
                title: L("كل اللي محتاجه في مكان واحد", "Everything you need, one place"),
                text: L("منتجات مختارة بعناية، وتوصيل لكل المحافظات.", "Carefully picked products, delivered to every governorate."),
                button: L("تسوّق الآن", "Shop now"),
                href: LINKS.shop,
                image: CLASSIC_PHOTOS.giftStack,
                alt: L("علب هدايا ملونة", "Colourful gift boxes"),
              }),
              heroSlide(t, 1, {
                tone: "brand",
                title: L("وصل جديد الأسبوع ده", "New in this week"),
                text: L("أحدث المنتجات أول ما توصل المخزن.", "The latest products, as soon as they reach us."),
                button: L("شوف الجديد", "See what's new"),
                href: LINKS.newest,
                image: CLASSIC_PHOTOS.paperBags,
                alt: L("أكياس تسوق ملونة", "Colourful shopping bags"),
              }),
              heroSlide(t, 2, {
                tone: "amber",
                title: L("الأكثر طلبًا عند عملائنا", "Our customers' favourites"),
                text: L("المنتجات اللي الناس بترجع تطلبها تاني.", "The products people come back to order again."),
                button: L("شوف الأكثر مبيعًا", "See best sellers"),
                href: LINKS.bestSellers,
                image: CLASSIC_PHOTOS.parcelShelf,
                alt: L("طرود مغلفة على رف خشب", "Wrapped parcels on a wooden shelf"),
              }),
            ],
            { label: L("الشرائح", "Slides"), autoplay: true, interval: 5, style: { radius: 28 }, mobile: { radius: 20 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

export const classicCategories = defineDesign({
  id: "tallaby-categories",
  version: 2,
  category: "categories",
  subcategory: "circles",
  name: L("كلاسيك: الأقسام", "Classic: categories"),
  description: L("أقسام المتجر في دوائر بالصورة والاسم.", "The store's categories as circles with photo and name."),
  keywords: ["categories", "classic", "tallaby", "أقسام", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories"), ...SECTION }, [
      t.container(
        [
          sectionHead(t, { title: L("تسوّق حسب القسم", "Shop by category"), link: { text: L("كل المنتجات", "All products"), href: LINKS.shop } }),
          t.categoryList(
            [
              t.link(
                LINKS.shop,
                [
                  t.stack(
                    [
                      t.box(
                        [
                          t.image("", L("صورة القسم", "Category photo"), {
                            bind: "image",
                            style: { aspectRatio: "square", objectFit: "cover", width: "100%", radius: 999 },
                          }),
                        ],
                        {
                          label: L("الإطار", "Frame"),
                          style: { background: "surface", radius: 999, borderWidth: 1, borderColor: "border", paddingTop: 6, paddingBottom: 6, paddingStart: 6, paddingEnd: 6 },
                          mobile: { paddingTop: 4, paddingBottom: 4, paddingStart: 4, paddingEnd: 4 },
                        },
                      ),
                      t.text(L("اسم القسم", "Category"), { bind: "name", style: { fontWeight: "semibold", fontSize: "sm", textAlign: "center" } }),
                    ],
                    { label: L("المحتوى", "Content"), style: { gap: 10, alignItems: "center" } },
                  ),
                ],
                { label: L("قسم", "Category"), bind: "href", style: { ...FLUSH, color: "foreground", hover: { color: "primary", scale: 103 } } },
              ),
            ],
            {
              label: L("الأقسام", "Categories"),
              role: "items",
              limit: 6,
              columns: { desktop: 6, tablet: 4, mobile: 3 },
              style: { gap: 24 },
              mobile: { gap: 14 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

export const classicBestSellers = defineDesign({
  id: "tallaby-best-sellers",
  version: 1,
  category: "products",
  subcategory: "grid",
  name: L("كلاسيك: الأكثر مبيعًا", "Classic: best sellers"),
  description: L("حتى ثمانية منتجات، الأكثر مبيعًا أولًا.", "Up to eight products, the best selling first."),
  keywords: ["products", "best sellers", "classic", "tallaby", "الأكثر مبيعًا", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("الأكثر مبيعًا", "Best sellers"), ...SECTION }, [
      t.container(
        [
          sectionHead(t, { title: L("الأكثر مبيعًا", "Best sellers"), link: { text: L("عرض الكل", "View all"), href: LINKS.bestSellers } }),
          productGrid(t, { source: "best-sellers", limit: 8 }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

export const classicOffers = defineDesign({
  id: "tallaby-offers",
  version: 2,
  category: "promotions",
  subcategory: "banner-products",
  name: L("كلاسيك: العروض", "Classic: offers"),
  description: L(
    "بانر عرض داكن بصورة وزر، وتحته المنتجات اللي عليها خصم. يختفي القسم لو مفيش خصومات.",
    "A dark offer banner with a photo and a button, above the discounted products. Hidden while nothing is discounted.",
  ),
  keywords: ["promotions", "offers", "sale", "discount", "classic", "tallaby", "عروض", "خصم", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("العروض", "Offers"), ...SECTION }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.heading(L("خصومات لفترة محدودة", "Offers for a limited time"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", fontWeight: "extrabold", lineHeight: "tight", color: "background" },
                  }),
                  t.paragraph(L("أسعار أقل على منتجات مختارة، لحد ما الكمية تخلص.", "Lower prices on picked products, while stocks last."), {
                    role: "subtitle",
                    style: { color: "background", opacity: 85 },
                  }),
                  t.box([pill(t, L("شوف العروض", "See the offers"), LINKS.shop, "accent")], { label: L("الزر", "Button"), style: { marginTop: 4 } }),
                ],
                { label: L("النص", "Copy"), style: { gap: 10, alignItems: "start", position: "relative", zIndex: 1 } },
              ),
              t.row(
                [
                  t.image(CLASSIC_PHOTOS.blackGifts, L("علبتا هدايا سوداء", "Two black gift boxes"), {
                    role: "image",
                    style: { aspectRatio: "square", objectFit: "cover", width: "100%", maxWidth: "200px", radius: 999, borderWidth: 4, borderColor: "accent" },
                    mobile: { maxWidth: "120px" },
                  }),
                ],
                // Phones keep the banner to its line and button.
                { label: L("الصورة", "Photo"), style: { justifyContent: "end", wrap: false, position: "relative", zIndex: 1 }, mobile: { hidden: true } },
              ),
              t.box([], {
                label: L("حلقة زخرفية", "Decor ring"),
                style: { position: "absolute", width: "240px", minHeight: 240, radius: 999, borderWidth: 24, borderColor: "accent", opacity: 20, insetEnd: "-70px", insetBottom: "-110px", zIndex: 0 },
              }),
            ],
            {
              label: L("البانر", "Banner"),
              columns: { desktop: 2, mobile: 1 },
              style: {
                position: "relative",
                overflow: "hidden",
                background: "foreground",
                radius: 24,
                gap: 20,
                alignItems: "center",
                justifyContent: "between",
                marginBottom: 24,
                paddingTop: 36,
                paddingBottom: 36,
                paddingStart: 40,
                paddingEnd: 40,
              },
              mobile: { paddingTop: 24, paddingBottom: 24, paddingStart: 20, paddingEnd: 20, gap: 12, marginBottom: 16 },
            },
          ),
          productGrid(t, { source: "discounted", limit: 4 }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

export const classicNewArrivals = defineDesign({
  id: "tallaby-new-arrivals",
  version: 2,
  category: "products",
  subcategory: "grid",
  name: L("كلاسيك: وصل حديثًا", "Classic: new arrivals"),
  description: L("أحدث أربعة منتجات.", "The four newest products."),
  keywords: ["products", "new", "classic", "tallaby", "جديد", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("وصل حديثًا", "New arrivals"), ...SECTION }, [
      t.container(
        [sectionHead(t, { title: L("وصل حديثًا", "New arrivals"), link: { text: L("عرض الكل", "View all"), href: LINKS.newest } }), productGrid(t, { source: "newest", limit: 4 })],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

const PERKS: { icon: ElementIconName; title: DesignText; text: DesignText }[] = [
  { icon: "truck", title: L("توصيل سريع", "Fast delivery"), text: L("من يوم لـ ٤ أيام لكل المحافظات", "1 to 4 days, all governorates") },
  { icon: "credit-card", title: L("الدفع عند الاستلام", "Cash on delivery"), text: L("أو ادفع بالكارت والمحفظة", "Or pay by card and wallet") },
  { icon: "rotate", title: L("استرجاع سهل", "Easy returns"), text: L("١٤ يوم تغيّر رأيك", "14 days to change your mind") },
  { icon: "chat", title: L("دعم على واتساب", "WhatsApp support"), text: L("ناس حقيقية، ٧ أيام في الأسبوع", "Real people, 7 days a week") },
];

/** An icon on a soft brand-tinted square. */
const perkIcon = (t: TreeBuilder, icon: ElementIconName) =>
  t.box([t.icon(icon, { style: { fontSize: "xl", color: "primary" } })], {
    label: L("أيقونة", "Icon tile"),
    style: { background: "secondary", radius: 12, width: "44px", paddingTop: 10, paddingBottom: 8, textAlign: "center" },
  });

/** One perk: the icon tile, a bold title and a muted line. */
const perk = (t: TreeBuilder, p: (typeof PERKS)[number], style: StyleValues = {}, mobile: StyleValues = {}) =>
  t.row(
    [
      perkIcon(t, p.icon),
      t.stack([t.text(p.title, { style: { fontWeight: "bold", fontSize: "sm" } }), t.text(p.text, { style: { color: "muted", fontSize: "xs" } })], {
        label: L("النص", "Copy"),
        style: { gap: 2 },
      }),
    ],
    { label: L("ميزة", "Perk"), style: { gap: 12, alignItems: "center", wrap: false, ...style }, mobile: { direction: "column", alignItems: "start", gap: 10, ...mobile } },
  );

/** Icon cards with a bold title and a muted line, four in a row on desktop (the About page's values). */
export function perkGrid(t: TreeBuilder, items: typeof PERKS, label: DesignText = L("المزايا", "Perks")) {
  return t.grid(
    items.map((p) => perk(t, p, { ...CARD, paddingTop: 16, paddingBottom: 16, paddingStart: 16, paddingEnd: 16 })),
    { label, role: "items", columns: { desktop: 4, mobile: 2 }, style: { gap: 16 }, mobile: { gap: 10 } },
  );
}

export const classicPerks = defineDesign({
  id: "tallaby-perks",
  version: 2,
  category: "features",
  subcategory: "icons",
  name: L("كلاسيك: شريط الثقة", "Classic: trust strip"),
  description: L("شريط أبيض واحد بأربع مزايا: التوصيل والدفع والاسترجاع والدعم.", "One white strip with four perks: delivery, payment, returns and support."),
  keywords: ["features", "perks", "trust", "classic", "tallaby", "مزايا", "ثقة", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("شريط الثقة", "Trust strip"), ...SECTION }, [
      t.container(
        [
          t.grid(
            PERKS.map((p) => perk(t, p)),
            {
              label: L("المزايا", "Perks"),
              role: "items",
              columns: { desktop: 4, mobile: 2 },
              style: { ...CARD, gap: 24, paddingTop: 24, paddingBottom: 24, paddingStart: 28, paddingEnd: 28 },
              mobile: { gap: 20, paddingTop: 20, paddingBottom: 20, paddingStart: 18, paddingEnd: 18 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

export const classicNewsletter = defineDesign({
  id: "tallaby-newsletter",
  version: 1,
  category: "newsletter",
  subcategory: "panel",
  name: L("كلاسيك: النشرة", "Classic: newsletter"),
  description: L("لوحة بلون المتجر بعنوان ونموذج الاشتراك وحلقة ذهبية.", "A brand-coloured panel with the headline, the sign-up form and an amber ring."),
  keywords: ["newsletter", "subscribe", "classic", "tallaby", "نشرة", "اشتراك", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("النشرة البريدية", "Newsletter"), ...SECTION }, [
      t.container(
        [
          t.grid(
            [
              t.box([], {
                label: L("حلقة زخرفية", "Decor ring"),
                style: { position: "absolute", width: "220px", minHeight: 220, radius: 999, borderWidth: 20, borderColor: "accent", insetEnd: "-90px", insetTop: "-110px", zIndex: 0 },
              }),
              t.stack(
                [
                  t.heading(L("خليك أول من يعرف", "Be the first to know"), "h2", {
                    role: "title",
                    style: { ...ON_BRAND, fontSize: "display-sm", fontWeight: "extrabold", lineHeight: "tight" },
                  }),
                  t.paragraph(L("اشترك وأول ما يوصل منتج جديد هتعرف.", "Join the list and hear about new arrivals first."), {
                    role: "subtitle",
                    style: ON_BRAND_BODY,
                  }),
                ],
                { label: L("النص", "Copy"), style: { gap: 10, position: "relative", zIndex: 1 } },
              ),
              t.stack([t.storeForm({ formTemplate: "newsletter" })], {
                label: L("النموذج", "Form"),
                style: { background: "surface", radius: 20, paddingTop: 20, paddingBottom: 20, paddingStart: 20, paddingEnd: 20, position: "relative", zIndex: 1 },
              }),
            ],
            {
              label: L("اللوحة", "Panel"),
              columns: { desktop: 2, mobile: 1 },
              style: {
                position: "relative",
                overflow: "hidden",
                background: "primary",
                radius: 28,
                gap: 28,
                alignItems: "center",
                paddingTop: 56,
                paddingBottom: 56,
                paddingStart: 56,
                paddingEnd: 56,
              },
              mobile: { paddingTop: 32, paddingBottom: 32, paddingStart: 22, paddingEnd: 22, radius: 24, gap: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

/** The standard home order (template rules §2); every section but the hero rises in on scroll (§6a, on by default). */
export const CLASSIC_HOME = [
  classicHero,
  classicCategories,
  classicBestSellers,
  classicNewArrivals,
  classicPerks,
  classicNewsletter,
] as const;
