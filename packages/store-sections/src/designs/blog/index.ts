import type { Design } from "../builder";
import { blogBento } from "./blog-bento";
import { blogClassic } from "./blog-classic";
import { blogDated } from "./blog-dated";
import { blogFeature } from "./blog-feature";
import { blogHeadline } from "./blog-headline";
import { blogIndex } from "./blog-index";
import { blogLead } from "./blog-lead";
import { blogRail } from "./blog-rail";
import { blogTabbed } from "./blog-tabbed";
import { blogTiles } from "./blog-tiles";

/** First is the default for new stores (the Classic template's blog block). */
export const BLOG_DESIGNS: readonly Design[] = [blogClassic, blogLead, blogIndex, blogTiles, blogFeature, blogDated, blogBento, blogRail, blogTabbed, blogHeadline];
