import type { Design } from "../builder";
import { brandsFeatured } from "./brands-featured";
import { brandsPress } from "./brands-press";
import { brandsRow } from "./brands-row";
import { brandsTiles } from "./brands-tiles";
import { brandsWall } from "./brands-wall";

/** First is the default for new stores. */
export const BRAND_DESIGNS: readonly Design[] = [brandsRow, brandsWall, brandsTiles, brandsPress, brandsFeatured];
