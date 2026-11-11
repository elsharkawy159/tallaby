/**
 * Pieces the full-bleed heroes share (look-first pilot, docs/systems/plan.md
 * §10 L7): the photo frame that fills most of the first screen, the layer
 * that covers it, and the quiet second action.
 */
import type { StyleValues } from "../../elements/style";

/** A layer covering its frame. */
export const FILL = { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px" } as const;

/**
 * A hero photo's frame per screen: 21:9 but at least 680px tall on desktop
 * (about 80% of a laptop screen, and never taller than the screen:
 * `elements/style.ts` caps a banner), 16:9 on tablets, and a tall crop on
 * phones. The minimum height also keeps the copy on the photo on phones
 * (`keepsBannerOnPhones`).
 */
export const HERO_FRAME: { style: StyleValues; tablet: StyleValues; mobile: StyleValues } = {
  style: { aspectRatio: "banner", minHeight: 680 },
  tablet: { aspectRatio: "wide", minHeight: 560 },
  mobile: { aspectRatio: "portrait", minHeight: 560 },
};

/** The second action on a photo: an underlined white text link, so the solid button stays the one clear action. */
export const QUIET_LINK: StyleValues = {
  background: "transparent",
  color: "white",
  borderWidth: 0,
  underline: true,
  fontWeight: "medium",
  paddingStart: 12,
  paddingEnd: 12,
  hover: { opacity: 75 },
};

/** The small uppercase line above a hero headline. */
export const HERO_EYEBROW: StyleValues = { fontWeight: "semibold", fontSize: "sm", letterSpacing: "wider", textTransform: "uppercase" };

/**
 * A faint even dim under the foot fade, so the small eyebrow and the top of
 * the headline still read on a light photo. Its own layer (and role), so a
 * seller with a dark photo can delete it.
 */
export const SOFT_DIM: StyleValues = { ...FILL, background: "black", opacity: 16 };
