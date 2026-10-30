/**
 * Retargeting audiences (ROADMAP.md F-16b): the contacts of one segment of a
 * store's own customers. Server-only, never cached; phones and emails are
 * never logged. Every read takes the session's sellerId and an explicit
 * storeId and joins `stores` on that seller (CLAUDE.md rule 5): a foreign
 * store reads as empty.
 */
import { db, sql } from "@workspace/db";
import { listStoreCustomers } from "../customers/customers.server";
import { listStoreBlockedPhones } from "../stores/blocked-phones.server";
import { listAllStoreSubscribers } from "../store-forms/subscribers.server";
import {
  AUDIENCE_MAX_ROWS,
  buildAudienceRows,
  customersInSegment,
  segmentExcludesBlocked,
  type AudienceContact,
  type AudienceRow,
  type AudienceSegment,
} from "./audiences.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const rowsOf = (result: unknown) => [...(result as Iterable<Record<string, unknown>>)];
const str = (value: unknown) => (value == null ? null : String(value));

/** Missed-order leads (F-03) still open (no order), newest first. */
async function loadLeadContacts(sellerId: string, storeId: string, q: Queryable): Promise<AudienceContact[]> {
  const rows = rowsOf(
    await q.execute(sql`
      SELECT l.full_name, l.phone, l.email, l.city
        FROM store_checkout_leads l
        JOIN stores st ON st.id = l.store_id AND st.seller_id = ${sellerId} AND st.deleted_at IS NULL
       WHERE l.store_id = ${storeId} AND l.order_id IS NULL
       ORDER BY l.updated_at DESC
       LIMIT ${AUDIENCE_MAX_ROWS}
    `),
  );
  return rows.map((r) => ({ name: str(r.full_name), phone: str(r.phone), email: str(r.email), city: str(r.city) }));
}

/**
 * The normalised rows of one segment of the seller's store, de-duplicated,
 * with blocked phones (F-02) left out of every segment but "refused".
 */
export async function loadStoreAudience(
  sellerId: string,
  storeId: string,
  segment: AudienceSegment,
  q: Queryable = db,
): Promise<AudienceRow[]> {
  if (!UUID_RE.test(sellerId) || !UUID_RE.test(storeId)) return [];

  let contacts: AudienceContact[];
  if (segment === "leads") {
    contacts = await loadLeadContacts(sellerId, storeId, q);
  } else if (segment === "subscribers") {
    const subscribers = await listAllStoreSubscribers(sellerId, storeId, { status: "subscribed" }, q);
    contacts = subscribers.map((s) => ({ name: s.name, phone: s.phone, email: s.email, city: null }));
  } else {
    const customers = await listStoreCustomers(sellerId, storeId, q);
    contacts = customersInSegment(customers, segment).map((c) => ({
      name: c.name,
      phone: c.phone,
      email: c.email,
      city: c.city ?? c.governorate,
    }));
  }

  // The blocklist query is by store only. The contacts above come from
  // seller-scoped queries, so a foreign store has none and never gets here.
  if (!contacts.length) return [];
  const blocked = segmentExcludesBlocked(segment)
    ? new Set((await listStoreBlockedPhones(storeId)).map((b) => b.phone))
    : undefined;
  return buildAudienceRows(contacts, { blockedPhones: blocked });
}
