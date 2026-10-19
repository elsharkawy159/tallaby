/**
 * Classic newsletter (library N-a, Classic template): a rounded brand panel
 * with the title and a line on the start side and the store's sign-up form on
 * the end side. The form is one of the store's own forms (picked in the form's settings).
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY } from "../_kit";

export const newsletterClassic = defineDesign({
  id: "newsletter-classic",
  version: 1,
  category: "newsletter",
  subcategory: "panel",
  name: L("نشرة كلاسيك", "Classic newsletter"),
  description: L("لوحة بلون المتجر فيها العنوان ونموذج الاشتراك.", "A brand-coloured panel with the title and the sign-up form."),
  keywords: ["newsletter", "subscribe", "email", "classic", "نشرة", "اشتراك", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("النشرة", "Newsletter") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.heading(L("خد ١٠٪ خصم على أول طلب", "Get 10% off your first order"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", ...ON_BRAND },
                  }),
                  t.paragraph(L("اشترك وأول ما يوصل جديد أو عرض للمشتركين هتعرف.", "Join the list for new arrivals and members-only offers."), {
                    role: "subtitle",
                    style: ON_BRAND_BODY,
                  }),
                ],
                { label: L("النص", "Copy"), style: { gap: 10 } },
              ),
              t.box([t.storeForm()], {
                label: L("النموذج", "Form box"),
                style: { background: "background", radius: 20, paddingTop: 20, paddingBottom: 20, paddingStart: 20, paddingEnd: 20 },
              }),
            ],
            {
              label: L("اللوحة", "Panel"),
              columns: { desktop: 2, mobile: 1 },
              style: {
                position: "relative",
                overflow: "hidden",
                gap: 32,
                alignItems: "center",
                background: "primary",
                radius: 28,
                paddingTop: 40,
                paddingBottom: 40,
                paddingStart: 40,
                paddingEnd: 40,
              },
              mobile: { paddingTop: 24, paddingBottom: 24, paddingStart: 20, paddingEnd: 20, gap: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
