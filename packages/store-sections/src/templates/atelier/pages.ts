/**
 * Atelier inner pages: The house (about), Contact and FAQ. Contact uses the
 * store's contact form (created and bound by "Use template"); orders,
 * shipping and returns link to the store's own system pages.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../../designs/builder";
import { L, N } from "../../designs/_kit";
import { ATELIER_PHOTOS } from "./photos";
import { DISPLAY, LINKS, SECTION, button, eyebrow, photo, textArrow } from "./_shared";

/** A centred page title on the shelf colour. */
function pageHeader(o: { id: string; label: DesignText; title: DesignText; text: DesignText }) {
  return defineDesign({
    id: o.id,
    version: 1,
    category: "page-header",
    subcategory: "simple",
    name: L("أتيليه: رأس صفحة", "Atelier: page header"),
    description: L("عنوان الصفحة في المنتصف مع سطر قصير.", "The page title centred with a short line."),
    keywords: ["page header", "atelier", "عنوان الصفحة"],
    tree: (b) =>
      b.section({ label: L("رأس الصفحة", "Page header"), style: { paddingTop: 88, paddingBottom: 72, background: "secondary" }, mobile: { paddingTop: 52, paddingBottom: 44 } }, [
        b.container(
          [
            b.stack(
              [
                eyebrow(b, o.label, { style: { justifyContent: "center" } }),
                b.heading(o.title, "h1", { role: "title", style: { ...DISPLAY, fontSize: "display-lg", textAlign: "center" } }),
                b.paragraph(o.text, { role: "subtitle", style: { color: "muted", textAlign: "center", maxWidth: "560px", fontSize: "lg" } }),
              ],
              { label: L("العنوان", "Heading"), style: { gap: 16, alignItems: "center" } },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ]),
  });
}

export const atelierAboutHeader = pageHeader({
  id: "atelier-about-header",
  label: L("منذ ٢٠١٤", "Since 2014"),
  title: L("عن الدار", "The house"),
  text: L("دار أزياء صغيرة تصنع ملابس هادئة من خامات طبيعية.", "A small fashion house making quiet clothes in natural fabrics."),
});

export const atelierAboutStory = defineDesign({
  id: "atelier-about-story",
  version: 1,
  category: "image-text",
  subcategory: "story",
  name: L("أتيليه: صورة ونص", "Atelier: photo and story"),
  description: L("صورة الورشة بجانب حكاية الدار في فقرتين.", "A workshop photo beside the house's story in two paragraphs."),
  keywords: ["about", "atelier", "story", "قصتنا"],
  tree: (t) =>
    t.section({ label: L("حكايتنا", "Our story"), ...SECTION }, [
      t.container(
        [
          t.grid(
            [
              photo(t, ATELIER_PHOTOS.tapeMeasure, L("شريط القياس والدبابيس على الطاولة", "Tape measures and pins on the table"), "portrait", {
                mobile: { aspectRatio: "landscape" },
              }),
              t.stack(
                [
                  eyebrow(t, L("حكايتنا", "Our story")),
                  t.heading(L("قطع أقل، مصنوعة كما يجب", "Fewer pieces, made properly"), "h2", { role: "title", style: { ...DISPLAY, fontSize: "display-md" } }),
                  t.paragraph(
                    L(
                      "نصمم مجموعتين في السنة ونفصّل كل قطعة بكميات لا تتجاوز خمسين، فلا تتكدس بضاعة ولا يضيع قماش.",
                      "We design two collections a year and cut each piece in runs of fifty or fewer, so nothing piles up and no fabric is wasted.",
                    ),
                    { role: "body", style: { color: "muted", fontSize: "lg" } },
                  ),
                  t.paragraph(
                    L(
                      "خاماتنا مصرية أو من مصانع نزورها بأنفسنا، ونغسل كل لفة كتان مرتين قبل القص حتى لا تنكمش عندك.",
                      "Our fabrics are Egyptian or from mills we visit ourselves, and every bolt of linen is washed twice before cutting so it never shrinks on you.",
                    ),
                    { style: { color: "muted" } },
                  ),
                  button(t, L("تسوّق المجموعة", "Shop the collection"), LINKS.shop),
                ],
                { label: L("النص", "Copy"), style: { gap: 18, alignItems: "start", justifyContent: "center" } },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 2, mobile: 1 }, style: { gap: 64, alignItems: "center" }, mobile: { gap: 28 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

const STATS: { value: DesignText; label: DesignText }[] = [
  { value: N("2014"), label: L("سنة التأسيس", "Founded") },
  { value: N("8"), label: L("خيّاطين في الورشة", "Tailors in the workshop") },
  { value: N("50"), label: L("قطعة بحد أقصى لكل تشغيلة", "Pieces per run, at most") },
  { value: N("14"), label: L("يوم للاستبدال", "Days to exchange") },
];

export const atelierAboutStats = defineDesign({
  id: "atelier-about-stats",
  version: 1,
  category: "statistics",
  subcategory: "counters",
  name: L("أتيليه: أرقام بخط رفيع", "Atelier: ruled numbers"),
  description: L("أربعة أرقام بخط كلاسيكي بين خطوط رفيعة.", "Four serif numbers between hairlines."),
  keywords: ["stats", "atelier", "numbers", "أرقام"],
  tree: (t) =>
    t.section({ label: L("بالأرقام", "By the numbers"), style: { paddingTop: 0, paddingBottom: 96 }, mobile: { paddingTop: 0, paddingBottom: 56 } }, [
      t.container(
        [
          t.grid(
            STATS.map((s) =>
              t.stack(
                [
                  t.text(s.value, { style: { ...DISPLAY, fontSize: "5xl" }, mobile: { fontSize: "4xl" } }),
                  t.text(s.label, { style: { color: "muted", fontSize: "sm" } }),
                ],
                { label: L("رقم", "Stat"), style: { gap: 6, paddingTop: 28, paddingBottom: 28, background: "background" } },
              ),
            ),
            {
              label: L("الأرقام", "Stats"),
              role: "items",
              columns: { desktop: 4, mobile: 2 },
              style: { gap: 32, borderWidth: 0 },
              mobile: { gap: 16 },
            },
          ),
          t.divider({ style: { marginTop: 0, marginBottom: 0 } }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

const VALUES: { title: DesignText; text: DesignText }[] = [
  { title: L("الخامة أولًا", "Fabric first"), text: L("كتان وقطن وصوف وحرير. لا خلطات صناعية إلا حيث تلزم.", "Linen, cotton, wool and silk. No synthetic blends unless a piece needs one.") },
  { title: L("قصّة تدوم", "Cuts that last"), text: L("خطوط بسيطة تتناسق مع ما في خزانتك، موسمًا بعد موسم.", "Simple lines that sit with what you own, season after season.") },
  { title: L("تشطيب يدوي", "Finished by hand"), text: L("كل زر وكل حاشية تُشطّب في الورشة قبل التغليف.", "Every button and hem is finished in the workshop before packing.") },
];

function valueCell(t: TreeBuilder, v: { title: DesignText; text: DesignText }, i: number): NodeTemplate {
  return t.stack(
    [
      t.text(N(String(i + 1).padStart(2, "0")), { style: { color: "accent", fontSize: "sm", letterSpacing: "wider" } }),
      t.heading(v.title, "h3", { style: { ...DISPLAY, fontSize: "2xl" } }),
      t.paragraph(v.text, { style: { color: "muted" } }),
    ],
    { label: L("قيمة", "Value"), style: { gap: 10, paddingTop: 28, borderWidth: 0 } },
  );
}

export const atelierAboutValues = defineDesign({
  id: "atelier-about-values",
  version: 1,
  category: "features",
  subcategory: "values",
  name: L("أتيليه: ثلاث قيم", "Atelier: three values"),
  description: L("ثلاث قيم مرقمة للدار.", "Three numbered values of the house."),
  keywords: ["features", "atelier", "values", "قيم"],
  tree: (t) =>
    t.section({ label: L("ما نؤمن به", "What we believe"), ...SECTION, style: { ...SECTION.style, background: "secondary" } }, [
      t.container(
        [
          t.stack(
            [
              eyebrow(t, L("ما نؤمن به", "What we believe"), { style: { justifyContent: "center" } }),
              t.heading(L("ثلاثة أشياء لا نتنازل عنها", "Three things we never cut"), "h2", { role: "title", style: { ...DISPLAY, fontSize: "display-md", textAlign: "center" } }),
            ],
            { label: L("العنوان", "Heading"), style: { gap: 14, alignItems: "center", marginBottom: 40 }, mobile: { marginBottom: 24 } },
          ),
          t.grid(
            VALUES.map((v, i) => valueCell(t, v, i)),
            { label: L("القيم", "Values"), role: "items", columns: { desktop: 3, mobile: 1 }, style: { gap: 40 }, mobile: { gap: 8 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

export const atelierContactHeader = pageHeader({
  id: "atelier-contact-header",
  label: L("تواصل", "Contact"),
  title: L("يسعدنا أن نسمع منك", "We would love to hear from you"),
  text: L("عن مقاس أو طلب أو قطعة تبحث عنها، نرد خلال يوم عمل.", "About a size, an order or a piece you are looking for, we reply within one working day."),
});

const CONTACT_LINES: { icon: "map-pin" | "clock" | "phone" | "mail"; title: DesignText; text: DesignText }[] = [
  { icon: "map-pin", title: L("الورشة", "The workshop"), text: L("٢٦ شارع البرازيل، الزمالك، القاهرة", "26 Brazil St, Zamalek, Cairo") },
  { icon: "clock", title: L("المواعيد", "Hours"), text: L("السبت إلى الخميس، ١١ ص حتى ٩ م", "Saturday to Thursday, 11am to 9pm") },
  { icon: "phone", title: L("الهاتف وواتساب", "Phone and WhatsApp"), text: "0100-123-4567" },
  { icon: "mail", title: L("البريد", "Email"), text: "hello@example.com" },
];

export const atelierContact = defineDesign({
  id: "atelier-contact",
  version: 1,
  category: "contact",
  subcategory: "form",
  name: L("أتيليه: التواصل والنموذج", "Atelier: details and form"),
  description: L("بيانات التواصل بجانب نموذج التواصل.", "Contact details beside the contact form."),
  keywords: ["contact", "atelier", "form", "تواصل", "نموذج"],
  tree: (t) =>
    t.section({ label: L("التواصل", "Contact"), ...SECTION }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.heading(L("زورونا أو راسلونا", "Visit or write to us"), "h2", { role: "title", style: { ...DISPLAY, fontSize: "display-sm" } }),
                  ...CONTACT_LINES.map((line) =>
                    t.row(
                      [
                        t.icon(line.icon, { style: { fontSize: "lg", color: "accent" } }),
                        t.stack(
                          [
                            t.text(line.title, { style: { fontSize: "xs", letterSpacing: "wider", textTransform: "uppercase", color: "muted" } }),
                            t.text(line.text, { style: { fontSize: "md" } }),
                          ],
                          { label: L("السطر", "Line"), style: { gap: 2 } },
                        ),
                      ],
                      { label: L("وسيلة تواصل", "Contact line"), style: { gap: 14, alignItems: "start", wrap: false, paddingTop: 16, paddingBottom: 16 } },
                    ),
                  ),
                  textArrow(t, L("تتبّع طلباتك", "Track your orders"), LINKS.orders, { style: { marginTop: 8 } }),
                ],
                { label: L("البيانات", "Details"), style: { gap: 4 } },
              ),
              t.stack([t.storeForm({ formTemplate: "contact" })], {
                label: L("النموذج", "Form"),
                style: { borderWidth: 1, borderColor: "border", background: "background", paddingTop: 40, paddingBottom: 40, paddingStart: 40, paddingEnd: 40 },
                mobile: { paddingTop: 24, paddingBottom: 24, paddingStart: 18, paddingEnd: 18 },
              }),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 2, mobile: 1 }, style: { gap: 64, alignItems: "start" }, mobile: { gap: 32 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});

export const atelierFaqHeader = pageHeader({
  id: "atelier-faq-header",
  label: L("المساعدة", "Help"),
  title: L("الأسئلة الشائعة", "Questions, answered"),
  text: L("المقاسات والتوصيل والاستبدال والعناية بالقطع.", "Sizing, delivery, exchanges and caring for your pieces."),
});

const FAQ: { title: DesignText; body: DesignText }[] = [
  {
    title: L("كيف أختار مقاسي؟", "How do I pick my size?"),
    body: L("في صفحة كل قطعة جدول مقاسات بالسنتيمتر. لو بين مقاسين، اختر الأكبر أو راسلنا وسنساعدك.", "Each piece has a size chart in centimetres on its page. Between two sizes, take the larger or message us and we will help."),
  },
  {
    title: L("كم يستغرق التوصيل؟", "How long does delivery take?"),
    body: L("من يومين إلى خمسة أيام عمل حسب المحافظة. تصلك رسالة برقم التتبع عند الشحن.", "Two to five working days depending on your governorate. You get a tracking message when it ships."),
  },
  {
    title: L("هل يمكنني الاستبدال أو الاسترجاع؟", "Can I exchange or return a piece?"),
    body: L("نعم، خلال ١٤ يومًا من الاستلام إذا كانت القطعة بحالتها وبالبطاقة. التفاصيل في صفحة الاسترجاع.", "Yes, within 14 days of delivery if the piece is unworn with its tag. Details are on the returns page."),
  },
  {
    title: L("ما طرق الدفع المتاحة؟", "How can I pay?"),
    body: L("الدفع عند الاستلام أو بالبطاقة أو المحفظة، حسب ما يظهر لك في صفحة الدفع.", "Cash on delivery, card or wallet, as shown at checkout."),
  },
  {
    title: L("كيف أعتني بالكتان والصوف؟", "How do I care for linen and wool?"),
    body: L("اغسل الكتان على ٣٠ درجة وجففه في الظل. الصوف تنظيف جاف أو غسيل يدوي بماء بارد.", "Wash linen at 30°C and dry it in the shade. Wool: dry clean, or hand wash in cold water."),
  },
  {
    title: L("أين أتابع طلبي؟", "Where do I follow my order?"),
    body: L("من صفحة طلباتي بعد تسجيل الدخول، أو من الرابط في رسالة تأكيد الطلب.", "From My orders after you sign in, or from the link in your order confirmation."),
  },
];

export const atelierFaq = defineDesign({
  id: "atelier-faq",
  version: 1,
  category: "faq",
  subcategory: "accordion",
  name: L("أتيليه: أسئلة وأجوبة", "Atelier: questions"),
  description: L("قائمة أسئلة قابلة للفتح، وتحتها رابط للتواصل.", "An accordion of questions with a contact link under it."),
  keywords: ["faq", "atelier", "questions", "أسئلة"],
  tree: (t) =>
    t.section({ label: L("الأسئلة", "Questions"), ...SECTION }, [
      t.container(
        [
          t.box(
            [
              t.accordion(
                FAQ.map((q, i) => ({ ...q, open: i === 0 })),
                { label: L("الأسئلة", "Questions"), role: "items", style: { gap: 0 } },
              ),
              t.row(
                [
                  t.text(L("لم تجد إجابتك؟", "Didn't find your answer?"), { style: { ...DISPLAY, fontSize: "xl" } }),
                  textArrow(t, L("تواصل معنا", "Contact us"), LINKS.contact),
                ],
                { label: L("التواصل", "Contact"), style: { gap: 20, justifyContent: "between", alignItems: "center", marginTop: 40 }, mobile: { direction: "column", alignItems: "start", gap: 12 } },
              ),
            ],
            { label: L("المحتوى", "Content"), style: { maxWidth: "760px", marginStart: 0 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
