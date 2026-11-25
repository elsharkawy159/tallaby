import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { listFailedWhatsAppMessages, retryWhatsAppMessages, updateWhatsAppAdminSettings } from "./admin.server";

/**
 * Admin › WhatsApp retry rules against the staging copy (ROADMAP.md F-109).
 * Every write is in a transaction that rolls back; the rows are `reply`
 * messages, so no seller, store or order is needed. The backend nudge is off
 * (no BACKEND_API_URL). Skipped when TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("admin whatsapp (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const adminId = randomUUID();
  const customerId = randomUUID();

  class Rollback extends Error {}
  type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
  const rolledBack = (run: (tx: Tx) => Promise<void>) =>
    db
      .transaction(async (tx) => {
        await run(tx);
        throw new Rollback();
      })
      .catch((error) => {
        if (!(error instanceof Rollback)) throw error;
      });

  const insertMessage = async (tx: Tx, status: string) => {
    const [row] = await tx
      .insert(s.whatsappMessages)
      .values({
        event: "reply",
        dedupeKey: `reply:qa-${randomUUID()}`,
        toPhone: "201012345678",
        kind: "text",
        status,
        attempts: 5,
        errorCode: status === "failed" ? 131026 : null,
        errorTitle: status === "failed" ? "Message undeliverable" : null,
        failedAt: status === "failed" ? sql`now()` : null,
      })
      .returning({ id: s.whatsappMessages.id });
    return row!.id;
  };

  const statusOf = async (tx: Tx, ids: string[]) =>
    (await tx.select({ id: s.whatsappMessages.id, status: s.whatsappMessages.status, attempts: s.whatsappMessages.attempts, errorCode: s.whatsappMessages.errorCode }).from(s.whatsappMessages).where(inArray(s.whatsappMessages.id, ids)));

  beforeAll(async () => {
    vi.stubEnv("BACKEND_API_URL", "");
    for (const id of [adminId, customerId]) {
      await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${`qa-${id.slice(0, 8)}@example.test`}, 'authenticated', 'authenticated')`);
    }
    await db.update(s.users).set({ isGuest: false, role: "admin", isVerified: true, fullName: "QA Admin" }).where(eq(s.users.id, adminId));
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    for (const id of [customerId, adminId]) await db.execute(sql`DELETE FROM auth.users WHERE id = ${id}`);
    await client.end();
  });

  it("re-queues a failed message, resets attempts, clears the error and logs it", async () => {
    await rolledBack(async (tx) => {
      const id = await insertMessage(tx, "failed");
      const result = await retryWhatsAppMessages(adminId, [id], {}, tx);
      expect(result).toMatchObject({ success: true, data: { count: 1, dispatched: false } });
      expect(await statusOf(tx, [id])).toEqual([{ id, status: "queued", attempts: 0, errorCode: null }]);
      if (!result.success) return;
      const [audit] = await tx.select().from(s.adminAuditLog).where(eq(s.adminAuditLog.id, result.data.auditId));
      expect(audit).toMatchObject({ action: "retry_whatsapp_messages", actorId: adminId, targetType: "whatsapp_messages", targetId: id });
    });
  });

  it("refuses unknown rows without confirmation, and changes nothing", async () => {
    await rolledBack(async (tx) => {
      const failed = await insertMessage(tx, "failed");
      const unknown = await insertMessage(tx, "unknown");
      expect(await retryWhatsAppMessages(adminId, [failed, unknown], {}, tx)).toEqual({ success: false, error: "unknown_needs_confirm" });
      const rows = await statusOf(tx, [failed, unknown]);
      expect(rows.map((r) => r.status).sort()).toEqual(["failed", "unknown"]);
      expect(await retryWhatsAppMessages(adminId, [failed, unknown], { confirmUnknown: true }, tx)).toMatchObject({ success: true, data: { count: 2 } });
      expect((await statusOf(tx, [failed, unknown])).every((r) => r.status === "queued")).toBe(true);
    });
  });

  it("refuses rows that are not failed or unknown, and missing ids", async () => {
    await rolledBack(async (tx) => {
      const failed = await insertMessage(tx, "failed");
      const delivered = await insertMessage(tx, "delivered");
      expect(await retryWhatsAppMessages(adminId, [failed, delivered], { confirmUnknown: true }, tx)).toEqual({ success: false, error: "not_retryable" });
      expect((await statusOf(tx, [failed]))[0]!.status).toBe("failed");
      expect(await retryWhatsAppMessages(adminId, [failed, randomUUID()], {}, tx)).toEqual({ success: false, error: "not_found" });
      expect(await retryWhatsAppMessages(adminId, [], {}, tx)).toEqual({ success: false, error: "invalid_input" });
    });
  });

  it("refuses a non-admin actor", async () => {
    await rolledBack(async (tx) => {
      const failed = await insertMessage(tx, "failed");
      expect(await retryWhatsAppMessages(customerId, [failed], {}, tx)).toEqual({ success: false, error: "not_admin" });
      await expect(listFailedWhatsAppMessages(customerId, {}, tx)).rejects.toThrow();
    });
  });

  it("lists failed messages with a masked phone", async () => {
    await rolledBack(async (tx) => {
      const id = await insertMessage(tx, "failed");
      const list = await listFailedWhatsAppMessages(adminId, { code: 131026 }, tx);
      const row = list.rows.find((r) => r.id === id);
      expect(row).toMatchObject({ status: "failed", errorCode: 131026, maskedPhone: "+20 10•••••678" });
      expect(JSON.stringify(list)).not.toContain("201012345678");
    });
  });

  it("refuses a seller price above 0 and saves free settings", async () => {
    await rolledBack(async (tx) => {
      const form = {
        enabled: false,
        storesDefaultOn: false,
        sellerPriceUsdCents: 1,
        metaRateMicros: { utility: 3700, authentication: 3600, marketing: 64400, service: 3600 },
        eventsEnabled: ["order_placed"],
      };
      expect(await updateWhatsAppAdminSettings(adminId, form, tx)).toEqual({ success: false, error: "price_needs_approval" });
      const saved = await updateWhatsAppAdminSettings(adminId, { ...form, sellerPriceUsdCents: 0 }, tx);
      expect(saved.success).toBe(true);
      const [row] = await tx.select().from(s.whatsappSettings).where(eq(s.whatsappSettings.id, 1));
      expect(row).toMatchObject({ sellerPriceUsdCents: 0, eventsEnabled: ["order_placed"], updatedBy: adminId });
    });
  });
});
