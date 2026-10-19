/**
 * The empty home page: what a store gets when it does not start from the
 * default template (a published store missing its home page). Never-published
 * stores start from Tallaby Classic (`DEFAULT_TEMPLATE`, seeded by
 * @workspace/lib `seedStarterSite`). No React here.
 */
import type { PageContent } from "../config/schema";

export function emptyHomeContent(): PageContent {
  return { sections: [] };
}
