import type { Design } from "../builder";
import { testimonialsClassic } from "./testimonials-classic";
import { testimonialsPhotos } from "./testimonials-photos";
import { testimonialsRating } from "./testimonials-rating";
import { testimonialsSpotlight } from "./testimonials-spotlight";
import { testimonialsWall } from "./testimonials-wall";

/** First is the default for new stores (the Classic template's testimonials). */
export const TESTIMONIAL_DESIGNS: readonly Design[] = [testimonialsClassic, testimonialsSpotlight, testimonialsRating, testimonialsWall, testimonialsPhotos];
