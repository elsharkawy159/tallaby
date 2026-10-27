/**
 * Sign-up strip (Claude Design premium set, `newsletterStrip`; 2026-10-27):
 * one compact brand-coloured band, a round mail icon with the title and a
 * line at the start and the store's sign-up form at the end. Takes little
 * room, so it fits right above the footer. Stacks on phones.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY, iconTile } from "../_kit";

export const newsletterStrip = defineDesign({
  id: "newsletter-strip",
  version: 1,
  category: "newsletter",
  subcategory: "panel",
  name: L("شريط اشتراك", "Sign-up strip"),
  description: L("شريط بلون المتجر فيه العنوان في أوله ونموذج الاشتراك في آخره.", "A brand-coloured band with the title at the start and the sign-up form at the end."),
  keywords: ["newsletter", "subscribe", "strip", "band", "compact", "premium", "نشرة", "اشتراك", "شريط"],
  tree: (t) =>
    t.section(
      {
        label: L("شريط الاشتراك", "Sign-up strip"),
        style: { background: "primary", paddingTop: 48, paddingBottom: 48 },
        mobile: { paddingTop: 36, paddingBottom: 36 },
      },
      [
        t.container(
          [
            t.grid(
              [
                t.row(
                  [
                    iconTile(t, "mail", { background: "background", radius: 999 }),
                    t.stack(
                      [
                        t.heading(L("اعرف الجديد الأول", "Be the first to know"), "h2", {
                          role: "title",
                          style: { fontSize: "2xl", lineHeight: "tight", ...ON_BRAND },
                          mobile: { fontSize: "xl" },
                        }),
                        t.paragraph(L("المجموعات الجديدة والعروض الخاصة، مرة في الأسبوع.", "New drops and members-only offers, once a week."), {
                          role: "subtitle",
                          style: { fontSize: "sm", ...ON_BRAND_BODY },
                        }),
                      ],
                      { label: L("النص", "Copy"), style: { gap: 4 } },
                    ),
                  ],
                  { label: L("العنوان", "Heading"), role: "intro", style: { gap: 14, wrap: false, alignItems: "center" } },
                ),
                t.box([t.storeForm({ formTemplate: "newsletter" })], {
                  label: L("النموذج", "Form box"),
                  style: { background: "background", radius: 16, paddingTop: 20, paddingBottom: 20, paddingStart: 24, paddingEnd: 24 },
                  mobile: { paddingTop: 16, paddingBottom: 16, paddingStart: 16, paddingEnd: 16 },
                }),
              ],
              {
                label: L("الشريط", "Strip"),
                columns: { desktop: 2, tablet: 2, mobile: 1 },
                style: { gap: 32, alignItems: "center" },
                tablet: { gap: 24 },
                mobile: { gap: 16 },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
