import type { Design } from "../builder";
import { teamBranches } from "./team-branches";
import { teamCareers } from "./team-careers";
import { teamFounder } from "./team-founder";
import { teamGrid } from "./team-grid";
import { teamNumbers } from "./team-numbers";
import { teamPress } from "./team-press";
import { teamScenes } from "./team-scenes";
import { teamStory } from "./team-story";
import { teamTimeline } from "./team-timeline";
import { teamValues } from "./team-values";

/**
 * About & team (Claude Design library Y-a…Y-j): the story behind the store,
 * who runs it, what it stands for and where to find it. All text and photos
 * are typed by the seller; nothing reads the catalogue. Ids start with `team-`
 * because `about-*` belongs to the image-with-text designs. The first is the
 * default.
 */
export const ABOUT_DESIGNS: readonly Design[] = [
  teamStory,
  teamTimeline,
  teamGrid,
  teamValues,
  teamFounder,
  teamBranches,
  teamPress,
  teamCareers,
  teamNumbers,
  teamScenes,
];
