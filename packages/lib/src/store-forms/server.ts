/**
 * Server-only data access for store forms and their submissions (PLAN.md
 * §8.4, §11.6, P4-10).
 *
 * Seller-side functions take the session's sellerId (never a client value)
 * and an explicit storeId; the store must belong to the seller and every child
 * query also filters by store_id. Missing, deleted and foreign stores, forms
 * and submissions all come back as `not_found` / empty. The public functions
 * (`getPublicStoreForms`, `submitStoreForm`) take the storeId the storefront
 * resolved from the request host. Functions accept an optional Drizzle handle
 * (`q`) for tests and transactions.
 */
import { randomUUID } from "node:crypto";
import { and, count, db, desc, eq, gt, inArray, isNull, sql, storeFormSubmissions, storeForms, stores, users } from "@workspace/db";
import {
  FORM_LIMITS,
  FORM_SUBMISSION_RETENTION_MONTHS,
  formInputSchema,
  parseStoredFields,
  parseStoredSettings,
  submissionColumns,
  submissionFingerprint,
  toCsv,
  validateFormSubmission,
  type FieldError,
  type FormField,
  type FormInput,
  type FormSettings,
  type FormStatus,
  type SubmissionStatus,
} from "./store-forms.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (value: unknown): value is string => typeof value === "string" && UUID_RE.test(value);

export type FormResult<T, E extends string> = { success: true; data: T } | { success: false; error: E };
export type FormWriteError = "not_found" | "store_read_only" | "invalid_input" | "limit_reached";

export type StoreFormSummary = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: FormStatus;
  fieldCount: number;
  submissionCount: number;
  newCount: number;
  lastSubmissionAt: string | null;
  updatedAt: string;
};

export type StoreFormDefinition = {
  id: string;
  storeId: string;
  key: string;
  name: string;
  description: string | null;
  status: FormStatus;
  fields: FormField[];
  settings: FormSettings;
  updatedAt: string;
};

/** What a storefront needs to draw a form: no store-internal data. */
export type PublicStoreForm = {
  id: string;
  fields: FormField[];
  submitLabel: string;
  successMessage: string;
};

const ownStore = (sellerId: string, storeId: string) =>
  and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt));

async function loadOwnStore(q: Queryable, sellerId: string, storeId: string) {
  if (!isUuid(storeId)) return null;
  const [row] = await q.select({ id: stores.id, status: stores.status }).from(stores).where(ownStore(sellerId, storeId)).limit(1);
  return row ?? null;
}

function toDefinition(row: typeof storeForms.$inferSelect): StoreFormDefinition {
  return {
    id: row.id,
    storeId: row.storeId,
    key: row.key,
    name: row.name,
    description: row.description,
    status: row.status === "disabled" ? "disabled" : "active",
    fields: parseStoredFields(row.fields),
    settings: parseStoredSettings(row.settings),
    updatedAt: row.updatedAt,
  };
}

class FormsError<E extends string> extends Error {
  constructor(readonly code: E) {
    super(code);
  }
}

// ---------------------------------------------------------------------------
// Forms (seller)
// ---------------------------------------------------------------------------

/** The store's forms with submission counts, newest change first. Empty for a foreign store. */
export async function listStoreForms(sellerId: string, storeId: string, q: Queryable = db): Promise<StoreFormSummary[]> {
  if (!(await loadOwnStore(q, sellerId, storeId))) return [];
  const rows = await q
    .select({
      id: storeForms.id,
      key: storeForms.key,
      name: storeForms.name,
      description: storeForms.description,
      status: storeForms.status,
      updatedAt: storeForms.updatedAt,
      fieldCount: sql<number>`coalesce(jsonb_array_length(${storeForms.fields}), 0)::int`,
      submissionCount: sql<number>`(SELECT count(*)::int FROM ${storeFormSubmissions} s WHERE s.form_id = ${storeForms.id} AND s.store_id = ${storeForms.storeId})`,
      newCount: sql<number>`(SELECT count(*)::int FROM ${storeFormSubmissions} s WHERE s.form_id = ${storeForms.id} AND s.store_id = ${storeForms.storeId} AND s.status = 'new')`,
      lastSubmissionAt: sql<string | null>`(SELECT max(s.created_at)::text FROM ${storeFormSubmissions} s WHERE s.form_id = ${storeForms.id} AND s.store_id = ${storeForms.storeId})`,
    })
    .from(storeForms)
    .where(eq(storeForms.storeId, storeId))
    .orderBy(desc(storeForms.updatedAt));
  return rows.map((r) => ({
    ...r,
    status: r.status === "disabled" ? "disabled" : "active",
    fieldCount: Number(r.fieldCount ?? 0),
    submissionCount: Number(r.submissionCount ?? 0),
    newCount: Number(r.newCount ?? 0),
  }));
}

export async function getStoreForm(
  sellerId: string,
  storeId: string,
  formId: string,
  q: Queryable = db,
): Promise<StoreFormDefinition | null> {
  if (!isUuid(formId) || !(await loadOwnStore(q, sellerId, storeId))) return null;
  const [row] = await q
    .select()
    .from(storeForms)
    .where(and(eq(storeForms.id, formId), eq(storeForms.storeId, storeId)))
    .limit(1);
  return row ? toDefinition(row) : null;
}

/** Every form of the store, full definitions (the editor's form picker and canvas preview). */
export async function listStoreFormDefinitions(sellerId: string, storeId: string, q: Queryable = db): Promise<StoreFormDefinition[]> {
  if (!(await loadOwnStore(q, sellerId, storeId))) return [];
  const rows = await q.select().from(storeForms).where(eq(storeForms.storeId, storeId)).orderBy(desc(storeForms.updatedAt));
  return rows.map(toDefinition);
}

async function writableStore(tx: Tx, sellerId: string, storeId: string) {
  if (!isUuid(storeId)) throw new FormsError("not_found");
  const [store] = await tx.select({ status: stores.status }).from(stores).where(ownStore(sellerId, storeId)).for("update");
  if (!store) throw new FormsError("not_found");
  if (store.status !== "active") throw new FormsError("store_read_only");
}

async function runWrite<T>(q: Queryable, fn: (tx: Tx) => Promise<T>): Promise<FormResult<T, FormWriteError>> {
  try {
    return { success: true, data: await q.transaction(fn) };
  } catch (error) {
    if (error instanceof FormsError) return { success: false, error: error.code as FormWriteError };
    throw error;
  }
}

export async function createStoreForm(
  sellerId: string,
  storeId: string,
  input: FormInput,
  q: Queryable = db,
): Promise<FormResult<{ id: string }, FormWriteError>> {
  const parsed = formInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const value = parsed.data;
  return runWrite(q, async (tx) => {
    await writableStore(tx, sellerId, storeId);
    const [{ total } = { total: 0 }] = await tx.select({ total: count() }).from(storeForms).where(eq(storeForms.storeId, storeId));
    if (Number(total) >= FORM_LIMITS.maxForms) throw new FormsError("limit_reached");
    const [row] = await tx
      .insert(storeForms)
      .values({
        storeId,
        // Stable, store-unique id for sections; never shown to visitors.
        key: `form-${randomUUID().slice(0, 12)}`,
        name: value.name,
        description: value.description || null,
        fields: value.fields,
        settings: value.settings,
        status: value.status,
      })
      .returning({ id: storeForms.id });
    return { id: row!.id };
  });
}

export async function updateStoreForm(
  sellerId: string,
  storeId: string,
  formId: string,
  input: FormInput,
  q: Queryable = db,
): Promise<FormResult<{ id: string }, FormWriteError>> {
  const parsed = formInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  if (!isUuid(formId)) return { success: false, error: "not_found" };
  const value = parsed.data;
  return runWrite(q, async (tx) => {
    await writableStore(tx, sellerId, storeId);
    const updated = await tx
      .update(storeForms)
      .set({
        name: value.name,
        description: value.description || null,
        fields: value.fields,
        settings: value.settings,
        status: value.status,
        updatedAt: sql`now()`,
      })
      .where(and(eq(storeForms.id, formId), eq(storeForms.storeId, storeId)))
      .returning({ id: storeForms.id });
    if (!updated.length) throw new FormsError("not_found");
    return { id: formId };
  });
}

/** Deletes a form and (cascade) its submissions. */
export async function deleteStoreForm(
  sellerId: string,
  storeId: string,
  formId: string,
  q: Queryable = db,
): Promise<FormResult<{ id: string }, FormWriteError>> {
  if (!isUuid(formId)) return { success: false, error: "not_found" };
  return runWrite(q, async (tx) => {
    await writableStore(tx, sellerId, storeId);
    const deleted = await tx
      .delete(storeForms)
      .where(and(eq(storeForms.id, formId), eq(storeForms.storeId, storeId)))
      .returning({ id: storeForms.id });
    if (!deleted.length) throw new FormsError("not_found");
    return { id: formId };
  });
}

// ---------------------------------------------------------------------------
// Submissions (seller inbox)
// ---------------------------------------------------------------------------

export type SubmissionFilter = {
  formId?: string | null;
  status?: SubmissionStatus | "all" | null;
  limit?: number;
  offset?: number;
};

export type StoreFormSubmission = {
  id: string;
  formId: string;
  formName: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  data: Record<string, string>;
  status: SubmissionStatus;
  sourceUrl: string | null;
  createdAt: string;
};

function submissionWhere(storeId: string, filter: SubmissionFilter) {
  return and(
    eq(storeFormSubmissions.storeId, storeId),
    isUuid(filter.formId) ? eq(storeFormSubmissions.formId, filter.formId) : undefined,
    filter.status && filter.status !== "all" ? eq(storeFormSubmissions.status, filter.status) : undefined,
  );
}

function asData(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.fromEntries(Object.entries(raw as Record<string, unknown>).filter(([, v]) => typeof v === "string")) as Record<string, string>;
}

/** The store's submissions, newest first, with the total for paging. Empty for a foreign store. */
export async function listFormSubmissions(
  sellerId: string,
  storeId: string,
  filter: SubmissionFilter = {},
  q: Queryable = db,
): Promise<{ rows: StoreFormSubmission[]; total: number }> {
  if (!(await loadOwnStore(q, sellerId, storeId))) return { rows: [], total: 0 };
  const where = submissionWhere(storeId, filter);
  const limit = Math.min(Math.max(filter.limit ?? 50, 1), 200);
  const offset = Math.max(filter.offset ?? 0, 0);
  const [rows, [{ total } = { total: 0 }]] = await Promise.all([
    q
      .select({
        id: storeFormSubmissions.id,
        formId: storeFormSubmissions.formId,
        formName: storeForms.name,
        name: storeFormSubmissions.name,
        email: storeFormSubmissions.email,
        phone: storeFormSubmissions.phone,
        message: storeFormSubmissions.message,
        data: storeFormSubmissions.data,
        status: storeFormSubmissions.status,
        sourceUrl: storeFormSubmissions.sourceUrl,
        createdAt: storeFormSubmissions.createdAt,
      })
      .from(storeFormSubmissions)
      .innerJoin(storeForms, and(eq(storeForms.id, storeFormSubmissions.formId), eq(storeForms.storeId, storeId)))
      .where(where)
      .orderBy(desc(storeFormSubmissions.createdAt))
      .limit(limit)
      .offset(offset),
    q.select({ total: count() }).from(storeFormSubmissions).where(where),
  ]);
  return {
    rows: rows.map((r) => ({ ...r, data: asData(r.data), status: r.status as SubmissionStatus })),
    total: Number(total),
  };
}

const SUBMISSION_IDS_MAX = 200;

/** Sets the status of some of the store's submissions; ids of other stores are ignored. Returns the rows changed. */
export async function setSubmissionStatus(
  sellerId: string,
  storeId: string,
  submissionIds: readonly string[],
  status: SubmissionStatus,
  q: Queryable = db,
): Promise<FormResult<{ updated: number }, "not_found" | "invalid_input">> {
  const ids = [...new Set(submissionIds)].filter(isUuid);
  if (!ids.length || ids.length > SUBMISSION_IDS_MAX || !["new", "read", "archived", "spam"].includes(status)) {
    return { success: false, error: "invalid_input" };
  }
  if (!(await loadOwnStore(q, sellerId, storeId))) return { success: false, error: "not_found" };
  const updated = await q
    .update(storeFormSubmissions)
    .set({ status, updatedAt: sql`now()` })
    .where(and(eq(storeFormSubmissions.storeId, storeId), inArray(storeFormSubmissions.id, ids)))
    .returning({ id: storeFormSubmissions.id });
  return { success: true, data: { updated: updated.length } };
}

/** Deletes some of the store's submissions (the owner can erase PII before the retention period). */
export async function deleteFormSubmissions(
  sellerId: string,
  storeId: string,
  submissionIds: readonly string[],
  q: Queryable = db,
): Promise<FormResult<{ deleted: number }, "not_found" | "invalid_input">> {
  const ids = [...new Set(submissionIds)].filter(isUuid);
  if (!ids.length || ids.length > SUBMISSION_IDS_MAX) return { success: false, error: "invalid_input" };
  if (!(await loadOwnStore(q, sellerId, storeId))) return { success: false, error: "not_found" };
  const deleted = await q
    .delete(storeFormSubmissions)
    .where(and(eq(storeFormSubmissions.storeId, storeId), inArray(storeFormSubmissions.id, ids)))
    .returning({ id: storeFormSubmissions.id });
  return { success: true, data: { deleted: deleted.length } };
}

const EXPORT_MAX_ROWS = 10_000;

/**
 * CSV of the store's submissions (optionally one form / status). Columns:
 * date, form, status, then every field of the included forms by label. Cells
 * are escaped against CSV/formula injection. Null for a foreign store.
 */
export async function exportFormSubmissionsCsv(
  sellerId: string,
  storeId: string,
  filter: Omit<SubmissionFilter, "limit" | "offset"> = {},
  labels: { date: string; form: string; status: string } = { date: "Date", form: "Form", status: "Status" },
  q: Queryable = db,
): Promise<string | null> {
  if (!(await loadOwnStore(q, sellerId, storeId))) return null;
  const [forms, rows] = await Promise.all([
    q
      .select({ id: storeForms.id, fields: storeForms.fields })
      .from(storeForms)
      .where(and(eq(storeForms.storeId, storeId), isUuid(filter.formId) ? eq(storeForms.id, filter.formId) : undefined)),
    q
      .select({
        formId: storeFormSubmissions.formId,
        formName: storeForms.name,
        data: storeFormSubmissions.data,
        status: storeFormSubmissions.status,
        createdAt: storeFormSubmissions.createdAt,
      })
      .from(storeFormSubmissions)
      .innerJoin(storeForms, and(eq(storeForms.id, storeFormSubmissions.formId), eq(storeForms.storeId, storeId)))
      .where(submissionWhere(storeId, filter))
      .orderBy(desc(storeFormSubmissions.createdAt))
      .limit(EXPORT_MAX_ROWS),
  ]);

  const columns: { key: string; label: string }[] = [];
  for (const form of forms) {
    for (const field of parseStoredFields(form.fields)) {
      if (!columns.some((c) => c.key === field.key)) columns.push({ key: field.key, label: field.label });
    }
  }
  return toCsv(
    [labels.date, labels.form, labels.status, ...columns.map((c) => c.label)],
    rows.map((row) => {
      const data = asData(row.data);
      return [row.createdAt, row.formName, row.status, ...columns.map((c) => data[c.key] ?? "")];
    }),
  );
}

/** New (unread) submissions across all of the seller's stores, for the sidebar badge. */
export async function countNewFormSubmissions(sellerId: string, q: Queryable = db): Promise<number> {
  const [row] = await q
    .select({ total: count() })
    .from(storeFormSubmissions)
    .innerJoin(stores, eq(stores.id, storeFormSubmissions.storeId))
    .where(and(eq(stores.sellerId, sellerId), isNull(stores.deletedAt), eq(storeFormSubmissions.status, "new")));
  return Number(row?.total ?? 0);
}

// ---------------------------------------------------------------------------
// Public (storefront, store resolved from the request host)
// ---------------------------------------------------------------------------

/** Active forms of an active store among `formIds`; ids of other stores resolve to nothing. */
export async function getPublicStoreForms(
  storeId: string,
  formIds: readonly string[],
  q: Queryable = db,
): Promise<Record<string, PublicStoreForm>> {
  const ids = [...new Set(formIds)].filter(isUuid).slice(0, 20);
  if (!isUuid(storeId) || !ids.length) return {};
  const rows = await q
    .select({ id: storeForms.id, fields: storeForms.fields, settings: storeForms.settings })
    .from(storeForms)
    .innerJoin(stores, and(eq(stores.id, storeForms.storeId), isNull(stores.deletedAt), eq(stores.status, "active")))
    .where(and(eq(storeForms.storeId, storeId), eq(storeForms.status, "active"), inArray(storeForms.id, ids)));
  const out: Record<string, PublicStoreForm> = {};
  for (const row of rows) {
    const fields = parseStoredFields(row.fields);
    if (!fields.length) continue;
    const settings = parseStoredSettings(row.settings);
    out[row.id] = { id: row.id, fields, submitLabel: settings.submitLabel, successMessage: settings.successMessage };
  }
  return out;
}

export type SubmitError = "not_found" | "invalid";

export type SubmitResult =
  | { success: true; duplicate: boolean; successMessage: string }
  | { success: false; error: SubmitError; fieldErrors?: Record<string, FieldError> };

export type SubmitMeta = {
  /** Salted hash of the visitor's IP (never the raw IP), or null. */
  ipHash: string | null;
  userAgent?: string | null;
  sourceUrl?: string | null;
  userId?: string | null;
};

/** A replayed submission (same form, visitor and values) inside this window is accepted but not stored again. */
export const REPLAY_WINDOW_MINUTES = 10;

const clip = (value: string | null | undefined, max: number) => (value ? value.slice(0, max) : null);

/**
 * Stores a storefront submission. `storeId` must come from the request host,
 * never from the request body: the form has to belong to that store, be
 * active, and the store must be live. Values are validated against the
 * form's own definition.
 */
export async function submitStoreForm(
  storeId: string,
  formId: string,
  rawValues: unknown,
  meta: SubmitMeta,
  q: Queryable = db,
): Promise<SubmitResult> {
  if (!isUuid(storeId) || !isUuid(formId)) return { success: false, error: "not_found" };
  const [form] = await q
    .select({ id: storeForms.id, fields: storeForms.fields, settings: storeForms.settings })
    .from(storeForms)
    .innerJoin(stores, and(eq(stores.id, storeForms.storeId), isNull(stores.deletedAt), eq(stores.status, "active")))
    .where(and(eq(storeForms.id, formId), eq(storeForms.storeId, storeId), eq(storeForms.status, "active")))
    .limit(1);
  if (!form) return { success: false, error: "not_found" };

  const fields = parseStoredFields(form.fields);
  if (!fields.length) return { success: false, error: "not_found" };
  const checked = validateFormSubmission(fields, rawValues);
  if (!checked.ok) return { success: false, error: "invalid", fieldErrors: checked.errors };

  const settings = parseStoredSettings(form.settings);
  const values = checked.values;

  // Replay: a double click, a resent request or a script repeating the same
  // payload stores one row.
  if (meta.ipHash) {
    const recent = await q
      .select({ data: storeFormSubmissions.data })
      .from(storeFormSubmissions)
      .where(
        and(
          eq(storeFormSubmissions.storeId, storeId),
          eq(storeFormSubmissions.formId, formId),
          eq(storeFormSubmissions.ipHash, meta.ipHash),
          gt(storeFormSubmissions.createdAt, sql`now() - make_interval(mins => ${REPLAY_WINDOW_MINUTES})`),
        ),
      )
      .limit(20);
    const fingerprint = submissionFingerprint(values);
    if (recent.some((r) => submissionFingerprint(asData(r.data)) === fingerprint)) {
      return { success: true, duplicate: true, successMessage: settings.successMessage };
    }
  }

  await q.insert(storeFormSubmissions).values({
    storeId,
    formId,
    // Only a real users row (an auth user without one is stored as anonymous).
    userId: isUuid(meta.userId) ? sql`(SELECT u.id FROM ${users} u WHERE u.id = ${meta.userId})` : null,
    ...submissionColumns(fields, values),
    data: values,
    sourceUrl: clip(meta.sourceUrl, 2048),
    ipHash: clip(meta.ipHash, 128),
    userAgent: clip(meta.userAgent, 512),
  });
  return { success: true, duplicate: false, successMessage: settings.successMessage };
}

// ---------------------------------------------------------------------------
// Retention (D28)
// ---------------------------------------------------------------------------

/**
 * Deletes submissions older than the retention period (12 months, D28).
 * Run daily by the ecommerce cron `/api/cron/form-submissions-retention`.
 * Idempotent.
 */
export async function purgeExpiredFormSubmissions(q: Queryable = db): Promise<number> {
  const deleted = await q
    .delete(storeFormSubmissions)
    .where(sql`${storeFormSubmissions.createdAt} < now() - make_interval(months => ${FORM_SUBMISSION_RETENTION_MONTHS})`)
    .returning({ id: storeFormSubmissions.id });
  return deleted.length;
}
