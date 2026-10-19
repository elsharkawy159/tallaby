import type { Design } from "../builder";
import { headerAnnouncement } from "./header-announcement";
import { headerCentered } from "./header-centered";
import { headerClassic } from "./header-classic";
import { headerLine } from "./header-line";
import { headerPill } from "./header-pill";
import { headerSearch } from "./header-search";

/** First is the default for new stores (the Classic template's header). */
export const HEADER_DESIGNS: readonly Design[] = [headerClassic, headerLine, headerCentered, headerAnnouncement, headerSearch, headerPill];
