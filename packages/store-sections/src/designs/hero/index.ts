import type { Design } from "../builder";
import { heroBento } from "./hero-bento";
import { heroBigWord } from "./hero-big-word";
import { heroClassic } from "./hero-classic";
import { heroCollage } from "./hero-collage";
import { heroHalves } from "./hero-halves";
import { heroInline } from "./hero-inline";
import { heroPoster } from "./hero-poster";
import { heroProduct } from "./hero-product";
import { heroSearch } from "./hero-search";
import { heroTicket } from "./hero-ticket";

/** First is the default for new stores (the Classic template's hero). */
export const HERO_DESIGNS: readonly Design[] = [heroClassic, heroTicket, heroPoster, heroInline, heroProduct, heroCollage, heroBento, heroHalves, heroBigWord, heroSearch];
