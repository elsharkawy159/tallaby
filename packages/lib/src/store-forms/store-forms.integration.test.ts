import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as s from "@workspace/db/schema";
import { createIsolationWorld, type IsolationWorld } from "../stores/isolation.fixtures";
import { archiveStore } from "../stores/server";
import {
  countNewFormSubmissions,
  createStoreForm,
  deleteFormSubmissions,
  deleteStoreForm,
  exportFormSubmissionsCsv,
  getPublicStoreForms,
  getStoreForm,
  listFormSubmissions,
  listStoreForms,
  purgeExpiredFormSubmissions,
  setSubmissionStatus,
  submitStoreForm,
  updateStoreForm,
} from "./server";
import type { FormInput } from "./store-forms.lib";

/**
 * Store forms (PLAN.md §8.4, P4-10) and tenant isolation test 10 (§17): a
 * submission on A1's host cannot target A2's or B's form, submissions are
 * visible only to the owning store, replays are stored once. Skipped without
 * TEST_DATABASE_URL.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

const contact: FormInput = {
  name: "Contact",
  fields: [
    { id: "f1", type: "text", key: "name", label: "Name", required: true },
    { id: "f2", type: "email", key: "email", label: "Email", required: true },
    { id: "f3", type: "textarea", key: "message", label: "Message" },
  ],
  settings: { submitLabel: "Send", successMessage: "Thanks!" },
};

const meta = (ipHash: string | null) => ({ ipHash, userAgent: "vitest", sourceUrl: "https://x.test/contact" });

describe.skipIf(!TEST_DATABASE_URL)("store forms (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: s });
  let w: IsolationWorld;
  const f = { a1: "", a2: "", b1: "" };

  beforeAll(async () => {
    w = await createIsolationWorld(db);
    const a1 = await createStoreForm(w.a.sellerId, w.a.a1, contact, db);
    const a2 = await createStoreForm(w.a.sellerId, w.a.a2, { ...contact, name: "A2 form" }, db);
    const b1 = await createStoreForm(w.b.sellerId, w.b.b1, { ...contact, name: "B1 form" }, db);
    if (!a1.success || !a2.success || !b1.success) throw new Error("fixture forms failed");
    f.a1 = a1.data.id;
    f.a2 = a2.data.id;
    f.b1 = b1.data.id;
  }, 60_000);

  afterAll(async () => {
    if (w) await w.cleanup(); // cascades to stores → forms → submissions
    await client.end();
  });

  it("lists and reads forms only for the owning seller and store", async () => {
    expect((await listStoreForms(w.a.sellerId, w.a.a1, db)).map((r) => r.id)).toEqual([f.a1]);
    expect(await listStoreForms(w.b.sellerId, w.a.a1, db)).toEqual([]);
    expect(await getStoreForm(w.b.sellerId, w.a.a1, f.a1, db)).toBeNull();
    // Own form id, but passed with the sibling store → nothing.
    expect(await getStoreForm(w.a.sellerId, w.a.a2, f.a1, db)).toBeNull();
    const form = await getStoreForm(w.a.sellerId, w.a.a1, f.a1, db);
    expect(form?.fields.map((x) => x.key)).toEqual(["name", "email", "message"]);
    expect(form?.key).toMatch(/^form-[0-9a-f-]+$/);
  });

  it("refuses foreign and cross-store writes and invalid definitions", async () => {
    expect(await updateStoreForm(w.b.sellerId, w.a.a1, f.a1, contact, db)).toEqual({ success: false, error: "not_found" });
    expect(await updateStoreForm(w.a.sellerId, w.a.a2, f.a1, contact, db)).toEqual({ success: false, error: "not_found" });
    expect(await deleteStoreForm(w.b.sellerId, w.a.a1, f.a1, db)).toEqual({ success: false, error: "not_found" });
    expect(await createStoreForm(w.b.sellerId, w.a.a1, contact, db)).toEqual({ success: false, error: "not_found" });
    const bad = { ...contact, fields: [{ id: "x", type: "file", key: "cv", label: "CV" }] } as unknown as FormInput;
    expect(await createStoreForm(w.a.sellerId, w.a.a1, bad, db)).toEqual({ success: false, error: "invalid_input" });
    expect(await getStoreForm(w.a.sellerId, w.a.a1, f.a1, db)).not.toBeNull();
  });

  it("resolves public forms for the host's store only", async () => {
    const forms = await getPublicStoreForms(w.a.a1, [f.a1, f.a2, f.b1], db);
    expect(Object.keys(forms)).toEqual([f.a1]);
    expect(forms[f.a1]).toMatchObject({ submitLabel: "Send", successMessage: "Thanks!" });
    expect(forms[f.a1]).not.toHaveProperty("storeId");
  });

  it("10. a submission on A1's host cannot target A2's or B's form", async () => {
    const values = { name: "Sara", email: "sara@example.com" };
    expect(await submitStoreForm(w.a.a1, f.b1, values, meta("h-x"), db)).toEqual({ success: false, error: "not_found" });
    expect(await submitStoreForm(w.a.a1, f.a2, values, meta("h-x"), db)).toEqual({ success: false, error: "not_found" });
    const [{ n } = { n: 0 }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(s.storeFormSubmissions)
      .where(inArray(s.storeFormSubmissions.formId, [f.a2, f.b1]));
    expect(n).toBe(0);
  });

  it("validates values against the form definition", async () => {
    const result = await submitStoreForm(w.a.a1, f.a1, { name: "", email: "nope", storeId: w.b.b1 }, meta("h-v"), db);
    expect(result).toEqual({ success: false, error: "invalid", fieldErrors: { name: "required", email: "invalid" } });
  });

  it("stores a valid submission with the inbox columns and only the hashed IP", async () => {
    const result = await submitStoreForm(w.a.a1, f.a1, { name: "Sara", email: "sara@example.com", message: "=1+1", extra: "x" }, meta("hash-1"), db);
    expect(result).toEqual({ success: true, duplicate: false, successMessage: "Thanks!" });
    const [row] = await db.select().from(s.storeFormSubmissions).where(eq(s.storeFormSubmissions.formId, f.a1));
    expect(row).toMatchObject({ storeId: w.a.a1, name: "Sara", email: "sara@example.com", message: "=1+1", status: "new", ipHash: "hash-1" });
    expect(row!.data).toEqual({ name: "Sara", email: "sara@example.com", message: "=1+1" });
  });

  it("stores a replayed payload once, but a new message again", async () => {
    const values = { name: "Omar", email: "omar@example.com", message: "Hi" };
    expect((await submitStoreForm(w.a.a1, f.a1, values, meta("hash-2"), db)).success).toBe(true);
    expect(await submitStoreForm(w.a.a1, f.a1, { ...values }, meta("hash-2"), db)).toMatchObject({ success: true, duplicate: true });
    expect(await submitStoreForm(w.a.a1, f.a1, { ...values, message: "Another" }, meta("hash-2"), db)).toMatchObject({ duplicate: false });
    const rows = await db.select({ id: s.storeFormSubmissions.id }).from(s.storeFormSubmissions).where(eq(s.storeFormSubmissions.ipHash, "hash-2"));
    expect(rows).toHaveLength(2);
  });

  it("refuses disabled forms and archived stores", async () => {
    await updateStoreForm(w.a.sellerId, w.a.a2, f.a2, { ...contact, name: "A2 form", status: "disabled" }, db);
    expect(await getPublicStoreForms(w.a.a2, [f.a2], db)).toEqual({});
    expect(await submitStoreForm(w.a.a2, f.a2, { name: "a", email: "a@b.co" }, meta(null), db)).toEqual({ success: false, error: "not_found" });

    await updateStoreForm(w.a.sellerId, w.a.a2, f.a2, { ...contact, name: "A2 form" }, db);
    expect((await archiveStore(w.a.sellerId, w.a.a2, db)).success).toBe(true);
    expect(await submitStoreForm(w.a.a2, f.a2, { name: "a", email: "a@b.co" }, meta(null), db)).toEqual({ success: false, error: "not_found" });
    expect(await createStoreForm(w.a.sellerId, w.a.a2, contact, db)).toEqual({ success: false, error: "store_read_only" });
    await db.update(s.stores).set({ status: "active" }).where(eq(s.stores.id, w.a.a2));
  });

  it("10. submissions are visible and changeable only by the owning store", async () => {
    const own = await listFormSubmissions(w.a.sellerId, w.a.a1, {}, db);
    expect(own.total).toBe(3);
    expect(own.rows.every((r) => r.formId === f.a1)).toBe(true);
    expect(await listFormSubmissions(w.b.sellerId, w.a.a1, {}, db)).toEqual({ rows: [], total: 0 });
    expect((await listFormSubmissions(w.a.sellerId, w.a.a2, {}, db)).total).toBe(0);
    expect((await listFormSubmissions(w.b.sellerId, w.b.b1, { formId: f.a1 }, db)).total).toBe(0);

    const ids = own.rows.map((r) => r.id);
    // B (even on its own store) and A on the sibling store change nothing.
    expect(await setSubmissionStatus(w.b.sellerId, w.b.b1, ids, "archived", db)).toEqual({ success: true, data: { updated: 0 } });
    expect(await setSubmissionStatus(w.a.sellerId, w.a.a2, ids, "archived", db)).toEqual({ success: true, data: { updated: 0 } });
    expect(await setSubmissionStatus(w.b.sellerId, w.a.a1, ids, "archived", db)).toEqual({ success: false, error: "not_found" });
    expect(await deleteFormSubmissions(w.b.sellerId, w.b.b1, ids, db)).toEqual({ success: true, data: { deleted: 0 } });
    expect(await exportFormSubmissionsCsv(w.b.sellerId, w.a.a1, {}, undefined, db)).toBeNull();
    expect(await countNewFormSubmissions(w.b.sellerId, db)).toBe(0);
    expect(await countNewFormSubmissions(w.a.sellerId, db)).toBe(3);

    expect(await setSubmissionStatus(w.a.sellerId, w.a.a1, [ids[0]!], "read", db)).toEqual({ success: true, data: { updated: 1 } });
    expect((await listFormSubmissions(w.a.sellerId, w.a.a1, { status: "new" }, db)).total).toBe(2);
    expect((await listFormSubmissions(w.a.sellerId, w.a.a1, { status: "read", formId: f.a1 }, db)).rows.map((r) => r.id)).toEqual([ids[0]]);
  });

  it("exports CSV with formula cells neutralised", async () => {
    const csv = await exportFormSubmissionsCsv(w.a.sellerId, w.a.a1, { formId: f.a1 }, { date: "Date", form: "Form", status: "Status" }, db);
    expect(csv!.startsWith("﻿Date,Form,Status,Name,Email,Message\r\n")).toBe(true);
    expect(csv).toContain(",'=1+1");
    expect(csv).not.toMatch(/,=1\+1/);
  });

  it("deletes submissions and forms (cascade)", async () => {
    const { rows } = await listFormSubmissions(w.a.sellerId, w.a.a1, { status: "read" }, db);
    expect(await deleteFormSubmissions(w.a.sellerId, w.a.a1, rows.map((r) => r.id), db)).toEqual({ success: true, data: { deleted: 1 } });
    const extra = await createStoreForm(w.a.sellerId, w.a.a1, { ...contact, name: "Temp" }, db);
    if (!extra.success) throw new Error("create failed");
    await submitStoreForm(w.a.a1, extra.data.id, { name: "T", email: "t@t.co" }, meta(null), db);
    expect(await deleteStoreForm(w.a.sellerId, w.a.a1, extra.data.id, db)).toEqual({ success: true, data: { id: extra.data.id } });
    const left = await db.select({ id: s.storeFormSubmissions.id }).from(s.storeFormSubmissions).where(eq(s.storeFormSubmissions.formId, extra.data.id));
    expect(left).toEqual([]);
  });

  it("purges submissions older than 12 months (D28)", async () => {
    const [old] = await db
      .insert(s.storeFormSubmissions)
      .values({ storeId: w.a.a1, formId: f.a1, data: {}, createdAt: sql`now() - interval '13 months'` as unknown as string })
      .returning({ id: s.storeFormSubmissions.id });
    const before = (await listFormSubmissions(w.a.sellerId, w.a.a1, {}, db)).total;
    expect(await purgeExpiredFormSubmissions(db)).toBeGreaterThanOrEqual(1);
    expect(await db.select().from(s.storeFormSubmissions).where(eq(s.storeFormSubmissions.id, old!.id))).toEqual([]);
    expect((await listFormSubmissions(w.a.sellerId, w.a.a1, {}, db)).total).toBe(before - 1);
  });
});
