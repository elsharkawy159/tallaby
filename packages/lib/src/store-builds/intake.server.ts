import { createHash, createHmac, randomBytes } from "node:crypto";
import { and, db, eq, isNull, lt, sql, storeBuildIntakes, stores } from "@workspace/db";
import { getServiceClient } from "@workspace/db/supabase/service";
import {
  bytesMatchType,
  claimedIntakePath,
  decideIntakeClaim,
  guestIntakeFolder,
  guestIntakePath,
  INTAKE_CONTENT_TYPES,
  intakeByteLimit,
  intakeCreateSchema,
  intakeIsOpen,
  intakeRefSchema,
  isIntakeId,
  isOverDailyIntakeLimit,
  parseIntakeObjectName,
  STORE_BUILD_INTAKE_BUCKET,
  type IntakeClaimError,
  type IntakeObjectKind,
  type IntakeObjectType,
} from "./intake.lib";

/**
 * Server side of the hero composer's intake (ROADMAP.md F-82d, 0157). Used by
 * the ecommerce intake routes and signup, and by the dashboard claim route.
 * Every function takes the raw token from its caller and compares hashes; the
 * seller id always comes from the caller's session, never from the client.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

export const hashIntakeToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newIntakeToken = () => randomBytes(32).toString("base64url");

/**
 * Salted hash of the visitor's IP for the daily limit (never the address
 * itself), or null when there is no salt or no address.
 */
export function hashIntakeIp(ip: string | null | undefined): string | null {
  const salt = process.env.STORE_BUILD_IP_SALT || process.env.FORM_IP_HASH_SALT || process.env.INTERNAL_API_SECRET;
  if (!salt || !ip || ip === "unknown") return null;
  return createHmac("sha256", salt).update(`store-build:${ip}`).digest("hex");
}

// ── Storage (the private bucket, service role) ───────────────────────────────

export type IntakeStoredObject = { name: string; size: number | null };

/** The bucket operations the intake needs; tests pass a fake. */
export type IntakeStorage = {
  createSignedUploadUrl: (path: string) => Promise<{ path: string; token: string; signedUrl: string }>;
  list: (folder: string) => Promise<IntakeStoredObject[]>;
  download: (path: string) => Promise<Uint8Array>;
  remove: (paths: string[]) => Promise<void>;
  move: (from: string, to: string) => Promise<void>;
};

export function serviceIntakeStorage(): IntakeStorage {
  const bucket = () => getServiceClient().storage.from(STORE_BUILD_INTAKE_BUCKET);
  return {
    async createSignedUploadUrl(path) {
      const { data, error } = await bucket().createSignedUploadUrl(path);
      if (error || !data) throw new Error(`intake upload url: ${error?.message ?? "no data"}`);
      return { path: data.path, token: data.token, signedUrl: data.signedUrl };
    },
    async list(folder) {
      const { data, error } = await bucket().list(folder, { limit: 20 });
      if (error) throw new Error(`intake list: ${error.message}`);
      return (data ?? [])
        .filter((item) => item.id !== null)
        .map((item) => ({ name: item.name, size: typeof item.metadata?.size === "number" ? item.metadata.size : null }));
    },
    async download(path) {
      const { data, error } = await bucket().download(path);
      if (error || !data) throw new Error(`intake download: ${error?.message ?? "no data"}`);
      return new Uint8Array(await data.arrayBuffer());
    },
    async remove(paths) {
      if (paths.length === 0) return;
      const { error } = await bucket().remove(paths);
      if (error) throw new Error(`intake remove: ${error.message}`);
    },
    async move(from, to) {
      const { error } = await bucket().move(from, to);
      if (error) throw new Error(`intake move: ${error.message}`);
    },
  };
}

// ── Create ───────────────────────────────────────────────────────────────────

export type IntakeUpload = { kind: IntakeObjectKind; path: string; token: string; signedUrl: string; contentType: string };

export type CreateIntakeResult =
  | { success: true; intakeId: string; token: string; uploads: IntakeUpload[] }
  | { success: false; error: "invalid_input" | "rate_limited" };

/**
 * Saves the intake row and signs one upload URL per declared file. The daily
 * limit (10 per IP hash per Cairo day) is counted under a per-IP advisory
 * lock, so parallel requests can't pass it together. Without an IP hash only
 * the caller's burst limiter applies.
 */
export async function createStoreBuildIntake(
  input: unknown,
  meta: { ipHash: string | null },
  storage: IntakeStorage = serviceIntakeStorage(),
  q: Queryable = db,
): Promise<CreateIntakeResult> {
  const parsed = intakeCreateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const value = parsed.data;
  const token = newIntakeToken();

  const intakeId = await q.transaction(async (tx) => {
    if (meta.ipHash) {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`store-build-intake:${meta.ipHash}`}, 0))`);
      const [row] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(storeBuildIntakes)
        .where(
          and(
            eq(storeBuildIntakes.ipHash, meta.ipHash),
            sql`${storeBuildIntakes.createdAt} >= (date_trunc('day', now() AT TIME ZONE 'Africa/Cairo') AT TIME ZONE 'Africa/Cairo')`,
          ),
        );
      if (isOverDailyIntakeLimit(Number(row?.n ?? 0))) return null;
    }
    const [row] = await tx
      .insert(storeBuildIntakes)
      .values({
        tokenHash: hashIntakeToken(token),
        prompt: value.prompt,
        primaryColor: value.primaryColor ? value.primaryColor.toLowerCase() : null,
        locale: value.locale,
        ipHash: meta.ipHash,
        fileSummary: value.fileSummary ?? {},
      })
      .returning({ id: storeBuildIntakes.id });
    return row!.id;
  });
  if (!intakeId) return { success: false, error: "rate_limited" };

  const wanted: { kind: IntakeObjectKind; type: IntakeObjectType }[] = [];
  if (value.file) wanted.push({ kind: "file", type: value.file.type });
  if (value.logo) wanted.push({ kind: "logo", type: value.logo.type });
  const uploads = await Promise.all(
    wanted.map(async ({ kind, type }) => {
      const signed = await storage.createSignedUploadUrl(guestIntakePath(intakeId, kind, type));
      return { kind, ...signed, contentType: INTAKE_CONTENT_TYPES[type] };
    }),
  );
  return { success: true, intakeId, token, uploads };
}

// ── Finish the uploads ───────────────────────────────────────────────────────

async function loadIntake(q: Queryable, intakeId: string) {
  const [row] = await q
    .select({
      id: storeBuildIntakes.id,
      tokenHash: storeBuildIntakes.tokenHash,
      sellerId: storeBuildIntakes.sellerId,
      claimedAt: storeBuildIntakes.claimedAt,
      expiresAt: storeBuildIntakes.expiresAt,
      createdAt: storeBuildIntakes.createdAt,
      logoPath: storeBuildIntakes.logoPath,
      filePath: storeBuildIntakes.filePath,
    })
    .from(storeBuildIntakes)
    .where(eq(storeBuildIntakes.id, intakeId))
    .limit(1);
  return row ?? null;
}

export type FinalizeIntakeResult =
  | { success: true; intakeId: string; filePath: string | null; logoPath: string | null }
  | { success: false; error: "invalid_input" | "not_found" | "invalid_file" };

/**
 * Checks what the browser uploaded into `guest/<intakeId>/` and records it.
 * Each object must be one we signed, within its size limit, and its first
 * bytes must match its type (a script renamed .png fails). Anything wrong
 * removes every object of the intake.
 */
export async function finalizeStoreBuildIntake(
  ref: unknown,
  storage: IntakeStorage = serviceIntakeStorage(),
  q: Queryable = db,
  now = Date.now(),
): Promise<FinalizeIntakeResult> {
  const parsed = intakeRefSchema.safeParse(ref);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { intakeId, token } = parsed.data;
  const row = await loadIntake(q, intakeId);
  if (!intakeIsOpen(row, hashIntakeToken(token), now)) return { success: false, error: "not_found" };

  const folder = guestIntakeFolder(intakeId);
  const objects = await storage.list(folder);
  const paths: Record<IntakeObjectKind, string | null> = { file: null, logo: null };
  let bad = false;
  for (const object of objects) {
    const parsedName = parseIntakeObjectName(object.name);
    const path = `${folder}/${object.name}`;
    if (!parsedName || paths[parsedName.kind]) {
      bad = true;
      break;
    }
    const limit = intakeByteLimit(parsedName.kind);
    if (object.size !== null && object.size > limit) {
      bad = true;
      break;
    }
    const bytes = await storage.download(path);
    if (bytes.byteLength > limit || !bytesMatchType(parsedName.type, bytes)) {
      bad = true;
      break;
    }
    paths[parsedName.kind] = path;
  }
  if (bad) {
    await storage.remove(objects.map((object) => `${folder}/${object.name}`));
    await q.update(storeBuildIntakes).set({ filePath: null, logoPath: null }).where(eq(storeBuildIntakes.id, intakeId));
    return { success: false, error: "invalid_file" };
  }

  await q
    .update(storeBuildIntakes)
    .set({ filePath: paths.file, logoPath: paths.logo })
    .where(and(eq(storeBuildIntakes.id, intakeId), isNull(storeBuildIntakes.claimedAt)));
  return { success: true, intakeId, filePath: paths.file, logoPath: paths.logo };
}

/** The token opens an unclaimed, unexpired intake (checked before signup carries it). */
export async function isStoreBuildIntakeOpen(ref: unknown, q: Queryable = db, now = Date.now()): Promise<boolean> {
  const parsed = intakeRefSchema.safeParse(ref);
  if (!parsed.success) return false;
  return intakeIsOpen(await loadIntake(q, parsed.data.intakeId), hashIntakeToken(parsed.data.token), now);
}

// ── Claim ────────────────────────────────────────────────────────────────────

export type ClaimIntakeResult =
  | { success: true; intakeId: string; already: boolean }
  | { success: false; error: IntakeClaimError | "invalid_input" };

/**
 * Gives the intake to `sellerId` (the caller's session seller). `storeId` is
 * the store created at signup, kept only when it belongs to that seller; null
 * lets the builder create one. The row is locked, so a token claims once.
 * The files then move from `guest/<id>/` to `<sellerId>/<id>/` (best effort:
 * on failure the row keeps the guest paths, which still work).
 */
export async function claimStoreBuildIntake(
  params: { intakeId: unknown; token: unknown; sellerId: string; storeId: string | null; maxAgeMs?: number },
  storage: IntakeStorage | null = serviceIntakeStorage(),
  q: Queryable = db,
): Promise<ClaimIntakeResult> {
  const parsed = intakeRefSchema.safeParse({ intakeId: params.intakeId, token: params.token });
  if (!parsed.success || !isIntakeId(params.sellerId)) return { success: false, error: "invalid_input" };
  const { intakeId, token } = parsed.data;
  const tokenHash = hashIntakeToken(token);

  const outcome = await q.transaction(async (tx) => {
    const [row] = await tx
      .select({
        tokenHash: storeBuildIntakes.tokenHash,
        sellerId: storeBuildIntakes.sellerId,
        claimedAt: storeBuildIntakes.claimedAt,
        expiresAt: storeBuildIntakes.expiresAt,
        createdAt: storeBuildIntakes.createdAt,
        logoPath: storeBuildIntakes.logoPath,
        filePath: storeBuildIntakes.filePath,
      })
      .from(storeBuildIntakes)
      .where(eq(storeBuildIntakes.id, intakeId))
      .for("update")
      .limit(1);
    const decision = decideIntakeClaim(row, tokenHash, params.sellerId, Date.now(), params.maxAgeMs);
    if (!decision.ok || decision.already) return { decision, row };

    let storeId: string | null = null;
    if (params.storeId && isIntakeId(params.storeId)) {
      const [own] = await tx
        .select({ id: stores.id })
        .from(stores)
        .where(and(eq(stores.id, params.storeId), eq(stores.sellerId, params.sellerId)))
        .limit(1);
      storeId = own?.id ?? null;
    }
    await tx
      .update(storeBuildIntakes)
      .set({ sellerId: params.sellerId, storeId, claimedAt: sql`now()` })
      .where(eq(storeBuildIntakes.id, intakeId));
    return { decision, row };
  });

  if (!outcome.decision.ok) return { success: false, error: outcome.decision.error };
  if (outcome.decision.already || !storage) return { success: true, intakeId, already: outcome.decision.already };

  const moved: { filePath?: string; logoPath?: string } = {};
  for (const key of ["filePath", "logoPath"] as const) {
    const from = outcome.row?.[key];
    const to = from ? claimedIntakePath(params.sellerId, from) : null;
    if (!from || !to) continue;
    try {
      await storage.move(from, to);
      moved[key] = to;
    } catch (error) {
      console.error("[store-build intake] move failed", { intakeId, key, error: error instanceof Error ? error.message : String(error) });
    }
  }
  if (moved.filePath || moved.logoPath) {
    await q.update(storeBuildIntakes).set(moved).where(eq(storeBuildIntakes.id, intakeId));
  }
  return { success: true, intakeId, already: false };
}

// ── Cleanup ──────────────────────────────────────────────────────────────────

/**
 * Deletes expired, unclaimed intakes and their files, oldest first. A row
 * whose files can't be removed is kept for the next run. Idempotent.
 */
export async function purgeExpiredStoreBuildIntakes(
  options: { limit?: number } = {},
  storage: IntakeStorage = serviceIntakeStorage(),
  q: Queryable = db,
): Promise<{ deleted: number; failed: number }> {
  const limit = Math.min(Math.max(options.limit ?? 200, 1), 1000);
  const rows = await q
    .select({ id: storeBuildIntakes.id })
    .from(storeBuildIntakes)
    .where(and(isNull(storeBuildIntakes.claimedAt), lt(storeBuildIntakes.expiresAt, sql`now()`)))
    .orderBy(storeBuildIntakes.expiresAt)
    .limit(limit);

  let deleted = 0;
  let failed = 0;
  for (const { id } of rows) {
    try {
      const folder = guestIntakeFolder(id);
      const objects = await storage.list(folder);
      await storage.remove(objects.map((object) => `${folder}/${object.name}`));
      await q.delete(storeBuildIntakes).where(and(eq(storeBuildIntakes.id, id), isNull(storeBuildIntakes.claimedAt)));
      deleted++;
    } catch (error) {
      failed++;
      console.error("[store-build intake] purge failed", { id, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return { deleted, failed };
}
