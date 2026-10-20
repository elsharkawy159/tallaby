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
  text: L("فريق صغير بيختار منتجات إحنا نفسنا نشتريها.", "A small team choosing products we would buy ourselves."),
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
            title: L("بدأنا بسؤال واحد: هيعيش ولا لأ؟", "It started with one question: will it last?"),
            paragraphs: [
              L(
                "بدأنا لأننا تعبنا من منتجات شكلها حلو وبتبوظ بسرعة. كل حاجة بنبيعها بنجربها إحنا الأول.",
                "We started because we were tired of things that look good and break fast. We try everything we sell ourselves first.",
              ),
              L("النهارده بنشحن لكل المحافظات وبنرد على كل رسالة بنفسنا.", "Today we ship to every governorate and answer every message ourselves."),
            ],
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

const STATS: { value: DesignText; label: DesignText }[] = [
  { value: N("25K+"), label: L("طلب اتسلّم", "Orders delivered") },
  { value: N("27"), label: L("محافظة", "Governorates") },
  { value: N("4.8"), label: L("متوسط التقييم", "Average rating") },
  { value: N("14"), label: L("يوم استرجاع", "Day returns") },
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
  { icon: "award", title: L("منتجات أصلية", "Original products"), text: L("من الموزعين الرسميين", "From official distributors") },
  { icon: "tag", title: L("أسعار عادلة", "Fair prices"), text: L("من غير خصومات وهمية", "No fake discounts") },
  { icon: "shield", title: L("ضمان حقيقي", "Real warranty"), text: L("إحنا بنخلّص الضمان بدالك", "We handle claims for you") },
  { icon: "chat", title: L("نصيحة بأمانة", "Honest advice"), text: L("اسألنا قبل ما تشتري", "Ask us before you buy") },
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
      t.container([sectionHead(t, { title: L("اللي يهمنا", "What we care about") }), perkGrid(t, VALUES, L("القيم", "Values"))], {
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
            eyebrow: L("زورنا", "Visit us"),
            title: L("جرّب قبل ما تشتري", "Try before you buy"),
            paragraphs: [L("المعرض مفتوح كل يوم ماعدا الجمعة. تعالى شوف المنتجات بنفسك.", "Our showroom is open every day except Friday. Come and see the products yourself.")],
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
  text: L("بنرد على واتساب خلال ساعة في مواعيد العمل.", "We reply on WhatsApp within an hour during working hours."),
});

const CONTACT_LINES: { icon: ElementIconName; label: DesignText; value: DesignText; href?: string }[] = [
  { icon: "chat", label: L("واتساب", "WhatsApp"), value: "+20 100 000 0000", href: "https://wa.me/201000000000" },
  { icon: "phone", label: L("اتصل بينا", "Call us"), value: "+20 100 000 0000", href: "tel:+201000000000" },
  { icon: "mail", label: L("البريد الإلكتروني", "Email"), value: "hello@example.com", href: "mailto:hello@example.com" },
  { icon: "clock", label: L("مواعيد العمل", "Working hours"), value: L("السبت للخميس، ١٠ ص لـ ١٠ م", "Sat to Thu, 10am to 10pm") },
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
  description: L("نموذج التواصل في كارت، وبجانبه واتساب والتليفون والبريد والمواعيد والعنوان.", "The contact form in a card, beside WhatsApp, phone, email, hours and address."),
  keywords: ["contact", "form", "classic", "tallaby", "تواصل", "نموذج", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("التواصل", "Contact"), style: { paddingTop: 28, paddingBottom: 0 } }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [t.heading(L("ابعتلنا رسالة", "Send us a message"), "h2", { style: { fontSize: "2xl", fontWeight: "extrabold" } }), t.storeForm({ formTemplate: "contact" })],
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
        title: L("أعرف إزاي إن طلبي وصل؟", "How do I know my order went through?"),
        body: L("هتشوف صفحة تأكيد وتوصلك رسالة. وبنكلمك نأكد الطلبات الكاش.", "You see a confirmation page and get a message. We also call to confirm cash orders."),
      },
      {
        title: L("أقدر أعدّل أو ألغي طلبي؟", "Can I change or cancel my order?"),
        body: L("أيوه، لحد ما يتشحن. ألغيه من صفحة الطلب أو كلمنا.", "Yes, until it ships. Cancel from your order page or message us."),
      },
    ],
  },
  {
    title: L("التوصيل", "Delivery"),
    items: [
      {
        title: L("التوصيل بياخد قد إيه؟", "How long does delivery take?"),
        body: L("القاهرة والجيزة من يوم ليومين، وباقي المحافظات من ٢ لـ ٦ أيام.", "Cairo and Giza in 1 to 2 days, other governorates in 2 to 6 days."),
      },
      {
        title: L("أتابع طلبي إزاي؟", "How do I track my order?"),
        body: L("من صفحة طلباتي بعد تسجيل الدخول، أو من الرابط في رسالة التأكيد.", "From My orders after you sign in, or from the link in your confirmation message."),
      },
    ],
  },
  {
    title: L("الاسترجاع والدفع", "Returns and payment"),
    items: [
      {
        title: L("سياسة الاسترجاع إيه؟", "What is your return policy?"),
        body: L("تقدر ترجع أي منتج مش مستخدم خلال ١٤ يوم في علبته الأصلية.", "Return any unused item within 14 days in its original box."),
      },
      {
        title: L("بتقبلوا إيه في الدفع؟", "Which payment methods do you accept?"),
        body: L("الدفع عند الاستلام والكارت والمحافظ الإلكترونية، حسب اللي يظهر في صفحة الدفع.", "Cash on delivery, card and mobile wallets, as shown at checkout."),
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
                      t.heading(L("لسه عندك سؤال؟", "Still have a question?"), "h3", { style: { fontSize: "lg", fontWeight: "bold" } }),
                      t.paragraph(L("ابعتلنا وهيرد عليك شخص حقيقي.", "Message us and a real person will reply."), { style: { color: "muted" } }),
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
    { h: L("بنجمع إيه", "What we collect"), p: L("اسمك وموبايلك وإيميلك وعنوانك عشان نوصلك الطلب.", "Your name, phone, email and address so we can deliver your order.") },
    {
      h: L("بنستخدمها إزاي", "How we use it"),
      p: L("بس عشان ننفذ الطلبات ونساعدك، ولو وافقت نبعتلك عروض.", "Only to process orders, provide support and, if you agree, send offers."),
    },
    {
      h: L("الدفع", "Payments"),
      p: L("بيانات الكارت بيتعامل معاها شريك الدفع. إحنا عمرنا ما بنشوفها أو نحفظها.", "Card details are handled by our payment partner. We never see or store them."),
    },
    { h: L("اختياراتك", "Your choices"), p: L("تقدر تطلب مننا في أي وقت نعدّل أو نمسح بياناتك.", "Ask us anytime to update or delete your data.") },
  ],
});

export const classicTermsHeader = pageHeader({ id: "tallaby-terms-header", title: L("الشروط والأحكام", "Terms & Conditions") });

export const classicTerms = policy({
  id: "tallaby-terms",
  name: L("كلاسيك: الشروط والأحكام", "Classic: terms"),
  blocks: [
    {
      h: L("استخدام المتجر", "Using this store"),
      p: L("لما تعمل طلب يبقى انت موافق على الشروط دي. من فضلك اقراها قبل الشراء.", "By placing an order you agree to these terms. Please read them before you buy."),
    },
    {
      h: L("الأسعار والتوفر", "Prices and availability"),
      p: L(
        "الأسعار ممكن تتغير. لو منتج خلص بعد طلبك هنكلمك ونرجعلك أي مبلغ دفعته.",
        "Prices may change. If an item sells out after you order, we contact you and refund any payment.",
      ),
    },
    {
      h: L("الطلبات", "Orders"),
      p: L("بنأكد كل طلب بمكالمة أو رسالة. ممكن نلغي الطلبات اللي مانقدرش نأكدها.", "We confirm every order by phone or message. We may cancel orders that cannot be confirmed."),
    },
    {
      h: L("الشحن والاسترجاع", "Shipping and returns"),
      p: L("مصاريف ومدة التوصيل وشروط الاسترجاع موجودة في صفحتي الشحن والاسترجاع.", "Delivery fees, delivery times and return terms are on the shipping and returns pages."),
    },
  ],
});
