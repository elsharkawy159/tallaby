/**
 * Social photo strip (Claude Design premium set, photoRail; 2026-10-27): a
 * centred heading and line with the Instagram handle under them, then square
 * photos edge to edge with thin gaps, six across on desktop. Customer photos
 * or the store's feed near the end of the page. Authored photos can't swipe
 * (only data lists have a phone rail), so phones show them three across in
 * two rows.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type TreeBuilder } from "../builder";
import { L } from "../_kit";

const INSTAGRAM = "https://www.instagram.com/";

function tile(t: TreeBuilder, i: number): NodeTemplate {
  return t.link(INSTAGRAM, [t.photo(i, L("صورة من إنستجرام", "Instagram photo"), { style: { aspectRatio: "square", objectFit: "cover", width: "100%", radius: 0 } })], {
    label: L("صورة", "Photo"),
    style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, overflow: "hidden", background: "secondary", hover: { opacity: 90 } },
  });
}

export const gallerySocialStrip = defineDesign({
  id: "gallery-social-strip",
  version: 1,
  category: "gallery",
  subcategory: "instagram",
  name: L("شريط صور السوشيال", "Social photo strip"),
  description: L(
    "عنوان في النص وحساب إنستجرام، وتحته صور مربعة من طرف الشاشة للطرف.",
    "A centred heading and your Instagram handle over square photos from edge to edge.",
  ),
  keywords: ["gallery", "instagram", "social", "customer photos", "strip", "premium", "معرض", "إنستجرام", "صور العملاء"],
  tree: (t) =>
    t.section({ label: L("شريط صور السوشيال", "Social photo strip") }, [
      t.stack(
        [
          t.container(
            [
              t.stack(
                [
                  t.heading(L("عليكم أحلى", "Worn by you"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", lineHeight: "tight", textAlign: "center" },
                  }),
                  t.paragraph(L("اعملوا لنا تاج عشان صورتكم تظهر هنا.", "Tag us to be featured."), {
                    role: "subtitle",
                    style: { textAlign: "center", maxWidth: "560px" },
                  }),
                  t.link(
                    INSTAGRAM,
                    [
                      t.row(
                        [
                          t.icon("instagram", { style: { fontSize: "lg" } }),
                          t.text(L("@اسم_متجرك", "@yourstore"), { style: { fontWeight: "semibold", fontSize: "sm" } }),
                        ],
                        { label: L("نص الرابط", "Link text"), style: { gap: 6, wrap: false, alignItems: "center" } },
                      ),
                    ],
                    {
                      label: L("الحساب", "Handle"),
                      role: "link",
                      style: { paddingTop: 10, paddingBottom: 10, paddingStart: 0, paddingEnd: 0, color: "foreground", hover: { color: "primary" } },
                    },
                  ),
                ],
                { label: L("العنوان", "Heading"), role: "intro", style: { gap: 10, alignItems: "center" } },
              ),
            ],
            { label: L("الحاوية", "Container") },
          ),
          t.grid(
            Array.from({ length: 6 }, (_, i) => tile(t, i)),
            { label: L("الصور", "Photos"), role: "items", columns: { desktop: 6, tablet: 3, mobile: 3 }, style: { gap: 4 }, mobile: { gap: 2 } },
          ),
        ],
        { label: L("المحتوى", "Content"), style: { gap: 32 }, mobile: { gap: 20 } },
      ),
    ]),
});
