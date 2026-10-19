/**
 * Atelier photos: free Pexels photos (https://www.pexels.com/license/, no
 * attribution needed), each checked by hand (2026-10-19). Clothes on hangers,
 * folded knitwear, bags, fabric and the workshop only: no people, no bodies,
 * no mannequins. The seller replaces them with their own.
 */

const PEXELS = "https://images.pexels.com/photos/";

/** A Pexels photo URL at a given width. */
export function pexels(id: number, width = 1280): string {
  return `${PEXELS}${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}

/** Lifestyle photos used by the template's sections. */
export const ATELIER_PHOTOS = {
  /** Linen shirts in earth tones hanging in a closet. */
  linenRail: pexels(6461477, 900),
  /** Two small tan leather bags on white plinths. */
  bagsPlinth: pexels(5706269, 900),
  /** Neutral garments on a long rail in a bright studio. */
  studioRail: pexels(17293347, 1920),
  /** Green fabric, pins and a sewing machine on the cutting table. */
  cuttingTable: pexels(35238345, 1600),
  /** Folded linen and dried flowers on a wooden table. */
  foldedLinen: pexels(6461392, 1200),
  /** Tape measures and pins on wood. */
  tapeMeasure: pexels(38835539, 1200),
  /** A camel coat and scarf over a chair. */
  camelCoat: pexels(36180263, 900),
  /** Washed linen, close up. */
  linenTexture: pexels(7232409, 1200),
} as const;
