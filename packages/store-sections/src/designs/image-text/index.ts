import type { Design } from "../builder";
import { aboutCircle } from "./about-circle";
import { aboutClassic } from "./about-classic";
import { aboutFullbleed } from "./about-fullbleed";
import { aboutInset } from "./about-inset";
import { aboutList } from "./about-list";
import { aboutOverlap } from "./about-overlap";
import { aboutPanel } from "./about-panel";
import { aboutRows } from "./about-rows";
import { aboutStories } from "./about-stories";
import { aboutValues } from "./about-values";
import { aboutBeforeAfter } from "./about-before-after";
import { aboutShopLook } from "./about-shop-look";
import { aboutSplitStory } from "./about-split-story";
import { aboutWide } from "./about-wide";

/** First is the default for new stores (the Classic template's About story). */
export const IMAGE_TEXT_DESIGNS: readonly Design[] = [aboutClassic, aboutPanel, aboutOverlap, aboutRows, aboutValues, aboutList, aboutWide, aboutInset, aboutStories, aboutCircle, aboutFullbleed, aboutSplitStory, aboutBeforeAfter, aboutShopLook];
