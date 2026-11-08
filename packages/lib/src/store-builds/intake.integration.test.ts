import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as s from "@workspace/db/schema";
import { createIsolationWorld, type IsolationWorld } from "../stores/isolation.fixtures";
import {
  claimStoreBuildIntake,
  createStoreBuildIntake,
  finalizeStoreBuildIntake,
  isStoreBuildIntakeOpen,
  purgeExpiredStoreBuildIntakes,
  type IntakeStorage,
} from "./intake.server";

/**
 * The hero intake against a real database (F-82d, 0157): the daily IP limit,
 * the upload check, single-use claims and the cleanup. Storage is a fake.
 * Skipped without TEST_DATABASE_URL.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

function fakeStorage(): IntakeStorage & { files: Map<string, Uint8Array> } {
  const files = new Map<string, Uint8Array>();
  return {
    files,
    createSignedUploadUrl: async (path) => ({ path, token: "t", signedUrl: `https://x.test/${path}` }),
    list: async (folder) =>
      [...files.entries()]
        .filter(([path]) => path.startsWith(`${folder}/`))
        .map(([path, bytes]) => ({ name: path.slice(folder.length + 1), size: bytes.byteLength })),
    download: async (path) => files.get(path) ?? new Uint8Array(),
    remove: async (paths) => paths.forEach((path) => files.delete(path)),
    move: async (from, to) => {
      const bytes = files.get(from);
      if (bytes) files.set(to, bytes);
      files.delete(from);
    },
  };
}

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2]);

describe.skipIf(!TEST_DATABASE_URL)("store build intake (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: s });
  const ipHash = `test-${randomUUID()}`;
  let w: IsolationWorld;

  beforeAll(async () => {
    w = await createIsolationWorld(db);
  });

  afterAll(async () => {
    await db.delete(s.storeBuildIntakes).where(eq(s.storeBuildIntakes.ipHash, ipHash));
    await w?.cleanup();
    await client.end();
  });

  it("creates, checks uploads and claims once", async () => {
    const storage = fakeStorage();
    const created = await createStoreBuildIntake({ prompt: "عطور", logo: { type: "png", size: PNG.byteLength } }, { ipHash }, storage, db);
    if (!created.success) throw new Error(created.error);
    expect(created.uploads.map((u) => u.path)).toEqual([`guest/${created.intakeId}/logo.png`]);

    storage.files.set(`guest/${created.intakeId}/logo.png`, PNG);
    const done = await finalizeStoreBuildIntake({ intakeId: created.intakeId, token: created.token }, storage, db);
    expect(done).toMatchObject({ success: true, logoPath: `guest/${created.intakeId}/logo.png` });
    expect(await isStoreBuildIntakeOpen({ intakeId: created.intakeId, token: created.token }, db)).toBe(true);

    const wrong = await claimStoreBuildIntake(
      { intakeId: created.intakeId, token: "B".repeat(43), sellerId: w.a.sellerId, storeId: w.a.a1 },
      storage,
      db,
    );
    expect(wrong).toEqual({ success: false, error: "wrong_token" });

    // Another seller's store is never bound.
    const claim = await claimStoreBuildIntake(
      { intakeId: created.intakeId, token: created.token, sellerId: w.a.sellerId, storeId: w.b.b1 },
      storage,
      db,
    );
    expect(claim).toEqual({ success: true, intakeId: created.intakeId, already: false });
    const [row] = await db.select().from(s.storeBuildIntakes).where(eq(s.storeBuildIntakes.id, created.intakeId));
    expect(row?.sellerId).toBe(w.a.sellerId);
    expect(row?.storeId).toBeNull();
    expect(row?.logoPath).toBe(`${w.a.sellerId}/${created.intakeId}/logo.png`);

    const again = await claimStoreBuildIntake(
      { intakeId: created.intakeId, token: created.token, sellerId: w.b.sellerId, storeId: null },
      storage,
      db,
    );
    expect(again).toEqual({ success: false, error: "claimed" });
    expect(await isStoreBuildIntakeOpen({ intakeId: created.intakeId, token: created.token }, db)).toBe(false);
  });

  it("removes an upload whose bytes don't match its name", async () => {
    const storage = fakeStorage();
    const created = await createStoreBuildIntake({ prompt: "x", logo: { type: "png", size: 20 } }, { ipHash }, storage, db);
    if (!created.success) throw new Error(created.error);
    storage.files.set(`guest/${created.intakeId}/logo.png`, new TextEncoder().encode("<svg><script/></svg>"));
    const done = await finalizeStoreBuildIntake({ intakeId: created.intakeId, token: created.token }, storage, db);
    expect(done).toEqual({ success: false, error: "invalid_file" });
    expect(storage.files.size).toBe(0);
  });

  it("stops at 10 intakes per IP per Cairo day", async () => {
    const storage = fakeStorage();
    const limited = `test-${randomUUID()}`;
    try {
      for (let i = 0; i < 10; i++) {
        const r = await createStoreBuildIntake({ prompt: `p${i}` }, { ipHash: limited }, storage, db);
        expect(r.success).toBe(true);
      }
      expect(await createStoreBuildIntake({ prompt: "p10" }, { ipHash: limited }, storage, db)).toEqual({
        success: false,
        error: "rate_limited",
      });
    } finally {
      await db.delete(s.storeBuildIntakes).where(eq(s.storeBuildIntakes.ipHash, limited));
    }
  });

  it("refuses an expired intake and purges it with its files", async () => {
    const storage = fakeStorage();
    const created = await createStoreBuildIntake({ prompt: "old" }, { ipHash }, storage, db);
    if (!created.success) throw new Error(created.error);
    await db
      .update(s.storeBuildIntakes)
      .set({ expiresAt: new Date(Date.now() - 60_000).toISOString() })
      .where(eq(s.storeBuildIntakes.id, created.intakeId));
    storage.files.set(`guest/${created.intakeId}/logo.png`, PNG);

    const claim = await claimStoreBuildIntake(
      { intakeId: created.intakeId, token: created.token, sellerId: w.a.sellerId, storeId: null },
      storage,
      db,
    );
    expect(claim).toEqual({ success: false, error: "expired" });

    const purged = await purgeExpiredStoreBuildIntakes({ limit: 1000 }, storage, db);
    expect(purged.deleted).toBeGreaterThanOrEqual(1);
    expect(storage.files.has(`guest/${created.intakeId}/logo.png`)).toBe(false);
    const rows = await db.select().from(s.storeBuildIntakes).where(eq(s.storeBuildIntakes.id, created.intakeId));
    expect(rows).toHaveLength(0);
  });
});
