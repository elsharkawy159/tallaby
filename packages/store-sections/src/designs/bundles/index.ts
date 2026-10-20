import type { Design } from "../builder";
import { bundleBox } from "./bundle-box";
import { bundleBuilder } from "./bundle-builder";
import { bundleGifts } from "./bundle-gifts";
import { bundleList } from "./bundle-list";
import { bundlePlus } from "./bundle-plus";
import { bundlePoster } from "./bundle-poster";
import { bundlePriceDrop } from "./bundle-price-drop";
import { bundleQuantity } from "./bundle-quantity";
import { bundleRail } from "./bundle-rail";
import { bundleTabs } from "./bundle-tabs";
import { bundleTogether } from "./bundle-together";

/**
 * The Claude Design "Bundles" sections (O-a…O-k), in design order; the first
 * is the default. Products always come from product lists; bundle prices and
 * savings are typed by the seller (`./_shared.ts`).
 */
export const BUNDLE_DESIGNS: readonly Design[] = [
  bundlePlus,
  bundleBuilder,
  bundlePoster,
  bundleTabs,
  bundleList,
  bundleBox,
  bundleQuantity,
  bundleRail,
  bundlePriceDrop,
  bundleGifts,
  bundleTogether,
];
