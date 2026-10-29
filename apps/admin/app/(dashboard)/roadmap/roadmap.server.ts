"use server";

import { revalidatePath } from "next/cache";
import { logServerError } from "@workspace/db/log";
import { ROADMAP_ADMIN_ERROR_MESSAGES, ROADMAP_STATUS_LABELS } from "@workspace/lib/admin";
import { saveRoadmapCard, setRoadmapCardHidden, setRoadmapCardStatus } from "@workspace/lib/admin/server";
import { adminActorId, type AdminActionResult } from "../_lib/saas-admin.server";

/**
 * Admin › Roadmap actions (0115). The seller roadmap page on the dashboard is
 * never cached, so only the admin list needs a refresh.
 */

const fail = (code: string): AdminActionResult => ({
  success: false,
  error: ROADMAP_ADMIN_ERROR_MESSAGES[code as keyof typeof ROADMAP_ADMIN_ERROR_MESSAGES] ?? ROADMAP_ADMIN_ERROR_MESSAGES.generic,
});

/** Adds a team card (no `id`) or edits any card. Audited. */
export async function saveRoadmapCardAction(input: unknown): Promise<AdminActionResult> {
  const actorId = await adminActorId("canManageProducts");
  if (!actorId) return fail("not_admin");
  try {
    const result = await saveRoadmapCard(actorId, input);
    if (!result.success) return fail(result.error);
    revalidatePath("/roadmap");
    return { success: true, message: "Card saved" };
  } catch (error) {
    logServerError("admin", "roadmap card save failed", {}, error);
    return fail("generic");
  }
}

/** Moves a card to another column. Audited. */
export async function moveRoadmapCardAction(input: unknown): Promise<AdminActionResult> {
  const actorId = await adminActorId("canManageProducts");
  if (!actorId) return fail("not_admin");
  try {
    const result = await setRoadmapCardStatus(actorId, input);
    if (!result.success) return fail(result.error);
    revalidatePath("/roadmap");
    return { success: true, message: `Moved to ${ROADMAP_STATUS_LABELS[result.data.status]}` };
  } catch (error) {
    logServerError("admin", "roadmap card move failed", {}, error);
    return fail("generic");
  }
}

/** Hides a card from the public page, or shows it again. Audited. */
export async function setRoadmapCardHiddenAction(input: unknown): Promise<AdminActionResult> {
  const actorId = await adminActorId("canManageProducts");
  if (!actorId) return fail("not_admin");
  try {
    const result = await setRoadmapCardHidden(actorId, input);
    if (!result.success) return fail(result.error);
    revalidatePath("/roadmap");
    return { success: true, message: result.data.hidden ? "Card hidden from the roadmap" : "Card shown again" };
  } catch (error) {
    logServerError("admin", "roadmap card hide failed", {}, error);
    return fail("generic");
  }
}
