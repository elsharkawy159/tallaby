import { createElement } from "react";
import { logServerError } from "@workspace/db/log";
import { FREE_ORDER_FEE_USD_CENTS, formatEgpApprox } from "@workspace/lib/billing";
import { getBillingState } from "@workspace/lib/billing/server";
import { decideEmail } from "@workspace/lib/emails/policy";
import {
  STORE_SETUP_STEP_KEYS,
  STORE_SETUP_STEP_DONE,
  deliverSetupReminder,
  reminderStore,
  storeSetupStepHref,
  type DeliverSetupReminderResult,
  type SetupReminderKind,
} from "@workspace/lib/sellers";
import {
  claimSetupReminder,
  loadSetupReminderSellers,
  markSetupReminderFailed,
  markSetupReminderSent,
  type SetupReminderRecipient,
} from "@workspace/lib/sellers/setup-reminders/server";
import { SellerSetupReminderEmail, sellerSetupReminderSubject } from "@workspace/emails";
import { sendEmail } from "../resend";
import { DASHBOARD_URL, joinUrl } from "./format";

/** The "stop these reminders" link, on the dashboard (GET confirms, POST opts out; one-click mail clients POST). */
export function setupReminderOptOutUrl(token: string): string {
  return joinUrl(DASHBOARD_URL, `/api/email/setup-reminders/unsubscribe?token=${encodeURIComponent(token)}`);
}

async function orderFeeEgp(): Promise<string | null> {
  try {
    const { marketRate } = await getBillingState();
    return marketRate ? formatEgpApprox(FREE_ORDER_FEE_USD_CENTS, marketRate, "ar") : null;
  } catch {
    return null;
  }
}

/**
 * One store setup reminder (ROADMAP.md F-94, 0170), always in Arabic (owner,
 * 2026-11-13). The seller is re-read and the kind must be due now; the
 * `seller_setup_reminders` claim is taken before Resend is called, so retries
 * and doubled cron runs never send twice. A Resend error marks the row failed
 * for a later run.
 */
export async function sendSellerSetupReminder(sellerId: string, kind: SetupReminderKind): Promise<DeliverSetupReminderResult> {
  const decision = await decideEmail(kind === "day1" ? "seller_setup_reminder_day1" : "seller_setup_reminder_day7", null);
  if (decision.action === "skip") return { status: "skipped", reason: "paused" };

  return deliverSetupReminder<SetupReminderRecipient>(
    {
      now: () => new Date(),
      load: async (id) => (await loadSetupReminderSellers({ sellerId: id }))[0] ?? null,
      claim: (id, k) => claimSetupReminder(id, k),
      markSent: (id, k, resendId) => markSetupReminderSent(id, k, resendId),
      markFailed: async (id, k, error) => {
        logServerError("email", "setup reminder send failed", { sellerId: id, kind: k });
        await markSetupReminderFailed(id, k, error);
      },
      send: async ({ seller, kind: k, claim }) => {
        const store = reminderStore(seller.stores);
        const optOutUrl = setupReminderOptOutUrl(claim.token);
        const steps = store
          ? STORE_SETUP_STEP_KEYS.map((key) => ({
              key,
              done: STORE_SETUP_STEP_DONE[key](store.flags),
              href: joinUrl(DASHBOARD_URL, storeSetupStepHref(key, store.id, store.flags)),
            }))
          : [];
        return sendEmail({
          decision,
          to: seller.email,
          subject: sellerSetupReminderSubject(k, "ar"),
          content: createElement(SellerSetupReminderEmail, {
            kind: k,
            locale: "ar",
            sellerName: seller.name,
            storeName: store?.name || seller.name || "طلبي",
            setupUrl: joinUrl(DASHBOARD_URL, "/"),
            steps,
            optOutUrl,
            orderFeeEgp: k === "day7" ? await orderFeeEgp() : null,
          }),
          headers: {
            "List-Unsubscribe": `<${optOutUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
          idempotencyKey: `seller-setup-reminder:${k}:${seller.sellerId}:${claim.attempts}`,
        });
      },
    },
    sellerId,
    kind,
  );
}
