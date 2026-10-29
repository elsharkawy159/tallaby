"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStorefront } from "@workspace/cache";
import { db } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { ADMIN_DEFAULT_REASON, type AdminAuditAction } from "@workspace/lib/admin";
import { auditStoreSite, markSiteEditedByAdmin, resolveStoreForAdmin, type AdminStoreRef } from "@workspace/lib/admin/server";
import { saveStoreDesignSystem } from "@workspace/lib/store-sites/server";
import { getStore, updateStoreSeo, updateStoreSettings, updateStoreSocialLinks } from "@workspace/lib/stores/server";
import { adminActorId } from "@/app/(dashboard)/_lib/saas-admin.server";
import { publish } from "@/app/(builder)/stores/[storeId]/editor/admin-store-editor.server";
import type { Queryable } from "@/app/(builder)/stores/[storeId]/editor/admin-store-editor.data";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { toDetailsPatch, toSocialPayload, type DesignValues, type DetailsValues, type SeoValues, type SiteSettingsResult, type SocialRow } from "./site-settings.dto";

/**
 * The store page's Website settings (store details, brand, social, SEO).
 * Each save:
 *   1. needs an admin / super_admin session (canManageUsers),
 *   2. resolves the store and its real seller from the store id in the
 *      database, inside the transaction (nothing from the client),
 *   3. runs the SAME lib function and schema as the seller's dashboard with
 *      that sellerId, and writes one admin_audit_log row in the same
 *      transaction (before/after), so a failed save writes no audit row.
 * Details, social and SEO are live at once (the storefront profile cache is
 * invalidated); the brand design goes to the drafts like the seller's
 * Website › Design, and is live after a publish.
 */

const limiter = createRateLimiter({ limit: 60, windowMs: 10 * 60_000 });

const ERRORS: Record<string, string> = {
  not_found: "Only admins can do this, or the store no longer exists.",
  store_read_only: "This store is archived or suspended, so it cannot be changed.",
  invalid_input: "Some values are not valid. Check the highlighted fields and try again.",
  invalid_content: "The design values are not valid. Reload the page and try again.",
  version_conflict: "Someone changed the design while you were editing. Reload the page to get their changes, then edit again.",
  rate_limited: "Too many changes in a short time. Try again in a few minutes.",
  generic: "Something went wrong. Try again.",
};

class Rollback extends Error {
  constructor(readonly code: string) {
    super("rollback");
  }
}

type Change<T> = { data: T; before: Record<string, unknown>; after: Record<string, unknown> };

async function auditedStoreWrite<T>(
  storeId: unknown,
  action: AdminAuditAction,
  message: string,
  run: (tx: Queryable, ref: AdminStoreRef) => Promise<Change<T>>,
  after?: (ref: AdminStoreRef) => Promise<void>,
): Promise<SiteSettingsResult<T>> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return { success: false, error: ERRORS.not_found! };
  if (!limiter.check(`admin-site-settings:${actorId}`)) return { success: false, error: ERRORS.rate_limited! };
  const id = String(storeId);
  try {
    const { data, ref } = await db.transaction(async (tx) => {
      const ref = await resolveStoreForAdmin(actorId, id, tx);
      if (!ref) throw new Rollback("not_found");
      const change = await run(tx, ref);
      await auditStoreSite(tx, {
        actorId,
        sellerId: ref.sellerId,
        storeId: ref.storeId,
        action,
        before: change.before,
        after: change.after,
        reason: ADMIN_DEFAULT_REASON,
      });
      return { data: change.data, ref };
    });
    // A committed save is never reported as failed because a cache step broke.
    try {
      if (after) await after(ref);
      revalidatePath(`/stores/${ref.storeId}`);
    } catch (error) {
      logServerError("admin", `${action} after commit failed`, { storeId: id }, error);
    }
    return { success: true, message, data };
  } catch (error) {
    if (error instanceof Rollback) return { success: false, error: ERRORS[error.code] ?? ERRORS.generic! };
    if ((error as { code?: string } | null)?.code === "not_admin") return { success: false, error: ERRORS.not_found! };
    logServerError("admin", `${action} failed`, { storeId: id }, error);
    return { success: false, error: ERRORS.generic! };
  }
}

const refreshStorefront = (ref: AdminStoreRef) =>
  applyInvalidation(invalidateStorefront([ref.subdomain]), { from: "admin", mode: "action" });

/** Name, description, category, logo/favicon/banner, contact, languages and currency. Live at once. */
export async function saveStoreDetailsAction(storeId: string, values: DetailsValues): Promise<SiteSettingsResult> {
  return auditedStoreWrite(
    storeId,
    "update_store_details",
    "Store details saved. Visitors see them now.",
    async (tx, ref) => {
      const before = await getStore(ref.sellerId, ref.storeId, tx);
      if (!before) throw new Rollback("not_found");
      const patch = toDetailsPatch(values);
      const result = await updateStoreSettings(ref.sellerId, ref.storeId, patch as never, tx);
      if (!result.success) throw new Rollback(result.error);
      return {
        data: null,
        before: {
          name: before.name,
          description: before.description,
          storeCategory: before.storeCategory,
          storeCategoryAr: before.storeCategoryAr,
          logoUrl: before.logoUrl,
          faviconUrl: before.faviconUrl,
          bannerUrl: before.bannerUrl,
          contact: before.contact,
          defaultLocale: before.defaultLocale,
          supportedLocales: before.supportedLocales,
          settings: before.settings,
        },
        after: patch,
      };
    },
    refreshStorefront,
  );
}

/** stores.contact.social. Live at once. */
export async function saveStoreSocialAction(storeId: string, rows: SocialRow[]): Promise<SiteSettingsResult> {
  return auditedStoreWrite(
    storeId,
    "update_store_social",
    "Social links saved. Visitors see them now.",
    async (tx, ref) => {
      const before = await getStore(ref.sellerId, ref.storeId, tx);
      if (!before) throw new Rollback("not_found");
      const result = await updateStoreSocialLinks(ref.sellerId, ref.storeId, toSocialPayload(Array.isArray(rows) ? rows : []), tx);
      if (!result.success) throw new Rollback(result.error);
      return {
        data: null,
        before: { social: (before.contact as { social?: unknown } | null)?.social ?? [] },
        after: { social: result.data.links },
      };
    },
    refreshStorefront,
  );
}

/** stores.seo. Live at once. */
export async function saveStoreSeoAction(storeId: string, values: SeoValues): Promise<SiteSettingsResult> {
  return auditedStoreWrite(
    storeId,
    "update_store_seo",
    "SEO settings saved. Search engines pick them up on their next visit.",
    async (tx, ref) => {
      const before = await getStore(ref.sellerId, ref.storeId, tx);
      if (!before) throw new Rollback("not_found");
      const result = await updateStoreSeo(
        ref.sellerId,
        ref.storeId,
        {
          titleTemplate: values?.titleTemplate ?? "",
          description: values?.description ?? "",
          shareImageUrl: values?.shareImageUrl ?? "",
          indexing: values?.indexing !== false,
          googleSiteVerification: values?.googleSiteVerification ?? "",
        },
        tx,
      );
      if (!result.success) throw new Rollback(result.error);
      return { data: null, before: { seo: before.seo }, after: { seo: result.data } };
    },
    refreshStorefront,
  );
}

/**
 * Colours, fonts, corners and layout into the design-system DRAFT (optimistic
 * version, like the editor). With `publishNow` on a live site, the drafts are
 * then published (audited separately by the editor's publish).
 */
export async function saveStoreDesignAction(
  storeId: string,
  design: DesignValues,
  version: number,
  publishNow = false,
): Promise<SiteSettingsResult<{ version: number }>> {
  const saved = await auditedStoreWrite(
    storeId,
    "update_store_design",
    "Brand design saved to the drafts. Publish to show it to visitors.",
    async (tx, ref) => {
      const result = await saveStoreDesignSystem(ref.sellerId, ref.storeId, design, Number(version), tx);
      if (!result.success) throw new Rollback(result.error === "version_conflict" ? "version_conflict" : result.error);
      // The seller's open editor then shows the "admin updated" notice.
      await markSiteEditedByAdmin(ref.storeId, tx);
      return { data: result.data, before: { version: Number(version) }, after: { version: result.data.version, design } };
    },
  );
  if (!saved.success || !publishNow) return saved;
  const published = await publish(String(storeId), ADMIN_DEFAULT_REASON);
  if (!published.success) {
    return {
      success: true,
      data: saved.data,
      message: "Brand design saved to the drafts, but publishing failed. Publish it from the editor.",
    };
  }
  revalidatePath(`/stores/${storeId}`);
  return { success: true, data: saved.data, message: "Brand design saved and published. Visitors see it now." };
}
