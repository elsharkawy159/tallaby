import type { Design } from "../builder";
import { categoriesBento } from "./categories-bento";
import { categoriesClassic } from "./categories-classic";
import { categoriesIndex } from "./categories-index";
import { categoriesRail } from "./categories-rail";
import { categoriesStories } from "./categories-stories";
import { categoriesTiles } from "./categories-tiles";

/** First is the default for new stores (the Classic template's category row). */
export const CATEGORY_DESIGNS: readonly Design[] = [categoriesClassic, categoriesTiles, categoriesStories, categoriesRail, categoriesBento, categoriesIndex];
