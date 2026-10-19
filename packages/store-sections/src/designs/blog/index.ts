import type { Design } from "../builder";
import { blogClassic } from "./blog-classic";
import { blogFeature } from "./blog-feature";
import { blogIndex } from "./blog-index";
import { blogLead } from "./blog-lead";
import { blogTiles } from "./blog-tiles";

/** First is the default for new stores (the Classic template's blog block). */
export const BLOG_DESIGNS: readonly Design[] = [blogClassic, blogLead, blogIndex, blogTiles, blogFeature];
