"use server";

import { db, eq, shippingAutomation } from "@workspace/db";
import { getTranslations } from "next-intl/server";

import { actionError, type ActionResult } from "@/lib/action-result";
import { requireShippingAdmin } from "@/lib/auth";
import {
  readAutomationSettings,
  runAutoAssign,
  runAutoConfirm,
  type AutomationSettings,
} from "@/lib/automation";
import { revalidateShipping } from "./orders.query";

export async function getAutomationSettings(): Promise<ActionResult<AutomationSettings>> {
  try {
    await requireShippingAdmin();
    return { success: true, data: await readAutomationSettings() };
  } catch (error) {
    return { success: false, error: actionError("getAutomationSettings", error) };
  }
}

export interface AutomationToggleResult extends ActionResult<AutomationSettings> {
  /** How many orders the switch-on sweep acted on, so the toast can say so. */
  affected?: number;
}

/**
 * Switching a toggle on also runs one immediate sweep.
 *
 * Without it the operator turns Auto Confirm on, watches a full Pending tab do
 * nothing, and concludes the feature is broken — the webhook only fires on the
 * *next* order to change. The sweep clears the existing backlog so the toggle's
 * effect is visible straight away.
 */
async function setFlag(
  field: "autoConfirm" | "autoAssign",
  enabled: boolean
): Promise<AutomationToggleResult> {
  const admin = await requireShippingAdmin();

  // The table holds exactly one row (boolean primary key with a CHECK), but the
  // predicate is written out anyway — an UPDATE with no WHERE is the kind of
  // statement that becomes wrong the moment someone changes the schema.
  await db
    .update(shippingAutomation)
    .set({ [field]: enabled, updatedBy: admin.id, updatedAt: new Date().toISOString() })
    .where(eq(shippingAutomation.id, true));

  let affected = 0;

  if (enabled) {
    if (field === "autoConfirm") {
      affected = await runAutoConfirm();
      // A freshly confirmed order is now in the Confirmed stage, so let the
      // other toggle pick it up in the same breath rather than waiting for the
      // webhook round-trip.
      const settings = await readAutomationSettings();
      if (settings.autoAssign) await runAutoAssign();
    } else {
      const outcome = await runAutoAssign();
      affected = outcome.ok ? outcome.assigned : 0;
    }
  }

  revalidateShipping();
  return { success: true, data: await readAutomationSettings(), affected };
}

export async function setAutoConfirm(enabled: boolean): Promise<AutomationToggleResult> {
  try {
    return await setFlag("autoConfirm", enabled);
  } catch (error) {
    const t = await getTranslations("common");
    return { success: false, error: actionError("setAutoConfirm", error) || t("somethingWrong") };
  }
}

export async function setAutoAssign(enabled: boolean): Promise<AutomationToggleResult> {
  try {
    return await setFlag("autoAssign", enabled);
  } catch (error) {
    const t = await getTranslations("common");
    return { success: false, error: actionError("setAutoAssign", error) || t("somethingWrong") };
  }
}
