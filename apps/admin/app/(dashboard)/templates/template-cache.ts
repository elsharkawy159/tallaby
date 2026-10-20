// Plain server helper for the template actions (not "use server": the action
// files that import it declare it themselves).
import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateTemplateCatalog } from "@workspace/cache";
import { logServerError, type LogContext } from "@workspace/db/log";

/**
 * Refreshes the seller template gallery, the marketing previews and the
 * Templates page after a committed template write (the lib does not
 * invalidate). The write already committed, so a failing refresh is logged
 * and never reported as a failed write; the 5-minute cache backstop catches up.
 */
export async function refreshTemplateCatalog(label: string, context: LogContext = {}): Promise<void> {
  try {
    await applyInvalidation(invalidateTemplateCatalog(), { from: "admin", mode: "action" });
  } catch (error) {
    logServerError("admin", `template catalog refresh after ${label} failed`, context, error);
  }
  try {
    revalidatePath("/templates");
  } catch (error) {
    logServerError("admin", `templates page revalidation after ${label} failed`, context, error);
  }
}
