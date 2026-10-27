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
import { testimonialsCarousel } from "./testimonials-carousel";
import { testimonialsPhotoCards } from "./testimonials-photo-cards";
import { testimonialsQuote } from "./testimonials-quote";
import { testimonialsSummary } from "./testimonials-summary";

/** First is the default for new stores (the Classic template's testimonials). */
export const TESTIMONIAL_DESIGNS: readonly Design[] = [testimonialsClassic, testimonialsSpotlight, testimonialsRating, testimonialsWall, testimonialsPhotos, testimonialsRuled, testimonialsChat, testimonialsBento, testimonialsProducts, testimonialsVideos, testimonialsCarousel, testimonialsPhotoCards, testimonialsQuote, testimonialsSummary];
