import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as s from "@workspace/db/schema";
import { createIsolationWorld, type IsolationWorld } from "../stores/isolation.fixtures";
import { MEDIA_MAX_BYTES } from "./media.lib";
import {
  countMediaUsage,
  createMediaFolder,
  deleteMediaAsset,
  deleteMediaFolder,
  getMediaAsset,
  listMediaLibrary,
  recordMediaAsset,
  renameMediaFolder,
  updateMediaAsset,
} from "./server";

/**
 * Media library (PLAN.md P4-09) and tenant isolation test 12 (§17): seller A
 * cannot upload into B's Storage folder, nor list, record ("attach"), move or
 * delete B's assets, nor reach A2's per-store assets while working in A1.
 * Storage objects are simulated as storage.objects rows (what the Storage API
 * writes); the RLS part runs the real bucket policies as the `authenticated`
 * role. Everything is rolled back or deleted. Skipped without TEST_DATABASE_URL.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("media library (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: s });
  let w: IsolationWorld;
  const noRemove = vi.fn(async () => {});

  const path = (sellerId: string, scope: string, ext = "png") => `${sellerId}/${scope}/${randomUUID()}.${ext}`;

  /** What a Storage API upload leaves behind. */
  async function putObject(name: string, size = 1234, mimetype = "image/png") {
    await client`
      INSERT INTO storage.objects (bucket_id, name, metadata)
      VALUES ('store-media', ${name}, ${client.json({ size, mimetype })})`;
    return name;
  }

  async function removeTestObjects() {
    await client.begin(async (tx) => {
      await tx`SELECT set_config('storage.allow_delete_query', 'true', true)`;
      await tx`DELETE FROM storage.objects WHERE bucket_id = 'store-media' AND (name LIKE ${`${w.a.sellerId}/%`} OR name LIKE ${`${w.b.sellerId}/%`})`;
    });
  }

  beforeAll(async () => {
    w = await createIsolationWorld(db);
  }, 60_000);

  afterAll(async () => {
    if (w) {
      await removeTestObjects();
      await w.cleanup(); // media rows cascade from sellers
    }
    await client.end();
  });

  describe("12. Storage policies (P1-06 acceptance, as the authenticated role)", () => {
    /** Runs `fn` as the Storage API would for a signed-in user, then rolls back. */
    async function asUser<T>(userId: string, fn: (tx: postgres.TransactionSql) => Promise<T>): Promise<T> {
      let result: T;
      const rollback = new Error("rollback");
      await client
        .begin(async (tx) => {
          await tx`SELECT set_config('request.jwt.claims', ${JSON.stringify({ sub: userId, role: "authenticated" })}, true)`;
          await tx`SET LOCAL ROLE authenticated`;
          result = await fn(tx);
          throw rollback;
        })
        .catch((error) => {
          if (error !== rollback) throw error;
        });
      return result!;
    }

    it("A can upload into store-media/{A}/…", async () => {
      const rows = await asUser(w.a.sellerId, (tx) =>
        tx`INSERT INTO storage.objects (bucket_id, name) VALUES ('store-media', ${path(w.a.sellerId, "shared")}) RETURNING id`,
      );
      expect(rows).toHaveLength(1);
    });

    it("A cannot upload into store-media/{B}/…", async () => {
      await expect(
        asUser(w.a.sellerId, (tx) => tx`INSERT INTO storage.objects (bucket_id, name) VALUES ('store-media', ${path(w.b.sellerId, "shared")})`),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(
        asUser(w.a.sellerId, (tx) => tx`INSERT INTO storage.objects (bucket_id, name) VALUES ('store-media', ${path(w.b.sellerId, w.b.b1)})`),
      ).rejects.toMatchObject({ code: "42501" });
    });

    it("A cannot read, overwrite or delete B's objects", async () => {
      const bObject = await putObject(path(w.b.sellerId, "shared"));
      const counts = await asUser(w.a.sellerId, async (tx) => {
        await tx`SELECT set_config('storage.allow_delete_query', 'true', true)`;
        const read = await tx`SELECT id FROM storage.objects WHERE bucket_id = 'store-media' AND name = ${bObject}`;
        const updated = await tx`UPDATE storage.objects SET metadata = '{}' WHERE bucket_id = 'store-media' AND name = ${bObject} RETURNING id`;
        const deleted = await tx`DELETE FROM storage.objects WHERE bucket_id = 'store-media' AND name = ${bObject} RETURNING id`;
        return { read: read.length, updated: updated.length, deleted: deleted.length };
      });
      expect(counts).toEqual({ read: 0, updated: 0, deleted: 0 });
      const [still] = await client`SELECT metadata FROM storage.objects WHERE bucket_id = 'store-media' AND name = ${bObject}`;
      expect(still?.metadata).toMatchObject({ size: 1234 });
    });

    it("anonymous users cannot upload at all", async () => {
      await expect(
        client.begin(async (tx) => {
          await tx`SET LOCAL ROLE anon`;
          await tx`INSERT INTO storage.objects (bucket_id, name) VALUES ('store-media', ${path(w.a.sellerId, "shared")})`;
        }),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });

  describe("12. Data access isolation", () => {
    const ids = { shared: "", a1: "", a2: "", b: "" };
    const paths = { shared: "", a1: "", a2: "", b: "" };

    beforeAll(async () => {
      paths.shared = await putObject(path(w.a.sellerId, "shared"));
      paths.a1 = await putObject(path(w.a.sellerId, w.a.a1, "webp"), 2048, "image/webp");
      paths.a2 = await putObject(path(w.a.sellerId, w.a.a2));
      paths.b = await putObject(path(w.b.sellerId, "shared"));
      const rec = async (sellerId: string, storeId: string, storagePath: string) => {
        const r = await recordMediaAsset(sellerId, storeId, { storagePath, filename: "f.png" }, db);
        if (!r.success) throw new Error(`record failed: ${r.error}`);
        return r.data.id;
      };
      ids.shared = await rec(w.a.sellerId, w.a.a1, paths.shared);
      ids.a1 = await rec(w.a.sellerId, w.a.a1, paths.a1);
      ids.a2 = await rec(w.a.sellerId, w.a.a2, paths.a2);
      ids.b = await rec(w.b.sellerId, w.b.b1, paths.b);
    });

    it("records size and type from Storage, scope from the path; recording twice is idempotent", async () => {
      const a1 = await getMediaAsset(w.a.sellerId, w.a.a1, ids.a1, db);
      expect(a1).toMatchObject({ storeId: w.a.a1, bytes: 2048, mimeType: "image/webp" });
      expect((await getMediaAsset(w.a.sellerId, w.a.a1, ids.shared, db))?.storeId).toBeNull();
      const again = await recordMediaAsset(w.a.sellerId, w.a.a1, { storagePath: paths.a1, filename: "again.webp" }, db);
      expect(again.success && again.data.id).toBe(ids.a1);
    });

    it("A cannot record ('attach') B's object or A2's object through A1", async () => {
      expect(await recordMediaAsset(w.a.sellerId, w.a.a1, { storagePath: paths.b, filename: "x.png" }, db)).toEqual({
        success: false,
        error: "foreign_path",
      });
      const a2Other = await putObject(path(w.a.sellerId, w.a.a2));
      expect(await recordMediaAsset(w.a.sellerId, w.a.a1, { storagePath: a2Other, filename: "x.png" }, db)).toEqual({
        success: false,
        error: "wrong_store",
      });
      // A naming B's store in both the path and the store id: the store is not A's.
      const intoB1 = await putObject(path(w.a.sellerId, w.b.b1));
      expect(await recordMediaAsset(w.a.sellerId, w.b.b1, { storagePath: intoB1, filename: "x.png" }, db)).toEqual({
        success: false,
        error: "not_found",
      });
    });

    it("refuses missing objects, wrong types (SVG) and oversized files", async () => {
      const missing = path(w.a.sellerId, "shared");
      expect((await recordMediaAsset(w.a.sellerId, w.a.a1, { storagePath: missing, filename: "x.png" }, db)).success).toBe(false);
      const svg = await putObject(path(w.a.sellerId, "shared"), 100, "image/svg+xml");
      expect(await recordMediaAsset(w.a.sellerId, w.a.a1, { storagePath: svg, filename: "x.png" }, db)).toEqual({ success: false, error: "invalid_type" });
      const big = await putObject(path(w.a.sellerId, "shared"), MEDIA_MAX_BYTES + 1);
      expect(await recordMediaAsset(w.a.sellerId, w.a.a1, { storagePath: big, filename: "x.png" }, db)).toEqual({ success: false, error: "too_large" });
    });

    it("A1 lists its own and shared assets, never A2's or B's; foreign stores list nothing", async () => {
      const lib = await listMediaLibrary(w.a.sellerId, w.a.a1, {}, db);
      const listed = lib!.assets.map((a) => a.id);
      expect(listed).toEqual(expect.arrayContaining([ids.shared, ids.a1]));
      expect(listed).not.toContain(ids.a2);
      expect(listed).not.toContain(ids.b);
      expect((await listMediaLibrary(w.a.sellerId, w.a.a1, { scope: "store" }, db))!.assets.map((a) => a.id)).toEqual([ids.a1]);
      expect((await listMediaLibrary(w.a.sellerId, w.a.a1, { scope: "shared" }, db))!.assets.map((a) => a.id)).toEqual([ids.shared]);
      expect(await listMediaLibrary(w.b.sellerId, w.a.a1, {}, db)).toBeNull();
      expect(await listMediaLibrary(w.a.sellerId, w.b.b1, {}, db)).toBeNull();
    });

    it("B cannot read, edit or delete A's assets; A1 cannot reach A2's", async () => {
      expect(await getMediaAsset(w.b.sellerId, w.b.b1, ids.shared, db)).toBeNull();
      expect(await getMediaAsset(w.a.sellerId, w.a.a1, ids.a2, db)).toBeNull();
      expect(await updateMediaAsset(w.b.sellerId, w.b.b1, ids.a1, { altText: { ar: "x" } }, db)).toEqual({ success: false, error: "not_found" });
      expect(await updateMediaAsset(w.a.sellerId, w.a.a1, ids.a2, { altText: { ar: "x" } }, db)).toEqual({ success: false, error: "not_found" });
      expect(await deleteMediaAsset(w.b.sellerId, w.b.b1, ids.shared, noRemove, db)).toEqual({ success: false, error: "not_found" });
      expect(await deleteMediaAsset(w.a.sellerId, w.a.a1, ids.a2, noRemove, db)).toEqual({ success: false, error: "not_found" });
      expect(await deleteMediaAsset(w.a.sellerId, w.a.a1, ids.b, noRemove, db)).toEqual({ success: false, error: "not_found" });
      expect(noRemove).not.toHaveBeenCalled();
      // A shared asset is the seller's: visible from A2 too.
      expect(await getMediaAsset(w.a.sellerId, w.a.a2, ids.shared, db)).not.toBeNull();
    });

    it("folders keep their scope and owner", async () => {
      const a1Folder = await createMediaFolder(w.a.sellerId, w.a.a1, { name: "A1 banners", shared: false }, db);
      const a2Folder = await createMediaFolder(w.a.sellerId, w.a.a2, { name: "A2", shared: false }, db);
      const sharedFolder = await createMediaFolder(w.a.sellerId, w.a.a1, { name: "Logos", shared: true }, db);
      const bFolder = await createMediaFolder(w.b.sellerId, w.b.b1, { name: "B", shared: true }, db);
      if (!a1Folder.success || !a2Folder.success || !sharedFolder.success || !bFolder.success) throw new Error("folder fixture");

      const folderIds = (await listMediaLibrary(w.a.sellerId, w.a.a1, {}, db))!.folders.map((f) => f.id);
      expect(folderIds).toEqual(expect.arrayContaining([a1Folder.data.id, sharedFolder.data.id]));
      expect(folderIds).not.toContain(a2Folder.data.id);
      expect(folderIds).not.toContain(bFolder.data.id);

      const move = (assetId: string, folderId: string) => updateMediaAsset(w.a.sellerId, w.a.a1, assetId, { folderId }, db);
      expect(await move(ids.a1, a2Folder.data.id)).toEqual({ success: false, error: "invalid_folder" });
      expect(await move(ids.a1, bFolder.data.id)).toEqual({ success: false, error: "invalid_folder" });
      expect(await move(ids.a1, sharedFolder.data.id)).toEqual({ success: false, error: "invalid_folder" }); // store file ≠ shared folder
      expect(await move(ids.shared, a1Folder.data.id)).toEqual({ success: false, error: "invalid_folder" });
      expect((await move(ids.a1, a1Folder.data.id)).success).toBe(true);
      expect((await move(ids.shared, sharedFolder.data.id)).success).toBe(true);
      expect((await listMediaLibrary(w.a.sellerId, w.a.a1, { folderId: a1Folder.data.id }, db))!.assets.map((a) => a.id)).toEqual([ids.a1]);

      expect(await createMediaFolder(w.b.sellerId, w.b.b1, { name: "x", shared: true, parentId: sharedFolder.data.id }, db)).toEqual({
        success: false,
        error: "invalid_folder",
      });
      expect(await renameMediaFolder(w.b.sellerId, w.b.b1, sharedFolder.data.id, "mine", db)).toEqual({ success: false, error: "not_found" });
      expect(await renameMediaFolder(w.a.sellerId, w.a.a1, a2Folder.data.id, "mine", db)).toEqual({ success: false, error: "not_found" });
      expect(await deleteMediaFolder(w.b.sellerId, w.b.b1, a1Folder.data.id, db)).toEqual({ success: false, error: "not_found" });
      expect(await deleteMediaFolder(w.a.sellerId, w.a.a1, a2Folder.data.id, db)).toEqual({ success: false, error: "not_found" });

      // Deleting a folder moves its files to the root.
      expect((await deleteMediaFolder(w.a.sellerId, w.a.a1, a1Folder.data.id, db)).success).toBe(true);
      expect((await getMediaAsset(w.a.sellerId, w.a.a1, ids.a1, db))?.folderId).toBeNull();
    });

    it("alt text is saved per language", async () => {
      const r = await updateMediaAsset(w.a.sellerId, w.a.a1, ids.a1, { altText: { ar: "لافتة", en: "" } }, db);
      expect(r.success && r.data.altText).toEqual({ ar: "لافتة" });
    });

    it("usage counts this store's drafts only", async () => {
      await db
        .update(s.storePages)
        .set({ draftContent: { sections: [{ id: "m1", sectionId: "hero-banner", version: 1, props: { image: `https://cdn.test/${paths.a1}` } }] } })
        .where(eq(s.storePages.id, w.a.a1Home));
      expect(await countMediaUsage(w.a.sellerId, w.a.a1, [paths.a1, paths.shared], db)).toEqual({ [paths.a1]: 1, [paths.shared]: 0 });
      expect(await countMediaUsage(w.b.sellerId, w.a.a1, [paths.a1], db)).toEqual({ [paths.a1]: 0 });
    });

    it("delete removes the row only together with the Storage object", async () => {
      const failing = vi.fn(async () => {
        throw new Error("storage down");
      });
      await expect(deleteMediaAsset(w.a.sellerId, w.a.a2, ids.a2, failing, db)).rejects.toThrow("storage down");
      expect(await getMediaAsset(w.a.sellerId, w.a.a2, ids.a2, db)).not.toBeNull();

      const removed = vi.fn(async () => {});
      expect(await deleteMediaAsset(w.a.sellerId, w.a.a2, ids.a2, removed, db)).toEqual({ success: true, data: { storagePath: paths.a2 } });
      expect(removed).toHaveBeenCalledWith("store-media", paths.a2);
      expect(await getMediaAsset(w.a.sellerId, w.a.a2, ids.a2, db)).toBeNull();
    });
  });
});
