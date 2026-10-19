import type { Design } from "../builder";
import { galleryBento } from "./gallery-bento";
import { galleryCaptioned } from "./gallery-captioned";
import { galleryFeed } from "./gallery-feed";
import { galleryMosaic } from "./gallery-mosaic";
import { galleryPolaroids } from "./gallery-polaroids";
import { galleryPrints } from "./gallery-prints";
import { gallerySide } from "./gallery-side";
import { gallerySlider } from "./gallery-slider";
import { galleryStrip } from "./gallery-strip";

/** First is the default for new stores (the library's recommended feed grid). */
export const GALLERY_DESIGNS: readonly Design[] = [galleryFeed, galleryMosaic, galleryPolaroids, galleryStrip, galleryCaptioned, gallerySlider, galleryPrints, galleryBento, gallerySide];
