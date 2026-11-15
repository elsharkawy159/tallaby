/**
 * Tallaby Classic inner pages: About, Contact, FAQ, Privacy and Terms.
 * Contact uses the store's contact form (created and bound with the
 * template); shipping, returns and orders link to the store's system pages,
 * which show its real delivery fees and policies.
 */
import type { ElementIconName } from "../../elements/registry";
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../../designs/builder";
import { L, N } from "../../designs/_kit";
import { perkGrid } from "./home";
import { CLASSIC_PHOTOS } from "./photos";
import { CARD, FLUSH, LINKS, SECTION, eyebrow, pill, sectionHead } from "./_shared";

/** Breadcrumb, page title and a short line, aligned to the start. */
function pageHeader(o: { id: string; title: DesignText; text?: DesignText }) {
  return defineDesign({
    id: o.id,
    version: 1,
    category: "page-header",
    subcategory: "simple",
    name: L("كلاسيك: رأس الصفحة", "Classic: page header"),
    description: L("مسار الصفحة وعنوانها وسطر قصير.", "The breadcrumb, the page title and a short line."),
    keywords: ["page header", "classic", "tallaby", "عنوان الصفحة"],
    tree: (b) =>
      b.section({ label: L("رأس الصفحة", "Page header"), style: { paddingTop: 24, paddingBottom: 0 } }, [
        b.container(
          [
            b.row(
              [
                b.link(LINKS.home, [b.text(L("الرئيسية", "Home"), { style: { fontSize: "sm" } })], {
                  label: L("الرئيسية", "Home"),
                  style: { ...FLUSH, color: "muted", hover: { color: "primary" } },
                }),
                b.text("/", { style: { fontSize: "sm", color: "muted" } }),
                b.text(o.title, { style: { fontSize: "sm", color: "muted" } }),
              ],
              { label: L("المسار", "Breadcrumb"), style: { gap: 6, alignItems: "center" } },
            ),
            b.heading(o.title, "h1", { role: "title", style: { fontSize: "display-md", fontWeight: "extrabold", lineHeight: "tight", marginTop: 10 } }),
            ...(o.text ? [b.paragraph(o.text, { role: "subtitle", style: { color: "muted", maxWidth: "640px", marginTop: 8 } })] : []),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ]),
  });
}

/** A rounded photo beside an eyebrow, a title, paragraphs and an optional button. */
function imageText(
  t: TreeBuilder,
  o: { image: string; alt: DesignText; eyebrow: DesignText; title: DesignText; paragraphs: DesignText[]; button?: { text: DesignText; href: string }; reverse?: boolean },
): NodeTemplate {
  const photo = t.image(o.image, o.alt, {
    role: "image",
    style: { aspectRatio: "landscape", objectFit: "cover", width: "100%", radius: 24, ...(o.reverse && { order: 2 }) },
    mobile: { order: 0 },
  });
  const copy = t.stack(
    [
      eyebrow(t, o.eyebrow),
      t.heading(o.title, "h2", { role: "title", style: { fontSize: "display-sm", fontWeight: "extrabold", lineHeight: "tight" } }),
      ...o.paragraphs.map((p, i) => t.paragraph(p, { ...(i === 0 && { role: "body" }), style: { color: "muted" } })),
      ...(o.button ? [pill(t, o.button.text, o.button.href, "solid", { style: { marginTop: 6 } })] : []),
    ],
    { label: L("النص", "Copy"), style: { gap: 12, alignItems: "start" } },
  );
  return t.grid([photo, copy], {
    label: L("التخطيط", "Layout"),
    columns: { desktop: 2, mobile: 1 },
    style: { gap: 56, alignItems: "center" },
    mobile: { gap: 22 },
  });
}

export const classicAboutHeader = pageHeader({
  id: "tallaby-about-header",
  title: L("من نحن", "About us"),
  text: L("فريق صغير يختار منتجات نشتريها نحن أنفسنا.", "A small team choosing products we would buy ourselves."),
});

export const classicAboutStory = defineDesign({
  id: "tallaby-about-story",
  version: 1,
  category: "image-text",
  subcategory: "story",
  name: L("كلاسيك: حكايتنا", "Classic: our story"),
  description: L("صورة بجانب حكاية المتجر في فقرتين.", "A photo beside the store's story in two paragraphs."),
  keywords: ["about", "story", "classic", "tallaby", "قصتنا", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("حكايتنا", "Our story"), style: { paddingTop: 32, paddingBottom: 0 } }, [
      t.container(
        [
          imageText(t, {
            image: CLASSIC_PHOTOS.parcelShelf,
            alt: L("طرود مغلّفة على رف خشب", "Wrapped parcels on a wooden shelf"),
            eyebrow: L("حكايتنا", "Our story"),
            title: L("بدأنا بسؤال واحد: هل سيدوم؟", "It started with one question: will it last?"),
            paragraphs: [
              L("نختار منتجات تتحمّل الاستخدام اليومي، ونعرض تفاصيل كل منتج بوضوح.", "We choose products made for everyday use and show every product's details clearly."),
              L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
            ],
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

const STATS: { value: DesignText; label: DesignText }[] = [
  { value: N("25K+"), label: L("طلب تم توصيله", "Orders delivered") },
  { value: N("27"), label: L("محافظة", "Governorates") },
  { value: N("4.8"), label: L("متوسط التقييم", "Average rating") },
  { value: N("14"), label: L("يومًا للاسترجاع", "Day returns") },
];

export const classicAboutStats = defineDesign({
  id: "tallaby-about-stats",
  version: 1,
  category: "statistics",
  subcategory: "counters",
  name: L("كلاسيك: بالأرقام", "Classic: by the numbers"),
  description: L("أربعة أرقام بالذهبي على مربعات داكنة.", "Four amber numbers on dark tiles."),
  keywords: ["stats", "numbers", "classic", "tallaby", "أرقام", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("بالأرقام", "By the numbers"), ...SECTION }, [
      t.container(
        [
          t.grid(
            STATS.map((s) =>
              t.stack(
                [
                  t.text(s.value, { style: { fontSize: "5xl", fontWeight: "extrabold", color: "accent", lineHeight: "tight" }, mobile: { fontSize: "4xl" } }),
                  t.text(s.label, { style: { color: "background", opacity: 85, fontSize: "sm" } }),
                ],
                {
                  label: L("رقم", "Stat"),
                  style: { background: "foreground", radius: 16, gap: 4, paddingTop: 22, paddingBottom: 22, paddingStart: 22, paddingEnd: 22 },
                },
              ),
            ),
            { label: L("الأرقام", "Stats"), role: "items", columns: { desktop: 4, mobile: 2 }, style: { gap: 20 }, mobile: { gap: 12 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

const VALUES: { icon: ElementIconName; title: DesignText; text: DesignText }[] = [
  { icon: "award", title: L("منتجات مختارة", "Picked products"), text: L("بمواصفات واضحة لكل منتج", "Clear specs for every product") },
  { icon: "tag", title: L("أسعار واضحة", "Clear prices"), text: L("السعر ظاهر على كل منتج", "The price is shown on every product") },
  { icon: "shield", title: L("تفاصيل دقيقة", "Accurate details"), text: L("صور ومواصفات لكل منتج", "Photos and specs for every product") },
  { icon: "chat", title: L("نصيحة بأمانة", "Honest advice"), text: L("اسألنا قبل أن تشتري", "Ask us before you buy") },
];

export const classicAboutValues = defineDesign({
  id: "tallaby-about-values",
  version: 1,
  category: "features",
  subcategory: "values",
  name: L("كلاسيك: اللي يهمنا", "Classic: what we care about"),
  description: L("عنوان وأربع قيم بأيقونات.", "A heading and four values with icons."),
  keywords: ["features", "values", "classic", "tallaby", "قيم", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("اللي يهمنا", "What we care about"), ...SECTION }, [
      t.container([sectionHead(t, { title: L("ما يهمنا", "What we care about") }), perkGrid(t, VALUES, L("القيم", "Values"))], {
        label: L("الحاوية", "Container"),
      }),
    ]),
});

export const classicAboutVisit = defineDesign({
  id: "tallaby-about-visit",
  version: 1,
  category: "image-text",
  subcategory: "story",
  name: L("كلاسيك: زورنا", "Classic: visit us"),
  description: L("صورة المحل على الجانب الآخر ونص وزر للتواصل.", "The shop photo on the other side, a line and a contact button."),
  keywords: ["about", "visit", "store", "classic", "tallaby", "زورنا", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("زورنا", "Visit us"), ...SECTION }, [
      t.container(
        [
          imageText(t, {
            image: CLASSIC_PHOTOS.shopFront,
            alt: L("واجهة محل صغير", "A small shop front"),
            eyebrow: L("زُرنا", "Visit us"),
            title: L("شاهد المنتجات بنفسك", "See the products yourself"),
            paragraphs: [L("تواصل معنا لمعرفة العنوان ومواعيد الزيارة.", "Contact us for the address and visiting hours.")],
            button: { text: L("اعرف العنوان", "Get directions"), href: LINKS.contact },
            reverse: true,
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

export const classicContactHeader = pageHeader({
  id: "tallaby-contact-header",
  title: L("تواصل معنا", "Contact us"),
  text: L("تواصل معنا لأي سؤال عن منتج أو طلب.", "Contact us with any question about a product or an order."),
});

const CONTACT_LINES: { icon: ElementIconName; label: DesignText; value: DesignText; href?: string }[] = [
  { icon: "chat", label: L("واتساب", "WhatsApp"), value: "+20 100 000 0000", href: "https://wa.me/201000000000" },
  { icon: "phone", label: L("اتصل بنا", "Call us"), value: "+20 100 000 0000", href: "tel:+201000000000" },
  { icon: "mail", label: L("البريد الإلكتروني", "Email"), value: "hello@example.com", href: "mailto:hello@example.com" },
  { icon: "clock", label: L("مواعيد العمل", "Working hours"), value: L("السبت إلى الخميس، ١٠ ص – ١٠ م", "Sat to Thu, 10am to 10pm") },
  { icon: "map-pin", label: L("العنوان", "Address"), value: L("١٢ شارع النيل، الزمالك، القاهرة", "12 Nile St, Zamalek, Cairo") },
];

function contactLine(t: TreeBuilder, line: (typeof CONTACT_LINES)[number]): NodeTemplate {
  const content = [
    t.box([t.icon(line.icon, { style: { fontSize: "xl", color: "primary" } })], {
      label: L("أيقونة", "Icon tile"),
      style: { background: "secondary", radius: 12, width: "44px", paddingTop: 10, paddingBottom: 8, textAlign: "center" },
    }),
    t.stack([t.text(line.label, { style: { color: "muted", fontSize: "xs" } }), t.text(line.value, { style: { fontWeight: "bold", fontSize: "sm" } })], {
      label: L("النص", "Copy"),
      style: { gap: 0 },
    }),
  ];
  const style = { ...CARD, gap: 14, alignItems: "center" as const, wrap: false, paddingTop: 14, paddingBottom: 14, paddingStart: 16, paddingEnd: 16 };
  if (!line.href) return t.row(content, { label: L("وسيلة تواصل", "Contact line"), style });
  return t.link(line.href, [t.row(content, { label: L("المحتوى", "Content"), style: { gap: 14, alignItems: "center", wrap: false } })], {
    label: L("وسيلة تواصل", "Contact line"),
    style: { ...CARD, color: "foreground", paddingTop: 14, paddingBottom: 14, paddingStart: 16, paddingEnd: 16, hover: { borderColor: "primary" } },
  });
}

export const classicContact = defineDesign({
  id: "tallaby-contact",
  version: 1,
  category: "contact",
  subcategory: "form",
  name: L("كلاسيك: النموذج والبيانات", "Classic: form and details"),
  description: L("نموذج التواصل في بطاقة، وبجانبه واتساب والهاتف والبريد والمواعيد والعنوان.", "The contact form in a card, beside WhatsApp, phone, email, hours and address."),
  keywords: ["contact", "form", "classic", "tallaby", "تواصل", "نموذج", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("التواصل", "Contact"), style: { paddingTop: 28, paddingBottom: 0 } }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [t.heading(L("أرسل لنا رسالة", "Send us a message"), "h2", { style: { fontSize: "2xl", fontWeight: "extrabold" } }), t.storeForm({ formTemplate: "contact" })],
                {
                  label: L("النموذج", "Form"),
                  style: { ...CARD, gap: 14, paddingTop: 24, paddingBottom: 24, paddingStart: 24, paddingEnd: 24 },
                  mobile: { paddingTop: 20, paddingBottom: 20, paddingStart: 16, paddingEnd: 16 },
                },
              ),
              t.stack(
                [
                  ...CONTACT_LINES.map((line) => contactLine(t, line)),
                  t.image(CLASSIC_PHOTOS.foldedMap, L("خريطة أو صورة المتجر", "Map or store photo"), {
                    role: "image",
                    style: { aspectRatio: "wide", objectFit: "cover", width: "100%", radius: 16 },
                  }),
                ],
                { label: L("البيانات", "Details"), style: { gap: 12 } },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 2, mobile: 1 }, style: { gap: 32, alignItems: "start" }, mobile: { gap: 20 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

export const classicFaqHeader = pageHeader({
  id: "tallaby-faq-header",
  title: L("الأسئلة الشائعة", "Frequently asked questions"),
  text: L("إجابات سريعة عن الطلبات والتوصيل والاسترجاع والدفع.", "Quick answers about orders, delivery, returns and payment."),
});

const FAQ_GROUPS: { title: DesignText; items: { title: DesignText; body: DesignText }[] }[] = [
  {
    title: L("الطلبات", "Orders"),
    items: [
      {
        title: L("كيف أعرف أن طلبي وصل؟", "How do I know my order went through?"),
        body: L("ستظهر لك صفحة تأكيد بعد إتمام الطلب.", "You see a confirmation page after you place your order."),
      },
      {
        title: L("هل يمكنني تعديل طلبي أو إلغاؤه؟", "Can I change or cancel my order?"),
        body: L("تواصل معنا قبل شحن الطلب لتعديله أو إلغائه.", "Contact us before your order ships to change or cancel it."),
      },
    ],
  },
  {
    title: L("التوصيل", "Delivery"),
    items: [
      {
        title: L("كم تستغرق مدة التوصيل؟", "How long does delivery take?"),
        body: L("تظهر تكلفة الشحن ومدته عند إتمام الطلب.", "Shipping cost and time are shown at checkout."),
      },
      {
        title: L("كيف أتابع طلبي؟", "How do I track my order?"),
        body: L("من صفحة طلباتي بعد تسجيل الدخول، أو من الرابط في رسالة التأكيد.", "From My orders after you sign in, or from the link in your confirmation message."),
      },
    ],
  },
  {
    title: L("الاسترجاع والدفع", "Returns and payment"),
    items: [
      {
        title: L("ما سياسة الاسترجاع؟", "What is your return policy?"),
        body: L("راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.", "See the exchange and return policy page."),
      },
      {
        title: L("ما طرق الدفع المتاحة؟", "Which payment methods do you accept?"),
        body: L("تظهر طرق الدفع المتاحة في صفحة الدفع.", "Available payment methods are shown at checkout."),
      },
    ],
  },
];

export const classicFaq = defineDesign({
  id: "tallaby-faq",
  version: 1,
  category: "faq",
  subcategory: "accordion",
  name: L("كلاسيك: الأسئلة بالمجموعات", "Classic: grouped questions"),
  description: L("أسئلة مقسمة مجموعات، وكارت مساعدة فيه واتساب والتواصل.", "Questions in groups, then a help card with WhatsApp and contact."),
  keywords: ["faq", "questions", "classic", "tallaby", "أسئلة", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("الأسئلة", "Questions"), style: { paddingTop: 28, paddingBottom: 0 } }, [
      t.container(
        [
          t.stack(
            [
              ...FAQ_GROUPS.map((group) =>
                t.stack(
                  [
                    t.heading(group.title, "h2", { style: { fontSize: "xl", fontWeight: "bold" } }),
                    t.accordion(group.items, { label: L("الأسئلة", "Questions"), role: "items", style: { gap: 0 } }),
                  ],
                  { label: L("مجموعة", "Group"), style: { gap: 4 } },
                ),
              ),
              t.row(
                [
                  t.stack(
                    [
                      t.heading(L("هل لديك سؤال آخر؟", "Still have a question?"), "h3", { style: { fontSize: "lg", fontWeight: "bold" } }),
                      t.paragraph(L("أرسل لنا رسالة وسنرد عليك.", "Message us and we will reply."), { style: { color: "muted" } }),
                    ],
                    { label: L("النص", "Copy"), style: { gap: 4 } },
                  ),
                  t.row(
                    [
                      pill(t, L("واتساب", "WhatsApp"), "https://wa.me/201000000000", "solid"),
                      pill(t, L("تواصل معنا", "Contact us"), LINKS.contact, "outline", { role: "secondaryCta" }),
                    ],
                    { label: L("الأزرار", "Buttons"), style: { gap: 8 } },
                  ),
                ],
                {
                  label: L("كارت المساعدة", "Help card"),
                  style: { background: "secondary", radius: 16, justifyContent: "between", alignItems: "center", gap: 16, paddingTop: 24, paddingBottom: 24, paddingStart: 24, paddingEnd: 24 },
                },
              ),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 36, maxWidth: "820px" }, mobile: { gap: 28 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

/** A policy page body: "last updated", then headings and paragraphs in a readable column. */
function policy(o: { id: string; name: ReturnType<typeof L>; blocks: { h: DesignText; p: DesignText }[] }) {
  return defineDesign({
    id: o.id,
    version: 1,
    category: "rich-text",
    subcategory: "policy",
    name: o.name,
    description: L("نص السياسة بعناوين وفقرات.", "The policy text in headings and paragraphs."),
    keywords: ["policy", "text", "classic", "tallaby", "سياسة", "كلاسيك"],
    tree: (t) =>
      t.section({ label: L("النص", "Text"), style: { paddingTop: 28, paddingBottom: 0 } }, [
        t.container(
          [
            t.stack(
              [
                t.text(L("آخر تحديث: ١ سبتمبر ٢٠٢٦", "Last updated: 1 September 2026"), { style: { color: "muted", fontSize: "sm" } }),
                ...o.blocks.flatMap((b) => [
                  t.heading(b.h, "h2", { style: { fontSize: "2xl", fontWeight: "bold", marginTop: 18 } }),
                  t.paragraph(b.p, { style: { color: "foreground", opacity: 88 } }),
                ]),
              ],
              { label: L("المقال", "Article"), style: { gap: 10, maxWidth: "720px" } },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ]),
  });
}

export const classicPrivacyHeader = pageHeader({ id: "tallaby-privacy-header", title: L("سياسة الخصوصية", "Privacy Policy") });

export const classicPrivacy = policy({
  id: "tallaby-privacy",
  name: L("كلاسيك: سياسة الخصوصية", "Classic: privacy policy"),
  blocks: [
    { h: L("ما البيانات التي نجمعها", "What we collect"), p: L("اسمك ورقم هاتفك وبريدك الإلكتروني وعنوانك لتوصيل طلبك.", "Your name, phone, email and address so we can deliver your order.") },
    {
      h: L("كيف نستخدمها", "How we use it"),
      p: L("فقط لتنفيذ الطلبات ومساعدتك، ولإرسال العروض إذا وافقت.", "Only to process orders, provide support and, if you agree, send offers."),
    },
    {
      h: L("الدفع", "Payments"),
      p: L("يتعامل شريك الدفع مع بيانات البطاقة، ولا نطّلع عليها أو نحفظها.", "Card details are handled by our payment partner. We never see or store them."),
    },
    { h: L("اختياراتك", "Your choices"), p: L("يمكنك أن تطلب منا في أي وقت تعديل بياناتك أو حذفها.", "Ask us anytime to update or delete your data.") },
  ],
});

export const classicTermsHeader = pageHeader({ id: "tallaby-terms-header", title: L("الشروط والأحكام", "Terms & Conditions") });

export const classicTerms = policy({
  id: "tallaby-terms",
  name: L("كلاسيك: الشروط والأحكام", "Classic: terms"),
  blocks: [
    {
      h: L("استخدام المتجر", "Using this store"),
      p: L("بإتمام الطلب فإنك توافق على هذه الشروط. يُرجى قراءتها قبل الشراء.", "By placing an order you agree to these terms. Please read them before you buy."),
    },
    {
      h: L("الأسعار والتوفر", "Prices and availability"),
      p: L("قد تتغير الأسعار. إذا نفد منتج بعد طلبك فسنتواصل معك ونرد أي مبلغ دفعته.", "Prices may change. If an item sells out after you order, we contact you and refund any payment."),
    },
    {
      h: L("الطلبات", "Orders"),
      p: L("قد نؤكد الطلب بمكالمة أو رسالة، وقد نلغي الطلبات التي يتعذر تأكيدها.", "We may confirm orders by phone or message, and may cancel orders that cannot be confirmed."),
    },
    {
      h: L("الشحن والاسترجاع", "Shipping and returns"),
      p: L("مصاريف ومدة التوصيل وشروط الاسترجاع موجودة في صفحتي الشحن والاسترجاع.", "Delivery fees, delivery times and return terms are on the shipping and returns pages."),
    },
  ],
});
