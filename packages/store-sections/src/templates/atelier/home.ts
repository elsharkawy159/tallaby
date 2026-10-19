/**
 * Atelier home page, in the order of the Claude Design section map:
 * Inline type hero, Side-title rail (collections), Feature and four (new in),
 * Wide photo caption (campaign), Clean grid (most loved), Overlap card (the
 * house) and Photo split (private list). Products and categories come from
 * data nodes, so the page shows the store's own catalog.
 */
import { defineDesign, type TreeBuilder } from "../../designs/builder";
import { L } from "../../designs/_kit";
import { ATELIER_PHOTOS } from "./photos";
import { DISPLAY, FLUSH, LINKS, SECTION, button, eyebrow, head, photo, priceLine, productCard, textArrow } from "./_shared";

const WORD = { ...DISPLAY, fontSize: "display-lg" } as const;

const capsule = (t: TreeBuilder, src: string, alt: ReturnType<typeof L>) =>
  t.image(src, alt, { style: { aspectRatio: "wide", objectFit: "cover", radius: 999, width: "150px" }, mobile: { width: "84px" } });

export const atelierHero = defineDesign({
  id: "atelier-hero",
  version: 1,
  category: "hero",
  subcategory: "editorial",
  name: L("أتيليه: كلام وصور صغيرة", "Atelier: inline type"),
  description: L("عنوان كبير بخط كلاسيكي وصورتان داخل السطر، ونبذة وأقسام المتجر.", "A large serif headline with two photos inside the line, a pitch and the store's categories."),
  keywords: ["hero", "atelier", "editorial", "fashion", "واجهة", "موضة"],
  tree: (t) =>
    t.section({ label: L("الواجهة", "Hero"), style: { paddingTop: 80, paddingBottom: 72 }, mobile: { paddingTop: 44, paddingBottom: 44 } }, [
      t.container(
        [
          t.row(
            [
              eyebrow(t, L("خريف ٢٠٢٦", "Autumn 2026")),
              t.text(L("مفصّلة في القاهرة بكميات محدودة", "Cut in Cairo, in small runs"), { style: { color: "muted", fontSize: "sm" } }),
            ],
            { label: L("السطر العلوي", "Meta line"), style: { justifyContent: "between", gap: 12, marginBottom: 32 }, mobile: { marginBottom: 20 } },
          ),
          t.row(
            [
              t.heading(L("خامات طبيعية", "Natural fabrics"), "h1", { role: "title", style: WORD }),
              capsule(t, ATELIER_PHOTOS.linenRail, L("قمصان كتان على الشماعة", "Linen shirts on the rail")),
              t.text(L("وقصّات هادئة", "and quiet cuts"), { style: WORD }),
              capsule(t, ATELIER_PHOTOS.bagsPlinth, L("شنط جلد صغيرة", "Small leather bags")),
              t.text(L("تعيش أطول من الموسم.", "made to outlast the season."), { style: { ...WORD, italic: true } }),
            ],
            { label: L("العنوان بالصور", "Headline with photos"), role: "headline", style: { gap: 18, alignItems: "center" }, mobile: { gap: 10 } },
          ),
          t.grid(
            [
              t.stack(
                [
                  t.paragraph(
                    L(
                      "كتان مصري وصوف ناعم وحرير مغسول، نفصّلها في ورشتنا ونشطّبها يدويًا.",
                      "Egyptian linen, soft wool and washed silk, cut in our workshop and finished by hand.",
                    ),
                    { role: "subtitle", style: { fontSize: "lg", maxWidth: "460px", color: "muted" } },
                  ),
                  button(t, L("اكتشف المجموعة", "Discover the collection"), LINKS.newIn),
                ],
                { label: L("النبذة", "Pitch"), style: { gap: 24, alignItems: "start" } },
              ),
              t.categoryList(
                [
                  t.link(
                    LINKS.shop,
                    [
                      t.row(
                        [
                          t.text(L("اسم القسم", "Category"), { bind: "name", style: { fontSize: "sm", fontWeight: "medium" } }),
                          t.text(L("١٢", "12"), { bind: "productCount", style: { fontSize: "xs", color: "muted" } }),
                        ],
                        { label: L("المحتوى", "Content"), style: { gap: 8, wrap: false, alignItems: "center" } },
                      ),
                    ],
                    {
                      label: L("قسم", "Category chip"),
                      bind: "href",
                      style: {
                        borderWidth: 1,
                        borderColor: "border",
                        paddingStart: 16,
                        paddingEnd: 16,
                        paddingTop: 9,
                        paddingBottom: 9,
                        color: "foreground",
                        hover: { borderColor: "foreground" },
                      },
                    },
                  ),
                ],
                {
                  label: L("الأقسام", "Categories"),
                  role: "items",
                  limit: 6,
                  optional: true,
                  columns: { desktop: 3, mobile: 2 },
                  style: { gap: 8, alignItems: "end" },
                },
              ),
            ],
            { label: L("السطر السفلي", "Lower row"), columns: { desktop: 2, mobile: 1 }, style: { gap: 40, alignItems: "end", marginTop: 56 }, mobile: { marginTop: 32, gap: 28 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

export const atelierCollections = defineDesign({
  id: "atelier-collections",
  version: 1,
  category: "categories",
  subcategory: "editorial",
  name: L("أتيليه: شريط بعنوان جانبي", "Atelier: side-title rail"),
  description: L("عمود عنوان جانبي، وبجانبه بطاقات طويلة لأقسام المتجر.", "A side title column beside tall cards of the store's categories."),
  keywords: ["categories", "atelier", "collections", "أقسام", "مجموعات"],
  tree: (t) =>
    t.section({ label: L("المجموعات", "Collections"), ...SECTION, style: { ...SECTION.style, background: "secondary" } }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  eyebrow(t, L("المجموعات", "Collections")),
                  t.heading(L("مجموعات قليلة وأسلوب واحد", "A few collections, one way of dressing"), "h2", {
                    role: "title",
                    style: { ...DISPLAY, fontSize: "display-md" },
                  }),
                  t.paragraph(
                    L("كل قطعة مصممة لتتناسق مع الباقي، فتكفيك خزانة صغيرة لمواسم كثيرة.", "Each piece is made to sit with the rest, so a small wardrobe goes a long way."),
                    { role: "body", style: { color: "muted" } },
                  ),
                  textArrow(t, L("كل القطع", "All pieces"), LINKS.shop),
                ],
                { label: L("العنوان", "Heading"), style: { gap: 18, alignItems: "start", paddingTop: 8 } },
              ),
              t.categoryList(
                [
                  t.link(
                    LINKS.shop,
                    [
                      t.image("", L("صورة القسم", "Category photo"), { bind: "image", style: { aspectRatio: "portrait", objectFit: "cover", radius: 0, width: "100%" } }),
                      t.stack(
                        [
                          t.text(L("اسم القسم", "Category"), { bind: "name", style: { ...DISPLAY, fontSize: "xl" } }),
                          t.row(
                            [
                              t.text(L("١٢", "12"), { bind: "productCount", style: { color: "muted", fontSize: "xs" } }),
                              t.text(L("قطعة", "pieces"), { style: { color: "muted", fontSize: "xs" } }),
                            ],
                            { label: L("العدد", "Count"), style: { gap: 4 } },
                          ),
                        ],
                        {
                          label: L("لوحة الاسم", "Name plate"),
                          style: {
                            position: "absolute",
                            insetBottom: "14px",
                            insetStart: "14px",
                            insetEnd: "14px",
                            background: "background",
                            gap: 2,
                            paddingTop: 12,
                            paddingBottom: 12,
                            paddingStart: 16,
                            paddingEnd: 16,
                          },
                        },
                      ),
                    ],
                    { label: L("قسم", "Category"), bind: "href", style: { ...FLUSH, position: "relative", overflow: "hidden", color: "foreground", hover: { opacity: 92 } } },
                  ),
                ],
                {
                  label: L("الأقسام", "Categories"),
                  role: "items",
                  limit: 3,
                  columns: { desktop: 3, mobile: 2 },
                  style: { gap: 20, colSpan: 3 },
                  tablet: { colSpan: 1 },
                  mobile: { gap: 12 },
                },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 4, tablet: 1, mobile: 1 }, style: { gap: 32 }, mobile: { gap: 24 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

export const atelierNewIn = defineDesign({
  id: "atelier-new-in",
  version: 1,
  category: "products",
  subcategory: "featured",
  name: L("أتيليه: قطعة مميزة وأربعة", "Atelier: feature and four"),
  description: L("القطعة المميزة كبيرة، وبجانبها أحدث أربع قطع.", "The featured piece large, with the four newest pieces beside it."),
  keywords: ["products", "atelier", "new", "featured", "جديد", "منتجات"],
  tree: (t) =>
    t.section({ label: L("وصل حديثًا", "New in"), ...SECTION }, [
      t.container(
        [
          head(t, {
            title: L("وصل حديثًا", "New in"),
            text: L("من الورشة هذا الشهر.", "This month from the workshop."),
            link: { text: L("عرض الكل", "View all"), href: LINKS.newIn },
          }),
          t.grid(
            [
              t.productList(
                [
                  t.stack(
                    [
                      eyebrow(t, L("قطعة الموسم", "Piece of the season")),
                      t.link(LINKS.shop, [t.image("", L("القطعة المميزة", "Featured piece"), { bind: "image", style: { aspectRatio: "portrait", objectFit: "cover", radius: 0, width: "100%" } })], {
                        label: L("صورة القطعة", "Piece photo"),
                        bind: "href",
                        style: { ...FLUSH, overflow: "hidden", background: "secondary" },
                      }),
                      t.link(LINKS.shop, [t.text(L("اسم القطعة", "Piece name"), { bind: "title", style: { ...DISPLAY, fontSize: "3xl" } })], {
                        label: L("اسم القطعة", "Piece name"),
                        bind: "href",
                        style: { ...FLUSH, color: "foreground" },
                      }),
                      priceLine(t, { fontSize: "lg" }),
                      t.row([t.addToCart({ label: L("أضف للسلة", "Add to cart") }), t.wishlistButton({ label: L("المفضلة", "Wishlist") })], {
                        label: L("الأزرار", "Buttons"),
                        style: { gap: 10, alignItems: "center" },
                      }),
                    ],
                    { label: L("القطعة المميزة", "Featured piece"), style: { gap: 16 } },
                  ),
                ],
                { label: L("القطعة المميزة", "Featured piece"), source: "featured", limit: 1, optional: true, columns: { desktop: 1 } },
              ),
              t.productList([productCard(t, { nameSize: "lg" })], {
                label: L("أحدث القطع", "Newest pieces"),
                role: "items",
                source: "newest",
                limit: 4,
                columns: { desktop: 2, mobile: 2 },
                style: { gap: 24 },
                mobile: { gap: 14 },
              }),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 2, mobile: 1 }, style: { gap: 40, alignItems: "start" }, mobile: { gap: 32 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

export const atelierCampaign = defineDesign({
  id: "atelier-campaign",
  version: 1,
  category: "image-text",
  subcategory: "story",
  name: L("أتيليه: صورة عريضة وتعليق", "Atelier: wide photo caption"),
  description: L("عنوان كبير وصورة الحملة عريضة، وتحتها فقرة وزر.", "A large headline, the wide campaign photo and a caption with a button."),
  keywords: ["image with text", "atelier", "campaign", "حملة", "صورة"],
  tree: (t) =>
    t.section({ label: L("الحملة", "Campaign"), ...SECTION }, [
      t.container(
        [
          t.heading(L("خريف هادئ في القاهرة", "A slow autumn in Cairo"), "h2", {
            role: "title",
            style: { ...DISPLAY, fontSize: "display-lg", maxWidth: "18ch", marginBottom: 36 },
            mobile: { marginBottom: 20 },
          }),
          photo(t, ATELIER_PHOTOS.studioRail, L("مجموعة الخريف على راف الاستوديو", "The autumn collection on the studio rail"), "wide", {
            mobile: { aspectRatio: "landscape" },
          }),
          t.row(
            [
              t.paragraph(
                L(
                  "بالطوهات بلون الجمل والكاكاو، وكتان رملي وعاجي، ولا شيء صاخب. صوّرناها في عصرية طويلة في الورشة.",
                  "Coats in camel and cocoa, linen in sand and ivory, nothing loud. Shot over one long afternoon in the workshop.",
                ),
                { role: "body", style: { fontSize: "lg", maxWidth: "56ch", color: "muted" } },
              ),
              button(t, L("تسوّق الحملة", "Shop the campaign"), LINKS.shop, "outline"),
            ],
            { label: L("التعليق", "Caption"), style: { justifyContent: "between", alignItems: "start", gap: 24, marginTop: 28 }, mobile: { direction: "column", marginTop: 20, gap: 16 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

export const atelierMostLoved = defineDesign({
  id: "atelier-most-loved",
  version: 1,
  category: "products",
  subcategory: "featured",
  name: L("أتيليه: شبكة نظيفة", "Atelier: clean grid"),
  description: L("أعلى القطع تقييمًا في شبكة من أربعة.", "The best-rated pieces in a grid of four."),
  keywords: ["products", "atelier", "grid", "best", "منتجات", "الأكثر"],
  tree: (t) =>
    t.section({ label: L("الأكثر طلبًا", "Most loved"), ...SECTION, style: { ...SECTION.style, paddingTop: 0 } }, [
      t.container(
        [
          head(t, {
            title: L("الأكثر طلبًا", "Most loved"),
            text: L("القطع التي يعود لها عملاؤنا.", "The pieces our clients come back for."),
            link: { text: L("عرض الكل", "View all"), href: LINKS.shop },
          }),
          t.productList([productCard(t)], {
            label: L("القطع", "Pieces"),
            role: "items",
            source: "all",
            sort: "rating",
            limit: 4,
            columns: { desktop: 4, tablet: 3, mobile: 2 },
            style: { gap: 28 },
            mobile: { gap: 14 },
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

export const atelierHouse = defineDesign({
  id: "atelier-house",
  version: 1,
  category: "image-text",
  subcategory: "story",
  name: L("أتيليه: صورة بكارت", "Atelier: overlap card"),
  description: L("صورة الورشة عريضة وعليها بطاقة حكاية الدار.", "A wide workshop photo with the house's story on an overlapping card."),
  keywords: ["about", "atelier", "story", "workshop", "قصتنا", "الورشة"],
  tree: (t) =>
    t.section({ label: L("عن الدار", "The house"), ...SECTION, style: { ...SECTION.style, background: "secondary" } }, [
      t.container(
        [
          t.box(
            [
              photo(t, ATELIER_PHOTOS.cuttingTable, L("قماش ودبابيس وماكينة الخياطة على طاولة القص", "Fabric, pins and the sewing machine on the cutting table"), "wide", {
                mobile: { aspectRatio: "landscape" },
              }),
              t.stack(
                [
                  eyebrow(t, L("عن الدار", "The house")),
                  t.heading(L("ورشة صغيرة منذ ٢٠١٤", "A small workshop since 2014"), "h2", { role: "title", style: { ...DISPLAY, fontSize: "display-sm" } }),
                  t.paragraph(
                    L(
                      "ثمانية خيّاطين يفصّلون كل قطعة يدويًا بكميات لا تتجاوز خمسين. حين ينفد القماش تنتهي القطعة.",
                      "Eight tailors cut every piece by hand in runs of fifty or fewer. When a fabric is gone, so is the piece.",
                    ),
                    { role: "body", style: { color: "muted" } },
                  ),
                  textArrow(t, L("اقرأ حكايتنا", "Read our story"), LINKS.about),
                ],
                {
                  label: L("البطاقة", "Card"),
                  style: {
                    position: "absolute",
                    insetBottom: "-56px",
                    insetEnd: "48px",
                    maxWidth: "440px",
                    background: "background",
                    gap: 16,
                    alignItems: "start",
                    paddingTop: 40,
                    paddingBottom: 40,
                    paddingStart: 40,
                    paddingEnd: 40,
                  },
                  mobile: {
                    position: "relative",
                    insetBottom: "auto",
                    insetEnd: "auto",
                    maxWidth: "100%",
                    marginTop: -32,
                    marginStart: 14,
                    marginEnd: 14,
                    paddingTop: 24,
                    paddingBottom: 24,
                    paddingStart: 22,
                    paddingEnd: 22,
                  },
                },
              ),
            ],
            { label: L("الصورة والبطاقة", "Photo and card"), style: { position: "relative", marginBottom: 56 }, mobile: { marginBottom: 0 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

export const atelierNewsletter = defineDesign({
  id: "atelier-newsletter",
  version: 1,
  category: "newsletter",
  subcategory: "image",
  name: L("أتيليه: صورة ونموذج", "Atelier: photo split"),
  description: L("صورة بجانب نموذج الاشتراك في القائمة الخاصة.", "A photo beside the private-list sign-up form."),
  keywords: ["newsletter", "atelier", "subscribe", "نشرة", "اشتراك"],
  tree: (t) =>
    t.section({ label: L("القائمة الخاصة", "Private list"), ...SECTION }, [
      t.container(
        [
          t.grid(
            [
              photo(t, ATELIER_PHOTOS.foldedLinen, L("كتان مطوي وورد مجفف", "Folded linen and dried flowers"), "square", {
                style: { minHeight: 320 },
                mobile: { aspectRatio: "wide", minHeight: 200 },
              }),
              t.stack(
                [
                  eyebrow(t, L("القائمة الخاصة", "Private list")),
                  t.heading(L("أول نظرة على كل مجموعة جديدة", "First look at every new run"), "h2", { role: "title", style: { ...DISPLAY, fontSize: "display-sm" } }),
                  t.paragraph(
                    L("المشتركون يرون القطع الجديدة قبل الجميع بيومين، ويصلهم كل عرض أولًا.", "Members see new pieces two days early and hear about every offer first."),
                    { role: "subtitle", style: { color: "muted" } },
                  ),
                  t.storeForm({ formTemplate: "newsletter" }),
                  t.text(L("بدون رسائل مزعجة. تقدر تلغي في أي وقت.", "No spam. Unsubscribe any time."), { style: { color: "muted", fontSize: "xs" } }),
                ],
                {
                  label: L("النص", "Copy"),
                  style: { gap: 16, justifyContent: "center", paddingTop: 48, paddingBottom: 48, paddingStart: 48, paddingEnd: 48 },
                  mobile: { paddingTop: 28, paddingBottom: 28, paddingStart: 20, paddingEnd: 20 },
                },
              ),
            ],
            {
              label: L("البطاقة", "Card"),
              columns: { desktop: 2, mobile: 1 },
              style: { borderWidth: 1, borderColor: "border", background: "background", gap: 0, alignItems: "stretch", overflow: "hidden" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

export const ATELIER_HOME = [atelierHero, atelierCollections, atelierNewIn, atelierCampaign, atelierMostLoved, atelierHouse, atelierNewsletter] as const;
