/**
 * Tallaby Classic photos: free Pexels photos (https://www.pexels.com/license/,
 * no attribution needed), each checked by hand (2026-10-19). Products, gift
 * boxes, parcels, a shop front and a map only: no people, no bodies. Classic
 * is every new store's starting site, so the section photos stay generic
 * (gifts, parcels, a shop) and fit any kind of store; the seller replaces them.
 */
import { pexels } from "../atelier/photos";

export { pexels };

/** Photos used by the template's sections. */
export const CLASSIC_PHOTOS = {
  /** Red, pink and green gift boxes stacked on a white table. */
  giftStack: pexels(4397877, 900),
  /** Two black gift boxes with white ribbons on peach. */
  blackGifts: pexels(5872362, 700),
  /** Colourful paper shopping bags on black. */
  paperBags: pexels(7987863, 700),
  /** Taped parcels on a wooden shelf against a white brick wall. */
  parcelShelf: pexels(12354555, 1200),
  /** A small shop front with wooden doors and glass windows. */
  shopFront: pexels(7702799, 1200),
  /** A folded paper map on a light background. */
  foldedMap: pexels(7634479, 1200),
} as const;
