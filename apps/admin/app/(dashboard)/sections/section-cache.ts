// Plain server helper for the section library actions (not "use server": the
// action files that import it declare it themselves).
import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateLibrarySections } from "@workspace/cache";
import { logServerError, type LogContext } from "@workspace/db/log";

/**
 * Refreshes the seller section palette (`library:sections`) and the Sections
 * page after a committed library write (the lib does not invalidate). The
 * write already committed, so a failing refresh is logged and never reported
 * as a failed write (as refreshTemplateCatalog does for templates).
 */
export async function refreshLibrarySections(label: string, context: LogContext = {}): Promise<void> {
  try {
    await applyInvalidation(invalidateLibrarySections(), { from: "admin", mode: "action" });
  } catch (error) {
    logServerError("admin", `section palette refresh after ${label} failed`, context, error);
  }
  try {
    revalidatePath("/sections");
  } catch (error) {
    logServerError("admin", `sections page revalidation after ${label} failed`, context, error);
  }
}
