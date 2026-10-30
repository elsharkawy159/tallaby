/**
 * Newsletter subscribers of a store (ROADMAP.md F-16d), read from the store's
 * sign-up form submissions (see subscribers.lib.ts). Server-only, never
 * cached: emails and phones are personal data, never logged.
 *
 * Every function takes the session's sellerId and an explicit storeId; the
 * store must be the seller's and not deleted (CLAUDE.md rule 5), and every
 * child query filters by store_id. A foreign store reads as empty. This is
 * not tallaby.com's own `newsletter_subscribers` table, which sellers never see.
 */
import { and, db, eq, isNull, sql, storeForms, stores } from "@workspace/db";
import { parseStoredFields } from "./store-forms.lib";
import {
  isSignUpForm,
  SUBSCRIBERS_ACTION_MAX,
  SUBSCRIBERS_EXPORT_MAX,
  SUBSCRIBERS_PAGE_SIZE,
  subscriberSearchPattern,
  subscriberStatusOf,
  type StoreSubscriber,
  type SubscriberFilter,
} from "./subscribers.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const rowsOf = (result: unknown) => [...(result as Iterable<Record<string, unknown>>)];
const str = (value: unknown) => (value == null ? null : String(value));

/** Ids of the store's sign-up forms; empty when the store is not this seller's. */
export async function listSignUpFormIds(sellerId: string, storeId: string, q: Queryable = db): Promise<string[]> {
  if (!UUID_RE.test(sellerId) || !UUID_RE.test(storeId)) return [];
  const forms = await q
    .select({ id: storeForms.id, fields: storeForms.fields })
    .from(storeForms)
    .innerJoin(stores, and(eq(stores.id, storeForms.storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
    .where(eq(storeForms.storeId, storeId));
  return forms.filter((f) => isSignUpForm(parseStoredFields(f.fields))).map((f) => f.id);
}

/**
 * One row per subscriber identity (lower-cased email, else phone) with the
 * latest sign-up's details, the count and first/last dates. Spam is left out.
 */
function subscribersCte(storeId: string, formIds: readonly string[]) {
  const ids = sql.join(
    formIds.map((id) => sql`${id}::uuid`),
    sql`, `,
  );
  return sql`
    WITH signups AS (
      SELECT s.id, s.email, s.name, s.phone, s.status, s.created_at, f.name AS form_name,
             coalesce(nullif(lower(trim(s.email)), ''), nullif(trim(s.phone), '')) AS identity
        FROM store_form_submissions s
        JOIN store_forms f ON f.id = s.form_id AND f.store_id = s.store_id
       WHERE s.store_id = ${storeId}
         AND s.form_id IN (${ids})
         AND s.status <> 'spam'
    ),
    subscribers AS (
      SELECT DISTINCT ON (identity)
             id, identity, email, name, phone, status, form_name,
             count(*) OVER (PARTITION BY identity) AS signups,
             min(created_at) OVER (PARTITION BY identity) AS first_at,
             created_at AS last_at
        FROM signups
       WHERE identity IS NOT NULL
       ORDER BY identity, created_at DESC, id DESC
    )
  `;
}

function filterWhere(filter: { status?: SubscriberFilter; query?: string | null }) {
  const status =
    filter.status === "unsubscribed"
      ? sql`status = 'archived'`
      : filter.status === "all"
        ? sql`TRUE`
        : sql`status <> 'archived'`;
  const pattern = subscriberSearchPattern(filter.query);
  const search = pattern
    ? sql`(identity LIKE ${pattern} OR lower(coalesce(name, '')) LIKE ${pattern} OR coalesce(phone, '') LIKE ${pattern})`
    : sql`TRUE`;
  return sql`${status} AND ${search}`;
}

function toSubscriber(r: Record<string, unknown>): StoreSubscriber {
  return {
    id: String(r.id),
    identity: String(r.identity),
    email: str(r.email)?.trim().toLowerCase() || null,
    name: str(r.name)?.trim() || null,
    phone: str(r.phone)?.trim() || null,
    formName: String(r.form_name ?? ""),
    status: subscriberStatusOf(String(r.status)),
    signups: Number(r.signups ?? 1),
    firstAt: String(r.first_at),
    lastAt: String(r.last_at),
  };
}

export type SubscriberPage = {
  rows: StoreSubscriber[];
  /** Rows matching the filter and search. */
  total: number;
  counts: { subscribed: number; unsubscribed: number };
  /** False when the store has no sign-up form at all. */
  hasSignUpForm: boolean;
};

const EMPTY_PAGE: SubscriberPage = { rows: [], total: 0, counts: { subscribed: 0, unsubscribed: 0 }, hasSignUpForm: false };

/** A page of the store's subscribers, newest sign-up first. */
export async function listStoreSubscribers(
  sellerId: string,
  storeId: string,
  options: { status?: SubscriberFilter; query?: string | null; page?: number; pageSize?: number } = {},
  q: Queryable = db,
): Promise<SubscriberPage> {
  const formIds = await listSignUpFormIds(sellerId, storeId, q);
  if (!formIds.length) return EMPTY_PAGE;
  const pageSize = Math.min(Math.max(options.pageSize ?? SUBSCRIBERS_PAGE_SIZE, 1), 200);
  const offset = (Math.max(options.page ?? 1, 1) - 1) * pageSize;
  const cte = subscribersCte(storeId, formIds);
  const [rows, counts] = await Promise.all([
    q.execute(sql`
      ${cte}
      SELECT id, identity, email, name, phone, status, form_name, signups,
             first_at::text AS first_at, last_at::text AS last_at,
             count(*) OVER () AS total
        FROM subscribers
       WHERE ${filterWhere(options)}
       ORDER BY last_at DESC, id DESC
       LIMIT ${pageSize} OFFSET ${offset}
    `),
    q.execute(sql`
      ${cte}
      SELECT count(*) FILTER (WHERE status <> 'archived')::int AS subscribed,
             count(*) FILTER (WHERE status = 'archived')::int AS unsubscribed
        FROM subscribers
    `),
  ]);
  const list = rowsOf(rows);
  const [c] = rowsOf(counts);
  let total = Number(list[0]?.total ?? 0);
  if (!list.length && offset > 0) {
    // Past the last page: count without paging so the pager can step back.
    const [t] = rowsOf(await q.execute(sql`${cte} SELECT count(*)::int AS total FROM subscribers WHERE ${filterWhere(options)}`));
    total = Number(t?.total ?? 0);
  }
  return {
    rows: list.map(toSubscriber),
    total,
    counts: { subscribed: Number(c?.subscribed ?? 0), unsubscribed: Number(c?.unsubscribed ?? 0) },
    hasSignUpForm: true,
  };
}

/** Every subscriber matching the filter (up to SUBSCRIBERS_EXPORT_MAX), newest first, for exports and audiences. */
export async function listAllStoreSubscribers(
  sellerId: string,
  storeId: string,
  options: { status?: SubscriberFilter; query?: string | null } = {},
  q: Queryable = db,
): Promise<StoreSubscriber[]> {
  const formIds = await listSignUpFormIds(sellerId, storeId, q);
  if (!formIds.length) return [];
  const rows = await q.execute(sql`
    ${subscribersCte(storeId, formIds)}
    SELECT id, identity, email, name, phone, status, form_name, signups,
           first_at::text AS first_at, last_at::text AS last_at
      FROM subscribers
     WHERE ${filterWhere(options)}
     ORDER BY last_at DESC, id DESC
     LIMIT ${SUBSCRIBERS_EXPORT_MAX}
  `);
  return rowsOf(rows).map(toSubscriber);
}

export type SubscriberActionResult = { success: true; count: number } | { success: false; error: "not_found" | "invalid_input" };

/**
 * The identities of the given submission ids, read only from this store's
 * sign-up forms (ids of other stores or forms match nothing).
 */
async function identitiesOf(storeId: string, formIds: readonly string[], submissionIds: readonly string[], q: Queryable) {
  const rows = rowsOf(
    await q.execute(sql`
      SELECT DISTINCT coalesce(nullif(lower(trim(s.email)), ''), nullif(trim(s.phone), '')) AS identity
        FROM store_form_submissions s
       WHERE s.store_id = ${storeId}
         AND s.form_id IN (${sql.join(formIds.map((id) => sql`${id}::uuid`), sql`, `)})
         AND s.id IN (${sql.join(submissionIds.map((id) => sql`${id}::uuid`), sql`, `)})
    `),
  );
  return rows.map((r) => str(r.identity)).filter((v): v is string => Boolean(v));
}

/** Rows of the store's sign-up forms belonging to `identities`. */
const identityRows = (storeId: string, formIds: readonly string[], identities: readonly string[]) => sql`
  store_id = ${storeId}
  AND form_id IN (${sql.join(formIds.map((id) => sql`${id}::uuid`), sql`, `)})
  AND coalesce(nullif(lower(trim(email)), ''), nullif(trim(phone), '')) IN (${sql.join(identities.map((v) => sql`${v}`), sql`, `)})
`;

function cleanIds(submissionIds: readonly unknown[]): string[] | null {
  const ids = [...new Set(submissionIds)].filter((id): id is string => typeof id === "string" && UUID_RE.test(id));
  return ids.length && ids.length <= SUBSCRIBERS_ACTION_MAX ? ids : null;
}

/**
 * Unsubscribes (or re-subscribes) the subscribers of the given rows: every
 * sign-up of the same email on this store's sign-up forms becomes `archived`
 * (or `read`). Spam rows stay spam. Returns the subscribers changed.
 */
export async function setStoreSubscribersStatus(
  sellerId: string,
  storeId: string,
  submissionIds: readonly unknown[],
  status: "subscribed" | "unsubscribed",
  q: Queryable = db,
): Promise<SubscriberActionResult> {
  const ids = cleanIds(submissionIds);
  if (!ids || (status !== "subscribed" && status !== "unsubscribed")) return { success: false, error: "invalid_input" };
  const formIds = await listSignUpFormIds(sellerId, storeId, q);
  if (!formIds.length) return { success: false, error: "not_found" };
  const identities = await identitiesOf(storeId, formIds, ids, q);
  if (!identities.length) return { success: true, count: 0 };
  await q.execute(sql`
    UPDATE store_form_submissions
       SET status = ${status === "unsubscribed" ? "archived" : "read"}, updated_at = now()
     WHERE ${identityRows(storeId, formIds, identities)}
       AND status <> 'spam'
  `);
  return { success: true, count: identities.length };
}

/** Deletes every sign-up of the given subscribers on this store's sign-up forms (erases the PII). */
export async function deleteStoreSubscribers(
  sellerId: string,
  storeId: string,
  submissionIds: readonly unknown[],
  q: Queryable = db,
): Promise<SubscriberActionResult> {
  const ids = cleanIds(submissionIds);
  if (!ids) return { success: false, error: "invalid_input" };
  const formIds = await listSignUpFormIds(sellerId, storeId, q);
  if (!formIds.length) return { success: false, error: "not_found" };
  const identities = await identitiesOf(storeId, formIds, ids, q);
  if (!identities.length) return { success: true, count: 0 };
  await q.execute(sql`DELETE FROM store_form_submissions WHERE ${identityRows(storeId, formIds, identities)}`);
  return { success: true, count: identities.length };
}
