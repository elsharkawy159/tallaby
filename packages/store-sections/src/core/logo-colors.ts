/**
 * The strongest colours of a logo (AI Store Builder v2, spec §6.2). Pure:
 * takes RGBA pixels (a canvas `ImageData.data`) and returns up to `max` hex
 * colours, strongest first. No model call; the dashboard draws the logo to a
 * small canvas and calls this (apps/dashboard/lib/brand/logo-colors.client.ts).
 *
 * Skips transparent (alpha < 128), near-white, near-black and grey pixels,
 * buckets the rest at 5 bits per channel weighted by saturation, then merges
 * buckets that look alike (ΔE in OKLab). A logo with no colour returns its
 * strongest grey, or its black when it is only black (a black logo is a
 * valid brand colour); a fully white or transparent image returns [].
 */
import { deltaEOk, rgbToHex, rgbToOklch, type Rgb } from "./palette";

export type DominantColorsOptions = {
  /** How many colours to return, 1–8 (default 3). */
  max?: number;
  /** Buckets closer than this ΔE OK merge into one colour (default 0.08). */
  mergeDistance?: number;
};

const NEAR_WHITE_L = 0.95;
const NEAR_BLACK_L = 0.18;
const GREY_CHROMA = 0.035;

type Bucket = { count: number; r: number; g: number; b: number };
type Cluster = { weight: number; r: number; g: number; b: number; rgb: Rgb };

const avg = (bucket: Bucket): Rgb => [bucket.r / bucket.count, bucket.g / bucket.count, bucket.b / bucket.count];

export function dominantColorsFromPixels(data: Uint8ClampedArray, opts: DominantColorsOptions = {}): string[] {
  const max = Math.min(8, Math.max(1, Math.floor(opts.max ?? 3)));
  const mergeDistance = opts.mergeDistance ?? 0.08;

  const buckets = new Map<number, Bucket>();
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3]! < 128) continue;
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count++;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
    } else buckets.set(key, { count: 1, r, g, b });
  }

  const colourful: { weight: number; bucket: Bucket }[] = [];
  const greys: { weight: number; bucket: Bucket }[] = [];
  const blacks: { weight: number; bucket: Bucket }[] = [];
  // Map order is insertion order, so ties below resolve the same way every run.
  for (const bucket of buckets.values()) {
    const { l, c } = rgbToOklch(avg(bucket));
    if (l >= NEAR_WHITE_L) continue;
    if (l <= NEAR_BLACK_L) blacks.push({ weight: bucket.count, bucket });
    else if (c < GREY_CHROMA) greys.push({ weight: bucket.count, bucket });
    // Saturation weighting: a vivid pixel counts up to ~3.5× a dull one.
    else colourful.push({ weight: bucket.count * (0.5 + Math.min(c, 0.3) * 10), bucket });
  }

  if (colourful.length === 0) {
    const fallback = greys.length > 0 ? greys : blacks;
    const top = merge(fallback, mergeDistance)[0];
    return top ? [rgbToHex(top.rgb)] : [];
  }
  return merge(colourful, mergeDistance)
    .slice(0, max)
    .map((c) => rgbToHex(c.rgb));
}

/** Greedy merge, strongest bucket first; each cluster keeps a weighted mean colour. */
function merge(items: { weight: number; bucket: Bucket }[], distance: number): Cluster[] {
  const sorted = [...items].sort((a, b) => b.weight - a.weight);
  const clusters: Cluster[] = [];
  for (const { weight, bucket } of sorted) {
    const rgb = avg(bucket);
    const near = clusters.find((c) => deltaEOk(c.rgb, rgb) < distance);
    if (near) {
      near.r += rgb[0] * weight;
      near.g += rgb[1] * weight;
      near.b += rgb[2] * weight;
      near.weight += weight;
      near.rgb = [near.r / near.weight, near.g / near.weight, near.b / near.weight];
    } else {
      clusters.push({ weight, r: rgb[0] * weight, g: rgb[1] * weight, b: rgb[2] * weight, rgb });
    }
  }
  return clusters.sort((a, b) => b.weight - a.weight);
}
