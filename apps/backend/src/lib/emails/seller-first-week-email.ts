import { createElement } from "react";
import { db, sql } from "@workspace/db";
import { SellerFirstWeekEmail, sellerFirstWeekSubject } from "@workspace/emails";
import { isStoreViewsConfigured, runGa4Report } from "@workspace/lib/analytics/ga4";
import { STORE_ID_DIMENSION } from "@workspace/lib/analytics/store-views";
import { EMAIL_TYPES } from "../email-delivery";
import { DASHBOARD_URL, joinUrl } from "./format";
import { sendOnce } from "./send-once";

const emailType = EMAIL_TYPES.sellerFirstWeek;

type Recipient = {
  seller_id: string;
  email: string;
  store_id: string;
  store_name: string;
  start_date: string;
  end_date: string;
  orders: number;
};

async function loadRecipients() {
  return db.execute<Recipient>(sql`
    WITH due AS (
      SELECT s.id AS seller_id, s.created_at, trim(au.email) AS email,
             st.id AS store_id, st.name AS store_name,
             (s.created_at AT TIME ZONE 'Africa/Cairo')::date AS start_date
      FROM sellers s
      JOIN users u ON u.id = s.id
      JOIN auth.users au ON au.id = s.id
      JOIN LATERAL (
        SELECT id, name FROM stores
        WHERE seller_id = s.id AND deleted_at IS NULL
          AND created_at < (((s.created_at AT TIME ZONE 'Africa/Cairo')::date + 7)::timestamp AT TIME ZONE 'Africa/Cairo')
        ORDER BY is_primary DESC NULLS LAST, created_at, id
        LIMIT 1
      ) st ON true
      WHERE s.created_at <= now() - interval '168 hours'
        AND s.created_at > now() - interval '240 hours'
        AND au.email_confirmed_at IS NOT NULL
        AND au.deleted_at IS NULL
        AND (au.banned_until IS NULL OR au.banned_until < now())
        AND nullif(trim(au.email), '') IS NOT NULL
        AND coalesce(s.status::text, 'pending') NOT IN ('suspended', 'restricted')
        AND NOT coalesce(u.is_suspended, false)
        AND NOT u.is_guest
        AND coalesce(u.role::text, 'seller') NOT IN ('admin', 'support', 'marketing', 'driver')
        AND s.referral_excluded_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM seller_setup_reminders sr
          WHERE sr.seller_id = s.id AND sr.kind = 'opt_out'
        )
        AND NOT EXISTS (
          SELECT 1 FROM email_deliveries ed
          WHERE ed.email_type = ${emailType} AND ed.reference_id = s.id
        )
      ORDER BY s.created_at, s.id
      LIMIT (
        SELECT greatest(0, least(5, 10 - count(*))) FROM email_deliveries
        WHERE email_type = ${emailType}
          AND created_at >= (date_trunc('day', now() AT TIME ZONE 'Africa/Cairo') AT TIME ZONE 'Africa/Cairo')
      )
    )
    SELECT d.seller_id, d.email, d.store_id, d.store_name,
           to_char(d.start_date, 'YYYY-MM-DD') AS start_date,
           to_char(d.start_date + 6, 'YYYY-MM-DD') AS end_date,
           (
             SELECT count(*)::int FROM orders o
             WHERE o.store_id = d.store_id AND NOT o.is_test
               AND o.status IS DISTINCT FROM 'payment_processing'
               AND o.created_at >= d.created_at
               AND o.created_at < ((d.start_date + 7)::timestamp AT TIME ZONE 'Africa/Cairo')
           ) AS orders
    FROM due d
  `);
}

async function getVisits(recipient: Recipient): Promise<number | null> {
  if (!isStoreViewsConfigured()) return null;

  try {
    const report = await runGa4Report({
      dateRanges: [{ startDate: recipient.start_date, endDate: recipient.end_date }],
      metrics: [{ name: "sessions" }],
      dimensionFilter: {
        filter: {
          fieldName: STORE_ID_DIMENSION,
          stringFilter: { matchType: "EXACT", value: recipient.store_id, caseSensitive: true },
        },
      },
    }, AbortSignal.timeout(12_000)) as { rowCount?: number; rows?: { metricValues?: { value?: string }[] }[] };
    if (!report.rows?.length) return !report.rowCount ? 0 : null;
    const raw = report.rows[0]?.metricValues?.[0]?.value;
    return raw && /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Number(raw) : null;
  } catch {
    console.warn("[email] first-week visit data unavailable");
    return null;
  }
}

/** One bounded batch for the scheduled job. The delivery claim is per seller. */
export async function sendSellerFirstWeekEmails() {
  const recipients = await loadRecipients();
  const results = await Promise.allSettled(recipients.map(async (recipient) => {
    const visits = await getVisits(recipient);
    return sendOnce({
      emailType,
      referenceId: recipient.seller_id,
      recipient: recipient.email,
      subject: sellerFirstWeekSubject(),
      content: createElement(SellerFirstWeekEmail, {
        storeName: recipient.store_name,
        analyticsUrl: joinUrl(DASHBOARD_URL, `/stores/${recipient.store_id}/analytics`),
        visits,
        orders: recipient.orders,
      }),
      metadata: { storeId: recipient.store_id },
    });
  }));
  const sent = results.filter((result) => result.status === "fulfilled" && result.value.status === "sent").length;
  const failed = results.filter((result) => result.status === "rejected").length;
  return { sent, failed, skipped: results.length - sent - failed };
}
