/**
 * Video pieces: there is no video element yet, so a video is its poster photo
 * with a play button that links to the video (YouTube, TikTok, Instagram).
 */
import type { NodeTemplate } from "../../elements/tree";
import type { NodeOptions, TreeBuilder } from "../builder";
import { L } from "../_kit";

export const VIDEO_LINK = "https://www.youtube.com/";

/** A round play button linking to the video, centred over its poster. */
export function playButton(t: TreeBuilder, size = 80, opts: NodeOptions = {}): NodeTemplate {
  return t.link(VIDEO_LINK, [t.icon("play", { style: { fontSize: size >= 72 ? "3xl" : "xl", color: "primaryInk" } })], {
    label: L("زر التشغيل", "Play button"),
    role: "video-link",
    ...opts,
    style: {
      position: "absolute",
      insetTop: "50%",
      insetStart: "50%",
      marginTop: -size / 2,
      marginStart: -size / 2,
      width: `${size}px`,
      minHeight: size,
      paddingTop: Math.round(size * 0.3),
      paddingBottom: 0,
      paddingStart: 0,
      paddingEnd: 0,
      radius: 999,
      background: "primary",
      textAlign: "center",
      shadow: "lg",
      hover: { scale: 106 },
      ...opts.style,
    },
  });
}
