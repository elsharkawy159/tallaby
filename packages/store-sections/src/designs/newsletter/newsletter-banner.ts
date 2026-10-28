/**
 * Sign-up over a photo (Claude Design premium set, `newsletterBanner`;
 * 2026-10-27): a lifestyle photo inside the store container with a solid
 * paper card centred on it holding an eyebrow, the title, a line, the store's sign-up
 * form and a no-spam note. The card keeps its own background so it reads on
 * any photo. Wide and tall enough on desktop for clear photo above and below
 * the card; on phones the photo becomes a short strip with the card under it,
 * so the card never hides the photo.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const FILL = { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px" } as const;

export const newsletterBanner = defineDesign({
  id: "newsletter-banner",
  version: 2,
  category: "newsletter",
  subcategory: "image",
  name: L("اشتراك فوق صورة", "Sign-up over a photo"),
  description: L(
    "صورة كبيرة وفي نصها كارت اشتراك بخلفية ثابتة.",
    "A large photo with a solid sign-up card in the middle.",
  ),
  keywords: ["newsletter", "subscribe", "photo", "full width", "premium", "نشرة", "اشتراك", "صورة"],
  tree: (t) =>
    t.section({ label: L("النشرة", "Newsletter") }, [
      t.container(
        [
          t.box(
            [
              t.photo(4, L("صورة من المتجر", "A photo from the store"), {
                role: "image",
                style: { aspectRatio: "banner", objectFit: "cover", width: "100%", minHeight: 640 },
                tablet: { aspectRatio: "landscape", minHeight: 600 },
                mobile: { aspectRatio: "landscape", minHeight: 0 },
              }),
              t.stack(
                [
                  t.container(
                    [
                      t.stack(
                        [
                          t.stack(
                            [
                              t.text(L("خليك قريب", "Stay in the loop"), { role: "eyebrow", style: { color: "primary", fontWeight: "semibold", fontSize: "sm", textAlign: "center" } }),
                              t.heading(L("اعرف المجموعة الجديدة قبل الكل", "Get the new drop first"), "h2", {
                                role: "title",
                                style: { fontSize: "3xl", lineHeight: "tight", textAlign: "center" },
                                mobile: { fontSize: "2xl" },
                              }),
                              t.paragraph(L("إيميل واحد في الأسبوع فيه القطع الجديدة والعروض الخاصة.", "One email a week with new pieces and members-only offers."), {
                                role: "subtitle",
                                style: { textAlign: "center" },
                              }),
                              t.storeForm({ formTemplate: "newsletter", style: { width: "100%" } }),
                              t.text(L("من غير رسائل مزعجة، وتقدر تلغي في أي وقت.", "No spam. Unsubscribe any time."), {
                                style: { color: "muted", fontSize: "xs", textAlign: "center" },
                              }),
                            ],
                            {
                              label: L("الكارت", "Card"),
                              style: {
                                background: "background",
                                radius: 20,
                                shadow: "md",
                                gap: 12,
                                alignItems: "center",
                                width: "100%",
                                maxWidth: "520px",
                                paddingTop: 36,
                                paddingBottom: 32,
                                paddingStart: 32,
                                paddingEnd: 32,
                              },
                              mobile: { paddingTop: 28, paddingBottom: 24, paddingStart: 20, paddingEnd: 20, shadow: "sm" },
                            },
                          ),
                        ],
                        { label: L("المحاذاة", "Alignment"), style: { alignItems: "center" } },
                      ),
                    ],
                    { label: L("الحاوية", "Container") },
                  ),
                ],
                {
                  label: L("الطبقة", "Overlay"),
                  style: { ...FILL, justifyContent: "center" },
                  mobile: { position: "relative", insetTop: "auto", insetBottom: "auto", insetStart: "auto", insetEnd: "auto", paddingTop: 24, paddingBottom: 40 },
                },
              ),
            ],
            {
              label: L("الصورة", "Photo frame"),
              style: { position: "relative", background: "black", overflow: "hidden", radius: 24 },
              mobile: { background: "secondary" },
            },
          ),
        ],
        { label: L("حاوية الصورة", "Photo container"), role: "container" },
      ),
    ]),
});
