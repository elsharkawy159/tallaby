"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateCustomDomain } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { applyDomainAdminAction } from "@workspace/lib/admin/server";
import { VercelDomainsError } from "@workspace/lib/storefront/vercel-domains";
import { adminActorId, saasError, type AdminActionResult } from "../_lib/saas-admin.server";

/** Re-check a custom domain with Vercel, or remove it with a logged reason (docs/admin-saas.md §3.7). */
export async function domainAdminAction(input: unknown): Promise<AdminActionResult> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return saasError("not_admin");
  try {
    const result = await applyDomainAdminAction(actorId, input);
    if (!result.success) return saasError(result.error);
    const { domain, subdomain, status, statusChanged } = result.data;
    if (statusChanged && subdomain) {
      await applyInvalidation(invalidateCustomDomain(subdomain, domain), { from: "admin", mode: "action" });
    }
    revalidatePath("/domains");
    if ((input as { action?: string }).action === "remove_domain") {
      return { success: true, message: `${domain} removed and logged` };
    }
    return { success: true, message: `${domain}: ${status ?? "checked"}` };
  } catch (error) {
    if (error instanceof VercelDomainsError) {
      return {
        success: false,
        error:
          error.code === "config"
            ? "Vercel is not configured for the admin app (STOREFRONT_VERCEL_* env vars)."
            : `Vercel refused the request (${error.code}).`,
      };
    }
    logServerError("admin", "domain action failed", {}, error);
    return saasError("generic");
  }
}
