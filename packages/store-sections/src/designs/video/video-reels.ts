/**
 * Reels rail (library V-e): tall posters like short-video reels, each with a
 * play glyph and a view count chip, linking to the reel.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { VIDEO_LINK } from "./_video";

const VIEWS = [L("١٢ ألف", "12k"), L("٨ آلاف", "8k"), L("٣١ ألف", "31k"), L("٥ آلاف", "5k"), L("١٩ ألف", "19k")];

export const videoReels = defineDesign({
  id: "video-reels",
  version: 1,
  category: "video",
  subcategory: "reels",
  name: L("ريلز", "Reels"),
  description: L("صف فيديوهات طولية من تيك توك وإنستجرام بعدد المشاهدات.", "A row of vertical TikTok and Instagram videos with view counts."),
  keywords: ["reels", "tiktok", "instagram", "video", "ريلز", "تيك توك", "إنستجرام"],
  tree: (t) =>
    t.section({ label: L("ريلز", "Reels") }, [
      t.container(
        [
          sectionHead(t, { title: L("من على تيك توك", "From TikTok"), link: { href: "https://www.tiktok.com/", text: L("تابعنا", "Follow us") } }),
          t.grid(
            VIEWS.map((views, i) =>
              t.link(
                VIDEO_LINK,
                [
                  t.photo(i, L("فيديو قصير", "Short video"), { style: { aspectRatio: "portrait", objectFit: "cover", radius: 20 } }),
                  t.icon("play", { style: { position: "absolute", insetTop: "14px", insetStart: "14px", color: "white", fontSize: "2xl" } }),
                  t.row([t.icon("play", { style: { fontSize: "xs" } }), t.text(views, { style: { fontWeight: "semibold", fontSize: "xs" } })], {
                    label: L("المشاهدات", "Views"),
                    style: {
                      position: "absolute",
                      insetBottom: "12px",
                      insetStart: "12px",
                      gap: 4,
                      background: "background",
                      radius: 999,
                      paddingTop: 4,
                      paddingBottom: 4,
                      paddingStart: 10,
                      paddingEnd: 10,
                    },
                  }),
                ],
                {
                  label: L("ريل", "Reel"),
                  style: { position: "relative", paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, hover: { opacity: 90 } },
                },
              ),
            ),
            { label: L("الفيديوهات", "Reels"), role: "items", columns: { desktop: 5, tablet: 3, mobile: 2 }, style: { gap: 14 }, mobile: { gap: 10 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
