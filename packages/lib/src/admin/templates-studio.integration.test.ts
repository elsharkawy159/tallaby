import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { createIsolationWorld, type IsolationWorld } from "../stores/isolation.fixtures";
import { applyStoreTemplate, getStoreTemplateConfig, listStoreTemplates, undoStoreTemplate } from "../store-sites/templates.server";
import { listTemplatesForAdmin, setDefaultTemplateByAdmin, updateTemplateByAdmin } from "./templates-admin.server";
import {
  blankTemplateConfig,
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  getTemplateForStudio,
  publishTemplateVersion,
  restoreTemplateVersionToDraft,
  saveTemplateDraft,
} from "./templates-studio-admin.server";

/**
 * Admin template studio (Task 14) against the staging copy. Every case runs
 * in a transaction that is rolled back; only the test users and the isolation
 * world are real rows (removed afterwards). Skipped without TEST_DATABASE_URL.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const ROLLBACK = new Error("rollback");
const NAME = { ar: "قالب تجربة", en: "Test template" };
const REASON = "integration test";

describe.skipIf(!TEST_DATABASE_URL)("template studio (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const adminId = randomUUID();
  const moderatorId = randomUUID();
  let w: IsolationWorld;
  type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

  const inRollback = (run: (tx: Tx) => Promise<void>) =>
    expect(
      db.transaction(async (tx) => {
        await run(tx);
        throw ROLLBACK;
      }),
    ).rejects.toBe(ROLLBACK);

  const create = async (tx: Tx, key: string) => {
    const result = await createTemplate(adminId, { key, name: NAME, description: { ar: "", en: "" }, category: "fashion" }, REASON, tx as never);
    if (!result.success) throw new Error(result.error);
    return result.data;
  };

  const auditRows = (tx: Tx, key: string, action: string) =>
    tx
      .select()
      .from(s.adminAuditLog)
      .where(and(eq(s.adminAuditLog.targetType, "template"), eq(s.adminAuditLog.targetId, key), eq(s.adminAuditLog.action, action)));

  beforeAll(async () => {
    await db.insert(s.users).values([
      { id: adminId, isGuest: false, role: "admin", isVerified: true, fullName: "QA Admin" },
      { id: moderatorId, isGuest: false, role: "moderator", isVerified: true, fullName: "QA Moderator" },
    ]);
    w = await createIsolationWorld(db);
  }, 60_000);

  afterAll(async () => {
    await w?.cleanup();
    await db.delete(s.users).where(inArray(s.users.id, [adminId, moderatorId]));
    await client.end();
  });

  it("refuses a moderator on every write", async () => {
    await inRollback(async (tx) => {
      const { id } = await create(tx, "zz-t14-mod");
      const q = tx as never;
      const input = { key: "zz-t14-mod2", name: NAME, description: { ar: "", en: "" }, category: "fashion" };
      expect(await createTemplate(moderatorId, input, REASON, q)).toEqual({ success: false, error: "not_admin" });
      expect(await duplicateTemplate(moderatorId, id, "zz-t14-mod3", REASON, q)).toEqual({ success: false, error: "not_admin" });
      expect(await saveTemplateDraft(moderatorId, id, blankTemplateConfig(), 1, q)).toEqual({ success: false, error: "not_admin" });
      expect(await publishTemplateVersion(moderatorId, id, null, REASON, q)).toEqual({ success: false, error: "not_admin" });
      expect(await restoreTemplateVersionToDraft(moderatorId, id, randomUUID(), REASON, q)).toEqual({ success: false, error: "not_admin" });
      expect(await deleteTemplate(moderatorId, id, REASON, q)).toEqual({ success: false, error: "not_admin" });
    });
  });

  it("creates an inactive template with version 1 and Classic's meta, and audits it", async () => {
    await inRollback(async (tx) => {
      const { id, key } = await create(tx, "zz-t14-new");
      const studio = await getTemplateForStudio(id, tx as never);
      expect(studio).toMatchObject({ key, isActive: false, isDefault: false, hasDraft: false, version: 1 });
      expect(studio?.config?.pages).toHaveLength(1);
      expect(studio?.meta.demo.products.length).toBeGreaterThan(0);
      expect(await auditRows(tx, key, "create_template")).toHaveLength(1);
      const [audit] = await auditRows(tx, key, "create_template");
      expect(audit?.sellerId).toBeNull();
    });
  });

  it("rejects a duplicate key with template_key_taken (also a deleted one)", async () => {
    await inRollback(async (tx) => {
      const { id } = await create(tx, "zz-t14-dup");
      const input = { key: "zz-t14-dup", name: NAME, description: { ar: "", en: "" }, category: "fashion" };
      expect(await createTemplate(adminId, input, REASON, tx as never)).toEqual({ success: false, error: "template_key_taken" });
      expect(await duplicateTemplate(adminId, id, "zz-t14-dup", REASON, tx as never)).toEqual({ success: false, error: "template_key_taken" });
      expect(await deleteTemplate(adminId, id, REASON, tx as never)).toEqual({ success: true, data: null });
      expect(await createTemplate(adminId, input, REASON, tx as never)).toEqual({ success: false, error: "template_key_taken" });
    });
  });

  it("duplicates the current config and meta, inactive", async () => {
    await inRollback(async (tx) => {
      const [classic] = await tx.select().from(s.templates).where(eq(s.templates.key, "tallaby-classic"));
      const copy = await duplicateTemplate(adminId, classic!.id, "zz-t14-copy", REASON, tx as never);
      expect(copy.success).toBe(true);
      if (!copy.success) return;
      const studio = await getTemplateForStudio(copy.data.id, tx as never);
      const source = await getTemplateForStudio(classic!.id, tx as never);
      expect(studio).toMatchObject({ isActive: false, isDefault: false, version: 1 });
      expect(studio?.config?.pages.length).toBe(source?.config?.pages.length);
      expect(studio?.meta).toEqual(source?.meta);
    });
  });

  it("saves drafts optimistically: a stale clientVersion is a version_conflict", async () => {
    await inRollback(async (tx) => {
      const { id } = await create(tx, "zz-t14-draft");
      const q = tx as never;
      const config = blankTemplateConfig();
      expect(await saveTemplateDraft(adminId, id, config, 99, q)).toEqual({ success: false, error: "version_conflict" });
      const first = await saveTemplateDraft(adminId, id, config, 1, q);
      expect(first).toEqual({ success: true, data: { draftVersion: 2 } });
      expect(await saveTemplateDraft(adminId, id, config, 1, q)).toEqual({ success: false, error: "version_conflict" });
      expect(await saveTemplateDraft(adminId, id, { nope: true }, 2, q)).toEqual({ success: false, error: "invalid_config" });
      expect((await getTemplateForStudio(id, q))?.hasDraft).toBe(true);
    });
  });

  it("publishes version N+1, clears the draft and the dashboard sees the new config", async () => {
    await inRollback(async (tx) => {
      const { id, key } = await create(tx, "zz-t14-pub");
      const q = tx as never;
      expect(await publishTemplateVersion(adminId, id, null, REASON, q)).toEqual({ success: false, error: "no_change" });

      const config = blankTemplateConfig();
      config.pages[0]!.name = "Published name";
      expect((await saveTemplateDraft(adminId, id, config, 1, q)).success).toBe(true);
      const published = await publishTemplateVersion(adminId, id, "second", REASON, q);
      expect(published).toMatchObject({ success: true, data: { version: 2 } });

      const studio = await getTemplateForStudio(id, q);
      expect(studio).toMatchObject({ hasDraft: false, version: 2, isActive: false });
      const [row] = await tx.select().from(s.templates).where(eq(s.templates.id, id));
      expect(row?.draftConfig).toBeNull();
      expect(await auditRows(tx, key, "publish_template_version")).toHaveLength(1);

      // Activation is the Templates page toggle; once active, the seller dashboard reads version 2.
      const toggled = await updateTemplateByAdmin(adminId, { templateId: id, isActive: true, isPremium: false, price: null, sortOrder: 9999, reason: REASON }, q);
      expect(toggled).toEqual({ success: true });
      const seen = await getStoreTemplateConfig(w.a.sellerId, w.a.a2, key, q);
      expect(seen?.pages[0]?.name).toBe("Published name");
      const gallery = await listStoreTemplates(w.a.sellerId, w.a.a2, q);
      expect(gallery?.templates.some((t) => t.key === key)).toBe(true);

      // Restore version 1 into the draft, then publish it as version 3.
      const [v1] = await tx.select().from(s.templateVersions).where(and(eq(s.templateVersions.templateId, id), eq(s.templateVersions.version, 1)));
      expect(await restoreTemplateVersionToDraft(adminId, id, v1!.id, REASON, q)).toMatchObject({ success: true, data: { version: 1 } });
      expect(await publishTemplateVersion(adminId, id, null, REASON, q)).toMatchObject({ success: true, data: { version: 3 } });
      expect((await getStoreTemplateConfig(w.a.sellerId, w.a.a2, key, q))?.pages[0]?.name).toBe("الرئيسية");
    });
  });

  it("refuses to delete or hide the default template and leaves the row unchanged", async () => {
    await inRollback(async (tx) => {
      const q = tx as never;
      const [before] = await tx.select().from(s.templates).where(eq(s.templates.isDefault, true));
      expect(before).toBeDefined();
      expect(await deleteTemplate(adminId, before!.id, REASON, q)).toEqual({ success: false, error: "default_template" });
      const hide = await updateTemplateByAdmin(
        adminId,
        { templateId: before!.id, isActive: false, isPremium: before!.isPremium, price: before!.price, sortOrder: before!.sortOrder, reason: REASON },
        q,
      );
      expect(hide).toEqual({ success: false, error: "default_template" });
      const [after] = await tx.select().from(s.templates).where(eq(s.templates.id, before!.id));
      expect(after).toEqual(before);
    });
  });

  it("setDefault refuses deleted and inactive templates; the list hides deleted ones and shows hasDraft", async () => {
    await inRollback(async (tx) => {
      const q = tx as never;
      const { id, key } = await create(tx, "zz-t14-list");
      expect(await setDefaultTemplateByAdmin(adminId, { templateId: id, reason: REASON }, q)).toEqual({ success: false, error: "default_inactive" });
      expect((await saveTemplateDraft(adminId, id, blankTemplateConfig(), 1, q)).success).toBe(true);
      expect((await listTemplatesForAdmin(q)).find((t) => t.key === key)?.hasDraft).toBe(true);
      expect(await deleteTemplate(adminId, id, REASON, q)).toEqual({ success: true, data: null });
      expect((await listTemplatesForAdmin(q)).some((t) => t.key === key)).toBe(false);
      expect(await setDefaultTemplateByAdmin(adminId, { templateId: id, reason: REASON }, q)).toEqual({ success: false, error: "not_found" });
      expect(await getTemplateForStudio(id, q)).toBeNull();
      expect(await auditRows(tx, key, "delete_template")).toHaveLength(1);
    });
  });

  it("soft-deletes a template that has an install, and undoStoreTemplate still restores previous_draft", async () => {
    await inRollback(async (tx) => {
      const q = tx as never;
      const { id, key } = await create(tx, "zz-t14-undo");
      expect(await updateTemplateByAdmin(adminId, { templateId: id, isActive: true, isPremium: false, price: null, sortOrder: 9999, reason: REASON }, q)).toEqual({ success: true });
      const applied = await applyStoreTemplate(w.a.sellerId, w.a.a2, key, w.a.sellerId, {}, q);
      expect(applied.success).toBe(true);
      const [install] = await tx.select().from(s.templateInstalls).where(and(eq(s.templateInstalls.storeId, w.a.a2), eq(s.templateInstalls.templateId, id)));
      expect(install?.previousDraft).not.toBeNull();

      expect(await deleteTemplate(adminId, id, REASON, q)).toEqual({ success: true, data: null });
      const [row] = await tx.select().from(s.templates).where(eq(s.templates.id, id));
      expect(row?.deletedAt).not.toBeNull();
      expect(row?.isActive).toBe(false);
      expect(await tx.select().from(s.templateInstalls).where(eq(s.templateInstalls.id, install!.id))).toHaveLength(1);

      const undone = await undoStoreTemplate(w.a.sellerId, w.a.a2, q);
      expect(undone.success).toBe(true);
    });
  });
});
