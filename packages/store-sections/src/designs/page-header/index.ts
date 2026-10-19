import type { Design } from "../builder";
import { pageBanner } from "./page-banner";
import { pageBrand } from "./page-brand";
import { pageCentered } from "./page-centered";
import { pageCount } from "./page-count";
import { pageHeader } from "./page-header";
import { pageImage } from "./page-image";
import { pagePromo } from "./page-promo";
import { pageSplit } from "./page-split";
import { pageSubcategories } from "./page-subcategories";
import { pageToolbar } from "./page-toolbar";

/** First two are the Classic template's inner-page header and category banner. */
export const PAGE_HEADER_DESIGNS: readonly Design[] = [pageHeader, pageBanner, pageImage, pageSubcategories, pagePromo, pageToolbar, pageBrand, pageSplit, pageCentered, pageCount];
