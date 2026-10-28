import type { Design } from "../builder";
import { heroBanner } from "./hero-banner";
import { heroBento } from "./hero-bento";
import { heroBigWord } from "./hero-big-word";
import { heroClassic } from "./hero-classic";
import { heroCollage } from "./hero-collage";
import { heroFullbleed } from "./hero-fullbleed";
import { heroHalves } from "./hero-halves";
import { heroInline } from "./hero-inline";
import { heroPoster } from "./hero-poster";
import { heroProduct } from "./hero-product";
import { heroSearch } from "./hero-search";
import { heroTicket } from "./hero-ticket";
import { heroCarousel } from "./hero-carousel";
import { heroCarouselImages } from "./hero-carousel-images";
import { heroSplit } from "./hero-split";
import { heroThumbs } from "./hero-thumbs";
import { heroVideo } from "./hero-video";

/** In Add › Sections order: the two carousels first (owner, 2026-10-23). */
export const HERO_DESIGNS: readonly Design[] = [
  heroCarousel,
  heroCarouselImages,
  heroClassic,
  heroTicket,
  heroPoster,
  heroInline,
  heroProduct,
  heroCollage,
  heroBento,
  heroHalves,
  heroBigWord,
  heroSearch,
  heroFullbleed,
  heroVideo,
  heroSplit,
  heroThumbs,
  heroBanner,
];
