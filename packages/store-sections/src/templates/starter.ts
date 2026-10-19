/**
 * What a new store's website starts from: an empty home page and no header or
 * footer. Tallaby Classic was removed (owner, 2026-10-19); the starting site
 * will be rebuilt from section designs (CLAUDE.md rule 17). No React here.
 */
import type { PageContent } from "../config/schema";

export function emptyHomeContent(): PageContent {
  return { sections: [] };
}
