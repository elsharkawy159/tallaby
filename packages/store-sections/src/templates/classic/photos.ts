/**
 * Tallaby Classic photos: free Pexels photos (https://www.pexels.com/license/,
 * no attribution needed), each checked by hand (2026-10-19; the v8 set
 * 2026-11-11). Products, gift boxes, parcels, a desk, a shop front and a map
 * only: no people, no bodies, no logos. Classic is every new store's starting
 * site, so the section photos stay generic and fit any kind of store; the
 * seller replaces them.
 */
import { pexels } from "../library-template";

export { pexels };

/**
 * A Pexels photo cut to one side (near square), for a hero slide: the subject
 * stays in view in the wide desktop banner and in the tall phone crop, and the
 * empty side is left for the copy.
 */
const pexelsSide = (id: number, side: "left" | "right") => `${pexels(id, 2000)}&h=1830&fit=crop&crop=${side}`;

/** Photos used by the template's sections. */
export const CLASSIC_PHOTOS = {
  /** v8 hero, slide 1: wrapped gift boxes on calm beige, empty space beside them. */
  heroGifts: pexelsSide(5485173, "left"),
  /** v8 hero, slide 2: an open cardboard box on a wooden table against a white wall. */
  heroParcel: pexels(4498152, 2000),
  /** v8 hero, slide 3: gold and pink glitter gift boxes on white marble. */
  heroBoxes: pexelsSide(5485119, "left"),
  /** v8 FAQ split: a white desk flat lay (a felt pouch of pencils, a cup, glasses, a small plant). */
  deskFlatLay: `${pexels(4087271, 1200)}&h=1100&fit=crop&crop=right`,
  /** Red, pink and green gift boxes stacked on a white table (v3–v7 hero). */
  giftStack: pexels(4397877, 900),
  /** Two black gift boxes with white ribbons on peach (the offers design). */
  blackGifts: pexels(5872362, 700),
  /** Colourful paper shopping bags on black (v3–v7 hero). */
  paperBags: pexels(7987863, 700),
  /** Taped parcels on a wooden shelf against a white brick wall (the v8 home story, and the About page). */
  parcelShelf: pexels(12354555, 1200),
  /** A small shop front with wooden doors and glass windows. */
  shopFront: pexels(7702799, 1200),
  /** A folded paper map on a light background. */
  foldedMap: pexels(7634479, 1200),
} as const;
