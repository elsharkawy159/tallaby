import type { Design } from "../builder";
import { brandsAz } from "./brands-az";
import { brandsBubbles } from "./brands-bubbles";
import { brandsCards } from "./brands-cards";
import { brandsFeatured } from "./brands-featured";
import { brandsPress } from "./brands-press";
import { brandsQuotes } from "./brands-quotes";
import { brandsRow } from "./brands-row";
import { brandsRuled } from "./brands-ruled";
import { brandsTiles } from "./brands-tiles";
import { brandsWall } from "./brands-wall";

/** First is the default for new stores. */
export const BRAND_DESIGNS: readonly Design[] = [brandsRow, brandsWall, brandsTiles, brandsPress, brandsFeatured, brandsRuled, brandsCards, brandsAz, brandsQuotes, brandsBubbles];
