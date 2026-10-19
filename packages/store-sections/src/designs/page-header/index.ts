import type { Design } from "../builder";
import { pageBanner } from "./page-banner";
import { pageHeader } from "./page-header";
import { pageImage } from "./page-image";
import { pagePromo } from "./page-promo";
import { pageSubcategories } from "./page-subcategories";

/** First two are the Classic template's inner-page header and category banner. */
export const PAGE_HEADER_DESIGNS: readonly Design[] = [pageHeader, pageBanner, pageImage, pageSubcategories, pagePromo];
