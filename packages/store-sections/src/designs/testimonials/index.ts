import type { Design } from "../builder";
import { testimonialsBento } from "./testimonials-bento";
import { testimonialsChat } from "./testimonials-chat";
import { testimonialsClassic } from "./testimonials-classic";
import { testimonialsPhotos } from "./testimonials-photos";
import { testimonialsProducts } from "./testimonials-products";
import { testimonialsRating } from "./testimonials-rating";
import { testimonialsRuled } from "./testimonials-ruled";
import { testimonialsSpotlight } from "./testimonials-spotlight";
import { testimonialsVideos } from "./testimonials-videos";
import { testimonialsWall } from "./testimonials-wall";

/** First is the default for new stores (the Classic template's testimonials). */
export const TESTIMONIAL_DESIGNS: readonly Design[] = [testimonialsClassic, testimonialsSpotlight, testimonialsRating, testimonialsWall, testimonialsPhotos, testimonialsRuled, testimonialsChat, testimonialsBento, testimonialsProducts, testimonialsVideos];
