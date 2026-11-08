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
