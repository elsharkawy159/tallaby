/**
 * The photo size to recommend for an image element, from its own aspect ratio
 * (ROADMAP.md F-50a). No React here: the builder and Website › Design read it.
 */
import type { ComponentNode } from "../config/schema";
import { keepsBannerOnPhones } from "./style";

const SIZES = {
  square: [1200, 1200],
  landscape: [1600, 1200],
  wide: [1920, 1080],
  banner: [2100, 900],
  portrait: [1200, 1600],
  story: [1080, 1920],
} as const;
type Ratio = keyof typeof SIZES;

const ratioOf = (style: Record<string, unknown> | undefined): Ratio | null => {
  const value = style?.aspectRatio;
  return typeof value === "string" && value in SIZES ? (value as Ratio) : null;
};

export type RecommendedImageSize = {
  width: number;
  height: number;
  /** Phones frame the photo narrower than desktop, so its sides are cut there. */
  cropsOnPhones: boolean;
};

/** Null for an image with no fixed ratio: it shows the whole photo, whatever its size. */
export function recommendedImageSize(node: Pick<ComponentNode, "style" | "breakpointStyles">): RecommendedImageSize | null {
  const ratio = ratioOf(node.style);
  if (!ratio) return null;
  const [width, height] = SIZES[ratio];
  const staysBanner = keepsBannerOnPhones({ type: "image", ...node });
  const phone = staysBanner ? null : (ratioOf(node.breakpointStyles?.mobile) ?? ratioOf(node.breakpointStyles?.tablet));
  const narrower = phone ? SIZES[phone][0] / SIZES[phone][1] < width / height : false;
  return { width, height, cropsOnPhones: narrower };
}
