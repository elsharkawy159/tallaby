import type { Design } from "../builder";
import { headerAnnouncement } from "./header-announcement";
import { headerBrandBar } from "./header-brand-bar";
import { headerCentered } from "./header-centered";
import { headerChips } from "./header-chips";
import { headerClassic } from "./header-classic";
import { headerDepartments } from "./header-departments";
import { headerLine } from "./header-line";
import { headerPill } from "./header-pill";
import { headerRuled } from "./header-ruled";
import { headerSearch } from "./header-search";

/** First is the default for new stores (the Classic template's header). */
export const HEADER_DESIGNS: readonly Design[] = [headerClassic, headerLine, headerCentered, headerAnnouncement, headerSearch, headerPill, headerRuled, headerChips, headerBrandBar, headerDepartments];
