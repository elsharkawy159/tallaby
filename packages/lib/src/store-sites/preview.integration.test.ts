import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { storeSectionRegistry } from "@workspace/store-sections/render";
import { createIsolationWorld, type IsolationWorld } from "../stores/isolation.fixtures";
import { signStorePreviewToken, verifyStorePreviewToken } from "./preview-token";
import { getStoreDraftKey, getStoreDraftSiteForPreview, getStoreForEditor, saveStorePageDraft } from "./server";

/**
 * Preview on the store host (PLAN.md P4-08) and isolation test 8 against the
 * staging copy: a token for A1 never renders A2 or B1, an edit after issuing
 * kills the token, and only the owner can get a draft key. Skipped without
 * TEST_DATABASE_URL.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const ALLOWED = storeSectionRegistry.allowedSections();
const SECRET = "integration-preview-secret-0123456789abcdef";
const hero = (title: string) => ({ sections: [{ id: "h1", sectionId: "hero-banner", version: 1, props: { title } }] });

describe.skipIf(!TEST_DATABASE_URL)("store preview (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  let w: IsolationWorld;

  beforeAll(async () => {
    w = await createIsolationWorld(db);
  }, 60_000);

  afterAll(async () => {
    await w?.cleanup();
    await client.end();
  });

  /** What the storefront does for a request on `hostStoreId` carrying `token`. */
  async function renderPreview(token: string, hostStoreId: string) {
    const verified = verifyStorePreviewToken(token, { secret: SECRET, storeId: hostStoreId });
    if (!verified.ok) return { rendered: false as const, reason: verified.reason };
    const draft = await getStoreDraftSiteForPreview(hostStoreId, verified.draftKey, { allowedSections: ALLOWED }, db);
    return draft.success ? { rendered: true as const, site: draft.site } : { rendered: false as const, reason: draft.error };
  }

  it("only the owner gets a draft key", async () => {
    expect(await getStoreDraftKey(w.a.sellerId, w.a.a1, db)).toMatch(/^[0-9a-f]{32}$/);
    expect(await getStoreDraftKey(w.b.sellerId, w.a.a1, db)).toBeNull();
    expect(await getStoreDraftKey(w.a.sellerId, w.b.b1, db)).toBeNull();
    expect(await getStoreDraftKey(w.a.sellerId, "not-a-uuid", db)).toBeNull();
  });

  it("renders A1's unpublished draft on A1's host only (isolation test 8)", async () => {
    const saved = await saveStorePageDraft(w.a.sellerId, w.a.a1, w.a.a1Home, hero("مسودة غير منشورة"), 2, { allowedSections: ALLOWED }, db);
    expect(saved.success).toBe(true);
    const key = (await getStoreDraftKey(w.a.sellerId, w.a.a1, db))!;
    const { token } = signStorePreviewToken({ storeId: w.a.a1, draftKey: key, secret: SECRET });

    const onA1 = await renderPreview(token, w.a.a1);
    expect(onA1.rendered).toBe(true);
    const home = onA1.rendered ? onA1.site.pages.find((p) => p.isHome) : undefined;
    expect(JSON.stringify(home?.content)).toContain("مسودة غير منشورة");

    expect(await renderPreview(token, w.a.a2)).toEqual({ rendered: false, reason: "wrong_store" });
    expect(await renderPreview(token, w.b.b1)).toEqual({ rendered: false, reason: "wrong_store" });
    // Even with a forged-but-unsigned key for another store, the draft key must match that store's draft.
    expect(await getStoreDraftSiteForPreview(w.a.a2, key, { allowedSections: ALLOWED }, db)).toEqual({
      success: false,
      error: "draft_changed",
    });
  });

  it("stops working once the draft changes", async () => {
    const editor = await getStoreForEditor(w.a.sellerId, w.a.a1, db);
    const home = editor!.pages.find((p) => p.isHome)!;
    const key = (await getStoreDraftKey(w.a.sellerId, w.a.a1, db))!;
    const { token } = signStorePreviewToken({ storeId: w.a.a1, draftKey: key, secret: SECRET });
    expect((await renderPreview(token, w.a.a1)).rendered).toBe(true);

    await saveStorePageDraft(w.a.sellerId, w.a.a1, home.id, hero("تعديل جديد"), home.draftVersion, { allowedSections: ALLOWED }, db);
    expect(await renderPreview(token, w.a.a1)).toEqual({ rendered: false, reason: "draft_changed" });
  });

  it("rejects expired and tampered tokens", async () => {
    const key = (await getStoreDraftKey(w.a.sellerId, w.a.a1, db))!;
    const old = signStorePreviewToken({ storeId: w.a.a1, draftKey: key, secret: SECRET, now: Date.now() - 16 * 60_000 });
    expect(await renderPreview(old.token, w.a.a1)).toEqual({ rendered: false, reason: "expired" });
    const { token } = signStorePreviewToken({ storeId: w.a.a1, draftKey: key, secret: "another-secret-another-secret-0123" });
    expect(await renderPreview(token, w.a.a1)).toEqual({ rendered: false, reason: "signature" });
  });
});
