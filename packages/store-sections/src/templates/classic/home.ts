/**
 * Tallaby Classic home page, in the order of the Claude Design store data:
 * hero, perks, categories, top picks, two offers, new arrivals, reviews, the
 * blog and the newsletter. Categories, products and posts come from data
 * nodes, so the page shows the store's own catalog; a list with nothing to
 * show hides its section.
 */
import type { ElementIconName } from "../../elements/registry";
import { defineDesign, type DesignText, type TreeBuilder } from "../../designs/builder";
import { L, ON_BRAND, ON_BRAND_BODY, person, stars } from "../../designs/_kit";
import { postCover, postDate, postExcerpt, postTitle } from "../../designs/blog/_shared";
import { CLASSIC_PHOTOS } from "./photos";
import { CARD, FLUSH, LINKS, SECTION, eyebrow, pill, productGrid, sectionHead } from "./_shared";

export const classicHero = defineDesign({
  id: "tallaby-hero",
  version: 1,
  category: "hero",
  subcategory: "split",
  name: L("كلاسيك: الواجهة", "Classic: hero"),
  description: L("لوحة ملونة بعنوان كبير وزرين، وصورة داخل قوس أبيض بدائرة ذهبية.", "A tinted panel with a big headline and two buttons, and a photo in a white arch with an amber circle."),
  keywords: ["hero", "classic", "tallaby", "banner", "واجهة", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("الواجهة", "Hero"), style: { paddingTop: 16, paddingBottom: 0 } }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  eyebrow(t, L("وصل حديثًا", "Just landed")),
                  t.heading(L("كل اللي محتاجه، في مكان واحد", "Everything you need, in one place"), "h1", {
                    role: "title",
                    style: { fontSize: "display-lg", fontWeight: "extrabold", lineHeight: "tight" },
                  }),
                  t.paragraph(
                    L(
                      "منتجات مختارة بعناية، توصيل لكل المحافظات، والدفع عند الاستلام أو بالكارت.",
                      "Carefully picked products, delivery to every governorate, and cash on delivery or card.",
                    ),
                    { role: "subtitle", style: { fontSize: "lg", maxWidth: "460px", color: "foreground", opacity: 82 } },
                  ),
                  t.row([pill(t, L("تسوّق الآن", "Shop now"), LINKS.shop, "accent"), pill(t, L("وصل حديثًا", "New arrivals"), LINKS.newest, "outline", { role: "secondaryCta" })], {
                    label: L("الأزرار", "Buttons"),
                    style: { gap: 10, marginTop: 4 },
                  }),
                ],
                { label: L("النص", "Copy"), style: { gap: 16, alignItems: "start" } },
              ),
              t.box(
                [
                  t.box([], {
                    label: L("دائرة زخرفية", "Accent circle"),
                    style: { position: "absolute", insetTop: "-3%", insetEnd: "2%", width: "110px", minHeight: 110, radius: 999, background: "accent", zIndex: 0 },
                    mobile: { width: "72px", minHeight: 72 },
                  }),
                  t.image(CLASSIC_PHOTOS.giftStack, L("علب هدايا ملونة", "Colourful gift boxes"), {
                    role: "image",
                    style: {
                      aspectRatio: "portrait",
                      objectFit: "cover",
                      width: "100%",
                      maxWidth: "380px",
                      radius: 999,
                      borderWidth: 10,
                      borderColor: "white",
                      background: "white",
                      position: "relative",
                      zIndex: 1,
                    },
                    mobile: { maxWidth: "260px" },
                  }),
                ],
                { label: L("القوس", "Arch"), style: { position: "relative", textAlign: "center", paddingTop: 12, paddingBottom: 12 }, mobile: { paddingTop: 4 } },
              ),
            ],
            {
              label: L("اللوحة", "Panel"),
              columns: { desktop: 2, mobile: 1 },
              style: {
                gap: 28,
                alignItems: "center",
                background: "secondary",
                radius: 28,
                overflow: "hidden",
                paddingTop: 64,
                paddingBottom: 64,
                paddingStart: 64,
                paddingEnd: 64,
              },
              tablet: { paddingTop: 44, paddingBottom: 44, paddingStart: 40, paddingEnd: 40 },
              mobile: { paddingTop: 32, paddingBottom: 32, paddingStart: 20, paddingEnd: 20, radius: 24 },
            },
          ),
        ],
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

/** Icon tiles with a bold title and a muted line, four in a row on desktop. */
export function perkGrid(t: TreeBuilder, items: typeof PERKS, label: DesignText = L("المزايا", "Perks")) {
  return t.grid(
    items.map((p) =>
      t.row(
        [
          perkIcon(t, p.icon),
          t.stack([t.text(p.title, { style: { fontWeight: "bold", fontSize: "sm" } }), t.text(p.text, { style: { color: "muted", fontSize: "xs" } })], {
            label: L("النص", "Copy"),
            style: { gap: 2 },
          }),
        ],
        {
          label: L("ميزة", "Perk"),
          style: { ...CARD, gap: 12, alignItems: "center", wrap: false, paddingTop: 16, paddingBottom: 16, paddingStart: 16, paddingEnd: 16 },
          mobile: { direction: "column", alignItems: "start", gap: 10 },
        },
      ),
    ),
    { label, role: "items", columns: { desktop: 4, mobile: 2 }, style: { gap: 16 }, mobile: { gap: 10 } },
  );
}

export const classicPerks = defineDesign({
  id: "tallaby-perks",
  version: 1,
  category: "features",
  subcategory: "icons",
  name: L("كلاسيك: المزايا", "Classic: perks"),
  description: L("أربع مزايا بأيقونات: التوصيل والدفع والاسترجاع والدعم.", "Four perks with icons: delivery, payment, returns and support."),
  keywords: ["features", "perks", "classic", "tallaby", "مزايا", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("المزايا", "Perks"), style: { paddingTop: 20, paddingBottom: 0 } }, [
      t.container([perkGrid(t, PERKS)], { label: L("الحاوية", "Container") }),
    ]),
});

export const classicCategories = defineDesign({
  id: "tallaby-categories",
  version: 1,
  category: "categories",
  subcategory: "circles",
  name: L("كلاسيك: الأقسام", "Classic: categories"),
  description: L("أقسام المتجر في دوائر بالصورة والاسم.", "The store's categories as circles with photo and name."),
  keywords: ["categories", "classic", "tallaby", "أقسام", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories"), ...SECTION }, [
      t.container(
        [
          sectionHead(t, { title: L("تسوق حسب القسم", "Shop by category"), link: { text: L("عرض الكل", "View all"), href: LINKS.shop } }),
          t.categoryList(
            [
              t.link(
                LINKS.shop,
                [
                  t.stack(
                    [
                      t.image("", L("صورة القسم", "Category photo"), {
                        bind: "image",
                        style: { aspectRatio: "square", objectFit: "cover", width: "100%", radius: 999, borderWidth: 2, borderColor: "border", background: "white" },
                      }),
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

export const classicTopPicks = defineDesign({
  id: "tallaby-top-picks",
  version: 1,
  category: "products",
  subcategory: "grid",
  name: L("كلاسيك: الأعلى تقييمًا", "Classic: top picks"),
  description: L("ثمانية منتجات، الأعلى تقييمًا أولًا.", "Eight products, the best rated first."),
  keywords: ["products", "classic", "tallaby", "best", "منتجات", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("الأكثر طلبًا", "Most loved"), ...SECTION }, [
      t.container(
        [
          sectionHead(t, { eyebrow: L("الأكثر طلبًا", "Most loved"), title: L("اختياراتنا ليك", "Our top picks"), link: { text: L("عرض الكل", "View all"), href: LINKS.shop } }),
          productGrid(t, { source: "all", sort: "rating", limit: 8 }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

function offerCard(
  t: TreeBuilder,
  o: { tone: "dark" | "accent"; title: DesignText; text: DesignText; button: DesignText; href: string; image: string; alt: DesignText },
) {
  const dark = o.tone === "dark";
  const ink = dark ? "background" : "foreground";
  return t.grid(
    [
      t.stack(
        [
          t.heading(o.title, "h3", { role: "title", style: { fontSize: "3xl", fontWeight: "extrabold", color: ink, lineHeight: "tight" }, mobile: { fontSize: "2xl" } }),
          t.paragraph(o.text, { style: { color: ink, opacity: 88, fontSize: "sm" } }),
          pill(t, o.button, o.href, dark ? "accent" : "solid", dark ? {} : { style: { background: "foreground", color: "background", borderColor: "foreground" } }),
        ],
        { label: L("النص", "Copy"), style: { gap: 10, alignItems: "start", position: "relative", zIndex: 1 } },
      ),
      t.image(o.image, o.alt, {
        role: "image",
        style: { aspectRatio: "square", objectFit: "cover", width: "100%", radius: 999, position: "relative", zIndex: 1, borderWidth: 4, borderColor: dark ? "accent" : "white" },
      }),
      t.box([], {
        label: L("دائرة زخرفية", "Decor circle"),
        style: { position: "absolute", width: "180px", minHeight: 180, radius: 999, background: "white", opacity: 14, insetEnd: "-40px", insetBottom: "-60px", zIndex: 0 },
      }),
    ],
    {
      label: dark ? L("عرض داكن", "Dark offer") : L("عرض ذهبي", "Amber offer"),
      columns: { desktop: 2, mobile: 2 },
      style: {
        position: "relative",
        overflow: "hidden",
        background: dark ? "foreground" : "accent",
        radius: 24,
        gap: 16,
        alignItems: "center",
        minHeight: 220,
        paddingTop: 36,
        paddingBottom: 36,
        paddingStart: 36,
        paddingEnd: 36,
      },
      mobile: { paddingTop: 26, paddingBottom: 26, paddingStart: 22, paddingEnd: 22, minHeight: 190 },
    },
  );
}

export const classicOffers = defineDesign({
  id: "tallaby-offers",
  version: 1,
  category: "promotions",
  subcategory: "pair",
  name: L("كلاسيك: عرضين", "Classic: two offers"),
  description: L("بطاقتا عرض جنبًا إلى جنب: داكنة وذهبية، بصورة وزر.", "Two offer cards side by side, dark and amber, each with a photo and a button."),
  keywords: ["promotions", "offers", "classic", "tallaby", "عروض", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("العروض", "Offers"), ...SECTION }, [
      t.container(
        [
          t.grid(
            [
              offerCard(t, {
                tone: "dark",
                title: L("اشتري اتنين ووفّر", "Buy two and save"),
                text: L("اختار أي منتجين واستمتع بخصم على الطلب.", "Pick any two items and get money off your order."),
                button: L("تسوّق الآن", "Shop now"),
                href: LINKS.shop,
                image: CLASSIC_PHOTOS.blackGifts,
                alt: L("علبتا هدايا سوداء", "Two black gift boxes"),
              }),
              offerCard(t, {
                tone: "accent",
                title: L("هدايا لكل مناسبة", "Gifts for every occasion"),
                text: L("حاجات صغيرة هيستخدموها كل يوم.", "Small things they will use every day."),
                button: L("تسوّق الهدايا", "Shop gifts"),
                href: LINKS.shop,
                image: CLASSIC_PHOTOS.paperBags,
                alt: L("أكياس تسوق ملونة", "Colourful shopping bags"),
              }),
            ],
            { label: L("البطاقات", "Cards"), role: "items", columns: { desktop: 2, mobile: 1 }, style: { gap: 20 }, mobile: { gap: 14 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

export const classicNewArrivals = defineDesign({
  id: "tallaby-new-arrivals",
  version: 1,
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

const REVIEWS: { rating: number; text: DesignText; initial: DesignText; name: DesignText; city: DesignText }[] = [
  {
    rating: 5,
    text: L("طلبت الحد ووصل التلات. التغليف كان نضيف والمنتج زي الصور بالظبط.", "Ordered on Sunday, arrived Tuesday. Neat packaging and exactly like the photos."),
    initial: L("م", "M"),
    name: L("مريم ع.", "Mariam A."),
    city: L("القاهرة", "Cairo"),
  },
  {
    rating: 5,
    text: L("بدّلت المقاس من غير أي مشاكل. الفريق رد عليا في دقايق.", "Swapped a size with zero hassle. The team replied in minutes."),
    initial: L("ع", "O"),
    name: L("عمر ك.", "Omar K."),
    city: L("الإسكندرية", "Alexandria"),
  },
  {
    rating: 4,
    text: L("أسعار معقولة وجودة كويسة، وهطلب تاني أكيد.", "Fair prices and good quality. I will order again for sure."),
    initial: L("ن", "N"),
    name: L("نور ح.", "Nour H."),
    city: L("الجيزة", "Giza"),
  },
];

export const classicTestimonials = defineDesign({
  id: "tallaby-testimonials",
  version: 1,
  category: "testimonials",
  subcategory: "review-grid",
  name: L("كلاسيك: آراء العملاء", "Classic: reviews"),
  description: L("شريط أبيض بثلاث بطاقات آراء بالنجوم والاسم والمدينة.", "A white band with three review cards: stars, name and city."),
  keywords: ["testimonials", "reviews", "classic", "tallaby", "آراء", "كلاسيك"],
  tree: (t) =>
    t.section(
      { label: L("آراء العملاء", "Reviews"), style: { background: "white", paddingTop: 64, paddingBottom: 64, marginTop: 72 }, mobile: { paddingTop: 44, paddingBottom: 44, marginTop: 48 } },
      [
        t.container(
          [
            sectionHead(t, { title: L("آراء العملاء", "What customers say") }),
            t.grid(
              REVIEWS.map((r) =>
                t.stack([stars(t, r.rating), t.paragraph(r.text, { style: { color: "foreground" } }), person(t, r.initial, r.name, r.city)], {
                  label: L("رأي", "Review"),
                  style: { background: "background", radius: 16, gap: 14, paddingTop: 24, paddingBottom: 24, paddingStart: 24, paddingEnd: 24 },
                }),
              ),
              { label: L("الآراء", "Reviews"), role: "items", columns: { desktop: 3, mobile: 1 }, style: { gap: 20, alignItems: "start" }, mobile: { gap: 14 } },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});

export const classicBlog = defineDesign({
  id: "tallaby-blog",
  version: 1,
  category: "blog",
  subcategory: "cards",
  name: L("كلاسيك: من المدونة", "Classic: from the blog"),
  description: L("آخر ثلاث مقالات منشورة. يختفي القسم لو مفيش مقالات.", "The three latest published posts; hidden while there are none."),
  keywords: ["blog", "posts", "classic", "tallaby", "مدونة", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("المدونة", "Blog"), ...SECTION }, [
      t.container(
        [
          sectionHead(t, { title: L("من المدونة", "From the blog"), link: { text: L("كل المقالات", "All articles"), href: LINKS.blog } }),
          t.postList(
            [t.stack([postCover(t, "wide", 16), postDate(t), postTitle(t), postExcerpt(t)], { label: L("بطاقة المقال", "Post card"), style: { gap: 10 } })],
            { label: L("المقالات", "Posts"), role: "items", limit: 3, columns: { desktop: 3, tablet: 2, mobile: 1 }, style: { gap: 24 }, mobile: { gap: 28 } },
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
                  t.heading(L("خد ١٠٪ خصم على أول طلب", "Get 10% off your first order"), "h2", {
                    role: "title",
                    style: { ...ON_BRAND, fontSize: "display-sm", fontWeight: "extrabold", lineHeight: "tight" },
                  }),
                  t.paragraph(L("اشترك وأول ما يوصل جديد أو عرض للمشتركين هتعرف.", "Join the list for new arrivals and members-only offers."), {
                    role: "subtitle",
                    style: ON_BRAND_BODY,
                  }),
                ],
                { label: L("النص", "Copy"), style: { gap: 10, position: "relative", zIndex: 1 } },
              ),
              t.stack([t.storeForm({ formTemplate: "newsletter" })], {
                label: L("النموذج", "Form"),
                style: { background: "white", radius: 20, paddingTop: 20, paddingBottom: 20, paddingStart: 20, paddingEnd: 20, position: "relative", zIndex: 1 },
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

export const CLASSIC_HOME = [
  classicHero,
  classicPerks,
  classicCategories,
  classicTopPicks,
  classicOffers,
  classicNewArrivals,
  classicTestimonials,
  classicBlog,
  classicNewsletter,
] as const;
