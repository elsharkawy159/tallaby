/**
 * Add › Sections presets from the published section library (`library_sections`,
 * Task 10), loaded exactly like the dashboard editor
 * (apps/dashboard/app/(builder)/stores/[storeId]/editor/server/library.data.ts;
 * apps cannot import each other), so the admin and seller palettes match.
 * Platform data with no seller data: cached under `librarySectionTags.catalog()`.
 */
import { createCachedQuery, librarySectionTags } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { listLibraryPresets } from "@workspace/lib/library-sections/server";
import type { SectionPreset } from "@workspace/store-sections/render";

const getCachedLibraryPresets = createCachedQuery({
  name: "library:sections",
  ttl: 300,
  tags: () => [librarySectionTags.catalog()],
  query: () => listLibraryPresets(),
});

/** The presets, or undefined when the database fails (the editor then uses its built-in library, SECTION_PRESETS). */
export async function loadLibraryPresets(): Promise<SectionPreset[] | undefined> {
  try {
    return await getCachedLibraryPresets();
  } catch (error) {
    logServerError("admin", "library sections failed to load; using the built-in library", {}, error);
    return undefined;
  }
}
