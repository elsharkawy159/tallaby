import type { Design } from "../builder";
import { categoriesBento } from "./categories-bento";
import { categoriesBigType } from "./categories-big-type";
import { categoriesChips } from "./categories-chips";
import { categoriesClassic } from "./categories-classic";
import { categoriesFeatureList } from "./categories-feature-list";
import { categoriesIndex } from "./categories-index";
import { categoriesRail } from "./categories-rail";
import { categoriesRuled } from "./categories-ruled";
import { categoriesShowcase } from "./categories-showcase";
import { categoriesStories } from "./categories-stories";
import { categoriesTiles } from "./categories-tiles";
import { categoriesPhotoTiles } from "./categories-photo-tiles";
import { categoriesCircles } from "./categories-circles";
import { categoriesCaptioned } from "./categories-captioned";

/** First is the default for new stores (the Classic template's category row). */
export const CATEGORY_DESIGNS: readonly Design[] = [categoriesClassic, categoriesTiles, categoriesStories, categoriesRail, categoriesBento, categoriesIndex, categoriesRuled, categoriesChips, categoriesFeatureList, categoriesBigType, categoriesShowcase, categoriesPhotoTiles, categoriesCircles, categoriesCaptioned];
