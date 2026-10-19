/**
 * Our story: an image with a highlight-number card pinned to its corner,
 * beside the story, a short checklist and a button.
 */
import { defineDesign } from "../builder";

const L = (ar: string, en: string) => ({ ar, en });

const POINTS = [L("منتجات أصلية ١٠٠٪", "100% genuine products"), L("تغليف آمن لكل طلب", "Safe packaging for every order"), L("دعم سريع عبر واتساب", "Fast support on WhatsApp")];

export const aboutStory = defineDesign({
  id: "about-story",
  version: 1,
  category: "about",
  subcategory: "story",
  name: L("قصتنا", "Our story"),
  description: L("صورة مع رقم مميز بجانب قصتك وقيمك وزر.", "An image with a highlight number beside your story, values and a button."),
  keywords: ["about", "story", "من نحن", "قصتنا"],
  tree: (t) =>
    t.section({ label: L("قصتنا", "Our story") }, [
      t.container(
        [
          t.grid(
            [
              t.box(
                [
                  t.image("", L("صورة المتجر", "Store photo"), { role: "image", style: { aspectRatio: "portrait", radius: 16, objectFit: "cover" } }),
                  t.card(
                    [
                      t.heading(L("+٥٠٠٠", "5,000+"), "h3", { style: { fontSize: "display-sm", fontWeight: "extrabold", lineHeight: "tight", color: "primaryInk" } }),
                      t.text(L("عميل سعيد", "Happy customers"), { style: { color: "primaryInk", opacity: 90, marginTop: 4 } }),
                    ],
                    {
                      label: L("الرقم المميز", "Highlight"),
                      style: {
                        position: "absolute",
                        insetBottom: "0px",
                        insetEnd: "16px",
                        background: "primary",
                        borderWidth: 0,
                        paddingTop: 20,
                        paddingBottom: 20,
                        paddingStart: 24,
                        paddingEnd: 24,
                        shadow: "lg",
                      },
                    },
                  ),
                ],
                {
                  label: L("الصورة", "Image"),
                  // Sized and tinted so the highlight card still sits on a frame before a photo is added.
                  style: { position: "relative", paddingBottom: 32, minHeight: 420, background: "secondary", radius: 16 },
                  mobile: { minHeight: 300 },
                },
              ),
              t.stack(
                [
                  t.stack(
                    [
                      t.badge(L("من نحن", "About us"), { role: "eyebrow", style: { color: "primary" } }),
                      t.heading(L("بدأنا بفكرة بسيطة: منتج جيد بسعر عادل", "It started with a simple idea: good products at fair prices"), "h2", {
                        role: "title",
                        style: { fontSize: "display-sm" },
                      }),
                      t.paragraph(
                        L(
                          "اكتب هنا قصة متجرك: كيف بدأت، وما الذي يميز منتجاتك، ولماذا يعود إليك العملاء.",
                          "Tell your store's story here: how it began, what makes your products special and why customers come back.",
                        ),
                        { role: "body" },
                      ),
                      t.paragraph(L("العملاء يشترون من الناس الذين يعرفونهم ويثقون بهم.", "People buy from people they know and trust."), { role: "body" }),
                    ],
                    { label: L("النص", "Copy"), style: { gap: 12 } },
                  ),
                  t.grid(
                    POINTS.map((text) =>
                      t.row([t.icon("check", { style: { color: "primary", fontSize: "lg" } }), t.text(text, { style: { fontWeight: "medium" } })], {
                        label: L("نقطة", "Point"),
                        style: { gap: 8 },
                      }),
                    ),
                    { label: L("نقاط مميزة", "Highlights"), role: "items", columns: { desktop: 2, mobile: 1 }, style: { gap: 12 } },
                  ),
                  t.row([t.button(L("تسوّق الآن", "Shop now"), "/#products", "solid", { role: "cta" })], { label: L("الأزرار", "Buttons") }),
                ],
                { label: L("المحتوى", "Content"), style: { gap: 24 } },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 64, alignItems: "center" },
              mobile: { gap: 40 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
