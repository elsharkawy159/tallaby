/**
 * Photo strip (library G-e): a strip of tall photos inside the store
 * container, with no gaps and the handle on a paper pill over the middle. A light divider that
 * adds mood without text.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const galleryStrip = defineDesign({
  id: "gallery-strip",
  version: 2,
  category: "gallery",
  subcategory: "strip",
  name: L("شريط صور", "Photo strip"),
  description: L("شريط صور طولية وعليه اسم حسابك.", "A strip of tall photos with your handle on top."),
  keywords: ["gallery", "strip", "instagram", "divider", "شريط", "صور", "إنستجرام"],
  tree: (t) =>
    t.section({ label: L("شريط الصور", "Photo strip") }, [
      t.container(
        [
          t.grid(
            Array.from({ length: 6 }, (_, i) =>
              t.photo(i, L("صورة", "Photo"), { style: { aspectRatio: "portrait", objectFit: "cover", radius: 0 }, ...(i > 2 && { mobile: { hidden: true } }) }),
            ),
            { label: L("الصور", "Photos"), role: "items", columns: { desktop: 6, mobile: 3 }, style: { gap: 0, radius: 24, overflow: "hidden" } },
          ),
          t.link(
            "https://www.instagram.com/",
            [
              t.row(
                [t.icon("instagram", { style: { fontSize: "lg" } }), t.text(L("@اسم_متجرك", "@yourstore"), { style: { fontWeight: "bold", fontSize: "md" } })],
                { label: L("المحتوى", "Content"), style: { gap: 8, wrap: false, justifyContent: "center" } },
              ),
            ],
            {
              label: L("الحساب", "Handle"),
              style: {
                position: "absolute",
                insetTop: "50%",
                insetStart: "50%",
                marginTop: -24,
                marginStart: -100,
                width: "200px",
                background: "background",
                radius: 999,
                paddingTop: 12,
                paddingBottom: 12,
                paddingStart: 20,
                paddingEnd: 20,
                shadow: "md",
                zIndex: 2,
              },
            },
          ),
        ],
        { label: L("الحاوية", "Container"), role: "container", style: { position: "relative" } },
      ),
    ]),
});
