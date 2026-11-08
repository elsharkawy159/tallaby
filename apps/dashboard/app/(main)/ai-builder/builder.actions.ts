"use server";

import { z } from "zod";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { builderEnabled } from "./builder-access.server";
import { toView } from "./builder-chat.server";
import type { BuilderErrorCode, BuilderView } from "./builder.dto";
import { patchFileRow } from "./builder-intake.lib";
import { withCard } from "./builder-questions.lib";
import { loadBuild, saveBuild } from "./builder.store.server";
import { dropIntakeFile, signIntakeFile } from "./builder-chat-v2.server";
import { getStore } from "@workspace/lib/stores/server";
import { getStoreDraftKey } from "@workspace/lib/store-sites/server";
import { signStorePreviewToken, storePreviewSecret } from "@workspace/lib/store-sites/preview";
import { storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";

/**
 * The inline fix of a file row missing a price or stock (ROADMAP.md F-82f):
 * the seller's own figures, never a model's. Only while the conversation is
 * open (the build hasn't run), only on this seller's build: the build id is
 * looked up filtered by the session's seller.
 */

const limiter = createRateLimiter({ limit: 240, windowMs: 60_000 });

const inputSchema = z
  .object({
    buildId: z.uuid(),
    row: z.number().int().min(1).max(20_000),
    patch: z
      .object({
        /** In pounds, as typed ("150", "99.5", "١٥٠"). */
        price: z.union([z.string().max(30), z.number().positive().max(10_000_000)]).nullable().optional(),
        stock: z.number().int().min(0).max(1_000_000).nullable().optional(),
        unlimited: z.boolean().optional(),
      })
      .strict(),
  })
  .strict();

export type UpdateFileRowResult = { ok: true; view: BuilderView } | { ok: false; error: BuilderErrorCode };

export async function updateBuildFileRow(
  buildId: string,
  row: number,
  patch: { price?: string | number | null; stock?: number | null; unlimited?: boolean },
): Promise<UpdateFileRowResult> {
  if (!builderEnabled()) return { ok: false, error: "disabled" };
  const parsed = inputSchema.safeParse({ buildId, row, patch });
  if (!parsed.success) return { ok: false, error: "badInput" };
  let sellerId: string;
  try {
    sellerId = (await requireSeller({ forWrite: true })).sellerId;
  } catch (error) {
    if (isAccessError(error)) return { ok: false, error: "unauthorized" };
    throw error;
  }
  if (!limiter.check(`builder-row:${sellerId}`)) return { ok: false, error: "rateLimited" };

  const build = await loadBuild(sellerId, parsed.data.buildId);
  if (!build || build.status !== "collecting" || build.state.flow !== "v2") return { ok: false, error: "notBuilding" };
  const index = build.state.fileRows.findIndex((r) => r.row === parsed.data.row);
  if (index < 0) return { ok: false, error: "badInput" };
  const next = patchFileRow(build.state.fileRows[index]!, parsed.data.patch);
  if (!next) return { ok: false, error: "invalidAnswer" };

  const fileRows = build.state.fileRows.map((r, i) => (i === index ? next : r));
  const state = withCard({ ...build.state, fileRows });
  await saveBuild(sellerId, build.id, { state });
  return { ok: true, view: toView({ ...build, state }) };
}

// ── The chat page (F-82i) ───────────────────────────────────────────────────

const previewLimiter = createRateLimiter({ limit: 90, windowMs: 10 * 60_000 });
const buildIdSchema = z.uuid();

/** The session seller, or the access error. */
async function sellerFor(): Promise<{ sellerId: string } | { ok: false; error: BuilderErrorCode }> {
  if (!builderEnabled()) return { ok: false, error: "disabled" };
  try {
    return { sellerId: (await requireSeller({ forWrite: true })).sellerId };
  } catch (error) {
    if (isAccessError(error)) return { ok: false, error: "unauthorized" };
    throw error;
  }
}

export type BuilderPreviewResult =
  | {
      ok: true;
      /** The store's address, for the preview's address bar ("oud.tallaby.com"). */
      address: string;
      storeName: string;
      /** What the preview pane shows: the signed draft preview while building, the owner-pass view link once published. Null: nothing to show yet. */
      src: string | null;
      published: boolean;
    }
  | { ok: false; error: BuilderErrorCode };

/**
 * The preview pane's link for this seller's build (F-82i). The store is the
 * build's own (or the one it is bound to), looked up by the session's seller.
 * Published: `/api/stores/<id>/view` (the F-76 owner pass for a locked
 * account). Not yet: a 15-minute signed "Preview on my store" link to the
 * current drafts, only once the build has written them (`withDraft`), so
 * opening the page never makes a site scaffold the build hasn't asked for.
 */
export async function builderPreviewLink(buildId: string, withDraft: boolean): Promise<BuilderPreviewResult> {
  const access = await sellerFor();
  if (!("sellerId" in access)) return access;
  const { sellerId } = access;
  if (!buildIdSchema.safeParse(buildId).success) return { ok: false, error: "badInput" };
  if (!previewLimiter.check(`builder-preview:${sellerId}`)) return { ok: false, error: "rateLimited" };
  const build = await loadBuild(sellerId, buildId);
  const storeId = build?.storeId ?? build?.targetStoreId ?? null;
  if (!build || !storeId) return { ok: false, error: "notBuilding" };
  const store = await getStore(sellerId, storeId);
  if (!store || store.deletedAt) return { ok: false, error: "notBuilding" };

  const customDomain = await findActiveCustomDomainForSubdomain(store.subdomain).catch(() => null);
  const base = storeUrl(store.subdomain, customDomain);
  const address = base.replace(/^https?:\/\//, "");
  const published = store.siteStatus === "published";
  if (published) return { ok: true, address, storeName: store.name, src: `/api/stores/${store.id}/view`, published };
  if (!withDraft || store.status !== "active") return { ok: true, address, storeName: store.name, src: null, published };

  const secret = storePreviewSecret();
  const draftKey = secret ? await getStoreDraftKey(sellerId, store.id) : null;
  if (!secret || !draftKey) return { ok: true, address, storeName: store.name, src: null, published };
  const { token } = signStorePreviewToken({ storeId: store.id, draftKey, secret });
  return { ok: true, address, storeName: store.name, src: `${base}/api/store-preview?token=${encodeURIComponent(token)}`, published };
}

/** A short-lived signed link to the hero intake's product file, for the browser to read (the server never parses it). */
export async function intakeFileLink(buildId: string): Promise<{ ok: true; url: string; name: string } | { ok: false; error: BuilderErrorCode }> {
  const access = await sellerFor();
  if (!("sellerId" in access)) return access;
  const { sellerId } = access;
  if (!buildIdSchema.safeParse(buildId).success) return { ok: false, error: "badInput" };
  if (!limiter.check(`builder-intake-file:${sellerId}`)) return { ok: false, error: "rateLimited" };
  return signIntakeFile(sellerId, buildId);
}

/** The browser couldn't read the intake file: carry on without it. */
export async function skipIntakeFile(buildId: string): Promise<UpdateFileRowResult> {
  const access = await sellerFor();
  if (!("sellerId" in access)) return access;
  const { sellerId } = access;
  if (!buildIdSchema.safeParse(buildId).success) return { ok: false, error: "badInput" };
  const result = await dropIntakeFile(sellerId, buildId);
  return result.ok ? { ok: true, view: toView(result.build) } : result;
}
