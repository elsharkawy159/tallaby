import type { Design } from "../builder";
import { galleryFeed } from "./gallery-feed";
import { galleryMosaic } from "./gallery-mosaic";
import { galleryPolaroids } from "./gallery-polaroids";
import { galleryStrip } from "./gallery-strip";

/** First is the default for new stores (the library's recommended feed grid). */
export const GALLERY_DESIGNS: readonly Design[] = [galleryFeed, galleryMosaic, galleryPolaroids, galleryStrip];
